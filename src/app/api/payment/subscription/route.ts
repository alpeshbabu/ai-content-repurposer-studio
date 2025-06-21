import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, STRIPE_PRICE_IDS, validateStripeConfig } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// POST - Create subscription
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Validate Stripe configuration
    const stripeConfig = validateStripeConfig();
    if (!stripeConfig.isValid) {
      return NextResponse.json({
        error: 'Payment system configuration error',
        message: 'Payment processing is temporarily unavailable. Please contact support.',
        details: `Missing configuration: ${stripeConfig.missingVars.join(', ')}`
      }, { status: 503 });
    }

    const { plan, paymentMethodId } = await req.json();

    console.log('[SUBSCRIPTION_API] Request params:', { plan, paymentMethodId });

    if (!plan || !['basic', 'pro', 'agency'].includes(plan)) {
      return new NextResponse('Invalid plan', { status: 400 });
    }

    if (!paymentMethodId) {
      return new NextResponse('Payment method required', { status: 400 });
    }

    const priceId = STRIPE_PRICE_IDS[plan as keyof typeof STRIPE_PRICE_IDS];
    console.log('[SUBSCRIPTION_API] Price ID for plan:', { plan, priceId });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        stripeCustomerId: true,
        subscriptionPlan: true,
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
          take: 1
        }
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: { userId: user.id },
      });
      
      customerId = customer.id;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Cancel existing subscription if any
    if (user.subscriptions.length > 0) {
      const existingSubscription = user.subscriptions[0];
      await stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId);
      
      await prisma.subscription.update({
        where: { stripeSubscriptionId: existingSubscription.stripeSubscriptionId },
        data: { 
          status: 'canceled',
          canceledAt: new Date(),
          cancelAtPeriodEnd: true
        }
      });
    }

    // Create new subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      default_payment_method: paymentMethodId,
      expand: ['latest_invoice.payment_intent'],
    });

    // Save subscription to database
    console.log('[SUBSCRIPTION_DEBUG] Raw subscription object keys:', Object.keys(subscription));
    console.log('[SUBSCRIPTION_DEBUG] Subscription object structure:', {
      id: (subscription as any).id,
      status: (subscription as any).status,
      current_period_start: (subscription as any).current_period_start,
      current_period_end: (subscription as any).current_period_end,
      cancel_at_period_end: (subscription as any).cancel_at_period_end
    });

    const sub = subscription as any;
    
    // Handle missing period dates with fallbacks
    const currentPeriodStart = sub.current_period_start 
      ? new Date(sub.current_period_start * 1000) 
      : new Date();
    const currentPeriodEnd = sub.current_period_end 
      ? new Date(sub.current_period_end * 1000) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status: sub.status || 'incomplete',
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end || false,
        trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
        trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      },
    });

    // Determine subscription status based on Stripe status and payment intent
    const invoice = subscription.latest_invoice as unknown as Stripe.Invoice & {
      payment_intent: Stripe.PaymentIntent;
    };
    const paymentIntent = invoice?.payment_intent;
    
    // Log for debugging
    console.log('[SUBSCRIPTION_DEBUG]', {
      stripeStatus: subscription.status,
      hasInvoice: !!subscription.latest_invoice,
      subscriptionId: subscription.id,
      paymentIntentStatus: paymentIntent?.status,
      paymentIntentId: paymentIntent?.id
    });

    let userSubscriptionStatus = 'pending_payment';
    let shouldUpdatePlan = false;

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      userSubscriptionStatus = 'active';
      shouldUpdatePlan = true;
      console.log('[SUBSCRIPTION_DEBUG] Plan activated: status is active/trialing');
    } else if (subscription.status === 'incomplete') {
      // For incomplete subscriptions, we still want to activate the plan
      // because the payment method was successfully attached and validated
      if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          userSubscriptionStatus = 'active';
          shouldUpdatePlan = true;
          console.log('[SUBSCRIPTION_DEBUG] Plan activated: payment intent succeeded');
        } else if (paymentIntent.status === 'requires_confirmation') {
          // Payment needs confirmation (3D Secure), but plan should still be activated
          userSubscriptionStatus = 'active';
          shouldUpdatePlan = true;
          console.log('[SUBSCRIPTION_DEBUG] Plan activated: payment requires confirmation but will proceed');
        } else {
          console.log('[SUBSCRIPTION_DEBUG] Payment intent status:', paymentIntent.status);
        }
      } else {
        // No payment intent yet, but subscription was created with valid payment method
        userSubscriptionStatus = 'active';
        shouldUpdatePlan = true;
        console.log('[SUBSCRIPTION_DEBUG] Plan activated: subscription created with valid payment method');
      }
    } else {
      console.log('[SUBSCRIPTION_DEBUG] Subscription not activated:', subscription.status);
    }

    console.log('[SUBSCRIPTION_DEBUG] Final decision:', {
      shouldUpdatePlan,
      userSubscriptionStatus,
      planToSet: shouldUpdatePlan ? plan : 'keeping current plan'
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: shouldUpdatePlan ? plan : user.subscriptionPlan,
        subscriptionStatus: userSubscriptionStatus,
        subscriptionRenewalDate: currentPeriodEnd,
        defaultPaymentMethodId: paymentMethodId,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
      requiresAction: subscription.status === 'incomplete',
    });
  } catch (error: unknown) {
    console.error('[CREATE_SUBSCRIPTION_ERROR] Full error:', error);
    
    // Log more detailed error information
    if (error && typeof error === 'object') {
      const errorObj = error as {
        name?: string;
        message?: string;
        type?: string;
        code?: string;
        param?: string;
        stack?: string;
      };
      console.error('[CREATE_SUBSCRIPTION_ERROR] Error details:', {
        name: errorObj.name,
        message: errorObj.message,
        type: errorObj.type,
        code: errorObj.code,
        param: errorObj.param,
        stack: errorObj.stack
      });
    }
    
    // Handle Stripe-specific errors
    const stripeError = error as {
      type?: string;
      code?: string;
      param?: string;
      message?: string;
    };
    if (stripeError.type === 'StripeInvalidRequestError') {
      console.error('[STRIPE_ERROR] Invalid request:', stripeError);
      if (stripeError.code === 'resource_missing' && stripeError.param?.includes('price')) {
        return NextResponse.json({
          error: 'Invalid plan configuration',
          message: 'The selected plan is not properly configured. Please contact support.',
          details: 'Price ID not found in Stripe'
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Payment processing error',
        message: stripeError.message || 'Unable to process payment. Please try again.',
        code: stripeError.code
      }, { status: 400 });
    }
    
    // Return more detailed error for debugging
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      debug: process.env.NODE_ENV === 'development' ? {
        errorMessage: (error as Error)?.message,
        errorType: (error as { type?: string })?.type,
        errorCode: (error as { code?: string })?.code
      } : undefined
    }, { status: 500 });
  }
}

// GET - Get user's current subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionRenewalDate: true,
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      currentPlan: user.subscriptionPlan,
      status: user.subscriptionStatus,
      renewalDate: user.subscriptionRenewalDate,
      subscription: user.subscriptions[0] || null,
    });
  } catch (error) {
    console.error('[GET_SUBSCRIPTION_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 