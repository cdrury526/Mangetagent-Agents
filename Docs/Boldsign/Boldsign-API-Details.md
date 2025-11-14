# BoldSign API Integration for Multi-Tenant SaaS

**Your SaaS application can leverage BoldSign's unique multi-tenant architecture to enable custom-branded e-signatures for each user without requiring separate BoldSign accounts.** The platform uses a single API key combined with Sender Identities—allowing unlimited tenants at just $0.75 per document sent, with no per-tenant licensing fees. BoldSign provides official Node.js SDK, comprehensive OAuth 2.0 support, and embedded signing capabilities that integrate seamlessly with Next.js and Supabase Edge Functions. The key insight: each tenant gets their own branding and sender identity, but your application manages everything through one account, potentially saving hundreds of thousands compared to competitors requiring per-tenant subscriptions.

For implementation, you'll use OAuth Client Credentials flow (not basic API keys) for production security, store credentials in Supabase secrets manager, and leverage Edge Functions for scalable serverless processing. The critical architectural decision is whether to use shared credentials with metadata-based tenant tracking (recommended for most cases) or per-tenant credential storage (for highest isolation requirements). BoldSign's webhook system enables real-time document status tracking, while Row Level Security (RLS) policies in Supabase ensure proper tenant isolation at the database layer.

## Multi-tenant authentication architecture

BoldSign's authentication supports two primary methods: **API Keys** (simple, server-side only) and **OAuth 2.0** (recommended, with automatic token rotation). For multi-tenant SaaS applications, the optimal pattern is **OAuth Client Credentials flow** combined with **Sender Identities**—this single-account, multi-identity model is BoldSign's designed solution for platforms like yours.

**Authentication Pattern (OAuth Client Credentials - Recommended):**

```typescript
// Supabase Edge Function: Obtain and cache access token
const getAccessToken = async (): Promise<string> => {
  const clientId = Deno.env.get('BOLDSIGN_CLIENT_ID')!;
  const clientSecret = Deno.env.get('BOLDSIGN_CLIENT_SECRET')!;
  
  const tokenResponse = await fetch('https://account.boldsign.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'BoldSign.Documents.All BoldSign.SenderIdentity.All'
    })
  });
  
  const { access_token, expires_in } = await tokenResponse.json();
  // TODO: Cache token with TTL of expires_in seconds (typically 3600)
  return access_token;
};
```

**Why OAuth over API Keys:** Access tokens expire automatically after 1 hour, eliminating manual rotation requirements. OAuth provides granular scopes (like `BoldSign.Documents.Create` vs `BoldSign.Documents.All`), follows industry security standards, and supports refresh tokens for long-running processes. API keys are simpler but require manual rotation every 30-90 days and lack scope-based permissions.

**Multi-Tenant Architecture Using Single API Key:** BoldSign's Sender Identity feature allows one account to send documents on behalf of unlimited users. Each tenant gets their own sender identity with custom branding, but your platform manages everything through a single set of credentials. The key is the `OnBehalfOf` parameter in document send requests—specify which sender identity to use, and recipients see that identity as the sender (not your account).

## Sender Identity implementation and branding

Sender Identities enable your platform to send e-signature requests that appear to come from your users' email addresses with their custom branding. **Critical point: users don't need BoldSign accounts**—they simply approve your platform to send on their behalf via email verification.

**Creating a Sender Identity:**

