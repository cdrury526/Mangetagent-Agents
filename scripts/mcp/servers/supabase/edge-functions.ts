/**
 * Supabase: Edge Functions
 *
 * Invoke and manage Edge Functions using the Supabase Functions API.
 *
 * @example
 * await invokeFunction({ name: 'hello-world', payload: { name: 'John' } })
 * await invokeFunction({ name: 'admin-task', useServiceRole: true })
 * await listFunctions()
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult, createErrorResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getSupabaseConfig, getManagementHeaders } from './config.js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
dotenv.config({ path: resolve(process.cwd(), '.env') });

const SERVER = 'supabase';

// =============================================================================
// Invoke Function
// =============================================================================

const TOOL_INVOKE = 'invoke-function';

export const invokeFunctionInputSchema = z.object({
  name: z.string().min(1, 'Function name is required'),
  payload: z.record(z.unknown()).optional(),
  useServiceRole: z.boolean().default(false).optional(),
});

export interface InvokeFunctionInput {
  name: string;
  payload?: Record<string, unknown>;
  useServiceRole?: boolean;
}

export type InvokeFunctionOutput = unknown;

/**
 * Invoke an Edge Function
 */
export async function invokeFunction(
  input: InvokeFunctionInput
): Promise<MCPToolResult<InvokeFunctionOutput>> {
  const validated = invokeFunctionInputSchema.parse(input);

  const configOrError = validateConfig<InvokeFunctionOutput>(SERVER, TOOL_INVOKE);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  // Build URL
  const url = `${config.url}/functions/v1/${validated.name}`;

  // Choose the appropriate key
  const authKey = validated.useServiceRole ? config.serviceRoleKey : config.anonKey;

  return executeApiCall<InvokeFunctionOutput>(url, SERVER, TOOL_INVOKE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authKey}`,
      'Content-Type': 'application/json',
    },
    body: validated.payload || {},
  });
}

export const invokeFunctionDefinition: MCPToolDefinition = {
  name: TOOL_INVOKE,
  mcpName: 'mcp__supabase__invoke_function',
  apiEndpoint: '{SUPABASE_URL}/functions/v1/{function_name}',
  description: 'Invoke an Edge Function with optional payload (uses anon key by default, or service role key)',
  inputSchema: invokeFunctionInputSchema,
  tags: ['functions', 'edge', 'serverless', 'api'],
  examples: [
    {
      description: 'Invoke function with payload (anon key)',
      input: {
        name: 'hello-world',
        payload: { name: 'John Doe' },
      },
      expectedOutput: '{ message: "Hello, John Doe!" }',
    },
    {
      description: 'Invoke admin function with service role',
      input: {
        name: 'admin-task',
        useServiceRole: true,
        payload: { action: 'cleanup' },
      },
      expectedOutput: '{ success: true, message: "Cleanup completed" }',
    },
    {
      description: 'Invoke function without payload',
      input: {
        name: 'health-check',
      },
      expectedOutput: '{ status: "ok" }',
    },
  ],
};

// =============================================================================
// List Functions (Management API)
// =============================================================================

const TOOL_LIST = 'list-functions';

export const listFunctionsInputSchema = z.object({});

export interface ListFunctionsInput {}

export interface EdgeFunction {
  id: string;
  slug: string;
  name: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
  verify_jwt: boolean;
  import_map: boolean;
}

export type ListFunctionsOutput = EdgeFunction[];

/**
 * List all deployed Edge Functions (uses Management API)
 */
export async function listFunctions(
  input: ListFunctionsInput = {}
): Promise<MCPToolResult<ListFunctionsOutput>> {
  listFunctionsInputSchema.parse(input);

  // Get config for project ref
  const config = getSupabaseConfig();
  if (!config) {
    return createErrorResult<ListFunctionsOutput>(
      {
        code: 'MISSING_CONFIG',
        message: 'Supabase configuration not found. Ensure .env has VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_SUPABASE_SERVICE_ROLE_KEY',
      },
      {
        tool: TOOL_LIST,
        server: SERVER,
        executionTimeMs: 0,
        executionType: 'api',
      }
    );
  }

  // Get access token
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN || process.env.VITE_SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    return createErrorResult<ListFunctionsOutput>(
      {
        code: 'MISSING_ACCESS_TOKEN',
        message: 'SUPABASE_ACCESS_TOKEN not found in .env. Required for Management API access. Get it from https://supabase.com/dashboard/account/tokens',
      },
      {
        tool: TOOL_LIST,
        server: SERVER,
        executionTimeMs: 0,
        executionType: 'api',
      }
    );
  }

  // Build Management API URL
  const url = `https://api.supabase.com/v1/projects/${config.projectRef}/functions`;

  return executeApiCall<ListFunctionsOutput>(url, SERVER, TOOL_LIST, {
    method: 'GET',
    headers: getManagementHeaders(accessToken),
  });
}

export const listFunctionsDefinition: MCPToolDefinition = {
  name: TOOL_LIST,
  mcpName: 'mcp__supabase__list_functions',
  apiEndpoint: 'https://api.supabase.com/v1/projects/{ref}/functions',
  description: 'List all deployed Edge Functions using the Management API (requires SUPABASE_ACCESS_TOKEN)',
  inputSchema: listFunctionsInputSchema,
  tags: ['functions', 'edge', 'serverless', 'list', 'api'],
  examples: [
    {
      description: 'List all Edge Functions',
      input: {},
      expectedOutput: '[{ id: "...", slug: "hello-world", name: "hello-world", status: "ACTIVE", ... }]',
    },
  ],
};
