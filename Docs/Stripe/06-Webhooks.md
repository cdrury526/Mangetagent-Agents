# Webhooks

Webhooks notify your application when events occur in your Stripe account. They're essential for asynchronous events like successful payments, failed charges, and subscription updates.

## Why Webhooks?

- **Real-time notifications** - Get instant updates
- **Reliable** - Stripe retries failed deliveries
- **Secure** - Cryptographically signed
- **Comprehensive** - 100+ event types
- **Async operations** - Don't block payment flow

## Setup

### 1. Create Endpoint

```javascript
const express = require('express');
const stripe = require('stripe')('sk_test_...');

const endpointSecret = 'whsec_...';

app.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handlePaymentFailed(failedPayment);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    response.json({ received: true });
  }
);
```

### 2. Register in Dashboard

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter your URL: `https://yourdomain.com/webhook`
4. Select events to listen for
5. Copy webhook signing secret (`whsec_...`)

### 3. Local Testing

```bash
# Terminal 1: Start your server
npm start

# Terminal 2: Forward webhooks to localhost
stripe listen --forward-to localhost:3000/webhook

# Terminal 3: Trigger test events
stripe trigger payment_intent.succeeded
```

## Important Notes

### ⚠️ Use express.raw()

```javascript
// ✅ Correct - Raw body for webhook route
app.post('/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// ❌ Wrong - Don't use express.json() for webhooks
// This will break signature verification!
```

### Route Order

```javascript
// ✅ Correct - Webhook route BEFORE express.json()
app.post('/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

app.use(express.json()); // After webhook route

app.post('/other-routes', otherHandler);
```

## Event Types

### Payment Events

```javascript
payment_intent.created
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
payment_intent.amount_capturable_updated
payment_intent.requires_action
```

### Subscription Events

```javascript
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
customer.subscription.paused
customer.subscription.resumed
customer.subscription.trial_will_end
```

### Invoice Events

```javascript
invoice.created
invoice.finalized
invoice.paid
invoice.payment_failed
invoice.payment_action_required
invoice.upcoming
invoice.voided
```

### Customer Events

