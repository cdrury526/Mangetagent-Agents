/**
 * BoldSign MCP Server
 *
 * 24 API-based tools for BoldSign e-signature integration:
 *
 * Document Management (4 tools):
 * - list-documents: List/search documents with pagination and filtering
 * - get-document-status: Get detailed status with signer progress
 * - send-reminder: Send reminder emails to pending signers
 * - extend-expiry: Extend document expiration dates
 *
 * Document Actions (2 tools):
 * - get-audit-trail: Get audit trail with all signing events
 * - revoke-document: Revoke/cancel pending documents
 *
 * Download & Signing (3 tools):
 * - download-document: Download signed, original, or audit trail PDFs
 * - get-embedded-sign-link: Generate embedded signing URLs
 * - prefill-fields: Pre-fill form fields before sending
 *
 * Document Modification (2 tools) [NEW]:
 * - change-recipient: Replace a signer on an existing document
 * - void-and-resend: Revoke document and send corrected version
 *
 * Template Management (3 tools):
 * - list-templates: List available templates
 * - get-template: Get template details including roles and fields
 * - send-from-template: Send document using a template
 *
 * Bulk Operations (2 tools) [NEW]:
 * - merge-and-send: Combine multiple templates into single document
 * - bulk-send-reminder: Send reminders to multiple documents at once
 *
 * Webhook & Debugging (7 tools):
 * - list-webhook-events: Query webhook event history from database
 * - webhook-health: Check webhook processing health with alert thresholds
 * - test-webhook: Send test webhook payloads for verification
 * - get-config-status: Check BoldSign configuration status
 * - replay-webhook: Re-process failed webhook events [NEW]
 * - get-api-credits: Check API credit usage and quota [NEW]
 * - debug-document-timeline: Visualize document signing timeline [NEW]
 *
 * Sender Identity (1 tool):
 * - list-sender-identities: List all sender identities with verification status
 */

import { MCPServerManifest } from '../../types/index.js';

// Export configuration
export {
  BOLDSIGN_CONFIG,
  SUPABASE_CONFIG,
  WEBHOOK_CONFIG,
  getAccessToken,
  clearTokenCache,
  callBoldSignAPI,
  callEdgeFunction,
  isBoldSignConfigured,
  isSupabaseConfigured,
  getConfigStatus,
} from './config.js';

// Document management tools
export { listDocuments } from './list-documents.js';
export { getDocumentStatus } from './get-document-status.js';

// Document action tools
export {
  sendReminder,
  extendExpiry,
  getAuditTrail,
  revokeDocument,
} from './document-actions.js';

// Download and signing tools
export { downloadDocument } from './download-tools.js';
export { getEmbeddedSignLink } from './embedded-signing-tools.js';
export { prefillFields } from './field-tools.js';

// Document modification tools
export {
  changeRecipient,
  voidAndResend,
} from './document-modification-tools.js';

// Template tools
export {
  listTemplates,
  getTemplate,
  sendFromTemplate,
} from './template-tools.js';

// Bulk operations tools
export {
  mergeAndSend,
  bulkSendReminder,
} from './bulk-tools.js';

// Webhook and debugging tools
export {
  listWebhookEvents,
  webhookHealth,
  testWebhook,
} from './webhook-tools.js';

// Enhanced debugging tools
export {
  replayWebhook,
  getApiCredits,
  debugDocumentTimeline,
} from './enhanced-debugging-tools.js';

// Sender identity tools
export { listSenderIdentities } from './sender-identity-tools.js';

// Import tool definitions for registry
import { listDocumentsDefinition } from './list-documents.js';
import { getDocumentStatusDefinition } from './get-document-status.js';
import {
  sendReminderDefinition,
  extendExpiryDefinition,
  getAuditTrailDefinition,
  revokeDocumentDefinition,
} from './document-actions.js';
import { downloadDocumentDefinition } from './download-tools.js';
import { getEmbeddedSignLinkDefinition } from './embedded-signing-tools.js';
import { prefillFieldsDefinition } from './field-tools.js';
import {
  changeRecipientDefinition,
  voidAndResendDefinition,
} from './document-modification-tools.js';
import {
  listTemplatesDefinition,
  getTemplateDefinition,
  sendFromTemplateDefinition,
} from './template-tools.js';
import {
  mergeAndSendDefinition,
  bulkSendReminderDefinition,
} from './bulk-tools.js';
import {
  listWebhookEventsDefinition,
  webhookHealthDefinition,
  testWebhookDefinition,
} from './webhook-tools.js';
import {
  replayWebhookDefinition,
  getApiCreditsDefinition,
  debugDocumentTimelineDefinition,
} from './enhanced-debugging-tools.js';
import { listSenderIdentitiesDefinition } from './sender-identity-tools.js';
import { getConfigStatus } from './config.js';
import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';

// =============================================================================
// Config Status Tool
// =============================================================================

const configStatusInputSchema = z.object({});

export interface ConfigStatusOutput {
  boldsignConfigured: boolean;
  supabaseConfigured: boolean;
  hasOAuthCredentials: boolean;
  hasApiKey: boolean;
  boldsignBaseUrl: string;
  supabaseUrl: string;
  edgeFunctionUrl: string;
  webhookUrl: string;
}

export async function getConfigStatusTool(): Promise<MCPToolResult<ConfigStatusOutput>> {
  const startTime = Date.now();

  try {
    const status = getConfigStatus();

    return {
      success: true,
      data: status as unknown as ConfigStatusOutput,
      metadata: {
        tool: 'get-config-status',
        server: 'boldsign',
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CONFIG_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        tool: 'get-config-status',
        server: 'boldsign',
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getConfigStatusDefinition: MCPToolDefinition = {
  name: 'get-config-status',
  mcpName: 'mcp__boldsign__get_config_status',
  description:
    'Check BoldSign and Supabase configuration status for debugging connectivity issues.',
  inputSchema: configStatusInputSchema,
  tags: ['config', 'debugging', 'status', 'boldsign'],
  examples: [
    {
      description: 'Check configuration',
      input: {},
      expectedOutput:
        '{ boldsignConfigured: true, supabaseConfigured: true, hasOAuthCredentials: true }',
    },
  ],
};

/**
 * BoldSign server manifest
 */
export const manifest: MCPServerManifest = {
  name: 'boldsign',
  description:
    'BoldSign e-signature API for documents, templates, webhooks, and audit trails',
  version: '1.0.0',
  apiBaseUrl: 'https://api.boldsign.com/v1',
  tools: [
    // Document Management
    listDocumentsDefinition,
    getDocumentStatusDefinition,
    sendReminderDefinition,
    extendExpiryDefinition,

    // Document Actions
    getAuditTrailDefinition,
    revokeDocumentDefinition,

    // Download & Signing
    downloadDocumentDefinition,
    getEmbeddedSignLinkDefinition,
    prefillFieldsDefinition,

    // Document Modification
    changeRecipientDefinition,
    voidAndResendDefinition,

    // Template Management
    listTemplatesDefinition,
    getTemplateDefinition,
    sendFromTemplateDefinition,

    // Bulk Operations
    mergeAndSendDefinition,
    bulkSendReminderDefinition,

    // Webhook & Debugging
    listWebhookEventsDefinition,
    webhookHealthDefinition,
    testWebhookDefinition,
    getConfigStatusDefinition,

    // Enhanced Debugging
    replayWebhookDefinition,
    getApiCreditsDefinition,
    debugDocumentTimelineDefinition,

    // Sender Identity
    listSenderIdentitiesDefinition,
  ],
  documentation: 'Docs/Boldsign/README.md',
};
