# BoldSign Features for Real Estate Agents

Complete guide to BoldSign features specifically relevant for real estate transaction document signing.

## 🏠 Real Estate Use Cases

### Common Documents Agents Send:
- Purchase Agreements
- Addendums & Amendments
- Disclosures (property, lead-based paint, etc.)
- Inspection Reports
- Repair Requests
- Closing Documents
- Listing Agreements
- Rental Agreements
- Counter-offers

### Typical Signing Scenarios:
- **Buyer & Seller** - Both parties need to sign (sequential or parallel)
- **Co-buyers** - Multiple buyers on same document
- **Spouses** - Both spouses must sign
- **Power of Attorney** - Agent signing on behalf
- **In-Person Signing** - Agent present with client
- **Remote Signing** - Client signs independently

---

## ✅ Features You've Already Captured

### Core Features (Documented)
- ✅ **Send Document** - Basic sending functionality
- ✅ **Send Document On-Behalf** - For agents/assistants
- ✅ **Revoke Document** - Cancel before signing
- ✅ **Download Document** - Get signed PDFs
- ✅ **Embed in iFrame** - Embedded signing experience
- ✅ **Sender Identities** - Custom sender info
- ✅ **Webhooks** - Status notifications

---

## 🎯 Additional Features to Consider

### 1. Document Templates with Form Fields ⭐ CRITICAL

**Why Critical for Real Estate:**
- Purchase agreements have standard fields (buyer name, price, closing date)
- Templates save time - pre-configure fields
- Auto-fill from transaction data
- Ensures consistency

**BoldSign Features:**
- **Template Creation** - Create reusable templates
- **Form Fields** - Text fields, dates, checkboxes, signatures, initials
- **Field Mapping** - Map template fields to signer data
- **Template Variables** - Dynamic content (e.g., `{{buyer_name}}`, `{{purchase_price}}`)

**Implementation:**
```typescript
// Create template from document
POST /api/v1/template/create
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

// Send document from template
POST /api/v1/template/{templateId}/createDocument
{
  "templateFields": {
    "buyer_name": "John Doe",
    "purchase_price": "$350,000",
    "closing_date": "2025-12-15"
  },
  "signers": [...]
}
```

**Real Estate Use Case:**
- Agent creates template for "Purchase Agreement"
- Maps fields: buyer name, seller name, property address, price, closing date
- When sending, auto-fills from transaction data
- Signers only see signature/initial fields

---

### 2. Sequential vs Parallel Signing ⭐ IMPORTANT

**Why Important:**
- Some documents require sequential signing (buyer signs first, then seller)
- Others can be signed in parallel (both sign independently)
- Real estate contracts often sequential

**BoldSign Features:**
- **Signer Order** - Control signing sequence
- **Sequential Signing** - Signer 2 can't sign until Signer 1 completes
- **Parallel Signing** - All signers can sign simultaneously
- **Signer Roles** - Assign roles (Buyer, Seller, Agent, etc.)

**Implementation:**
```json
{
  "signers": [
    {
      "email": "buyer@example.com",
      "firstName": "John",
      "lastName": "Buyer",
      "signerOrder": 1,  // Must sign first
      "signerRole": "Buyer"
    },
    {
      "email": "seller@example.com",
      "firstName": "Jane",
      "lastName": "Seller",
      "signerOrder": 2,  // Signs after buyer
      "signerRole": "Seller"
    }
  ]
}
```

**Real Estate Use Case:**
- Purchase Agreement: Buyer signs first (offer), then Seller (acceptance)
- Counter-offer: Sequential required
- Disclosure: Parallel signing OK (both parties independently)

---

### 3. Signer Authentication Methods ⭐ SECURITY

**Why Important:**
- Real estate documents are legally binding
- Need proper authentication to prevent fraud
- Different methods for different risk levels

**BoldSign Features:**
- **Email Authentication** (default) - Just click link in email
- **SMS Authentication** - Code sent to phone
- **Access Code** - Manual code entry
- **Knowledge-Based Authentication (KBA)** - Identity verification questions
- **In-Person Signing** - Agent present, witness signing

**Implementation:**
```json
{
  "signers": [
    {
      "email": "buyer@example.com",
      "authenticationMethod": "email",  // Default
      "accessCode": null
    },
    {
      "email": "seller@example.com",
      "authenticationMethod": "sms",  // SMS code required
      "phoneNumber": "+1234567890"
    },
    {
      "email": "high_value_client@example.com",
      "authenticationMethod": "accessCode",  // Manual code
      "accessCode": "ABC123"
    }
  ]
}
```

