# Stripe Checkout

Stripe Checkout is a pre-built, hosted payment page that accepts one-time payments and subscriptions.

## Why Use Checkout?

- **Hosted by Stripe** - No PCI compliance needed
- **Mobile Optimized** - Responsive design
- **Payment Methods** - Cards, wallets, bank transfers
- **Localization** - 25+ languages
- **Conversion Optimized** - A/B tested by Stripe
- **Quick Integration** - Minimal code required

## One-Time Payments

### Server-Side: Create Session

```javascript
const stripe = require('stripe')('sk_test_...');

app.post('/create-checkout-session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'T-shirt',
            images: ['https://example.com/t-shirt.png'],
          },
          unit_amount: 2000, // $20.00
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${YOUR_DOMAIN}/cancel`,
  });

  res.json({ url: session.url });
});
```

### Client-Side: Redirect

```javascript
// Fetch session
const response = await fetch('/create-checkout-session', {
  method: 'POST',
});
const { url } = await response.json();

// Redirect to Checkout
window.location.href = url;
```

Or with a form:

```html
<form action="/create-checkout-session" method="POST">
  <button type="submit">Checkout</button>
</form>
```

## Subscriptions

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price: 'price_monthly', // Existing price ID
      quantity: 1,
    },
  ],
  mode: 'subscription',
  success_url: `${YOUR_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### With Trial Period

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price: 'price_monthly',
      quantity: 1,
    },
  ],
  mode: 'subscription',
  subscription_data: {
    trial_period_days: 14,
  },
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

## Using Existing Prices

```javascript
// Use pre-created Price IDs
const session = await stripe.checkout.sessions.create({
  line_items: [
    { price: 'price_1234', quantity: 2 },
    { price: 'price_5678', quantity: 1 },
  ],
  mode: 'payment',
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

## Customer Information

### Collect Shipping Address

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  shipping_address_collection: {
    allowed_countries: ['US', 'CA', 'GB', 'DE'],
  },
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### Prefill Customer Email

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  customer_email: 'customer@example.com',
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### Use Existing Customer

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  customer: 'cus_...', // Existing customer ID
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### Collect Phone Number

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  phone_number_collection: {
    enabled: true,
  },
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

## Payment Methods

### Specific Payment Methods

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  payment_method_types: ['card', 'alipay', 'wechat_pay'],
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### Automatic Payment Methods

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  automatic_tax: { enabled: true },
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

## Advanced Features

### Discount Codes

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  discounts: [{
    coupon: 'coupon_...',
  }],
  // Or allow customer to enter code
  allow_promotion_codes: true,
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### Tax Calculation

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  automatic_tax: { enabled: true },
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### Custom Fields

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  custom_fields: [
    {
      key: 'company_name',
      label: {
        type: 'custom',
        custom: 'Company name',
      },
      type: 'text',
      optional: true,
    },
  ],
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### Metadata

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  metadata: {
    order_id: '12345',
    user_id: '67890',
  },
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

### Billing Address Collection

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  billing_address_collection: 'required', // or 'auto'
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

## After Checkout

### Success Page

```javascript
// Retrieve session
app.get('/success', async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(
    req.query.session_id
  );

  // Get customer
  const customer = await stripe.customers.retrieve(session.customer);

  res.send(`
    <h1>Thank you for your purchase!</h1>
    <p>Order ID: ${session.id}</p>
    <p>Email: ${customer.email}</p>
  `);
});
```

### Retrieve Line Items

```javascript
const lineItems = await stripe.checkout.sessions.listLineItems(
  session.id
);

console.log(lineItems.data);
```

### Fulfill Order with Webhook

```javascript
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Fulfill the order
    await fulfillOrder(session);
  }

  res.json({ received: true });
});

async function fulfillOrder(session) {
  // Check payment status
  if (session.payment_status === 'paid') {
    // Get line items
    const lineItems = await stripe.checkout.sessions.listLineItems(
      session.id
    );

    // Process order
    console.log('Fulfilling order:', session.id);
    console.log('Customer:', session.customer_details.email);
    console.log('Items:', lineItems.data);
  }
}
```

## Checkout Customization

### Branding

Configure in Dashboard → Settings → Branding:
- Logo
- Brand color
- Accent color
- Icon

### Locale

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  locale: 'es', // Spanish
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

Available locales: `auto`, `en`, `es`, `fr`, `de`, `it`, `ja`, `zh`, etc.

## Session Expiration

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

## Save Payment Method

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  customer: 'cus_...',
  payment_intent_data: {
    setup_future_usage: 'off_session',
  },
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

## Embedded Checkout (Beta)

```javascript
// Server: Create session with ui_mode
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  ui_mode: 'embedded',
  return_url: `${YOUR_DOMAIN}/return?session_id={CHECKOUT_SESSION_ID}`,
});

// Client: Embed checkout
const checkout = await stripe.initEmbeddedCheckout({
  clientSecret: session.client_secret,
});

checkout.mount('#checkout');
```

## Testing

### Test Cards

```
Success: 4242 4242 4242 4242
3D Secure: 4000 0025 0000 3155
Decline: 4000 0000 0000 0002
```

### Test Checkout

```bash
# Trigger events
stripe trigger checkout.session.completed
stripe trigger checkout.session.async_payment_succeeded
```

## Webhook Events

```javascript
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired

// Handle events
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      if (session.payment_status === 'paid') {
        await fulfillOrder(session);
      }
      break;

    case 'checkout.session.async_payment_succeeded':
      // Handle delayed payment success
      await fulfillOrder(event.data.object);
      break;

    case 'checkout.session.async_payment_failed':
      // Handle delayed payment failure
      await emailCustomer(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

## Best Practices

### 1. Always Use Webhooks

```javascript
// ✅ Good - Webhook fulfillment
app.post('/webhook', async (req, res) => {
  if (event.type === 'checkout.session.completed') {
    await fulfillOrder(event.data.object);
  }
});

// ❌ Bad - Client-side only
// Don't fulfill orders just from success page
```

### 2. Check Payment Status

```javascript
if (session.payment_status === 'paid') {
  // Fulfill order
} else if (session.payment_status === 'unpaid') {
  // Wait for payment
}
```

### 3. Store Session ID

```javascript
await db.orders.create({
  stripe_session_id: session.id,
  customer_email: session.customer_details.email,
  amount: session.amount_total,
});
```

### 4. Handle Expired Sessions

```javascript
app.post('/webhook', async (req, res) => {
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    await notifyCustomerToRetry(session);
  }
});
```

## Common Patterns

### Dynamic Line Items

```javascript
app.post('/create-checkout-session', async (req, res) => {
  const { items } = req.body; // From cart

  const line_items = items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        images: [item.image],
      },
      unit_amount: item.price * 100,
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: 'payment',
    success_url: `${YOUR_DOMAIN}/success`,
    cancel_url: `${YOUR_DOMAIN}/cart`,
  });

  res.json({ url: session.url });
});
```

### Guest Checkout

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [...],
  mode: 'payment',
  customer_creation: 'always', // Create customer even for guests
  success_url: `${YOUR_DOMAIN}/success`,
  cancel_url: `${YOUR_DOMAIN}/cancel`,
});
```

## References

- **Checkout Docs**: https://stripe.com/docs/payments/checkout
- **Checkout API**: https://stripe.com/docs/api/checkout/sessions
- **Quickstart**: https://stripe.com/docs/checkout/quickstart
