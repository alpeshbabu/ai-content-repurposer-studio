import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('Success', { status: 200 });
  } catch (error) {
    console.error(`Webhook handler failed:`, error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id);

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: subscription.customer as string },
    select: { id: true }
  });

  if (!user) {
    console.error('User not found for customer:', subscription.customer);
    return;
  }

  // Get plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);

  if (!plan) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  // Update or create subscription record
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
    create: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    }
  });

  // Update user subscription status
  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionPlan: isActive ? plan : 'free',
      subscriptionStatus: isActive ? 'active' : 'inactive',
      subscriptionRenewalDate: new Date(subscription.current_period_end * 1000),
    }
  });

  console.log(`Subscription updated for user ${user.id}: ${plan} (${subscription.status})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deletion:', subscription.id);

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: subscription.customer as string },
    select: { id: true }
  });

  if (!user) {
    console.error('User not found for customer:', subscription.customer);
    return;
  }

  // Update subscription record
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
      cancelAtPeriodEnd: true,
    }
  });

  // Downgrade user to free plan
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionPlan: 'free',
      subscriptionStatus: 'inactive',
      subscriptionRenewalDate: null,
    }
  });

  console.log(`Subscription canceled for user ${user.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing successful payment:', invoice.id);

  if (!invoice.subscription) return;

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
    select: { id: true }
  });

  if (!user) {
    console.error('User not found for customer:', invoice.customer);
    return;
  }

  // Create invoice record
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: {
      status: invoice.status || 'paid',
      paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : new Date(),
    },
    create: {
      userId: user.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: invoice.status || 'paid',
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      description: invoice.description,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : new Date(),
    }
  });

  console.log(`Payment recorded for user ${user.id}: $${invoice.amount_paid / 100}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing failed payment:', invoice.id);

  if (!invoice.subscription) return;

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: invoice.customer as string },
    select: { id: true, email: true }
  });

  if (!user) {
    console.error('User not found for customer:', invoice.customer);
    return;
  }

  // Update user status to indicate payment issues
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    }
  });

  // Create failed invoice record
  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: {
      status: 'payment_failed',
    },
    create: {
      userId: user.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'payment_failed',
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      description: invoice.description,
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    }
  });

  console.log(`Payment failed for user ${user.id}: $${invoice.amount_due / 100}`);
  
  // Here you could send an email notification about the failed payment
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  console.log('Processing trial ending:', subscription.id);

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: subscription.customer as string },
    select: { id: true, email: true }
  });

  if (!user) {
    console.error('User not found for customer:', subscription.customer);
    return;
  }

  console.log(`Trial ending for user ${user.id}`);
  
  // Here you could send an email notification about the trial ending
}

function getPlanFromPriceId(priceId: string): string | null {
  const { STRIPE_PRICE_IDS } = require('@/lib/stripe');
  
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) {
      return plan;
    }
  }
  
  return null;
} 