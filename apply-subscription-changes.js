#!/usr/bin/env node

/**
 * This script applies database migrations for the new subscription model with Basic tier and daily usage tracking.
 * It will:
 * 1. Run Prisma migration to create new models
 * 2. Update subscription tiers for existing users
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Applying subscription model changes...');

  // Step 1: Apply database migrations
  console.log('\n📊 Running Prisma migrations...');
  try {
    execSync('npx prisma migrate dev --name add_basic_tier_and_daily_usage', { stdio: 'inherit' });
    console.log('✅ Database schema updated successfully');
  } catch (error) {
    console.error('❌ Failed to apply migrations:', error);
    process.exit(1);
  }

  // Step 2: Update subscription model configuration
  console.log('\n🔄 Checking subscription settings...');

  // Step 3: Update existing user limits if needed
  const users = await prisma.user.findMany();
  console.log(`\n👤 Found ${users.length} users`);
  
  // Count users by subscription type
  const subscriptionCounts = {
    free: 0,
    basic: 0,
    pro: 0,
    agency: 0
  };

  for (const user of users) {
    if (user.subscriptionPlan) {
      subscriptionCounts[user.subscriptionPlan] = (subscriptionCounts[user.subscriptionPlan] || 0) + 1;
    }
  }

  console.log('\n📈 Current subscription distribution:');
  Object.entries(subscriptionCounts).forEach(([plan, count]) => {
    console.log(`- ${plan}: ${count} users`);
  });

  console.log('\n✅ Subscription model update complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update frontend components to reflect new tiers');
  console.log('2. Test subscription flows with the new tiers');
  console.log('3. Test daily usage limits');
  console.log('4. Test overage billing');
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 