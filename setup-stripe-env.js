#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Stripe Environment Setup Helper\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env.local file not found');
  console.log('📝 Creating .env.local template...\n');
  
  const envTemplate = `# Stripe Configuration (REQUIRED for payments)
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Stripe Price IDs (Create these in Stripe Dashboard → Products)
# Basic Plan - $6.99/month
STRIPE_BASIC_PRICE_ID="price_your_basic_plan_price_id"
# Pro Plan - $14.99/month  
STRIPE_PRO_PRICE_ID="price_your_pro_plan_price_id"
# Agency Plan - $29.99/month
STRIPE_AGENCY_PRICE_ID="price_your_agency_plan_price_id"

# Other environment variables
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local template');
} else {
  console.log('✅ .env.local file found');
}

// Read and check current environment
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('❌ Could not read .env.local file');
  process.exit(1);
}

// Check required Stripe variables
const requiredVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 
  'STRIPE_BASIC_PRICE_ID',
  'STRIPE_PRO_PRICE_ID',
  'STRIPE_AGENCY_PRICE_ID'
];

console.log('\n🔍 Checking Stripe configuration...\n');

const missingVars = [];
const placeholderVars = [];

requiredVars.forEach(varName => {
  const regex = new RegExp(`${varName}=["']?([^"'\\n]+)["']?`);
  const match = envContent.match(regex);
  
  if (!match) {
    missingVars.push(varName);
    console.log(`❌ ${varName}: Missing`);
  } else {
    const value = match[1];
    if (value.includes('your_') || value.includes('_here') || value.includes('placeholder')) {
      placeholderVars.push(varName);
      console.log(`⚠️  ${varName}: Placeholder value detected`);
    } else {
      console.log(`✅ ${varName}: Configured`);
    }
  }
});

console.log('\n📋 Setup Status:');

if (missingVars.length === 0 && placeholderVars.length === 0) {
  console.log('✅ All Stripe variables are properly configured!');
  console.log('\n🎉 You should be able to process payments now.');
  console.log('💡 If you\'re still getting errors, verify your Stripe price IDs exist in your Stripe Dashboard.');
} else {
  console.log('❌ Stripe configuration incomplete');
  
  if (missingVars.length > 0) {
    console.log(`\n❌ Missing variables: ${missingVars.join(', ')}`);
  }
  
  if (placeholderVars.length > 0) {
    console.log(`\n⚠️  Placeholder variables: ${placeholderVars.join(', ')}`);
  }
  
  console.log('\n🚨 URGENT NEXT STEPS:');
  console.log('1. Create a Stripe account at https://stripe.com');
  console.log('2. Go to Dashboard → API Keys');
  console.log('3. Copy your Test API keys');
  console.log('4. Go to Dashboard → Products');
  console.log('5. Create three products:');
  console.log('   - Basic Plan: $6.99/month');
  console.log('   - Pro Plan: $14.99/month');
  console.log('   - Agency Plan: $29.99/month');
  console.log('6. Copy the Price IDs (starting with "price_")');
  console.log('7. Update your .env.local file with real values');
  console.log('8. Restart your development server');
  
  console.log('\n📖 For detailed instructions, see: STRIPE_ENV_SETUP.md');
}

console.log('\n🔧 Current .env.local location:', envPath);
console.log('📝 You can edit this file with your actual Stripe values');

// Test database connection if available
console.log('\n🔌 Testing database connection...');
try {
  require('dotenv').config({ path: envPath });
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connection successful');
      return prisma.$disconnect();
    })
    .catch((error) => {
      console.log('❌ Database connection failed:', error.message);
    });
} catch (error) {
  console.log('⚠️  Could not test database connection');
} 