/**
 * Single-instance protection for MCP Server
 *
 * Ensures only one server instance runs at a time using a lock file.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';
import { log } from './logger.js';

// Lock file path (in project root)
const LOCK_FILE = path.resolve(process.cwd(), '.mcp-server.lock');

interface LockData {
  pid: number;
  port: number;
  startTime: string;
}

/**
 * Check if a TCP port is in use
 */
function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

/**
 * Check if a process is running by PID
 */
function isProcessRunning(pid: number): boolean {
  try {
    // Sending signal 0 checks if process exists without killing it
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if server is already running
 */
export async function isServerRunning(port: number): Promise<boolean> {
  // Check if lock file exists
  if (!fs.existsSync(LOCK_FILE)) {
    return false;
  }

  try {
    const lockContent = fs.readFileSync(LOCK_FILE, 'utf-8');
    const lockData: LockData = JSON.parse(lockContent);

    // Check if process is still running
    if (isProcessRunning(lockData.pid)) {
      log.warn('Lock file exists and process is running', {
        pid: lockData.pid,
        port: lockData.port,
        startTime: lockData.startTime,
      });
      return true;
    }

    // Stale lock file - process died without cleanup
    log.warn('Stale lock file found - cleaning up', { pid: lockData.pid });
    fs.unlinkSync(LOCK_FILE);
    return false;
  } catch (error) {
    // Invalid lock file - remove it
    log.error('Invalid lock file - removing', error as Error);
    try {
      fs.unlinkSync(LOCK_FILE);
    } catch {
      // Ignore errors during cleanup
    }
    return false;
  }
}

/**
 * Acquire server lock
 */
export async function acquireLock(port: number): Promise<void> {
  // Check if port is already in use
  const portInUse = await isPortInUse(port);
  if (portInUse) {
    throw new Error(
      `Port ${port} is already in use. Is another MCP server instance running?`
    );
  }

  // Check if lock file exists
  const serverRunning = await isServerRunning(port);
  if (serverRunning) {
    throw new Error(
      `MCP server is already running. Check lock file at: ${LOCK_FILE}`
    );
  }

  // Create lock file
  const lockData: LockData = {
    pid: process.pid,
    port,
    startTime: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData, null, 2), 'utf-8');
    log.info('Server lock acquired', { pid: process.pid, port, lockFile: LOCK_FILE });
  } catch (error) {
    throw new Error(`Failed to create lock file: ${(error as Error).message}`);
  }
}

/**
 * Release server lock
 */
export function releaseLock(): void {
  if (!fs.existsSync(LOCK_FILE)) {
    return;
  }

  try {
    fs.unlinkSync(LOCK_FILE);
    log.info('Server lock released', { lockFile: LOCK_FILE });
  } catch (error) {
    log.error('Failed to remove lock file', error as Error);
  }
}

/**
 * Setup cleanup handlers for graceful shutdown
 */
export function setupCleanupHandlers(): void {
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    log.info('Received SIGINT - cleaning up...');
    releaseLock();
    process.exit(0);
  });

  // Handle termination signal
  process.on('SIGTERM', () => {
    log.info('Received SIGTERM - cleaning up...');
    releaseLock();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    log.error('Uncaught exception - cleaning up', error);
    releaseLock();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    log.error('Unhandled promise rejection - cleaning up', {
      reason: String(reason),
    });
    releaseLock();
    process.exit(1);
  });
}
