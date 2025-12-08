/**
 * Stripe: Invoice Tools
 *
 * Tools for listing and retrieving invoice information.
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ListInvoicesInput,
  ListInvoicesOutput,
  StripeInvoice,
} from '../../types/stripe.types.js';
import { callStripeAPI, buildQueryString, transformResponse } from './config.js';

const SERVER = 'stripe';

// =============================================================================
// List Invoices
// =============================================================================

const listInvoicesInputSchema = z.object({
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']).optional(),
  startingAfter: z.string().optional(),
  endingBefore: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  createdAfter: z.number().int().optional(),
  createdBefore: z.number().int().optional(),
});

export async function listInvoices(
  input: ListInvoicesInput
): Promise<MCPToolResult<ListInvoicesOutput>> {
  const startTime = Date.now();
  const validated = listInvoicesInputSchema.parse(input);

  try {
    const params: Record<string, unknown> = {
      limit: validated.limit,
    };

    if (validated.customerId) params.customer = validated.customerId;
    if (validated.subscriptionId) params.subscription = validated.subscriptionId;
    if (validated.status) params.status = validated.status;
    if (validated.startingAfter) params.starting_after = validated.startingAfter;
    if (validated.endingBefore) params.ending_before = validated.endingBefore;

    if (validated.createdAfter || validated.createdBefore) {
      params.created = {};
      if (validated.createdAfter) (params.created as Record<string, number>).gte = validated.createdAfter;
      if (validated.createdBefore) (params.created as Record<string, number>).lte = validated.createdBefore;
    }

    const response = await callStripeAPI(`/invoices${buildQueryString(params)}`);

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.error?.message || `HTTP ${response.status}`,
          details: errorData.error,
        },
        metadata: {
          tool: 'list-invoices',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const invoices = transformResponse<StripeInvoice[]>(data.data || []);

    return {
      success: true,
      data: {
        invoices,
        hasMore: data.has_more || false,
      },
      metadata: {
        tool: 'list-invoices',
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
        tool: 'list-invoices',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listInvoicesDefinition: MCPToolDefinition = {
  name: 'list-invoices',
  mcpName: 'mcp__stripe__list_invoices',
  apiEndpoint: '/v1/invoices',
  description: 'List invoices with filters for customer, subscription, status, and date range.',
  inputSchema: listInvoicesInputSchema,
  tags: ['invoices', 'list', 'billing', 'stripe', 'api'],
  examples: [
    {
      description: 'List recent invoices',
      input: { limit: 10 },
      expectedOutput: '{ invoices: [...], hasMore: true }',
    },
    {
      description: 'List paid invoices for customer',
      input: { customerId: 'cus_abc123', status: 'paid' },
      expectedOutput: '{ invoices: [...] }',
    },
    {
      description: 'List invoices for subscription',
      input: { subscriptionId: 'sub_abc123' },
      expectedOutput: '{ invoices: [...] }',
    },
  ],
};
