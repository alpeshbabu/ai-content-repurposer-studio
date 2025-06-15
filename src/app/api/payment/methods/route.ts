import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// GET - List user's payment methods
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        stripeCustomerId: true,
        defaultPaymentMethodId: true,
        paymentMethods: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    // Get payment methods from Stripe
    const stripePaymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    // Sync with database
    const paymentMethods = [];
    for (const pm of stripePaymentMethods.data) {
      // Update or create in database
      const dbPaymentMethod = await prisma.paymentMethod.upsert({
        where: { stripePaymentMethodId: pm.id },
        update: {
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          expiryMonth: pm.card?.exp_month,
          expiryYear: pm.card?.exp_year,
          isDefault: pm.id === user.defaultPaymentMethodId,
          isActive: true,
        },
        create: {
          userId: user.id,
          stripePaymentMethodId: pm.id,
          type: 'card',
          brand: pm.card?.brand,
          last4: pm.card?.last4,
          expiryMonth: pm.card?.exp_month,
          expiryYear: pm.card?.exp_year,
          isDefault: pm.id === user.defaultPaymentMethodId,
          isActive: true,
        },
      });

      paymentMethods.push(dbPaymentMethod);
    }

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('[GET_PAYMENT_METHODS_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// POST - Add new payment method (after successful setup intent)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { setupIntentId, setAsDefault } = await req.json();

    if (!setupIntentId) {
      return new NextResponse('Setup intent ID required', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripeCustomerId: true }
    });

    if (!user || !user.stripeCustomerId) {
      return new NextResponse('User not found or no Stripe customer', { status: 404 });
    }

    // Retrieve the setup intent to get the payment method
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    
    if (setupIntent.status !== 'succeeded') {
      return new NextResponse('Setup intent not succeeded', { status: 400 });
    }

    const paymentMethodId = setupIntent.payment_method as string;

    // Get payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Save to database
    const dbPaymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: user.id,
        stripePaymentMethodId: paymentMethodId,
        type: 'card',
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year,
        isDefault: setAsDefault || false,
        isActive: true,
      },
    });

    // If setting as default, update user and other payment methods
    if (setAsDefault) {
      await prisma.$transaction([
        // Remove default from other payment methods
        prisma.paymentMethod.updateMany({
          where: { 
            userId: user.id,
            id: { not: dbPaymentMethod.id }
          },
          data: { isDefault: false }
        }),
        // Update user's default payment method
        prisma.user.update({
          where: { id: user.id },
          data: { defaultPaymentMethodId: paymentMethodId }
        })
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      paymentMethod: dbPaymentMethod 
    });
  } catch (error) {
    console.error('[ADD_PAYMENT_METHOD_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 