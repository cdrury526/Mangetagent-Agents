/**
 * [SERVER_NAME]: [Tool Name]
 *
 * Copy this file to servers/[server-name]/[tool-name].ts and customize.
 *
 * Template for creating a new MCP tool wrapper.
 *
 * Steps:
 * 1. Copy this file to servers/[server-name]/[tool-name].ts
 * 2. Update SERVER, TOOL, and MCP_NAME constants
 * 3. Define input types in types/[server-name].types.ts
 * 4. Implement the tool function
 * 5. Export from servers/[server-name]/index.ts
 * 6. Run: npm run generate-registry
 */

import { z } from 'zod';
import { executeCliCommand, buildCommand } from '../../core/executor.js';
// Or for API-based tools:
// import { executeApiCall, buildUrl } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
// Import your types:
// import { ToolNameInput, ToolNameOutput } from '../../types/server-name.types.js';

// =============================================================================
// Constants - Update these for your tool
// =============================================================================

const SERVER = 'server-name'; // e.g., 'supabase', 'shadcn', 'github'
const TOOL = 'tool-name'; // e.g., 'list-tables', 'search-items'
const MCP_NAME = 'mcp__server__tool_name'; // e.g., 'mcp__supabase__list_tables'

// =============================================================================
// Input Schema - Define validation for tool inputs
// =============================================================================

/**
 * Input validation schema using Zod
 *
 * Common patterns:
 * - z.string().min(1, 'Required message')
 * - z.array(z.string()).default([])
 * - z.number().positive()
 * - z.enum(['option1', 'option2'])
 * - z.boolean().default(false)
 * - z.object({ nested: z.string() })
 */
export const inputSchema = z.object({
  // Define your input parameters here
  // exampleParam: z.string().min(1, 'Example param is required'),
  // optionalParam: z.string().optional(),
  // arrayParam: z.array(z.string()).default([]),
});

// =============================================================================
// Type Definitions - Define in types/[server-name].types.ts
// =============================================================================

// Example input/output types (move to types file):
interface ToolNameInput {
  exampleParam: string;
  optionalParam?: string;
}

interface ToolNameOutput {
  result: string;
  data?: unknown;
}

// =============================================================================
// Main Tool Function
// =============================================================================

/**
 * [Tool Description]
 *
 * @param input - Input parameters
 * @returns Promise resolving to tool result
 *
 * @example
 * await toolName({ exampleParam: 'value' })
 */
export async function toolName(
  input: ToolNameInput
): Promise<MCPToolResult<ToolNameOutput>> {
  // Validate input
  const validated = inputSchema.parse(input);

  // Option 1: CLI-based execution
  const command = buildCommand('cli-base', 'subcommand', {
    param: validated.exampleParam,
  });
  return executeCliCommand<ToolNameOutput>(command, SERVER, TOOL);

  // Option 2: API-based execution
  // const url = buildUrl('https://api.example.com/endpoint', {
  //   param: validated.exampleParam,
  // });
  // return executeApiCall<ToolNameOutput>(url, SERVER, TOOL, {
  //   headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
  // });
}

// =============================================================================
// Convenience Functions (Optional)
// =============================================================================

/**
 * Convenience function with simpler interface
 */
export async function toolNameSimple(
  param: string
): Promise<MCPToolResult<ToolNameOutput>> {
  return toolName({ exampleParam: param });
}

// =============================================================================
// Tool Definition for Registry
// =============================================================================

/**
 * Tool definition exported for registry generation
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  cliCommand: 'cli-base subcommand --param <value>', // CLI equivalent
  // apiEndpoint: 'https://api.example.com/endpoint', // API endpoint (if applicable)
  description: 'Brief description of what this tool does',
  inputSchema,
  tags: ['tag1', 'tag2', 'tag3'], // For search/categorization
  examples: [
    {
      description: 'Example usage description',
      input: { exampleParam: 'value' },
      expectedOutput: '{ result: "...", data: [...] }',
    },
  ],
};

/**
 * After creating your tool:
 *
 * 1. Export from server index.ts:
 *    export * from './tool-name.js';
 *    import { toolDefinition as toolNameDefinition } from './tool-name.js';
 *
 * 2. Add to manifest.tools array in server index.ts:
 *    tools: [
 *      ...existingTools,
 *      toolNameDefinition,
 *    ],
 *
 * 3. Run registry generator:
 *    npm run generate-registry
 */
