/**
 * Stripe: Test & Configuration Tools
 *
 * Tools for creating test data and checking configuration status.
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  CreateTestCustomerInput,
  CreateTestCustomerOutput,
  ConfigStatusOutput,
  StripeCustomer,
  StripePaymentMethod,
} from '../../types/stripe.types.js';
import {
  callStripeAPI,
  buildFormData,
  transformResponse,
  getConfigStatus,
  isTestMode,
} from './config.js';

const SERVER = 'stripe';

// =============================================================================
// Create Test Customer
// =============================================================================

const createTestCustomerInputSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  addTestPaymentMethod: z.boolean().default(false),
});

export async function createTestCustomer(
  input: CreateTestCustomerInput
): Promise<MCPToolResult<CreateTestCustomerOutput>> {
  const startTime = Date.now();
  const validated = createTestCustomerInputSchema.parse(input);

  try {
    // Check if in test mode
    if (!isTestMode()) {
      return {
        success: false,
        error: {
          code: 'LIVE_MODE_ERROR',
          message: 'Cannot create test customers in live mode. Use test API key (sk_test_...).',
        },
        metadata: {
          tool: 'create-test-customer',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Create customer
    const customerParams: Record<string, unknown> = {
      email: validated.email,
      metadata: {
        source: 'mcp_test_tool',
        created_by: 'stripe_mcp_bridge',
        ...(validated.metadata || {}),
      },
    };

    if (validated.name) customerParams.name = validated.name;

    const customerResponse = await callStripeAPI('/customers', {
      method: 'POST',
      body: buildFormData(customerParams),
    });

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
          tool: 'create-test-customer',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const customerData = await customerResponse.json();
    const customer = transformResponse<StripeCustomer>(customerData);

    const result: CreateTestCustomerOutput = {
      customer,
      message: `Test customer created: ${customer.id}`,
    };

    // Add test payment method if requested
    if (validated.addTestPaymentMethod) {
      // Create a test payment method using Stripe's test token
      const pmResponse = await callStripeAPI('/payment_methods', {
        method: 'POST',
        body: buildFormData({
          type: 'card',
          card: {
            token: 'tok_visa', // Stripe's test token for a Visa card
          },
        }),
      });

      if (pmResponse.ok) {
        const pmData = await pmResponse.json();

        // Attach payment method to customer
        const attachResponse = await callStripeAPI(
          `/payment_methods/${pmData.id}/attach`,
          {
            method: 'POST',
            body: buildFormData({ customer: customer.id }),
          }
        );

        if (attachResponse.ok) {
          const attachedPm = await attachResponse.json();
          result.testPaymentMethod = transformResponse<StripePaymentMethod>(attachedPm);
          result.message += ` with test payment method: ${attachedPm.id}`;

          // Set as default payment method
          await callStripeAPI(`/customers/${customer.id}`, {
            method: 'POST',
            body: buildFormData({
              invoice_settings: {
                default_payment_method: attachedPm.id,
              },
            }),
          });
        }
      }
    }

    return {
      success: true,
      data: result,
      metadata: {
        tool: 'create-test-customer',
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
        tool: 'create-test-customer',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const createTestCustomerDefinition: MCPToolDefinition = {
  name: 'create-test-customer',
  mcpName: 'mcp__stripe__create_test_customer',
  apiEndpoint: '/v1/customers',
  description: 'Create a test customer in test mode with optional test payment method.',
  inputSchema: createTestCustomerInputSchema,
  tags: ['testing', 'customers', 'development', 'stripe', 'api'],
  examples: [
    {
      description: 'Create basic test customer',
      input: { email: 'test@example.com' },
      expectedOutput: '{ customer: {...}, message: "Test customer created: cus_..." }',
    },
    {
      description: 'Create test customer with payment method',
      input: { email: 'test@example.com', name: 'Test User', addTestPaymentMethod: true },
      expectedOutput: '{ customer: {...}, testPaymentMethod: {...}, message: "..." }',
    },
  ],
};

// =============================================================================
// Get Config Status
// =============================================================================

const getConfigStatusInputSchema = z.object({});

export async function getConfigStatusTool(): Promise<MCPToolResult<ConfigStatusOutput>> {
  const startTime = Date.now();

  try {
    const status = getConfigStatus();

    return {
      success: true,
      data: status as unknown as ConfigStatusOutput,
      metadata: {
        tool: 'get-config-status',
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
        code: 'CONFIG_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        tool: 'get-config-status',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const getConfigStatusDefinition: MCPToolDefinition = {
  name: 'get-config-status',
  mcpName: 'mcp__stripe__get_config_status',
  description: 'Check Stripe API configuration status for debugging connectivity issues.',
  inputSchema: getConfigStatusInputSchema,
  tags: ['config', 'debugging', 'status', 'stripe', 'api'],
  examples: [
    {
      description: 'Check configuration',
      input: {},
      expectedOutput: '{ stripeConfigured: true, isTestMode: true, hasSecretKey: true }',
    },
  ],
};
