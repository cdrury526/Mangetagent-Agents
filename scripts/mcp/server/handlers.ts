/**
 * MCP Unified Server - Request Handlers
 *
 * Handles all API requests for tool discovery and execution.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import {
  listServers,
  getServerManifest,
  listTools,
  getToolDefinition,
  searchTools,
  getRegistryStats,
  clearRegistryCache,
} from '../core/discovery.js';
import { kebabToCamel, type MCPToolResult } from '../types/index.js';
import { log } from './logger.js';
import { reloadRegistry } from './watcher.js';

// =============================================================================
// Execution History Tracking
// =============================================================================

interface ExecutionRecord {
  id: string;
  timestamp: string;
  server: string;
  tool: string;
  input: unknown;
  result: MCPToolResult<unknown>;
  durationMs: number;
}

const MAX_HISTORY = 100;
const executionHistory: ExecutionRecord[] = [];

/**
 * Add an execution to the history
 */
function addToHistory(record: ExecutionRecord): void {
  executionHistory.unshift(record); // Add to beginning
  if (executionHistory.length > MAX_HISTORY) {
    executionHistory.pop(); // Remove oldest
  }
}

/**
 * Get execution history
 */
export function getHistory(): ExecutionRecord[] {
  return executionHistory;
}

/**
 * Clear execution history (useful for testing)
 */
export function clearHistory(): void {
  executionHistory.length = 0;
}

// =============================================================================
// Response Helpers
// =============================================================================

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Send a success response
 */
function sendSuccess<T>(reply: FastifyReply, data: T): void {
  reply.send({
    success: true,
    data,
  } as SuccessResponse<T>);
}

/**
 * Send an error response
 */
function sendError(
  reply: FastifyReply,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: unknown
): void {
  reply.status(statusCode).send({
    success: false,
    error: {
      code,
      message,
      details,
    },
  } as ErrorResponse);
}

// =============================================================================
// Server Discovery Handlers
// =============================================================================

/**
 * GET /mcp/servers
 *
 * List all available MCP servers
 */
export async function listServersHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const servers = listServers();
    sendSuccess(reply, { servers });
  } catch (error) {
    log.error('Error listing servers', error as Error);
    sendError(reply, 'INTERNAL_ERROR', 'Failed to list servers', 500, error);
  }
}

/**
 * GET /mcp/servers/:server
 *
 * Get server manifest
 */
