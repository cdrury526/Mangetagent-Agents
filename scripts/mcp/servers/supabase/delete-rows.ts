/**
 * Supabase: Delete Rows
 *
 * Delete rows from a table using the Supabase REST API.
 *
 * @example
 * await deleteRows({ table: 'contacts', filter: 'id=eq.123' })
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getRestHeaders } from './config.js';

const SERVER = 'supabase';
const TOOL = 'delete-rows';
const MCP_NAME = 'mcp__supabase__delete_rows';

export const inputSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  filter: z.string().min(1, 'Filter is required to prevent accidental mass deletion'),
});

export interface DeleteRowsInput {
  table: string;
  filter: string;
}

export type DeleteRowsOutput = Record<string, unknown>[];

/**
 * Delete rows matching a filter
 */
export async function deleteRows(
  input: DeleteRowsInput
): Promise<MCPToolResult<DeleteRowsOutput>> {
  const validated = inputSchema.parse(input);

  const configOrError = validateConfig<DeleteRowsOutput>(SERVER, TOOL);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/rest/v1/${validated.table}?${validated.filter}`;

  return executeApiCall<DeleteRowsOutput>(url, SERVER, TOOL, {
    method: 'DELETE',
    headers: {
      ...getRestHeaders(config, true),
      'Prefer': 'return=representation',
    },
  });
}

/**
 * Convenience: Delete a single row by ID
 */
export async function deleteRowById(
  table: string,
  id: string,
  idColumn: string = 'id'
): Promise<MCPToolResult<DeleteRowsOutput>> {
  return deleteRows({
    table,
    filter: `${idColumn}=eq.${id}`,
  });
}

export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: '{SUPABASE_URL}/rest/v1/{table}',
  description: 'Delete rows from a table using Supabase REST API. Filter is required.',
  inputSchema,
  tags: ['database', 'delete', 'remove', 'api', 'postgrest'],
  examples: [
    {
      description: 'Delete a contact by ID',
      input: {
        table: 'contacts',
        filter: 'id=eq.abc-123',
      },
      expectedOutput: '[{ id: "abc-123", ... }]',
    },
  ],
};
