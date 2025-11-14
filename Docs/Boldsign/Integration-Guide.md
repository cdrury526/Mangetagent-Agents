# BoldSign Integration Guide

Step-by-step guide for integrating BoldSign into MagnetAgent.

## Prerequisites

1. BoldSign account with API access
2. API key from BoldSign Dashboard
3. Supabase Edge Functions configured
4. Document storage solution (Supabase Storage)

---

## Phase 1: Setup & Configuration

### 1.1 Environment Variables

Add to `.env.local` and Supabase Dashboard → Edge Functions → Secrets:

```env
# BoldSign API
BOLDSIGN_API_KEY=your_api_key_here
BOLDSIGN_BASE_URL=https://api.boldsign.com
BOLDSIGN_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase (already configured)
SUPABASE_URL=https://tlwzpacimgfnziccqnox.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 1.2 Database Schema

Run migration to create BoldSign tables:

```sql
-- BoldSign documents
CREATE TABLE bold_sign_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  bold_sign_document_id text UNIQUE NOT NULL,
  bold_sign_message_id text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'in_progress', 'completed', 'declined', 'expired', 'revoked')),
  signed_pdf_url text,
  audit_trail_url text,
  expires_at timestamp,
  completed_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_bold_sign_documents_agent_id ON bold_sign_documents(agent_id);
CREATE INDEX idx_bold_sign_documents_transaction_id ON bold_sign_documents(transaction_id);
CREATE INDEX idx_bold_sign_documents_status ON bold_sign_documents(status);

-- BoldSign sender identities
CREATE TABLE bold_sign_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  bold_sign_identity_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company_name text,
  title text,
  logo_url text,
  is_default boolean DEFAULT false,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_bold_sign_identities_agent_id ON bold_sign_identities(agent_id);
CREATE UNIQUE INDEX idx_bold_sign_identities_default ON bold_sign_identities(agent_id, is_default) WHERE is_default = true;

-- BoldSign webhook events
CREATE TABLE bold_sign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bold_sign_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  document_id text,
  payload_json jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamp,
  error_message text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX idx_bold_sign_events_document_id ON bold_sign_events(document_id);
CREATE INDEX idx_bold_sign_events_processed ON bold_sign_events(processed);
```

### 1.3 RLS Policies

```sql
-- Users can only access their own documents
ALTER TABLE bold_sign_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON bold_sign_documents FOR SELECT
  USING (agent_id = auth.uid());

-- Users can only access their own identities
ALTER TABLE bold_sign_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own identities"
  ON bold_sign_identities FOR ALL
  USING (agent_id = auth.uid());

-- Webhook events are service role only
ALTER TABLE bold_sign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage events"
  ON bold_sign_events FOR ALL
  USING (auth.role() = 'service_role');
```

---

## Phase 2: Edge Function Setup

### 2.1 Create BoldSign API Client Edge Function

**File:** `supabase/functions/boldsign-api/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BOLDSIGN_API_KEY = Deno.env.get("BOLDSIGN_API_KEY");
const BOLDSIGN_BASE_URL = Deno.env.get("BOLDSIGN_BASE_URL") || "https://api.boldsign.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

