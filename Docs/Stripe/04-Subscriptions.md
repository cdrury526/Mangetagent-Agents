# Subscriptions & Recurring Billing

Stripe Subscriptions enables you to charge customers on a recurring basis for products or services.

## Core Concepts

### Product
Represents what you're selling (e.g., "Premium Plan", "Pro Membership")

### Price
The cost and billing frequency (e.g., $10/month, $100/year)

### Subscription
Links a customer to a price with automatic recurring billing

### Invoice
Generated automatically for each billing cycle

## Basic Subscription Flow

### 1. Create Product & Price

```javascript
const stripe = require('stripe')('sk_test_...');

// Create product
const product = await stripe.products.create({
  name: 'Premium Plan',
  description: 'Access to premium features',
});

// Create recurring price
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 1000, // $10.00
  currency: 'usd',
  recurring: {
    interval: 'month', // 'day', 'week', 'month', or 'year'
  },
});
```

### 2. Create Customer

```javascript
const customer = await stripe.customers.create({
  email: 'customer@example.com',
  name: 'Jenny Rosen',
  metadata: {
    user_id: '12345',
  },
});
```

### 3. Create Subscription

```javascript
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [
    { price: price.id },
  ],
  payment_behavior: 'default_incomplete',
  payment_settings: { save_default_payment_method: 'on_subscription' },
  expand: ['latest_invoice.payment_intent'],
});

// Return client secret for payment confirmation
const clientSecret = subscription.latest_invoice.payment_intent.client_secret;
```

### 4. Client-Side: Confirm Payment

```javascript
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Jenny Rosen',
        email: 'customer@example.com',
      },
    },
  }
);

if (error) {
  console.error(error.message);
} else if (paymentIntent.status === 'succeeded') {
  console.log('Subscription created!');
}
```

## Pricing Models

### Fixed Price

```javascript
const price = await stripe.prices.create({
  product: 'prod_...',
  unit_amount: 1000, // $10
  currency: 'usd',
  recurring: { interval: 'month' },
});
```

### Tiered Pricing

```javascript
const price = await stripe.prices.create({
  product: 'prod_...',
  currency: 'usd',
  recurring: { interval: 'month' },
  billing_scheme: 'tiered',
  tiers_mode: 'graduated',
  tiers: [
    {
      up_to: 10,
      unit_amount: 1000, // $10 each for first 10
    },
    {
      up_to: 50,
      unit_amount: 800, // $8 each for 11-50
    },
    {
      up_to: 'inf',
      unit_amount: 500, // $5 each for 51+
    },
  ],
});
```

### Usage-Based (Metered) Pricing

```javascript
// Create metered price
const price = await stripe.prices.create({
  product: 'prod_...',
  currency: 'usd',
  recurring: {
    interval: 'month',
    usage_type: 'metered',
  },
  billing_scheme: 'per_unit',
  unit_amount: 100, // $1 per unit
});

// Report usage
await stripe.subscriptionItems.createUsageRecord(
  'si_...', // subscription item ID
  {
    quantity: 100,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment', // or 'set'
  }
);
```

### Multiple Prices

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [
    { price: 'price_monthly_base' },
    { price: 'price_addon_1' },
    { price: 'price_addon_2' },
  ],
});
```

## Trial Periods

### Fixed Trial Period

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [{ price: 'price_...' }],
  trial_period_days: 14,
});
```

### Trial Until Specific Date

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [{ price: 'price_...' }],
  trial_end: Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60), // 14 days
});
```

### Free Trial with Payment Method

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [{ price: 'price_...' }],
  trial_period_days: 14,
  payment_behavior: 'default_incomplete',
  payment_settings: { save_default_payment_method: 'on_subscription' },
});
```

## Managing Subscriptions

### Update Subscription