```typescript
// Create sender identity for a new tenant
const createSenderIdentity = async (tenantData: {
  name: string;
  email: string;
  tenantId: string;
  brandId: string;
}) => {
  const accessToken = await getAccessToken();
  
  const response = await fetch('https://api.boldsign.com/v1/senderIdentities/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Name: tenantData.name,
      Email: tenantData.email,
      BrandId: tenantData.brandId,
      RedirectUrl: `https://yourapp.com/settings/integrations`,
      NotificationSettings: {
        Viewed: true,
        Sent: false,
        Completed: true,
        Signed: true,
        Declined: true,
        Expired: true,
        AttachSignedDocument: true
      },
      MetaData: {
        TenantId: tenantData.tenantId,
        AccountPlan: 'Premium'
      }
    })
  });
  
  const { senderIdentityId } = await response.json();
  return senderIdentityId;
};
```

**Approval Workflow:** When you create a sender identity, BoldSign sends an approval email to that email address. The user clicks the approval link, and the identity becomes active. Your platform can then send documents using `OnBehalfOf: "user@example.com"`. If the user hasn't approved yet, document send requests will fail—implement status checking and resend invitation functionality.

**Custom Branding Per Tenant:** Create a separate brand for each tenant with their logo, colors, and custom domain. This ensures complete white-labeling:

```typescript
// Create brand for tenant
const createTenantBrand = async (brandData: {
  name: string;
  logoFile: Blob;
  backgroundColor: string;
  buttonColor: string;
  emailDisplayName: string;
}) => {
  const accessToken = await getAccessToken();
  const formData = new FormData();
  
  formData.append('BrandName', brandData.name);
  formData.append('BrandLogo', brandData.logoFile);
  formData.append('BackgroundColor', brandData.backgroundColor);
  formData.append('ButtonColor', brandData.buttonColor);
  formData.append('ButtonTextColor', '#FFFFFF');
  formData.append('EmailDisplayName', brandData.emailDisplayName);
  formData.append('IsDefault', 'false');
  
  const response = await fetch('https://api.boldsign.com/v1/brand/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });
  
  const { brandId } = await response.json();
  return brandId;
};
```

**Notification Management:** Each sender identity has independent notification settings. Configure which events trigger emails to the tenant (document viewed, signed, completed). The `AttachSignedDocument` setting controls whether the completed PDF is attached to completion emails—critical for users who want immediate access without logging into your platform.

## Sending documents with Next.js integration

Next.js offers three approaches for BoldSign integration: **API Routes** (for webhooks and external access), **Server Actions** (for form submissions and internal mutations), and **Server Components** (for SSR data fetching). Choose based on your architecture needs.

**Server Action Pattern (Recommended for Forms):**

```typescript
// app/actions/send-document.ts
'use server';

import { DocumentApi, SendForSign, DocumentSigner, FormField, Rectangle } from 'boldsign';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function sendDocumentAction(formData: FormData) {
  // Get authenticated user and tenant
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const { data: tenant } = await supabase
    .from('user_tenants')
    .select('tenant_id, sender_identity_email, brand_id')
    .eq('user_id', user.id)
    .single();
  
  // Initialize BoldSign SDK
  const documentApi = new DocumentApi();
  const accessToken = await getAccessToken(); // From previous section
  documentApi.setDefaultAuthentication(accessToken);
  
  // Extract form data
  const signerName = formData.get('signerName') as string;
  const signerEmail = formData.get('signerEmail') as string;
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Configure signature field
  const bounds = new Rectangle();
  bounds.x = 100;
  bounds.y = 100;
  bounds.width = 200;
  bounds.height = 50;
  
  const formField = new FormField();
  formField.fieldType = FormField.FieldTypeEnum.Signature;
  formField.pageNumber = 1;
  formField.bounds = bounds;
  formField.isRequired = true;
  
  // Configure signer
  const documentSigner = new DocumentSigner();
  documentSigner.name = signerName;
  documentSigner.emailAddress = signerEmail;
  documentSigner.signerType = DocumentSigner.SignerTypeEnum.Signer;
  documentSigner.formFields = [formField];
  
  // Prepare document
  const sendForSign = new SendForSign();
  sendForSign.title = `Agreement - ${tenant.tenant_id}`;
  sendForSign.signers = [documentSigner];
  sendForSign.files = [buffer];
  sendForSign.onBehalfOf = tenant.sender_identity_email; // Multi-tenant key
  sendForSign.brandId = tenant.brand_id; // Tenant branding
  sendForSign.expiryDays = 30;
  sendForSign.enableSigningOrder = false;
  sendForSign.disableEmails = false;
  sendForSign.metadata = {
    TenantId: tenant.tenant_id,
    UserId: user.id,
    Environment: 'production'
  };
  
  try {
    const response = await documentApi.sendDocument(sendForSign);
    
    // Store reference in database
    await supabase.from('documents').insert({
      boldsign_document_id: response.documentId,
      tenant_id: tenant.tenant_id,
      user_id: user.id,
      signer_email: signerEmail,
      status: 'sent',
      created_at: new Date().toISOString()
    });
    
    revalidatePath('/documents');
    return { success: true, documentId: response.documentId };
    
  } catch (error) {
    console.error('BoldSign send error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send document' 
    };
  }
}
```

**Client Component Usage:**

```typescript
'use client';

import { sendDocumentAction } from '@/app/actions/send-document';
import { useFormState, useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Sending...' : 'Send for Signature'}
    </button>
  );
}

export default function SendDocumentForm() {
  const [state, formAction] = useFormState(sendDocumentAction, null);
  
  return (
    <form action={formAction} className="space-y-4">
      <input 
        type="text" 
        name="signerName" 
        placeholder="Signer Name" 
        required 
      />
      <input 
        type="email" 
        name="signerEmail" 
        placeholder="signer@example.com" 
        required 
      />
      <input 
        type="file" 
        name="file" 
        accept=".pdf" 
        required 
      />
      <SubmitButton />
      
      {state?.success && (
        <div className="text-green-600">
          Document sent! ID: {state.documentId}
        </div>
      )}
      {state?.error && (
        <div className="text-red-600">Error: {state.error}</div>
      )}
    </form>
  );
}
```

**API Route Pattern (For Webhooks):**

```typescript
// app/api/webhooks/boldsign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import crypto from 'crypto';

