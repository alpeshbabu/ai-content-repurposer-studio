#!/usr/bin/env node

// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.log('❌ Could not load .env.local file');
  }
}

loadEnv();

async function testStripePrices() {
  console.log('🧪 Testing Stripe Price IDs...\n');
  
  // Check environment variables
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID;
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const agencyPriceId = process.env.STRIPE_AGENCY_PRICE_ID;
  
  if (!secretKey) {
    console.log('❌ STRIPE_SECRET_KEY not found in .env.local');
    return;
  }
  
  console.log('🔑 Using Stripe Secret Key:', secretKey.substring(0, 12) + '...');
  console.log('🏢 Mode:', secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE');
  console.log();
  
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(secretKey);
    
    // Test each price ID
    const priceIds = [
      { name: 'Basic Plan', id: basicPriceId, expectedAmount: 699 },
      { name: 'Pro Plan', id: proPriceId, expectedAmount: 1499 },
      { name: 'Agency Plan', id: agencyPriceId, expectedAmount: 2999 }
    ];
    
    console.log('🔍 Checking price IDs in Stripe...\n');
    
    for (const { name, id, expectedAmount } of priceIds) {
      try {
        console.log(`📋 ${name} (${id}):`);
        
        const price = await stripe.prices.retrieve(id);
        const product = await stripe.products.retrieve(price.product);
        
        console.log(`   ✅ Found: ${product.name}`);
        console.log(`   💰 Amount: $${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval || 'one-time'}`);
        console.log(`   📊 Status: ${price.active ? 'Active' : 'Inactive'}`);
        
        // Check if amount matches expected
        if (price.unit_amount === expectedAmount) {
          console.log(`   ✅ Price matches expected amount`);
        } else {
          console.log(`   ⚠️  Price mismatch: Expected $${(expectedAmount / 100).toFixed(2)}, got $${(price.unit_amount / 100).toFixed(2)}`);
        }
        
        console.log();
        
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        
        if (error.code === 'resource_missing') {
          console.log(`   💡 This price ID doesn't exist in your Stripe account`);
        }
        
        console.log();
      }
    }
    
    // List existing products for reference
    console.log('📦 Your existing Stripe products:');
    try {
      const products = await stripe.products.list({ limit: 10, active: true });
      
      if (products.data.length === 0) {
        console.log('   📭 No active products found');
      } else {
        for (const product of products.data) {
          console.log(`   • ${product.name} (${product.id})`);
          
          // Get prices for this product
          const prices = await stripe.prices.list({ product: product.id, active: true });
          for (const price of prices.data) {
            console.log(`     - $${(price.unit_amount / 100).toFixed(2)}/${price.recurring?.interval || 'one-time'} (${price.id})`);
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Could not list products: ${error.message}`);
    }
    
  } catch (error) {
    console.log('❌ Stripe connection failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('💡 Check your STRIPE_SECRET_KEY in .env.local');
    }
  }
}

testStripePrices().catch(console.error); 