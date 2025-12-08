/**
 * Supabase: Generate TypeScript Types (Management API)
 *
 * Generate TypeScript types from database schema using the Supabase Management API.
 * This tool works without Docker or local Supabase running, making it ideal for CI/CD.
 *
 * @example
 * await generateTypesApi({ outputPath: 'src/types/database.ts' })
 * await generateTypesApi({ includedSchemas: ['public', 'auth'] })
 *
 * @see https://supabase.com/docs/reference/api/generating-types
 */

import { z } from 'zod';
import * as fs from 'fs/promises';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult, createSuccessResult, createErrorResult } from '../../types/index.js';
import { getSupabaseConfig } from './config.js';

const SERVER = 'supabase';
const MANAGEMENT_API_BASE = 'https://api.supabase.com/v1';
const TOOL_NAME = 'generate-types-api';

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
// Generate TypeScript Types (Management API)
// =============================================================================

export const generateTypesApiInputSchema = z.object({
  includedSchemas: z.array(z.string()).default(['public']).optional(),
  outputPath: z.string().optional(),
});

export interface GenerateTypesApiInput {
  includedSchemas?: string[];
  outputPath?: string;
}

export interface GenerateTypesApiOutput {
  types?: string;
  saved?: boolean;
  path?: string;
}

/**
 * Generate TypeScript types from database schema via Management API
 * Requires SUPABASE_ACCESS_TOKEN
 */
export async function generateTypesApi(
  input: GenerateTypesApiInput = {}
): Promise<MCPToolResult<GenerateTypesApiOutput>> {
  const validated = generateTypesApiInputSchema.parse(input);
  const startTime = Date.now();

  const headers = getManagementHeaders();
  const projectRef = getProjectRef();

  if (!headers || !projectRef) {
    return createErrorResult(
      {
        code: 'MISSING_CONFIG',
        message: 'SUPABASE_ACCESS_TOKEN is required for type generation. Get it from Dashboard > Account > Access Tokens.',
        details: {
          hasAccessToken: !!headers,
          hasProjectRef: !!projectRef,
        },
      },
      {
        tool: TOOL_NAME,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }

  // Build query parameters
  const params = new URLSearchParams();
  if (validated.includedSchemas && validated.includedSchemas.length > 0) {
    validated.includedSchemas.forEach(schema => params.append('included_schemas', schema));
  }

  const url = `${MANAGEMENT_API_BASE}/projects/${projectRef}/types/typescript?${params}`;

  // Call the API to get types (API returns plain text TypeScript code)
  const result = await executeApiCall<string>(url, SERVER, TOOL_NAME, {
    method: 'GET',
    headers,
  });

  if (!result.success) {
    return result as MCPToolResult<GenerateTypesApiOutput>;
  }

  const types = result.data as string;

  // If outputPath is provided, save to file
  if (validated.outputPath) {
    try {
      await fs.writeFile(validated.outputPath, types, 'utf-8');
      return createSuccessResult<GenerateTypesApiOutput>(
        {
          saved: true,
          path: validated.outputPath,
        },
        {
          tool: TOOL_NAME,
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
        }
      );
    } catch (error) {
      return createErrorResult(
        {
          code: 'FILE_WRITE_ERROR',
          message: `Failed to write types to ${validated.outputPath}: ${error instanceof Error ? error.message : String(error)}`,
        },
        {
          tool: TOOL_NAME,
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
        }
      );
    }
  }

  // No output path - return types as string
  return createSuccessResult<GenerateTypesApiOutput>(
    {
      types,
    },
    {
      tool: TOOL_NAME,
      server: SERVER,
      executionTimeMs: Date.now() - startTime,
      executionType: 'api',
    }
  );
}

export const generateTypesApiDefinition: MCPToolDefinition = {
  name: TOOL_NAME,
  mcpName: 'mcp__supabase__generate_types_api',
  apiEndpoint: 'https://api.supabase.com/v1/projects/{ref}/types/typescript',
  description: 'Generate TypeScript types from database schema via Management API. Requires SUPABASE_ACCESS_TOKEN. Works without Docker or local Supabase.',
  inputSchema: generateTypesApiInputSchema,
  tags: ['types', 'typescript', 'schema', 'codegen', 'management', 'api'],
  examples: [
    {
      description: 'Generate types to console',
      input: {},
      expectedOutput: '{ types: "export type Json = ... export interface Database { ... }" }',
    },
    {
      description: 'Generate types to file',
      input: { outputPath: 'src/types/database.ts' },
      expectedOutput: '{ saved: true, path: "src/types/database.ts" }',
    },
    {
      description: 'Include multiple schemas',
      input: { includedSchemas: ['public', 'auth'], outputPath: 'src/types/database.ts' },
      expectedOutput: '{ saved: true, path: "src/types/database.ts" }',
    },
  ],
};
