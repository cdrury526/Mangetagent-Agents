/**
 * MCP Unified Server - API Routes
 *
 * Defines all REST API routes for MCP tool discovery and execution.
 *
 * Route Structure:
 *   GET  /mcp/servers                           → List all servers
 *   GET  /mcp/servers/:server                   → Get server manifest
 *   GET  /mcp/servers/:server/tools             → List tools for server
 *   GET  /mcp/servers/:server/tools/:tool       → Get tool definition
 *   GET  /mcp/tools/search?q=query              → Search tools
 *   GET  /mcp/stats                             → Get registry stats
 *   POST /mcp/servers/:server/tools/:tool/run   → Execute a tool
 *   GET  /mcp/history                           → Get execution history
 *   POST /mcp/reload                            → Manually reload registry
 */

import type { FastifyInstance } from 'fastify';
import {
  listServersHandler,
  getServerHandler,
  listToolsHandler,
  getToolHandler,
  searchToolsHandler,
  getStatsHandler,
  runToolHandler,
  getHistoryHandler,
  reloadRegistryHandler,
} from './handlers.js';

/**
 * Register all API routes with Fastify
 */
export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Server discovery routes
  fastify.get('/mcp/servers', listServersHandler);
  fastify.get('/mcp/servers/:server', getServerHandler);

  // Tool discovery routes
  fastify.get('/mcp/servers/:server/tools', listToolsHandler);
  fastify.get('/mcp/servers/:server/tools/:tool', getToolHandler);
  fastify.get('/mcp/tools/search', searchToolsHandler);

  // Registry metadata routes
  fastify.get('/mcp/stats', getStatsHandler);

  // Tool execution routes
  fastify.post('/mcp/servers/:server/tools/:tool/run', runToolHandler);

  // History route
  fastify.get('/mcp/history', getHistoryHandler);

  // Reload route
  fastify.post('/mcp/reload', reloadRegistryHandler);
}