// Verify webhook signature
function verifySignature(signature: string, payload: string, secret: string): boolean {
  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.trim().split('=');
    if (key === 't') acc.timestamp = parseInt(value);
    if (key === 's0') acc.signatures.push(value);
    return acc;
  }, { timestamp: 0, signatures: [] as string[] });
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${parts.timestamp}.${payload}`)
    .digest('hex');
  
  return parts.signatures.some(sig => 
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature))
  );
}

export async function POST(req: NextRequest) {
  const eventType = req.headers.get('x-boldsign-event');
  
  // Handle verification request
  if (eventType === 'Verification') {
    return NextResponse.json({ received: true });
  }
  
  // Verify signature
  const signature = req.headers.get('x-boldsign-signature')!;
  const payload = await req.text();
  const secret = process.env.BOLDSIGN_WEBHOOK_SECRET!;
  
  if (!verifySignature(signature, payload, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }
  
  // Parse event
  const event = JSON.parse(payload);
  const { documentId } = event.data;
  
  // Update database based on event type
  const supabase = createServerSupabaseClient();
  
  switch (event.event.eventType) {
    case 'Completed':
      await supabase
        .from('documents')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('boldsign_document_id', documentId);
      
      // Download completed document
      const documentApi = new DocumentApi();
      documentApi.setDefaultAuthentication(await getAccessToken());
      const signedDoc = await documentApi.downloadDocument(documentId);
      
      // Store in Supabase Storage
      await supabase.storage
        .from('signed-documents')
        .upload(`${documentId}.pdf`, signedDoc);
      
      break;
      
    case 'Declined':
      await supabase
        .from('documents')
        .update({ status: 'declined' })
        .eq('boldsign_document_id', documentId);
      break;
      
    case 'Signed':
      // Individual signer completed
      await supabase
        .from('document_signers')
        .update({ 
          signed_at: new Date().toISOString(),
          status: 'signed'
        })
        .eq('boldsign_document_id', documentId)
        .eq('signer_email', event.data.signerEmail);
      break;
  }
  
  return NextResponse.json({ received: true });
}
```

**Environment Variables (.env.local):**

```bash
# BoldSign OAuth Credentials
BOLDSIGN_CLIENT_ID=your_client_id_here
BOLDSIGN_CLIENT_SECRET=your_client_secret_here
BOLDSIGN_WEBHOOK_SECRET=your_webhook_signing_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Supabase Edge Functions implementation

Supabase Edge Functions run on Deno (not Node.js), requiring different import patterns. Use the esm.sh CDN for npm packages and store credentials in Supabase secrets manager (not environment files).

**Complete Edge Function Example:**

```typescript
// supabase/functions/send-boldsign-document/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token cache to avoid excessive token requests
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }
  
  const clientId = Deno.env.get('BOLDSIGN_CLIENT_ID')!;
  const clientSecret = Deno.env.get('BOLDSIGN_CLIENT_SECRET')!;
  
  const response = await fetch('https://account.boldsign.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'BoldSign.Documents.All'
    })
  });
  
  const { access_token, expires_in } = await response.json();
  
  // Cache with 5-minute buffer before expiration
  cachedToken = {
    token: access_token,
    expiresAt: now + (expires_in - 300) * 1000
  };
  
  return access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create authenticated Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's tenant configuration
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('user_tenants')
      .select('tenant_id, sender_identity_email, brand_id')
      .eq('user_id', user.id)
      .single();
    
    if (tenantError) {
      throw new Error('Tenant not found');
    }

    // Parse request body
    const { signerName, signerEmail, documentTitle, documentBase64 } = await req.json();

    // Get BoldSign access token
    const accessToken = await getAccessToken();

    // Prepare multipart form data
    const formData = new FormData();
    formData.append('Title', documentTitle);
    formData.append('OnBehalfOf', tenant.sender_identity_email);
    formData.append('BrandId', tenant.brand_id);
    formData.append('ExpiryDays', '30');
    
    // Add signer configuration
    formData.append('Signers[0].Name', signerName);
    formData.append('Signers[0].EmailAddress', signerEmail);
    formData.append('Signers[0].SignerType', 'Signer');
    
    // Add signature field
    formData.append('Signers[0].FormFields[0].FieldType', 'Signature');
    formData.append('Signers[0].FormFields[0].PageNumber', '1');
    formData.append('Signers[0].FormFields[0].Bounds.X', '100');
    formData.append('Signers[0].FormFields[0].Bounds.Y', '100');
    formData.append('Signers[0].FormFields[0].Bounds.Width', '200');
    formData.append('Signers[0].FormFields[0].Bounds.Height', '50');
    formData.append('Signers[0].FormFields[0].IsRequired', 'true');
    
    // Add metadata
    formData.append('MetaData.TenantId', tenant.tenant_id);
    formData.append('MetaData.UserId', user.id);
    
    // Convert base64 to blob and add file
    const pdfBlob = new Blob(
      [Uint8Array.from(atob(documentBase64), c => c.charCodeAt(0))],
      { type: 'application/pdf' }
    );
    formData.append('Files', pdfBlob, 'document.pdf');

    // Call BoldSign API
    const boldsignResponse = await fetch('https://api.boldsign.com/v1/document/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!boldsignResponse.ok) {
      const errorText = await boldsignResponse.text();
      throw new Error(`BoldSign API error: ${errorText}`);
    }

    const { documentId } = await boldsignResponse.json();

    // Store document reference in database
    const { data: dbData, error: dbError } = await supabaseClient
      .from('documents')
      .insert({
        boldsign_document_id: documentId,
        tenant_id: tenant.tenant_id,
        user_id: user.id,
        title: documentTitle,
        signer_email: signerEmail,
        status: 'sent',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        dbRecord: dbData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
```

**Setting Secrets:**

```bash
# Set BoldSign credentials
supabase secrets set BOLDSIGN_CLIENT_ID=your_client_id
supabase secrets set BOLDSIGN_CLIENT_SECRET=your_client_secret

# Deploy function
supabase functions deploy send-boldsign-document

# Test locally
supabase functions serve --env-file .env.local

# Invoke from Next.js
const { data, error } = await supabase.functions.invoke('send-boldsign-document', {
  body: { signerName: 'John', signerEmail: 'john@example.com', ... }
});
```

**Import Map Configuration (supabase/functions/import_map.json):**

```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
    "std/": "https://deno.land/std@0.168.0/"
  }
}
```

## Webhook integration for real-time status tracking

Webhooks eliminate polling and provide instant notifications for document events. BoldSign sends webhook requests within seconds of events occurring, with automatic retry logic using exponential backoff.

**Webhook Setup in BoldSign Dashboard:**

1. Navigate to API → Webhooks
2. Click "Add Webhook"
3. Choose "Account-Level Webhook" (tracks all documents)
4. Enter webhook URL: `https://yourapp.com/api/webhooks/boldsign`
5. Select events: Sent, Signed, Completed, Declined, Revoked, Expired
6. Click "Verify" (BoldSign sends test request expecting HTTP 200)
7. Save configuration

