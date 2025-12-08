/**
 * Supabase: Update Rows
 *
 * Update rows in a table using the Supabase REST API.
 *
 * @example
 * await updateRows({ table: 'profiles', filter: 'id=eq.123', data: { name: 'Updated Name' } })
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getRestHeaders } from './config.js';

const SERVER = 'supabase';
const TOOL = 'update-rows';
const MCP_NAME = 'mcp__supabase__update_rows';

export const inputSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  filter: z.string().min(1, 'Filter is required to prevent accidental mass updates'),
  data: z.record(z.unknown()),
});

export interface UpdateRowsInput {
  table: string;
  filter: string;
  data: Record<string, unknown>;
}

export type UpdateRowsOutput = Record<string, unknown>[];

/**
 * Update rows matching a filter
 */
export async function updateRows(
  input: UpdateRowsInput
): Promise<MCPToolResult<UpdateRowsOutput>> {
  const validated = inputSchema.parse(input);

  const configOrError = validateConfig<UpdateRowsOutput>(SERVER, TOOL);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/rest/v1/${validated.table}?${validated.filter}`;

  return executeApiCall<UpdateRowsOutput>(url, SERVER, TOOL, {
    method: 'PATCH',
    headers: {
      ...getRestHeaders(config, true),
      'Prefer': 'return=representation',
    },
    body: validated.data,
  });
}

/**
 * Convenience: Update a single row by ID
 */
export async function updateRowById(
  table: string,
  id: string,
  data: Record<string, unknown>,
  idColumn: string = 'id'
): Promise<MCPToolResult<UpdateRowsOutput>> {
  return updateRows({
    table,
    filter: `${idColumn}=eq.${id}`,
    data,
  });
}

export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: '{SUPABASE_URL}/rest/v1/{table}',
  description: 'Update rows in a table using Supabase REST API. Filter is required.',
  inputSchema,
  tags: ['database', 'update', 'patch', 'api', 'postgrest'],
  examples: [
    {
      description: 'Update a profile by ID',
      input: {
        table: 'profiles',
        filter: 'id=eq.abc-123',
        data: { display_name: 'New Name' },
      },
      expectedOutput: '[{ id: "abc-123", display_name: "New Name", ... }]',
    },
  ],
};
