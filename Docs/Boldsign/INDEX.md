# BoldSign Documentation Index

Quick reference guide to all BoldSign integration documentation.

## 📚 Documentation Files

### [README.md](./README.md) - Start Here
**Overview and Quick Reference**
- Complete feature overview
- Authentication setup
- Quick examples for all features
- Database schema reference
- Integration patterns

**Best for:** Getting started, understanding the big picture

---

### [API-Endpoints.md](./API-Endpoints.md) - API Reference
**Complete API Endpoint Documentation**
- All BoldSign API endpoints
- Request/response formats
- Error codes and handling
- Rate limits
- Pagination

**Best for:** Implementing API calls, debugging API issues

---

### [Integration-Guide.md](./Integration-Guide.md) - Step-by-Step Setup
**Complete Integration Walkthrough**
- Phase-by-phase implementation guide
- Database migrations
- Edge Function setup
- Server actions
- UI components
- Testing checklist

**Best for:** Following along during implementation

---

### [Webhooks.md](./Webhooks.md) - Webhook Events
**Webhook Handling Reference**
- All webhook event types
- Signature verification
- Event handlers
- Idempotency
- Monitoring and debugging

**Best for:** Setting up webhooks, handling events

---

### [Embedded-Signing.md](./Embedded-Signing.md) - Embedded Signing
**Embedded Signing Implementation**
- iFrame embedding
- BoldSign SDK usage
- PostMessage communication
- Security considerations
- Customization options

**Best for:** Implementing embedded signing UI

---

## 🎯 Feature Quick Links

