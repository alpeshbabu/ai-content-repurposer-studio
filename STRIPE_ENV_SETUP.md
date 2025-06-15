# 🔧 Stripe Environment Setup Guide

## 🚨 **URGENT: Missing Stripe Configuration**

The payment system requires proper Stripe environment variables to function. You're currently getting "Internal Error" because the Stripe price IDs are not configured.

## 📋 **Required Environment Variables**

Create a `.env.local` file in your project root with these variables:

```env
# Stripe Configuration (Required for payments)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here" 
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Stripe Price IDs (Create in Stripe Dashboard)
STRIPE_BASIC_PRICE_ID="price_your_basic_plan_price_id"
STRIPE_PRO_PRICE_ID="price_your_pro_plan_price_id"
STRIPE_AGENCY_PRICE_ID="price_your_agency_plan_price_id"
```

## 🏗️ **Step-by-Step Setup**

### **1. Create Stripe Account**
- Sign up at [stripe.com](https://stripe.com)
- Verify your account (for production)

### **2. Get API Keys**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers → API Keys**
3. Copy your **Test** keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### **3. Create Products & Prices**
1. Go to **Products** in Stripe Dashboard
2. Click **+ Add Product**
3. Create these three products:

#### **Basic Plan**
- **Name**: Basic Plan
- **Pricing**: $6.99/month, recurring
- **Price ID**: Copy this (starts with `price_`)

#### **Pro Plan** 
- **Name**: Pro Plan
- **Pricing**: $14.99/month, recurring
- **Price ID**: Copy this (starts with `price_`)

#### **Agency Plan**
- **Name**: Agency Plan  
- **Pricing**: $29.99/month, recurring
- **Price ID**: Copy this (starts with `price_`)

### **4. Setup Webhooks**
1. Go to **Developers → Webhooks**
2. Click **+ Add endpoint**
3. **Endpoint URL**: `https://yourdomain.com/api/webhooks/stripe`
4. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### **5. Create .env.local File**

Create `.env.local` in your project root:

```bash
# Navigate to project root
cd /Users/alpeshpatel/Desktop/ai-content-repurposer-studio

# Create environment file
touch .env.local
```

Add your actual Stripe values:

```env
# Replace with your actual Stripe values
STRIPE_SECRET_KEY="sk_test_51ABC...xyz"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51ABC...xyz"
STRIPE_WEBHOOK_SECRET="whsec_1ABC...xyz"

STRIPE_BASIC_PRICE_ID="price_1ABC...basic"
STRIPE_PRO_PRICE_ID="price_1ABC...pro" 
STRIPE_AGENCY_PRICE_ID="price_1ABC...agency"
```

### **6. Restart Development Server**

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

## 🧪 **Testing**

### **Test Cards** (Use in test mode)
```
Success:        4242 4242 4242 4242
Declined:       4000 0000 0000 0002  
3D Secure:      4000 0000 0000 3220
```

### **Test Flow**
1. Go to `/dashboard/settings/subscription/checkout?plan=pro`
2. Enter test card details
3. Complete checkout
4. Verify subscription in Stripe Dashboard

## ⚠️ **Common Issues**

### **"No such price" Error**
- **Cause**: Wrong or missing price IDs
- **Fix**: Double-check price IDs in Stripe Dashboard

### **"Payment processing error"**
- **Cause**: Wrong API keys or test/live mode mismatch
- **Fix**: Ensure using test keys with test price IDs

### **"Configuration error"**
- **Cause**: Missing environment variables
- **Fix**: Check all required variables are in `.env.local`

## 🔄 **After Setup**

Once configured, the payment system will:
- ✅ Accept test payments successfully
- ✅ Create subscriptions in Stripe
- ✅ Update user plans in database
- ✅ Provide proper error messages

## 🚀 **Production Setup**

For production:
1. Use **live** API keys (start with `sk_live_` and `pk_live_`)
2. Create **live** products with **live** price IDs
3. Update webhook endpoint to production URL
4. Test with real payment methods

---

## 🆘 **Need Help?**

If you continue having issues:
1. Check Stripe Dashboard logs
2. Verify webhook endpoints are receiving events
3. Ensure price IDs exist and are active
4. Test in Stripe's test mode first

**The payment system cannot function without proper Stripe configuration.** Please complete this setup to resolve the "Internal Error" issues. 