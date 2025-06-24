import { NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { validateSubscriptionRequirements } from '@/lib/validate-subscription';
import { SUBSCRIPTION_LIMITS, OVERAGE_PRICING } from '@/lib/subscription';

export async function GET(req: Request) {
  try {
    // Validate admin authentication
    const { isValid, error } = await validateAdminRequest(req);
    if (!isValid) {
      return new NextResponse(error || 'Unauthorized', { status: 401 });
    }

    // Validate subscription requirements
    const validationResult = await validateSubscriptionRequirements();
    
    // Return the validation results along with current configuration
    return NextResponse.json({
      ...validationResult,
      configuration: {
        subscriptionLimits: SUBSCRIPTION_LIMITS,
        overagePricing: OVERAGE_PRICING
      }
    });
  } catch (error) {
    console.error('[SUBSCRIPTION_CHECK_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
} 