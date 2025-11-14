# BoldSign Integration Reference

Complete reference documentation for integrating BoldSign e-signature functionality into MagnetAgent.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Features](#features)
   - [Send Document](#send-document)
   - [Send Document On-Behalf](#send-document-on-behalf)
   - [Revoke Document](#revoke-document)
   - [Download Document](#download-document)
   - [Embed in iFrame](#embed-in-iframe)
   - [Sender Identities](#sender-identities)
   - [Webhooks](#webhooks)
4. [API Reference](#api-reference)
5. [Integration Patterns](#integration-patterns)
6. [Error Handling](#error-handling)

---

## Overview

BoldSign is a digital signature solution that provides:
- Document preparation and sending
- Signature collection and tracking
- Document management
- Webhook notifications
- Embedding capabilities

**BoldSign API Base URL:** `https://api.boldsign.com`

**API Version:** v1

**Documentation:** [BoldSign API Docs](https://boldsign.com/help/api-reference)

---

## Authentication

BoldSign uses API keys for authentication.

### Setup

1. Get API key from [BoldSign Dashboard](https://app.boldsign.com)
2. Store in environment variables:
   ```env
   BOLDSIGN_API_KEY=your_api_key_here
   BOLDSIGN_BASE_URL=https://api.boldsign.com
   ```

### Usage

Include API key in request headers:
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

---

## Features

### Send Document

Send a document for signature to one or more recipients.

**Endpoint:** `POST /api/v1/document/send`

**Key Features:**
- Support multiple recipients
- Sequential or parallel signing (control signer order)
- Custom email messages
- Expiration dates
- Automated reminders
- Custom branding
- Form field pre-filling
- CC recipients (carbon copy)
- Signer authentication methods (email, SMS, access code)

**Example Request:**
```json
{
  "documentId": "doc_id_123",
  "signers": [
    {
      "email": "buyer@example.com",
      "firstName": "John",
      "lastName": "Buyer",
      "signerOrder": 1,
      "authenticationMethod": "email",
      "signerRole": "Buyer"
    },
    {
      "email": "seller@example.com",
      "firstName": "Jane",
      "lastName": "Seller",
      "signerOrder": 2,
      "authenticationMethod": "sms",
      "phoneNumber": "+1234567890",
      "signerRole": "Seller"
    }
  ],
  "emailMessage": "Please review and sign the purchase agreement",
  "subject": "Purchase Agreement - 123 Main St",
  "expiryDays": 7,
  "enableReminder": true,
  "reminderDays": [1, 3, 5],
  "ccEmailAddresses": ["lender@example.com", "title@example.com"],
  "formFields": {
    "buyer_name": "John Buyer",
    "seller_name": "Jane Seller",
    "property_address": "123 Main St",
    "purchase_price": "$350,000",
    "closing_date": "2025-12-15"
  }
}
```

**Example Response:**
```json
{
  "documentId": "doc_id_123",
  "messageId": "msg_123",
  "status": "sent"
}
```

---

### Send Document On-Behalf

Send a document where the sender's identity is represented by a different user/identity.

**Endpoint:** `POST /api/v1/document/sendOnBehalf`

**Use Cases:**
- Agents sending on behalf of their organization
- Support staff sending for users
- Delegated signing authority

**Key Requirements:**
- Sender identity must be configured
- Proper permissions required
- Identity verification

**Example Request:**
```json
{
  "documentId": "doc_id_123",
  "senderEmail": "agent@magnetagent.com",
  "senderName": "MagnetAgent Support",
  "signers": [
    {
      "email": "signer@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "emailMessage": "Your agent is requesting your signature"
}
```

---

### Revoke Document

Cancel/revoke a document that has been sent but not yet signed.

**Endpoint:** `POST /api/v1/document/revoke`

**Use Cases:**
- Document sent in error
- Terms changed before signing
- Request withdrawn

**Requirements:**
- Document must be in "sent" or "in_progress" status
- Cannot revoke completed documents

**Example Request:**
```json
{
  "documentId": "doc_id_123",
  "revokeReason": "Document terms updated"
}
```

**Example Response:**
```json
{
  "documentId": "doc_id_123",
  "status": "revoked",
  "revokedAt": "2025-11-01T12:00:00Z"
}
```

---

### Download Document

Download signed or unsigned documents.

**Endpoint:** `GET /api/v1/document/{documentId}/download`

**Variants:**
- Original document: `/api/v1/document/{documentId}/download`
- Signed document: `/api/v1/document/{documentId}/download/signed`
- Audit trail: `/api/v1/document/{documentId}/download/audit`

**Query Parameters:**
- `format`: `pdf`, `zip` (for multiple files)
- `watermark`: `true`/`false` (add watermark)

**Example:**
```http
GET /api/v1/document/doc_123/download/signed?format=pdf&watermark=true
Authorization: Bearer YOUR_API_KEY
```

**Response:**
- Binary PDF file
- Content-Type: `application/pdf`

---

### Embed in iFrame

Embed BoldSign signing interface directly in your application.

**Key Features:**
- Seamless user experience
- No redirect to external site
- Customizable styling
- Real-time status updates

**Two Approaches:**

#### 1. Embedded Signing Link
Generate a signing link that can be embedded:

**Endpoint:** `POST /api/v1/document/{documentId}/signingLink`

**Response:**
```json
{
  "signingLink": "https://app.boldsign.com/sign?token=xyz123",
  "expiresAt": "2025-11-02T12:00:00Z"
}
```

**iFrame Implementation:**
```html
<iframe 
  src="https://app.boldsign.com/sign?token=xyz123"
  width="100%"
  height="800px"
  frameborder="0"
  allow="clipboard-read; clipboard-write"
></iframe>
```

#### 2. Embedded Signing Flow
Use BoldSign's embedded signing widget:

```javascript
// Load BoldSign SDK
<script src="https://cdn.boldsign.com/js/boldsign-sdk.js"></script>

// Initialize embedded signing
BoldSign.init({
  documentId: 'doc_123',
  containerId: 'signing-container',
  onComplete: function(documentId) {
    // Handle completion
  },
  onError: function(error) {
    // Handle error
  }
});
```

**Security Considerations:**
- Signing links are time-limited
- Tokens are single-use
- Implement proper iframe sandbox attributes
- Handle CSP (Content Security Policy) headers

---

### Sender Identities

Allow users to customize their sender identity (name, email, company) when sending documents.

**Key Features:**
- Custom sender name
- Custom sender email
- Company/branding information
- Profile pictures/logos

**Endpoint:** `POST /api/v1/identities/create`

**Example Request:**
```json
{
  "name": "John Smith",
  "email": "john@magnetagent.com",
  "companyName": "MagnetAgent",
  "title": "Real Estate Agent",
  "logoUrl": "https://magnetagent.com/logo.png"
}
```

**Endpoint:** `GET /api/v1/identities`

**Get user's identities:**
```json
{
  "identities": [
    {
      "id": "identity_123",
      "name": "John Smith",
      "email": "john@magnetagent.com",
      "companyName": "MagnetAgent",
      "isDefault": true
    }
  ]
}
```

**Using Identity When Sending:**
```json
{
  "documentId": "doc_123",
  "senderIdentityId": "identity_123",
  "signers": [...]
}
```

**Implementation Notes:**
- Users can have multiple identities
- One identity can be set as default
- Identity must be verified before use
- Stored in `bold_sign_identities` table

---

### Document Templates ⭐ CRITICAL FOR REAL ESTATE

Create reusable document templates with pre-configured form fields.

**Why Critical:**
- Purchase agreements have standard fields (buyer name, price, closing date)
- Templates save time - pre-configure fields once
- Auto-fill from transaction data
- Ensures consistency across documents

**Endpoints:**
- `POST /api/v1/template/create` - Create template from document
- `POST /api/v1/template/{templateId}/createDocument` - Send document from template
- `GET /api/v1/templates` - List all templates

**Template Features:**
- Form field mapping (text, dates, signatures, initials)
- Template variables (e.g., `{{buyer_name}}`, `{{purchase_price}}`)
- Field positioning (x, y coordinates, page numbers)
- Required vs optional fields

**Real Estate Use Case:**
```json
// Create template
{
  "name": "Standard Purchase Agreement",
  "documentId": "doc_123",
  "fields": [
    {
      "type": "text",
      "name": "buyer_name",
      "x": 100,
      "y": 200,
      "pageNumber": 1,
      "required": true
    },
    {
      "type": "signature",
      "signerEmail": "buyer@example.com",
      "x": 100,
      "y": 400,
      "pageNumber": 2
    }
  ]
}

// Send from template (auto-fills fields)
{
  "templateId": "template_123",
  "templateFields": {
    "buyer_name": "John Doe",
    "purchase_price": "$350,000",
    "closing_date": "2025-12-15"
  },
  "signers": [...]
}
```

---

### Sequential vs Parallel Signing ⭐ IMPORTANT

Control whether signers sign in sequence or simultaneously.

**Sequential Signing:**
- Signer 2 cannot sign until Signer 1 completes
- Required for: Offers (buyer signs first, then seller accepts)
- Set via `signerOrder` field

**Parallel Signing:**
- All signers can sign independently
- Used for: Disclosures, addendums
- Set same `signerOrder` or no order

**Example:**
```json
{
  "signers": [
    {
      "email": "buyer@example.com",
      "signerOrder": 1  // Must sign first
    },
    {
      "email": "seller@example.com",
      "signerOrder": 2  // Signs after buyer
    }
  ]
}
```

---

### Signer Authentication Methods ⭐ SECURITY

Different authentication levels for document security.

**Methods:**
- **Email** (default) - Click link in email
- **SMS** - Code sent to phone number
- **Access Code** - Manual code entry
- **In-Person** - Agent witnesses signing

**Example:**
```json
{
  "signers": [
    {
      "email": "buyer@example.com",
      "authenticationMethod": "email"  // Standard
    },
    {
      "email": "high_value_client@example.com",
      "authenticationMethod": "sms",
      "phoneNumber": "+1234567890"
    },
    {
      "email": "secure@example.com",
      "authenticationMethod": "accessCode",
      "accessCode": "ABC123"
    }
  ]
}
```

---

### Automated Reminders ⭐ TIME SAVER

Automatically remind signers to complete documents.

**Features:**
- Custom reminder schedule (e.g., day 1, 3, 7)
- Custom reminder messages
- Expiry reminders (warn before document expires)
- Manual reminder trigger API

**Example:**
```json
{
  "enableReminder": true,
  "reminderDays": [1, 3, 5],  // Send on day 1, 3, and 5
  "reminderMessage": "Reminder: Your purchase agreement is waiting for signature",
  "enableExpiryReminder": true,  // Remind 1 day before expiry
  "expiryDays": 7
}
```

**Real Estate Use Case:**
- Offer expires in 24 hours → Set 1-day reminder
- Standard contract → Reminders on day 1, 3, 7
- Time-sensitive → More frequent reminders

---

### CC Recipients (Carbon Copy) ⭐ COLLABORATION

Keep lenders, title companies, attorneys in the loop.

**Features:**
- CC on all updates
- CC on completion only
- Receive email notifications
- No signing required

**Example:**
```json
{
  "ccEmailAddresses": [
    "lender@example.com",
    "title@example.com",
    "attorney@example.com"
  ],
  "ccRole": "all"  // or "completed" for final only
}
```

**Real Estate Use Case:**
- Send purchase agreement → CC lender and title company
- Keep all parties informed transparently
- Professional collaboration

---

### Form Field Pre-filling ⭐ AUTOMATION

Auto-populate document fields from transaction data.

**Why Critical:**
- Reduces manual data entry
- Prevents errors
- Saves time
- Ensures consistency

**Example:**
```json
{
  "documentId": "doc_123",
  "formFields": {
    "buyer_name": "John Doe",
    "seller_name": "Jane Smith",
    "property_address": "123 Main St, City, State",
    "purchase_price": "$350,000",
    "closing_date": "2025-12-15",
    "earnest_money": "$5,000",
    "mls_number": "123456"
  },
  "signers": [...]
}
```

**Real Estate Use Case:**
- Pull data from transaction record
- Auto-fill all standard fields
- Signers only see signature/initial fields
- No manual typing required

---

### Document Expiration ⭐ TIME MANAGEMENT

Set expiration dates for time-sensitive documents.

**Features:**
- Set expiration in days or specific date
- Auto-reminders before expiry
- Extend expiration if needed
- Void document when expired

**Example:**
```json
{
  "expiryDays": 3,  // Expires in 3 days
  "expiryDate": "2025-11-04T12:00:00Z",  // Or specific date
  "enableExpiryReminder": true,
  "expiryReminderDays": [1]  // Remind 1 day before
}
```

**Real Estate Use Case:**
- Offer expires in 48 hours → Set 2-day expiration
- Standard contract → 7-day expiration
- Extend if negotiation ongoing

---

### In-Person Signing ⭐ MOBILE WORKFLOW

Agent witnesses signing on mobile device/tablet.

**Features:**
- Mobile-optimized signing interface
- Agent hosts signing session
- Witness capability
- Offline signing support

**Example:**
```json
{
  "signers": [
    {
      "email": "buyer@example.com",
      "signerRole": "InPersonSigner",
      "hostEmail": "agent@magnetagent.com",
      "hostName": "Jane Agent"
    }
  ]
}
```

**Real Estate Use Case:**
- Agent visits client's home
- Uses tablet to show document
- Client signs on tablet
- Agent witnesses signing
- Document sent immediately

---

### Document Merge ⭐ WORKFLOW EFFICIENCY

Combine multiple PDFs into one document.

**Features:**
- Merge multiple documents
- Control merge order
- Append addendums to main contract
- Package related documents

**Example:**
```json
{
  "documents": [
    "purchase_agreement.pdf",
    "addendum_1.pdf",
    "disclosure.pdf"
  ],
  "mergeOrder": [1, 2, 3],
  "outputName": "Complete_Purchase_Package.pdf"
}
```

**Real Estate Use Case:**
- Merge purchase agreement + all addendums
- Combine disclosures into one document
- Package inspection report + repair request

---

### Webhooks

Receive real-time notifications about document status changes.

**Supported Events:**
- `document.completed` - All signers have signed
- `document.declined` - Document was declined
- `document.expired` - Document expired
- `document.revoked` - Document was revoked
- `document.sent` - Document sent to signers
- `signer.completed` - Individual signer completed
- `signer.signed` - Signer signed the document
- `signer.viewed` - Signer viewed the document
- `signer.declined` - Signer declined to sign

**Webhook Setup:**

1. **Configure Endpoint in BoldSign Dashboard:**
   - Go to Settings → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/boldsign`
   - Select events to subscribe

2. **Webhook Secret:**
   - Generate webhook secret
   - Store in `BOLDSIGN_WEBHOOK_SECRET` environment variable

3. **Webhook Payload Example:**
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
        "email": "signer@example.com",
        "signedAt": "2025-11-01T12:00:00Z"
      }
    ]
  }
}
```

**Signature Verification:**
BoldSign signs webhooks with HMAC-SHA256. Verify signatures to ensure authenticity.

**Edge Function Handler:**
```typescript
// Verify webhook signature
const signature = req.headers.get('x-boldsign-signature');
const isValid = verifyBoldSignSignature(body, signature, webhookSecret);

if (!isValid) {
  return new Response('Invalid signature', { status: 401 });
}

// Process event
switch (event.event) {
  case 'document.completed':
    await handleDocumentCompleted(event.data);
    break;
  // ... other events
}
```

---

## API Reference

### Base Configuration

```typescript
const BOLDSIGN_API_KEY = Deno.env.get('BOLDSIGN_API_KEY');
const BOLDSIGN_BASE_URL = 'https://api.boldsign.com';

const headers = {
  'Authorization': `Bearer ${BOLDSIGN_API_KEY}`,
  'Content-Type': 'application/json'
};
```

### Common Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/document/send` | Send document |
| POST | `/api/v1/document/sendOnBehalf` | Send on behalf |
| POST | `/api/v1/document/revoke` | Revoke document |
| GET | `/api/v1/document/{id}` | Get document details |
| GET | `/api/v1/document/{id}/download` | Download document |
| GET | `/api/v1/document/{id}/download/signed` | Download signed version |
| GET | `/api/v1/document/{id}/download/audit` | Download audit trail |
| POST | `/api/v1/document/{id}/signingLink` | Generate signing link |
| POST | `/api/v1/document/{id}/remind` | Send reminder to signer |
| POST | `/api/v1/document/upload` | Upload document |
| GET | `/api/v1/templates` | List templates |
| POST | `/api/v1/template/create` | Create template |
| POST | `/api/v1/template/{id}/createDocument` | Send from template |
| GET | `/api/v1/identities` | List sender identities |
| POST | `/api/v1/identities/create` | Create sender identity |
| POST | `/api/v1/document/merge` | Merge multiple documents |

---

## Integration Patterns

### 1. Document Upload → Send Flow

```typescript
// 1. Upload document
const uploadResponse = await uploadDocument(file);

// 2. Prepare signing
const documentId = uploadResponse.documentId;

// 3. Send for signature
const sendResponse = await sendDocument({
  documentId,
  signers: [{ email: 'signer@example.com' }]
});

// 4. Store in database
await storeDocumentMetadata({
  boldSignDocumentId: documentId,
  transactionId: transaction.id,
  status: 'sent'
});
```

### 2. Webhook → Status Update Flow

```typescript
// Webhook receives document.completed event
// 1. Update document status in database
await updateDocumentStatus(documentId, 'completed');

// 2. Deduct credit from user
await deductCredit(userId, 1, 'send_envelope');

// 3. Update transaction status
await updateTransaction(transactionId, { status: 'completed' });

// 4. Notify user
await sendNotification(userId, 'Document signed successfully');
```

### 3. Embedded Signing Flow

```typescript
// 1. Create document
const document = await createDocument(file);

// 2. Generate signing link
const signingLink = await generateSigningLink(document.id);

// 3. Return to frontend for iframe embedding
return { signingLink, documentId: document.id };

// 4. Frontend embeds in iframe
// 5. Listen for completion via webhook
```

---

## Error Handling

### Common Errors

| Status | Error | Description | Solution |
|--------|-------|-------------|----------|
| 401 | Unauthorized | Invalid API key | Check API key configuration |
| 404 | Not Found | Document doesn't exist | Verify document ID |
| 400 | Bad Request | Invalid request data | Validate request payload |
| 429 | Rate Limited | Too many requests | Implement retry with backoff |
| 500 | Server Error | BoldSign service error | Retry, log for investigation |

### Retry Logic

```typescript
async function callBoldSignAPI(endpoint: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${BOLDSIGN_BASE_URL}${endpoint}`, options);
      
      if (response.status === 429) {
        // Rate limited - exponential backoff
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      // Retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

---

## Database Schema (Reference)

```sql
-- BoldSign documents
bold_sign_documents (
  id uuid primary key,
  transaction_id uuid references transactions(id),
  agent_id uuid references profiles(id),
  bold_sign_document_id text unique not null,
  bold_sign_message_id text,
  status text ('draft'|'sent'|'in_progress'|'completed'|'declined'|'expired'|'revoked'),
  signed_pdf_url text,
  audit_trail_url text,
  expires_at timestamp,
  completed_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
)

-- BoldSign sender identities
bold_sign_identities (
  id uuid primary key,
  agent_id uuid references profiles(id),
  bold_sign_identity_id text unique not null,
  name text not null,
  email text not null,
  company_name text,
  title text,
  logo_url text,
  is_default boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
)

-- BoldSign webhook events
bold_sign_events (
  id uuid primary key,
  bold_sign_event_id text unique not null,
  event_type text not null,
  document_id text,
  payload_json jsonb not null,
  processed boolean default false,
  processed_at timestamp,
  error_message text,
  created_at timestamp default now()
)
```

---

## Next Steps

1. Review BoldSign API documentation
2. Set up BoldSign account and get API key
3. Implement Edge Function for BoldSign API calls
4. Set up webhook endpoint
5. Implement document upload/storage
6. Build UI components for document sending
7. Implement embedded signing flow

---

## Resources

- [BoldSign API Documentation](https://boldsign.com/help/api-reference)
- [BoldSign Webhook Guide](https://boldsign.com/help/webhooks)
- [BoldSign Embedded Signing](https://boldsign.com/help/embedded-signing)
- [BoldSign SDK](https://boldsign.com/help/sdk)

