/**
 * Stripe: Payment Intent Tools
 *
 * Tools for listing and retrieving payment information.
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ListPaymentsInput,
  ListPaymentsOutput,
  GetPaymentInput,
  GetPaymentOutput,
  StripePaymentIntent,
} from '../../types/stripe.types.js';
import { callStripeAPI, buildQueryString, transformResponse } from './config.js';

const SERVER = 'stripe';

// =============================================================================
// List Payments
// =============================================================================

const listPaymentsInputSchema = z.object({
  customerId: z.string().optional(),
  status: z
    .enum([
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'processing',
      'requires_capture',
      'canceled',
      'succeeded',
    ])
    .optional(),
  startingAfter: z.string().optional(),
  endingBefore: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  createdAfter: z.number().int().optional(),
  createdBefore: z.number().int().optional(),
});

export async function listPayments(
  input: ListPaymentsInput
): Promise<MCPToolResult<ListPaymentsOutput>> {
  const startTime = Date.now();
  const validated = listPaymentsInputSchema.parse(input);

  try {
    const params: Record<string, unknown> = {
      limit: validated.limit,
    };

    if (validated.customerId) params.customer = validated.customerId;
    if (validated.startingAfter) params.starting_after = validated.startingAfter;
    if (validated.endingBefore) params.ending_before = validated.endingBefore;

    if (validated.createdAfter || validated.createdBefore) {
      params.created = {};
      if (validated.createdAfter) (params.created as Record<string, number>).gte = validated.createdAfter;
      if (validated.createdBefore) (params.created as Record<string, number>).lte = validated.createdBefore;
    }

    const response = await callStripeAPI(`/payment_intents${buildQueryString(params)}`);

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
          tool: 'list-payments',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    let payments = transformResponse<StripePaymentIntent[]>(data.data || []);

    // Filter by status client-side (Stripe doesn't support status filter on list)
    if (validated.status) {
      payments = payments.filter((p) => p.status === validated.status);
    }

    return {
      success: true,
      data: {
        payments,
        hasMore: data.has_more || false,
      },
      metadata: {
        tool: 'list-payments',
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
        tool: 'list-payments',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listPaymentsDefinition: MCPToolDefinition = {
  name: 'list-payments',
  mcpName: 'mcp__stripe__list_payments',
  apiEndpoint: '/v1/payment_intents',
  description: 'List PaymentIntents with filters for customer, status, and date range.',
  inputSchema: listPaymentsInputSchema,
  tags: ['payments', 'list', 'payment_intents', 'stripe', 'api'],
  examples: [
    {
      description: 'List recent payments',
      input: { limit: 10 },
      expectedOutput: '{ payments: [...], hasMore: true }',
    },
    {
      description: 'List successful payments for customer',
      input: { customerId: 'cus_abc123', status: 'succeeded' },
      expectedOutput: '{ payments: [...] }',
    },
  ],
};

// =============================================================================
// Get Payment
// =============================================================================

const getPaymentInputSchema = z.object({
  paymentIntentId: z.string().min(1),
  includeCharges: z.boolean().default(true),
});

export async function getPayment(
  input: GetPaymentInput
): Promise<MCPToolResult<GetPaymentOutput>> {
  const startTime = Date.now();
  const validated = getPaymentInputSchema.parse(input);

  try {
    // Build expand parameters
    const expandParams = validated.includeCharges ? '?expand[]=latest_charge' : '';

    const response = await callStripeAPI(
      `/payment_intents/${validated.paymentIntentId}${expandParams}`
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
          tool: 'get-payment',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const payment = transformResponse<StripePaymentIntent>(data);

    // Build timeline from payment intent events
    const timeline: Array<{ event: string; timestamp: number; details?: string }> = [];

    timeline.push({
      event: 'created',
      timestamp: data.created,
      details: `PaymentIntent created for ${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}`,
    });

    // Add charge events if available
    if (data.latest_charge) {
      const charge = data.latest_charge;
      if (charge.created) {
        timeline.push({
          event: 'charge_created',
          timestamp: charge.created,
          details: charge.outcome?.seller_message || 'Charge created',
        });
      }
      if (charge.status === 'succeeded') {
        timeline.push({
          event: 'charge_succeeded',
          timestamp: charge.created,
          details: `Payment of ${(charge.amount / 100).toFixed(2)} ${charge.currency.toUpperCase()} succeeded`,
        });
      }
      if (charge.status === 'failed') {
        timeline.push({
          event: 'charge_failed',
          timestamp: charge.created,
          details: charge.failure_message || charge.outcome?.seller_message || 'Charge failed',
        });
      }
    }

    // Add cancellation if applicable
    if (data.canceled_at) {
      timeline.push({
        event: 'canceled',
        timestamp: data.canceled_at,
        details: data.cancellation_reason || 'Payment canceled',
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => a.timestamp - b.timestamp);

    return {
      success: true,
      data: {
        payment,
        timeline,
      },
      metadata: {
        tool: 'get-payment',
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
        tool: 'get-payment',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getPaymentDefinition: MCPToolDefinition = {
  name: 'get-payment',
  mcpName: 'mcp__stripe__get_payment',
  apiEndpoint: '/v1/payment_intents/:id',
  description: 'Get detailed PaymentIntent information including charges and failure details.',
  inputSchema: getPaymentInputSchema,
  tags: ['payments', 'details', 'payment_intents', 'debugging', 'stripe', 'api'],
  examples: [
    {
      description: 'Get payment details',
      input: { paymentIntentId: 'pi_abc123' },
      expectedOutput: '{ payment: {...}, timeline: [...] }',
    },
    {
      description: 'Debug failed payment',
      input: { paymentIntentId: 'pi_abc123', includeCharges: true },
      expectedOutput: '{ payment: {...}, timeline: [...] }',
    },
  ],
};
