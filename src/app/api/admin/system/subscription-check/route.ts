import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SUBSCRIPTION_LIMITS, OVERAGE_PRICING } from '@/lib/subscription';
import { validateAdminAccess } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateAdminAccess(session.user.id, 'system:read');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      subscriptionConfig: {
        monthlyLimits: SUBSCRIPTION_LIMITS,
        overagePricing: OVERAGE_PRICING
      },
      status: 'healthy'
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 