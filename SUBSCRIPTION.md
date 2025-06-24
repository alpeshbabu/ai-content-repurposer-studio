# Subscription Model & Requirements

## 1. Subscription Tiers

### A. Free Plan
- **Price:** $0/month
- **Limit:** 5 content generation or repurposes or mix of both per month.
- **Overage Pricing:** $0.12 per additional content repurpose.
- **Features:** 
  - Basic AI model
  - Twitter & Instagram templates
  - No credit card required for base usage

### B. Basic Plan
- **Price:** $6.99/month
- **Limit:** 60 content generation or repurposes or mix of both per month.
- **Overage Pricing:** $0.10 per additional content repurpose.
- **Features:** 
  - Standard AI model
  - Twitter, Instagram & Facebook templates
  - Basic customer support
  - Basic Analytics

### C. Pro Plan
- **Price:** $14.99/month
- **Limit:** 150 content generation or repurposes or mix of both per month.
- **Overage Pricing:** $0.08 per additional content repurpose.
- **Features:** 
  - Advanced AI model
  - All platforms + custom templates (Twitter, Instagram, Facebook, LinkedIn, Thread, Tiktok, YouTube, Email, Newsletter)
  - Professional customer support
  - Professional Analytics

### D. Agency Plan
- **Price:** $29.99/month
- **Limit:** 450 content generation or repurposes or mix of both per month.
- **Daily Limit:** No daily limit
- **Team Members:** Up to 3 team members included
- **Overage Pricing:** $0.06 per additional content repurpose.
- **Features:** 
  - Advanced AI model
  - Priority Support
  - All platforms + custom templates (Twitter, Instagram, Facebook, LinkedIn, Thread, Tiktok, YouTube, Email, Newsletter)
  - Professional Analytics
  - Team collaboration & analytics
- **Additional Members:** Add additional member for just $6.99/month.

### E. API Access (Developer)
- **Price:** $0.10 per repurposing request (pay-as-you-go, for API only).
- **Features:** Programmatic access, usage dashboard.

---

## 2. Technical Requirements

### A. User Subscription State
- Store subscription status and plan in the database (e.g., `User` model: `subscriptionPlan`, `subscriptionStatus`, `subscriptionRenewalDate`, etc.).
- Track usage (number of repurposing sessions per month) for each user.
- Track daily usage for plans with daily limits.
- Track overage charges for billing.

### B. Payment Integration
- Use **Stripe** for subscription management, billing, and webhooks.
- Support for monthly recurring payments.
- Handle upgrades, downgrades, cancellations, and failed payments.
- Process overage charges at the end of billing period.

### C. Usage Enforcement
- Middleware/API logic to check user's plan and usage before allowing repurposing.
- Show upgrade prompts when limits are reached.
- Enforce daily limits for applicable plans (Basic and Pro only).

### D. Team Management (Agency)
- Allow Agency users to invite/manage team members.
- Team usage is tracked per member with pooled overage pricing.

---

## 3. User Flows

### A. Upgrade Flow
1. User hits usage limit or visits "Upgrade" page.
2. User selects plan and is redirected to Stripe Checkout.
3. On successful payment, user's plan is upgraded in the database.

### B. Downgrade/Cancel Flow
1. User visits "Manage Subscription."
2. User can downgrade or cancel via Stripe Customer Portal.
3. On cancellation, user is downgraded at end of billing period.

### C. Usage Tracking
- Each time a user repurposes content, increment their usage count for the month.
- Reset usage count at the start of each month.

---

