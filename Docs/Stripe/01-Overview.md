# Stripe Documentation Overview

## What is Stripe?

Stripe is a comprehensive payment processing platform that enables businesses to accept payments, manage subscriptions, and handle complex financial operations.

## Core Features

### 1. Payment Processing
- **Credit & Debit Cards** - Accept cards from around the world
- **Digital Wallets** - Apple Pay, Google Pay, Link
- **Bank Transfers** - ACH, SEPA, BACS
- **Buy Now, Pay Later** - Afterpay, Klarna, Affirm
- **Local Payment Methods** - 100+ payment methods globally

### 2. Subscriptions & Billing
- Recurring billing
- Usage-based pricing
- Metered billing
- Trial periods
- Proration
- Invoice management
- Customer portal

### 3. Stripe Connect
- Marketplace payments
- Platform integrations
- Multi-party payments
- Payouts to connected accounts
- Identity verification

### 4. Financial Operations
- Payouts
- Refunds & Disputes
- Tax calculations
- Revenue recognition
- Financial reporting
- Reconciliation

### 5. Security & Compliance
- PCI DSS Level 1 certified
- Strong Customer Authentication (SCA)
- 3D Secure 2
- Fraud detection (Radar)
- Data encryption
- Compliance tools

## Key Concepts

### API Keys

**Publishable Key** (Client-side)
- Safe to expose in frontend code
- Used for tokenizing payment information
- Format: `pk_test_...` or `pk_live_...`

**Secret Key** (Server-side)
- Must be kept secure
- Used for server-side API calls
- Format: `sk_test_...` or `sk_live_...`

**Restricted Keys**
- Limited permissions
- For specific use cases
- Format: `rk_test_...` or `rk_live_...`

### Test vs Live Mode

**Test Mode**
- Use test API keys (`pk_test_...`, `sk_test_...`)
- Test card numbers (e.g., `4242 4242 4242 4242`)
- No real money involved
- Full feature access

**Live Mode**
- Use live API keys (`pk_live_...`, `sk_live_...`)
- Real transactions
- Real money processing
- Requires business verification

### Core Objects

**Customer**
- Represents a buyer
- Stores payment methods
- Links to subscriptions
- Metadata and notes

**Payment Method**
- Card, bank account, wallet
- Attached to customers
- Reusable or one-time

**Payment Intent**
- Tracks payment lifecycle
- Handles authentication
- Supports multiple payment methods
- Status tracking

**Charge** (Legacy)
- Direct card charge
- Less flexible than Payment Intents
- Being phased out

**Subscription**
- Recurring payments
- Multiple price tiers
- Trial periods
- Billing cycles

**Invoice**
- Generated for subscriptions
- Manual invoicing
- Payment tracking
- Downloadable PDFs

**Product & Price**
- Product catalog
- Pricing models
- Recurring or one-time
- Currency support

## Architecture Patterns

### Payment Acceptance Flow

```
1. Client creates Payment Intent (server-side)
   ↓
2. Client renders payment form (client-side)
   ↓
3. User enters payment details
   ↓
4. Stripe.js tokenizes payment (client-side)
   ↓
5. Payment confirmed (server-side)
   ↓
6. Webhook notification (server-side)
```

### Subscription Flow

```
1. Create Customer (server-side)
   ↓
2. Attach Payment Method (client or server)
   ↓
3. Create Subscription (server-side)
   ↓
4. Invoice created automatically
   ↓
5. Payment collected
   ↓
6. Webhook notifications
```

### Checkout Session Flow

```
1. Create Checkout Session (server-side)
   ↓
2. Redirect to Stripe Checkout (hosted)
   ↓
3. Customer completes payment
   ↓
4. Redirect back to your site
   ↓
5. Webhook confirms payment
```

## SDKs & Libraries

### Official Server SDKs
- **Node.js** - `stripe` npm package
- **Python** - `stripe` pip package
- **Ruby** - `stripe` gem
- **PHP** - `stripe/stripe-php`
- **Java** - `com.stripe:stripe-java`
- **Go** - `github.com/stripe/stripe-go`
- **.NET** - `Stripe.net`

### Official Client Libraries
- **JavaScript** - `@stripe/stripe-js`
- **React** - `@stripe/react-stripe-js`
- **React Native** - `@stripe/stripe-react-native`
- **iOS** - Stripe iOS SDK
- **Android** - Stripe Android SDK

### Tools
- **CLI** - `stripe-cli` for testing and development
- **Dashboard** - Web-based management console

## Development Tools

### Stripe CLI

```bash
# Install
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Listen to webhooks locally
stripe listen --forward-to localhost:3000/webhook

# Trigger events
stripe trigger payment_intent.succeeded

# Make API requests
stripe customers list
```

### Testing

**Test Cards**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

**Test Mode Features**
- All API features available
- No actual charges
- Test webhooks
- Simulate scenarios

## Webhooks

Stripe sends HTTP POST requests to notify your application of events:

```javascript
// Event types
payment_intent.succeeded
payment_intent.payment_failed
customer.subscription.created
customer.subscription.updated
invoice.paid
charge.refunded
```

### Webhook Security

```javascript
const sig = request.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  request.body,
  sig,
  webhookSecret
);
```

## Common Integration Patterns

### 1. One-Time Payment
- Create Payment Intent
- Collect payment details
- Confirm payment
- Handle webhook

### 2. Subscription
- Create Customer
- Create Subscription
- Collect payment method
- Handle recurring billing

### 3. Marketplace/Platform
- Use Stripe Connect
- Onboard sellers
- Split payments
- Manage payouts

### 4. Checkout (Hosted)
- Create Checkout Session
- Redirect to Stripe
- Handle success/cancel

## Pricing

### Processing Fees
- **Card payments**: 2.9% + $0.30 (standard US pricing)
- **ACH**: 0.8%, capped at $5
- **International cards**: +1%
- **Currency conversion**: +1%

### Subscriptions
- No additional fee for subscriptions
- Same processing fees apply

### Connect
- Additional 0.25% - 2% platform fee
- Depends on integration type

## Best Practices

### Security
1. Never expose secret keys
2. Use HTTPS for all requests
3. Validate webhook signatures
4. Store minimal payment data
5. Use payment tokens, not raw card data

### Performance
1. Cache API responses when possible
2. Use idempotency keys for retries
3. Implement proper error handling
4. Use webhooks for async updates

### User Experience
1. Show clear payment errors
2. Support multiple payment methods
3. Provide receipt/confirmation
4. Handle SCA (3D Secure) properly
5. Optimize checkout flow

## Resources

- **Dashboard**: https://dashboard.stripe.com
- **Documentation**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
- **GitHub**: https://github.com/stripe
- **Support**: https://support.stripe.com
- **Status**: https://status.stripe.com

## Next Steps

1. **[Getting Started](./02-Getting-Started.md)** - Quick setup guide
2. **[Payment Intents](./03-Payment-Intents.md)** - Accept one-time payments
3. **[Subscriptions](./04-Subscriptions.md)** - Recurring billing
4. **[Checkout](./05-Checkout.md)** - Hosted payment page
5. **[Webhooks](./06-Webhooks.md)** - Event handling
6. **[CLI](./07-CLI.md)** - Development tools
7. **[React Integration](./08-React-Integration.md)** - Frontend components
8. **[Testing](./09-Testing.md)** - Test mode and best practices

## Official Links

- Website: https://stripe.com
- Docs: https://stripe.com/docs
- API: https://stripe.com/docs/api
- GitHub: https://github.com/stripe
