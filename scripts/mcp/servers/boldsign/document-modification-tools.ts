/**
 * BoldSign: Document Modification Tools
 *
 * Tools for modifying existing documents:
 * - change-recipient: Replace a signer on an existing document
 * - void-and-resend: Revoke document and send corrected version
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ChangeRecipientInput,
  ChangeRecipientOutput,
  VoidAndResendInput,
  VoidAndResendOutput,
} from '../../types/boldsign.types.js';
import { callBoldSignAPI } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// Change Recipient
// =============================================================================

const changeRecipientInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  oldSignerEmail: z.string().email('Valid old signer email required'),
  newSignerEmail: z.string().email('Valid new signer email required'),
  newSignerName: z.string().min(1, 'New signer name required'),
  resendNotification: z.boolean().default(true),
  reason: z.string().optional(),
});

/**
 * Change a signer/recipient on an existing document
 */
export async function changeRecipient(
  input: ChangeRecipientInput
): Promise<MCPToolResult<ChangeRecipientOutput>> {
  const startTime = Date.now();
  const validated = changeRecipientInputSchema.parse(input);

  try {
    // First get document details to confirm old signer exists
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
          tool: 'change-recipient',
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

    // Find the old signer
    const oldSigner = docData.signerDetails?.find(
      (s) => s.signerEmail.toLowerCase() === validated.oldSignerEmail.toLowerCase()
    );

    if (!oldSigner) {
      return {
        success: false,
        error: {
          code: 'SIGNER_NOT_FOUND',
          message: `Old signer "${validated.oldSignerEmail}" not found on document`,
        },
        metadata: {
          tool: 'change-recipient',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Call BoldSign API to change recipient
    const payload = {
      documentId: validated.documentId,
      oldSignerEmail: validated.oldSignerEmail,
      newSignerEmail: validated.newSignerEmail,
      newSignerName: validated.newSignerName,
      resendNotification: validated.resendNotification,
    };

    if (validated.reason) {
      (payload as Record<string, unknown>).reason = validated.reason;
    }

    const response = await callBoldSignAPI('/document/changeRecipient', {
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
          tool: 'change-recipient',
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
        previousSigner: {
          email: validated.oldSignerEmail,
          name: oldSigner.signerName,
        },
        newSigner: {
          email: validated.newSignerEmail,
          name: validated.newSignerName,
        },
        notificationSent: validated.resendNotification,
      },
      metadata: {
        tool: 'change-recipient',
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
        tool: 'change-recipient',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const changeRecipientDefinition: MCPToolDefinition = {
  name: 'change-recipient',
  mcpName: 'mcp__boldsign__change_recipient',
  apiEndpoint: '/v1/document/changeRecipient',
  description: 'Replace a signer/recipient on an existing BoldSign document.',
  inputSchema: changeRecipientInputSchema,
  tags: ['documents', 'signer', 'recipient', 'change', 'boldsign', 'api'],
  examples: [
    {
      description: 'Change buyer to new email',
      input: {
        documentId: 'abc-123',
        oldSignerEmail: 'old-buyer@example.com',
        newSignerEmail: 'new-buyer@example.com',
        newSignerName: 'New Buyer Name',
        reason: 'Buyer changed email address',
      },
      expectedOutput:
        '{ success: true, previousSigner: { email: "old-buyer@example.com" }, newSigner: { email: "new-buyer@example.com" } }',
    },
  ],
};

// =============================================================================
// Void and Resend
// =============================================================================

const voidAndResendInputSchema = z.object({
  originalDocumentId: z.string().min(1, 'Original document ID required'),
  voidReason: z.string().min(1, 'Void reason required'),
  templateId: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  corrections: z
    .object({
      roles: z
        .array(
          z.object({
            roleId: z.string(),
            signerEmail: z.string().email(),
            signerName: z.string(),
          })
        )
        .optional(),
      prefillFields: z
        .array(
          z.object({
            fieldId: z.string(),
            value: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  expiryDays: z.number().int().min(1).max(180).optional(),
});

/**
 * Void an existing document and resend a corrected version
 * This is a COMPOSITE operation that:
 * 1. Gets original document to find template
 * 2. Revokes the original document
 * 3. Sends new document from template with corrections
 */
export async function voidAndResend(
  input: VoidAndResendInput
): Promise<MCPToolResult<VoidAndResendOutput>> {
  const startTime = Date.now();
  const validated = voidAndResendInputSchema.parse(input);

  try {
    // Step 1: Get original document to find template (if not provided)
    let templateId = validated.templateId;
    let originalTitle: string | undefined;
    let originalSigners: Array<{ signerEmail: string; signerName: string; roleId?: string }> = [];

    const docResponse = await callBoldSignAPI(`/document/${validated.originalDocumentId}`, {
      method: 'GET',
    });

    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      return {
        success: false,
        error: {
          code: `HTTP_${docResponse.status}`,
          message: errorText || 'Failed to get original document details',
        },
        metadata: {
          tool: 'void-and-resend',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const docData = (await docResponse.json()) as {
      templateId?: string;
      documentTitle?: string;
      signerDetails?: Array<{
        signerEmail: string;
        signerName: string;
        roleId?: string;
      }>;
    };

    if (!templateId) {
      templateId = docData.templateId;
    }

    if (!templateId) {
      return {
        success: false,
        error: {
          code: 'NO_TEMPLATE',
          message:
            'Could not determine template for resend. Original document was not created from a template, and no templateId was provided.',
        },
        metadata: {
          tool: 'void-and-resend',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    originalTitle = docData.documentTitle;
    originalSigners = docData.signerDetails || [];

    // Step 2: Revoke original document
    const revokeResponse = await callBoldSignAPI('/document/revoke', {
      method: 'POST',
      body: JSON.stringify({
        documentId: validated.originalDocumentId,
        revokeMessage: validated.voidReason,
      }),
    });

    if (!revokeResponse.ok) {
      const errorText = await revokeResponse.text();
      let errorMessage: string;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || `HTTP ${revokeResponse.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${revokeResponse.status}`;
      }

      return {
        success: false,
        error: {
          code: `REVOKE_FAILED_${revokeResponse.status}`,
          message: `Failed to revoke original document: ${errorMessage}`,
        },
        metadata: {
          tool: 'void-and-resend',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Step 3: Send new document from template
    // Build roles - use corrections if provided, otherwise use original signers
    const roles = validated.corrections?.roles ||
      originalSigners.map((s) => ({
        roleId: s.roleId || s.signerEmail,
        signerEmail: s.signerEmail,
        signerName: s.signerName,
      }));

    const sendPayload: Record<string, unknown> = {
      templateId,
      title: validated.title || originalTitle || 'Corrected Document',
      message: validated.message,
      roles,
      expiryDays: validated.expiryDays || 30,
    };

    // Add prefilled fields if provided
    if (validated.corrections?.prefillFields && validated.corrections.prefillFields.length > 0) {
      sendPayload.prefillFields = validated.corrections.prefillFields;
    }

    const sendResponse = await callBoldSignAPI('/template/send', {
      method: 'POST',
      body: JSON.stringify(sendPayload),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      let errorMessage: string;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || `HTTP ${sendResponse.status}`;
      } catch {
        errorMessage = errorText || `HTTP ${sendResponse.status}`;
      }

      return {
        success: false,
        error: {
          code: `SEND_FAILED_${sendResponse.status}`,
          message: `Original document revoked successfully, but failed to send new document: ${errorMessage}`,
        },
        metadata: {
          tool: 'void-and-resend',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const sendData = (await sendResponse.json()) as {
      documentId: string;
    };

    // Step 4: Return combined result
    return {
      success: true,
      data: {
        success: true,
        voidedDocumentId: validated.originalDocumentId,
        newDocumentId: sendData.documentId,
        templateId,
        signers: roles.map((r) => ({
          roleId: r.roleId,
          email: r.signerEmail,
          name: r.signerName,
        })),
      },
      metadata: {
        tool: 'void-and-resend',
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
        tool: 'void-and-resend',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const voidAndResendDefinition: MCPToolDefinition = {
  name: 'void-and-resend',
  mcpName: 'mcp__boldsign__void_and_resend',
  apiEndpoint: 'Composite: /v1/document/revoke + /v1/template/send',
  description:
    'Void an existing document and send a corrected version from the same template. Composite operation that revokes the original and creates a new document with corrections.',
  inputSchema: voidAndResendInputSchema,
  tags: ['documents', 'void', 'resend', 'revoke', 'correction', 'boldsign', 'api'],
  examples: [
    {
      description: 'Void and resend with corrected signer',
      input: {
        originalDocumentId: 'doc-abc-123',
        voidReason: 'Incorrect buyer email address',
        corrections: {
          roles: [
            {
              roleId: 'buyer',
              signerEmail: 'correct-buyer@example.com',
              signerName: 'Correct Buyer',
            },
          ],
        },
      },
      expectedOutput:
        '{ success: true, voidedDocumentId: "doc-abc-123", newDocumentId: "doc-xyz-456" }',
    },
    {
      description: 'Void and resend with corrected field values',
      input: {
        originalDocumentId: 'doc-abc-123',
        voidReason: 'Incorrect purchase price',
        corrections: {
          prefillFields: [{ fieldId: 'purchase_price', value: '$350,000' }],
        },
      },
      expectedOutput: '{ success: true, newDocumentId: "doc-xyz-456" }',
    },
  ],
};
