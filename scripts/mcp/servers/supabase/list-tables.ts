/**
 * Supabase: List Tables
 *
 * Lists all tables in one or more schemas with full metadata including
 * columns, constraints, RLS status, and row counts.
 *
 * @example
 * // List all public tables
 * await listTables({ schemas: ['public'] })
 *
 * @example
 * // List tables from multiple schemas
 * await listTables({ schemas: ['public', 'auth'] })
 */

import { z } from 'zod';
import { executeCliCommand, buildCommand } from '../../core/executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { ListTablesInput, ListTablesOutput } from '../../types/supabase.types.js';

const SERVER = 'supabase';
const TOOL = 'list-tables';
const MCP_NAME = 'mcp__supabase__list_tables';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  schemas: z.array(z.string()).default(['public']),
});

/**
 * List all tables in the specified schemas
 *
 * @param input - Input parameters
 * @returns Promise resolving to table definitions
 */
export async function listTables(
  input: ListTablesInput = { schemas: ['public'] }
): Promise<MCPToolResult<ListTablesOutput>> {
  const validated = inputSchema.parse(input);

  // Build the CLI command
  const command = buildCommand('npx supabase', 'db dump', {
    schema: validated.schemas,
    'data-only': false,
  });

  return executeCliCommand<ListTablesOutput>(command, SERVER, TOOL);
}

/**
 * Convenience: Get just table names
 */
export async function getTableNames(
  schema: string = 'public'
): Promise<string[]> {
  const result = await listTables({ schemas: [schema] });
  if (result.success && result.data) {
    return result.data.map((t) => t.name);
  }
  return [];
}

/**
 * Convenience: Find tables without RLS enabled
 */
export async function findTablesWithoutRLS(): Promise<
  MCPToolResult<ListTablesOutput>
> {
  const result = await listTables({ schemas: ['public'] });
  if (result.success && result.data) {
    return {
      ...result,
      data: result.data.filter((t) => !t.rls_enabled),
    };
  }
  return result;
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  cliCommand: 'supabase db dump --schema <schemas>',
  description:
    'Lists all tables in one or more schemas with columns, constraints, and RLS status',
  inputSchema,
  tags: ['database', 'schema', 'tables', 'rls', 'introspection'],
  examples: [
    {
      description: 'List all public tables',
      input: { schemas: ['public'] },
      expectedOutput: '[{ schema: "public", name: "profiles", rls_enabled: true, ... }]',
    },
    {
      description: 'List tables from multiple schemas',
      input: { schemas: ['public', 'auth'] },
      expectedOutput: '[...]',
    },
  ],
};
