/**
 * BoldSign: Sender Identity Tools
 *
 * Tools for managing sender identities:
 * - list-sender-identities: List all sender identities
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ListSenderIdentitiesInput,
  ListSenderIdentitiesOutput,
  SenderIdentity,
} from '../../types/boldsign.types.js';
import { callBoldSignAPI } from './config.js';

const SERVER = 'boldsign';

// =============================================================================
// List Sender Identities
// =============================================================================

const listSenderIdentitiesInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  searchTerm: z.string().optional(),
});

/**
 * List all sender identities
 */
export async function listSenderIdentities(
  input: ListSenderIdentitiesInput
): Promise<MCPToolResult<ListSenderIdentitiesOutput>> {
  const startTime = Date.now();
  const validated = listSenderIdentitiesInputSchema.parse(input);

  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('Page', String(validated.page));
    params.append('PageSize', String(validated.pageSize));

    if (validated.searchTerm) {
      params.append('SearchKey', validated.searchTerm);
    }

    // Call BoldSign API
    const response = await callBoldSignAPI(`/senderIdentities/list?${params.toString()}`, {
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
          tool: 'list-sender-identities',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = (await response.json()) as {
      result?: Array<{
        senderIdentityId: string;
        name: string;
        email: string;
        status: string;
        isDefault?: boolean;
        createdDate?: string;
      }>;
      pageDetails?: {
        page: number;
        pageSize: number;
        totalRecordsCount: number;
        totalPages: number;
      };
    };

    // Transform response
    const identities: SenderIdentity[] = (data.result || []).map((item) => ({
      senderIdentityId: item.senderIdentityId,
      name: item.name,
      email: item.email,
      status: item.status,
      isDefault: item.isDefault,
      createdDate: item.createdDate,
    }));

    const pagination = data.pageDetails || {
      page: validated.page,
      pageSize: validated.pageSize,
      totalRecordsCount: identities.length,
      totalPages: 1,
    };

    return {
      success: true,
      data: {
        identities,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalRecordsCount,
          totalPages: pagination.totalPages,
        },
      },
      metadata: {
        tool: 'list-sender-identities',
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
        tool: 'list-sender-identities',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listSenderIdentitiesDefinition: MCPToolDefinition = {
  name: 'list-sender-identities',
  mcpName: 'mcp__boldsign__list_sender_identities',
  apiEndpoint: '/v1/senderIdentities/list',
  description: 'List all BoldSign sender identities with their verification status.',
  inputSchema: listSenderIdentitiesInputSchema,
  tags: ['sender', 'identity', 'list', 'boldsign', 'api'],
  examples: [
    {
      description: 'List all sender identities',
      input: { pageSize: 25 },
      expectedOutput: '{ identities: [...], pagination: { totalCount: 3 } }',
    },
    {
      description: 'Search for specific identity',
      input: { searchTerm: 'agent@company.com' },
      expectedOutput: '{ identities: [{ email: "agent@company.com", status: "Verified" }] }',
    },
  ],
};
