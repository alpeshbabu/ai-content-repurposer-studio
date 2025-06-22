import { prisma } from '@/lib/prisma';
import { stripe, PLAN_DETAILS } from '@/lib/stripe';
import { analyticsTracker } from '@/lib/analytics-tracker';

export interface UsageRecord {
  userId: string;
  period: string; // YYYY-MM format
  contentGenerated: number;
  contentRepurposed: number;
  apiCalls: number;
  overageCharges: number;
  totalUsage: number;
  planLimits: {
    monthlyLimit: number;
    dailyLimit: number;
    overageRate: number;
  };
}

export interface BillingCycle {
  id: string;
  userId: string;
  period: string;
  planType: string;
  baseAmount: number;
  usageAmount: number;
  overageAmount: number;
  totalAmount: number;
  status: 'pending' | 'processed' | 'failed';
  processedAt?: Date;
  createdAt: Date;
}

export interface OverageAlert {
  userId: string;
  type: 'warning' | 'limit_reached' | 'overage';
  threshold: number;
  currentUsage: number;
  estimatedCost: number;
  message: string;
  sentAt: Date;
}

class BillingManager {
  private static instance: BillingManager;

  private constructor() {}

  public static getInstance(): BillingManager {
    if (!BillingManager.instance) {
      BillingManager.instance = new BillingManager();
    }
    return BillingManager.instance;
  }

  // Track usage for billing
  async trackUsage(userId: string, usageType: 'content_generated' | 'content_repurposed' | 'api_call', amount: number = 1): Promise<void> {
    try {
      const currentPeriod = this.getCurrentBillingPeriod();
      
      // For now, we'll track usage in the analytics system
      await analyticsTracker.trackEvent({
        userId,
        action: `usage_${usageType}`,
        resource: 'billing',
        metadata: { amount, period: currentPeriod }
      });

      // Check for overage alerts
      await this.checkOverageAlerts(userId);

    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  // Get current usage for user
  async getCurrentUsage(userId: string): Promise<UsageRecord | null> {
    try {
      const currentPeriod = this.getCurrentBillingPeriod();
      const startDate = new Date(currentPeriod + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      const [contentCount, user] = await Promise.all([
        prisma.content.count({
          where: {
            userId,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { plan: true }
        })
      ]);

      if (!user) return null;

      const planDetails = PLAN_DETAILS[user.plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
      const totalUsage = contentCount;
      const overage = Math.max(0, totalUsage - planDetails.limits.monthlyLimit);
      const overageCharges = overage * planDetails.limits.overageRate;

      return {
        userId,
        period: currentPeriod,
        contentGenerated: Math.floor(contentCount * 0.6), // Estimate
        contentRepurposed: Math.floor(contentCount * 0.4), // Estimate
        apiCalls: 0,
        overageCharges,
        totalUsage,
        planLimits: planDetails.limits
      };

    } catch (error) {
      console.error('Error getting current usage:', error);
      return null;
    }
  }

  // Check if user can perform action based on limits
  async canPerformAction(userId: string, actionType: 'content_generation' | 'content_repurpose'): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage?: number;
    limit?: number;
    willCauseOverage?: boolean;
    estimatedCost?: number;
  }> {
    try {
      const usage = await this.getCurrentUsage(userId);
      if (!usage) return { allowed: false, reason: 'Unable to check usage limits' };

      const { totalUsage, planLimits } = usage;
      const newTotalUsage = totalUsage + 1;

      // Check daily limits (if applicable)
      if (planLimits.dailyLimit > 0) {
        const todayUsage = await this.getTodayUsage(userId);
        if (todayUsage >= planLimits.dailyLimit) {
          return {
            allowed: false,
            reason: `Daily limit of ${planLimits.dailyLimit} reached`,
            currentUsage: todayUsage,
            limit: planLimits.dailyLimit
          };
        }
      }

      // Check if this will cause overage
      const willCauseOverage = newTotalUsage > planLimits.monthlyLimit;
      const estimatedCost = willCauseOverage ? 
        (newTotalUsage - planLimits.monthlyLimit) * planLimits.overageRate : 0;

      return {
        allowed: true,
        currentUsage: totalUsage,
        limit: planLimits.monthlyLimit,
        willCauseOverage,
        estimatedCost
      };

    } catch (error) {
      console.error('Error checking action limits:', error);
      return { allowed: false, reason: 'Error checking limits' };
    }
  }

  // Process monthly billing
  async processMonthlyBilling(userId: string): Promise<BillingCycle | null> {
    try {
      const lastPeriod = this.getLastBillingPeriod();
      const usage = await this.getUserUsageForPeriod(userId, lastPeriod);
      
      if (!usage) return null;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, subscription: true }
      });

      if (!user) return null;

      const planDetails = PLAN_DETAILS[user.plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
      const baseAmount = planDetails.price * 100; // Convert to cents
      const overage = Math.max(0, usage.totalUsage - planDetails.limits.monthlyLimit);
      const overageAmount = overage * planDetails.limits.overageRate * 100; // Convert to cents
      const totalAmount = baseAmount + overageAmount;

      // Create billing cycle record
      const billingCycle = await prisma.billingCycle.create({
        data: {
          userId,
          period: lastPeriod,
          planType: user.plan || 'free',
          baseAmount,
          usageAmount: usage.totalUsage * 100, // For reference
          overageAmount,
          totalAmount,
          status: 'pending'
        }
      });

      // Process payment if there are overage charges
      if (overageAmount > 0 && user.subscription?.stripeCustomerId) {
        try {
          await this.chargeOverage(user.subscription.stripeCustomerId, overageAmount, {
            period: lastPeriod,
            overage,
            rate: planDetails.limits.overageRate
          });

          await prisma.billingCycle.update({
            where: { id: billingCycle.id },
            data: {
              status: 'processed',
              processedAt: new Date()
            }
          });

        } catch (paymentError) {
          console.error('Error processing overage payment:', paymentError);
          
          await prisma.billingCycle.update({
            where: { id: billingCycle.id },
            data: { status: 'failed' }
          });

          // Send payment failure notification
          await this.sendPaymentFailureNotification(userId, overageAmount);
        }
      } else {
        // No overage charges, mark as processed
        await prisma.billingCycle.update({
          where: { id: billingCycle.id },
          data: {
            status: 'processed',
            processedAt: new Date()
          }
        });
      }

      return billingCycle;

    } catch (error) {
      console.error('Error processing monthly billing:', error);
      return null;
    }
  }

  // Get billing history
  async getBillingHistory(userId: string, limit: number = 12): Promise<BillingCycle[]> {
    try {
      return await prisma.billingCycle.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Error getting billing history:', error);
      return [];
    }
  }

  // Generate invoice data
  async generateInvoice(billingCycleId: string): Promise<{
    billingCycle: BillingCycle;
    usage: UsageRecord;
    user: any;
    lineItems: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
  } | null> {
    try {
      const billingCycle = await prisma.billingCycle.findUnique({
        where: { id: billingCycleId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              plan: true
            }
          }
        }
      });

      if (!billingCycle) return null;

      const usage = await this.getUserUsageForPeriod(billingCycle.userId, billingCycle.period);
      if (!usage) return null;

      const planDetails = PLAN_DETAILS[billingCycle.planType as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
      
      const lineItems = [
        {
          description: `${billingCycle.planType.charAt(0).toUpperCase() + billingCycle.planType.slice(1)} Plan`,
          quantity: 1,
          rate: planDetails.price,
          amount: billingCycle.baseAmount
        }
      ];

      if (billingCycle.overageAmount > 0) {
        const overage = Math.max(0, usage.totalUsage - planDetails.limits.monthlyLimit);
        lineItems.push({
          description: `Overage (${overage} units over limit)`,
          quantity: overage,
          rate: planDetails.limits.overageRate,
          amount: billingCycle.overageAmount
        });
      }

      return {
        billingCycle,
        usage,
        user: billingCycle.user,
        lineItems
      };

    } catch (error) {
      console.error('Error generating invoice:', error);
      return null;
    }
  }

  // Private helper methods
  private getCurrentBillingPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getLastBillingPeriod(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  }

  private async getTodayUsage(userId: string): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const todayUsage = await prisma.content.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    return todayUsage;
  }

