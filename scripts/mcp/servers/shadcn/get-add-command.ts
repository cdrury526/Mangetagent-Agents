/**
 * shadcn: Get Add Command
 *
 * Get the shadcn CLI add command for specific items.
 * Useful for adding one or more components to your project.
 *
 * @example
 * await getAddCommand({ items: ['@shadcn/button', '@shadcn/card'] })
 * // Returns: { command: "npx shadcn@latest add button card", items: ["button", "card"] }
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult, createSuccessResult } from '../../types/index.js';
import { GetAddCommandInput, GetAddCommandOutput } from '../../types/shadcn.types.js';

const SERVER = 'shadcn';
const TOOL = 'get-add-command';
const MCP_NAME = 'mcp__shadcn__get_add_command_for_items';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  items: z
    .array(z.string())
    .min(1, 'At least one item is required')
    .max(20, 'Maximum 20 items per request'),
});

/**
 * Get the add command for registry items
 *
 * @param input - Items to get the add command for
 * @returns Promise resolving to add command
 */
export async function getAddCommand(
  input: GetAddCommandInput
): Promise<MCPToolResult<GetAddCommandOutput>> {
  const validated = inputSchema.parse(input);

  // Extract component names from registry-prefixed items
  const componentNames = validated.items.map((item) => {
    // Handle both "@shadcn/button" and "button" formats
    const parts = item.split('/');
    return parts[parts.length - 1];
  });

  // Build the add command
  const command = `npx shadcn@latest add ${componentNames.join(' ')}`;

  return createSuccessResult<GetAddCommandOutput>(
    {
      command,
      items: componentNames,
    },
    {
      tool: TOOL,
      server: SERVER,
      executionTimeMs: 0,
      executionType: 'cli',
    }
  );
}

/**
 * Convenience: Get add command for a single component
 */
export async function getComponentAddCommand(
  componentName: string
): Promise<MCPToolResult<GetAddCommandOutput>> {
  return getAddCommand({ items: [`@shadcn/${componentName}`] });
}

/**
 * Convenience: Execute the add command directly
 */
export async function addComponents(
  componentNames: string[]
): Promise<MCPToolResult<string>> {
  const { executeCliCommand } = await import('../../core/executor.js');

  const command = `npx shadcn@latest add ${componentNames.join(' ')} --yes`;

  return executeCliCommand<string>(command, SERVER, 'add-components', {
    parseJson: false,
    timeout: 120000, // 2 minutes for installation
  });
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  cliCommand: 'npx shadcn@latest add <components>',
  description:
    'Get the shadcn CLI add command for specific items. Use for installing components.',
  inputSchema,
  tags: ['add', 'install', 'cli', 'command', 'shadcn'],
  examples: [
    {
      description: 'Get command for single component',
      input: { items: ['@shadcn/button'] },
      expectedOutput: '{ command: "npx shadcn@latest add button", items: ["button"] }',
    },
    {
      description: 'Get command for multiple components',
      input: { items: ['@shadcn/button', '@shadcn/card', '@shadcn/dialog'] },
      expectedOutput:
        '{ command: "npx shadcn@latest add button card dialog", items: ["button", "card", "dialog"] }',
    },
  ],
};
