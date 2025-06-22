import { prisma } from './prisma';
import type { BillingCycle, UsageRecord, DatabaseUser } from '../types/globals';

// Plan details configuration
export const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      monthlyLimit: 10,
      dailyLimit: 2,
      overageRate: 0
    }
  },
  starter: {
    name: 'Starter',
    price: 6.99,
    limits: {
      monthlyLimit: 50,
      dailyLimit: 10,
      overageRate: 0.10
    }
  },
  pro: {
    name: 'Pro',
    price: 14.99,
    limits: {
      monthlyLimit: 200,
      dailyLimit: 30,
      overageRate: 0.08
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 29.99,
    limits: {
      monthlyLimit: 1000,
      dailyLimit: 100,
      overageRate: 0.06
    }
  }
} as const;

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

  // Track usage for a user
  async trackUsage(userId: string, usageType: 'content_generated' | 'content_repurposed' | 'api_call', amount: number = 1): Promise<void> {
    try {
      // Implementation would track usage in database
      console.log(`Tracking ${usageType} usage for user ${userId}: ${amount}`);
      
      // Check for overage alerts
      await this.checkOverageAlerts(userId);
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  // Get current usage for a user
  async getCurrentUsage(userId: string): Promise<UsageRecord | null> {
    try {
      const currentPeriod = this.getCurrentBillingPeriod();
      const startDate = new Date(`${currentPeriod}-01`);
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
          select: { subscriptionPlan: true }
        })
      ]);

      if (!user) return null;

      const planDetails = PLAN_DETAILS[user.subscriptionPlan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
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
  async canPerformAction(userId: string, _actionType: 'content_generation' | 'content_repurpose'): Promise<{
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
        select: { subscriptionPlan: true }
      });

      if (!user) return null;

      const planDetails = PLAN_DETAILS[user.subscriptionPlan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
      const baseAmount = planDetails.price * 100; // Convert to cents
      const overage = Math.max(0, usage.totalUsage - planDetails.limits.monthlyLimit);
      const overageAmount = overage * planDetails.limits.overageRate * 100; // Convert to cents
      const totalAmount = baseAmount + overageAmount;

      // Create billing cycle record
      const billingCycle = await prisma.billingCycle.create({
        data: {
          userId,
          period: lastPeriod,
          planType: user.subscriptionPlan || 'free',
          baseAmount,
          usageAmount: usage.totalUsage * 100, // For reference
          overageAmount,
          totalAmount,
          status: 'pending'
        }
      });

      // Process payment if there are overage charges
      const subscription = await prisma.subscription.findFirst({
        where: { userId }
      });

      if (overageAmount > 0 && subscription?.stripeSubscriptionId) {
        try {
                      await this.chargeOverage(subscription.stripeSubscriptionId, overageAmount, {
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

      return billingCycle as BillingCycle;

    } catch (error) {
      console.error('Error processing monthly billing:', error);
      return null;
    }
  }

  // Get billing history
  async getBillingHistory(userId: string, limit: number = 12): Promise<BillingCycle[]> {
    try {
      const results = await prisma.billingCycle.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
      return results as BillingCycle[];
    } catch (error) {
      console.error('Error getting billing history:', error);
      return [];
    }
  }

  // Generate invoice data
  async generateInvoice(billingCycleId: string): Promise<{
    billingCycle: BillingCycle;
    usage: UsageRecord;
    user: DatabaseUser;
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
              id: true,
              name: true,
              email: true,
              role: true,
              emailVerified: true,
              image: true,
              subscriptionPlan: true,
              subscriptionStatus: true
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
            description: `${planDetails.name} Plan`,
            quantity: 1,
            rate: planDetails.price as number,
            amount: planDetails.price as number
          }
        ];

        if (billingCycle.overageAmount > 0) {
          const overageUnits = Math.ceil(billingCycle.overageAmount / 100 / planDetails.limits.overageRate);
          lineItems.push({
            description: 'Usage Overage',
            quantity: overageUnits,
            rate: planDetails.limits.overageRate as number,
            amount: billingCycle.overageAmount / 100
          });
        }

      return {
        billingCycle: billingCycle as BillingCycle,
        usage,
        user: billingCycle.user as DatabaseUser,
        lineItems
      };

    } catch (error) {
      console.error('Error generating invoice:', error);
      return null;
    }
  }

  private getCurrentBillingPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getLastBillingPeriod(): string {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  }

  private async getTodayUsage(userId: string): Promise<number> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      return await prisma.content.count({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });
    } catch (error) {
      console.error('Error getting today usage:', error);
      return 0;
    }
  }

  private async getUserUsageForPeriod(userId: string, period: string): Promise<UsageRecord | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionPlan: true }
      });

      const planDetails = PLAN_DETAILS[user?.subscriptionPlan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;

      return {
        userId,
        period,
        contentGenerated: 0,
        contentRepurposed: 0,
        apiCalls: 0,
        overageCharges: 0,
        totalUsage: 0,
        planLimits: planDetails.limits
      };

    } catch (error) {
      console.error('Error getting user usage for period:', error);
      return null;
    }
  }

  private async chargeOverage(customerId: string, amount: number, _metadata: Record<string, unknown>): Promise<void> {
    // Stripe overage charging logic would go here
    console.log(`Charging overage: ${customerId}, amount: ${amount}`);
  }

  private async checkOverageAlerts(userId: string): Promise<void> {
    // Check if user needs overage alerts
    console.log(`Checking overage alerts for user: ${userId}`);
  }

  private async sendPaymentFailureNotification(userId: string, amount: number): Promise<void> {
    // Send notification about payment failure
    console.log(`Sending payment failure notification to user ${userId} for amount ${amount}`);
  }
}

export const billingManager = BillingManager.getInstance(); 