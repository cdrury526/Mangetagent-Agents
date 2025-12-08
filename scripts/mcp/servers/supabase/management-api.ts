/**
 * Supabase: Management API
 *
 * Access project management features using the Supabase Management API.
 * These tools require a SUPABASE_ACCESS_TOKEN (get from Dashboard > Account > Access Tokens).
 *
 * @see https://supabase.com/docs/reference/api/introduction
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult, createErrorResult } from '../../types/index.js';
import { getSupabaseConfig } from './config.js';

const SERVER = 'supabase';
const MANAGEMENT_API_BASE = 'https://api.supabase.com/v1';

/**
 * Get Management API headers
 */
function getManagementHeaders(): Record<string, string> | null {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) return null;

  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get project ref from config
 */
function getProjectRef(): string | null {
  const config = getSupabaseConfig();
  return config?.projectRef || null;
}

// =============================================================================
// Execute SQL (via Management API)
// =============================================================================

const TOOL_SQL = 'run-sql';

export const runSqlInputSchema = z.object({
  query: z.string().min(1, 'SQL query is required'),
});

export interface RunSqlInput {
  query: string;
}

export type RunSqlOutput = unknown[];

/**
 * Execute SQL query via Management API
 * Requires SUPABASE_ACCESS_TOKEN
 */
