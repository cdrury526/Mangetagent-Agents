/**
 * Stripe: Product & Price Tools
 *
 * Tools for listing products and prices (subscription plans).
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ListProductsInput,
  ListProductsOutput,
  ListPricesInput,
  ListPricesOutput,
  StripeProduct,
  StripePrice,
} from '../../types/stripe.types.js';
import { callStripeAPI, buildQueryString, transformResponse } from './config.js';

const SERVER = 'stripe';

// =============================================================================
// List Products
// =============================================================================

const listProductsInputSchema = z.object({
  active: z.boolean().optional(),
  startingAfter: z.string().optional(),
  endingBefore: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  createdAfter: z.number().int().optional(),
  createdBefore: z.number().int().optional(),
});

export async function listProducts(
  input: ListProductsInput
): Promise<MCPToolResult<ListProductsOutput>> {
  const startTime = Date.now();
  const validated = listProductsInputSchema.parse(input);

  try {
    const params: Record<string, unknown> = {
      limit: validated.limit,
    };

    if (validated.active !== undefined) params.active = validated.active;
    if (validated.startingAfter) params.starting_after = validated.startingAfter;
    if (validated.endingBefore) params.ending_before = validated.endingBefore;

    if (validated.createdAfter || validated.createdBefore) {
      params.created = {};
      if (validated.createdAfter) (params.created as Record<string, number>).gte = validated.createdAfter;
      if (validated.createdBefore) (params.created as Record<string, number>).lte = validated.createdBefore;
    }

    const response = await callStripeAPI(`/products${buildQueryString(params)}`);

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
          tool: 'list-products',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const products = transformResponse<StripeProduct[]>(data.data || []);

    return {
      success: true,
      data: {
        products,
        hasMore: data.has_more || false,
      },
      metadata: {
        tool: 'list-products',
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
        tool: 'list-products',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listProductsDefinition: MCPToolDefinition = {
  name: 'list-products',
  mcpName: 'mcp__stripe__list_products',
  apiEndpoint: '/v1/products',
  description: 'List Stripe products (subscription plans, one-time purchases) with optional active filter.',
  inputSchema: listProductsInputSchema,
  tags: ['products', 'list', 'catalog', 'subscriptions', 'stripe', 'api'],
  examples: [
    {
      description: 'List all active products',
      input: { active: true, limit: 10 },
      expectedOutput: '{ products: [...], hasMore: false }',
    },
    {
      description: 'List all products',
      input: { limit: 20 },
      expectedOutput: '{ products: [...] }',
    },
  ],
};

// =============================================================================
// List Prices
// =============================================================================

const listPricesInputSchema = z.object({
  active: z.boolean().optional(),
  productId: z.string().optional(),
  type: z.enum(['one_time', 'recurring']).optional(),
  currency: z.string().optional(),
  startingAfter: z.string().optional(),
  endingBefore: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(10),
  createdAfter: z.number().int().optional(),
  createdBefore: z.number().int().optional(),
});

export async function listPrices(
  input: ListPricesInput
): Promise<MCPToolResult<ListPricesOutput>> {
  const startTime = Date.now();
  const validated = listPricesInputSchema.parse(input);

  try {
    const params: Record<string, unknown> = {
      limit: validated.limit,
    };

    if (validated.active !== undefined) params.active = validated.active;
    if (validated.productId) params.product = validated.productId;
    if (validated.type) params.type = validated.type;
    if (validated.currency) params.currency = validated.currency;
    if (validated.startingAfter) params.starting_after = validated.startingAfter;
    if (validated.endingBefore) params.ending_before = validated.endingBefore;

    if (validated.createdAfter || validated.createdBefore) {
      params.created = {};
      if (validated.createdAfter) (params.created as Record<string, number>).gte = validated.createdAfter;
      if (validated.createdBefore) (params.created as Record<string, number>).lte = validated.createdBefore;
    }

    const response = await callStripeAPI(`/prices${buildQueryString(params)}`);

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
          tool: 'list-prices',
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
        },
      };
    }

    const data = await response.json();
    const prices = transformResponse<StripePrice[]>(data.data || []);

    return {
      success: true,
      data: {
        prices,
        hasMore: data.has_more || false,
      },
      metadata: {
        tool: 'list-prices',
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
        tool: 'list-prices',
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const listPricesDefinition: MCPToolDefinition = {
  name: 'list-prices',
  mcpName: 'mcp__stripe__list_prices',
  apiEndpoint: '/v1/prices',
  description: 'List Stripe prices (pricing plans) with filters for product, type (recurring/one-time), and currency.',
  inputSchema: listPricesInputSchema,
  tags: ['prices', 'list', 'pricing', 'subscriptions', 'stripe', 'api'],
  examples: [
    {
      description: 'List all active recurring prices',
      input: { active: true, type: 'recurring', limit: 10 },
      expectedOutput: '{ prices: [...], hasMore: false }',
    },
    {
      description: 'List prices for a specific product',
      input: { productId: 'prod_abc123' },
      expectedOutput: '{ prices: [...] }',
    },
    {
      description: 'List USD prices',
      input: { currency: 'usd', active: true },
      expectedOutput: '{ prices: [...] }',
    },
  ],
};
