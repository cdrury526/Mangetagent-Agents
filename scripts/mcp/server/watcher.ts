/**
 * File Watcher for Hot Reload
 *
 * Watches registry.json and tool files for changes, enabling hot reload
 * without server restart when new tools are added or the registry is regenerated.
 */

import chokidar from 'chokidar';
import { resolve } from 'path';
import { log } from './logger.js';

// Paths to watch
const REGISTRY_PATH = resolve(process.cwd(), 'scripts/mcp/registry.json');
const SERVERS_PATH = resolve(process.cwd(), 'scripts/mcp/servers');

// Registry cache
let registryCache: any = null;
let reloadTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 500;

/**
 * Reload registry from disk (cache-busted)
 */
export async function reloadRegistry(): Promise<void> {
  try {
    // Import discovery module
    const discoveryModule = await import('../core/discovery.js');

    // Clear the existing cache in discovery module
    if (discoveryModule.clearRegistryCache) {
      discoveryModule.clearRegistryCache();
    }

    // Load fresh registry (with useCache=false to force re-read from disk)
    registryCache = discoveryModule.loadRegistry(false);

    if (registryCache) {
      const toolCount = Object.values(registryCache.servers)
        .reduce((sum: number, server: any) => sum + server.tools.length, 0);

      log.info('Registry reloaded successfully', {
        servers: Object.keys(registryCache.servers).length,
        tools: toolCount,
        timestamp: registryCache.lastUpdated,
      });
    }
  } catch (error) {
    log.error('Failed to reload registry', error as Error);
  }
}

/**
 * Get current registry (from cache or load fresh)
 */
export function getRegistry(): any {
  return registryCache;
}

/**
 * Schedule a debounced registry reload
 */
function scheduleReload(): void {
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
  }

  reloadTimeout = setTimeout(() => {
    reloadRegistry();
    reloadTimeout = null;
  }, DEBOUNCE_MS);
}

/**
 * Invalidate module cache for a tool file
 *
 * This clears Node's module cache so the next execution uses fresh code.
 */
export function invalidateToolModule(filePath: string): void {
  try {
    // Clear from require.cache
    if (require.cache[filePath]) {
      delete require.cache[filePath];
      log.debug(`Invalidated module cache: ${filePath}`);
    }

    // Also clear parent directory index.js if it exists
    const indexPath = filePath.replace(/\/[^/]+\.ts$/, '/index.js');
    if (require.cache[indexPath]) {
      delete require.cache[indexPath];
      log.debug(`Invalidated index cache: ${indexPath}`);
    }
  } catch (error) {
    log.warn(`Failed to invalidate module cache for ${filePath}`, {
      error: (error as Error).message,
    });
  }
}

/**
 * Start the file watcher for hot reload
 */
export function startWatcher(): void {
  log.info('Starting file watcher for hot reload...', {
    registry: REGISTRY_PATH,
    servers: SERVERS_PATH,
  });

  // Initial load of registry
  reloadRegistry();

  // Watch registry.json
  const registryWatcher = chokidar.watch(REGISTRY_PATH, {
    persistent: true,
    ignoreInitial: true, // Don't trigger on startup
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  registryWatcher.on('change', (path) => {
    log.info('Registry file changed, scheduling reload...', { path });
    scheduleReload();
  });

  registryWatcher.on('error', (error) => {
    log.error('Registry watcher error', error);
  });

  // Watch tool files in servers/**/*.ts
  const serversWatcher = chokidar.watch(`${SERVERS_PATH}/**/*.ts`, {
    persistent: true,
    ignoreInitial: true,
    ignored: ['**/node_modules/**', '**/*.test.ts', '**/*.spec.ts'],
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  serversWatcher.on('change', (path) => {
    log.debug('Tool file changed', { path });
    invalidateToolModule(path);
  });

  serversWatcher.on('add', (path) => {
    log.info('New tool file added', { path });
    // New file added - might need to regenerate registry
    log.warn('New tool detected. Run `npm run mcp:registry` to update the registry.');
  });

  serversWatcher.on('unlink', (path) => {
    log.warn('Tool file deleted', { path });
    invalidateToolModule(path);
    log.warn('Tool deleted. Run `npm run mcp:registry` to update the registry.');
  });

  serversWatcher.on('error', (error) => {
    log.error('Servers watcher error', error);
  });

  log.info('File watcher started successfully');
}

/**
 * Stop all watchers (for graceful shutdown)
 */
export async function stopWatcher(): Promise<void> {
  log.info('Stopping file watcher...');
  // chokidar watchers will be garbage collected
  // or explicitly call .close() if we store references
}
