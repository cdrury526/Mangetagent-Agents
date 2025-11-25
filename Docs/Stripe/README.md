# Stripe Documentation

Comprehensive documentation for integrating Stripe payment processing into your applications.

## 📚 Documentation Files

1. **[Overview](./01-Overview.md)** - Introduction to Stripe, core concepts, and architecture
2. **[Getting Started](./02-Getting-Started.md)** - Quick setup guide and basic integration
3. **[Payment Intents](./03-Payment-Intents.md)** - Accept one-time payments with Payment Intents API
4. **[Subscriptions](./04-Subscriptions.md)** - Recurring billing and subscription management
5. **[Checkout](./05-Checkout.md)** - Hosted payment pages with Stripe Checkout
6. **[Webhooks](./06-Webhooks.md)** - Handle asynchronous events and notifications
7. **[CLI](./07-CLI.md)** - Command-line tools for development and testing
8. **[React Integration](./08-React-Integration.md)** - Frontend integration with React

## 🚀 Quick Start

### Installation

```bash
# Server-side
npm install stripe

# Client-side
npm install @stripe/stripe-js

# React
npm install @stripe/react-stripe-js @stripe/stripe-js

# CLI
brew install stripe/stripe-brew/stripe
```

### Basic Payment Flow

**Server (Node.js)**
```javascript
const stripe = require('stripe')('sk_test_...');

app.post('/create-payment-intent', async (req, res) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 2000,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});
```

**Client (JavaScript)**
```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

const { clientSecret } = await fetch('/create-payment-intent', {
  method: 'POST',
}).then(r => r.json());

const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
  },
});
```

## 🔑 API Keys

### Test Mode
- **Publishable**: `pk_test_...` (client-side)
- **Secret**: `sk_test_...` (server-side)

### Live Mode
- **Publishable**: `pk_live_...` (client-side)
- **Secret**: `sk_live_...` (server-side)

⚠️ Never expose secret keys in client-side code!

## 💳 Test Cards

```
Success:              4242 4242 4242 4242
Decline:              4000 0000 0000 0002
3D Secure:            4000 0025 0000 3155
Insufficient Funds:   4000 0000 0000 9995
```

Use any future expiration date and any 3-digit CVC.

## 📖 Core Concepts

### Payment Intents
Modern payment API with built-in authentication and error handling.

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
});
```

### Subscriptions
Recurring billing for products and services.

```javascript
const subscription = await stripe.subscriptions.create({
  customer: 'cus_...',
  items: [{ price: 'price_...' }],
});
```

### Checkout
Hosted payment page for quick integration.

```javascript
const session = await stripe.checkout.sessions.create({
  line_items: [{ price: 'price_...', quantity: 1 }],
  mode: 'payment',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
});
```

### Webhooks
Receive real-time notifications about payment events.

```javascript
app.post('/webhook', (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature'],
    webhookSecret
  );

  if (event.type === 'payment_intent.succeeded') {
    // Fulfill order
  }

  res.json({ received: true });
});
```

## 🛠️ Development Tools

### Stripe CLI

```bash
# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/webhook

# Trigger test events
stripe trigger payment_intent.succeeded

# Make API requests
stripe customers list
```

### Testing Locally

```bash
# Terminal 1: Start your server
npm start

# Terminal 2: Listen for webhooks
stripe listen --forward-to localhost:3000/webhook

