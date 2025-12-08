/**
 * BoldSign MCP Server Type Definitions
 *
 * Types for BoldSign e-signature API operations including:
 * - Document lifecycle management
 * - Webhook event tracking
 * - Audit trail retrieval
 * - Signer management
 * - Development/debugging tools
 * - Document downloads (signed, original, combined, audit trail)
 * - Embedded signing workflows
 * - Field pre-filling and management
 * - Enhanced debugging (timeline, API credits, webhook replay)
 * - Document modifications (change recipient, void and resend)
 * - Bulk operations (merge templates, bulk reminders)
 */

// =============================================================================
// Document Types
// =============================================================================

export type BoldSignDocumentStatus =
  | 'draft'
  | 'sent'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'revoked';

export interface BoldSignSigner {
  signerEmail: string;
  signerName: string;
  signerOrder: number;
  status: 'pending' | 'viewed' | 'signed' | 'declined' | 'expired';
  signedDate?: string;
  viewedDate?: string;
  declinedDate?: string;
  declineReason?: string;
  ipAddress?: string;
}

export interface BoldSignDocument {
  documentId: string;
  title: string;
  status: BoldSignDocumentStatus;
  createdDate: string;
  expiryDate?: string;
  completedDate?: string;
  signers: BoldSignSigner[];
  senderEmail: string;
  senderName: string;
  messageTitle?: string;
  message?: string;
}

// =============================================================================
// List Documents Types
// =============================================================================

export interface ListDocumentsInput {
  /** Filter by status */
  status?: BoldSignDocumentStatus;
  /** Filter by sender email */
  senderEmail?: string;
  /** Search term for title/document */
  searchTerm?: string;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page (default: 10, max: 100) */
  pageSize?: number;
  /** Sort field */
  sortBy?: 'createdDate' | 'expiryDate' | 'title' | 'status';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Start date filter (ISO format) */
  startDate?: string;
  /** End date filter (ISO format) */
  endDate?: string;
}

