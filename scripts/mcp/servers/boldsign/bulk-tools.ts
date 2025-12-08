/**
 * BoldSign: Bulk Operations Tools
 *
 * Tools for batch operations on documents:
 * - merge-and-send: Combine multiple templates into single document
 * - bulk-send-reminder: Send reminders to multiple documents at once
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  MergeAndSendInput,
  MergeAndSendOutput,
  BulkSendReminderInput,
  BulkSendReminderOutput,
} from '../../types/boldsign.types.js';
import { callBoldSignAPI, SUPABASE_CONFIG } from './config.js';
import { createClient } from '@supabase/supabase-js';

const SERVER = 'boldsign';

// =============================================================================
// Merge and Send
// =============================================================================

const mergeAndSendInputSchema = z.object({
  templates: z
    .array(
      z.object({
        templateId: z.string().min(1),
        roles: z.array(
          z.object({
            roleId: z.string(),
            signerEmail: z.string().email(),
            signerName: z.string(),
          })
        ),
      })
    )
    .min(2, 'At least 2 templates required for merge'),
  title: z.string().min(1, 'Document title required'),
  message: z.string().optional(),
  expiryDays: z.number().int().min(1).max(180).default(30),
});

/**
 * Merge multiple templates into a single document and send for signing
 */
export async function mergeAndSend(
  input: MergeAndSendInput
): Promise<MCPToolResult<MergeAndSendOutput>> {
  const startTime = Date.now();
  const validated = mergeAndSendInputSchema.parse(input);

  try {
    // Build payload for BoldSign merge API
    const payload = {
      title: validated.title,
      message: validated.message,
      expiryDays: validated.expiryDays,
      templates: validated.templates.map((t) => ({
        templateId: t.templateId,
        roles: t.roles.map((r) => ({
          roleId: r.roleId,
          signerEmail: r.signerEmail,
          signerName: r.signerName,
        })),
      })),
    };

    // Call BoldSign API to merge templates and send
    const response = await callBoldSignAPI('/template/mergeAndSend', {
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
          tool: 'merge-and-send',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as {
      documentId: string;
    };

    // Build comprehensive signers list from all templates
    const allSigners = validated.templates.flatMap((t) =>
      t.roles.map((r) => ({
        email: r.signerEmail,
        name: r.signerName,
        roleId: r.roleId,
        templateId: t.templateId,
      }))
    );

    return {
      success: true,
      data: {
        success: true,
        documentId: data.documentId,
        mergedFromTemplates: validated.templates.map((t) => t.templateId),
        title: validated.title,
        signers: allSigners,
      },
      metadata: {
        tool: 'merge-and-send',
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
        tool: 'merge-and-send',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const mergeAndSendDefinition: MCPToolDefinition = {
  name: 'merge-and-send',
  mcpName: 'mcp__boldsign__merge_and_send',
  apiEndpoint: '/v1/template/mergeAndSend',
  description:
    'Merge multiple BoldSign templates into a single document and send for signing. Useful for combining disclosure packages or multi-document workflows.',
  inputSchema: mergeAndSendInputSchema,
  tags: ['templates', 'merge', 'bulk', 'send', 'documents', 'boldsign', 'api'],
  examples: [
    {
      description: 'Merge purchase agreement with disclosures',
      input: {
        templates: [
          {
            templateId: 'purchase-agreement-template',
            roles: [
              { roleId: 'buyer', signerEmail: 'buyer@example.com', signerName: 'John Buyer' },
              { roleId: 'seller', signerEmail: 'seller@example.com', signerName: 'Jane Seller' },
            ],
          },
          {
            templateId: 'disclosure-package-template',
            roles: [
              { roleId: 'buyer', signerEmail: 'buyer@example.com', signerName: 'John Buyer' },
              { roleId: 'seller', signerEmail: 'seller@example.com', signerName: 'Jane Seller' },
            ],
          },
        ],
        title: 'Purchase Agreement with Disclosures - 123 Main St',
        expiryDays: 7,
      },
      expectedOutput:
        '{ success: true, documentId: "merged-doc-123", mergedFromTemplates: ["purchase-agreement-template", "disclosure-package-template"] }',
    },
  ],
};

// =============================================================================
// Bulk Send Reminder
// =============================================================================

const bulkSendReminderInputSchema = z.object({
  // Single mode (backward compatible)
  documentId: z.string().optional(),
  signerEmail: z.string().email().optional(),
  message: z.string().optional(),

  // Bulk mode
  bulkMode: z
    .object({
      documentIds: z.array(z.string()).optional(),
      status: z.enum(['all_pending']).optional(),
      olderThanDays: z.number().int().min(1).optional(),
    })
    .optional(),
});

/**
 * Send reminders to multiple documents or all pending signers
 * Supports both single document mode and bulk operations
 */
export async function bulkSendReminder(
  input: BulkSendReminderInput
): Promise<MCPToolResult<BulkSendReminderOutput>> {
  const startTime = Date.now();
  const validated = bulkSendReminderInputSchema.parse(input);

  try {
    let documentIds: string[] = [];

    // Determine which documents to remind
    if (validated.documentId) {
      // Single document mode (backward compatible)
      documentIds = [validated.documentId];
    } else if (validated.bulkMode) {
      if (validated.bulkMode.documentIds) {
        // Specific list of document IDs
        documentIds = validated.bulkMode.documentIds;
      } else if (validated.bulkMode.status === 'all_pending') {
        // Query database for all pending documents
        if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.serviceRoleKey) {
          return {
            success: false,
            error: {
              code: 'SUPABASE_NOT_CONFIGURED',
              message: 'Supabase configuration required for bulk "all_pending" mode',
            },
            metadata: {
              tool: 'bulk-send-reminder',
              server: SERVER,
              executionTimeMs: Date.now() - startTime,
              executionType: 'api',
              timestamp: new Date().toISOString(),
            },
          };
        }

        const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);

        // Build query for pending documents
        let query = supabase
          .from('bold_sign_documents')
          .select('bold_sign_document_id')
          .in('status', ['sent', 'in_progress']);

        // Filter by age if specified
        if (validated.bulkMode.olderThanDays) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - validated.bulkMode.olderThanDays);
          query = query.lt('created_at', cutoffDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          return {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: `Failed to query pending documents: ${error.message}`,
            },
            metadata: {
              tool: 'bulk-send-reminder',
              server: SERVER,
              executionTimeMs: Date.now() - startTime,
              executionType: 'api',
              timestamp: new Date().toISOString(),
            },
          };
        }

        documentIds = (data || []).map((d) => d.bold_sign_document_id);
      }
    }

    if (documentIds.length === 0) {
      return {
        success: true,
        data: {
          success: true,
          totalDocuments: 0,
          totalReminders: 0,
          results: [],
        },
        metadata: {
          tool: 'bulk-send-reminder',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Send reminders to each document
    const results: Array<{
      documentId: string;
      success: boolean;
      remindersSent: number;
      error?: string;
    }> = [];

    let totalReminders = 0;

    for (const docId of documentIds) {
      try {
        // Build reminder payload
        const payload: Record<string, unknown> = {
          documentId: docId,
        };

        // Add signer email filter if in single mode
        if (validated.signerEmail && documentIds.length === 1) {
          payload.signerEmails = [validated.signerEmail];
        }

        if (validated.message) {
          payload.reminderMessage = validated.message;
        }

        // Send reminder via BoldSign API
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

          results.push({
            documentId: docId,
            success: false,
            remindersSent: 0,
            error: errorMessage,
          });
          continue;
        }

        // Get document to count pending signers
        const docResponse = await callBoldSignAPI(`/document/${docId}`, {
          method: 'GET',
        });

        let remindersSent = 1; // Default to 1 if we can't determine exact count
        if (docResponse.ok) {
          const docData = (await docResponse.json()) as {
            signerDetails?: Array<{
              status: string;
            }>;
          };
          const pendingCount =
            docData.signerDetails?.filter((s) => s.status === 'Pending' || s.status === 'NotSigned')
              .length || 1;
          remindersSent = pendingCount;
        }

        totalReminders += remindersSent;

        results.push({
          documentId: docId,
          success: true,
          remindersSent,
        });
      } catch (error) {
        results.push({
          documentId: docId,
          success: false,
          remindersSent: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: true,
      data: {
        success: true,
        totalDocuments: documentIds.length,
        totalReminders,
        results,
      },
      metadata: {
        tool: 'bulk-send-reminder',
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
        tool: 'bulk-send-reminder',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const bulkSendReminderDefinition: MCPToolDefinition = {
  name: 'bulk-send-reminder',
  mcpName: 'mcp__boldsign__bulk_send_reminder',
  apiEndpoint: '/v1/document/remind (bulk)',
  description:
    'Send reminder emails to multiple documents at once. Supports single document mode, explicit document ID list, or automatic "all pending" mode with optional age filtering.',
  inputSchema: bulkSendReminderInputSchema,
  tags: ['documents', 'reminder', 'bulk', 'signers', 'boldsign', 'api'],
  examples: [
    {
      description: 'Send reminder to single document (backward compatible)',
      input: { documentId: 'doc-123', message: 'Please sign soon' },
      expectedOutput: '{ success: true, totalDocuments: 1, totalReminders: 2 }',
    },
    {
      description: 'Send reminders to specific documents',
      input: {
        bulkMode: {
          documentIds: ['doc-123', 'doc-456', 'doc-789'],
        },
      },
      expectedOutput: '{ success: true, totalDocuments: 3, totalReminders: 8 }',
    },
    {
      description: 'Send reminders to all pending documents older than 3 days',
      input: {
        bulkMode: {
          status: 'all_pending',
          olderThanDays: 3,
        },
        message: 'Reminder: Please complete your signature',
      },
      expectedOutput: '{ success: true, totalDocuments: 12, totalReminders: 24 }',
    },
  ],
};