```javascript
// Change price
const updated = await stripe.subscriptions.update('sub_...', {
  items: [{
    id: 'si_...', // subscription item ID
    price: 'price_new',
  }],
  proration_behavior: 'create_prorations', // or 'none', 'always_invoice'
});
```

### Add Items

```javascript
const updated = await stripe.subscriptions.update('sub_...', {
  items: [
    { id: 'si_existing', price: 'price_existing' },
    { price: 'price_new_addon' }, // Add new item
  ],
});
```

### Remove Items

```javascript
const updated = await stripe.subscriptions.update('sub_...', {
  items: [
    { id: 'si_to_remove', deleted: true },
  ],
});
```

### Change Billing Cycle

```javascript
// Reset billing cycle
const updated = await stripe.subscriptions.update('sub_...', {
  billing_cycle_anchor: 'now', // or unix timestamp
  proration_behavior: 'create_prorations',
});
```

### Pause Subscription

```javascript
const updated = await stripe.subscriptions.update('sub_...', {
  pause_collection: {
    behavior: 'mark_uncollectible', // or 'keep_as_draft', 'void'
  },
});

// Resume
const resumed = await stripe.subscriptions.update('sub_...', {
  pause_collection: null,
});
```

### Cancel Subscription

```javascript
// Cancel at period end
const canceled = await stripe.subscriptions.update('sub_...', {
  cancel_at_period_end: true,
});

// Cancel immediately
const deleted = await stripe.subscriptions.cancel('sub_...');

// Schedule cancellation
const scheduled = await stripe.subscriptions.update('sub_...', {
  cancel_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
});
```

## Proration

### Proration Behavior

```javascript
// Create proration
const updated = await stripe.subscriptions.update('sub_...', {
  items: [{ id: 'si_...', price: 'price_upgraded' }],
  proration_behavior: 'create_prorations', // Default
});

// No proration
const updated = await stripe.subscriptions.update('sub_...', {
  items: [{ id: 'si_...', price: 'price_new' }],
  proration_behavior: 'none',
});

// Always invoice immediately
const updated = await stripe.subscriptions.update('sub_...', {
  items: [{ id: 'si_...', price: 'price_upgraded' }],
  proration_behavior: 'always_invoice',
});
```

### Preview Proration

```javascript
const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
  customer: 'cus_...',
  subscription: 'sub_...',
  subscription_items: [
    { id: 'si_...', price: 'price_new' },
  ],
  subscription_proration_behavior: 'create_prorations',
});

console.log('Amount due:', upcomingInvoice.amount_due);
```

## Payment Collection

### Collection Method

```javascript
// Automatic collection (charge payment method)
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [{ price: 'price_...' }],
  collection_method: 'charge_automatically', // Default
});

// Manual collection (send invoices)
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [{ price: 'price_...' }],
  collection_method: 'send_invoice',
  days_until_due: 30,
});
```

### Failed Payments

```javascript
// Configure retry behavior
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [{ price: 'price_...' }],
  payment_settings: {
    payment_method_types: ['card'],
    save_default_payment_method: 'on_subscription',
  },
});

// Listen for failed payments
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    await notifyCustomer(invoice.customer);
  }
});
```

## Customer Portal

Enable self-service subscription management:

```javascript
// Create portal session
const session = await stripe.billingPortal.sessions.create({
  customer: 'cus_...',
  return_url: 'https://example.com/account',
});

// Redirect customer
res.redirect(session.url);
```

Portal allows customers to:
- Update payment methods
- View invoices
- Change subscription
- Cancel subscription

## Invoices

### Retrieve Upcoming Invoice

```javascript
const invoice = await stripe.invoices.retrieveUpcoming({
  customer: 'cus_...',
});

console.log('Next charge:', invoice.amount_due);
console.log('Billing date:', new Date(invoice.period_end * 1000));
```

### Send Invoice Manually

