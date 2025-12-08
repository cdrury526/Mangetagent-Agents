/**
 * BoldSign: Download Tools
 *
 * Tools for downloading documents and attachments:
 * - download-document: Download signed, original, combined, or audit trail PDFs
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  DownloadDocumentInput,
  DownloadDocumentOutput,
} from '../../types/boldsign.types.js';
import { callBoldSignAPI } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// Download Document
// =============================================================================

const downloadDocumentInputSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  type: z.enum(['signed', 'original', 'combined', 'audit-trail']).default('signed'),
  format: z.enum(['pdf', 'base64']).default('base64'),
});

/**
 * Download signed, original, combined, or audit trail PDF from a BoldSign document
 */
export async function downloadDocument(
  input: DownloadDocumentInput
): Promise<MCPToolResult<DownloadDocumentOutput>> {
  const startTime = Date.now();
  const validated = downloadDocumentInputSchema.parse(input);

  try {
    // Determine endpoint based on download type
    let endpoint: string;
    switch (validated.type) {
      case 'signed':
        endpoint = `/document/download?documentId=${validated.documentId}`;
        break;
      case 'original':
        endpoint = `/document/download?documentId=${validated.documentId}&documentType=Original`;
        break;
      case 'combined':
        endpoint = `/document/download?documentId=${validated.documentId}&documentType=Combined`;
        break;
      case 'audit-trail':
        endpoint = `/document/audittrail?documentId=${validated.documentId}`;
        break;
      default:
        throw new Error(`Unsupported download type: ${validated.type}`);
    }

    // Call BoldSign API
    const response = await callBoldSignAPI(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/pdf',
      },
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
          tool: 'download-document',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Get content as buffer
    const buffer = await response.arrayBuffer();
    const sizeBytes = buffer.byteLength;

    // Prepare output based on format
    let output: DownloadDocumentOutput;
    if (validated.format === 'base64') {
      // Convert to base64
      const base64 = Buffer.from(buffer).toString('base64');
      output = {
        documentId: validated.documentId,
        type: validated.type,
        format: 'base64',
        content: base64,
        sizeBytes,
        mimeType: 'application/pdf',
      };
    } else {
      // For PDF format, return download URL (Note: BoldSign doesn't provide temp URLs via this endpoint)
      // We'll return the base64 with a note that it's a PDF
      const base64 = Buffer.from(buffer).toString('base64');
      output = {
        documentId: validated.documentId,
        type: validated.type,
        format: 'pdf',
        content: base64,
        sizeBytes,
        mimeType: 'application/pdf',
      };
    }

    return {
      success: true,
      data: output,
      metadata: {
        tool: 'download-document',
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
        tool: 'download-document',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const downloadDocumentDefinition: MCPToolDefinition = {
  name: 'download-document',
  mcpName: 'mcp__boldsign__download_document',
  apiEndpoint: '/v1/document/download',
  description:
    'Download signed, original, combined, or audit trail PDF from a BoldSign document. Returns base64 encoded content.',
  inputSchema: downloadDocumentInputSchema,
  tags: ['documents', 'download', 'pdf', 'signed', 'audit-trail', 'boldsign', 'api'],
  examples: [
    {
      description: 'Download signed PDF as base64',
      input: { documentId: 'abc-123', type: 'signed', format: 'base64' },
      expectedOutput:
        '{ documentId: "abc-123", type: "signed", content: "JVBERi0xLjQ...", sizeBytes: 45000 }',
    },
    {
      description: 'Download audit trail PDF',
      input: { documentId: 'abc-123', type: 'audit-trail', format: 'base64' },
      expectedOutput:
        '{ documentId: "abc-123", type: "audit-trail", content: "JVBERi0xLjQ...", sizeBytes: 12000 }',
    },
    {
      description: 'Download original (unsigned) PDF',
      input: { documentId: 'abc-123', type: 'original', format: 'base64' },
      expectedOutput:
        '{ documentId: "abc-123", type: "original", content: "JVBERi0xLjQ...", sizeBytes: 38000 }',
    },
  ],
};