**Real Estate Use Case:**
- Standard documents: Email authentication
- High-value transactions: SMS or access code
- In-person signing: Agent witnesses, uses mobile device

---

### 4. Automated Reminders ⭐ TIME SAVER

**Why Critical:**
- Clients forget to sign documents
- Time-sensitive contracts (offers expire)
- Reduces manual follow-up

**BoldSign Features:**
- **Reminder Settings** - Auto-send reminders
- **Reminder Schedule** - Days after sending (e.g., 1, 3, 7 days)
- **Custom Reminder Messages** - Personalized reminder text
- **Expiry Reminders** - Warn before document expires
- **Reminder API** - Manually trigger reminders

**Implementation:**
```json
{
  "documentId": "doc_123",
  "signers": [...],
  "expiryDays": 7,
  "enableReminder": true,
  "reminderDays": [1, 3, 5],  // Send reminders on day 1, 3, and 5
  "reminderMessage": "Reminder: Your purchase agreement is waiting for your signature",
  "enableExpiryReminder": true  // Send reminder 1 day before expiry
}
```

**Real Estate Use Case:**
- Offer expires in 24 hours → Set 1-day reminder
- Standard contract → Reminders on day 1, 3, 7
- Time-sensitive → More frequent reminders

---

### 5. CC Recipients (Carbon Copy) ⭐ COLLABORATION

**Why Useful:**
- Keep lenders, title companies, attorneys in the loop
- Transparent communication
- No signing required, just visibility

**BoldSign Features:**
- **CC Recipients** - Email addresses to receive copies
- **CC on All Updates** - Get notified of status changes
- **CC on Completion** - Get final signed document

