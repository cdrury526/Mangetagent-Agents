/**
 * Supabase: Insert Row
 *
 * Insert a row into a table using the Supabase REST API.
 *
 * @example
 * await insertRow({ table: 'contacts', data: { name: 'John', email: 'john@example.com' } })
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getRestHeaders } from './config.js';

const SERVER = 'supabase';
const TOOL = 'insert-row';
const MCP_NAME = 'mcp__supabase__insert_row';

export const inputSchema = z.object({
  table: z.string().min(1, 'Table name is required'),
  data: z.record(z.unknown()),
  returning: z.string().optional().default('*'),
});

export interface InsertRowInput {
  table: string;
  data: Record<string, unknown>;
  returning?: string;
}

export type InsertRowOutput = Record<string, unknown>;

/**
 * Insert a row into a table
 */
export async function insertRow(
  input: InsertRowInput
): Promise<MCPToolResult<InsertRowOutput>> {
  const validated = inputSchema.parse(input);

  const configOrError = validateConfig<InsertRowOutput>(SERVER, TOOL);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/rest/v1/${validated.table}`;

  return executeApiCall<InsertRowOutput>(url, SERVER, TOOL, {
    method: 'POST',
    headers: {
      ...getRestHeaders(config, true),
      'Prefer': `return=representation`,
    },
    body: validated.data,
  });
}

export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: '{SUPABASE_URL}/rest/v1/{table}',
  description: 'Insert a row into a table using Supabase REST API',
  inputSchema,
  tags: ['database', 'insert', 'create', 'api', 'postgrest'],
  examples: [
    {
      description: 'Insert a contact',
      input: {
        table: 'contacts',
        data: { name: 'John Doe', email: 'john@example.com' },
      },
      expectedOutput: '{ id: "...", name: "John Doe", email: "john@example.com" }',
    },
  ],
};
