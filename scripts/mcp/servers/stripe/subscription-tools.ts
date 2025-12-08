/**
 * Stripe: Subscription Management Tools
 *
 * Tools for listing and retrieving subscription information.
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ListSubscriptionsInput,
  ListSubscriptionsOutput,
  GetSubscriptionInput,
  GetSubscriptionOutput,
  StripeSubscription,
  StripeInvoice,
} from '../../types/stripe.types.js';
import { callStripeAPI, buildQueryString, transformResponse } from './config.js';

const SERVER = 'stripe';

// =============================================================================
// List Subscriptions
// =============================================================================

const listSubscriptionsInputSchema = z.object({
  customerId: z.string().optional(),
  status: z
    .enum([
      'active',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'past_due',
      'paused',
      'trialing',
      'unpaid',
      'all',
    ])
    .optional(),
  startingAfter: z.string().optional(),
  endingBefore: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  priceId: z.string().optional(),
});

export async function listSubscriptions(
  input: ListSubscriptionsInput
): Promise<MCPToolResult<ListSubscriptionsOutput>> {
  const startTime = Date.now();
  const validated = listSubscriptionsInputSchema.parse(input);

  try {
    const params: Record<string, unknown> = {
      limit: validated.limit,
    };

    if (validated.customerId) params.customer = validated.customerId;
    if (validated.status && validated.status !== 'all') params.status = validated.status;
    if (validated.startingAfter) params.starting_after = validated.startingAfter;
    if (validated.endingBefore) params.ending_before = validated.endingBefore;
    if (validated.priceId) params.price = validated.priceId;

    const response = await callStripeAPI(`/subscriptions${buildQueryString(params)}`);

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
          tool: 'list-subscriptions',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const subscriptions = transformResponse<StripeSubscription[]>(data.data || []);

    return {
      success: true,
      data: {
        subscriptions,
        hasMore: data.has_more || false,
      },
      metadata: {
        tool: 'list-subscriptions',
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
        tool: 'list-subscriptions',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listSubscriptionsDefinition: MCPToolDefinition = {
  name: 'list-subscriptions',
  mcpName: 'mcp__stripe__list_subscriptions',
  apiEndpoint: '/v1/subscriptions',
  description: 'List subscriptions with filters for customer, status, and price.',
  inputSchema: listSubscriptionsInputSchema,
  tags: ['subscriptions', 'list', 'billing', 'stripe', 'api'],
  examples: [
    {
      description: 'List active subscriptions',
      input: { status: 'active', limit: 10 },
      expectedOutput: '{ subscriptions: [...], hasMore: true }',
    },
    {
      description: 'List customer subscriptions',
      input: { customerId: 'cus_abc123' },
      expectedOutput: '{ subscriptions: [...] }',
    },
  ],
};

// =============================================================================
// Get Subscription
// =============================================================================

const getSubscriptionInputSchema = z.object({
  subscriptionId: z.string().min(1),
  includeUpcomingInvoice: z.boolean().default(false),
});

export async function getSubscription(
  input: GetSubscriptionInput
): Promise<MCPToolResult<GetSubscriptionOutput>> {
  const startTime = Date.now();
  const validated = getSubscriptionInputSchema.parse(input);

  try {
    // Get subscription details with expanded items
    const response = await callStripeAPI(
      `/subscriptions/${validated.subscriptionId}?expand[]=default_payment_method&expand[]=latest_invoice`
    );

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
          tool: 'get-subscription',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const subscription = transformResponse<StripeSubscription>(data);

    const result: GetSubscriptionOutput = { subscription };

    // Get upcoming invoice if requested
    if (validated.includeUpcomingInvoice) {
      try {
        const upcomingResponse = await callStripeAPI(
          `/invoices/upcoming?subscription=${validated.subscriptionId}`
        );
        if (upcomingResponse.ok) {
          const upcomingData = await upcomingResponse.json();
          result.upcomingInvoice = transformResponse<StripeInvoice>(upcomingData);
        }
      } catch {
        // Upcoming invoice might not exist for canceled subscriptions
        result.upcomingInvoice = null;
      }
    }

    // Get recent billing history
    const invoicesResponse = await callStripeAPI(
      `/invoices?subscription=${validated.subscriptionId}&limit=5`
    );
    if (invoicesResponse.ok) {
      const invoicesData = await invoicesResponse.json();
      result.billingHistory = (invoicesData.data || []).map(
        (inv: { created: number; amount_paid: number; status: string }) => ({
          date: inv.created,
          amount: inv.amount_paid,
          status: inv.status,
        })
      );
    }

    return {
      success: true,
      data: result,
      metadata: {
        tool: 'get-subscription',
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
        tool: 'get-subscription',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getSubscriptionDefinition: MCPToolDefinition = {
  name: 'get-subscription',
  mcpName: 'mcp__stripe__get_subscription',
  apiEndpoint: '/v1/subscriptions/:id',
  description: 'Get detailed subscription information including billing history and upcoming invoice.',
  inputSchema: getSubscriptionInputSchema,
  tags: ['subscriptions', 'details', 'billing', 'stripe', 'api'],
  examples: [
    {
      description: 'Get subscription details',
      input: { subscriptionId: 'sub_abc123' },
      expectedOutput: '{ subscription: {...}, billingHistory: [...] }',
    },
    {
      description: 'Get subscription with upcoming invoice',
      input: { subscriptionId: 'sub_abc123', includeUpcomingInvoice: true },
      expectedOutput: '{ subscription: {...}, upcomingInvoice: {...} }',
    },
  ],
};