**Critical Event Types:**

- **Sent**: Document successfully sent to recipients (use this, not immediate API response)
- **Viewed**: Recipient opened the document
- **Signed**: Individual signer completed their signature
- **Completed**: All signers finished, document fully executed
- **Declined**: Signer refused to sign
- **Revoked**: Sender cancelled the request
- **Expired**: Document expired before completion

**Webhook Signature Verification (Security Critical):**

```typescript
import crypto from 'crypto';

function verifyBoldSignWebhook(
  signatureHeader: string, 
  payload: string, 
  secret: string
): boolean {
  // Parse header: "t=1668693823, s0=9b7adf82..."
  const parsed = signatureHeader.split(',').reduce((acc, item) => {
    const [key, value] = item.trim().split('=');
    if (key === 't') acc.timestamp = parseInt(value);
    if (key.startsWith('s')) acc.signatures.push(value);
    return acc;
  }, { timestamp: 0, signatures: [] as string[] });
  
  // Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${parsed.timestamp}.${payload}`)
    .digest('hex');
  
  // Timing-safe comparison
  const isValid = parsed.signatures.some(sig => 
    crypto.timingSafeEqual(
      Buffer.from(sig), 
      Buffer.from(expectedSignature)
    )
  );
  
  // Verify timestamp is within 5 minutes (replay attack prevention)
  const age = Math.floor(Date.now() / 1000) - parsed.timestamp;
  if (age > 300) {
    throw new Error('Webhook timestamp too old');
  }
  
  return isValid;
}
```

**Idempotent Webhook Handler:**

```typescript
// app/api/webhooks/boldsign/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Track processed events to handle duplicates
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  const eventType = req.headers.get('x-boldsign-event');
  
  if (eventType === 'Verification') {
    return NextResponse.json({ received: true });
  }
  
  const signature = req.headers.get('x-boldsign-signature')!;
  const payload = await req.text();
  
  // Verify signature
  try {
    const isValid = verifyBoldSignWebhook(
      signature, 
      payload, 
      process.env.BOLDSIGN_WEBHOOK_SECRET!
    );
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }
  } catch (error) {
    console.error('Signature verification failed:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }
  
  const event = JSON.parse(payload);
  const eventId = event.event.id;
  
  // Check for duplicate (idempotency)
  if (processedEvents.has(eventId)) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  
  // Process event asynchronously (return 200 immediately)
  processEventAsync(event).catch(error => {
    console.error('Event processing error:', error);
  });
  
  processedEvents.add(eventId);
  
  // Always return 200 within 10 seconds
  return NextResponse.json({ received: true });
}

async function processEventAsync(event: any) {
  const supabase = createServerSupabaseClient();
  const { documentId } = event.data;
  
  switch (event.event.eventType) {
    case 'Completed':
      // Download and store signed document
      const documentApi = new DocumentApi();
      documentApi.setDefaultAuthentication(await getAccessToken());
      
      const signedPdf = await documentApi.downloadDocument(documentId);
      
      // Upload to Supabase Storage
      await supabase.storage
        .from('signed-documents')
        .upload(`${documentId}.pdf`, signedPdf, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      // Update database
      await supabase
        .from('documents')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          storage_path: `signed-documents/${documentId}.pdf`
        })
        .eq('boldsign_document_id', documentId);
      
      // Notify user via email/notification
      // await sendCompletionNotification(documentId);
      break;
      
    case 'Declined':
      await supabase
        .from('documents')
        .update({ 
          status: 'declined',
          declined_at: new Date().toISOString()
        })
        .eq('boldsign_document_id', documentId);
      break;
      
    case 'Signed':
      await supabase
        .from('document_events')
        .insert({
          boldsign_document_id: documentId,
          event_type: 'signed',
          signer_email: event.data.signerEmail,
          event_data: event.data,
          occurred_at: new Date(event.event.created * 1000).toISOString()
        });
      break;
  }
}
```

**Retry Mechanism:** BoldSign automatically retries failed webhooks with exponential backoff: immediate, 5 min, 15 min, 45 min, 2 hours, 6 hours. After 6 failures, the webhook enters auto-disable monitoring for 7 days. Design your endpoint to respond quickly (under 10 seconds) and process heavy operations asynchronously using background jobs or message queues.

## Security best practices for multi-tenant credentials

Security in multi-tenant applications requires defense in depth: secure credential storage, proper authentication, tenant isolation at database level, and comprehensive audit logging.

**Credential Storage Hierarchy (Best to Worst):**

1. **Supabase Secrets Manager** (Environment-level secrets) ✅ Recommended
2. **Supabase Vault** (Encrypted database storage for per-tenant secrets)
3. **Encrypted database columns** (Custom encryption logic)
4. **Environment variables in .env files** (Development only)
5. **Hardcoded in code** (Never acceptable)

**Using Supabase Secrets:**

```bash
# Production secrets (via CLI)
supabase secrets set BOLDSIGN_CLIENT_ID=prod_client_id
supabase secrets set BOLDSIGN_CLIENT_SECRET=prod_secret_key
supabase secrets set BOLDSIGN_WEBHOOK_SECRET=webhook_signing_key

