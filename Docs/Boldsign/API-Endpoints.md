# BoldSign API Endpoints Reference

Complete reference for all BoldSign API endpoints used in MagnetAgent.

## Base URL

```
https://api.boldsign.com/api/v1
```

## Authentication

All requests require Bearer token authentication:

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

---

## Document Management

### Send Document

**Endpoint:** `POST /document/send`

**Description:** Send a document to one or more signers for signature.

**Request Body:**
```json
{
  "documentId": "string",
  "signers": [
    {
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "signerOrder": 1,
      "authenticationMethod": "email" | "sms" | "accessCode",
      "signerRole": "Signer" | "InPersonSigner"
    }
  ],
  "emailMessage": "string",
  "subject": "string",
  "expiryDays": 30,
  "enableReminder": true,
  "reminderDays": [7, 14],
  "enableExpiryReminder": true,
  "ccEmailAddresses": ["cc@example.com"],
  "labels": ["label1", "label2"]
}
```

**Response:**
```json
{
  "documentId": "string",
  "messageId": "string",
  "status": "sent",
  "createdDate": "2025-11-01T12:00:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid data)
- `401` - Unauthorized
- `404` - Document not found
- `429` - Rate limited

---

### Send Document On-Behalf

**Endpoint:** `POST /document/sendOnBehalf`

**Description:** Send a document using a specific sender identity.

**Request Body:**
```json
{
  "documentId": "string",
  "senderEmail": "string",
  "senderName": "string",
  "senderIdentityId": "string",
  "signers": [
    {
      "email": "string",
      "firstName": "string",
      "lastName": "string"
    }
  ],
  "emailMessage": "string",
  "subject": "string"
}
```

**Response:**
```json
{
  "documentId": "string",
  "messageId": "string",
  "status": "sent"
}
```

**Note:** Requires sender identity to be configured and verified.

---

### Revoke Document

**Endpoint:** `POST /document/revoke`

**Description:** Revoke/cancel a document that has been sent.

**Request Body:**
```json
{
  "documentId": "string",
  "revokeReason": "string"
}
```

**Response:**
```json
{
  "documentId": "string",
  "status": "revoked",
  "revokedAt": "2025-11-01T12:00:00Z"
}
```

**Requirements:**
- Document must be in `sent` or `in_progress` status
- Cannot revoke `completed` or `declined` documents

---

### Get Document Details

**Endpoint:** `GET /document/{documentId}`

**Description:** Retrieve document information and status.

**Response:**
```json
{
  "documentId": "string",
  "name": "string",
  "status": "sent" | "in_progress" | "completed" | "declined" | "expired" | "revoked",
  "createdDate": "2025-11-01T12:00:00Z",
  "expiryDate": "2025-12-01T12:00:00Z",
  "completedDate": "2025-11-01T12:00:00Z",
  "signers": [
    {
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "status": "pending" | "viewed" | "signed" | "declined",
      "signedDate": "2025-11-01T12:00:00Z"
    }
  ],
  "sender": {
    "email": "string",
    "name": "string"
  }
}
```

---

### Download Document

**Endpoint:** `GET /document/{documentId}/download`

**Description:** Download the original document.

**Query Parameters:**
- `format`: `pdf` (default) | `zip`
- `watermark`: `true` | `false` (default: false)

**Response:**
- Binary PDF file
- Content-Type: `application/pdf`

**Example:**
```http
GET /document/doc_123/download?format=pdf&watermark=true
```

---

### Download Signed Document

**Endpoint:** `GET /document/{documentId}/download/signed`

**Description:** Download the signed version of the document.

**Query Parameters:**
- `format`: `pdf` (default) | `zip`
- `watermark`: `true` | `false`

**Response:**
- Binary PDF file with signatures
- Content-Type: `application/pdf`

---

### Download Audit Trail

**Endpoint:** `GET /document/{documentId}/download/audit`

**Description:** Download the audit trail PDF.

**Response:**
- Binary PDF file
- Content-Type: `application/pdf`

---

### Generate Signing Link

**Endpoint:** `POST /document/{documentId}/signingLink`

**Description:** Generate a signing link for embedded signing.

**Request Body:**
```json
{
  "signerEmail": "string",
  "redirectUrl": "https://your-app.com/signing-complete",
  "expiresIn": 3600
}
```

**Response:**
```json
{
  "signingLink": "https://app.boldsign.com/sign?token=xyz123",
  "expiresAt": "2025-11-01T13:00:00Z"
}
```

**Security:**
- Links are time-limited
- Single-use tokens (usually)
- Should be kept secure

---

## Document Upload

### Upload Document

**Endpoint:** `POST /document/upload`

**Description:** Upload a document to BoldSign.

**Request:**
- Content-Type: `multipart/form-data`
- File field: `file`
- Optional fields: `name`, `labels`

**Response:**
```json
{
  "documentId": "string",
  "name": "string",
  "pageCount": 5,
  "size": 1024000,
  "createdDate": "2025-11-01T12:00:00Z"
}
```

**File Requirements:**
- Formats: PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT
- Max size: 25 MB (varies by plan)
- Must be readable/parseable

---

## Sender Identities

### List Identities

**Endpoint:** `GET /identities`

**Description:** Get all sender identities for the authenticated user.

**Response:**
```json
{
  "identities": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "companyName": "string",
      "title": "string",
      "logoUrl": "string",
      "isDefault": true,
      "createdDate": "2025-11-01T12:00:00Z"
    }
  ]
}
```

---

### Create Identity

**Endpoint:** `POST /identities/create`

**Description:** Create a new sender identity.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "companyName": "string",
  "title": "string",
  "logoUrl": "string",
  "isDefault": false
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "companyName": "string",
  "isDefault": false,
  "createdDate": "2025-11-01T12:00:00Z"
}
```

