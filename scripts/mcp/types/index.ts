/**
 * MCP Code Execution Bridge - Core Type Definitions
 *
 * These types define the contract for all MCP tool wrappers.
 * All tool implementations must conform to these interfaces.
 */

import { z } from 'zod';

// =============================================================================
// Result Types
// =============================================================================

/**
 * Standard result type for all MCP tool calls
 */
export interface MCPToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: MCPError;
  metadata: MCPMetadata;
}

/**
 * Error information for failed tool calls
 */
export interface MCPError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Metadata about the tool execution
 */
export interface MCPMetadata {
  tool: string;
  server: string;
  executionTimeMs: number;
  timestamp: string;
  executionType: 'cli' | 'api';
}

// =============================================================================
// Tool Definition Types
// =============================================================================

/**
 * Definition for a single MCP tool
 */
export interface MCPToolDefinition {
  /** Tool name in kebab-case (e.g., 'list-tables') */
  name: string;
  /** Full MCP tool name (e.g., 'mcp__supabase__list_tables') */
  mcpName: string;
  /** Equivalent CLI command (e.g., 'supabase db dump') */
  cliCommand?: string;
  /** API endpoint if CLI not available */
  apiEndpoint?: string;
  /** Human-readable description */
  description: string;
  /** Zod schema for input validation */
  inputSchema: z.ZodSchema;
  /** Tags for search/categorization */
  tags: string[];
  /** Example usages */
  examples?: MCPToolExample[];
}

/**
 * Example usage for documentation
 */
export interface MCPToolExample {
  description: string;
  input: Record<string, unknown>;
  expectedOutput?: string;
}

// =============================================================================
// Server Manifest Types
// =============================================================================

/**
 * Manifest for an MCP server (collection of tools)
 */
export interface MCPServerManifest {
  /** Server name in kebab-case (e.g., 'supabase') */
  name: string;
  /** Human-readable description */
  description: string;
  /** Version string */
  version: string;
  /** CLI prefix for tools (e.g., 'npx supabase') */
  cliPrefix?: string;
  /** Base API URL if applicable */
  apiBaseUrl?: string;
  /** All tools in this server */
  tools: MCPToolDefinition[];
  /** Path to additional documentation */
  documentation?: string;
}

// =============================================================================
// Registry Types
// =============================================================================

/**
 * Central registry of all MCP servers and tools
 */
export interface MCPRegistry {
  version: string;
  lastUpdated: string;
  servers: Record<string, MCPServerManifest>;
}

// =============================================================================
// Executor Types
// =============================================================================

/**
 * Options for CLI command execution
 */
export interface CLIExecutorOptions {
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Whether to parse stdout as JSON (default: true) */
  parseJson?: boolean;
}

/**
 * Options for API call execution
 */
export interface APIExecutorOptions {
  /** HTTP method (default: 'GET') */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// =============================================================================
// Tool Function Types
// =============================================================================

/**
 * Generic tool function signature
 */
export type MCPToolFunction<TInput, TOutput> = (
  input: TInput
) => Promise<MCPToolResult<TOutput>>;

/**
 * Tool module exports
 */
export interface MCPToolModule<TInput = unknown, TOutput = unknown> {
  /** Main tool function */
  execute: MCPToolFunction<TInput, TOutput>;
  /** Tool definition for registry */
  toolDefinition: MCPToolDefinition;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a successful result
 */
export function createSuccessResult<T>(
  data: T,
  metadata: Omit<MCPMetadata, 'timestamp'>
): MCPToolResult<T> {
  return {
    success: true,
    data,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Create an error result
 */
export function createErrorResult<T>(
  error: MCPError,
  metadata: Omit<MCPMetadata, 'timestamp'>
): MCPToolResult<T> {
  return {
    success: false,
    error,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