# Access in Edge Functions
const clientId = Deno.env.get('BOLDSIGN_CLIENT_ID');
const clientSecret = Deno.env.get('BOLDSIGN_CLIENT_SECRET');

// Validate secrets exist
if (!clientId || !clientSecret) {
  throw new Error('BoldSign credentials not configured');
}
```

**Per-Tenant Credential Storage (Advanced):**

For maximum isolation where each tenant has their own BoldSign account:

```sql
-- Create table for encrypted tenant credentials
CREATE TABLE tenant_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  credential_type TEXT NOT NULL,
  encrypted_value BYTEA NOT NULL,
  key_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_rotated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, credential_type)
);

-- Enable Row Level Security
ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;

-- Only service role can access (Edge Functions only)
CREATE POLICY "Service role only" ON tenant_credentials
  FOR ALL USING (auth.role() = 'service_role');
```

**Encryption/Decryption (Edge Function):**

```typescript
import { encodeHex, decodeHex } from 'https://deno.land/std@0.168.0/encoding/hex.ts';

async function encryptCredential(plaintext: string): Promise<string> {
  const masterKey = Deno.env.get('ENCRYPTION_MASTER_KEY')!;
  const encoder = new TextEncoder();
  
  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('boldsign-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Concatenate IV and ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return encodeHex(combined);
}
```

**Row Level Security for Tenant Isolation:**

```sql
-- Documents table with tenant isolation
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  boldsign_document_id TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can only access documents for their tenant
CREATE POLICY "Tenant isolation for users" ON documents
  FOR ALL
  USING (
    tenant_id = (
      SELECT tenant_id 
      FROM user_tenants 
      WHERE user_id = auth.uid()
    )
  );

-- Service role bypasses RLS (for Edge Functions with service_role key)
CREATE POLICY "Service role bypass" ON documents
  FOR ALL
  USING (auth.role() = 'service_role');
```

**Authentication in Edge Functions:**

```typescript
// Always verify user JWT
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!, // Use anon key, not service_role
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  }
);

const { data: { user }, error } = await supabaseClient.auth.getUser();

if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}

// Get user's tenant (never trust client-provided tenant ID)
const { data: userTenant } = await supabaseClient
  .from('user_tenants')
  .select('tenant_id')
  .eq('user_id', user.id)
  .single();

// Use derived tenant_id for all subsequent operations
```

**Credential Rotation Strategy:**

Implement zero-downtime rotation by supporting multiple active credentials:

```typescript
// Support current and next credential during rotation
const credentials = {
  current: {
    clientId: Deno.env.get('BOLDSIGN_CLIENT_ID'),
    clientSecret: Deno.env.get('BOLDSIGN_CLIENT_SECRET')
  },
  next: {
    clientId: Deno.env.get('BOLDSIGN_CLIENT_ID_NEXT'),
    clientSecret: Deno.env.get('BOLDSIGN_CLIENT_SECRET_NEXT')
  }
};

async function getAccessTokenWithFallback() {
  try {
    return await getAccessToken(credentials.current);
  } catch (error) {
    console.warn('Primary credentials failed, trying fallback');
    return await getAccessToken(credentials.next);
  }
}
```

**Audit Logging Pattern:**

```typescript
// Log all BoldSign API calls
async function logApiCall(params: {
  tenantId: string;
  userId: string;
  action: string;
  documentId?: string;
  success: boolean;
  error?: string;
}) {
  await supabase.from('audit_logs').insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    action: params.action,
    resource_type: 'boldsign_document',
    resource_id: params.documentId,
    success: params.success,
    error_message: params.error,
    ip_address: req.headers.get('x-forwarded-for'),
    user_agent: req.headers.get('user-agent'),
    created_at: new Date().toISOString()
  });
}
```

## JavaScript SDK and available libraries

BoldSign provides an official Node.js SDK with full TypeScript support, eliminating the need to construct raw HTTP requests for most operations.

**Installation and Setup:**

```bash
npm install boldsign
```

**SDK Configuration:**

```typescript
import { 
  DocumentApi, 
  TemplateApi, 
  BrandingApi,
  SenderIdentitiesApi 
} from 'boldsign';

// Initialize with OAuth token (recommended)
const documentApi = new DocumentApi();
const accessToken = await getAccessToken(); // From previous sections
documentApi.setDefaultAuthentication(accessToken);