export async function runSql(
  input: RunSqlInput
): Promise<MCPToolResult<RunSqlOutput>> {
  const validated = runSqlInputSchema.parse(input);
  const startTime = Date.now();

  const headers = getManagementHeaders();
  const projectRef = getProjectRef();

  if (!headers || !projectRef) {
    return createErrorResult(
      {
        code: 'MISSING_CONFIG',
        message: 'SUPABASE_ACCESS_TOKEN is required for SQL execution. Get it from Dashboard > Account > Access Tokens.',
        details: {
          hasAccessToken: !!headers,
          hasProjectRef: !!projectRef,
        },
      },
      {
        tool: TOOL_SQL,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }

  const url = `${MANAGEMENT_API_BASE}/projects/${projectRef}/database/query`;

  return executeApiCall<RunSqlOutput>(url, SERVER, TOOL_SQL, {
    method: 'POST',
    headers,
    body: { query: validated.query },
  });
}

export const runSqlDefinition: MCPToolDefinition = {
  name: TOOL_SQL,
  mcpName: 'mcp__supabase__run_sql',
  apiEndpoint: 'https://api.supabase.com/v1/projects/{ref}/database/query',
  description: 'Execute SQL query via Management API. Requires SUPABASE_ACCESS_TOKEN.',
  inputSchema: runSqlInputSchema,
  tags: ['database', 'sql', 'query', 'management', 'api'],
  examples: [
    {
      description: 'Create a table',
      input: { query: 'CREATE TABLE test (id serial PRIMARY KEY, name text)' },
      expectedOutput: '[]',
    },
    {
      description: 'Select data',
      input: { query: 'SELECT * FROM profiles LIMIT 5' },
      expectedOutput: '[{ id: "...", ... }]',
    },
  ],
};

// =============================================================================
// Get Project Logs
// =============================================================================

const TOOL_LOGS = 'get-project-logs';

export const getProjectLogsInputSchema = z.object({
  service: z.enum(['api', 'postgres', 'auth', 'storage', 'realtime', 'edge-function']).default('api'),
  hoursAgo: z.number().min(1).max(24).default(1),
});

export interface GetProjectLogsInput {
  service?: 'api' | 'postgres' | 'auth' | 'storage' | 'realtime' | 'edge-function';
  hoursAgo?: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  event_message: string;
  metadata: Record<string, unknown>;
}

export type GetProjectLogsOutput = LogEntry[];

/**
 * Get project logs via Management API
 * Requires SUPABASE_ACCESS_TOKEN
 */
export async function getProjectLogs(
  input: GetProjectLogsInput = {}
): Promise<MCPToolResult<GetProjectLogsOutput>> {
  const validated = getProjectLogsInputSchema.parse(input);
  const startTime = Date.now();

  const headers = getManagementHeaders();
  const projectRef = getProjectRef();

  if (!headers || !projectRef) {
    return createErrorResult(
      {
        code: 'MISSING_CONFIG',
        message: 'SUPABASE_ACCESS_TOKEN is required for logs. Get it from Dashboard > Account > Access Tokens.',
      },
      {
        tool: TOOL_LOGS,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }

  // Calculate timestamp range
  const now = new Date();
  const startDate = new Date(now.getTime() - validated.hoursAgo * 60 * 60 * 1000);

  const params = new URLSearchParams({
    iso_timestamp_start: startDate.toISOString(),
    iso_timestamp_end: now.toISOString(),
  });

  // Map service names to log sources
  const sourceMap: Record<string, string> = {
    'api': 'edge_logs',
    'postgres': 'postgres_logs',
    'auth': 'auth_logs',
    'storage': 'storage_logs',
    'realtime': 'realtime_logs',
    'edge-function': 'function_edge_logs',
  };

  const url = `${MANAGEMENT_API_BASE}/projects/${projectRef}/analytics/endpoints/logs.all?${params}`;

  return executeApiCall<GetProjectLogsOutput>(url, SERVER, TOOL_LOGS, {
    method: 'GET',
    headers,
  });
}

export const getProjectLogsDefinition: MCPToolDefinition = {
  name: TOOL_LOGS,
  mcpName: 'mcp__supabase__get_project_logs',
  apiEndpoint: 'https://api.supabase.com/v1/projects/{ref}/analytics/endpoints/logs.all',
  description: 'Get project logs via Management API. Requires SUPABASE_ACCESS_TOKEN.',
  inputSchema: getProjectLogsInputSchema,
  tags: ['logs', 'monitoring', 'debugging', 'management', 'api'],
  examples: [
    {
      description: 'Get last hour of API logs',
      input: { service: 'api', hoursAgo: 1 },
      expectedOutput: '[{ timestamp: ..., event_message: "..." }]',
    },
  ],
};

// =============================================================================
// List Tables (via Management API)
// =============================================================================

const TOOL_TABLES = 'list-all-tables';

export const listAllTablesInputSchema = z.object({
  includedSchemas: z.array(z.string()).default(['public']),
});

export interface ListAllTablesInput {
  includedSchemas?: string[];
}

export interface TableDefinition {
  id: number;
  schema: string;
  name: string;
  rls_enabled: boolean;
  rls_forced: boolean;
  replica_identity: string;
  bytes: number;
  size: string;
  live_rows_estimate: number;
  dead_rows_estimate: number;
  comment: string | null;
  columns: Array<{
    name: string;
    format: string;
    is_nullable: boolean;
    is_identity: boolean;
    is_unique: boolean;
  }>;
}

export type ListAllTablesOutput = TableDefinition[];

/**
 * List all tables with detailed schema info via Management API
 * Requires SUPABASE_ACCESS_TOKEN
 */
export async function listAllTables(
  input: ListAllTablesInput = {}
): Promise<MCPToolResult<ListAllTablesOutput>> {
  const validated = listAllTablesInputSchema.parse(input);
  const startTime = Date.now();

  const headers = getManagementHeaders();
  const projectRef = getProjectRef();

  if (!headers || !projectRef) {
    return createErrorResult(
      {
        code: 'MISSING_CONFIG',
        message: 'SUPABASE_ACCESS_TOKEN is required. Get it from Dashboard > Account > Access Tokens.',
      },
      {
        tool: TOOL_TABLES,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }

  const params = new URLSearchParams();
  validated.includedSchemas.forEach(s => params.append('included_schemas', s));

  const url = `${MANAGEMENT_API_BASE}/projects/${projectRef}/database/tables?${params}`;

  return executeApiCall<ListAllTablesOutput>(url, SERVER, TOOL_TABLES, {
    method: 'GET',
    headers,
  });
}

export const listAllTablesDefinition: MCPToolDefinition = {
  name: TOOL_TABLES,
  mcpName: 'mcp__supabase__list_all_tables',
  apiEndpoint: 'https://api.supabase.com/v1/projects/{ref}/database/tables',
  description: 'List all tables with detailed schema info. Requires SUPABASE_ACCESS_TOKEN.',
  inputSchema: listAllTablesInputSchema,
  tags: ['database', 'schema', 'tables', 'management', 'api'],
  examples: [
    {
      description: 'List public tables',
      input: { includedSchemas: ['public'] },
      expectedOutput: '[{ schema: "public", name: "profiles", rls_enabled: true, columns: [...] }]',
    },
  ],
};

// =============================================================================
// Get Database Health
// =============================================================================

const TOOL_HEALTH = 'get-database-health';

export const getDatabaseHealthInputSchema = z.object({});

export interface DatabaseHealth {
  status: string;
  version: string;
  activeConnections: number;
  maxConnections: number;
}

/**
 * Get database health status
 */
export async function getDatabaseHealth(): Promise<MCPToolResult<DatabaseHealth>> {
  const startTime = Date.now();

  const headers = getManagementHeaders();
  const projectRef = getProjectRef();

  if (!headers || !projectRef) {
    return createErrorResult(
      {
        code: 'MISSING_CONFIG',
        message: 'SUPABASE_ACCESS_TOKEN is required.',
      },
      {
        tool: TOOL_HEALTH,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }

  const url = `${MANAGEMENT_API_BASE}/projects/${projectRef}/database/health`;

  return executeApiCall<DatabaseHealth>(url, SERVER, TOOL_HEALTH, {
    method: 'GET',
    headers,
  });
}

export const getDatabaseHealthDefinition: MCPToolDefinition = {
  name: TOOL_HEALTH,
  mcpName: 'mcp__supabase__get_database_health',
  apiEndpoint: 'https://api.supabase.com/v1/projects/{ref}/database/health',
  description: 'Get database health status. Requires SUPABASE_ACCESS_TOKEN.',
  inputSchema: getDatabaseHealthInputSchema,
  tags: ['database', 'health', 'monitoring', 'management', 'api'],
  examples: [
    {
      description: 'Check database health',
      input: {},
      expectedOutput: '{ status: "healthy", activeConnections: 5, maxConnections: 100 }',
    },
  ],
};
