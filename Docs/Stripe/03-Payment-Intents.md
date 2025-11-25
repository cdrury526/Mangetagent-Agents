# Payment Intents

Payment Intents is the recommended way to accept one-time payments. It handles the entire payment flow including authentication (3D Secure), error handling, and payment retries.

## Why Payment Intents?

- **Strong Customer Authentication (SCA)** - Built-in 3D Secure support
- **Multiple Payment Methods** - Cards, wallets, bank transfers
- **Error Recovery** - Automatic retry logic
- **Status Tracking** - Full lifecycle management
- **Webhook Integration** - Real-time updates

## Payment Intent Lifecycle

```
created → processing → requires_action → succeeded
                    ↓
                 canceled / failed
```

### Status Values

- `requires_payment_method` - Needs payment method
- `requires_confirmation` - Ready to be confirmed
- `requires_action` - Needs customer action (3D Secure)
- `processing` - Payment is being processed
- `requires_capture` - Payment authorized, awaiting capture
- `canceled` - Canceled by you
- `succeeded` - Payment complete

## Basic Payment Flow

### 1. Server-Side: Create Payment Intent

```javascript
const stripe = require('stripe')('sk_test_...');

app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: currency,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    clientSecret: paymentIntent.client_secret
  });
});
```

### 2. Client-Side: Collect Payment Details

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

// Get client secret from server
const response = await fetch('/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 2000,
    currency: 'usd'
  })
});

const { clientSecret } = await response.json();

// Confirm payment
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Jenny Rosen',
        email: 'jenny@example.com'
      }
    }
  }
);

if (error) {
  // Show error to customer
  console.error(error.message);
} else if (paymentIntent.status === 'succeeded') {
  // Payment successful
  console.log('Payment succeeded!');
}
```

### 3. Server-Side: Handle Webhook

```javascript
app.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Fulfill the order
      await fulfillOrder(paymentIntent);
    }

    res.json({ received: true });
  }
);
```

## Payment Methods

### Card Payments

```javascript
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Jenny Rosen',
        email: 'jenny@example.com',
        address: {
          line1: '510 Townsend St',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94103',
          country: 'US'
        }
      }
    }
  }
);
```

### Saved Payment Methods

```javascript
// Use existing payment method
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: 'pm_card_visa', // ID of saved PaymentMethod
  }
);
```

### Digital Wallets (Apple Pay, Google Pay)

```javascript
const paymentRequest = stripe.paymentRequest({
  country: 'US',
  currency: 'usd',
  total: {
    label: 'Demo total',
    amount: 2000,
  },
  requestPayerName: true,
  requestPayerEmail: true,
});

// Check availability
const canMakePayment = await paymentRequest.canMakePayment();

if (canMakePayment) {
  // Show payment request button
  paymentRequest.on('paymentmethod', async (ev) => {
    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: ev.paymentMethod.id
      },
      { handleActions: false }
    );

    if (error) {
      ev.complete('fail');
    } else {
      ev.complete('success');
      if (paymentIntent.status === 'requires_action') {
        // 3D Secure needed
        await stripe.confirmCardPayment(clientSecret);
      }
    }
  });
}
```

## Advanced Features

### Capture Later (Authorize Only)

```javascript
// Create with capture method
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  capture_method: 'manual', // Authorize only
  automatic_payment_methods: {
    enabled: true,
  },
});

// Later: Capture the payment
const captured = await stripe.paymentIntents.capture(paymentIntent.id);

// Or: Cancel the authorization
const canceled = await stripe.paymentIntents.cancel(paymentIntent.id);
```

### Add Metadata

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  metadata: {
    order_id: '12345',
    customer_email: 'customer@example.com',
  },
});
```

### Save Payment Method for Future Use

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  customer: 'cus_...', // Existing customer ID
  setup_future_usage: 'off_session', // or 'on_session'
  automatic_payment_methods: {
    enabled: true,
  },
});
```

### Attach to Customer

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  customer: 'cus_...', // Customer ID
  automatic_payment_methods: {
    enabled: true,
  },
});
```

### Custom Statement Descriptor

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  statement_descriptor: 'MYSTORE ORDER',
  statement_descriptor_suffix: '12345',
  automatic_payment_methods: {
    enabled: true,
  },
});
```

### Set Application Fee (Connect)

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  application_fee_amount: 100, // Your platform fee
  transfer_data: {
    destination: 'acct_...', // Connected account
  },
});
```

## Handling 3D Secure

