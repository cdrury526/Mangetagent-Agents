/**
 * Supabase: Get Logs
 *
 * Gets logs for a Supabase project by service type.
 * Use this to help debug problems with your app.
 * Returns logs within the last 24 hours.
 *
 * @example
 * await getLogs({ service: 'api' })
 *
 * @example
 * await getLogs({ service: 'edge-function' })
 */

import { z } from 'zod';
import { executeCliCommand } from '../../core/executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  GetLogsInput,
  GetLogsOutput,
  LogServiceType,
} from '../../types/supabase.types.js';

const SERVER = 'supabase';
const TOOL = 'get-logs';
const MCP_NAME = 'mcp__supabase__get_logs';

/**
 * Valid service types
 */
const serviceTypes: LogServiceType[] = [
  'api',
  'branch-action',
  'postgres',
  'edge-function',
  'auth',
  'storage',
  'realtime',
];

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  service: z.enum(serviceTypes as [LogServiceType, ...LogServiceType[]]),
});

/**
 * Get logs for a service
 *
 * @param input - Service to fetch logs for
 * @returns Promise resolving to log entries
 */
export async function getLogs(
  input: GetLogsInput
): Promise<MCPToolResult<GetLogsOutput>> {
  const validated = inputSchema.parse(input);

  // Build the CLI command
  const command = `npx supabase logs --type ${validated.service}`;

  return executeCliCommand<GetLogsOutput>(command, SERVER, TOOL);
}

/**
 * Convenience: Get API logs
 */
export async function getApiLogs(): Promise<MCPToolResult<GetLogsOutput>> {
  return getLogs({ service: 'api' });
}

/**
 * Convenience: Get auth logs
 */
export async function getAuthLogs(): Promise<MCPToolResult<GetLogsOutput>> {
  return getLogs({ service: 'auth' });
}

/**
 * Convenience: Get edge function logs
 */
export async function getEdgeFunctionLogs(): Promise<
  MCPToolResult<GetLogsOutput>
> {
  return getLogs({ service: 'edge-function' });
}

/**
 * Convenience: Get postgres logs
 */
export async function getPostgresLogs(): Promise<MCPToolResult<GetLogsOutput>> {
  return getLogs({ service: 'postgres' });
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  cliCommand: 'supabase logs --type <service>',
  description:
    'Gets logs for a Supabase project by service type. Returns logs within the last 24 hours.',
  inputSchema,
  tags: ['logs', 'debugging', 'monitoring', 'api', 'auth', 'edge-function'],
  examples: [
    {
      description: 'Get API logs',
      input: { service: 'api' },
      expectedOutput: '[{ timestamp: "...", event_message: "...", ... }]',
    },
    {
      description: 'Get edge function logs',
      input: { service: 'edge-function' },
      expectedOutput: '[{ timestamp: "...", event_message: "...", ... }]',
    },
    {
      description: 'Get auth logs',
      input: { service: 'auth' },
      expectedOutput: '[{ timestamp: "...", event_message: "...", ... }]',
    },
  ],
};
