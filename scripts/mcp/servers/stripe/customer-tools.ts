/**
 * Stripe: Customer Management Tools
 *
 * Tools for listing and retrieving customer information.
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ListCustomersInput,
  ListCustomersOutput,
  GetCustomerInput,
  GetCustomerOutput,
  StripeCustomer,
  StripePaymentMethod,
  StripeSubscription,
} from '../../types/stripe.types.js';
import { callStripeAPI, buildQueryString, transformResponse } from './config.js';

const SERVER = 'stripe';

// =============================================================================
// List Customers
// =============================================================================

const listCustomersInputSchema = z.object({
  email: z.string().email().optional(),
  startingAfter: z.string().optional(),
  endingBefore: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  createdAfter: z.number().int().optional(),
  createdBefore: z.number().int().optional(),
});

export async function listCustomers(
  input: ListCustomersInput
): Promise<MCPToolResult<ListCustomersOutput>> {
  const startTime = Date.now();
  const validated = listCustomersInputSchema.parse(input);

  try {
    const params: Record<string, unknown> = {
      limit: validated.limit,
    };

    if (validated.email) params.email = validated.email;
    if (validated.startingAfter) params.starting_after = validated.startingAfter;
    if (validated.endingBefore) params.ending_before = validated.endingBefore;

    if (validated.createdAfter || validated.createdBefore) {
      params.created = {};
      if (validated.createdAfter) (params.created as Record<string, number>).gte = validated.createdAfter;
      if (validated.createdBefore) (params.created as Record<string, number>).lte = validated.createdBefore;
    }

    const response = await callStripeAPI(`/customers${buildQueryString(params)}`);

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
          tool: 'list-customers',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const customers = transformResponse<StripeCustomer[]>(data.data || []);

    return {
      success: true,
      data: {
        customers,
        hasMore: data.has_more || false,
      },
      metadata: {
        tool: 'list-customers',
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
        tool: 'list-customers',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listCustomersDefinition: MCPToolDefinition = {
  name: 'list-customers',
  mcpName: 'mcp__stripe__list_customers',
  apiEndpoint: '/v1/customers',
  description: 'List and search Stripe customers with pagination and filtering by email or creation date.',
  inputSchema: listCustomersInputSchema,
  tags: ['customers', 'list', 'search', 'stripe', 'payments', 'api'],
  examples: [
    {
      description: 'List recent customers',
      input: { limit: 10 },
      expectedOutput: '{ customers: [...], hasMore: true }',
    },
    {
      description: 'Search by email',
      input: { email: 'customer@example.com' },
      expectedOutput: '{ customers: [...] }',
    },
  ],
};

// =============================================================================
// Get Customer
// =============================================================================

const getCustomerInputSchema = z.object({
  customerId: z.string().min(1),
  includePaymentMethods: z.boolean().default(false),
  includeSubscriptions: z.boolean().default(false),
});

export async function getCustomer(
  input: GetCustomerInput
): Promise<MCPToolResult<GetCustomerOutput>> {
  const startTime = Date.now();
  const validated = getCustomerInputSchema.parse(input);

  try {
    // Get customer details
    const customerResponse = await callStripeAPI(`/customers/${validated.customerId}`);

    if (!customerResponse.ok) {
      const errorData = await customerResponse.json();
      return {
        success: false,
        error: {
          code: `HTTP_${customerResponse.status}`,
          message: errorData.error?.message || `HTTP ${customerResponse.status}`,
          details: errorData.error,
        },
        metadata: {
          tool: 'get-customer',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const customerData = await customerResponse.json();
    const customer = transformResponse<StripeCustomer>(customerData);

    const result: GetCustomerOutput = { customer };

    // Get payment methods if requested
    if (validated.includePaymentMethods) {
      const pmResponse = await callStripeAPI(
        `/customers/${validated.customerId}/payment_methods?type=card&limit=10`
      );
      if (pmResponse.ok) {
        const pmData = await pmResponse.json();
        result.paymentMethods = transformResponse<StripePaymentMethod[]>(pmData.data || []);

        // Find default payment method
        if (customerData.invoice_settings?.default_payment_method) {
          result.defaultPaymentMethod = result.paymentMethods.find(
            (pm) => pm.id === customerData.invoice_settings.default_payment_method
          ) || null;
        }
      }
    }

    // Get subscriptions if requested
    if (validated.includeSubscriptions) {
      const subResponse = await callStripeAPI(
        `/subscriptions?customer=${validated.customerId}&limit=10`
      );
      if (subResponse.ok) {
        const subData = await subResponse.json();
        result.subscriptions = transformResponse<StripeSubscription[]>(subData.data || []);
      }
    }

    return {
      success: true,
      data: result,
      metadata: {
        tool: 'get-customer',
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
        tool: 'get-customer',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getCustomerDefinition: MCPToolDefinition = {
  name: 'get-customer',
  mcpName: 'mcp__stripe__get_customer',
  apiEndpoint: '/v1/customers/:id',
  description: 'Get detailed customer information including payment methods and subscriptions.',
  inputSchema: getCustomerInputSchema,
  tags: ['customers', 'details', 'stripe', 'payments', 'api'],
  examples: [
    {
      description: 'Get customer details',
      input: { customerId: 'cus_abc123' },
      expectedOutput: '{ customer: { id: "cus_abc123", email: "..." } }',
    },
    {
      description: 'Get customer with payment methods',
      input: { customerId: 'cus_abc123', includePaymentMethods: true },
      expectedOutput: '{ customer: {...}, paymentMethods: [...] }',
    },
  ],
};
