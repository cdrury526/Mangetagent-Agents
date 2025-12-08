/**
 * Supabase: Generate TypeScript Types
 *
 * Generates TypeScript types for the project database schema.
 * This creates type definitions that match your database tables,
 * enabling type-safe database queries.
 *
 * @example
 * const types = await generateTypes();
 * // Returns TypeScript type definitions as a string
 */

import { z } from 'zod';
import { executeCliCommand } from '../../core/executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { GenerateTypesOutput } from '../../types/supabase.types.js';

const SERVER = 'supabase';
const TOOL = 'generate-types';
const MCP_NAME = 'mcp__supabase__generate_typescript_types';

/**
 * Input validation schema (no input required)
 */
export const inputSchema = z.object({});

/**
 * Generate TypeScript types for the project
 *
 * @returns Promise resolving to TypeScript type definitions
 */
export async function generateTypes(): Promise<
  MCPToolResult<GenerateTypesOutput>
> {
  // Build the CLI command
  const command = 'npx supabase gen types typescript --local';

  return executeCliCommand<GenerateTypesOutput>(command, SERVER, TOOL, {
    parseJson: false, // Returns TypeScript code, not JSON
  });
}

/**
 * Generate types and save to file
 *
 * @param outputPath - Path to save the generated types
 * @returns Promise resolving to result
 */
export async function generateTypesToFile(
  outputPath: string = 'src/types/database.ts'
): Promise<MCPToolResult<string>> {
  const command = `npx supabase gen types typescript --local > ${outputPath}`;

  return executeCliCommand<string>(command, SERVER, TOOL, {
    parseJson: false,
  });
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  cliCommand: 'supabase gen types typescript --local',
  description:
    'Generates TypeScript types for the project database schema for type-safe queries',
  inputSchema,
  tags: ['types', 'typescript', 'codegen', 'schema', 'database'],
  examples: [
    {
      description: 'Generate types for the database',
      input: {},
      expectedOutput: 'export interface Database { public: { Tables: { ... } } }',
    },
  ],
};