## 4. Database Schema Example

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  subscriptionPlan String  @default("free") // free, pro, agency
  subscriptionStatus String @default("inactive") // active, inactive, canceled
  subscriptionRenewalDate DateTime?
  usageThisMonth Int      @default(0)
  teamId        String?
  // ...other fields
}
```

---

## 5. Stripe Integration Requirements

- **Stripe Products & Prices:** Set up in Stripe dashboard for each plan.
- **Stripe Checkout:** For new subscriptions and upgrades.
- **Stripe Customer Portal:** For managing/canceling subscriptions.
- **Stripe Webhooks:** To update user subscription status in the database on payment events.

---

## 6. Frontend Requirements

### A. Basic Requirements
- **Upgrade/Plans Page:** Show plan options, features, and upgrade button.
- **Usage Meter:** Show current usage and limits in dashboard.
- **Upgrade Prompt:** Modal or banner when user hits free tier limit.
- **Manage Subscription:** Link to Stripe Customer Portal.

### B. Enhanced Subscription Management UI

#### 6.1 Dynamic Button States
- **Current Plan Identification:** Visually highlight the user's active subscription plan card with:
  - Different background color (e.g., blue/green accent)
  - "Current Plan" badge/label
  - Distinctive border or styling
- **Smart Button Labels:**
  - Show "Current Plan" for the active subscription
  - Show "Upgrade" for higher-tier plans
  - Show "Downgrade" for lower-tier plans
  - Disable interaction for current plan card

#### 6.2 Upgrade/Downgrade Flow
- **Upgrade Flow:**
  - Redirect to Stripe Checkout for immediate upgrade
  - Apply proration for mid-cycle upgrades
  - Show confirmation of upgrade success
- **Downgrade Flow:**
  - Show confirmation modal with downgrade implications:
    - "Your plan will change to [Plan Name] at the end of your current billing period"
    - List feature differences and limitations
    - Confirm downgrade action
  - Schedule downgrade for end of billing period (no immediate charge/refund)
  - Show pending downgrade status in UI

#### 6.3 Plan Comparison Matrix
- **Feature Comparison:** Side-by-side comparison table showing:
  - Monthly/daily limits
  - AI model access
  - Platform templates available
  - Support level
  - Team member allowance (Agency)
  - Overage pricing
- **Visual Indicators:**
  - ✅ Feature included
  - ❌ Feature not available
  - 📈 Upgrade required for feature

#### 6.4 Subscription Status Display
- **Current Plan Info:**
  - Plan name and billing amount
  - Next billing date
  - Current usage vs. limits
  - Pending changes (if any downgrades scheduled)
- **Usage Analytics:**
  - Monthly usage progress bar
  - Daily usage (for applicable plans)
  - Overage charges accrued
  - Historical usage trends

---

## 7. Backend/API Requirements

### A. Core API Endpoints
- **/api/stripe/checkout:** Create Stripe Checkout session.
- **/api/stripe/webhook:** Handle Stripe events (subscription created, updated, canceled, payment failed).
- **/api/usage:** Track and return user's usage for the month.
- **Middleware:** Protect repurposing API based on plan/usage.

### B. Enhanced Subscription Management APIs

#### 7.1 Subscription Information
- **GET /api/subscription/current:** Return user's current subscription details:
  ```json
  {
    "currentPlan": "pro",
    "status": "active",
    "renewalDate": "2024-02-15",
    "pendingDowngrade": null,
    "usage": {
      "monthly": 45,
      "limit": 150,
      "dailyUsed": 3,
      "dailyLimit": 5
    }
  }
  ```

#### 7.2 Plan Management
- **POST /api/subscription/upgrade:** Handle immediate upgrades via Stripe Checkout
- **POST /api/subscription/downgrade:** Schedule downgrade for end of billing period:
  ```json
  {
    "targetPlan": "basic",
    "effectiveDate": "2024-02-15",
    "confirmFeatureLoss": true
  }
  ```
- **DELETE /api/subscription/pending-downgrade:** Cancel a scheduled downgrade

#### 7.3 Plan Comparison Data
- **GET /api/plans/compare:** Return plan feature matrix for UI comparison
- **GET /api/plans/eligibility:** Return which plans user can upgrade/downgrade to

### C. Database Schema Enhancements

```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  name                  String?
  subscriptionPlan      String    @default("free")
  subscriptionStatus    String    @default("inactive")
  subscriptionRenewalDate DateTime?
  pendingDowngradePlan  String?   // Plan to downgrade to at renewal
  pendingDowngradeDate  DateTime? // When downgrade takes effect
  usageThisMonth       Int       @default(0)
  dailyUsageCount      Int       @default(0)
  dailyUsageDate       DateTime? // Track which day the usage is for
  teamId               String?
  // ...other fields
}

