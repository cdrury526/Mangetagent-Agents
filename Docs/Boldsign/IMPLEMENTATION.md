# BoldSign Integration Implementation Summary

## Overview

This document summarizes the BoldSign e-signature integration implementation, including automatic download of signed documents when all parties have completed signing.

## ✅ Completed Implementation

### 1. Database Schema

**Migration File:** `supabase/migrations/20250202000001_boldsign_tables.sql`

Created three tables:

- **`bold_sign_documents`**: Tracks documents sent for signature
  - Links to `transactions` and `documents` tables
  - Stores BoldSign document IDs, status, signed PDF URLs
  - Includes fields for signed PDF storage path and audit trail

- **`bold_sign_identities`**: Stores sender identities for "send on behalf" functionality
  - One default identity per agent
  - Supports custom branding (logo, company name, etc.)

- **`bold_sign_events`**: Webhook event audit trail
  - Stores all webhook events for debugging and idempotency
  - Tracks processing status

**RLS Policies:** All tables have appropriate RLS policies ensuring agents can only access their own data.

### 2. Edge Functions

#### `boldsign-api` (`supabase/functions/boldsign-api/index.ts`)

Handles all BoldSign API calls:

- `sendDocument`: Send document for signature
- `sendOnBehalf`: Send document on behalf of another user
- `revokeDocument`: Revoke/cancel a sent document
- `getDocument`: Get document details and status
- `downloadDocument`: Download original, signed, or audit trail PDFs
- `generateSigningLink`: Generate embedded signing links
- `uploadDocument`: Upload documents to BoldSign

**Features:**
- Proper error handling
- CORS support
- Service role authentication

#### `boldsign-webhooks` (`supabase/functions/boldsign-webhooks/index.ts`)

Handles BoldSign webhook events with **automatic signed PDF download**:

**Key Feature - Automatic Download:**
When a `document.completed` event is received:
1. Downloads the signed PDF from BoldSign API
2. Uploads it to Supabase Storage at `documents/{transactionId}/{documentId}/signed.pdf`
3. Creates a new document record in the `documents` table for the signed version
4. Updates the `bold_sign_documents` record with the storage path and signed URL

**Supported Events:**
- `document.completed` ⭐ **Automatic download implemented**
- `document.declined`
- `document.expired`
- `document.revoked`
- `document.sent`
- `signer.completed`
- `signer.signed`
- `signer.viewed`
- `signer.declined`

**Security:**
- HMAC-SHA256 signature verification
- Idempotency checking (prevents duplicate processing)
- Event audit trail

### 3. Server Actions

**File:** `app/actions/boldsign.ts`

Server actions for frontend integration:

- `sendDocumentForSignature()`: Send a document for signature
- `revokeDocument()`: Revoke a sent document
- `getDocumentStatus()`: Get current document status
- `generateEmbeddedSigningLink()`: Generate signing link for embedded UI
- `getBoldSignDocumentsByTransaction()`: List all BoldSign documents for a transaction
- `getBoldSignDocument()`: Get a single BoldSign document record

All actions include:
- Authentication checks
- Ownership verification (RLS)
- Error handling
- Path revalidation

## 🔧 Setup Required

### 1. Environment Variables

Add to `.env.local` and Supabase Dashboard → Edge Functions → Secrets:

```env
# BoldSign API
BOLDSIGN_API_KEY=your_boldsign_api_key_here
BOLDSIGN_BASE_URL=https://api.boldsign.com
BOLDSIGN_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase (should already be configured)
SUPABASE_URL=https://tlwzpacimgfnziccqnox.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Deploy Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard SQL Editor
# Copy contents of: supabase/migrations/20250202000001_boldsign_tables.sql
```

### 3. Deploy Edge Functions

```bash
# Deploy BoldSign API function
supabase functions deploy boldsign-api

# Deploy BoldSign webhooks function
supabase functions deploy boldsign-webhooks
```

**Or via Supabase Dashboard:**
1. Go to Edge Functions
2. Create new function: `boldsign-api`
3. Copy contents of `supabase/functions/boldsign-api/index.ts`
4. Repeat for `boldsign-webhooks`

### 4. Configure BoldSign Webhooks

