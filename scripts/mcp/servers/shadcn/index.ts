/**
 * shadcn MCP Server
 *
 * Tools for interacting with shadcn/ui component registries:
 * - Searching components
 * - Viewing component details
 * - Getting usage examples
 * - Generating add commands
 */

import { MCPServerManifest } from '../../types/index.js';

// Re-export all tools
export * from './search-items.js';
export * from './view-items.js';
export * from './get-examples.js';
export * from './get-add-command.js';

// Import tool definitions for registry
import { toolDefinition as searchItemsDefinition } from './search-items.js';
import { toolDefinition as viewItemsDefinition } from './view-items.js';
import { toolDefinition as getExamplesDefinition } from './get-examples.js';
import { toolDefinition as getAddCommandDefinition } from './get-add-command.js';

/**
 * shadcn server manifest
 */
export const manifest: MCPServerManifest = {
  name: 'shadcn',
  description: 'shadcn/ui component registry - search, view, and install UI components',
  version: '1.0.0',
  cliPrefix: 'npx shadcn@latest',
  tools: [
    searchItemsDefinition,
    viewItemsDefinition,
    getExamplesDefinition,
    getAddCommandDefinition,
  ],
  documentation: 'https://ui.shadcn.com/docs',
};
