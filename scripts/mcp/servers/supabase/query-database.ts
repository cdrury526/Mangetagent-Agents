/**
 * Supabase: Query Database (API-based)
 *
 * Executes SQL queries against the remote Supabase database using the REST API.
 * This works without needing a local Supabase instance running.
 *
 * Uses the Supabase service role key for full access (backend only).
 *
 * @example
 * await queryDatabase({ query: 'SELECT * FROM profiles LIMIT 5' })
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult, createErrorResult } from '../../types/index.js';

const SERVER = 'supabase';
const TOOL = 'query-database';
const MCP_NAME = 'mcp__supabase__query_database';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  query: z.string().min(1, 'SQL query is required'),
});

export interface QueryDatabaseInput {
  query: string;
}

export type QueryDatabaseOutput = unknown[];

/**
 * Load environment variables (supports both VITE_ prefix and non-prefixed)
 */
function getEnvVar(name: string): string | undefined {
  return process.env[name] || process.env[`VITE_${name}`];
}

/**
 * Query the database using Supabase REST API
 *
 * @param input - SQL query to execute
 * @returns Promise resolving to query results
 */
export async function queryDatabase(
  input: QueryDatabaseInput
): Promise<MCPToolResult<QueryDatabaseOutput>> {
  const validated = inputSchema.parse(input);
  const startTime = Date.now();

  const supabaseUrl = getEnvVar('SUPABASE_URL');
  const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return createErrorResult(
      {
        code: 'MISSING_CONFIG',
        message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Check .env file.',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceRoleKey,
        },
      },
      {
        tool: TOOL,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }

  // Use Supabase's REST API for raw SQL queries via PostgREST's RPC
  // For raw SQL, we need to use the /rest/v1/rpc endpoint with a custom function
  // Or use the pg_query endpoint (admin API)

  // Alternative: Use the Supabase Management API's SQL endpoint
  const url = `${supabaseUrl}/rest/v1/rpc/exec_sql`;

  // First, try using a stored function if available
  // If not, we'll fall back to a different approach
  const result = await executeApiCall<QueryDatabaseOutput>(url, SERVER, TOOL, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: { sql: validated.query },
  });

  // If the RPC function doesn't exist, provide helpful error
  if (!result.success && result.error?.code === 'HTTP_404') {
    return createErrorResult(
      {
        code: 'RPC_NOT_FOUND',
        message: 'The exec_sql RPC function is not available. Create it or use the Supabase Dashboard for raw SQL.',
        details: {
          suggestion: 'Run: CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS json AS $$ ... $$ in Supabase Dashboard',
          originalError: result.error,
        },
      },
      result.metadata
    );
  }

  return result;
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: '{SUPABASE_URL}/rest/v1/rpc/exec_sql',
  description:
    'Executes SQL queries against remote Supabase using REST API. Works without local Docker.',
  inputSchema,
  tags: ['database', 'sql', 'query', 'api', 'remote'],
  examples: [
    {
      description: 'Query profiles table',
      input: { query: 'SELECT * FROM profiles LIMIT 5' },
      expectedOutput: '[{ id: "...", ... }]',
    },
  ],
};
