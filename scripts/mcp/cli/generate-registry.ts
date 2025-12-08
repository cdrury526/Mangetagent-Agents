#!/usr/bin/env npx tsx

/**
 * Registry Generator
 *
 * Scans all server modules and generates the central registry.json file.
 * Run this after adding new tools or servers.
 *
 * Usage:
 *   npx tsx scripts/mcp/cli/generate-registry.ts
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MCPRegistry } from '../types/index.js';
import { manifests } from '../servers/index.js';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REGISTRY_PATH = join(__dirname, '..', 'registry.json');

/**
 * Generate the registry from all server manifests
 */
async function generateRegistry(): Promise<void> {
  console.log('Generating MCP Bridge Registry...\n');

  const registry: MCPRegistry = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    servers: {},
  };

  let totalTools = 0;

  // Process each server manifest
  for (const [serverName, manifest] of Object.entries(manifests)) {
    console.log(`Processing server: ${serverName}`);
    console.log(`  Description: ${manifest.description}`);
    console.log(`  Tools: ${manifest.tools.length}`);

    // Convert Zod schemas to JSON-serializable format
    const tools = manifest.tools.map((tool) => ({
      name: tool.name,
      mcpName: tool.mcpName,
      cliCommand: tool.cliCommand,
      apiEndpoint: tool.apiEndpoint,
      description: tool.description,
      tags: tool.tags,
      examples: tool.examples,
      // Note: inputSchema is a Zod schema, we'll store a simplified version
      inputSchemaDescription: tool.inputSchema.description || 'See tool file for details',
    }));

    registry.servers[serverName] = {
      name: manifest.name,
      description: manifest.description,
      version: manifest.version,
      cliPrefix: manifest.cliPrefix,
      apiBaseUrl: manifest.apiBaseUrl,
      tools: tools as any,
      documentation: manifest.documentation,
    };

    totalTools += manifest.tools.length;

    // List tools
    for (const tool of manifest.tools) {
      console.log(`    - ${tool.name}: ${tool.description.slice(0, 50)}...`);
    }

    console.log('');
  }

  // Ensure directory exists
  const registryDir = dirname(REGISTRY_PATH);
  if (!existsSync(registryDir)) {
    mkdirSync(registryDir, { recursive: true });
  }

  // Write registry
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));

  console.log('='.repeat(50));
  console.log(`Registry generated successfully!`);
  console.log(`  Path: ${REGISTRY_PATH}`);
  console.log(`  Servers: ${Object.keys(registry.servers).length}`);
  console.log(`  Total Tools: ${totalTools}`);
  console.log(`  Last Updated: ${registry.lastUpdated}`);
}

// Run the generator
generateRegistry().catch((error) => {
  console.error('Failed to generate registry:', error);
  process.exit(1);
});