export async function getServerHandler(
  request: FastifyRequest<{ Params: { server: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { server } = request.params;
    const manifest = getServerManifest(server);

    if (!manifest) {
      sendError(
        reply,
        'NOT_FOUND',
        `Server '${server}' not found`,
        404,
        { availableServers: listServers() }
      );
      return;
    }

    sendSuccess(reply, manifest);
  } catch (error) {
    log.error('Error getting server manifest', error as Error);
    sendError(reply, 'INTERNAL_ERROR', 'Failed to get server manifest', 500, error);
  }
}

// =============================================================================
// Tool Discovery Handlers
// =============================================================================

/**
 * GET /mcp/servers/:server/tools
 *
 * List all tools for a server
 */
export async function listToolsHandler(
  request: FastifyRequest<{ Params: { server: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { server } = request.params;
    const tools = listTools(server);

    if (tools.length === 0) {
      // Check if server exists
      const manifest = getServerManifest(server);
      if (!manifest) {
        sendError(
          reply,
          'NOT_FOUND',
          `Server '${server}' not found`,
          404,
          { availableServers: listServers() }
        );
        return;
      }
    }

    sendSuccess(reply, { server, tools });
  } catch (error) {
    log.error('Error listing tools', error as Error);
    sendError(reply, 'INTERNAL_ERROR', 'Failed to list tools', 500, error);
  }
}

/**
 * GET /mcp/servers/:server/tools/:tool
 *
 * Get a specific tool definition
 */
export async function getToolHandler(
  request: FastifyRequest<{ Params: { server: string; tool: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { server, tool } = request.params;
    const toolDef = getToolDefinition(server, tool);

    if (!toolDef) {
      const availableTools = listTools(server);
      sendError(
        reply,
        'NOT_FOUND',
        `Tool '${tool}' not found in server '${server}'`,
        404,
        {
          server,
          availableTools: availableTools.map((t) => t.name),
        }
      );
      return;
    }

    sendSuccess(reply, toolDef);
  } catch (error) {
    log.error('Error getting tool definition', error as Error);
    sendError(reply, 'INTERNAL_ERROR', 'Failed to get tool definition', 500, error);
  }
}

/**
 * GET /mcp/tools/search?q=query
 *
 * Search for tools by query string
 */
export async function searchToolsHandler(
  request: FastifyRequest<{ Querystring: { q?: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { q: query } = request.query;

    if (!query || query.trim() === '') {
      sendError(reply, 'INVALID_QUERY', 'Search query is required', 400);
      return;
    }

    const results = searchTools(query.trim());

    sendSuccess(reply, {
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    log.error('Error searching tools', error as Error);
    sendError(reply, 'INTERNAL_ERROR', 'Failed to search tools', 500, error);
  }
}

// =============================================================================
// Registry Metadata Handler
// =============================================================================

/**
 * GET /mcp/stats
 *
 * Get registry statistics
 */
export async function getStatsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const stats = getRegistryStats();
    sendSuccess(reply, stats);
  } catch (error) {
    log.error('Error getting registry stats', error as Error);
    sendError(reply, 'INTERNAL_ERROR', 'Failed to get registry stats', 500, error);
  }
}

// =============================================================================
// Tool Execution Handler
// =============================================================================

/**
 * POST /mcp/servers/:server/tools/:tool/run
 *
 * Execute a tool with the provided input
 *
 * Request body: JSON object with tool-specific input parameters
 * Response: MCPToolResult<T> with success, data, and metadata
 */
export async function runToolHandler(
  request: FastifyRequest<{
    Params: { server: string; tool: string };
    Body: Record<string, unknown>;
  }>,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();
  const { server: serverName, tool: toolName } = request.params;
  const input = request.body || {};

  try {
    // Validate that server exists
    const manifest = getServerManifest(serverName);
    if (!manifest) {
      sendError(
        reply,
        'NOT_FOUND',
        `Server '${serverName}' not found`,
        404,
        { availableServers: listServers() }
      );
      return;
    }

    // Validate that tool exists
    const toolDef = getToolDefinition(serverName, toolName);
    if (!toolDef) {
      const availableTools = listTools(serverName);
      sendError(
        reply,
        'NOT_FOUND',
        `Tool '${toolName}' not found in server '${serverName}'`,
        404,
        {
          server: serverName,
          availableTools: availableTools.map((t) => t.name),
        }
      );
      return;
    }

    log.info(`Executing ${serverName}/${toolName}`, { input });

    // Dynamic import of the server module
    const serverModule = await import(`../servers/${serverName}/index.js`);

    // Convert tool name to function name (list-tables -> listTables)
    const fnName = kebabToCamel(toolName);
    const toolFn = serverModule[fnName];

    if (!toolFn || typeof toolFn !== 'function') {
      log.error(`Tool function not found: ${fnName}`, {
        server: serverName,
        tool: toolName,
        availableExports: Object.keys(serverModule),
      });
      sendError(
        reply,
        'FUNCTION_NOT_FOUND',
        `Tool function '${fnName}' not found in server module`,
        500,
        {
          expectedFunctionName: fnName,
          availableExports: Object.keys(serverModule),
        }
      );
      return;
    }

    // Execute the tool
    const result: MCPToolResult<unknown> = await toolFn(input);
    const durationMs = Date.now() - startTime;

    // Add to execution history
    addToHistory({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      server: serverName,
      tool: toolName,
      input,
      result,
      durationMs,
    });

    log.info(`Executed ${serverName}/${toolName}`, {
      success: result.success,
      durationMs,
    });

    // Return the tool result directly (it already has success/error/data structure)
    reply.send(result);
  } catch (error) {
    const durationMs = Date.now() - startTime;

    log.error(`Error executing ${serverName}/${toolName}`, error as Error, {
      durationMs,
      input,
    });

    // Add failed execution to history
    const errorResult: MCPToolResult<unknown> = {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: (error as Error).message || 'Unknown error',
        details: error,
      },
      metadata: {
        tool: toolName,
        server: serverName,
        executionTimeMs: durationMs,
        timestamp: new Date().toISOString(),
        executionType: 'api',
      },
    };

    addToHistory({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      server: serverName,
      tool: toolName,
      input,
      result: errorResult,
      durationMs,
    });

    sendError(
      reply,
      'EXECUTION_ERROR',
      'Failed to execute tool',
      500,
      {
        server: serverName,
        tool: toolName,
        error: (error as Error).message,
      }
    );
  }
}

// =============================================================================
// Execution History Handler
// =============================================================================

/**
 * GET /mcp/history
 *
 * Get execution history (last 100 executions)
 */
export async function getHistoryHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    sendSuccess(reply, {
      count: executionHistory.length,
      maxSize: MAX_HISTORY,
      history: executionHistory,
    });
  } catch (error) {
    log.error('Error getting execution history', error as Error);
    sendError(reply, 'INTERNAL_ERROR', 'Failed to get execution history', 500, error);
  }
}

// =============================================================================
// Registry Reload Handler
// =============================================================================

/**
 * POST /mcp/reload
 *
 * Manually trigger a registry reload
 */
export async function reloadRegistryHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    log.info('Manual reload triggered via API');

    // Clear the discovery module's cache
    clearRegistryCache();

    // Trigger reload from watcher
    await reloadRegistry();

    // Get updated stats (force re-read from disk)
    const stats = getRegistryStats();

    sendSuccess(reply, {
      message: 'Registry reloaded successfully',
      stats: {
        servers: stats.totalServers,
        tools: stats.totalTools,
        lastUpdated: stats.lastUpdated,
      },
    });
  } catch (error) {
    log.error('Error reloading registry', error as Error);
    sendError(reply, 'INTERNAL_ERROR', 'Failed to reload registry', 500, error);
  }
}
