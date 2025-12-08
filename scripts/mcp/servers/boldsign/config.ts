/**
 * BoldSign MCP Server Configuration
 *
 * Configuration for the BoldSign API and Edge Function integration.
 * Uses environment variables for credentials and endpoints.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../');
dotenv.config({ path: path.join(projectRoot, '.env') });

// =============================================================================
// Configuration
// =============================================================================

/**
 * BoldSign API configuration
 */
export const BOLDSIGN_CONFIG = {
  /** Base URL for BoldSign API (without /v1 suffix) */
  baseUrl: (process.env.BOLDSIGN_BASE_URL || 'https://api.boldsign.com').replace(/\/v1$/, ''),

  /** Client ID for OAuth */
  clientId: process.env.BOLDSIGN_CLIENT_ID || '',

  /** Client Secret for OAuth */
  clientSecret: process.env.BOLDSIGN_CLIENT_SECRET || '',

  /** API Key (fallback) */
  apiKey: process.env.BOLDSIGN_API_KEY || '',

  /** OAuth token endpoint */
  tokenEndpoint: 'https://account.boldsign.com/connect/token',

  /** OAuth scopes */
  scopes: 'BoldSign.Documents.All BoldSign.SenderIdentity.All BoldSign.Templates.All',
};

/**
 * Supabase configuration for database access
 */
export const SUPABASE_CONFIG = {
  /** Supabase project URL */
  url: process.env.VITE_SUPABASE_URL || '',

  /** Supabase service role key (for server-side access) */
  serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',

  /** Edge Function base URL */
  edgeFunctionUrl: process.env.VITE_SUPABASE_URL
    ? `${process.env.VITE_SUPABASE_URL}/functions/v1`
    : '',
};

/**
 * Production Edge Function URL (if different from local)
 */
export const EDGE_FUNCTION_URL =
  process.env.BOLDSIGN_EDGE_FUNCTION_URL || `${SUPABASE_CONFIG.edgeFunctionUrl}/boldsign-api`;

/**
 * Webhook configuration
 */
export const WEBHOOK_CONFIG = {
  /** Webhook endpoint URL */
  webhookUrl:
    process.env.BOLDSIGN_WEBHOOK_URL || `${SUPABASE_CONFIG.edgeFunctionUrl}/boldsign-webhooks`,

  /** Webhook secret for HMAC verification */
  webhookSecret: process.env.BOLDSIGN_WEBHOOK_SECRET || '',
};

// =============================================================================
// Token Management
// =============================================================================

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

/**
 * Get a valid OAuth access token with caching
 */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  // Cache miss or expired - fetch fresh token
  if (!BOLDSIGN_CONFIG.clientId || !BOLDSIGN_CONFIG.clientSecret) {
    throw new Error(
      'BoldSign OAuth credentials not configured. ' +
        'Set BOLDSIGN_CLIENT_ID and BOLDSIGN_CLIENT_SECRET in .env'
    );
  }

  const response = await fetch(BOLDSIGN_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: BOLDSIGN_CONFIG.clientId,
      client_secret: BOLDSIGN_CONFIG.clientSecret,
      scope: BOLDSIGN_CONFIG.scopes,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch OAuth token: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number };

  if (!data.access_token || !data.expires_in) {
    throw new Error('BoldSign token endpoint returned invalid response');
  }

  // Cache token with 5-minute safety buffer
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

/**
 * Clear the token cache (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}

// =============================================================================
// API Helpers
// =============================================================================

/**
 * Call BoldSign API with OAuth authentication
 */
export async function callBoldSignAPI(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  const url = `${BOLDSIGN_CONFIG.baseUrl}/v1${endpoint}`;

  let token: string;
  try {
    token = await getAccessToken();
  } catch (error) {
    // Fallback to API key if OAuth fails
    if (BOLDSIGN_CONFIG.apiKey) {
      console.warn('[BoldSign] OAuth failed, falling back to API key');
      const headers: Record<string, string> = {
        'X-API-KEY': BOLDSIGN_CONFIG.apiKey,
        ...(options.headers as Record<string, string>),
      };
      if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      return fetch(url, { ...options, headers });
    }
    throw error;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  // Handle 401 (token expired) - retry with fresh token
  if (response.status === 401 && retryCount === 0) {
    cachedToken = null;
    return callBoldSignAPI(endpoint, options, 1);
  }

  return response;
}

/**
 * Call Edge Function via Supabase
 */
export async function callEdgeFunction(
  action: string,
  params: Record<string, unknown>
): Promise<Response> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  return response;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Check if BoldSign is configured
 */
export function isBoldSignConfigured(): boolean {
  return !!(
    (BOLDSIGN_CONFIG.clientId && BOLDSIGN_CONFIG.clientSecret) ||
    BOLDSIGN_CONFIG.apiKey
  );
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.serviceRoleKey);
}

/**
 * Get configuration status for debugging
 */
export function getConfigStatus(): Record<string, boolean | string> {
  return {
    boldsignConfigured: isBoldSignConfigured(),
    supabaseConfigured: isSupabaseConfigured(),
    hasOAuthCredentials: !!(BOLDSIGN_CONFIG.clientId && BOLDSIGN_CONFIG.clientSecret),
    hasApiKey: !!BOLDSIGN_CONFIG.apiKey,
    boldsignBaseUrl: BOLDSIGN_CONFIG.baseUrl,
    supabaseUrl: SUPABASE_CONFIG.url ? 'configured' : 'missing',
    edgeFunctionUrl: EDGE_FUNCTION_URL ? 'configured' : 'missing',
    webhookUrl: WEBHOOK_CONFIG.webhookUrl ? 'configured' : 'missing',
  };
}