  private async getUserUsageForPeriod(userId: string, period: string): Promise<UsageRecord | null> {
    const usageRecord = await prisma.usageRecord.findUnique({
      where: {
        userId_period: {
          userId,
          period
        }
      }
    });

    if (!usageRecord) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    });

    const planDetails = PLAN_DETAILS[user?.plan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
    const totalUsage = usageRecord.contentGenerated + usageRecord.contentRepurposed;
    const overage = Math.max(0, totalUsage - planDetails.limits.monthlyLimit);
    const overageCharges = overage * planDetails.limits.overageRate;

    return {
      userId,
      period,
      contentGenerated: usageRecord.contentGenerated,
      contentRepurposed: usageRecord.contentRepurposed,
      apiCalls: usageRecord.apiCalls,
      overageCharges,
      totalUsage,
      planLimits: planDetails.limits
    };
  }

  private async chargeOverage(customerId: string, amount: number, metadata: any): Promise<void> {
    await stripe.paymentIntents.create({
      customer: customerId,
      amount,
      currency: 'usd',
      description: `Overage charges for ${metadata.period}`,
      metadata: {
        type: 'overage',
        period: metadata.period,
        overage_units: metadata.overage.toString(),
        rate: metadata.rate.toString()
      },
      confirm: true,
      payment_method: 'pm_card_visa' // This should be the customer's default payment method
    });
  }

  private async checkOverageAlerts(userId: string): Promise<void> {
    const usage = await this.getCurrentUsage(userId);
    if (!usage) return;

    const { totalUsage, planLimits } = usage;
    const usagePercentage = (totalUsage / planLimits.monthlyLimit) * 100;

    // Log overage warnings
    if (usagePercentage >= 80) {
      console.log(`User ${userId} at ${usagePercentage.toFixed(1)}% of monthly limit`);
    }
  }

  private async sendPaymentFailureNotification(userId: string, amount: number): Promise<void> {
    // Implementation would send email notification
    console.log(`Payment failure notification for user ${userId}, amount: $${amount / 100}`);
  }
}

export const billingManager = BillingManager.getInstance(); 