**Implementation:**
```json
{
  "documentId": "doc_123",
  "signers": [...],
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
- Keep all parties informed without additional emails
- Professional transparency

---

### 6. Document Expiration & Auto-Reminders ⭐ TIME MANAGEMENT

**Why Important:**
- Offers expire
- Contracts have deadlines
- Legal compliance

**BoldSign Features:**
- **Expiration Date** - Set document expiry
- **Expiry Actions** - What happens when expired (void, notify, extend)
- **Auto-Reminders** - Before expiration
- **Extension API** - Extend expiration if needed

**Implementation:**
```json
{
  "documentId": "doc_123",
  "expiryDays": 3,  // Expires in 3 days
  "expiryDate": "2025-11-04T12:00:00Z",  // Or specific date
  "enableExpiryReminder": true,
  "expiryReminderDays": [1]  // Remind 1 day before expiry
}
```

**Real Estate Use Case:**
- Offer expires in 48 hours → Set 2-day expiration
- Standard contract → 7-day expiration with reminders
- Extend if negotiation ongoing

---

### 7. In-Person Signing ⭐ MOBILE WORKFLOW

**Why Useful:**
- Agent meets client in person
- Mobile signing on tablet/phone
- Witness the signing process

**BoldSign Features:**
- **In-Person Signer Role** - Agent initiates on device
- **Mobile-Optimized** - Works on tablets/phones
- **Witness Capability** - Agent can witness signing
- **Offline Capability** - Sign offline, sync later

**Implementation:**
```json
{
  "signers": [
    {
      "email": "buyer@example.com",
      "signerRole": "InPersonSigner",  // Special role
      "hostEmail": "agent@magnetagent.com",  // Agent's email
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

### 8. Document Status Tracking ⭐ VISIBILITY

**Why Critical:**
- Agents need to know signing progress
- Track which signers have signed
- Real-time status updates

**BoldSign Features:**
- **Document Status API** - Get current status
- **Signer Status** - Individual signer progress
- **Activity Timeline** - Who signed when
- **Real-time Updates** - Via webhooks

**Implementation:**
```typescript
// Get document status
GET /api/v1/document/{documentId}

// Response includes:
{
  "status": "in_progress",  // draft, sent, in_progress, completed, declined, expired
  "signers": [
    {
      "email": "buyer@example.com",
      "status": "signed",  // pending, viewed, signed, declined
      "signedAt": "2025-11-01T12:00:00Z"
    },
    {
      "email": "seller@example.com",
      "status": "pending",
      "signedAt": null
    }
  ]
}
```

**Real Estate Use Case:**
- Show agent: "Buyer signed, waiting for Seller"
- Dashboard widget: "3 documents pending signature"
- Activity feed: "Purchase Agreement signed by Buyer at 2:30 PM"

---

### 9. Custom Branding ⭐ PROFESSIONAL

**Why Important:**
- Professional appearance
- Brand consistency
- Client trust

**BoldSign Features:**
- **Custom Logo** - Add agent/brokerage logo
- **Custom Colors** - Match brand colors
- **Custom Email Templates** - Branded emails
- **Custom Signing Page** - Branded signing interface

**Implementation:**
```json
{
  "branding": {
    "logoUrl": "https://magnetagent.com/logo.png",
    "primaryColor": "#0066CC",
    "secondaryColor": "#FFFFFF",
    "emailTemplate": "custom_template_id"
  }
}
```

**Real Estate Use Case:**
- Brokerage branding on all documents
- Agent's personal branding
- Professional, consistent experience

---

### 10. Bulk Document Sending ⭐ EFFICIENCY

**Why Useful:**
- Send multiple documents at once
- Package related documents together
- Save time

**BoldSign Features:**
- **Bulk Send API** - Send multiple documents
- **Document Packages** - Group related documents
- **Batch Processing** - Process multiple sends

**Implementation:**
```json
{
  "documents": [
    {
      "documentId": "doc_1",
      "signers": [...]
    },
    {
      "documentId": "doc_2",
      "signers": [...]
    }
  ],
  "sendAsPackage": true  // Send together
}
```

**Real Estate Use Case:**
- Send purchase agreement + disclosures together
- Package all closing documents
- One-click send multiple documents

---

### 11. Document Pre-filling (Form Fields) ⭐ AUTOMATION

**Why Critical:**
- Auto-fill buyer/seller info from transaction
- Pre-populate dates, prices, addresses
- Reduce errors, save time

**BoldSign Features:**
- **Form Field Mapping** - Map data to fields
- **Pre-fill Values** - Set field values before sending
- **Conditional Fields** - Show/hide based on data
- **Calculated Fields** - Auto-calculate (e.g., total price)

**Implementation:**
```json
{
  "documentId": "doc_123",
  "formFields": {
    "buyer_name": "John Doe",
    "seller_name": "Jane Smith",
    "property_address": "123 Main St",
    "purchase_price": "$350,000",
    "closing_date": "2025-12-15",
    "earnest_money": "$5,000"
  },
  "signers": [...]
}
```

**Real Estate Use Case:**
- Pull data from transaction record
- Auto-fill all standard fields
- Signers only see signature fields
- Reduces manual data entry

---

### 12. Document Merge (Multiple PDFs) ⭐ WORKFLOW

**Why Useful:**
- Combine multiple documents into one
- Attach addendums to main contract
- Package related documents

**BoldSign Features:**
- **Document Merge API** - Combine PDFs
- **Append Documents** - Add pages
- **Merge Before Sending** - Pre-process

**Implementation:**
```json
{
  "documents": [
    "purchase_agreement.pdf",
    "addendum_1.pdf",
    "disclosure.pdf"
  ],
  "mergeOrder": [1, 2, 3],  // Order of merge
  "outputName": "Complete_Purchase_Package.pdf"
}
```

**Real Estate Use Case:**
- Merge purchase agreement + all addendums
- Combine disclosures into one document
- Package inspection report + repair request

---

### 13. Comment & Notes Fields ⭐ COMMUNICATION

**Why Useful:**
- Agents add notes for signers
- Signers can add comments
- Context for signatures

**BoldSign Features:**
- **Comment Fields** - Add comments to documents
- **Signer Notes** - Notes visible to signers
- **Internal Notes** - Agent-only notes

**Implementation:**
```json
{
  "documentId": "doc_123",
  "signerNotes": "Please review Section 3 regarding inspection period",
  "internalNotes": "Client requested quick turnaround",
  "commentFields": [
    {
      "pageNumber": 1,
      "x": 100,
      "y": 100,
      "text": "Please initial here if you agree"
    }
  ]
}
```

**Real Estate Use Case:**
- Add instructions for signers
- Highlight important sections
- Provide context

---

### 14. Document Versioning ⭐ COMPLIANCE

**Why Important:**
- Track document changes
- Maintain audit trail
- Legal compliance

**BoldSign Features:**
- **Version History** - Track document versions
- **Version Comparison** - Compare versions
- **Rollback** - Revert to previous version

**Real Estate Use Case:**
- Track contract amendments
- Maintain version history
- Audit trail for legal purposes

---

### 15. Advanced Security Features ⭐ COMPLIANCE

**Why Critical:**
- Real estate documents are sensitive
- Legal compliance requirements
- Fraud prevention

**BoldSign Features:**
- **Digital Certificates** - PKI-based signing
- **Biometric Signatures** - Fingerprint/face recognition
- **Tamper Detection** - Detect document alterations
- **Legal Validity** - Compliance with e-signature laws

**Real Estate Use Case:**
- High-value transactions: Enhanced security
- Legal compliance: ESIGN Act, UETA compliance
- Audit requirements: Complete audit trail

---

## 📋 Feature Priority for Real Estate

### Must-Have (Phase 4)
1. ✅ **Send Document** - Core functionality
2. ✅ **Sequential/Parallel Signing** - Critical for contracts
3. ✅ **Document Templates** - Time saver
4. ✅ **Form Field Pre-filling** - Automation
5. ✅ **Automated Reminders** - Reduces follow-up
6. ✅ **Download Signed Documents** - Archive

### Should-Have (Phase 4+)
7. ✅ **Send On-Behalf** - For assistants
8. ✅ **Revoke Document** - Error correction
9. ✅ **CC Recipients** - Collaboration
10. ✅ **Document Expiration** - Time management
11. ✅ **Embedded Signing** - Better UX
12. ✅ **Status Tracking** - Visibility

### Nice-to-Have (Future)
13. **In-Person Signing** - Mobile workflow
14. **Document Merge** - Workflow efficiency
15. **Bulk Sending** - Scale operations
16. **Custom Branding** - Professional appearance
17. **Advanced Authentication** - High-security cases

---

## 🎯 Recommended Implementation Order

### Phase 4 Core Features:
1. Send Document (basic)
2. Sequential/Parallel Signing
3. Form Field Pre-filling
4. Download Signed Documents
5. Webhooks for Status Updates

### Phase 4+ Enhancements:
6. Document Templates
7. Automated Reminders
8. Document Expiration
9. CC Recipients
10. Embedded Signing

### Future Features:
11. In-Person Signing
12. Document Merge
13. Bulk Sending
14. Custom Branding

---

## 💡 Real Estate Specific Workflows

### Workflow 1: Standard Purchase Agreement
```
1. Agent uploads purchase agreement PDF
2. Agent selects template (if exists)
3. Pre-fill fields from transaction:
   - Buyer name, Seller name
   - Property address
   - Purchase price
   - Closing date
   - Earnest money
4. Set signers:
   - Buyer (signerOrder: 1)
   - Seller (signerOrder: 2) - Sequential
5. CC: Lender, Title Company
6. Set expiration: 48 hours
7. Enable reminders: Day 1
8. Send document
9. Track status via webhooks
10. Download signed PDF when complete
```

### Workflow 2: Disclosures Package
```
1. Agent uploads multiple disclosure PDFs
2. Merge into single document
3. Pre-fill buyer/seller info
4. Set signers: Buyer + Seller (Parallel)
5. Add notes: "Please review all disclosures"
6. Set expiration: 7 days
7. Enable reminders: Day 1, 3, 5
8. Send document
```

### Workflow 3: In-Person Signing
```
1. Agent prepares document
2. Pre-fill all fields
3. Set signer as "InPersonSigner"
4. Agent meets client with tablet
5. Client signs on tablet
6. Agent witnesses signing
7. Document completed immediately
```

---

## 🔍 Missing from Current Documentation?

### Should Add to Docs:

1. **Templates Section** - Detailed template creation/usage
2. **Form Fields Guide** - How to use form fields
3. **Sequential Signing** - Detailed workflow
4. **Reminders Guide** - Reminder configuration
5. **Authentication Methods** - Security options
6. **CC Recipients** - Collaboration features
7. **In-Person Signing** - Mobile workflow
8. **Document Merge** - Combining PDFs
9. **Bulk Operations** - Sending multiple documents
10. **Pre-filling Guide** - Auto-populating fields

---

## 📚 Next Steps

1. **Review BoldSign API Docs** - Verify exact endpoints
2. **Update README.md** - Add missing features
3. **Create Templates Guide** - Detailed template documentation
4. **Create Workflows Guide** - Real estate specific workflows
5. **Update API-Endpoints.md** - Add missing endpoints

---

**Last Updated:** November 2025

