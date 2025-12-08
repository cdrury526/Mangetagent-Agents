/**
 * BoldSign: List Documents
 *
 * List and search documents in BoldSign with pagination, filtering, and sorting.
 * Useful for debugging document status and tracking signature progress.
 *
 * @example
 * await listDocuments({ status: 'sent', pageSize: 10 })
 *
 * @example
 * await listDocuments({ searchTerm: 'contract', status: 'completed' })
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { ListDocumentsInput, ListDocumentsOutput, BoldSignDocument } from '../../types/boldsign.types.js';
import { callBoldSignAPI } from './config.js';

const SERVER = 'boldsign';
const TOOL = 'list-documents';
const MCP_NAME = 'mcp__boldsign__list_documents';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  status: z
    .enum(['draft', 'sent', 'in_progress', 'completed', 'declined', 'expired', 'revoked'])
    .optional(),
  senderEmail: z.string().email().optional(),
  searchTerm: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdDate', 'expiryDate', 'title', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * Map BoldSign API status to our internal status
 */
function mapStatus(apiStatus: string): BoldSignDocument['status'] {
  const statusMap: Record<string, BoldSignDocument['status']> = {
    Draft: 'draft',
    Sent: 'sent',
    InProgress: 'in_progress',
    Completed: 'completed',
    Declined: 'declined',
    Expired: 'expired',
    Revoked: 'revoked',
  };
  return statusMap[apiStatus] || 'sent';
}

/**
 * List documents with filtering and pagination
 */
export async function listDocuments(
  input: ListDocumentsInput
): Promise<MCPToolResult<ListDocumentsOutput>> {
  const startTime = Date.now();
  const validated = inputSchema.parse(input);

  try {
    // Build query parameters for BoldSign API
    const params = new URLSearchParams();
    params.append('page', String(validated.page));
    params.append('pageSize', String(validated.pageSize));

    if (validated.status) {
      // BoldSign uses PascalCase status values
      const statusMap: Record<string, string> = {
        draft: 'Draft',
        sent: 'Sent',
        in_progress: 'InProgress',
        completed: 'Completed',
        declined: 'Declined',
        expired: 'Expired',
        revoked: 'Revoked',
      };
      params.append('status', statusMap[validated.status] || validated.status);
    }

    if (validated.senderEmail) {
      params.append('senderEmail', validated.senderEmail);
    }

    if (validated.searchTerm) {
      params.append('searchKey', validated.searchTerm);
    }

    if (validated.startDate) {
      params.append('startDate', validated.startDate);
    }

    if (validated.endDate) {
      params.append('endDate', validated.endDate);
    }

    // Call BoldSign API
    const response = await callBoldSignAPI(`/document/list?${params.toString()}`, {
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
      result?: Array<{
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
        }>;
        senderDetail?: {
          emailAddress: string;
          name: string;
        };
        messageTitle?: string;
        message?: string;
      }>;
      pageDetails?: {
        page: number;
        pageSize: number;
        totalRecordsCount: number;
        totalPages: number;
      };
    };

    // Transform response to our format
    const documents: BoldSignDocument[] = (data.result || []).map((doc) => ({
      documentId: doc.documentId,
      title: doc.documentTitle || 'Untitled',
      status: mapStatus(doc.status),
      createdDate: doc.createdDate,
      expiryDate: doc.expiryDate,
      completedDate: doc.completedDate,
      signers:
        doc.signerDetails?.map((s) => ({
          signerEmail: s.signerEmail,
          signerName: s.signerName,
          signerOrder: s.signerOrder,
          status: s.status.toLowerCase() as 'pending' | 'viewed' | 'signed' | 'declined' | 'expired',
          signedDate: s.signedDate,
          viewedDate: s.viewedDate,
          declinedDate: s.declinedDate,
          declineReason: s.declineReason,
        })) || [],
      senderEmail: doc.senderDetail?.emailAddress || '',
      senderName: doc.senderDetail?.name || '',
      messageTitle: doc.messageTitle,
      message: doc.message,
    }));

    const pagination = data.pageDetails || {
      page: validated.page,
      pageSize: validated.pageSize,
      totalRecordsCount: documents.length,
      totalPages: 1,
    };

    return {
      success: true,
      data: {
        documents,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalRecordsCount,
          totalPages: pagination.totalPages,
        },
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
export const listDocumentsDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: '/v1/document/list',
  description:
    'List and search BoldSign documents with pagination, filtering by status, and date ranges.',
  inputSchema,
  tags: ['documents', 'list', 'search', 'boldsign', 'e-signature', 'api'],
  examples: [
    {
      description: 'List all sent documents',
      input: { status: 'sent', pageSize: 10 },
      expectedOutput: '{ documents: [...], pagination: { page: 1, totalCount: 50 } }',
    },
    {
      description: 'Search for contracts',
      input: { searchTerm: 'contract', status: 'completed' },
      expectedOutput: '{ documents: [...] }',
    },
    {
      description: 'List documents from last week',
      input: { startDate: '2025-01-24', endDate: '2025-01-31' },
      expectedOutput: '{ documents: [...] }',
    },
  ],
};
