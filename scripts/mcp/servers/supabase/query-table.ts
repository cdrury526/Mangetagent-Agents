/**
 * Supabase: Query Table
 *
 * Query a table using the Supabase REST API (PostgREST).
 * This is the most reliable way to read data from the remote database.
 *
 * @example
 * await queryTable({ table: 'profiles', limit: 10 })
 * await queryTable({ table: 'transactions', select: 'id,status,address', filter: 'status=eq.active' })
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getRestHeaders } from './config.js';

const SERVER = 'supabase';
const TOOL = 'query-table';
const MCP_NAME = 'mcp__supabase__query_table';

export const inputSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  select: z.string().optional().default('*'),
  filter: z.string().optional(),
  order: z.string().optional(),
  limit: z.number().optional().default(100),
  offset: z.number().optional(),
});

export interface QueryTableInput {
  table: string;
  select?: string;
  filter?: string;
  order?: string;
  limit?: number;
  offset?: number;
}

export type QueryTableOutput = Record<string, unknown>[];

/**
 * Query a table using PostgREST
 *
 * @param input - Query parameters
 * @returns Promise resolving to rows
 */
export async function queryTable(
  input: QueryTableInput
): Promise<MCPToolResult<QueryTableOutput>> {
  const validated = inputSchema.parse(input);

  const configOrError = validateConfig<QueryTableOutput>(SERVER, TOOL);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  // Build URL with query parameters
  const params = new URLSearchParams();
  params.set('select', validated.select || '*');

  if (validated.limit) {
    params.set('limit', validated.limit.toString());
  }
  if (validated.offset) {
    params.set('offset', validated.offset.toString());
  }
  if (validated.order) {
    params.set('order', validated.order);
  }

  let url = `${config.url}/rest/v1/${validated.table}?${params.toString()}`;

  // Add filter if provided (PostgREST format: column=operator.value)
  if (validated.filter) {
    url += `&${validated.filter}`;
  }

  return executeApiCall<QueryTableOutput>(url, SERVER, TOOL, {
    headers: {
      ...getRestHeaders(config, true),
      'Prefer': 'count=exact',
    },
  });
}

/**
 * Convenience: Get all rows from a table
 */
export async function getAllRows(
  table: string,
  limit: number = 1000
): Promise<MCPToolResult<QueryTableOutput>> {
  return queryTable({ table, limit });
}

/**
 * Convenience: Get row by ID
 */
export async function getRowById(
  table: string,
  id: string,
  idColumn: string = 'id'
): Promise<MCPToolResult<QueryTableOutput>> {
  return queryTable({
    table,
    filter: `${idColumn}=eq.${id}`,
    limit: 1,
  });
}

/**
 * Convenience: Count rows in a table
 */
export async function countRows(
  table: string,
  filter?: string
): Promise<MCPToolResult<{ count: number }>> {
  const result = await queryTable({
    table,
    select: 'count',
    filter,
    limit: 1,
  });

  if (result.success) {
    return {
      ...result,
      data: { count: result.data?.length || 0 },
    };
  }
  return result as MCPToolResult<{ count: number }>;
}

export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: '{SUPABASE_URL}/rest/v1/{table}',
  description: 'Query a table using Supabase REST API. Supports select, filter, order, limit.',
  inputSchema,
  tags: ['database', 'query', 'select', 'api', 'postgrest'],
  examples: [
    {
      description: 'Get first 10 profiles',
      input: { table: 'profiles', limit: 10 },
      expectedOutput: '[{ id: "...", email: "..." }]',
    },
    {
      description: 'Query with filter and select',
      input: {
        table: 'transactions',
        select: 'id,status,property_address',
        filter: 'status=eq.active',
        order: 'created_at.desc',
        limit: 5,
      },
      expectedOutput: '[{ id: "...", status: "active", property_address: "..." }]',
    },
  ],
};
