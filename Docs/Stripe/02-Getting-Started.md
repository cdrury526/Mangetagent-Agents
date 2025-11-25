# Getting Started with Stripe

## Account Setup

### 1. Create Account

1. Go to https://stripe.com
2. Sign up with email
3. Verify email address
4. Complete business details

### 2. Get API Keys

Navigate to **Dashboard → Developers → API keys**

- **Publishable key**: `pk_test_...` (for client-side)
- **Secret key**: `sk_test_...` (for server-side)

⚠️ Never expose secret keys in client-side code!

## Installation

### Server-Side (Node.js)

```bash
npm install stripe
```

### Client-Side (Browser)

```bash
npm install @stripe/stripe-js
```

### React

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

### CLI

```bash
# macOS
brew install stripe/stripe-brew/stripe

# Other platforms
# Download from https://github.com/stripe/stripe-cli/releases
```

## Quick Start Examples

### Simple Payment (Server + Client)

#### Server-Side (Node.js)

```javascript
const stripe = require('stripe')('sk_test_...');

// Create Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000, // $20.00 in cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    clientSecret: paymentIntent.client_secret
  });
});
```

#### Client-Side (JavaScript)

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

// Get client secret from your server
const response = await fetch('/create-payment-intent', {
  method: 'POST',
});
const { clientSecret } = await response.json();

// Confirm payment
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: {
      card: cardElement, // Stripe Element
      billing_details: {
        name: 'Jenny Rosen',
      },
    },
  }
);

if (error) {
  console.error(error.message);
} else if (paymentIntent.status === 'succeeded') {
  console.log('Payment successful!');
}
```

### Using React

```jsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

```jsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Get client secret from server
    const response = await fetch('/create-payment-intent', {
      method: 'POST',
    });
    const { clientSecret } = await response.json();

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      console.error(result.error.message);
    } else {
      console.log('Payment succeeded!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
}
```

## Using Stripe Checkout (Hosted)

### Server-Side

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
          },
          unit_amount: 2000, // $20.00
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  });

  res.redirect(303, session.url);
});
```

### Client-Side

```html
<form action="/create-checkout-session" method="POST">
  <button type="submit">Checkout</button>
</form>
```

## Environment Variables

### .env file

```bash
# Test keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Live keys (never commit these!)
# STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_SECRET_KEY=sk_live_...
```

### Usage

```javascript
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

## Testing

### Test Card Numbers

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
Insufficient funds: 4000 0000 0000 9995
```

Any future expiration date and any 3-digit CVC.

### CLI Testing

```bash
# Start webhook listener
stripe listen --forward-to localhost:3000/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

## Webhook Setup

### 1. Create Endpoint (Server)

```javascript
const express = require('express');
const stripe = require('stripe')('sk_test_...');

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

    // Handle event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      case 'customer.subscription.created':
        const subscription = event.data.object;
        console.log('Subscription created:', subscription.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);
```

### 2. Register Webhook in Dashboard

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Enter URL: `https://yourdomain.com/webhook`
4. Select events to listen to
5. Copy webhook signing secret

### 3. Local Testing

```bash
# Terminal 1: Start your server
npm start

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/webhook
```

## TypeScript Setup

### Installation

```bash
npm install stripe
npm install --save-dev @types/node
```

### Usage

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Type-safe API calls
const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
});

// Webhook typing
const event: Stripe.Event = stripe.webhooks.constructEvent(
  payload,
  signature,
  secret
);

if (event.type === 'payment_intent.succeeded') {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log(paymentIntent.id);
}
```

## Common Patterns

### Error Handling

```javascript
try {
  const charge = await stripe.charges.create({
    amount: 2000,
    currency: 'usd',
    source: 'tok_visa',
  });
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card was declined
    console.error(error.message);
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
    console.error(error.message);
  } else {
    // Other error
    console.error(error);
  }
}
```

### Idempotency

```javascript
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: 2000,
    currency: 'usd',
  },
  {
    idempotencyKey: 'unique-key-12345',
  }
);
```

### Pagination

```javascript
// Automatic pagination
for await (const customer of stripe.customers.list({ limit: 100 })) {
  console.log(customer.id);
}

// Manual pagination
const customers = await stripe.customers.list({ limit: 10 });
console.log(customers.data);
console.log(customers.has_more);
console.log(customers.starting_after);
```

## Next Steps

### Basic Integration
1. Set up Payment Intents
2. Add payment form
3. Handle webhooks
4. Test with test cards

### Advanced Features
1. Add subscriptions
2. Implement customer portal
3. Set up Connect for marketplaces
4. Add multiple payment methods

### Production Checklist
- [ ] Switch to live API keys
- [ ] Set up production webhook endpoint
- [ ] Enable Radar fraud detection
- [ ] Configure email receipts
- [ ] Set up proper error handling
- [ ] Implement logging
- [ ] Add monitoring
- [ ] Complete business verification

## Resources

- **API Reference**: https://stripe.com/docs/api
- **Testing Guide**: https://stripe.com/docs/testing
- **Webhooks Guide**: https://stripe.com/docs/webhooks
- **Best Practices**: https://stripe.com/docs/security/guide
- **Sample Code**: https://github.com/stripe-samples

## Common Issues

### CORS Errors
Make sure your server allows requests from your frontend domain.

### Webhook 401 Errors
Verify your webhook secret is correct and signature validation is working.

### Card Declined
Use test card numbers from the testing guide. In live mode, actual cards may be declined by the issuing bank.

### 3D Secure Required
Some test cards and all live European cards may require 3D Secure authentication.

## Support

- **Documentation**: https://stripe.com/docs
- **Support Center**: https://support.stripe.com
- **Community**: https://github.com/stripe
- **Status**: https://status.stripe.com
