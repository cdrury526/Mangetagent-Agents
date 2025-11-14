# BoldSign E-Signature Integration Implementation Plan

## Overview

This document tracks the implementation of BoldSign e-signature functionality into MagnetAgent. The integration enables agents to send documents for signature, track signing progress in real-time, and automatically store completed signed documents.

**Status:** Planning Complete - Implementation In Progress

**Last Updated:** November 14, 2025

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Supabase Edge Functions](#2-supabase-edge-functions)
3. [Server Actions and API Layer](#3-server-actions-and-api-layer)
4. [Sender Identity Management](#4-sender-identity-management)
5. [Document Sending Workflow](#5-document-sending-workflow)
6. [Embedded E-Signature Interface](#6-embedded-e-signature-interface)
7. [Real-Time Status Display](#7-real-time-status-display)
8. [Document Actions and Management](#8-document-actions-and-management)
9. [Webhook Configuration](#9-webhook-configuration)
10. [Error Handling](#10-error-handling)
11. [Mobile and Accessibility](#11-mobile-and-accessibility)
12. [Testing and Documentation](#12-testing-and-documentation)

---

## Implementation Checklist

### Phase 1: Foundation (Database & Infrastructure)
- [ ] 1.1 - Audit existing database schema
- [ ] 1.2 - Create bold_sign_documents table migration
- [ ] 1.3 - Create bold_sign_identities table migration
- [ ] 1.4 - Create bold_sign_events table migration
- [ ] 1.5 - Add RLS policies to all tables
- [ ] 1.6 - Add database indexes for performance
- [ ] 1.7 - Verify documents table structure
- [ ] 1.8 - Verify transaction_contacts table structure

### Phase 2: Backend Services
- [ ] 2.1 - Create boldsign-api edge function
- [ ] 2.2 - Implement sendDocument action
- [ ] 2.3 - Implement sendOnBehalf action
- [ ] 2.4 - Implement revokeDocument action
- [ ] 2.5 - Implement getDocument action
- [ ] 2.6 - Implement downloadDocument action
- [ ] 2.7 - Implement generateSigningLink action
- [ ] 2.8 - Implement uploadDocument action
- [ ] 2.9 - Add error handling and retry logic
- [ ] 2.10 - Create boldsign-webhooks edge function
- [ ] 2.11 - Implement HMAC signature verification
- [ ] 2.12 - Implement idempotency checking
- [ ] 2.13 - Create document.completed handler with auto-download
- [ ] 2.14 - Create document.declined handler
- [ ] 2.15 - Create document.expired handler
- [ ] 2.16 - Create document.revoked handler
- [ ] 2.17 - Create signer event handlers
- [ ] 2.18 - Configure environment variables

### Phase 3: API Integration Layer
- [ ] 3.1 - Create sendDocumentForSignature server action
- [ ] 3.2 - Create revokeDocument server action
- [ ] 3.3 - Create getDocumentStatus server action
- [ ] 3.4 - Create generateEmbeddedSigningLink server action
- [ ] 3.5 - Create getBoldSignDocumentsByTransaction server action
- [ ] 3.6 - Create downloadSignedDocument server action
- [ ] 3.7 - Add authentication to all actions
- [ ] 3.8 - Add TypeScript types for payloads

### Phase 4: Settings & Identity Management
- [ ] 4.1 - Add E-Signature section to Settings page
- [ ] 4.2 - Create sender identity form component
- [ ] 4.3 - Add identity list display
- [ ] 4.4 - Implement create identity functionality
- [ ] 4.5 - Implement edit identity functionality
- [ ] 4.6 - Implement delete identity functionality
- [ ] 4.7 - Add default identity toggle
- [ ] 4.8 - Add logo upload capability
- [ ] 4.9 - Implement email verification check
- [ ] 4.10 - Add identity verification status indicator

### Phase 5: Document Sending UI
- [ ] 5.1 - Create SendDocumentModal component
- [ ] 5.2 - Add signer selection from transaction_contacts
- [ ] 5.3 - Add create new contact as signer flow
- [ ] 5.4 - Add email, name, phone fields per signer
- [ ] 5.5 - Add signer order selection for sequential signing
- [ ] 5.6 - Add authentication method selector
- [ ] 5.7 - Add subject and message customization
- [ ] 5.8 - Add expiration date picker
- [ ] 5.9 - Add automated reminder configuration
- [ ] 5.10 - Add CC recipients field
- [ ] 5.11 - Add sender identity selector
- [ ] 5.12 - Implement form field pre-filling from transaction
- [ ] 5.13 - Add document preview
- [ ] 5.14 - Add sending progress indicator
- [ ] 5.15 - Add confirmation and success state

### Phase 6: Embedded Signing
- [ ] 6.1 - Create EmbeddedSigning component
- [ ] 6.2 - Implement signing link generation
- [ ] 6.3 - Add iframe with proper security attributes
- [ ] 6.4 - Implement postMessage event listener
- [ ] 6.5 - Add loading state
- [ ] 6.6 - Add error handling with retry
- [ ] 6.7 - Configure CSP headers
- [ ] 6.8 - Handle completion events
- [ ] 6.9 - Add completion confirmation UI
- [ ] 6.10 - Handle token expiration

### Phase 7: Status Display & Real-Time Updates
- [ ] 7.1 - Create DocumentStatusBadge component
- [ ] 7.2 - Create DocumentSignerProgress component
- [ ] 7.3 - Add individual signer status display
- [ ] 7.4 - Enable Supabase real-time on bold_sign_documents
- [ ] 7.5 - Enable Supabase real-time on documents table
- [ ] 7.6 - Add automatic UI updates on webhook changes
- [ ] 7.7 - Add toast notifications for status changes
- [ ] 7.8 - Create activity timeline component
- [ ] 7.9 - Add expiration countdown display

### Phase 8: Document Management Actions
- [ ] 8.1 - Add "Send for Signature" button to document cards
- [ ] 8.2 - Implement resend functionality
- [ ] 8.3 - Add revoke button with confirmation
- [ ] 8.4 - Implement credit refund on revocation
- [ ] 8.5 - Add download signed document button
- [ ] 8.6 - Add download audit trail button
- [ ] 8.7 - Add view document action
- [ ] 8.8 - Add manual reminder sending
- [ ] 8.9 - Add expiration warning with extend option
- [ ] 8.10 - Display complete audit trail

### Phase 9: Webhook Setup & Testing
- [ ] 9.1 - Document webhook endpoint URL
- [ ] 9.2 - Create configuration guide
- [ ] 9.3 - Test signature verification
- [ ] 9.4 - Test idempotency
- [ ] 9.5 - Test automatic PDF download
- [ ] 9.6 - Test real-time UI updates
- [ ] 9.7 - Monitor webhook events table
- [ ] 9.8 - Create health check queries

### Phase 10: Error Handling
- [ ] 10.1 - Handle expired signing links
- [ ] 10.2 - Handle document not found errors
- [ ] 10.3 - Handle rate limiting
- [ ] 10.4 - Handle network errors with retry
- [ ] 10.5 - Handle CSP blocking
- [ ] 10.6 - Handle invalid email validation
- [ ] 10.7 - Handle declined documents
- [ ] 10.8 - Handle expired documents
- [ ] 10.9 - Handle webhook verification failures
- [ ] 10.10 - Handle duplicate events

### Phase 11: Mobile & Accessibility
- [ ] 11.1 - Test embedded signing on mobile
- [ ] 11.2 - Test on iOS Safari
- [ ] 11.3 - Test on Android Chrome
- [ ] 11.4 - Add touch-friendly controls
- [ ] 11.5 - Test keyboard navigation
- [ ] 11.6 - Add ARIA labels
- [ ] 11.7 - Add screen reader announcements
- [ ] 11.8 - Test with VoiceOver
- [ ] 11.9 - Test with NVDA
- [ ] 11.10 - Verify WCAG AA contrast

### Phase 12: Documentation & Final Testing
- [ ] 12.1 - Update API_DOCUMENTATION.md
- [ ] 12.2 - Create user guide
- [ ] 12.3 - Document sender identity setup
- [ ] 12.4 - Test complete upload-to-download workflow
- [ ] 12.5 - Test sequential multi-signer workflow
- [ ] 12.6 - Test parallel multi-signer workflow
- [ ] 12.7 - Test revocation and credit refund
- [ ] 12.8 - Test expiration and reminders
- [ ] 12.9 - Verify cross-tab real-time updates
- [ ] 12.10 - Production deployment checklist

---

## 1. Database Schema

### 1.1 Schema Audit
**Status:** ⏳ Pending

**Tasks:**
- Review existing database migrations
- Identify gaps in current schema for Boldsign integration
- Verify documents table exists with proper structure
- Verify transaction_contacts table supports signer selection

**Notes:**
- Database types already defined in `src/types/database.ts`
- BoldSignDocument, TransactionContact interfaces exist
- Need to verify actual table creation in migrations

---

### 1.2 bold_sign_documents Table

**Status:** ⏳ Pending

**Migration File:** `supabase/migrations/YYYYMMDDHHMMSS_create_boldsign_documents.sql`

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS bold_sign_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  bold_sign_document_id text UNIQUE NOT NULL,
  bold_sign_message_id text,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'in_progress', 'completed', 'declined', 'expired', 'revoked')
  ),
  signed_pdf_url text,
  signed_pdf_storage_path text,
  audit_trail_url text,
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bold_sign_documents_agent_id ON bold_sign_documents(agent_id);
CREATE INDEX idx_bold_sign_documents_transaction_id ON bold_sign_documents(transaction_id);
CREATE INDEX idx_bold_sign_documents_status ON bold_sign_documents(status);
CREATE INDEX idx_bold_sign_documents_document_id ON bold_sign_documents(document_id);
```

**RLS Policies:**
```sql
ALTER TABLE bold_sign_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own BoldSign documents"
  ON bold_sign_documents FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own BoldSign documents"
  ON bold_sign_documents FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update own BoldSign documents"
  ON bold_sign_documents FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());
```

---

### 1.3 bold_sign_identities Table

**Status:** ⏳ Pending

**Migration File:** `supabase/migrations/YYYYMMDDHHMMSS_create_boldsign_identities.sql`

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS bold_sign_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  bold_sign_identity_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company_name text,
  title text,
  logo_url text,
  is_default boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bold_sign_identities_agent_id ON bold_sign_identities(agent_id);
CREATE UNIQUE INDEX idx_bold_sign_identities_default
  ON bold_sign_identities(agent_id, is_default)
  WHERE is_default = true;
```

**RLS Policies:**
```sql
ALTER TABLE bold_sign_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage own identities"
  ON bold_sign_identities FOR ALL
  TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());
```

---

### 1.4 bold_sign_events Table

**Status:** ⏳ Pending

**Migration File:** `supabase/migrations/YYYYMMDDHHMMSS_create_boldsign_events.sql`

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS bold_sign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bold_sign_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  document_id text,
  payload_json jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bold_sign_events_document_id ON bold_sign_events(document_id);
CREATE INDEX idx_bold_sign_events_processed ON bold_sign_events(processed);
CREATE INDEX idx_bold_sign_events_event_type ON bold_sign_events(event_type);
```

**RLS Policies:**
```sql
ALTER TABLE bold_sign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage events"
  ON bold_sign_events FOR ALL
  TO service_role
  USING (true);
```

---

## 2. Supabase Edge Functions

### 2.1 boldsign-api Edge Function

**Status:** ⏳ Pending

**File:** `supabase/functions/boldsign-api/index.ts`

**Actions:**
- `sendDocument` - Send document to signers
- `sendOnBehalf` - Send using specific identity
- `revokeDocument` - Cancel sent document
- `getDocument` - Get document details and status
- `downloadDocument` - Download original, signed, or audit PDF
- `generateSigningLink` - Create embedded signing URL
- `uploadDocument` - Upload document to BoldSign

**Environment Variables:**
```env
BOLDSIGN_API_KEY=your_api_key
BOLDSIGN_BASE_URL=https://api.boldsign.com
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Key Features:**
- Retry logic with exponential backoff
- Rate limit handling (429 responses)
- Proper error messages
- CORS support
- Request/response logging

---

### 2.2 boldsign-webhooks Edge Function

**Status:** ⏳ Pending

**File:** `supabase/functions/boldsign-webhooks/index.ts`

**Webhook Events:**
- `document.completed` - All signers finished (AUTO-DOWNLOAD PDF)
- `document.declined` - Signer declined
- `document.expired` - Document expired
- `document.revoked` - Document cancelled
- `document.sent` - Document sent to signers
- `signer.completed` - Individual signer finished
- `signer.signed` - Signer added signature
- `signer.viewed` - Signer opened document
- `signer.declined` - Signer declined

**Environment Variables:**
```env
BOLDSIGN_WEBHOOK_SECRET=your_webhook_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BOLDSIGN_API_KEY=your_api_key
```

**Key Features:**
- HMAC-SHA256 signature verification
- Idempotency checking using bold_sign_event_id
- Automatic signed PDF download on completion
- Store PDF in Supabase Storage at `documents/{transactionId}/{documentId}/signed.pdf`
- Create new document record for signed PDF
- Update bold_sign_documents with storage path
- Event audit trail in bold_sign_events table
- Error logging and retry handling

---

## 3. Server Actions and API Layer

### 3.1 Server Actions

**Status:** ⏳ Pending

**File:** `src/actions/boldsign.ts` (to be created)

**Actions:**

#### sendDocumentForSignature
```typescript
interface SendDocumentParams {
  documentId: string;
  boldSignDocumentId: string;
  transactionId: string;
  signers: Array<{
    email: string;
    firstName: string;
    lastName: string;
    signerOrder?: number;
    authenticationMethod?: 'email' | 'sms' | 'accessCode';
    phoneNumber?: string;
  }>;
  senderIdentityId?: string;
  emailMessage?: string;
  subject?: string;
  expiryDays?: number;
  enableReminder?: boolean;
  reminderDays?: number[];
  ccEmailAddresses?: string[];
}
```

#### revokeDocument
```typescript
interface RevokeDocumentParams {
  boldSignDocumentId: string;
  revokeReason: string;
}
```

#### getDocumentStatus
```typescript
interface GetDocumentStatusParams {
  boldSignDocumentId: string;
}
```

#### generateEmbeddedSigningLink
```typescript
interface GenerateSigningLinkParams {
  boldSignDocumentId: string;
  signerEmail: string;
  redirectUrl?: string;
}
```

---

## 4. Sender Identity Management

### 4.1 Settings Page Enhancement

**Status:** ⏳ Pending

**File:** `src/pages/agent/Settings.tsx`

**New Section:** E-Signature Sender Identities

**Features:**
- Display list of sender identities
- Show default identity indicator
- Show verification status (verified/pending)
- Add new identity button
- Edit identity action
- Delete identity action (with confirmation)
- Set as default toggle
- Logo upload with preview

---

### 4.2 Sender Identity Components

**Status:** ⏳ Pending

**Components to Create:**

#### SenderIdentityForm
**File:** `src/components/boldsign/SenderIdentityForm.tsx`
- Form for creating/editing identity
- Fields: name, email, company_name, title
- Logo upload with preview
- Validation for email format
- Save and cancel actions

#### SenderIdentityList
**File:** `src/components/boldsign/SenderIdentityList.tsx`
- Display all identities in cards
- Show default badge
- Show verification status badge
- Edit button
- Delete button with confirmation
- Set as default toggle

---

## 5. Document Sending Workflow

### 5.1 SendDocumentModal Component

**Status:** ⏳ Pending

**File:** `src/components/boldsign/SendDocumentModal.tsx`

**Features:**
- Modal dialog with tabs
- Tab 1: Select existing transaction contacts
- Tab 2: Create new contact and add as signer
- Signer configuration per contact:
  - Email (read-only if from contact)
  - First name, last name
  - Signer order (for sequential signing)
  - Authentication method (email, SMS, access code)
  - Phone number (if SMS selected)
- Document settings:
  - Subject line
  - Email message to signers
  - Expiration date (presets: 24h, 3d, 7d, 30d, custom)
  - Enable reminders (checkbox)
  - Reminder days (multi-select: 1, 3, 5, 7)
  - CC recipients (comma-separated emails)
  - Sender identity selector (dropdown)
- Preview section showing:
  - Document name
  - All signers with order
  - Expiration date
  - Settings summary
- Send button with loading state
- Success confirmation

---

### 5.2 Signer Selection Components

**Status:** ⏳ Pending

**Components:**

#### ExistingContactSelector
**File:** `src/components/boldsign/ExistingContactSelector.tsx`
- List of transaction contacts
- Filter by contact type
- Multi-select with checkboxes
- Show contact details (name, email, type)
- Add selected button

#### NewContactForm
**File:** `src/components/boldsign/NewContactForm.tsx`
- Quick contact creation form
- Fields: first_name, last_name, email, phone, type
- Save and add as signer button
- Saves to contacts table
- Links to transaction via transaction_contacts

---

## 6. Embedded E-Signature Interface

### 6.1 EmbeddedSigning Component

**Status:** ⏳ Pending

**File:** `src/components/boldsign/EmbeddedSigning.tsx`

**Props:**
```typescript
interface EmbeddedSigningProps {
  boldSignDocumentId: string;
  signerEmail: string;
  onComplete?: (documentId: string) => void;
  onError?: (error: Error) => void;
}
```

**Features:**
- Generate signing link on mount
- Display loading spinner while generating
- Embed signing interface in iframe
- Proper iframe attributes:
  - `sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"`
  - `allow="clipboard-read; clipboard-write"`
  - Responsive dimensions (w-full h-[800px])
- Listen for postMessage events:
  - `BoldSign.SigningStarted`
  - `BoldSign.SigningComplete`
  - `BoldSign.SigningError`
  - `BoldSign.ViewerReady`
- Verify event origin (https://app.boldsign.com)
- Handle completion with callback
- Handle errors with retry option
- Auto-refresh on token expiration

**Security:**
- CSP headers configured to allow Boldsign domains
- Origin verification for postMessage
- Time-limited signing tokens
- Secure iframe sandbox

---

## 7. Real-Time Status Display

### 7.1 Status Display Components

**Status:** ⏳ Pending

**Components:**

#### DocumentStatusBadge
**File:** `src/components/boldsign/DocumentStatusBadge.tsx`

Status color mapping:
- `draft` - gray
- `sent` - blue
- `in_progress` - yellow
- `completed` - green
- `declined` - red
- `expired` - orange
- `revoked` - gray

#### DocumentSignerProgress
**File:** `src/components/boldsign/DocumentSignerProgress.tsx`

Displays:
- List of all signers
- Status per signer (pending, viewed, signed, declined)
- Timestamp for each action
- Visual progress indicator
- Remaining signers count
- Sequential workflow order indicator

---

### 7.2 Real-Time Subscriptions

**Status:** ⏳ Pending

**Implementation:**

#### Subscribe to bold_sign_documents
```typescript
const channel = supabase
  .channel('boldsign-document-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'bold_sign_documents',
      filter: `id=eq.${documentId}`,
    },
    (payload) => {
      // Update local state
      setDocument(payload.new);
    }
  )
  .subscribe();
```

#### Toast Notifications
- Show toast on status change to `completed`
- Show toast on status change to `declined`
- Show toast on status change to `expired`
- Include document name and signer info

---

## 8. Document Actions and Management

### 8.1 Document Action Buttons

**Status:** ⏳ Pending

**Location:** Document cards in transaction detail view

**Actions:**

#### Send for Signature
- Button visible for documents not yet sent
- Opens SendDocumentModal
- Passes document and transaction context

#### Resend Document
- Button visible for sent documents with no activity
- Triggers manual reminder to all pending signers
- Shows confirmation toast

#### Revoke Document
- Button visible for sent/in_progress documents
- Shows confirmation dialog with reason input
- Calls revokeDocument server action
- Refunds credit if applicable
- Updates status to revoked

#### Download Signed Document
- Button visible when status is completed
- Downloads signed PDF from Supabase Storage
- Opens in new tab or triggers download

#### Download Audit Trail
- Button visible when status is completed
- Downloads audit trail PDF from BoldSign
- Shows complete signing history

#### View Document
- Opens signed PDF in modal or new tab
- Allows viewing without downloading

---

### 8.2 Document Management UI

**Status:** ⏳ Pending

**Components:**

#### DocumentActionsMenu
**File:** `src/components/boldsign/DocumentActionsMenu.tsx`
- Dropdown menu with all available actions
- Actions enabled based on document status
- Confirmation dialogs for destructive actions

#### DocumentAuditTrail
**File:** `src/components/boldsign/DocumentAuditTrail.tsx`
- Timeline view of all document events
- Shows timestamps for each action
- Displays signer information
- Shows status changes
- Includes system events (sent, reminded, expired)

---

## 9. Webhook Configuration

### 9.1 Webhook Setup

**Status:** ⏳ Pending

**Webhook URL:**
```
https://tlwzpacimgfnziccqnox.supabase.co/functions/v1/boldsign-webhooks
```

**Configuration Steps:**
1. Log in to BoldSign Dashboard
2. Navigate to Settings → Webhooks
3. Click "Add Webhook"
4. Enter webhook URL
5. Select all events:
   - document.completed ✓
   - document.declined ✓
   - document.expired ✓
   - document.revoked ✓
   - document.sent ✓
   - signer.completed ✓
   - signer.signed ✓
   - signer.viewed ✓
   - signer.declined ✓
6. Copy webhook secret
7. Save webhook

**Environment Variable:**
```env
BOLDSIGN_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

### 9.2 Webhook Testing

**Status:** ⏳ Pending

**Test Checklist:**
- [ ] Test signature verification with valid signature
- [ ] Test signature rejection with invalid signature
- [ ] Test idempotency with duplicate events
- [ ] Test document.completed with automatic PDF download
- [ ] Test document.declined event handling
- [ ] Test document.expired event handling
- [ ] Test real-time UI updates after webhook
- [ ] Verify signed PDF appears in documents list
- [ ] Check bold_sign_events table for all events
- [ ] Monitor for processing errors

**Monitoring Queries:**
```sql
-- Check recent events
SELECT * FROM bold_sign_events
ORDER BY created_at DESC LIMIT 20;

-- Check failed events
SELECT * FROM bold_sign_events
WHERE processed = false OR error_message IS NOT NULL;

-- Event type statistics
SELECT event_type, COUNT(*) as count
FROM bold_sign_events
GROUP BY event_type;
```

---

## 10. Error Handling

### 10.1 Error Scenarios

**Status:** ⏳ Pending

**Handled Errors:**

#### Expired Signing Links
- Detect expired link error from iframe
- Automatically regenerate signing link
- Reload iframe with new link
- Show toast notification to user

#### Document Not Found
- Handle 404 from BoldSign API
- Show user-friendly error message
- Provide action to return to document list

#### Rate Limiting
- Detect 429 response from API
- Implement exponential backoff
- Show "Please wait" message to user
- Retry automatically

#### Network Errors
- Catch fetch/network errors
- Show retry button
- Log error for debugging
- Don't crash the UI

#### Invalid Email Addresses
- Validate email format before submission
- Show inline validation errors
- Prevent form submission until fixed

#### Declined Documents
- Show notification to agent
- Display decline reason if provided
- Offer option to resend or revoke
- Update transaction status if needed

#### Expired Documents
- Show expiration notification
- Offer option to resend with new expiration
- Archive original document record
- Track expiration in analytics

---

## 11. Mobile and Accessibility

### 11.1 Mobile Responsiveness

**Status:** ⏳ Pending

**Requirements:**
- Embedded signing works on mobile devices
- Touch-friendly buttons (min 44x44px)
- Responsive modal dialogs
- Proper viewport meta tag
- No horizontal scrolling
- Readable font sizes (min 16px for inputs)

**Testing Devices:**
- iPhone (iOS Safari)
- iPad (iOS Safari)
- Android Phone (Chrome)
- Android Tablet (Chrome)

---

### 11.2 Accessibility

**Status:** ⏳ Pending

**WCAG AA Compliance:**
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast ratios meet minimum 4.5:1
- [ ] ARIA labels on all buttons and inputs
- [ ] Screen reader announcements for status changes
- [ ] Alt text on all images
- [ ] Proper heading hierarchy
- [ ] Form labels properly associated
- [ ] Error messages announced to screen readers
- [ ] Success messages announced to screen readers

**Screen Reader Testing:**
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)

---

## 12. Testing and Documentation

### 12.1 End-to-End Testing

**Status:** ⏳ Pending

**Test Scenarios:**

#### Complete Workflow
1. Upload document to transaction
2. Click "Send for Signature"
3. Select signer from transaction contacts
4. Configure signing options
5. Send document
6. Verify email sent (check BoldSign)
7. Open signing link
8. Complete signature
9. Verify webhook received
10. Verify signed PDF downloaded
11. Verify new document record created
12. Verify UI updates in real-time

#### Multi-Signer Sequential
1. Send document with 3 signers (order 1, 2, 3)
2. Signer 1 signs
3. Verify signer 2 receives email only after signer 1
4. Signer 2 signs
5. Verify signer 3 receives email only after signer 2
6. Signer 3 signs
7. Verify document marked as completed

#### Multi-Signer Parallel
1. Send document with 3 signers (no order)
2. Verify all signers receive email immediately
3. Signers can sign in any order
4. Verify document marked as completed after all sign

#### Revocation and Credit Refund
1. Send document (deducts credit)
2. Revoke before any signatures
3. Verify credit refunded
4. Verify document status updated
5. Verify signers notified

#### Expiration and Reminders
1. Send document with 24-hour expiration
2. Set reminders for 1 hour, 12 hours
3. Verify reminder emails sent
4. Wait for expiration
5. Verify document marked as expired
6. Verify webhook received

---

### 12.2 Documentation Updates

**Status:** ⏳ Pending

**Files to Update:**

#### API_DOCUMENTATION.md
Add sections for:
- BoldSign API endpoints
- Webhook event types
- Server actions
- Error codes

#### User Guide (New File)
**File:** `docs/BoldSign-User-Guide.md`

Contents:
- Setting up sender identities
- Sending documents for signature
- Tracking signature progress
- Downloading signed documents
- Revoking documents
- Troubleshooting common issues

#### Developer Guide (New File)
**File:** `docs/BoldSign-Developer-Guide.md`

Contents:
- Architecture overview
- Edge function details
- Webhook handling
- Database schema
- API integration patterns
- Testing procedures

---

## Environment Variables

### Required Configuration

```env
# BoldSign API
BOLDSIGN_API_KEY=your_api_key_here
BOLDSIGN_BASE_URL=https://api.boldsign.com
BOLDSIGN_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase (should already exist)
SUPABASE_URL=https://tlwzpacimgfnziccqnox.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUPABASE_URL=https://tlwzpacimgfnziccqnox.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Application
VITE_APP_URL=https://magnetagent.com
```

---

## Implementation Priority

### High Priority (MVP)
1. Database schema (all tables)
2. Edge functions (API + webhooks)
3. Send document functionality
4. Embedded signing interface
5. Status display with real-time updates
6. Automatic signed PDF download

### Medium Priority (Enhanced UX)
1. Sender identity management
2. Signer selection from transaction contacts
3. Document revocation
4. Reminder functionality
5. Expiration handling

### Low Priority (Nice to Have)
1. In-app document preview
2. Advanced analytics
3. Template support
4. Bulk sending
5. Custom branding options

---

## Success Criteria

The integration is complete when:

- [ ] Agents can send documents for signature from transaction detail view
- [ ] Signers receive email with signing link from BoldSign
- [ ] Signers can sign documents in embedded interface
- [ ] Signed documents automatically download and store in Supabase Storage
- [ ] New document record created for signed PDF
- [ ] Document status updates in real-time via webhooks
- [ ] Agents can revoke documents before completion
- [ ] Agents can download signed documents and audit trails
- [ ] Sender identity management works in Settings
- [ ] All webhook events are handled correctly
- [ ] Error handling covers all edge cases
- [ ] Mobile responsive and accessible
- [ ] End-to-end tests pass
- [ ] Documentation is complete and accurate

---

## Timeline Estimate

**Phase 1 (Database):** 1 day
**Phase 2 (Edge Functions):** 3-4 days
**Phase 3 (Server Actions):** 1-2 days
**Phase 4 (Sender Identities):** 2 days
**Phase 5 (Send Document UI):** 3-4 days
**Phase 6 (Embedded Signing):** 2-3 days
**Phase 7 (Status Display):** 2-3 days
**Phase 8 (Document Actions):** 2 days
**Phase 9 (Webhook Config):** 1 day
**Phase 10 (Error Handling):** 2 days
**Phase 11 (Mobile/A11y):** 2-3 days
**Phase 12 (Testing/Docs):** 2-3 days

**Total Estimate:** 23-30 days

---

## Notes and Decisions

### Design Decisions

1. **Automatic PDF Download**: Webhooks automatically download signed PDFs to eliminate manual retrieval and ensure documents are immediately available.

2. **Real-Time Updates**: Using Supabase real-time subscriptions ensures UI updates instantly when webhooks update database status.

3. **Sender Identity**: Storing identities in database allows switching between identities and maintains audit trail.

4. **Embedded Signing**: Using iframe approach (not SDK) for simplicity and better browser compatibility.

5. **Sequential vs Parallel**: Supporting both signing workflows via signer_order field for flexibility.

### Technical Considerations

1. **Rate Limiting**: BoldSign has rate limits - implement exponential backoff and caching where possible.

2. **Webhook Reliability**: Store all webhook events in database for audit trail and idempotency.

3. **PDF Storage**: Store signed PDFs in Supabase Storage under `documents/{transactionId}/{documentId}/` for organization.

4. **Credit System**: Deduct credit on send, refund on revoke before completion (per business rules).

5. **Error Recovery**: All errors should be logged and recoverable without data loss.

---

## References

- [BoldSign API Documentation](https://boldsign.com/help/api-reference)
- [BoldSign Webhook Guide](https://boldsign.com/help/webhooks)
- [BoldSign Embedded Signing](https://boldsign.com/help/embedded-signing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

**Last Updated:** November 14, 2025
**Next Review:** TBD
**Status:** Planning Complete - Ready to Begin Implementation
