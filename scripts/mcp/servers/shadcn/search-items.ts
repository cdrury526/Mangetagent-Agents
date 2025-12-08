/**
 * shadcn: Search Items
 *
 * Search for components in the shadcn/ui registry using the HTTP API.
 * After finding an item, use view-items to see component code.
 *
 * @example
 * await searchItems({ registries: ['@shadcn'], query: 'button' })
 *
 * @example
 * await searchItems({ registries: ['@shadcn'], query: 'form input', limit: 5 })
 */

import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { SearchItemsInput, SearchItemsOutput } from '../../types/shadcn.types.js';

const SERVER = 'shadcn';
const TOOL = 'search-items';
const MCP_NAME = 'mcp__shadcn__search_items_in_registries';

// shadcn registry API base URL
const REGISTRY_BASE_URL = 'https://ui.shadcn.com/r';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  registries: z.array(z.string()).min(1, 'At least one registry is required'),
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

/**
 * Fetch the shadcn registry index
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
 * Search for components in registries
 *
 * @param input - Search parameters
 * @returns Promise resolving to matching items
 */
export async function searchItems(
  input: SearchItemsInput
): Promise<MCPToolResult<SearchItemsOutput>> {
  const startTime = Date.now();
  const validated = inputSchema.parse(input);

  try {
    // Fetch the registry index
    const registry = await fetchRegistryIndex();

    // Filter by search query
    const queryLower = validated.query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);

    let results = registry
      .filter((item) => {
        const nameLower = item.name.toLowerCase();
        const typeLower = item.type.toLowerCase();
        // Match if any query term matches name or type
        return queryTerms.some(
          (term) => nameLower.includes(term) || typeLower.includes(term)
        );
      })
      .map((item) => {
        // Calculate a simple relevance score
        const nameLower = item.name.toLowerCase();
        let score = 0;
        queryTerms.forEach((term) => {
          if (nameLower === term) score += 100; // Exact match
          else if (nameLower.startsWith(term)) score += 50; // Starts with
          else if (nameLower.includes(term)) score += 25; // Contains
        });
        return {
          name: item.name,
          type: item.type,
          description: `${item.type} component${item.dependencies?.length ? ` (deps: ${item.dependencies.join(', ')})` : ''}`,
          registry: '@shadcn',
          score,
        };
      })
      .sort((a, b) => b.score - a.score); // Sort by relevance

    // Apply pagination
    if (validated.offset) {
      results = results.slice(validated.offset);
    }
    if (validated.limit) {
      results = results.slice(0, validated.limit);
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
 * Convenience: Search in default registry
 */
export async function searchShadcnComponents(
  query: string,
  limit?: number
): Promise<MCPToolResult<SearchItemsOutput>> {
  return searchItems({
    registries: ['@shadcn'],
    query,
    limit,
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
    'Search for components in the shadcn/ui registry using fuzzy matching. Use view-items to see component code.',
  inputSchema,
  tags: ['search', 'components', 'ui', 'registry', 'shadcn', 'api'],
  examples: [
    {
      description: 'Search for button components',
      input: { registries: ['@shadcn'], query: 'button' },
      expectedOutput: '[{ name: "button", type: "registry:ui", ... }]',
    },
    {
      description: 'Search with limit',
      input: { registries: ['@shadcn'], query: 'form', limit: 5 },
      expectedOutput: '[{ name: "form", ... }, ...]',
    },
  ],
};