1. Log in to [BoldSign Dashboard](https://app.boldsign.com)
2. Go to Settings → Webhooks
3. Add webhook endpoint:
   ```
   https://tlwzpacimgfnziccqnox.supabase.co/functions/v1/boldsign-webhooks
   ```
4. Subscribe to events:
   - `document.completed` ⭐ **Required for auto-download**
   - `document.declined`
   - `document.expired`
   - `document.revoked`
   - `document.sent`
   - `signer.completed`
   - `signer.signed`
   - `signer.viewed`
   - `signer.declined`
5. Copy webhook secret and add to environment variables

## 📋 Next Steps

### 1. UI Components (Pending)

Create UI components for:
- **Send Document Modal**: Form to send documents for signature
  - Signer input fields (email, name, order)
  - Email message customization
  - Expiration settings
  - Sender identity selector
  
- **Document Status Display**: Show BoldSign document status
  - Status badge (sent, in progress, completed, declined)
  - Signer progress
  - Download signed PDF button
  - Revoke button (if applicable)

- **Embedded Signing Component**: iFrame for embedded signing
  - Generate signing link
  - Embed BoldSign signing interface
  - Handle completion events

### 2. Integration with Document Upload Flow

Modify document upload flow to:
1. Optionally upload to BoldSign after uploading to Supabase Storage
2. Show "Send for Signature" button on document cards
3. Link BoldSign documents to original documents

### 3. Testing

Test the complete flow:
1. Upload a document
2. Send for signature via BoldSign
3. Sign the document (test account)
4. Verify webhook receives `document.completed`
5. Verify signed PDF is automatically downloaded and stored
6. Verify new document record is created in `documents` table

## 🔍 How Automatic Download Works

### Flow Diagram

```
1. Document sent for signature
   ↓
2. Signers sign document via BoldSign
   ↓
3. All signers complete → BoldSign sends webhook
   ↓
4. Webhook handler receives `document.completed` event
   ↓
5. Downloads signed PDF from BoldSign API
   ↓
6. Uploads PDF to Supabase Storage
   ↓
7. Creates new document record in `documents` table
   ↓
8. Updates `bold_sign_documents` record with storage path
   ↓
9. Signed PDF now available in user's document list
```

### Key Code Location

The automatic download logic is in:
`supabase/functions/boldsign-webhooks/index.ts`

Function: `handleDocumentCompleted()`
- Lines 152-224: Downloads PDF from BoldSign
- Lines 225-280: Stores PDF in Supabase Storage
- Lines 281-307: Creates new document record

## 📝 Usage Examples

### Send Document for Signature

```typescript
import { sendDocumentForSignature } from '@/app/actions/boldsign'

const result = await sendDocumentForSignature({
  documentId: 'uuid-of-our-document',
  boldSignDocumentId: 'boldsign-doc-id',
  transactionId: 'transaction-uuid',
  signers: [
    {
      email: 'buyer@example.com',
      firstName: 'John',
      lastName: 'Buyer',
      signerOrder: 1,
    },
    {
      email: 'seller@example.com',
      firstName: 'Jane',
      lastName: 'Seller',
      signerOrder: 2,
    },
  ],
  emailMessage: 'Please review and sign the purchase agreement',
  subject: 'Purchase Agreement - 123 Main St',
  expiryDays: 7,
})
```

### Get Document Status

```typescript
import { getBoldSignDocument } from '@/app/actions/boldsign'

const { data, error } = await getBoldSignDocument('boldsign-doc-id')
if (data) {
  console.log('Status:', data.status)
  console.log('Signed PDF URL:', data.signed_pdf_url)
}
```

## 🐛 Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct in BoldSign Dashboard
2. Verify webhook secret matches environment variable
3. Check Edge Function logs in Supabase Dashboard
4. Verify signature verification is working

### Signed PDF Not Downloading

1. Check Edge Function logs for errors
2. Verify BoldSign API key has download permissions
3. Check Supabase Storage bucket permissions
4. Verify `document.completed` event is being received

### Document Status Not Updating

1. Check webhook events table: `SELECT * FROM bold_sign_events ORDER BY created_at DESC`
2. Check if events are marked as processed
3. Review error messages in `bold_sign_events.error_message`

## 📚 Related Documentation

- [BoldSign API Documentation](https://boldsign.com/help/api-reference)
- [BoldSign Webhook Guide](https://boldsign.com/help/webhooks)
- [Integration Guide](./Integration-Guide.md)
- [Webhooks Reference](./Webhooks.md)
- [API Endpoints Reference](./API-Endpoints.md)

## ✅ Implementation Checklist

- [x] Database schema created
- [x] RLS policies configured
- [x] Edge Function: boldsign-api created
- [x] Edge Function: boldsign-webhooks created
- [x] Automatic signed PDF download implemented
- [x] Server actions created
- [ ] UI components created
- [ ] Integration with document upload flow
- [ ] End-to-end testing completed
- [ ] Webhook configuration in BoldSign Dashboard
- [ ] Environment variables configured

