/**
 * Stripe: Balance & Dispute Tools
 *
 * Tools for checking account balance and listing disputes.
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  GetBalanceOutput,
  ListDisputesInput,
  ListDisputesOutput,
  StripeBalance,
  StripeDispute,
} from '../../types/stripe.types.js';
import { callStripeAPI, buildQueryString, transformResponse } from './config.js';

const SERVER = 'stripe';

// =============================================================================
// Get Balance
// =============================================================================

const getBalanceInputSchema = z.object({});

export async function getBalance(): Promise<MCPToolResult<GetBalanceOutput>> {
  const startTime = Date.now();

  try {
    const response = await callStripeAPI('/balance');

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
          tool: 'get-balance',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const balance = transformResponse<StripeBalance>(data);

    // Calculate totals for summary
    let totalAvailable = 0;
    let totalPending = 0;
    let primaryCurrency = 'usd';

    if (data.available && data.available.length > 0) {
      totalAvailable = data.available.reduce(
        (sum: number, b: { amount: number }) => sum + b.amount,
        0
      );
      primaryCurrency = data.available[0].currency;
    }

    if (data.pending && data.pending.length > 0) {
      totalPending = data.pending.reduce(
        (sum: number, b: { amount: number }) => sum + b.amount,
        0
      );
    }

    return {
      success: true,
      data: {
        balance,
        summary: {
          totalAvailable: totalAvailable / 100, // Convert to dollars
          totalPending: totalPending / 100,
          currency: primaryCurrency.toUpperCase(),
        },
      },
      metadata: {
        tool: 'get-balance',
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
        tool: 'get-balance',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getBalanceDefinition: MCPToolDefinition = {
  name: 'get-balance',
  mcpName: 'mcp__stripe__get_balance',
  apiEndpoint: '/v1/balance',
  description: 'Get Stripe account balance including available and pending funds.',
  inputSchema: getBalanceInputSchema,
  tags: ['balance', 'account', 'financial', 'stripe', 'api'],
  examples: [
    {
      description: 'Get current balance',
      input: {},
      expectedOutput: '{ balance: {...}, summary: { totalAvailable: 1000.50, totalPending: 250.00, currency: "USD" } }',
    },
  ],
};

// =============================================================================
// List Disputes
// =============================================================================

const listDisputesInputSchema = z.object({
  chargeId: z.string().optional(),
  paymentIntentId: z.string().optional(),
  startingAfter: z.string().optional(),
  endingBefore: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  createdAfter: z.number().int().optional(),
  createdBefore: z.number().int().optional(),
});

export async function listDisputes(
  input: ListDisputesInput
): Promise<MCPToolResult<ListDisputesOutput>> {
  const startTime = Date.now();
  const validated = listDisputesInputSchema.parse(input);

  try {
    const params: Record<string, unknown> = {
      limit: validated.limit,
    };

    if (validated.chargeId) params.charge = validated.chargeId;
    if (validated.paymentIntentId) params.payment_intent = validated.paymentIntentId;
    if (validated.startingAfter) params.starting_after = validated.startingAfter;
    if (validated.endingBefore) params.ending_before = validated.endingBefore;

    if (validated.createdAfter || validated.createdBefore) {
      params.created = {};
      if (validated.createdAfter) (params.created as Record<string, number>).gte = validated.createdAfter;
      if (validated.createdBefore) (params.created as Record<string, number>).lte = validated.createdBefore;
    }

    const response = await callStripeAPI(`/disputes${buildQueryString(params)}`);

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
          tool: 'list-disputes',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const disputes = transformResponse<StripeDispute[]>(data.data || []);

    // Calculate summary
    const byStatus: Record<string, number> = {};
    const byReason: Record<string, number> = {};
    let totalAmount = 0;
    let primaryCurrency = 'usd';

    for (const dispute of disputes) {
      byStatus[dispute.status] = (byStatus[dispute.status] || 0) + 1;
      byReason[dispute.reason] = (byReason[dispute.reason] || 0) + 1;
      totalAmount += dispute.amount;
      primaryCurrency = dispute.currency;
    }

    return {
      success: true,
      data: {
        disputes,
        hasMore: data.has_more || false,
        summary: {
          total: disputes.length,
          byStatus,
          byReason,
          totalAmount: totalAmount / 100, // Convert to dollars
          currency: primaryCurrency.toUpperCase(),
        },
      },
      metadata: {
        tool: 'list-disputes',
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
        tool: 'list-disputes',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listDisputesDefinition: MCPToolDefinition = {
  name: 'list-disputes',
  mcpName: 'mcp__stripe__list_disputes',
  apiEndpoint: '/v1/disputes',
  description: 'List payment disputes (chargebacks) with filters and summary statistics.',
  inputSchema: listDisputesInputSchema,
  tags: ['disputes', 'chargebacks', 'list', 'stripe', 'api'],
  examples: [
    {
      description: 'List recent disputes',
      input: { limit: 10 },
      expectedOutput: '{ disputes: [...], hasMore: false, summary: {...} }',
    },
    {
      description: 'List disputes for specific charge',
      input: { chargeId: 'ch_abc123' },
      expectedOutput: '{ disputes: [...] }',
    },
  ],
};