model SubscriptionChange {
  id              String   @id @default(cuid())
  userId          String
  fromPlan        String
  toPlan          String
  changeType      String   // "upgrade", "downgrade", "cancel"
  scheduledDate   DateTime // When change takes effect
  processedDate   DateTime?
  status          String   // "pending", "processed", "canceled"
  stripeEventId   String?
  createdAt       DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}
```

---

## 8. Example Usage Enforcement (Pseudocode)

```ts
// In repurpose API route
const user = await getUserFromSession();
if (user.subscriptionPlan === 'free' && user.usageThisMonth >= 5) {
  return new Response('Upgrade required', { status: 402 });
}
// ...proceed with repurposing and increment usage
```

---

## 9. Email Notifications (Optional)
- Notify users when they are close to or have reached their usage limit.
- Notify on successful payment, failed payment, or plan changes.

---

## 10. Admin/Reporting (Optional)
- Admin dashboard to view subscriptions, revenue, and usage stats.

---

## 11. Security & Compliance
- Ensure PCI compliance by using Stripe-hosted checkout.
- Secure all endpoints and webhooks.

---

---

## 12. Enhanced Subscription Management - Business Logic

### A. Plan Hierarchy & Button Logic
```
Free → Basic → Pro → Agency
```

#### Button State Logic:
- **Current Plan:** "Current Plan" (disabled, highlighted)
- **Higher Tier:** "Upgrade" (enabled, immediate effect)
- **Lower Tier:** "Downgrade" (enabled, scheduled for renewal)

### B. Downgrade Business Rules
1. **Immediate Effect vs Scheduled:**
   - Upgrades: Take effect immediately with proration
   - Downgrades: Scheduled for end of current billing period (no partial refund)

2. **Feature Access During Downgrade Period:**
   - User retains current plan features until renewal date
   - Show "Downgrade Scheduled" status in UI
   - Allow cancellation of pending downgrade

3. **Usage Limits on Downgrade:**
   - If current usage exceeds target plan limits, show warning
   - Reset usage counter at renewal when downgrade takes effect
   - Calculate overage charges based on new plan rates

### C. Edge Cases & Validation
- **Prevent Invalid Downgrades:** Block downgrade if current month usage exceeds target plan limit
- **Team Member Limits:** For Agency downgrades, ensure team size doesn't exceed new limit
- **Payment Method:** Ensure valid payment method exists for future charges

---

## 13. Implementation Priority & Next Steps

### Phase 1: Core Functionality (High Priority)
1. **Database Schema Updates:**
   - Add `pendingDowngradePlan` and `pendingDowngradeDate` to User model
   - Create `SubscriptionChange` audit table
   - Migrate existing data

2. **API Development:**
   - Implement `/api/subscription/current` endpoint
   - Create `/api/subscription/downgrade` endpoint
   - Update Stripe webhook handlers for scheduled changes

3. **UI Components:**
   - Enhance subscription cards with dynamic states
   - Add current plan highlighting
   - Implement upgrade/downgrade button logic

### Phase 2: Enhanced UX (Medium Priority)
4. **Advanced UI Features:**
   - Build downgrade confirmation modal
   - Create plan comparison matrix
   - Add usage analytics dashboard
   - Implement pending change notifications

5. **Business Logic:**
   - Add plan eligibility validation
   - Implement usage-based downgrade restrictions
   - Create team size validation for Agency downgrades

### Phase 3: Polish & Analytics (Low Priority)
6. **Admin & Monitoring:**
   - Admin dashboard for subscription changes
   - Revenue impact analytics
   - Customer retention metrics

7. **Testing & QA:**
   - End-to-end upgrade/downgrade flows
   - Edge case validation
   - Payment failure scenarios
   - Proration calculations

### Technical Debt & Considerations
- **Stripe Integration:** Use Stripe's subscription modification APIs
- **Proration Handling:** Implement proper proration for mid-cycle changes
- **Email Notifications:** Notify users of pending changes and confirmations
- **Audit Trail:** Log all subscription changes for compliance and support 