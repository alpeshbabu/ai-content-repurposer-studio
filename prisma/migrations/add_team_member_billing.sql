-- Migration: Add Team Member Billing Support
-- This migration adds tables and fields to support team member billing

-- Add billing notification table
CREATE TABLE IF NOT EXISTS "BillingNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingNotification_pkey" PRIMARY KEY ("id")
);

-- Add team member billing history table
CREATE TABLE IF NOT EXISTS "TeamMemberBilling" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billingMonth" INTEGER NOT NULL,
    "billingYear" INTEGER NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "additionalMembers" INTEGER NOT NULL,
    "chargeAmount" DOUBLE PRECISION NOT NULL,
    "stripeSubscriptionItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMemberBilling_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "BillingNotification_userId_idx" ON "BillingNotification"("userId");
CREATE INDEX IF NOT EXISTS "BillingNotification_type_idx" ON "BillingNotification"("type");
CREATE INDEX IF NOT EXISTS "BillingNotification_scheduledDate_idx" ON "BillingNotification"("scheduledDate");

CREATE INDEX IF NOT EXISTS "TeamMemberBilling_teamId_idx" ON "TeamMemberBilling"("teamId");
CREATE INDEX IF NOT EXISTS "TeamMemberBilling_userId_idx" ON "TeamMemberBilling"("userId");
CREATE INDEX IF NOT EXISTS "TeamMemberBilling_billingMonth_billingYear_idx" ON "TeamMemberBilling"("billingMonth", "billingYear");

-- Add unique constraint for team billing per month
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMemberBilling_teamId_billingMonth_billingYear_key" ON "TeamMemberBilling"("teamId", "billingMonth", "billingYear");

-- Add foreign key constraints
ALTER TABLE "BillingNotification" ADD CONSTRAINT "BillingNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamMemberBilling" ADD CONSTRAINT "TeamMemberBilling_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamMemberBilling" ADD CONSTRAINT "TeamMemberBilling_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 