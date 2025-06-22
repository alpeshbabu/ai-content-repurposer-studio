import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { billingManager } from '@/lib/billing-manager';
import { rateLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await rateLimiter.checkLimit(session.user.id, 'billing_check');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      );
    }

    const { actionType } = await request.json();

    if (!actionType || !['content_generation', 'content_repurpose'].includes(actionType)) {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    const result = await billingManager.canPerformAction(session.user.id, actionType);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error checking billing limits:', error);
    return NextResponse.json(
      { error: 'Failed to check billing limits' },
      { status: 500 }
    );
  }
} 