/**
 * [SERVER_NAME] MCP Server Template
 *
 * Copy this file to servers/[server-name]/index.ts and customize.
 *
 * Steps to create a new server:
 * 1. Create directory: mkdir -p scripts/mcp/servers/[server-name]
 * 2. Copy this template: cp templates/server-template.ts servers/[server-name]/index.ts
 * 3. Create type definitions: cp templates/types-template.ts types/[server-name].types.ts
 * 4. Create tool files using tool-template.ts
 * 5. Update servers/index.ts to export the new server
 * 6. Run: npm run generate-registry
 */

import { MCPServerManifest } from '../../types/index.js';

// Import and re-export all tools
// export * from './tool-name.js';

// Import tool definitions for registry
// import { toolDefinition as toolNameDefinition } from './tool-name.js';

/**
 * Server manifest
 *
 * Customize this for your server:
 * - name: lowercase server name (e.g., 'github', 'stripe')
 * - description: brief description of what the server does
 * - version: semver version string
 * - cliPrefix: base CLI command (e.g., 'gh', 'stripe')
 * - apiBaseUrl: base URL for API calls (if applicable)
 * - tools: array of tool definitions
 * - documentation: path to docs
 */
export const manifest: MCPServerManifest = {
  name: 'server-name',
  description: 'Description of what this server does',
  version: '1.0.0',
  cliPrefix: 'cli-command', // e.g., 'gh', 'stripe', 'npx some-cli'
  // apiBaseUrl: 'https://api.example.com/v1', // Optional: for API-based tools
  tools: [
    // toolNameDefinition,
  ],
  documentation: 'Docs/ServerName/README.md',
};

/**
 * After creating your server:
 *
 * 1. Add export to servers/index.ts:
 *    export * as serverName from './server-name/index.js';
 *
 * 2. Add manifest to manifests object in servers/index.ts:
 *    import { manifest as serverNameManifest } from './server-name/index.js';
 *    export const manifests = {
 *      ...
 *      serverName: serverNameManifest,
 *    };
 *
 * 3. Run registry generator:
 *    npm run generate-registry
 */