```javascript
customer.created
customer.updated
customer.deleted
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

### Checkout Events

```javascript
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
```

### Charge Events

```javascript
charge.succeeded
charge.failed
charge.captured
charge.refunded
charge.dispute.created
charge.dispute.closed
```

## Handling Events

### Payment Intent Succeeded

```javascript
async function handlePaymentIntentSucceeded(paymentIntent) {
  // Get order from database
  const order = await db.orders.findOne({
    stripe_payment_intent_id: paymentIntent.id
  });

  // Update order status
  await db.orders.update({
    id: order.id,
    status: 'paid',
    paid_at: new Date()
  });

  // Send confirmation email
  await sendEmail({
    to: order.customer_email,
    subject: 'Payment Successful',
    template: 'order-confirmation',
    data: { order }
  });

  // Fulfill order
  await fulfillOrder(order);
}
```

### Subscription Created

```javascript
async function handleSubscriptionCreated(subscription) {
  // Get user from database
  const user = await db.users.findOne({
    stripe_customer_id: subscription.customer
  });

  // Grant premium access
  await db.users.update({
    id: user.id,
    subscription_id: subscription.id,
    subscription_status: subscription.status,
    plan: subscription.items.data[0].price.id
  });

  // Send welcome email
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Premium!',
    template: 'subscription-welcome'
  });
}
```

### Invoice Payment Failed

```javascript
async function handleInvoicePaymentFailed(invoice) {
  // Get customer
  const customer = await stripe.customers.retrieve(invoice.customer);

  // Send payment failed email
  await sendEmail({
    to: customer.email,
    subject: 'Payment Failed',
    template: 'payment-failed',
    data: {
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      invoice_url: invoice.hosted_invoice_url
    }
  });

  // Log for retry monitoring
  console.log('Payment failed for customer:', customer.id);
}
```

### Checkout Session Completed

```javascript
async function handleCheckoutSessionCompleted(session) {
  // Only fulfill after payment is complete
  if (session.payment_status === 'paid') {
    // Get line items
    const lineItems = await stripe.checkout.sessions.listLineItems(
      session.id,
      { limit: 100 }
    );

    // Create order
    const order = await db.orders.create({
      stripe_session_id: session.id,
      customer_email: session.customer_details.email,
      customer_name: session.customer_details.name,
      amount: session.amount_total,
      currency: session.currency,
      items: lineItems.data,
      status: 'pending_fulfillment'
    });

    // Fulfill order
    await fulfillOrder(order);
  }
}
```

### Subscription Trial Ending

```javascript
async function handleSubscriptionTrialWillEnd(subscription) {
  // Get customer
  const customer = await stripe.customers.retrieve(subscription.customer);

  // Calculate days until end
  const daysLeft = Math.ceil(
    (subscription.trial_end - Date.now() / 1000) / 86400
  );

  // Send reminder email
  await sendEmail({
    to: customer.email,
    subject: `Your trial ends in ${daysLeft} days`,
    template: 'trial-ending',
    data: {
      daysLeft,
      subscription_url: 'https://yoursite.com/subscription'
    }
  });
}
```

## Error Handling

### Idempotency

```javascript
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  try {
    // Check if already processed
    const existing = await db.webhook_events.findOne({
      stripe_event_id: event.id
    });

    if (existing) {
      console.log('Event already processed:', event.id);
      return res.json({ received: true });
    }

    // Process event
    await handleEvent(event);

    // Mark as processed
    await db.webhook_events.create({
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date()
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Retry Logic

```javascript
async function handleEvent(event) {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await processEvent(event);
      return; // Success
    } catch (error) {
      retries++;
      console.error(`Retry ${retries}/${maxRetries}:`, error.message);

      if (retries >= maxRetries) {
        // Log failure for manual review
        await db.failed_webhooks.create({
          event_id: event.id,
          error: error.message,
          event_data: event
        });
        throw error;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, retries) * 1000)
      );
    }
  }
}
```

## Security

### Verify Signatures

```javascript
function constructEvent(rawBody, signature, secret) {
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error('Signature verification failed:', err.message);
    throw err;
  }
}
```

### Use HTTPS

Stripe only sends webhooks to HTTPS endpoints (except localhost).

### Validate Events

```javascript
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  // Verify event is from your account
  if (!event.livemode && process.env.NODE_ENV === 'production') {
    console.warn('Test event received in production!');
    return res.status(400).send('Invalid event mode');
  }

  // Process event
  await handleEvent(event);
});
```

## Testing

### CLI

```bash
# Listen to webhooks
stripe listen --forward-to localhost:3000/webhook

# Trigger specific events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed

# Trigger with specific data
stripe trigger payment_intent.succeeded --override amount=5000
```

### Test Mode

Create webhooks in test mode from Dashboard:
1. Use test webhook signing secret
2. Trigger events manually or via CLI
3. View webhook logs in Dashboard

## Monitoring

### Dashboard Logs

View webhook attempts in **Developers → Webhooks → [endpoint] → Events**

### Implement Logging

```javascript
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  console.log('Webhook received:', {
    event_id: event.id,
    event_type: event.type,
    timestamp: new Date().toISOString()
  });

  try {
    await handleEvent(event);

    console.log('Webhook processed successfully:', event.id);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', {
      event_id: event.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({ error: error.message });
  }
});
```

### Alert on Failures

```javascript
async function handleEvent(event) {
  try {
    await processEvent(event);
  } catch (error) {
    // Send alert
    await sendAlert({
      title: 'Webhook Processing Failed',
      message: `Event ${event.id} (${event.type}) failed: ${error.message}`,
      severity: 'high'
    });

    throw error;
  }
}
```

## Best Practices

### 1. Respond Quickly

```javascript
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  // Respond immediately
  res.json({ received: true });

  // Process asynchronously
  processEventAsync(event);
});

async function processEventAsync(event) {
  try {
    await handleEvent(event);
  } catch (error) {
    console.error('Async processing failed:', error);
  }
}
```

### 2. Handle All Events

```javascript
switch (event.type) {
  case 'payment_intent.succeeded':
    await handlePaymentSuccess(event.data.object);
    break;

  case 'payment_intent.payment_failed':
    await handlePaymentFailure(event.data.object);
    break;

  default:
    // Log unhandled events
    console.log(`Unhandled event type: ${event.type}`);
}
```

### 3. Use Webhook Secret per Environment

```bash
# .env.development
STRIPE_WEBHOOK_SECRET=whsec_test_...

# .env.production
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

### 4. Test Thoroughly

```bash
# Test all critical events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

## Common Issues

### Signature Verification Failed

**Problem**: Using `express.json()` before webhook route

**Solution**:
```javascript
// Webhook route with raw body
app.post('/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

// Other routes with JSON parsing
app.use(express.json());
app.post('/api/*', apiHandler);
```

### Timeout Errors

**Problem**: Webhook processing takes too long

**Solution**:
```javascript
app.post('/webhook', async (req, res) => {
  const event = constructEvent(req.body);

  // Respond immediately (within 10s)
  res.json({ received: true });

  // Process in background
  processInBackground(event);
});
```

### Duplicate Events

**Problem**: Same event processed multiple times

**Solution**: Implement idempotency checking (see Error Handling section)

## References

- **Webhooks Guide**: https://stripe.com/docs/webhooks
- **Event Types**: https://stripe.com/docs/api/events/types
- **Webhook Best Practices**: https://stripe.com/docs/webhooks/best-practices
- **CLI Webhooks**: https://stripe.com/docs/stripe-cli/webhooks
