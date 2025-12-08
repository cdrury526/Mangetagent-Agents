/**
 * Tool Discovery Utilities
 *
 * Enables Claude Code to navigate and discover available MCP tools
 * through filesystem exploration and registry search.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  MCPRegistry,
  MCPServerManifest,
  MCPToolDefinition,
} from '../types/index.js';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REGISTRY_PATH = join(__dirname, '..', 'registry.json');

// Registry cache for performance
let cachedRegistry: MCPRegistry | null = null;

/**
 * Clear the cached registry (for hot reload)
 */
export function clearRegistryCache(): void {
  cachedRegistry = null;
}

/**
 * Load the tool registry from disk
 *
 * @param useCache - Whether to use cached registry (default: true)
 * @returns The MCP registry or null if not found
 */
export function loadRegistry(useCache: boolean = true): MCPRegistry | null {
  // Return cached version if available and cache is enabled
  if (useCache && cachedRegistry) {
    return cachedRegistry;
  }

  if (!existsSync(REGISTRY_PATH)) {
    console.warn('Registry not found. Run `npm run generate-registry` first.');
    return null;
  }

  try {
    const content = readFileSync(REGISTRY_PATH, 'utf-8');
    const registry = JSON.parse(content) as MCPRegistry;

    // Update cache
    cachedRegistry = registry;

    return registry;
  } catch (error) {
    console.error('Failed to load registry:', error);
    return null;
  }
}

/**
 * List all available MCP servers
 *
 * @returns Array of server names
 */
export function listServers(): string[] {
  const registry = loadRegistry();
  if (!registry) return [];
  return Object.keys(registry.servers);
}

/**
 * Get a server manifest by name
 *
 * @param serverName - The server name
 * @returns Server manifest or null if not found
 */
export function getServerManifest(serverName: string): MCPServerManifest | null {
  const registry = loadRegistry();
  if (!registry) return null;
  return registry.servers[serverName] || null;
}

/**
 * List all tools for a server
 *
 * @param serverName - The server name
 * @returns Array of tool definitions or empty array
 */
export function listTools(serverName: string): MCPToolDefinition[] {
  const manifest = getServerManifest(serverName);
  if (!manifest) return [];
  return manifest.tools;
}

/**
 * Get a specific tool definition
 *
 * @param serverName - The server name
 * @param toolName - The tool name
 * @returns Tool definition or null if not found
 */
export function getToolDefinition(
  serverName: string,
  toolName: string
): MCPToolDefinition | null {
  const tools = listTools(serverName);
  return tools.find((t) => t.name === toolName) || null;
}

/**
 * Search for tools matching a query
 *
 * @param query - Search query string
 * @param options - Search options
 * @returns Array of matching tools with server info
 */
export function searchTools(
  query: string,
  options: { serverFilter?: string; tagFilter?: string[] } = {}
): Array<{ server: string; tool: MCPToolDefinition }> {
  const registry = loadRegistry();
  if (!registry) return [];

  const queryLower = query.toLowerCase();
  const results: Array<{ server: string; tool: MCPToolDefinition }> = [];

  for (const [serverName, manifest] of Object.entries(registry.servers)) {
    // Apply server filter if specified
    if (options.serverFilter && serverName !== options.serverFilter) continue;

    for (const tool of manifest.tools) {
      // Check name match
      const nameMatch = tool.name.toLowerCase().includes(queryLower);

      // Check description match
      const descMatch = tool.description.toLowerCase().includes(queryLower);

      // Check tag match
      const tagMatch = tool.tags.some((tag) =>
        tag.toLowerCase().includes(queryLower)
      );

      // Check MCP name match
      const mcpNameMatch = tool.mcpName.toLowerCase().includes(queryLower);

      // Apply tag filter if specified
      const tagFilterMatch =
        !options.tagFilter ||
        options.tagFilter.some((filter) =>
          tool.tags.some((tag) =>
            tag.toLowerCase().includes(filter.toLowerCase())
          )
        );

      if ((nameMatch || descMatch || tagMatch || mcpNameMatch) && tagFilterMatch) {
        results.push({ server: serverName, tool });
      }
    }
  }

  return results;
}

/**
 * Get all tools grouped by tag
 *
 * @returns Map of tag to tools
 */
export function getToolsByTag(): Map<string, Array<{ server: string; tool: MCPToolDefinition }>> {
  const registry = loadRegistry();
  if (!registry) return new Map();

  const tagMap = new Map<string, Array<{ server: string; tool: MCPToolDefinition }>>();

  for (const [serverName, manifest] of Object.entries(registry.servers)) {
    for (const tool of manifest.tools) {
      for (const tag of tool.tags) {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag)!.push({ server: serverName, tool });
      }
    }
  }

  return tagMap;
}

/**
 * Get registry statistics
 *
 * @returns Statistics about the registry
 */
export function getRegistryStats(): {
  totalServers: number;
  totalTools: number;
  toolsByServer: Record<string, number>;
  lastUpdated: string | null;
} {
  const registry = loadRegistry();
  if (!registry) {
    return {
      totalServers: 0,
      totalTools: 0,
      toolsByServer: {},
      lastUpdated: null,
    };
  }

  const toolsByServer: Record<string, number> = {};
  let totalTools = 0;

  for (const [serverName, manifest] of Object.entries(registry.servers)) {
    toolsByServer[serverName] = manifest.tools.length;
    totalTools += manifest.tools.length;
  }

  return {
    totalServers: Object.keys(registry.servers).length,
    totalTools,
    toolsByServer,
    lastUpdated: registry.lastUpdated,
  };
}

/**
 * Format tool information for display
 *
 * @param server - Server name
 * @param tool - Tool definition
 * @returns Formatted string
 */
export function formatToolInfo(server: string, tool: MCPToolDefinition): string {
  const lines = [
    `${server}/${tool.name}`,
    `  MCP: ${tool.mcpName}`,
    `  Description: ${tool.description}`,
    `  Tags: ${tool.tags.join(', ')}`,
  ];

  if (tool.cliCommand) {
    lines.push(`  CLI: ${tool.cliCommand}`);
  }

  if (tool.apiEndpoint) {
    lines.push(`  API: ${tool.apiEndpoint}`);
  }

  if (tool.examples?.length) {
    lines.push(`  Examples: ${tool.examples.length} available`);
  }

  return lines.join('\n');
}

/**
 * Format server information for display
 *
 * @param manifest - Server manifest
 * @returns Formatted string
 */
export function formatServerInfo(manifest: MCPServerManifest): string {
  const lines = [
    `${manifest.name} (v${manifest.version})`,
    `  ${manifest.description}`,
    `  Tools: ${manifest.tools.length}`,
  ];

  if (manifest.cliPrefix) {
    lines.push(`  CLI Prefix: ${manifest.cliPrefix}`);
  }

  if (manifest.documentation) {
    lines.push(`  Docs: ${manifest.documentation}`);
  }

  return lines.join('\n');
}
