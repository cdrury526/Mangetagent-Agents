/**
 * BoldSign: Get Document Status
 *
 * Get detailed status of a document including signer progress, audit events,
 * and download links. Essential for debugging signature workflows.
 *
 * @example
 * await getDocumentStatus({ documentId: 'abc-123-def' })
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { GetDocumentStatusInput, GetDocumentStatusOutput } from '../../types/boldsign.types.js';
import { callBoldSignAPI, BOLDSIGN_CONFIG } from './config.js';

const SERVER = 'boldsign';
const TOOL = 'get-document-status';
const MCP_NAME = 'mcp__boldsign__get_document_status';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
});

/**
 * Get detailed document status
 */
export async function getDocumentStatus(
  input: GetDocumentStatusInput
): Promise<MCPToolResult<GetDocumentStatusOutput>> {
  const startTime = Date.now();
  const validated = inputSchema.parse(input);

  try {
    // Call BoldSign API to get document details
    const response = await callBoldSignAPI(`/document/${validated.documentId}`, {
      method: 'GET',
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
          tool: TOOL,
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as {
      documentId: string;
      documentTitle?: string;
      status: string;
      createdDate: string;
      expiryDate?: string;
      completedDate?: string;
      signerDetails?: Array<{
        signerEmail: string;
        signerName: string;
        signerOrder: number;
        status: string;
        signedDate?: string;
        viewedDate?: string;
        declinedDate?: string;
        declineReason?: string;
        ipAddress?: string;
      }>;
      senderDetail?: {
        emailAddress: string;
        name: string;
      };
      messageTitle?: string;
      message?: string;
      auditTrail?: Array<{
        eventType: string;
        eventDate: string;
        actor: string;
        ipAddress?: string;
        details?: string;
      }>;
    };

    // Map status to lowercase
    const statusMap: Record<string, string> = {
      Draft: 'draft',
      Sent: 'sent',
      InProgress: 'in_progress',
      Completed: 'completed',
      Declined: 'declined',
      Expired: 'expired',
      Revoked: 'revoked',
    };

    const document = {
      documentId: data.documentId,
      title: data.documentTitle || 'Untitled',
      status: (statusMap[data.status] || data.status.toLowerCase()) as 'draft' | 'sent' | 'in_progress' | 'completed' | 'declined' | 'expired' | 'revoked',
      createdDate: data.createdDate,
      expiryDate: data.expiryDate,
      completedDate: data.completedDate,
      signers:
        data.signerDetails?.map((s) => ({
          signerEmail: s.signerEmail,
          signerName: s.signerName,
          signerOrder: s.signerOrder,
          status: s.status.toLowerCase() as 'pending' | 'viewed' | 'signed' | 'declined' | 'expired',
          signedDate: s.signedDate,
          viewedDate: s.viewedDate,
          declinedDate: s.declinedDate,
          declineReason: s.declineReason,
          ipAddress: s.ipAddress,
        })) || [],
      senderEmail: data.senderDetail?.emailAddress || '',
      senderName: data.senderDetail?.name || '',
      messageTitle: data.messageTitle,
      message: data.message,
    };

    // Build download links
    const baseUrl = BOLDSIGN_CONFIG.baseUrl;
    const downloadLinks: { original?: string; signed?: string; auditTrail?: string } = {
      original: `${baseUrl}/v1/document/${validated.documentId}/download`,
    };

    if (document.status === 'completed') {
      downloadLinks.signed = `${baseUrl}/v1/document/${validated.documentId}/download/signed`;
      downloadLinks.auditTrail = `${baseUrl}/v1/document/${validated.documentId}/download/audit`;
    }

    return {
      success: true,
      data: {
        document,
        signerDetails: document.signers,
        auditEvents:
          data.auditTrail?.map((event) => ({
            eventType: event.eventType,
            eventDate: event.eventDate,
            actor: event.actor,
            ipAddress: event.ipAddress,
            details: event.details,
          })) || [],
        downloadLinks,
      },
      metadata: {
        tool: TOOL,
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
        tool: TOOL,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Tool definition for registry
 */
export const getDocumentStatusDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: '/v1/document/{documentId}',
  description:
    'Get detailed status of a BoldSign document including signer progress, audit events, and download links.',
  inputSchema,
  tags: ['documents', 'status', 'signers', 'audit', 'boldsign', 'debugging', 'api'],
  examples: [
    {
      description: 'Get document status by ID',
      input: { documentId: 'abc-123-def-456' },
      expectedOutput:
        '{ document: { status: "in_progress", signers: [...] }, downloadLinks: {...} }',
    },
  ],
};
