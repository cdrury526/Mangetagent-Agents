/**
 * Supabase: Get Advisors
 *
 * Gets advisory notices for the Supabase project.
 * Use this to check for security vulnerabilities or performance improvements.
 *
 * It's recommended to run this tool regularly, especially after making DDL
 * changes to the database since it will catch things like missing RLS policies.
 *
 * @example
 * await getAdvisors({ type: 'security' })
 *
 * @example
 * await getAdvisors({ type: 'performance' })
 */

import { z } from 'zod';
import { executeApiCall, buildUrl } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  GetAdvisorsInput,
  GetAdvisorsOutput,
  AdvisorType,
} from '../../types/supabase.types.js';

const SERVER = 'supabase';
const TOOL = 'get-advisors';
const MCP_NAME = 'mcp__supabase__get_advisors';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  type: z.enum(['security', 'performance'] as [AdvisorType, AdvisorType]),
});

/**
 * Get advisory notices
 *
 * @param input - Type of advisors to fetch
 * @returns Promise resolving to advisory notices
 */
export async function getAdvisors(
  input: GetAdvisorsInput
): Promise<MCPToolResult<GetAdvisorsOutput>> {
  const validated = inputSchema.parse(input);

  // This uses the Supabase Management API
  // The actual URL and auth would come from environment/config
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (!projectRef || !accessToken) {
    return {
      success: false,
      error: {
        code: 'MISSING_CONFIG',
        message: 'SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN are required',
      },
      metadata: {
        tool: TOOL,
        server: SERVER,
        executionTimeMs: 0,
        timestamp: new Date().toISOString(),
        executionType: 'api',
      },
    };
  }

  const url = buildUrl(
    `https://api.supabase.com/v1/projects/${projectRef}/advisors/${validated.type}`,
    {}
  );

  return executeApiCall<GetAdvisorsOutput>(url, SERVER, TOOL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Convenience: Get security advisors
 */
export async function getSecurityAdvisors(): Promise<
  MCPToolResult<GetAdvisorsOutput>
> {
  return getAdvisors({ type: 'security' });
}

/**
 * Convenience: Get performance advisors
 */
export async function getPerformanceAdvisors(): Promise<
  MCPToolResult<GetAdvisorsOutput>
> {
  return getAdvisors({ type: 'performance' });
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: 'https://api.supabase.com/v1/projects/{ref}/advisors/{type}',
  description:
    'Gets advisory notices for security vulnerabilities or performance improvements. Run after DDL changes.',
  inputSchema,
  tags: ['security', 'performance', 'rls', 'advisors', 'audit'],
  examples: [
    {
      description: 'Get security advisors (check for missing RLS)',
      input: { type: 'security' },
      expectedOutput:
        '[{ id: "...", title: "Missing RLS policy", remediation: "..." }]',
    },
    {
      description: 'Get performance advisors',
      input: { type: 'performance' },
      expectedOutput: '[{ id: "...", title: "Missing index", remediation: "..." }]',
    },
  ],
};