### Automatic Handling

```javascript
// confirmCardPayment handles 3D Secure automatically
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
  }
});

// Stripe will show 3D Secure modal if needed
```

### Manual Handling

```javascript
// Check if action is required
const { paymentIntent, error } = await stripe.confirmCardPayment(
  clientSecret,
  { payment_method: { card: cardElement } }
);

if (paymentIntent.status === 'requires_action') {
  // Handle 3D Secure
  const { error, paymentIntent: updatedIntent } =
    await stripe.handleCardAction(clientSecret);

  if (updatedIntent.status === 'succeeded') {
    console.log('Payment succeeded after 3DS');
  }
}
```

## Error Handling

```javascript
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement,
    }
  }
);

if (error) {
  switch (error.type) {
    case 'card_error':
      // Card was declined
      console.error('Card declined:', error.message);
      break;
    case 'validation_error':
      // Invalid parameters
      console.error('Validation error:', error.message);
      break;
    case 'authentication_error':
      // Authentication failed
      console.error('Authentication failed');
      break;
    default:
      console.error('Error:', error.message);
  }
} else {
  // Success!
  console.log('Payment:', paymentIntent.id);
}
```

## Retrieving Payment Intents

```javascript
// Get by ID
const paymentIntent = await stripe.paymentIntents.retrieve('pi_...');

// List all
const paymentIntents = await stripe.paymentIntents.list({
  limit: 10,
});
```

## Updating Payment Intents

```javascript
// Update before confirmation
const updated = await stripe.paymentIntents.update('pi_...', {
  amount: 2500, // Change amount
  metadata: { order_id: '67890' },
});
```

## Canceling Payment Intents

```javascript
const canceled = await stripe.paymentIntents.cancel('pi_...');
```

## Webhook Events

Listen for these events:

```javascript
// Payment lifecycle events
payment_intent.created
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
payment_intent.amount_capturable_updated
payment_intent.requires_action

// Handle in webhook
switch (event.type) {
  case 'payment_intent.succeeded':
    const paymentIntent = event.data.object;
    await fulfillOrder(paymentIntent);
    break;

  case 'payment_intent.payment_failed':
    const failedIntent = event.data.object;
    await notifyCustomer(failedIntent);
    break;
}
```

## Best Practices

### 1. Always Use Webhooks

Don't rely solely on client-side confirmation:

```javascript
// ❌ Bad - Only client-side check
if (paymentIntent.status === 'succeeded') {
  fulfillOrder(); // Don't do this!
}

// ✅ Good - Use webhook
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);
  if (event.type === 'payment_intent.succeeded') {
    await fulfillOrder(event.data.object);
  }
});
```

### 2. Use Idempotency Keys

```javascript
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: 2000,
    currency: 'usd',
  },
  {
    idempotencyKey: `order_${orderId}`,
  }
);
```

### 3. Handle All Payment States

```javascript
async function handlePaymentStatus(paymentIntent) {
  switch (paymentIntent.status) {
    case 'succeeded':
      return 'Payment successful!';
    case 'processing':
      return 'Payment processing...';
    case 'requires_payment_method':
      return 'Payment failed. Please try another payment method.';
    case 'requires_action':
      return 'Authentication required.';
    default:
      return 'Something went wrong.';
  }
}
```

### 4. Store Payment Intent ID

```javascript
// Save to database
await db.orders.update({
  order_id: orderId,
  stripe_payment_intent_id: paymentIntent.id,
});
```

### 5. Add Meaningful Metadata

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  metadata: {
    order_id: '12345',
    customer_email: 'customer@example.com',
    product_id: 'prod_abc',
    shipping_address: JSON.stringify(address),
  },
});
```

## Testing

### Test Card Numbers

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
Insufficient: 4000 0000 0000 9995
```

### Trigger Events

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

## Common Patterns

### Partial Capture

```javascript
// Authorize $100
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000,
  currency: 'usd',
  capture_method: 'manual',
});

// Capture $75
await stripe.paymentIntents.capture(paymentIntent.id, {
  amount_to_capture: 7500,
});
```

### Multiple Currencies

```javascript
// Create in customer's currency
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: customerCurrency, // 'eur', 'gbp', etc.
});
```

## References

- **API Reference**: https://stripe.com/docs/api/payment_intents
- **Guide**: https://stripe.com/docs/payments/payment-intents
- **Migration from Charges**: https://stripe.com/docs/payments/payment-intents/migration