**Validation:**
- Email must be verified
- Only one default identity per user
- Logo URL must be publicly accessible

---

### Update Identity

**Endpoint:** `PUT /identities/{identityId}`

**Description:** Update an existing sender identity.

**Request Body:** (same as create, all fields optional)

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "updatedDate": "2025-11-01T12:00:00Z"
}
```

---

### Delete Identity

**Endpoint:** `DELETE /identities/{identityId}`

**Description:** Delete a sender identity.

**Response:**
```json
{
  "success": true
}
```

**Note:** Cannot delete default identity. Set another as default first.

---

## Templates

### List Templates

**Endpoint:** `GET /templates`

**Description:** Get all document templates.

**Query Parameters:**
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 20)

**Response:**
```json
{
  "templates": [
    {
      "templateId": "string",
      "name": "string",
      "createdDate": "2025-11-01T12:00:00Z"
    }
  ],
  "totalCount": 50,
  "page": 1,
  "pageSize": 20
}
```

---

### Create Document from Template

**Endpoint:** `POST /template/{templateId}/createDocument`

**Description:** Create a document from a template.

**Request Body:**
```json
{
  "templateFields": {
    "field1": "value1",
    "field2": "value2"
  },
  "signers": [
    {
      "email": "string",
      "firstName": "string",
      "lastName": "string"
    }
  ]
}
```

**Response:**
```json
{
  "documentId": "string",
  "status": "created"
}
```

---

## Webhooks

### Webhook Events

BoldSign sends webhook events to your configured endpoint.

**Webhook URL:** `https://your-domain.com/api/webhooks/boldsign`

**Signature Header:** `X-BoldSign-Signature`

**Event Types:**
- `document.completed`
- `document.declined`
- `document.expired`
- `document.revoked`
- `signer.completed`
- `signer.signed`
- `signer.viewed`
- `signer.declined`

**Webhook Payload:**
```json
{
  "event": "document.completed",
  "timestamp": "2025-11-01T12:00:00Z",
  "data": {
    "documentId": "string",
    "status": "completed",
    "completedAt": "2025-11-01T12:00:00Z",
    "signers": [
      {
        "email": "string",
        "signedAt": "2025-11-01T12:00:00Z"
      }
    ]
  }
}
```

---

## Rate Limits

BoldSign API has rate limits based on your plan:

- **Free Plan:** 100 requests/hour
- **Pro Plan:** 1,000 requests/hour
- **Enterprise:** Custom limits

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1633024800
```

**Handling Rate Limits:**
- Implement exponential backoff
- Cache responses when possible
- Use webhooks instead of polling

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid document ID",
    "details": {
      "field": "documentId",
      "reason": "Document not found"
    }
  }
}
```

### Common Error Codes

| Code | Description | Status |
|------|-------------|--------|
| `INVALID_REQUEST` | Bad request data | 400 |
| `UNAUTHORIZED` | Invalid API key | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | BoldSign server error | 500 |

---

## Pagination

Many list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (1-indexed)
- `pageSize`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## Best Practices

1. **Always verify webhook signatures** - Don't trust unsigned requests
2. **Implement retry logic** - Handle transient failures gracefully
3. **Cache document status** - Reduce API calls
4. **Use webhooks** - Prefer webhooks over polling
5. **Handle rate limits** - Implement exponential backoff
6. **Store document IDs** - Reference BoldSign documents by ID
7. **Log all API calls** - For debugging and audit trails
8. **Validate responses** - Check status codes and error messages