```javascript
// Create invoice
const invoice = await stripe.invoices.create({
  customer: 'cus_...',
  collection_method: 'send_invoice',
  days_until_due: 30,
});

// Add line items
await stripe.invoiceItems.create({
  customer: 'cus_...',
  price: 'price_...',
  invoice: invoice.id,
});

// Finalize and send
const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
await stripe.invoices.sendInvoice(invoice.id);
```

### Void Invoice

```javascript
const voided = await stripe.invoices.voidInvoice('in_...');
```

## Coupons & Discounts

### Create Coupon

```javascript
// Percentage off
const coupon = await stripe.coupons.create({
  percent_off: 25, // 25% off
  duration: 'once', // 'once', 'repeating', 'forever'
});

// Amount off
const coupon = await stripe.coupons.create({
  amount_off: 500, // $5 off
  currency: 'usd',
  duration: 'repeating',
  duration_in_months: 3,
});
```

### Apply Coupon

```javascript
// To customer
await stripe.customers.update('cus_...', {
  coupon: 'coupon_...',
});

// To subscription
await stripe.subscriptions.update('sub_...', {
  coupon: 'coupon_...',
});
```

### Promotion Codes

```javascript
const promotionCode = await stripe.promotionCodes.create({
  coupon: 'coupon_...',
  code: 'SAVE25',
  max_redemptions: 100,
});
```

## Webhook Events

```javascript
// Subscription lifecycle
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.trial_will_end

// Invoice events
invoice.created
invoice.finalized
invoice.paid
invoice.payment_failed
invoice.payment_action_required

// Handle events
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  switch (event.type) {
    case 'customer.subscription.created':
      await provisionAccess(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await revokeAccess(event.data.object);
      break;

    case 'invoice.payment_failed':
      await notifyCustomer(event.data.object);
      break;

    case 'customer.subscription.trial_will_end':
      await sendTrialEndingEmail(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

## Best Practices

### 1. Use Webhooks

```javascript
// ✅ Good - Use webhook to provision access
app.post('/webhook', async (req, res) => {
  if (event.type === 'customer.subscription.created') {
    await grantAccess(subscription.customer);
  }
});

// ❌ Bad - Don't rely on client-side only
```

### 2. Handle Trial Periods

```javascript
app.post('/webhook', async (req, res) => {
  if (event.type === 'customer.subscription.trial_will_end') {
    const subscription = event.data.object;
    const daysLeft = Math.ceil(
      (subscription.trial_end - Date.now() / 1000) / 86400
    );
    await sendEmail(`Trial ending in ${daysLeft} days`);
  }
});
```

### 3. Check Subscription Status

```javascript
function hasAccess(subscription) {
  return ['active', 'trialing'].includes(subscription.status);
}
```

### 4. Store Subscription ID

```javascript
// Save to database
await db.users.update({
  user_id: userId,
  stripe_customer_id: customer.id,
  stripe_subscription_id: subscription.id,
  subscription_status: subscription.status,
});
```

## Testing

```bash
# Trigger subscription events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed

# Simulate time passing
stripe subscriptions update sub_... --trial_end=now
```

## Common Patterns

### Free + Paid Tiers

```javascript
// Free tier - no subscription
// Paid tier - create subscription when upgrading

async function upgradeToPremium(userId) {
  const customer = await getOrCreateCustomer(userId);

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: 'price_premium' }],
  });

  await db.users.update({ userId, tier: 'premium' });
}
```

### Seat-Based Pricing

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [{
    price: 'price_per_seat',
    quantity: 5, // 5 seats
  }],
});

// Update quantity
await stripe.subscriptions.update('sub_...', {
  items: [{
    id: 'si_...',
    quantity: 10, // Now 10 seats
  }],
  proration_behavior: 'create_prorations',
});
```

## References

- **API Reference**: https://stripe.com/docs/api/subscriptions
- **Billing Guide**: https://stripe.com/docs/billing
- **Customer Portal**: https://stripe.com/docs/billing/subscriptions/customer-portal
