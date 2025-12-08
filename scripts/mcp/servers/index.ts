/**
 * MCP Servers Index
 *
 * Central export point for all MCP server modules.
 * Use this to access server manifests and tools.
 */

// Export all servers
export * as supabase from './supabase/index.js';
export * as shadcn from './shadcn/index.js';
export * as boldsign from './boldsign/index.js';
export * as stripe from './stripe/index.js';

// Import manifests for registry generation
import { manifest as supabaseManifest } from './supabase/index.js';
import { manifest as shadcnManifest } from './shadcn/index.js';
import { manifest as boldsignManifest } from './boldsign/index.js';
import { manifest as stripeManifest } from './stripe/index.js';

/**
 * All server manifests
 */
export const manifests = {
  supabase: supabaseManifest,
  shadcn: shadcnManifest,
  boldsign: boldsignManifest,
  stripe: stripeManifest,
};

/**
 * List of available server names
 */
export const serverNames = Object.keys(manifests);

/**
 * Get a server manifest by name
 */
export function getManifest(serverName: string) {
  return manifests[serverName as keyof typeof manifests] || null;
}
