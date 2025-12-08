/**
 * shadcn: View Items
 *
 * View component details including source code from the shadcn/ui registry.
 *
 * @example
 * await viewItems({ items: ['@shadcn/button'] })
 *
 * @example
 * await viewItems({ items: ['@shadcn/button', '@shadcn/card'] })
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { ViewItemsInput, ViewItemsOutput, ViewItemResult } from '../../types/shadcn.types.js';

const SERVER = 'shadcn';
const TOOL = 'view-items';
const MCP_NAME = 'mcp__shadcn__view_items_in_registries';

// shadcn registry API base URL
const REGISTRY_BASE_URL = 'https://ui.shadcn.com/r';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  items: z
    .array(z.string())
    .min(1, 'At least one item is required')
    .max(10, 'Maximum 10 items per request'),
});

/**
 * Fetch component details from the registry
 */
async function fetchComponentDetails(componentName: string): Promise<{
  name: string;
  type: string;
  author?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: Array<{ path: string; content: string; type: string; target?: string }>;
  tailwind?: Record<string, unknown>;
  cssVars?: Record<string, unknown>;
}> {
  // Try the default style first
  const url = `${REGISTRY_BASE_URL}/styles/default/${componentName}.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Component '${componentName}' not found: ${response.status}`);
  }

  return response.json();
}

/**
 * Parse item name from registry format (e.g., '@shadcn/button' -> 'button')
 */
function parseItemName(item: string): string {
  // Remove registry prefix if present
  const parts = item.split('/');
  return parts.length > 1 ? parts[parts.length - 1] : item;
}

/**
 * View items in registries
 *
 * @param input - Items to view
 * @returns Promise resolving to item details
 */
export async function viewItems(
  input: ViewItemsInput
): Promise<MCPToolResult<ViewItemsOutput>> {
  const startTime = Date.now();
  const validated = inputSchema.parse(input);

  try {
    const results: ViewItemResult[] = [];
    const errors: string[] = [];

    // Fetch each component
    for (const item of validated.items) {
      const componentName = parseItemName(item);
      try {
        const details = await fetchComponentDetails(componentName);
        results.push({
          name: details.name,
          type: details.type,
          description: details.author || `shadcn/ui ${details.type}`,
          registry: '@shadcn',
          files: details.files.map((f) => ({
            path: f.path,
            content: f.content,
            type: f.type as 'registry:ui' | 'registry:component' | 'registry:example' | 'registry:block' | 'registry:hook' | 'registry:lib',
            target: f.target,
          })),
          dependencies: details.dependencies,
          devDependencies: details.devDependencies,
          registryDependencies: details.registryDependencies,
        });
      } catch (error) {
        errors.push(`${componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Return partial results if some succeeded
    if (results.length > 0) {
      return {
        success: true,
        data: results,
        metadata: {
          tool: TOOL,
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
          timestamp: new Date().toISOString(),
          ...(errors.length > 0 && { warnings: errors }),
        },
      };
    }

    // All failed
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch any components',
        details: { errors },
      },
      metadata: {
        tool: TOOL,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        tool: TOOL,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Convenience: View a single component
 */
export async function viewComponent(
  componentName: string
): Promise<MCPToolResult<ViewItemsOutput>> {
  return viewItems({ items: [`@shadcn/${componentName}`] });
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: `${REGISTRY_BASE_URL}/styles/default/{component}.json`,
  description:
    'View component details including source code from the shadcn/ui registry.',
  inputSchema,
  tags: ['view', 'details', 'components', 'files', 'shadcn', 'code', 'api'],
  examples: [
    {
      description: 'View button component',
      input: { items: ['@shadcn/button'] },
      expectedOutput:
        '[{ name: "button", type: "registry:ui", files: [...], dependencies: [...] }]',
    },
    {
      description: 'View multiple components',
      input: { items: ['@shadcn/button', '@shadcn/card', '@shadcn/dialog'] },
      expectedOutput: '[...]',
    },
  ],
};
