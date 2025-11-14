# BoldSign Webhooks Reference

Complete guide to BoldSign webhook events and handling.

## Overview

BoldSign sends webhook events to notify your application about document status changes and signer actions.

**Webhook Endpoint:** `https://your-domain.com/api/webhooks/boldsign`

**Signature Verification:** Required - BoldSign signs all webhooks with HMAC-SHA256

---

## Setup

### 1. Configure Webhook Endpoint

In BoldSign Dashboard:
1. Go to Settings → Webhooks
2. Click "Add Webhook"
3. Enter endpoint URL: `https://tlwzpacimgfnziccqnox.supabase.co/functions/v1/boldsign-webhooks`
4. Select events to subscribe
5. Copy webhook secret

### 2. Store Webhook Secret

Add to Supabase Edge Functions secrets:
```env
BOLDSIGN_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Signature Verification

BoldSign signs webhooks using HMAC-SHA256.

### Verification Code

```typescript
import { createHmac } from 'https://deno.land/std@0.208.0/node/crypto.ts';

function verifyBoldSignSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  const computedSignature = hmac.digest('hex');
  
  // BoldSign sends signature in format: sha256=xxx
  const receivedSignature = signature.replace('sha256=', '');
  
  // Constant-time comparison
  return computedSignature === receivedSignature;
}
```

### Edge Function Implementation

```typescript
Deno.serve(async (req) => {
  const signature = req.headers.get('X-BoldSign-Signature');
  const body = await req.text();
  
  if (!verifyBoldSignSignature(body, signature!, BOLDSIGN_WEBHOOK_SECRET!)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(body);
  // Process event...
});
```

---

## Event Types

### Document Events

#### `document.completed`

**Triggered:** When all signers have completed signing the document.

**Payload:**
```json
{
  "event": "document.completed",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "doc_123",
    "status": "completed",
    "completedAt": "2025-11-01T12:00:00Z",
    "signers": [
      {
        "email": "signer1@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "signedAt": "2025-11-01T12:00:00Z"
      }
    ],
    "sender": {
      "email": "sender@example.com",
      "name": "Jane Smith"
    }
  }
}
```

**Handler:**
```typescript
async function handleDocumentCompleted(data: any) {
  // 1. Update document status
  await supabase
    .from('bold_sign_documents')
    .update({
      status: 'completed',
      completed_at: data.completedAt
    })
    .eq('bold_sign_document_id', data.documentId);

  // 2. Download signed PDF
  const signedPdf = await downloadSignedDocument(data.documentId);
  await supabase
    .from('bold_sign_documents')
    .update({ signed_pdf_url: signedPdf.url })
    .eq('bold_sign_document_id', data.documentId);

  // 3. Update transaction status
  const { data: doc } = await supabase
    .from('bold_sign_documents')
    .select('transaction_id')
    .eq('bold_sign_document_id', data.documentId)
    .single();

  if (doc?.transaction_id) {
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', doc.transaction_id);
  }

  // 4. Send notification to user
  await sendNotification(doc.agent_id, 'Document signed successfully');
}
```

---

#### `document.declined`

**Triggered:** When a signer declines to sign the document.

**Payload:**
```json
{
  "event": "document.declined",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "doc_123",
    "status": "declined",
    "declinedAt": "2025-11-01T12:00:00Z",
    "declinedBy": {
      "email": "signer@example.com",
      "reason": "Terms not acceptable"
    }
  }
}
```

**Handler:**
```typescript
async function handleDocumentDeclined(data: any) {
  // Update document status
  await supabase
    .from('bold_sign_documents')
    .update({
      status: 'declined',
      completed_at: data.declinedAt
    })
    .eq('bold_sign_document_id', data.documentId);

  // Refund credit (if policy allows)
  const { data: doc } = await supabase
    .from('bold_sign_documents')
    .select('agent_id')
    .eq('bold_sign_document_id', data.documentId)
    .single();

  // Only refund if declined immediately (not after partial signing)
  await addCredits(doc.agent_id, 1, 'refund', data.documentId);

  // Notify user
  await sendNotification(doc.agent_id, 'Document was declined');
}
```

---

#### `document.expired`

**Triggered:** When a document expires without being signed.

**Payload:**
```json
{
  "event": "document.expired",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "doc_123",
    "status": "expired",
    "expiredAt": "2025-11-01T12:00:00Z"
  }
}
```

**Handler:**
```typescript
async function handleDocumentExpired(data: any) {
  await supabase
    .from('bold_sign_documents')
    .update({
      status: 'expired',
      completed_at: data.expiredAt
    })
    .eq('bold_sign_document_id', data.documentId);

  // Optionally refund credit
  // Notify user to resend
}
```

---

#### `document.revoked`

**Triggered:** When a document is revoked by the sender.

**Payload:**
```json
{
  "event": "document.revoked",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "doc_123",
    "status": "revoked",
    "revokedAt": "2025-11-01T12:00:00Z",
    "revokeReason": "Terms updated"
  }
}
```

**Handler:**
```typescript
async function handleDocumentRevoked(data: any) {
  await supabase
    .from('bold_sign_documents')
    .update({
      status: 'revoked',
      completed_at: data.revokedAt
    })
    .eq('bold_sign_document_id', data.documentId);

  // Refund credit
  const { data: doc } = await supabase
    .from('bold_sign_documents')
    .select('agent_id')
    .eq('bold_sign_document_id', data.documentId)
    .single();

  await addCredits(doc.agent_id, 1, 'refund', data.documentId);
}
```

---

### Signer Events

#### `signer.completed`

**Triggered:** When an individual signer completes their part.

**Payload:**
```json
{
  "event": "signer.completed",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "doc_123",
    "signer": {
      "email": "signer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "signedAt": "2025-11-01T12:00:00Z"
    },
    "remainingSigners": 0
  }
}
```

**Use Case:** Track progress for multi-signer documents.

---

#### `signer.signed`

**Triggered:** When a signer signs the document (before completion).

**Payload:**
```json
{
  "event": "signer.signed",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "doc_123",
    "signer": {
      "email": "signer@example.com",
      "signedAt": "2025-11-01T12:00:00Z"
    }
  }
}
```

---

#### `signer.viewed`

**Triggered:** When a signer views the document for the first time.

**Payload:**
```json
{
  "event": "signer.viewed",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "doc_123",
    "signer": {
      "email": "signer@example.com",
      "viewedAt": "2025-11-01T12:00:00Z"
    }
  }
}
```

**Use Case:** Track engagement, send reminders if not signed after viewing.

---

#### `signer.declined`

**Triggered:** When a signer declines to sign.

**Payload:**
```json
{
  "event": "signer.declined",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "doc_123",
    "signer": {
      "email": "signer@example.com",
      "declinedAt": "2025-11-01T12:00:00Z",
      "reason": "Terms not acceptable"
    }
  }
}
```

---

## Webhook Handler Implementation

### Complete Edge Function

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BOLDSIGN_WEBHOOK_SECRET = Deno.env.get("BOLDSIGN_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function verifySignature(body: string, signature: string): boolean {
  // Implementation above
}

async function storeEvent(event: any) {
  await supabase.from('bold_sign_events').insert({
    bold_sign_event_id: event.id || `${event.event}_${Date.now()}`,
    event_type: event.event,
    document_id: event.data?.documentId,
    payload_json: event,
  });
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('bold_sign_events')
    .select('processed')
    .eq('bold_sign_event_id', eventId)
    .single();
  
  return data?.processed || false;
}

async function markEventProcessed(eventId: string) {
  await supabase
    .from('bold_sign_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('bold_sign_event_id', eventId);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const signature = req.headers.get('X-BoldSign-Signature');
    const body = await req.text();

    if (!signature || !verifySignature(body, signature)) {
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    
    // Store event
    await storeEvent(event);

    // Check idempotency
    const eventId = event.id || `${event.event}_${Date.now()}`;
    if (await isEventProcessed(eventId)) {
      return new Response(JSON.stringify({ received: true, message: 'Already processed' }), { status: 200 });
    }

    // Process event
    switch (event.event) {
      case 'document.completed':
        await handleDocumentCompleted(event.data);
        break;
      case 'document.declined':
        await handleDocumentDeclined(event.data);
        break;
      case 'document.expired':
        await handleDocumentExpired(event.data);
        break;
      case 'document.revoked':
        await handleDocumentRevoked(event.data);
        break;
      case 'signer.completed':
        await handleSignerCompleted(event.data);
        break;
      case 'signer.signed':
        await handleSignerSigned(event.data);
        break;
      case 'signer.viewed':
        await handleSignerViewed(event.data);
        break;
      case 'signer.declined':
        await handleSignerDeclined(event.data);
        break;
      default:
        console.log(`Unhandled event: ${event.event}`);
    }

    // Mark as processed
    await markEventProcessed(eventId);

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
```

