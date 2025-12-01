# Third-Party Integrations

## Supabase

### Database Schema (Key Tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles linked to auth.users | `id`, `agent_id`, `email`, `full_name` |
| `transactions` | Real estate transactions | `id`, `agent_id`, `status`, `property_address`, `price` |
| `contacts` | People involved in transactions | `id`, `agent_id`, `name`, `email`, `role` |
| `documents` | Document metadata | `id`, `agent_id`, `transaction_id`, `name`, `storage_path` |
| `tasks` | Transaction tasks with hierarchy | `id`, `agent_id`, `transaction_id`, `parent_id`, `status` |

### Transaction Status Flow

```
prospecting → pending → active → under_contract → inspection → appraisal → closing → closed
                                                                                    ↓
                                                                              (cancelled)
```

### RLS Policy Pattern

All tables enforce agent isolation:
```sql
CREATE POLICY "Users can only access their own data"
ON table_name FOR ALL
USING (agent_id = auth.uid());
```

## Stripe Integration

### Location
Edge Functions in `supabase/functions/`:
- `create-checkout-session` - Subscription checkout
- `create-payment-intent` - One-time payments
- `stripe-webhook` - Webhook handler
- `customer-portal` - Billing portal

### Webhook Events Handled
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Plan changes
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_failed` - Failed payment

### Frontend Pattern
```typescript
// Always create PaymentIntent/CheckoutSession server-side
const { data } = await supabase.functions.invoke('create-checkout-session', {
  body: { priceId, successUrl, cancelUrl }
});
// Then redirect or use Stripe.js
```

## BoldSign Integration

### Location
Edge Functions in `supabase/functions/`:
- `boldsign-send` - Send document for signing
- `boldsign-webhook` - Webhook handler
- `boldsign-download` - Download signed PDF
- `boldsign-embedded` - Get embedded signing URL

### OAuth Token Pattern
```typescript
// Token cached for 1 hour in Edge Function
const token = await getBoldSignToken(); // Checks cache first
```

### Webhook Events Handled
- `document.sent` - Document sent to signers
- `document.signed` - Signer completed
- `document.completed` - All signatures collected
- `document.declined` - Signer declined
- `document.expired` - Document expired

### Webhook Security
```typescript
// ALWAYS verify HMAC-SHA256 signature
const isValid = verifyBoldSignWebhook(payload, signature, secretKey);
if (!isValid) return new Response('Invalid signature', { status: 401 });
```

### Embedded Signing Pattern
```typescript
// 1. Get embedded URL from Edge Function
const { url } = await supabase.functions.invoke('boldsign-embedded', {
  body: { documentId, signerEmail }
});

// 2. Open in iframe or redirect
<iframe src={url} />

// 3. Listen for postMessage completion
window.addEventListener('message', handleSigningComplete);
```

## Google Maps

### Usage
Address autocomplete for property addresses in transaction forms.

### Frontend Only
```typescript
// Loaded via script tag with VITE_GOOGLE_MAPS_API_KEY
const autocomplete = new google.maps.places.Autocomplete(inputRef.current);
```