export interface ListDocumentsOutput {
  documents: BoldSignDocument[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// =============================================================================
// Get Document Status Types
// =============================================================================

export interface GetDocumentStatusInput {
  /** BoldSign document ID */
  documentId: string;
}

export interface GetDocumentStatusOutput {
  document: BoldSignDocument;
  signerDetails: BoldSignSigner[];
  auditEvents: Array<{
    eventType: string;
    eventDate: string;
    actor: string;
    ipAddress?: string;
    details?: string;
  }>;
  downloadLinks: {
    original?: string;
    signed?: string;
    auditTrail?: string;
  };
}

// =============================================================================
// Webhook Event Types
// =============================================================================

export type WebhookEventType =
  | 'document.sent'
  | 'document.completed'
  | 'document.declined'
  | 'document.expired'
  | 'document.revoked'
  | 'signer.viewed'
  | 'signer.signed'
  | 'signer.completed'
  | 'signer.declined';

export interface WebhookEvent {
  id: string;
  eventType: WebhookEventType;
  documentId: string;
  timestamp: string;
  processed: boolean;
  processingError?: string;
  payload: Record<string, unknown>;
  signerEmail?: string;
  ipAddress?: string;
}

export interface ListWebhookEventsInput {
  /** Filter by document ID */
  documentId?: string;
  /** Filter by event type */
  eventType?: WebhookEventType;
  /** Filter by processed status */
  processed?: boolean;
  /** Filter by date range start */
  startDate?: string;
  /** Filter by date range end */
  endDate?: string;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

export interface ListWebhookEventsOutput {
  events: WebhookEvent[];
  summary: {
    total: number;
    processed: number;
    failed: number;
    byType: Record<string, number>;
  };
}

// =============================================================================
// Reminder Types
// =============================================================================

export interface SendReminderInput {
  /** BoldSign document ID */
  documentId: string;
  /** Optional: specific signer email (if not provided, reminds all pending signers) */
  signerEmail?: string;
  /** Optional: custom reminder message */
  message?: string;
}

export interface SendReminderOutput {
  success: boolean;
  remindersSent: number;
  signers: Array<{
    email: string;
    status: string;
    reminderSent: boolean;
  }>;
}

// =============================================================================
// Extend Expiry Types
// =============================================================================

export interface ExtendExpiryInput {
  /** BoldSign document ID */
  documentId: string;
  /** New expiry date (ISO format) or number of additional days */
  newExpiryDate?: string;
  /** Days to add to current expiry */
  additionalDays?: number;
}

export interface ExtendExpiryOutput {
  success: boolean;
  documentId: string;
  previousExpiryDate: string;
  newExpiryDate: string;
}

// =============================================================================
// Audit Trail Types
// =============================================================================

export interface GetAuditTrailInput {
  /** BoldSign document ID */
  documentId: string;
  /** Output format */
  format?: 'pdf' | 'json';
}

export interface AuditTrailEvent {
  timestamp: string;
  eventType: string;
  actor: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface GetAuditTrailOutput {
  documentId: string;
  documentTitle: string;
  events: AuditTrailEvent[];
  pdfUrl?: string;
  certificateOfCompletion?: {
    signedAt: string;
    documentHash: string;
    signerCertificates: Array<{
      signerName: string;
      signerEmail: string;
      signedAt: string;
      ipAddress: string;
    }>;
  };
}

// =============================================================================
// Template Types
// =============================================================================

export interface BoldSignTemplate {
  templateId: string;
  title: string;
  description?: string;
  createdDate: string;
  modifiedDate?: string;
  roles: Array<{
    roleId: string;
    roleName: string;
    roleIndex: number;
  }>;
  formFields: Array<{
    fieldId: string;
    fieldType: string;
    pageNumber: number;
    roleId: string;
    required: boolean;
  }>;
}

export interface ListTemplatesInput {
  /** Search term */
  searchTerm?: string;
  /** Page number */
  page?: number;
  /** Page size */
  pageSize?: number;
}

export interface ListTemplatesOutput {
  templates: BoldSignTemplate[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

// =============================================================================
// Webhook Health Types
// =============================================================================

export interface WebhookHealthInput {
  /** Time period in hours to check (default: 24) */
  hours?: number;
}

export interface WebhookHealthOutput {
  status: 'healthy' | 'degraded' | 'unhealthy';
  period: {
    start: string;
    end: string;
    hours: number;
  };
  metrics: {
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    successRate: number;
    averageProcessingTimeMs: number;
    p95ProcessingTimeMs: number;
  };
  recentErrors: Array<{
    eventId: string;
    eventType: string;
    error: string;
    timestamp: string;
  }>;
  recommendations: string[];
}

// =============================================================================
// Test Webhook Types
// =============================================================================

export interface TestWebhookInput {
  /** Event type to simulate */
  eventType: WebhookEventType;
  /** Document ID to use (or 'test_xxx' for mock) */
  documentId?: string;
  /** Signer email for signer events */
  signerEmail?: string;
}

export interface TestWebhookOutput {
  success: boolean;
  eventId: string;
  webhookUrl: string;
  requestPayload: Record<string, unknown>;
  responseStatus: number;
  responseBody?: string;
  processingTimeMs: number;
}

// =============================================================================
// Signer Management Types
// =============================================================================

export interface ListSignersInput {
  /** BoldSign document ID */
  documentId: string;
}

export interface ListSignersOutput {
  documentId: string;
  signers: Array<BoldSignSigner & {
    embeddedSigningUrl?: string;
    canResend: boolean;
  }>;
}

export interface ResendToSignerInput {
  /** BoldSign document ID */
  documentId: string;
  /** Signer email address */
  signerEmail: string;
  /** Optional custom message */
  message?: string;
}

export interface ResendToSignerOutput {
  success: boolean;
  documentId: string;
  signerEmail: string;
  newSigningLink?: string;
}

// =============================================================================
// Analytics Types
// =============================================================================

export interface GetAnalyticsInput {
  /** Start date (ISO format) */
  startDate?: string;
  /** End date (ISO format) */
  endDate?: string;
  /** Group by period */
  groupBy?: 'day' | 'week' | 'month';
}

export interface GetAnalyticsOutput {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalDocuments: number;
    completedDocuments: number;
    declinedDocuments: number;
    expiredDocuments: number;
    revokedDocuments: number;
    pendingDocuments: number;
    completionRate: number;
    averageTimeToCompleteHours: number;
  };
  byPeriod: Array<{
    period: string;
    sent: number;
    completed: number;
    declined: number;
    expired: number;
  }>;
  topDeclineReasons: Array<{
    reason: string;
    count: number;
  }>;
}

// =============================================================================
// Download Tools Types
// =============================================================================

export interface DownloadDocumentInput {
  /** BoldSign document ID */
  documentId: string;
  /** Type of document to download */
  type: 'signed' | 'original' | 'combined' | 'audit-trail';
  /** Output format (default: base64) */
  format?: 'pdf' | 'base64';
}

export interface DownloadDocumentOutput {
  documentId: string;
  type: string;
  format: string;
  /** Base64 encoded content if format=base64 */
  content?: string;
  /** Temporary download URL if format=pdf */
  downloadUrl?: string;
  /** URL expiry timestamp if applicable */
  expiresAt?: string;
  sizeBytes: number;
  mimeType: string;
}

// =============================================================================
// Embedded Signing Types
// =============================================================================

export interface GetEmbeddedSignLinkInput {
  /** BoldSign document ID */
  documentId: string;
  /** Signer email address */
  signerEmail: string;
  /** Optional redirect URL after signing */
  redirectUrl?: string;
  /** Link expiry in minutes (default: 30) */
  linkExpiryMinutes?: number;
}

export interface GetEmbeddedSignLinkOutput {
  signUrl: string;
  expiresAt: string;
  signerEmail: string;
  documentId: string;
}

// =============================================================================
// Field Management Types
// =============================================================================

export interface PrefillFieldsInput {
  /** BoldSign document ID */
  documentId: string;
  /** Array of fields to pre-fill */
  fields: Array<{
    fieldId: string;
    value: string;
  }>;
}

export interface PrefillFieldsOutput {
  success: boolean;
  documentId: string;
  fieldsUpdated: number;
  fieldResults: Array<{
    fieldId: string;
    success: boolean;
    error?: string;
  }>;
}

// =============================================================================
// Enhanced Debugging Types
// =============================================================================

export interface ReplayWebhookInput {
  /** Specific event ID to replay */
  eventId?: string;
  /** Replay all failed events for this document */
  documentId?: string;
  /** Filter by event type */
  eventType?: WebhookEventType;
  /** Maximum events to replay (default: 10) */
  limit?: number;
}

export interface ReplayWebhookOutput {
  replayedCount: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    eventId: string;
    eventType: string;
    success: boolean;
    error?: string;
    processingTimeMs: number;
  }>;
}

export interface GetApiCreditsInput {
  // No input required
}

export interface GetApiCreditsOutput {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  usagePercentage: number;
  resetsAt?: string;
  planType?: string;
  usageByOperation?: Record<string, number>;
}

export interface DebugDocumentTimelineInput {
  /** BoldSign document ID */
  documentId: string;
}

export interface DebugDocumentTimelineOutput {
  documentId: string;
  documentTitle: string;
  currentStatus: string;
  timeline: Array<{
    timestamp: string;
    event: string;
    actor: string;
    actorEmail?: string;
    durationSinceLastMs: number;
    details?: Record<string, unknown>;
  }>;
  metrics: {
    totalDurationMs: number;
    timeToFirstViewMs?: number;
    timeToCompletionMs?: number;
    averageSigningTimeMs?: number;
    bottlenecks: Array<{
      signer: string;
      signerEmail: string;
      waitTimeMs: number;
      status: string;
    }>;
  };
}

export interface WebhookAlertThresholds {
  /** Alert if error rate exceeds this percentage */
  errorRatePercent?: number;
  /** Alert if P95 processing time exceeds this (ms) */
  processingTimeMs?: number;
  /** Alert if unprocessed events exceed this count */
  backlogCount?: number;
}

export interface WebhookAlert {
  type: 'error_rate' | 'latency' | 'backlog';
  threshold: number;
  actual: number;
  severity: 'warning' | 'critical';
  message: string;
}

// Enhanced WebhookHealthInput with alert thresholds
export interface EnhancedWebhookHealthInput extends WebhookHealthInput {
  /** Optional alert thresholds */
  alertThresholds?: WebhookAlertThresholds;
}

// Enhanced WebhookHealthOutput with alerts
export interface EnhancedWebhookHealthOutput extends WebhookHealthOutput {
  /** Active alerts based on thresholds */
  alerts?: WebhookAlert[];
}

// =============================================================================
// Document Modification Types
// =============================================================================

export interface ChangeRecipientInput {
  /** BoldSign document ID */
  documentId: string;
  /** Current signer email to replace */
  oldSignerEmail: string;
  /** New signer email address */
  newSignerEmail: string;
  /** New signer full name */
  newSignerName: string;
  /** Send notification to new signer (default: true) */
  resendNotification?: boolean;
  /** Optional reason for the change */
  reason?: string;
}

export interface ChangeRecipientOutput {
  success: boolean;
  documentId: string;
  previousSigner: {
    email: string;
    name: string;
  };
  newSigner: {
    email: string;
    name: string;
  };
  notificationSent: boolean;
}

export interface VoidAndResendInput {
  /** Original document ID to void */
  originalDocumentId: string;
  /** Reason for voiding the document */
  voidReason: string;
  /** Use this template ID (if not specified, uses same template) */
  templateId?: string;
  /** New document title */
  title?: string;
  /** New document message */
  message?: string;
  /** Corrections to apply to the new document */
  corrections?: {
    /** Update signer roles */
    roles?: Array<{
      roleId: string;
      signerEmail: string;
      signerName: string;
    }>;
    /** Pre-fill fields with corrected values */
    prefillFields?: Array<{
      fieldId: string;
      value: string;
    }>;
  };
  /** Expiry days for new document */
  expiryDays?: number;
}

export interface VoidAndResendOutput {
  success: boolean;
  voidedDocumentId: string;
  newDocumentId: string;
  templateId: string;
  signers: Array<{
    roleId: string;
    email: string;
    name: string;
  }>;
}

// =============================================================================
// Bulk Operations Types
// =============================================================================

export interface MergeAndSendInput {
  /** Array of templates to merge */
  templates: Array<{
    templateId: string;
    roles: Array<{
      roleId: string;
      signerEmail: string;
      signerName: string;
    }>;
  }>;
  /** Title for merged document */
  title: string;
  /** Optional message for signers */
  message?: string;
  /** Expiry days for merged document */
  expiryDays?: number;
}

export interface MergeAndSendOutput {
  success: boolean;
  documentId: string;
  mergedFromTemplates: string[];
  title: string;
  signers: Array<{
    email: string;
    name: string;
    roleId: string;
    templateId: string;
  }>;
}

export interface BulkSendReminderInput {
  // Single document mode (existing)
  /** BoldSign document ID for single reminder */
  documentId?: string;
  /** Specific signer email for single reminder */
  signerEmail?: string;
  /** Custom reminder message */
  message?: string;

  // Bulk mode (new)
  /** Bulk reminder configuration */
  bulkMode?: {
    /** Array of specific document IDs */
    documentIds?: string[];
    /** Send to all pending documents */
    status?: 'all_pending';
    /** Only documents older than N days */
    olderThanDays?: number;
  };
}

export interface BulkSendReminderOutput {
  success: boolean;
  totalDocuments: number;
  totalReminders: number;
  results: Array<{
    documentId: string;
    success: boolean;
    remindersSent: number;
    error?: string;
  }>;
}

// =============================================================================
// Sender Identity Types
// =============================================================================

export interface SenderIdentity {
  /** Unique identifier */
  senderIdentityId: string;
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** Status: Verified, Pending, etc. */
  status: string;
  /** Whether this is the default sender */
  isDefault?: boolean;
  /** Created date */
  createdDate?: string;
}

export interface ListSenderIdentitiesInput {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page (default: 10, max: 100) */
  pageSize?: number;
  /** Search term */
  searchTerm?: string;
}

export interface ListSenderIdentitiesOutput {
  identities: SenderIdentity[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