async function callBoldSignAPI(endpoint: string, options: RequestInit) {
  const response = await fetch(`${BOLDSIGN_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${BOLDSIGN_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`BoldSign API error: ${error.message || response.statusText}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    const { action, ...params } = await req.json();

    switch (action) {
      case 'sendDocument':
        return await handleSendDocument(params);
      case 'sendOnBehalf':
        return await handleSendOnBehalf(params);
      case 'revokeDocument':
        return await handleRevokeDocument(params);
      case 'getDocument':
        return await handleGetDocument(params);
      case 'downloadDocument':
        return await handleDownloadDocument(params);
      case 'generateSigningLink':
        return await handleGenerateSigningLink(params);
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function handleSendDocument(params: any) {
  // Implementation
}

// ... other handlers
```

### 2.2 Create Webhook Handler Edge Function

**File:** `supabase/functions/boldsign-webhooks/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BOLDSIGN_WEBHOOK_SECRET = Deno.env.get("BOLDSIGN_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function verifyWebhookSignature(body: string, signature: string): boolean {
  // Implement HMAC-SHA256 verification
  // See webhook documentation
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('X-BoldSign-Signature');
  const body = await req.text();

  if (!verifyWebhookSignature(body, signature!)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);

  // Store event
  await supabase.from('bold_sign_events').insert({
    bold_sign_event_id: event.id || event.timestamp,
    event_type: event.event,
    document_id: event.data?.documentId,
    payload_json: event,
  });

  // Process event
  switch (event.event) {
    case 'document.completed':
      await handleDocumentCompleted(event.data);
      break;
    case 'document.declined':
      await handleDocumentDeclined(event.data);
      break;
    // ... other events
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});

async function handleDocumentCompleted(data: any) {
  // Update document status
  await supabase
    .from('bold_sign_documents')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('bold_sign_document_id', data.documentId);

  // Deduct credit
  // Update transaction status
  // Send notification
}
```

---

## Phase 3: Server Actions

### 3.1 Create Server Actions

**File:** `app/actions/boldsign.ts`

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';

export async function sendDocumentForSignature(params: {
  transactionId: string;
  documentId: string;
  signers: Array<{ email: string; firstName: string; lastName: string }>;
  senderIdentityId?: string;
}) {
  // Call Edge Function
  // Store in database
  // Return result
}

export async function revokeDocument(documentId: string) {
  // Call Edge Function
  // Update database
}

export async function getDocumentStatus(documentId: string) {
  // Query database
  // Return status
}

export async function downloadSignedDocument(documentId: string) {
  // Call Edge Function
  // Return download URL
}

export async function generateEmbeddedSigningLink(documentId: string, signerEmail: string) {
  // Call Edge Function
  // Return signing link
}
```

---

## Phase 4: UI Components

### 4.1 Document Send Modal

**File:** `components/boldsign/send-document-modal.tsx`

```typescript
export function SendDocumentModal({ transactionId, documentId, open, onOpenChange }) {
  // Form for signer details
  // Sender identity selector
  // Send button
  // Status display
}
```

### 4.2 Embedded Signing Component

**File:** `components/boldsign/embedded-signing.tsx`

```typescript
export function EmbeddedSigning({ documentId, signerEmail }) {
  // Generate signing link
  // Embed in iframe
  // Handle completion
  // Show status
}
```

### 4.3 Document Status Display

**File:** `components/boldsign/document-status.tsx`

```typescript
export function DocumentStatus({ documentId }) {
  // Fetch status
  // Display status badge
  // Show download buttons
  // Show revoke button (if applicable)
}
```

---

## Phase 5: Webhook Configuration

### 5.1 Configure in BoldSign Dashboard

1. Go to BoldSign Dashboard → Settings → Webhooks
2. Add endpoint: `https://tlwzpacimgfnziccqnox.supabase.co/functions/v1/boldsign-webhooks`
3. Subscribe to events:
   - `document.completed`
   - `document.declined`
   - `document.expired`
   - `document.revoked`
   - `signer.completed`
   - `signer.signed`
   - `signer.viewed`
4. Copy webhook secret

### 5.2 Test Webhooks

Use BoldSign's webhook testing tool or send test events.

---

## Phase 6: Credit Integration

### 6.1 Deduct Credits on Send

When document is sent:
```typescript
await addCredits(agentId, -1, 'send_envelope', documentId);
```

### 6.2 Refund Credits on Revoke

When document is revoked before signing:
```typescript
await addCredits(agentId, 1, 'refund', documentId);
```

---

## Testing Checklist

- [ ] Upload document to BoldSign
- [ ] Send document for signature
- [ ] Send document on-behalf
- [ ] Revoke document
- [ ] Download signed document
- [ ] Download audit trail
- [ ] Generate embedded signing link
- [ ] Receive webhook events
- [ ] Update document status from webhooks
- [ ] Deduct credits on send
- [ ] Refund credits on revoke
- [ ] Create sender identity
- [ ] Use sender identity when sending

---

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Check environment variables
   - Verify API key in BoldSign Dashboard

2. **Webhook Signature Invalid**
   - Verify webhook secret matches
   - Check signature verification logic

3. **Document Not Found**
   - Verify document ID
   - Check if document was deleted

4. **Rate Limiting**
   - Implement exponential backoff
   - Cache responses

5. **iFrame Blocked**
   - Check CSP headers
   - Verify iframe sandbox attributes

---

## Next Steps

1. Deploy Edge Functions
2. Configure webhooks
3. Test end-to-end flow
4. Build UI components
5. Integrate with transaction workflow