// Or initialize with API key (simpler but less secure)
documentApi.setApiKey(process.env.BOLDSIGN_API_KEY!);

// For regional endpoints
const euDocumentApi = new DocumentApi('https://eu-api.boldsign.com');
```

**Common SDK Operations:**

```typescript
// Send document from template
import { TemplateApi, SendForSignFromTemplateForm, Roles } from 'boldsign';

const templateApi = new TemplateApi();
templateApi.setDefaultAuthentication(accessToken);

const roles: Roles = {
  roleIndex: 1,
  signerName: 'John Doe',
  signerEmail: 'john@example.com',
};

const sendFromTemplate = new SendForSignFromTemplateForm();
sendFromTemplate.templateId = 'your_template_id';
sendFromTemplate.roles = [roles];
sendFromTemplate.onBehalfOf = 'tenant@example.com';
sendFromTemplate.brandId = 'tenant_brand_id';

const response = await templateApi.sendUsingTemplate(sendFromTemplate);
console.log('Document ID:', response.documentId);

// Get document status
const properties = await documentApi.getProperties(response.documentId);
console.log('Status:', properties.status); // "InProgress", "Completed", "Declined", etc.

// Download signed document
const signedPdf = await documentApi.downloadDocument(response.documentId);
// Returns Buffer containing PDF bytes