# Terminal 3: Trigger events
stripe trigger payment_intent.succeeded
```

## 📋 Common Integration Patterns

### 1. One-Time Payment
```
Create Payment Intent → Collect Payment → Confirm Payment → Webhook
```

### 2. Subscription
```
Create Customer → Create Subscription → Collect Payment → Webhook
```

### 3. Checkout (Hosted)
```
Create Session → Redirect to Stripe → Customer Pays → Webhook
```

### 4. Save Payment Method
```
Create Customer → Attach Payment Method → Use for Future Payments
```

## 🔐 Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Use HTTPS** for all production endpoints
3. **Validate webhook signatures** to verify events
4. **Store minimal payment data** - use tokens and IDs
5. **Implement proper error handling** for all scenarios
6. **Use test mode** for development
7. **Enable 3D Secure** for European customers

## 🎯 Integration Checklist

### Development
- [ ] Install Stripe libraries
- [ ] Get API keys from Dashboard
- [ ] Set up environment variables
- [ ] Create basic payment flow
- [ ] Implement webhook endpoint
- [ ] Test with CLI

### Testing
- [ ] Test with test cards
- [ ] Test 3D Secure flow
- [ ] Test declined payments
- [ ] Test webhooks locally
- [ ] Test error scenarios

### Production
- [ ] Switch to live API keys
- [ ] Set up production webhook endpoint
- [ ] Enable Radar fraud detection
- [ ] Configure email receipts
- [ ] Complete business verification
- [ ] Set up monitoring
- [ ] Document integration

## 📊 Pricing

### Standard Rates (US)
- **Card Payments**: 2.9% + $0.30
- **ACH**: 0.8%, capped at $5
- **International Cards**: +1%
- **Currency Conversion**: +1%

### No Additional Fees
- Subscriptions: Same processing fees
- Refunds: No additional fee
- Disputes: $15 fee only if you lose

## 🌍 Supported Features

### Payment Methods
- Credit/Debit Cards
- Apple Pay, Google Pay
- ACH, SEPA, BACS
- Afterpay, Klarna, Affirm
- 100+ local payment methods

### Currencies
- 135+ currencies supported
- Automatic currency conversion
- Multi-currency pricing

### Regions
- Available in 45+ countries
- Global payment processing
- Local payment methods

## 📚 Resources

### Official Documentation
- **Main Docs**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
- **Testing Guide**: https://stripe.com/docs/testing

### Tools & SDKs
- **Dashboard**: https://dashboard.stripe.com
- **GitHub**: https://github.com/stripe
- **CLI**: https://github.com/stripe/stripe-cli
- **Samples**: https://github.com/stripe-samples

### Support
- **Support Center**: https://support.stripe.com
- **Status Page**: https://status.stripe.com
- **Community**: https://github.com/stripe/stripe-node/discussions

## 🔗 Useful Links

### Dashboard Links
- **API Keys**: https://dashboard.stripe.com/apikeys
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Logs**: https://dashboard.stripe.com/logs
- **Customers**: https://dashboard.stripe.com/customers
- **Payments**: https://dashboard.stripe.com/payments

### Libraries
- **Node.js**: https://www.npmjs.com/package/stripe
- **JavaScript**: https://www.npmjs.com/package/@stripe/stripe-js
- **React**: https://www.npmjs.com/package/@stripe/react-stripe-js
- **Python**: https://pypi.org/project/stripe/
- **Ruby**: https://rubygems.org/gems/stripe
- **PHP**: https://packagist.org/packages/stripe/stripe-php

## 💡 Tips & Best Practices

### Performance
1. Cache API responses when possible
2. Use idempotency keys for retries
3. Implement proper error handling
4. Use webhooks for async updates

### Security
1. Validate all webhooks
2. Use HTTPS only
3. Store minimal payment data
4. Implement rate limiting
5. Log suspicious activity

### User Experience
1. Show clear error messages
2. Support multiple payment methods
3. Provide receipts/confirmations
4. Handle 3D Secure gracefully
5. Optimize checkout flow

## 🐛 Common Issues

### Webhook Verification Failed
**Problem**: Using `express.json()` before webhook route
**Solution**: Use `express.raw()` for webhook endpoint

### CORS Errors
**Problem**: Frontend can't reach backend
**Solution**: Configure CORS properly on your server

### 3D Secure Not Working
**Problem**: Payment stuck on authentication
**Solution**: Ensure you're handling `requires_action` status

### Test Cards Declined
**Problem**: Using wrong test environment
**Solution**: Verify you're using test API keys with test cards

## 📝 Next Steps

1. Read the [Overview](./01-Overview.md) for comprehensive introduction
2. Follow [Getting Started](./02-Getting-Started.md) to set up your first integration
3. Implement [Payment Intents](./03-Payment-Intents.md) for one-time payments
4. Add [Subscriptions](./04-Subscriptions.md) for recurring revenue
5. Set up [Webhooks](./06-Webhooks.md) for reliable event handling
6. Use the [CLI](./07-CLI.md) for efficient development
7. Integrate with [React](./08-React-Integration.md) for frontend

---

**Last Updated**: 2025-01-23
**Stripe API Version**: Latest
**Documentation Status**: Complete

For questions or issues, check the official [Stripe Documentation](https://stripe.com/docs) or [Support Center](https://support.stripe.com).
