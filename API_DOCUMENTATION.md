# MagnetAgent API Documentation

## Overview

This document provides comprehensive documentation for the MagnetAgent API endpoints. All API endpoints are Supabase Edge Functions that handle payment processing, subscription management, and webhook events.

**Base URL:** `{SUPABASE_URL}/functions/v1`

**Authentication:** Most endpoints require Bearer token authentication using Supabase access tokens.

---

## Table of Contents

1. [Stripe Webhook](#stripe-webhook)
2. [Stripe Checkout](#stripe-checkout)
3. [Stripe Customer Portal](#stripe-customer-portal)
4. [Common Error Responses](#common-error-responses)
5. [Tools & Recommendations](#tools--recommendations)

---

## Stripe Webhook

Handles incoming webhook events from Stripe for subscription and payment updates.

### Endpoint

```
POST /stripe-webhook
```

### Authentication

- **Type:** Stripe webhook signature verification
- **Header:** `stripe-signature`
- **Description:** This endpoint validates webhook signatures using the Stripe webhook secret

### Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `stripe-signature` | string | Yes | Stripe webhook signature for verification |

### Request Body

Stripe sends webhook events as JSON objects. The structure varies by event type.

**Example (checkout.session.completed):**

```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_1234567890",
      "customer": "cus_1234567890",
      "mode": "subscription",
      "payment_status": "paid",
      "subscription": "sub_1234567890"
    }
  }
}
```

### Supported Event Types

| Event Type | Description |
|-----------|-------------|
| `checkout.session.completed` | Triggered when a checkout session is successfully completed |
| `customer.subscription.created` | Triggered when a new subscription is created |
| `customer.subscription.updated` | Triggered when subscription details change |
| `customer.subscription.deleted` | Triggered when a subscription is canceled |
| `customer.updated` | Triggered when customer details are updated |
| `payment_method.attached` | Triggered when a payment method is attached to a customer |
| `payment_method.detached` | Triggered when a payment method is removed |
| `customer.tax_id.created` | Triggered when tax ID is added |
| `customer.tax_id.updated` | Triggered when tax ID is updated |
| `customer.tax_id.deleted` | Triggered when tax ID is removed |
| `billing_portal.configuration.created` | Triggered when portal config is created |
| `billing_portal.configuration.updated` | Triggered when portal config is updated |
| `billing_portal.session.created` | Triggered when a portal session is created |

### Response

**Success (200 OK):**

```json
{
  "received": true
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Webhook signature verification failed: Invalid signature"
}
```

**Error (500 Internal Server Error):**

```json
{
  "error": "Error message describing what went wrong"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Webhook received and processed successfully |
| 204 | OPTIONS preflight request handled |
| 400 | Missing signature or signature verification failed |
| 405 | Method not allowed (only POST accepted) |
| 500 | Internal server error during webhook processing |

### Notes

- Webhook processing happens asynchronously using `EdgeRuntime.waitUntil()`
- The endpoint returns `200 OK` immediately after signature verification
- Failed webhook processing is logged but doesn't affect the response
- Subscriptions are synced from Stripe to maintain data consistency

---

## Stripe Checkout

Creates a Stripe Checkout session for subscriptions or one-time payments.

### Endpoint

```
POST /stripe-checkout
```

### Authentication

- **Type:** Bearer token (Supabase access token)
- **Header:** `Authorization: Bearer {access_token}`

### Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | Bearer token with Supabase access token |
| `Content-Type` | string | Yes | Must be `application/json` |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `price_id` | string | Yes | Stripe price ID (e.g., `price_1234567890`) |
| `success_url` | string | Yes | URL to redirect after successful payment |
| `cancel_url` | string | Yes | URL to redirect if payment is canceled |
| `mode` | string | Yes | Either `subscription` or `payment` |

**Example Request:**

```json
{
  "price_id": "price_1SOVYQ4MuCor2R33C72xRP2k",
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel",
  "mode": "subscription"
}
```

### Response

**Success (200 OK):**

```json
{
  "sessionId": "cs_test_1234567890",
  "url": "https://checkout.stripe.com/c/pay/cs_test_1234567890"
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Missing required parameter price_id"
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Failed to authenticate user"
}
```

**Error (404 Not Found):**

```json
{
  "error": "User not found"
}
```

**Error (500 Internal Server Error):**

```json
{
  "error": "Failed to create customer mapping"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Checkout session created successfully |
| 204 | OPTIONS preflight request handled |
| 400 | Invalid or missing parameters |
| 401 | Authentication failed |
| 404 | User not found |
| 405 | Method not allowed (only POST accepted) |
| 500 | Internal server error |

### Behavior Notes

- **New Customers:** If the user doesn't have a Stripe customer ID, one is automatically created
- **Database Records:** Creates `stripe_customers` and `stripe_subscriptions` records
- **Error Cleanup:** Automatically cleans up Stripe resources if database operations fail
- **Subscription Mode:** Creates subscription tracking records in the database
- **Payment Mode:** Used for one-time payments (handled via webhook after completion)

### Example Usage (JavaScript)

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    price_id: 'price_1SOVYQ4MuCor2R33C72xRP2k',
    success_url: `${window.location.origin}/success`,
    cancel_url: `${window.location.origin}/pricing`,
    mode: 'subscription'
  })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

---

## Stripe Customer Portal

Creates a Stripe Customer Portal session for subscription management.

### Endpoint

```
POST /stripe-portal
```

### Authentication

- **Type:** Bearer token (Supabase access token)
- **Header:** `Authorization: Bearer {access_token}`

### Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | Bearer token with Supabase access token |
| `Content-Type` | string | Yes | Must be `application/json` |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `return_url` | string | Yes | URL to redirect back to after portal session |
| `flow_type` | string | No | Specific portal flow to trigger |
| `configuration_id` | string | No | Custom portal configuration ID |

**Flow Types:**
- `subscription_cancel` - Direct to subscription cancellation
- `subscription_update` - Direct to subscription update
- `subscription_update_confirm` - Direct to subscription update confirmation
- `payment_method_update` - Direct to payment method update

**Example Request:**

```json
{
  "return_url": "https://example.com/settings",
  "flow_type": "payment_method_update"
}
```

### Response

**Success (200 OK):**

```json
{
  "url": "https://billing.stripe.com/p/session/test_1234567890"
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Missing required parameter: return_url"
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Failed to authenticate user"
}
```

**Error (404 Not Found):**

```json
{
  "error": "No Stripe customer found. Please complete a purchase or subscription first."
}
```

**Error (500 Internal Server Error):**

```json
{
  "error": "Error message describing what went wrong"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Portal session created successfully |
| 200 | OPTIONS preflight request handled |
| 400 | Missing or invalid parameters |
| 401 | Authentication failed |
| 404 | No Stripe customer found for user |
| 405 | Method not allowed (only POST accepted) |
| 500 | Internal server error |

### Example Usage (JavaScript)

```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/stripe-portal`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    return_url: `${window.location.origin}/settings`,
    flow_type: 'payment_method_update'
  })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Customer Portal
```

### Portal Capabilities

Users can perform the following actions in the Customer Portal:

- Update payment methods
- View billing history and invoices
- Update subscription plan
- Cancel subscription
- Update billing address
- Download invoices

---

## Common Error Responses

### Authentication Errors

**401 Unauthorized:**
```json
{
  "error": "Failed to authenticate user"
}
```

**Cause:** Invalid or expired access token

**Solution:** Refresh the user's session and retry with a new token

### Validation Errors

**400 Bad Request:**
```json
{
  "error": "Missing required parameter price_id"
}
```

**Cause:** Missing or invalid request parameters

**Solution:** Verify all required fields are included with correct types

### Resource Not Found

**404 Not Found:**
```json
{
  "error": "User not found"
}
```

**Cause:** Referenced resource doesn't exist

**Solution:** Verify the user is authenticated and has completed required steps

### Server Errors

**500 Internal Server Error:**
```json
{
  "error": "Failed to create customer mapping"
}
```

**Cause:** Unexpected server error or external service failure

**Solution:** Check server logs for detailed error information

---

## CORS Configuration

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Client-Info, Apikey
```

All endpoints handle OPTIONS preflight requests.

---

## Environment Variables

The following environment variables are required for the API:

| Variable | Description | Auto-Configured |
|----------|-------------|-----------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

**Note:** Supabase environment variables are automatically available in Edge Functions.

---

## Testing

### Testing Webhooks Locally

1. Install Stripe CLI:
```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

2. Trigger test events:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

### Testing with Stripe Test Cards

Use these test card numbers in Stripe Checkout:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | Requires authentication |

---

## Tools & Recommendations

### Automatic API Documentation Generation

#### 1. **OpenAPI / Swagger**

Generate OpenAPI 3.0 specifications for your Edge Functions.

**Benefits:**
- Industry standard format
- Interactive documentation with Swagger UI
- Automatic client SDK generation
- Request/response validation

**Implementation:**
```typescript
// Add to your Edge Function
export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'MagnetAgent API',
    version: '1.0.0',
  },
  paths: {
    '/stripe-checkout': {
      post: {
        summary: 'Create Stripe Checkout session',
        // ... more details
      }
    }
  }
};
```

**Tools:**
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - Interactive API explorer
- [Redoc](https://github.com/Redocly/redoc) - Beautiful API documentation
- [Stoplight](https://stoplight.io/) - API design and documentation platform

#### 2. **Postman**

Create a Postman collection for your API.

**Benefits:**
- Easy testing and debugging
- Share collections with team members
- Auto-generate documentation
- Environment variable management

**Setup:**
1. Create a new collection in Postman
2. Add requests for each endpoint
3. Document with examples
4. Publish documentation publicly or privately

**Export Collection:**
```json
{
  "info": {
    "name": "MagnetAgent API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Stripe Checkout",
      "request": {
        "method": "POST",
        "url": "{{SUPABASE_URL}}/functions/v1/stripe-checkout"
      }
    }
  ]
}
```

#### 3. **TypeDoc (for TypeScript)**

Generate documentation from TypeScript type definitions.

**Installation:**
```bash
npm install --save-dev typedoc
```

**Configuration:**
```json
{
  "entryPoints": ["./supabase/functions"],
  "out": "docs/api"
}
```

**Generate:**
```bash
npx typedoc
```

#### 4. **API Blueprint**

Markdown-based API documentation format.

**Example:**
```markdown
# POST /stripe-checkout

Create a Stripe Checkout session

+ Request (application/json)
    + Headers
        Authorization: Bearer {token}

    + Body
        {
            "price_id": "price_123",
            "mode": "subscription"
        }

+ Response 200 (application/json)
    {
        "sessionId": "cs_123",
        "url": "https://checkout.stripe.com/..."
    }
```

**Tools:**
- [Apiary](https://apiary.io/) - API design and documentation
- [Dredd](https://dredd.org/) - API testing tool

#### 5. **Docusaurus**

Build a documentation website with versioning support.

**Benefits:**
- Beautiful documentation sites
- Markdown-based content
- Version control
- Search functionality
- Dark mode support

**Installation:**
```bash
npx create-docusaurus@latest docs classic
```

#### 6. **Mintlify**

Modern documentation platform with great developer experience.

**Features:**
- Auto-generated API references
- Code snippets in multiple languages
- Interactive API playground
- Analytics

**Website:** https://mintlify.com/

### Recommended Approach for MagnetAgent

**Short Term:**
1. Use this Markdown documentation as the foundation
2. Create a Postman collection for testing
3. Export Postman collection as public documentation

**Long Term:**
1. Implement OpenAPI 3.0 specifications
2. Use Swagger UI or Redoc for interactive docs
3. Generate TypeScript types from OpenAPI spec
4. Consider Docusaurus or Mintlify for public docs site

### Monitoring & Analytics

**Recommended Tools:**

1. **Supabase Logs**
   - Built-in logging for Edge Functions
   - View in Supabase Dashboard

2. **Sentry**
   - Error tracking and monitoring
   - Performance monitoring
   - Release tracking

3. **Better Stack (formerly Logtail)**
   - Real-time log aggregation
   - Alerting and notifications
   - Log search and filtering

4. **Stripe Dashboard**
   - View webhook delivery status
   - Test webhook events
   - Monitor API usage

---

## Changelog

### Version 1.0.0 (Current)

- Initial API documentation
- Three core endpoints: webhook, checkout, portal
- Stripe integration for payments and subscriptions
- Bearer token authentication
- CORS support for all endpoints

---

## Support

For API support or questions:

- **Documentation:** This file
- **Stripe Documentation:** https://stripe.com/docs
- **Supabase Documentation:** https://supabase.com/docs

---

## Appendix: Database Schema

### stripe_customers

| Column | Type | Description |
|--------|------|-------------|
| `agent_id` | uuid | User ID (foreign key to profiles) |
| `stripe_customer_id` | text | Stripe customer ID |
| `created_at` | timestamptz | Record creation timestamp |

### stripe_subscriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `agent_id` | uuid | User ID (foreign key to profiles) |
| `stripe_customer_id` | text | Stripe customer ID |
| `stripe_subscription_id` | text | Stripe subscription ID |
| `status` | text | Subscription status |
| `plan` | text | Plan type (free, monthly, annual) |
| `current_period_start` | timestamptz | Billing period start |
| `current_period_end` | timestamptz | Billing period end |
| `canceled_at` | timestamptz | Cancellation timestamp |

### stripe_orders

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `checkout_session_id` | text | Stripe checkout session ID |
| `payment_intent_id` | text | Stripe payment intent ID |
| `customer_id` | text | Stripe customer ID |
| `amount_subtotal` | bigint | Amount before tax/fees |
| `amount_total` | bigint | Total amount paid |
| `currency` | text | Payment currency |
| `payment_status` | text | Payment status |
| `status` | text | Order status |

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Maintained By:** MagnetAgent Development Team
