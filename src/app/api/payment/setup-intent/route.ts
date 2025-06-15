import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get or create user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripeCustomerId: true, email: true, name: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create setup intent for future payments
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session', // For future payments
      payment_method_types: ['card'],
    });

    return NextResponse.json({
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error('[SETUP_INTENT_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 