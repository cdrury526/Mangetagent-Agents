/**
 * CLI Command Executor
 *
 * Executes CLI commands with proper error handling, timeouts, and structured output.
 * This is the primary execution method for MCP tools that have CLI equivalents.
 */

import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import {
  MCPToolResult,
  CLIExecutorOptions,
  createSuccessResult,
  createErrorResult,
} from '../types/index.js';

const execAsync = promisify(exec);

/**
 * Default options for CLI execution
 */
const DEFAULT_OPTIONS: Required<CLIExecutorOptions> = {
  timeout: 30000,
  cwd: process.cwd(),
  env: {},
  parseJson: true,
};

/**
 * Execute a CLI command and return structured result
 *
 * @param command - The CLI command to execute
 * @param server - The server name (for metadata)
 * @param tool - The tool name (for metadata)
 * @param options - Execution options
 * @returns Promise resolving to structured result
 *
 * @example
 * const result = await executeCliCommand(
 *   'npx supabase db dump --schema public',
 *   'supabase',
 *   'list-tables'
 * );
 */
export async function executeCliCommand<T>(
  command: string,
  server: string,
  tool: string,
  options: CLIExecutorOptions = {}
): Promise<MCPToolResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: opts.timeout,
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });

    // Log stderr as warning if present (but don't fail)
    if (stderr && stderr.trim()) {
      console.warn(`[${server}/${tool}] stderr: ${stderr.trim()}`);
    }

    // Parse output
    let data: T;
    if (opts.parseJson && stdout.trim()) {
      try {
        data = JSON.parse(stdout) as T;
      } catch {
        // If JSON parsing fails, return raw string
        data = stdout.trim() as unknown as T;
      }
    } else {
      data = stdout.trim() as unknown as T;
    }

    return createSuccessResult(data, {
      tool,
      server,
      executionTimeMs: Date.now() - startTime,
      executionType: 'cli',
    });
  } catch (error) {
    const execError = error as ExecException & { stdout?: string; stderr?: string };

    // Handle timeout
    if (execError.killed) {
      return createErrorResult(
        {
          code: 'CLI_TIMEOUT',
          message: `Command timed out after ${opts.timeout}ms`,
          details: { command },
        },
        {
          tool,
          server,
          executionTimeMs: Date.now() - startTime,
          executionType: 'cli',
        }
      );
    }

    // Handle other errors
    return createErrorResult(
      {
        code: 'CLI_ERROR',
        message: execError.message || 'Unknown CLI error',
        details: {
          command,
          exitCode: execError.code,
          stderr: execError.stderr,
          stdout: execError.stdout,
        },
      },
      {
        tool,
        server,
        executionTimeMs: Date.now() - startTime,
        executionType: 'cli',
      }
    );
  }
}

/**
 * Execute a CLI command that returns text (not JSON)
 *
 * @param command - The CLI command to execute
 * @param server - The server name (for metadata)
 * @param tool - The tool name (for metadata)
 * @param options - Execution options
 * @returns Promise resolving to structured result with string data
 */
export async function executeCliCommandText(
  command: string,
  server: string,
  tool: string,
  options: Omit<CLIExecutorOptions, 'parseJson'> = {}
): Promise<MCPToolResult<string>> {
  return executeCliCommand<string>(command, server, tool, {
    ...options,
    parseJson: false,
  });
}

/**
 * Execute multiple CLI commands in sequence
 *
 * @param commands - Array of commands to execute
 * @param server - The server name (for metadata)
 * @param tool - The tool name (for metadata)
 * @param options - Execution options
 * @returns Promise resolving to array of results
 */
export async function executeCliCommandSequence<T>(
  commands: string[],
  server: string,
  tool: string,
  options: CLIExecutorOptions = {}
): Promise<MCPToolResult<T>[]> {
  const results: MCPToolResult<T>[] = [];

  for (const command of commands) {
    const result = await executeCliCommand<T>(command, server, tool, options);
    results.push(result);

    // Stop on first error
    if (!result.success) {
      break;
    }
  }

  return results;
}

/**
 * Check if a CLI command is available
 *
 * @param command - The command to check (e.g., 'supabase', 'npx')
 * @returns Promise resolving to boolean
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    // Use 'where' on Windows, 'which' on Unix
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    await execAsync(`${checkCmd} ${command}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a CLI command string from parts
 *
 * @param base - Base command (e.g., 'npx supabase')
 * @param subcommand - Subcommand (e.g., 'db dump')
 * @param args - Arguments object
 * @returns Formatted command string
 */
export function buildCommand(
  base: string,
  subcommand: string,
  args: Record<string, unknown> = {}
): string {
  const parts = [base, subcommand];

  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue;

    const flag = key.length === 1 ? `-${key}` : `--${key}`;

    if (typeof value === 'boolean') {
      if (value) parts.push(flag);
    } else if (Array.isArray(value)) {
      parts.push(`${flag} ${value.join(',')}`);
    } else {
      // Escape special characters in string values
      const escaped =
        typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : String(value);
      parts.push(`${flag} ${escaped}`);
    }
  }

  return parts.join(' ');
}
