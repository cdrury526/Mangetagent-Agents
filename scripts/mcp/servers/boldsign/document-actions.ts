/**
 * BoldSign: Document Actions
 *
 * Tools for document lifecycle management:
 * - send-reminder: Send reminder to pending signers
 * - extend-expiry: Extend document expiration date
 * - get-audit-trail: Download audit trail PDF
 * - revoke-document: Revoke/cancel a document
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  SendReminderInput,
  SendReminderOutput,
  ExtendExpiryInput,
  ExtendExpiryOutput,
  GetAuditTrailInput,
  GetAuditTrailOutput,
} from '../../types/boldsign.types.js';
import { callBoldSignAPI } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// Send Reminder
// =============================================================================

const sendReminderInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  signerEmail: z.string().email().optional(),
  message: z.string().optional(),
});

/**
 * Send reminder to pending signers
 */
export async function sendReminder(
  input: SendReminderInput
): Promise<MCPToolResult<SendReminderOutput>> {
  const startTime = Date.now();
  const validated = sendReminderInputSchema.parse(input);

  try {
    // First get document status to check which signers are pending
    const docResponse = await callBoldSignAPI(`/document/${validated.documentId}`, {
      method: 'GET',
    });

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      return {
        success: false,
        error: {
          code: `HTTP_${docResponse.status}`,
          message: errorText || 'Failed to get document details',
        },
        metadata: {
          tool: 'send-reminder',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const docData = (await docResponse.json()) as {
      signerDetails?: Array<{
        signerEmail: string;
        signerName: string;
        status: string;
      }>;
    };

    // Filter for pending signers
    let signersToRemind = docData.signerDetails?.filter(
      (s) => s.status === 'Pending' || s.status === 'NotSigned'
    ) || [];

    // If specific signer requested, filter to just that one
    if (validated.signerEmail) {
      signersToRemind = signersToRemind.filter(
        (s) => s.signerEmail.toLowerCase() === validated.signerEmail!.toLowerCase()
      );
    }

    if (signersToRemind.length === 0) {
      return {
        success: true,
        data: {
          success: true,
          remindersSent: 0,
          signers:
            docData.signerDetails?.map((s) => ({
              email: s.signerEmail,
              status: s.status,
              reminderSent: false,
            })) || [],
        },
        metadata: {
          tool: 'send-reminder',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Send reminder via BoldSign API
    const payload: Record<string, unknown> = {
      documentId: validated.documentId,
    };
    if (validated.signerEmail) {
      payload.signerEmails = [validated.signerEmail];
    }
    if (validated.message) {
      payload.reminderMessage = validated.message;
    }

    const response = await callBoldSignAPI('/document/remind', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }

      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorMessage,
        },
        metadata: {
          tool: 'send-reminder',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: {
        success: true,
        remindersSent: signersToRemind.length,
        signers:
          docData.signerDetails?.map((s) => ({
            email: s.signerEmail,
            status: s.status,
            reminderSent: signersToRemind.some(
              (r) => r.signerEmail.toLowerCase() === s.signerEmail.toLowerCase()
            ),
          })) || [],
      },
      metadata: {
        tool: 'send-reminder',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        tool: 'send-reminder',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const sendReminderDefinition: MCPToolDefinition = {
  name: 'send-reminder',
  mcpName: 'mcp__boldsign__send_reminder',
  apiEndpoint: '/v1/document/remind',
  description: 'Send reminder emails to pending signers on a BoldSign document.',
  inputSchema: sendReminderInputSchema,
  tags: ['documents', 'reminder', 'signers', 'boldsign', 'api'],
  examples: [
    {
      description: 'Remind all pending signers',
      input: { documentId: 'abc-123' },
      expectedOutput: '{ success: true, remindersSent: 2 }',
    },
    {
      description: 'Remind specific signer',
      input: { documentId: 'abc-123', signerEmail: 'buyer@example.com' },
      expectedOutput: '{ success: true, remindersSent: 1 }',
    },
  ],
};

// =============================================================================
// Extend Expiry
// =============================================================================

const extendExpiryInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  newExpiryDate: z.string().optional(),
  additionalDays: z.number().int().min(1).max(365).optional(),
});

/**
 * Extend document expiration date
 */
export async function extendExpiry(
  input: ExtendExpiryInput
): Promise<MCPToolResult<ExtendExpiryOutput>> {
  const startTime = Date.now();
  const validated = extendExpiryInputSchema.parse(input);

  if (!validated.newExpiryDate && !validated.additionalDays) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Either newExpiryDate or additionalDays is required',
      },
      metadata: {
        tool: 'extend-expiry',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }

  try {
    // Get current document to find existing expiry
    const docResponse = await callBoldSignAPI(`/document/${validated.documentId}`, {
      method: 'GET',
    });

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      return {
        success: false,
        error: {
          code: `HTTP_${docResponse.status}`,
          message: errorText || 'Failed to get document details',
        },
        metadata: {
          tool: 'extend-expiry',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const docData = (await docResponse.json()) as {
      expiryDate?: string;
    };

    const previousExpiryDate = docData.expiryDate || new Date().toISOString();

    // Calculate new expiry date
    let newExpiryDate: string;
    if (validated.newExpiryDate) {
      newExpiryDate = validated.newExpiryDate;
    } else {
      const currentExpiry = new Date(previousExpiryDate);
      currentExpiry.setDate(currentExpiry.getDate() + (validated.additionalDays || 30));
      newExpiryDate = currentExpiry.toISOString();
    }

    // Call BoldSign API to extend expiry
    const response = await callBoldSignAPI('/document/extendExpiry', {
      method: 'POST',
      body: JSON.stringify({
        documentId: validated.documentId,
        newExpiryDate,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }

      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorMessage,
        },
        metadata: {
          tool: 'extend-expiry',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: {
        success: true,
        documentId: validated.documentId,
        previousExpiryDate,
        newExpiryDate,
      },
      metadata: {
        tool: 'extend-expiry',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        tool: 'extend-expiry',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const extendExpiryDefinition: MCPToolDefinition = {
  name: 'extend-expiry',
  mcpName: 'mcp__boldsign__extend_expiry',
  apiEndpoint: '/v1/document/extendExpiry',
  description: 'Extend the expiration date of a BoldSign document.',
  inputSchema: extendExpiryInputSchema,
  tags: ['documents', 'expiry', 'deadline', 'boldsign', 'api'],
  examples: [
    {
      description: 'Extend by 30 days',
      input: { documentId: 'abc-123', additionalDays: 30 },
      expectedOutput: '{ success: true, newExpiryDate: "2025-02-28T..." }',
    },
    {
      description: 'Set specific date',
      input: { documentId: 'abc-123', newExpiryDate: '2025-03-15T00:00:00Z' },
      expectedOutput: '{ success: true, newExpiryDate: "2025-03-15T00:00:00Z" }',
    },
  ],
};

// =============================================================================
// Get Audit Trail
// =============================================================================

const getAuditTrailInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  format: z.enum(['pdf', 'json']).default('json'),
});

/**
 * Get audit trail for a document
 */
export async function getAuditTrail(
  input: GetAuditTrailInput
): Promise<MCPToolResult<GetAuditTrailOutput>> {
  const startTime = Date.now();
  const validated = getAuditTrailInputSchema.parse(input);

  try {
    // Get document details first
    const docResponse = await callBoldSignAPI(`/document/${validated.documentId}`, {
      method: 'GET',
    });

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      return {
        success: false,
        error: {
          code: `HTTP_${docResponse.status}`,
          message: errorText || 'Failed to get document details',
        },
        metadata: {
          tool: 'get-audit-trail',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const docData = (await docResponse.json()) as {
      documentId: string;
      documentTitle?: string;
      status: string;
      auditTrail?: Array<{
        action: string;
        actionDate: string;
        name?: string;
        email?: string;
        ipAddress?: string;
        userAgent?: string;
        description?: string;
      }>;
      signerDetails?: Array<{
        signerEmail: string;
        signerName: string;
        signedDate?: string;
        ipAddress?: string;
      }>;
    };

    // Transform audit events
    const events = (docData.auditTrail || []).map((event) => ({
      timestamp: event.actionDate,
      eventType: event.action,
      actor: event.name || 'System',
      actorEmail: event.email,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: event.description,
    }));

    // Build certificate of completion if document is completed
    let certificateOfCompletion;
    if (docData.status === 'Completed' && docData.signerDetails) {
      const signedSigners = docData.signerDetails.filter((s) => s.signedDate);
      if (signedSigners.length > 0) {
        certificateOfCompletion = {
          signedAt: signedSigners[signedSigners.length - 1].signedDate || new Date().toISOString(),
          documentHash: `sha256:${validated.documentId}`, // Placeholder - actual hash from BoldSign
          signerCertificates: signedSigners.map((s) => ({
            signerName: s.signerName,
            signerEmail: s.signerEmail,
            signedAt: s.signedDate || '',
            ipAddress: s.ipAddress || 'Unknown',
          })),
        };
      }
    }

    // If PDF format requested, include download link
    const pdfUrl =
      validated.format === 'pdf' && docData.status === 'Completed'
        ? `/v1/document/${validated.documentId}/download/audit`
        : undefined;

    return {
      success: true,
      data: {
        documentId: docData.documentId,
        documentTitle: docData.documentTitle || 'Untitled',
        events,
        pdfUrl,
        certificateOfCompletion,
      },
      metadata: {
        tool: 'get-audit-trail',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        tool: 'get-audit-trail',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getAuditTrailDefinition: MCPToolDefinition = {
  name: 'get-audit-trail',
  mcpName: 'mcp__boldsign__get_audit_trail',
  apiEndpoint: '/v1/document/{documentId}',
  description: 'Get the audit trail for a BoldSign document with all signing events and timestamps.',
  inputSchema: getAuditTrailInputSchema,
  tags: ['documents', 'audit', 'compliance', 'trail', 'boldsign', 'api'],
  examples: [
    {
      description: 'Get audit trail as JSON',
      input: { documentId: 'abc-123', format: 'json' },
      expectedOutput: '{ documentId: "abc-123", events: [...], certificateOfCompletion: {...} }',
    },
    {
      description: 'Get audit trail PDF link',
      input: { documentId: 'abc-123', format: 'pdf' },
      expectedOutput: '{ pdfUrl: "/v1/document/.../download/audit" }',
    },
  ],
};

// =============================================================================
// Revoke Document
// =============================================================================

const revokeDocumentInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  reason: z.string().optional(),
});

export interface RevokeDocumentInput {
  documentId: string;
  reason?: string;
}

export interface RevokeDocumentOutput {
  success: boolean;
  documentId: string;
  previousStatus: string;
  newStatus: 'revoked';
}

/**
 * Revoke/cancel a document
 */
export async function revokeDocument(
  input: RevokeDocumentInput
): Promise<MCPToolResult<RevokeDocumentOutput>> {
  const startTime = Date.now();
  const validated = revokeDocumentInputSchema.parse(input);

  try {
    // Get current status first
    const docResponse = await callBoldSignAPI(`/document/${validated.documentId}`, {
      method: 'GET',
    });

    let previousStatus = 'unknown';
    if (docResponse.ok) {
      const docData = (await docResponse.json()) as { status: string };
      previousStatus = docData.status;
    }

    // Revoke the document
    const response = await callBoldSignAPI('/document/revoke', {
      method: 'POST',
      body: JSON.stringify({
        documentId: validated.documentId,
        revokeMessage: validated.reason || 'Document revoked',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }

      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorMessage,
        },
        metadata: {
          tool: 'revoke-document',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: {
        success: true,
        documentId: validated.documentId,
        previousStatus,
        newStatus: 'revoked',
      },
      metadata: {
        tool: 'revoke-document',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        tool: 'revoke-document',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const revokeDocumentDefinition: MCPToolDefinition = {
  name: 'revoke-document',
  mcpName: 'mcp__boldsign__revoke_document',
  apiEndpoint: '/v1/document/revoke',
  description: 'Revoke/cancel a BoldSign document that is still pending signatures.',
  inputSchema: revokeDocumentInputSchema,
  tags: ['documents', 'revoke', 'cancel', 'boldsign', 'api'],
  examples: [
    {
      description: 'Revoke a document',
      input: { documentId: 'abc-123', reason: 'Terms changed' },
      expectedOutput: '{ success: true, previousStatus: "sent", newStatus: "revoked" }',
    },
  ],
};