---

## Testing Webhooks

### Using BoldSign Dashboard

1. Go to Settings → Webhooks
2. Click "Send Test Event"
3. Select event type
4. Verify received in your endpoint

### Using curl

```bash
curl -X POST https://your-endpoint.com/api/webhooks/boldsign \
  -H "Content-Type: application/json" \
  -H "X-BoldSign-Signature: sha256=xxx" \
  -d '{
    "event": "document.completed",
    "data": {
      "documentId": "test_doc_123"
    }
  }'
```

---

## Best Practices

1. **Always verify signatures** - Never trust unsigned webhooks
2. **Implement idempotency** - Handle duplicate events gracefully
3. **Store all events** - Audit trail for debugging
4. **Respond quickly** - Return 200 immediately, process async
5. **Handle errors gracefully** - Log errors, don't crash
6. **Retry failed processing** - Use queue for retries
7. **Monitor webhook health** - Alert on failures

---

## Monitoring

### Check Recent Events

```sql
SELECT 
  event_type,
  document_id,
  processed,
  processed_at,
  error_message,
  created_at
FROM bold_sign_events
ORDER BY created_at DESC
LIMIT 20;
```

### Check Failed Events

```sql
SELECT *
FROM bold_sign_events
WHERE processed = false OR error_message IS NOT NULL
ORDER BY created_at DESC;
```

### Event Statistics

```sql
SELECT 
  event_type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE processed = true) as processed_count,
  COUNT(*) FILTER (WHERE error_message IS NOT NULL) as error_count
FROM bold_sign_events
GROUP BY event_type;
```

