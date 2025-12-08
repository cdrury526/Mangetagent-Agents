/**
 * Supabase Configuration
 *
 * Centralized configuration for Supabase API access.
 * Loads credentials from environment variables.
 */

import { createErrorResult, MCPToolResult } from '../../types/index.js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
dotenv.config({ path: resolve(process.cwd(), '.env') });

/**
 * Get environment variable (supports VITE_ prefix)
 */
function getEnv(name: string): string | undefined {
  return process.env[name] || process.env[`VITE_${name}`];
}

/**
 * Supabase configuration
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  projectRef: string;
}

/**
 * Get Supabase configuration from environment
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !anonKey || !serviceRoleKey) {
    return null;
  }

  // Extract project ref from URL (e.g., https://xxxxx.supabase.co -> xxxxx)
  const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';

  return {
    url,
    anonKey,
    serviceRoleKey,
    projectRef,
  };
}

/**
 * Validate configuration and return error result if missing
 */
export function validateConfig<T>(
  server: string,
  tool: string
): SupabaseConfig | MCPToolResult<T> {
  const config = getSupabaseConfig();

  if (!config) {
    return createErrorResult<T>(
      {
        code: 'MISSING_CONFIG',
        message: 'Supabase configuration not found. Ensure .env has VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_SUPABASE_SERVICE_ROLE_KEY',
      },
      {
        tool,
        server,
        executionTimeMs: 0,
        executionType: 'api',
      }
    );
  }

  return config;
}

/**
 * Check if value is an error result
 */
export function isErrorResult<T>(
  value: SupabaseConfig | MCPToolResult<T>
): value is MCPToolResult<T> {
  return 'success' in value && !value.success;
}

/**
 * Standard headers for Supabase REST API
 */
export function getRestHeaders(config: SupabaseConfig, useServiceRole = false): Record<string, string> {
  const key = useServiceRole ? config.serviceRoleKey : config.anonKey;
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Standard headers for Supabase Management API
 */
export function getManagementHeaders(accessToken: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}
