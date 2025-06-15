# Subscription Model & Requirements

## 1. Subscription Tiers

### A. Free Plan
- **Price:** $0/month
- **Limit:** 5 content repurposes per month.
- **Overage Pricing:** $0.12 per additional content repurpose.
- **Features:** 
  - Basic AI model
  - No daily limit
  - Twitter & Instagram templates
  - No credit card required for base usage

### B. Basic Plan
- **Price:** $6.99/month
- **Limit:** 2 content repurposes per day (60/month).
- **Overage Pricing:** $0.10 per additional content repurpose.
- **Features:** 
  - Standard AI model
  - Twitter, Instagram & Facebook templates
  - Basic customer support
  - Basic Analytics

### C. Pro Plan
- **Price:** $14.99/month
- **Limit:** 5 content repurposes per day (150/month).
- **Overage Pricing:** $0.08 per additional content repurpose.
- **Features:** 
  - Advanced AI model
  - All major platforms + LinkedIn templates
  - Professional customer support
  - Professional Analytics

### D. Agency Plan
- **Price:** $29.99/month
- **Limit:** 450 content repurposes per month
- **Daily Limit:** No daily limit
- **Team Members:** Up to 3 team members included
- **Overage Pricing:** $0.06 per additional content repurpose.
- **Features:** 
  - Advanced AI model
  - Priority Support
  - All platforms + custom templates (Twitter, Instagram, Facebook, LinkedIn, Thread, Email, Newsletter)
  - Professional Analytics
  - Team collaboration & analytics
- **Additional Members:** $6.99 per additional team member per month.

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

- **Upgrade/Plans Page:** Show plan options, features, and upgrade button.
- **Usage Meter:** Show current usage and limits in dashboard.
- **Upgrade Prompt:** Modal or banner when user hits free tier limit.
- **Manage Subscription:** Link to Stripe Customer Portal.

---

## 7. Backend/API Requirements

- **/api/stripe/checkout:** Create Stripe Checkout session.
- **/api/stripe/webhook:** Handle Stripe events (subscription created, updated, canceled, payment failed).
- **/api/usage:** Track and return user's usage for the month.
- **Middleware:** Protect repurposing API based on plan/usage.

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

## 12. Next Steps for Implementation
1. Add subscription fields to the User model and migrate.
2. Set up Stripe products, prices, and webhooks.
3. Build upgrade/plan selection UI.
4. Add usage tracking and enforcement logic.
5. Test end-to-end flows. 