// List documents with filters
const documentsList = await documentApi.listDocuments({
  page: 1,
  pageSize: 25,
  status: 'Completed',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Revoke document
await documentApi.revokeDocument(documentId, 'Cancelled by user request');

// Get embedded signing link
const embeddedLink = await documentApi.getEmbeddedSignLink(
  documentId,
  'signer@example.com',
  'https://yourapp.com/documents/callback'
);
// Use embeddedLink.signLink in iframe
```

**Sender Identity Management:**

```typescript
import { SenderIdentitiesApi } from 'boldsign';

const senderApi = new SenderIdentitiesApi();
senderApi.setDefaultAuthentication(accessToken);

// Create sender identity
const result = await senderApi.createSenderIdentity({
  name: 'Tenant Admin',
  email: 'admin@tenant.com',
  brandId: 'brand_id_here',
  notificationSettings: {
    completed: true,
    signed: true,
    declined: true
  }
});

// List all sender identities
const identities = await senderApi.listSenderIdentities(1, 50);

// Delete sender identity
await senderApi.deleteSenderIdentity('admin@tenant.com');
```

**SDK vs Raw REST API:** Use the SDK for Next.js API routes and server actions (Node.js environment). For Supabase Edge Functions (Deno runtime), use raw REST API calls since the BoldSign SDK requires Node.js. The SDK provides type safety, better error handling, and automatic request/response serialization—significantly reducing development time for Node.js environments.

**Available SDKs by Language:**
- **Node.js/TypeScript**: `npm install boldsign` (official, actively maintained)
- **.NET**: NuGet package available
- **Python**: `pip install boldsign` 
- **Java**: Maven/Gradle packages
- **PHP**: Composer package

## Pricing structure and cost optimization

BoldSign's pricing model is uniquely designed for multi-tenant SaaS, charging per document sent rather than per tenant account—a significant cost advantage.

**API Pricing (Recommended for SaaS):**

- **Enterprise API Plan**: $30/month base fee
- **Included**: 40 signature requests per month
- **Overage**: $0.75 per additional signature request
- **Users**: 2 included, additional users available
- **Rate Limit**: 2,000 requests/hour (production)
- **Features**: Full API access, unlimited templates, unlimited brands, unlimited sender identities, webhooks, embedded signing/sending/templates

**Cost Calculation Examples:**

```
100 documents/month:
- Base: $30
- Overage: (100 - 40) × $0.75 = $45
- Total: $75/month

1,000 documents/month:
- Base: $30
- Overage: (1,000 - 40) × $0.75 = $720
- Total: $750/month

10,000 documents/month:
- Base: $30
- Overage: (10,000 - 40) × $0.75 = $7,470
- Total: $7,500/month (contact sales for volume discount)
```

**Multi-Tenant Cost Advantage:** Unlike competitors charging $10-20 per tenant account monthly, BoldSign charges only for documents sent. For a platform with 100 tenants sending 10 documents each per month (1,000 total):

- **BoldSign**: ~$750/month
- **Typical Competitor**: 100 tenants × $15/tenant = $1,500-2,000/month minimum

**Savings can exceed hundreds of thousands annually** for platforms with thousands of tenants but moderate document volume per tenant.

**Key Features Included:**

✅ **Unlimited sender identities** (no per-tenant fees)  
✅ **Unlimited brands** (custom branding per tenant)  
✅ **Unlimited templates** (reusable document templates)  
✅ **Webhook notifications** (real-time event tracking)  
✅ **Embedded components** (white-label signing experience)  
✅ **OAuth 2.0 support** (secure authentication)  
✅ **Regional data centers** (US, EU, Canada)  
✅ **SOC 2 Type 2 certified** (enterprise compliance)

**Rate Limits:**

- **Production**: 2,000 requests/hour per account
- **Sandbox**: 50 requests/hour per account (free forever)
- **Document size**: Maximum 25MB per file, 1,000 pages, 25 files per document

**Cost Optimization Strategies:**

1. **Use webhooks instead of polling** to avoid unnecessary API calls for status checks
2. **Cache OAuth tokens** (1-hour lifetime) to minimize token endpoint requests
3. **Batch operations** when possible to reduce request count
4. **Implement proper error handling** to avoid retry storms
5. **Monitor usage via API dashboard** to track per-tenant document volume
6. **Use templates** to reduce API calls for repetitive document types

**Partner Programs:**

- **Partner/System Integrator**: 20% recurring commission on client subscriptions
- **Reseller**: 20% discount for resale
- **Affiliate**: 30% commission for first 12 months of referrals

**Custom Pricing:** Contact BoldSign sales for volume-based discounts when sending 10,000+ documents monthly. Enterprise customers can negotiate custom rate limits and dedicated support.

## Complete implementation guide

Here's a step-by-step implementation roadmap for integrating BoldSign into your Next.js + Supabase SaaS application.

**Phase 1: Initial Setup (Week 1)**

1. **Create BoldSign Account**
   - Sign up at boldsign.com
   - Start with free sandbox for development
   - Generate API credentials (OAuth Client ID/Secret recommended)

2. **Database Schema Setup**

```sql
-- Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  boldsign_sender_email TEXT,
  boldsign_sender_identity_id TEXT,
  boldsign_brand_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-tenant relationship
CREATE TABLE user_tenants (
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id),
  role TEXT DEFAULT 'member',
  PRIMARY KEY (user_id, tenant_id)
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  boldsign_document_id TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users access their tenants" ON tenants
  FOR ALL USING (
    id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users access their documents" ON documents
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid())
  );
```

3. **Configure Supabase Secrets**

```bash
# Set BoldSign credentials
supabase secrets set BOLDSIGN_CLIENT_ID=your_oauth_client_id
supabase secrets set BOLDSIGN_CLIENT_SECRET=your_oauth_client_secret
supabase secrets set BOLDSIGN_WEBHOOK_SECRET=your_webhook_signing_secret
supabase secrets set ENCRYPTION_MASTER_KEY=your_encryption_key
```

4. **Install Dependencies**

```bash
npm install boldsign @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Phase 2: Core Integration (Week 2)**

5. **Create Utility Functions**

```typescript
// lib/boldsign.ts
import { DocumentApi } from 'boldsign';

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getBoldSignAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  
  const response = await fetch('https://account.boldsign.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.BOLDSIGN_CLIENT_ID!,
      client_secret: process.env.BOLDSIGN_CLIENT_SECRET!,
      scope: 'BoldSign.Documents.All BoldSign.SenderIdentity.All'
    })
  });
  
  const { access_token, expires_in } = await response.json();
  
  cachedToken = {
    token: access_token,
    expiresAt: Date.now() + (expires_in - 300) * 1000
  };
  
  return access_token;
}

export async function getBoldSignClient(): Promise<DocumentApi> {
  const client = new DocumentApi();
  const token = await getBoldSignAccessToken();
  client.setDefaultAuthentication(token);
  return client;
}
```

6. **Implement Sender Identity Creation**

```typescript
// app/actions/create-sender-identity.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getBoldSignAccessToken } from '@/lib/boldsign';

export async function createSenderIdentityAction(tenantId: string) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Unauthorized');
  
  // Get tenant info
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single();
  
  if (!tenant) throw new Error('Tenant not found');
  
  // Create sender identity via BoldSign API
  const accessToken = await getBoldSignAccessToken();
  
  const response = await fetch('https://api.boldsign.com/v1/senderIdentities/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Name: tenant.name,
      Email: `contracts@${tenant.domain}`,
      NotificationSettings: {
        Completed: true,
        Signed: true,
        Declined: true
      },
      MetaData: {
        TenantId: tenantId
      }
    })
  });
  
  const { senderIdentityId } = await response.json();
  
  // Update tenant record
  await supabase
    .from('tenants')
    .update({ 
      boldsign_sender_identity_id: senderIdentityId,
      boldsign_sender_email: `contracts@${tenant.domain}`
    })
    .eq('id', tenantId);
  
  return { success: true, senderIdentityId };
}
```

7. **Implement Document Sending**

Use the Server Action example from the "Sending documents with Next.js integration" section above.

**Phase 3: Webhook Integration (Week 2)**

8. **Create Webhook Endpoint**

Use the webhook implementation from the "Webhook integration" section above, ensuring signature verification is properly implemented.

9. **Configure Webhook in BoldSign**

Navigate to BoldSign dashboard → API → Webhooks → Add your webhook URL → Select events → Verify → Save

**Phase 4: Enhanced Features (Week 3)**

10. **Implement Document Status Polling (Fallback)**

```typescript
// app/api/documents/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getBoldSignClient } from '@/lib/boldsign';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await getBoldSignClient();
  const properties = await client.getProperties(params.id);
  
  return NextResponse.json({
    status: properties.status,
    signers: properties.signers,
    createdDate: properties.createdDate,
    expiryDate: properties.expiryDate
  });
}
```

11. **Implement Document Download**

```typescript
// app/actions/download-document.ts
'use server';

import { getBoldSignClient } from '@/lib/boldsign';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function downloadDocumentAction(documentId: string) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Unauthorized');
  
  // Verify user has access to this document
  const { data: doc } = await supabase
    .from('documents')
    .select('boldsign_document_id, tenant_id')
    .eq('id', documentId)
    .single();
  
  if (!doc) throw new Error('Document not found');
  
  // Download from BoldSign
  const client = await getBoldSignClient();
  const pdfBuffer = await client.downloadDocument(doc.boldsign_document_id);
  
  // Return as base64 for client download
  return {
    success: true,
    pdf: Buffer.from(pdfBuffer).toString('base64')
  };
}
```

12. **Add Embedded Signing**

```typescript
// Get embedded signing URL
const embeddedLink = await client.getEmbeddedSignLink(
  documentId,
  'signer@example.com',
  'https://yourapp.com/documents/complete'
);

// Render in iframe
<iframe 
  src={embeddedLink.signLink} 
  width="100%" 
  height="800px"
  title="Sign Document"
/>
```

**Phase 5: Production Hardening (Week 4)**

13. **Implement Error Handling**

```typescript
// lib/errors.ts
export class BoldSignError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'BoldSignError';
  }
}

export async function handleBoldSignRequest<T>(
  operation: () => Promise<T>
): Promise<{ data?: T; error?: string }> {
  try {
    const data = await operation();
    return { data };
  } catch (error: any) {
    console.error('BoldSign operation failed:', error);
    
    if (error.response?.status === 429) {
      return { error: 'Rate limit exceeded, please try again later' };
    }
    
    return { 
      error: error.message || 'An unexpected error occurred' 
    };
  }
}
```

14. **Add Monitoring and Logging**

```typescript
// Log all BoldSign API calls
export async function logBoldSignOperation(params: {
  operation: string;
  tenantId: string;
  userId: string;
  documentId?: string;
  success: boolean;
  error?: string;
}) {
  await supabase.from('api_logs').insert({
    service: 'boldsign',
    operation: params.operation,
    tenant_id: params.tenantId,
    user_id: params.userId,
    resource_id: params.documentId,
    success: params.success,
    error_message: params.error,
    timestamp: new Date().toISOString()
  });
}
```

15. **Implement Rate Limiting**

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 per minute per user
});

