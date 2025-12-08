/**
 * shadcn: Get Examples
 *
 * Find usage examples and demos from the shadcn/ui registry.
 * Examples are blocks and demos that show how to use components.
 *
 * @example
 * await getExamples({ registries: ['@shadcn'], query: 'button' })
 *
 * @example
 * await getExamples({ registries: ['@shadcn'], query: 'form' })
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { GetExamplesInput, GetExamplesOutput, ExampleResult } from '../../types/shadcn.types.js';

const SERVER = 'shadcn';
const TOOL = 'get-examples';
const MCP_NAME = 'mcp__shadcn__get_item_examples_from_registries';

// shadcn registry API base URL
const REGISTRY_BASE_URL = 'https://ui.shadcn.com/r';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  registries: z.array(z.string()).min(1, 'At least one registry is required'),
  query: z.string().min(1, 'Search query is required'),
});

/**
 * Fetch the registry index
 */
async function fetchRegistryIndex(): Promise<Array<{
  name: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: Array<{ path: string; type: string }>;
}>> {
  const response = await fetch(`${REGISTRY_BASE_URL}/index.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch example/block details
 */
async function fetchExampleDetails(name: string): Promise<{
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: Array<{ path: string; content: string; type: string }>;
} | null> {
  // Try blocks first, then examples
  const urls = [
    `${REGISTRY_BASE_URL}/styles/default/${name}.json`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Continue to next URL
    }
  }

  return null;
}

/**
 * Get usage examples for components
 *
 * @param input - Search parameters
 * @returns Promise resolving to example results
 */
export async function getExamples(
  input: GetExamplesInput
): Promise<MCPToolResult<GetExamplesOutput>> {
  const startTime = Date.now();
  const validated = inputSchema.parse(input);

  try {
    // Fetch the registry index
    const registry = await fetchRegistryIndex();
    const queryLower = validated.query.toLowerCase();

    // Filter for examples/blocks/demos matching the query
    const exampleTypes = ['registry:example', 'registry:block'];
    const matchingItems = registry.filter((item) => {
      const nameLower = item.name.toLowerCase();
      const isExample = exampleTypes.includes(item.type) ||
        nameLower.includes('demo') ||
        nameLower.includes('example');
      const matchesQuery = nameLower.includes(queryLower);
      return isExample && matchesQuery;
    });

    // Also include the main component if it exists (for reference)
    const mainComponent = registry.find((item) =>
      item.name.toLowerCase() === queryLower && item.type === 'registry:ui'
    );

    // Fetch details for matching examples
    const results: ExampleResult[] = [];

    for (const item of matchingItems.slice(0, 5)) {
      const details = await fetchExampleDetails(item.name);
      if (details) {
        results.push({
          name: details.name,
          description: details.description || `${item.type} for ${validated.query}`,
          registry: '@shadcn',
          files: details.files.map((f) => ({
            path: f.path,
            content: f.content,
            type: f.type as 'registry:ui' | 'registry:component' | 'registry:example' | 'registry:block' | 'registry:hook' | 'registry:lib',
          })),
          dependencies: details.dependencies,
        });
      }
    }

    // If no examples found but main component exists, return its code as reference
    if (results.length === 0 && mainComponent) {
      const details = await fetchExampleDetails(mainComponent.name);
      if (details) {
        results.push({
          name: details.name,
          description: `Main ${details.name} component (no specific examples found)`,
          registry: '@shadcn',
          files: details.files.map((f) => ({
            path: f.path,
            content: f.content,
            type: f.type as 'registry:ui' | 'registry:component' | 'registry:example' | 'registry:block' | 'registry:hook' | 'registry:lib',
          })),
          dependencies: details.dependencies,
        });
      }
    }

    return {
      success: true,
      data: results,
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
        details: { url: `${REGISTRY_BASE_URL}/index.json` },
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
 * Convenience: Get examples for a specific component
 */
export async function getComponentExamples(
  componentName: string
): Promise<MCPToolResult<GetExamplesOutput>> {
  return getExamples({
    registries: ['@shadcn'],
    query: componentName,
  });
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  apiEndpoint: `${REGISTRY_BASE_URL}/index.json`,
  description:
    'Find usage examples and demos with complete code from the shadcn/ui registry.',
  inputSchema,
  tags: ['examples', 'demo', 'usage', 'code', 'shadcn', 'api'],
  examples: [
    {
      description: 'Get button examples',
      input: { registries: ['@shadcn'], query: 'button' },
      expectedOutput: '[{ name: "button-demo", files: [{ content: "..." }] }]',
    },
    {
      description: 'Get form examples',
      input: { registries: ['@shadcn'], query: 'form' },
      expectedOutput: '[{ name: "form-demo", ... }]',
    },
  ],
};
