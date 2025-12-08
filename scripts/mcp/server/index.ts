#!/usr/bin/env npx tsx

/**
 * MCP Unified Server
 *
 * HTTP server that exposes all MCP tools via REST API with WebUI for monitoring.
 *
 * Features:
 * - REST API for all 34 MCP tools
 * - WebUI for monitoring and debugging
 * - Hot reload when new tools are added
 * - Single instance protection
 * - Graceful shutdown
 *
 * Usage:
 *   npm run mcp:server
 *
 * Environment Variables:
 *   MCP_SERVER_PORT    Port to listen on (default: 3456)
 *   NODE_ENV           Set to 'production' for production mode
 *   LOG_LEVEL          Log level (debug, info, warn, error)
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from './logger.js';
import { acquireLock, releaseLock, setupCleanupHandlers } from './lock.js';
import { registerRoutes } from './routes.js';
import { getRegistryStats } from '../core/discovery.js';
import { startWatcher } from './watcher.js';

// Server configuration
const PORT = parseInt(process.env.MCP_SERVER_PORT || '3456', 10);
const HOST = '0.0.0.0'; // Listen on all interfaces
const VERSION = '1.0.0';

/**
 * Main server initialization
 */
async function main(): Promise<void> {
  log.info('Starting MCP Unified Server...', { version: VERSION, port: PORT });

  // Acquire lock to prevent multiple instances
  try {
    await acquireLock(PORT);
  } catch (error) {
    log.error('Failed to acquire server lock', error as Error);
    process.exit(1);
  }

  // Setup cleanup handlers for graceful shutdown
  setupCleanupHandlers();

  // Start file watcher for hot reload
  startWatcher();

  // Initialize Fastify
  const fastify = Fastify({
    logger: false, // Use our custom logger instead
    requestIdLogLabel: 'reqId',
    disableRequestLogging: true, // We'll handle logging manually
  });

  // Register CORS (allow all origins for development)
  await fastify.register(cors, {
    origin: true, // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Register static file serving for WebUI
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const webuiPath = path.join(__dirname, 'webui');

  log.info(`Serving WebUI from: ${webuiPath}`);

  await fastify.register(fastifyStatic, {
    root: webuiPath,
    prefix: '/ui/',
  });

  // Redirect /ui to /ui/
  fastify.get('/ui', async (request, reply) => {
    return reply.redirect('/ui/');
  });

  // Request logging middleware
  fastify.addHook('onRequest', async (request) => {
    log.debug(`→ ${request.method} ${request.url}`, {
      method: request.method,
      url: request.url,
      ip: request.ip,
    });
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = reply.elapsedTime;
    log.info(`← ${request.method} ${request.url} - ${reply.statusCode}`, {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: Math.round(responseTime),
    });
  });

  // Health check endpoint
  fastify.get('/mcp/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      version: VERSION,
      timestamp: new Date().toISOString(),
    };
  });

  // Root endpoint - API info
  fastify.get('/', async () => {
    const stats = getRegistryStats();
    return {
      name: 'MCP Unified Server',
      version: VERSION,
      stats: {
        servers: stats.totalServers,
        tools: stats.totalTools,
      },
      endpoints: {
        ui: '/ui',
        health: '/mcp/health',
        servers: '/mcp/servers',
        search: '/mcp/tools/search?q=query',
        stats: '/mcp/stats',
        history: '/mcp/history',
      },
    };
  });

  // Register API routes
  await registerRoutes(fastify);

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    log.error(`Error handling ${request.method} ${request.url}`, error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  });

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    log.info(`MCP Server running at http://localhost:${PORT}`, {
      port: PORT,
      host: HOST,
      pid: process.pid,
    });
    log.info(`WebUI Dashboard: http://localhost:${PORT}/ui`);
    log.info('Press Ctrl+C to stop');
  } catch (error) {
    log.error('Failed to start server', error as Error);
    releaseLock();
    process.exit(1);
  }

  // Graceful shutdown handler
  const closeGracefully = async (signal: string) => {
    log.info(`Received ${signal} - shutting down gracefully...`);
    try {
      await fastify.close();
      log.info('Server closed');
      releaseLock();
      process.exit(0);
    } catch (error) {
      log.error('Error during shutdown', error as Error);
      releaseLock();
      process.exit(1);
    }
  };

  // Override default handlers to use fastify.close()
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');
  process.on('SIGINT', () => closeGracefully('SIGINT'));
  process.on('SIGTERM', () => closeGracefully('SIGTERM'));
}

// Run server
main().catch((error) => {
  log.error('Fatal error', error as Error);
  releaseLock();
  process.exit(1);
});