// In API route or server action
const identifier = `user:${user.id}`;
const { success } = await ratelimit.limit(identifier);

if (!success) {
  throw new Error('Rate limit exceeded');
}
```

**Phase 6: Testing and Launch**

16. **Test Suite**

```typescript
// __tests__/boldsign.test.ts
import { describe, it, expect } from '@jest/globals';
import { getBoldSignAccessToken } from '@/lib/boldsign';

describe('BoldSign Integration', () => {
  it('should obtain access token', async () => {
    const token = await getBoldSignAccessToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });
  
  it('should create sender identity', async () => {
    // Test sender identity creation
  });
  
  it('should send document with tenant branding', async () => {
    // Test document sending
  });
  
  it('should enforce tenant isolation', async () => {
    // Test that Tenant A cannot access Tenant B documents
  });
});
```

17. **Upgrade to Production API**

- Purchase Enterprise API plan ($30/month)
- Switch from sandbox to production credentials
- Update environment variables
- Test webhook delivery from production
- Monitor initial document sends

**Deployment Checklist:**

- [ ] All secrets configured in production Supabase
- [ ] RLS policies tested and enabled
- [ ] Webhook endpoint verified and secured
- [ ] Rate limiting implemented
- [ ] Error handling and logging in place
- [ ] Monitoring dashboard configured
- [ ] Backup/disaster recovery planned
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Documentation updated

## Conclusion and key recommendations

Integrating BoldSign into your multi-tenant Next.js and Supabase SaaS application provides enterprise-grade e-signature capabilities with exceptional cost efficiency. **The critical architectural decision is using BoldSign's Sender Identity feature—one account manages unlimited tenants, each with custom branding, at just $0.75 per document**. This eliminates the per-tenant licensing fees charged by competitors, potentially saving hundreds of thousands annually for platforms with many users but moderate document volume.

**Implementation priorities:** Start with OAuth Client Credentials (not API keys) for automatic token rotation and better security. Store all credentials in Supabase secrets manager and implement Row Level Security policies immediately to ensure tenant isolation. Use Server Actions for internal operations and API Routes for webhooks. Deploy webhook handling early to avoid polling the API for status updates—this dramatically reduces API calls and keeps you under the 2,000 requests/hour limit.

**Security is paramount:** Always verify webhook signatures using HMAC SHA256, never expose service_role keys to clients, derive tenant context from authenticated users (never trust client input), and implement comprehensive audit logging. Use Supabase Vault or encrypted database columns only if tenants need their own BoldSign accounts—for most SaaS applications, shared credentials with metadata-based tenant tracking is simpler and equally secure.

**The BoldSign advantage:** Official Node.js SDK with TypeScript support, embedded signing components for white-label experiences, unlimited brands and sender identities included, SOC 2 Type 2 certification for enterprise compliance, and responsive developer support. The platform is specifically designed for multi-tenant SaaS, making it significantly easier to implement than general-purpose e-signature APIs that require complex workarounds for multi-tenancy.

Start with the free sandbox for development, implement the core integration in 2-3 weeks following this guide, and upgrade to production when ready to launch. The investment pays off quickly—both in development time saved and ongoing operational costs reduced.