### Send Document
- **Overview:** [README.md#send-document](./README.md#send-document)
- **API:** [API-Endpoints.md#send-document](./API-Endpoints.md#send-document)
- **Implementation:** [Integration-Guide.md#phase-3-server-actions](./Integration-Guide.md#phase-3-server-actions)

### Send Document On-Behalf
- **Overview:** [README.md#send-document-on-behalf](./README.md#send-document-on-behalf)
- **API:** [API-Endpoints.md#send-document-on-behalf](./API-Endpoints.md#send-document-on-behalf)

### Revoke Document
- **Overview:** [README.md#revoke-document](./README.md#revoke-document)
- **API:** [API-Endpoints.md#revoke-document](./API-Endpoints.md#revoke-document)
- **Webhook:** [Webhooks.md#documentrevoked](./Webhooks.md#documentrevoked)

### Download Document
- **Overview:** [README.md#download-document](./README.md#download-document)
- **API:** [API-Endpoints.md#download-document](./API-Endpoints.md#download-document)

### Embed in iFrame
- **Complete Guide:** [Embedded-Signing.md](./Embedded-Signing.md)
- **Overview:** [README.md#embed-in-iframe](./README.md#embed-in-iframe)

### Sender Identities
- **Overview:** [README.md#sender-identities](./README.md#sender-identities)
- **API:** [API-Endpoints.md#sender-identities](./API-Endpoints.md#sender-identities)

### Webhooks
- **Complete Guide:** [Webhooks.md](./Webhooks.md)
- **Overview:** [README.md#webhooks](./README.md#webhooks)
- **Setup:** [Integration-Guide.md#phase-5-webhook-configuration](./Integration-Guide.md#phase-5-webhook-configuration)

---

## 🚀 Getting Started Checklist

1. **Read Overview**
   - [ ] Review [README.md](./README.md) for feature overview
   - [ ] Understand authentication requirements
   - [ ] Review database schema

2. **Set Up Integration**
   - [ ] Follow [Integration-Guide.md](./Integration-Guide.md) step-by-step
   - [ ] Configure environment variables
   - [ ] Run database migrations
   - [ ] Deploy Edge Functions

3. **Implement Features**
   - [ ] Send Document - Use [API-Endpoints.md](./API-Endpoints.md) for reference
   - [ ] Send On-Behalf - See [README.md#send-document-on-behalf](./README.md#send-document-on-behalf)
   - [ ] Revoke Document - See [API-Endpoints.md#revoke-document](./API-Endpoints.md#revoke-document)
   - [ ] Download Document - See [API-Endpoints.md#download-document](./API-Endpoints.md#download-document)
   - [ ] Embedded Signing - Follow [Embedded-Signing.md](./Embedded-Signing.md)
   - [ ] Sender Identities - See [README.md#sender-identities](./README.md#sender-identities)

4. **Configure Webhooks**
   - [ ] Set up webhook endpoint - [Webhooks.md#setup](./Webhooks.md#setup)
   - [ ] Implement handlers - [Webhooks.md#webhook-handler-implementation](./Webhooks.md#webhook-handler-implementation)
   - [ ] Test webhooks - [Webhooks.md#testing-webhooks](./Webhooks.md#testing-webhooks)

5. **Test Everything**
   - [ ] Follow testing checklist in [Integration-Guide.md#testing-checklist](./Integration-Guide.md#testing-checklist)
   - [ ] Test all features end-to-end
   - [ ] Verify webhook processing
   - [ ] Test error scenarios

---

## 🔍 Common Tasks

### Need to send a document?
→ [API-Endpoints.md#send-document](./API-Endpoints.md#send-document) + [Integration-Guide.md#phase-3-server-actions](./Integration-Guide.md#phase-3-server-actions)

### Need to embed signing?
→ [Embedded-Signing.md](./Embedded-Signing.md) (complete guide)

### Need to handle webhook events?
→ [Webhooks.md](./Webhooks.md) (all event types and handlers)

### Need to revoke a document?
→ [API-Endpoints.md#revoke-document](./API-Endpoints.md#revoke-document)

### Need to customize sender identity?
→ [README.md#sender-identities](./README.md#sender-identities) + [API-Endpoints.md#sender-identities](./API-Endpoints.md#sender-identities)

### Getting API errors?
→ [API-Endpoints.md#error-responses](./API-Endpoints.md#error-responses) + [README.md#error-handling](./README.md#error-handling)

### Webhook signature failing?
→ [Webhooks.md#signature-verification](./Webhooks.md#signature-verification)

---

## 📖 Documentation Structure

```
Docs/Boldsign/
├── INDEX.md              ← You are here
├── README.md             ← Overview & Quick Reference
├── API-Endpoints.md       ← Complete API Documentation
├── Integration-Guide.md   ← Step-by-Step Implementation
├── Webhooks.md           ← Webhook Events & Handling
└── Embedded-Signing.md   ← Embedded Signing Guide
```

---

## 💡 Tips

1. **Start with README.md** - Get the big picture first
2. **Use API-Endpoints.md** - When implementing specific API calls
3. **Follow Integration-Guide.md** - When setting up from scratch
4. **Reference Webhooks.md** - When processing events
5. **Check Embedded-Signing.md** - When building the signing UI

---

## 🔗 External Resources

- [BoldSign API Documentation](https://boldsign.com/help/api-reference)
- [BoldSign Webhook Guide](https://boldsign.com/help/webhooks)
- [BoldSign Embedded Signing](https://boldsign.com/help/embedded-signing)
- [BoldSign SDK](https://boldsign.com/help/sdk)

---

## 📝 Quick Reference

### API Base URL
```
https://api.boldsign.com/api/v1
```

### Authentication
```http
Authorization: Bearer YOUR_API_KEY
```

### Webhook Endpoint
```
https://tlwzpacimgfnziccqnox.supabase.co/functions/v1/boldsign-webhooks
```

### Database Tables
- `bold_sign_documents` - Document tracking
- `bold_sign_identities` - Sender identities
- `bold_sign_events` - Webhook events

### Environment Variables
```env
BOLDSIGN_API_KEY=your_api_key
BOLDSIGN_BASE_URL=https://api.boldsign.com
BOLDSIGN_WEBHOOK_SECRET=your_webhook_secret
```

---

**Last Updated:** November 2025

