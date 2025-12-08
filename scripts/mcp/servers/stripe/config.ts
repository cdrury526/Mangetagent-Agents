/**
 * Stripe MCP Server Configuration
 *
 * Configuration for the Stripe API integration.
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
 * Stripe API configuration
 */
export const STRIPE_CONFIG = {
  /** Stripe Secret Key */
  secretKey: process.env.STRIPE_SECRET_KEY || '',

  /** Stripe Webhook Secret */
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  /** Stripe API version */
  apiVersion: '2024-11-20.acacia',

  /** Base URL for Stripe API */
  baseUrl: 'https://api.stripe.com/v1',
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
 * Webhook configuration
 */
export const WEBHOOK_CONFIG = {
  /** Webhook endpoint URL */
  webhookUrl:
    process.env.STRIPE_WEBHOOK_URL || `${SUPABASE_CONFIG.edgeFunctionUrl}/stripe-webhook`,
};

// =============================================================================
// API Helpers
// =============================================================================

/**
 * Call Stripe API with authentication
 */
export async function callStripeAPI(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${STRIPE_CONFIG.baseUrl}${endpoint}`;

  if (!STRIPE_CONFIG.secretKey) {
    throw new Error(
      'Stripe API key not configured. Set STRIPE_SECRET_KEY in .env'
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${STRIPE_CONFIG.secretKey}`,
    'Stripe-Version': STRIPE_CONFIG.apiVersion,
    ...(options.headers as Record<string, string>),
  };

  // For POST/PUT requests with form data
  if (options.body && typeof options.body === 'string' && options.method !== 'GET') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  return fetch(url, { ...options, headers });
}

/**
 * Build URL-encoded form data from an object (Stripe API format)
 */
export function buildFormData(params: Record<string, unknown>): string {
  const formPairs: string[] = [];

  function addParam(key: string, value: unknown): void {
    if (value === undefined || value === null) return;

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Handle nested objects
      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        addParam(`${key}[${nestedKey}]`, nestedValue);
      }
    } else if (Array.isArray(value)) {
      // Handle arrays
      value.forEach((item, index) => {
        if (typeof item === 'object') {
          for (const [nestedKey, nestedValue] of Object.entries(item as Record<string, unknown>)) {
            addParam(`${key}[${index}][${nestedKey}]`, nestedValue);
          }
        } else {
          addParam(`${key}[${index}]`, item);
        }
      });
    } else {
      formPairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  for (const [key, value] of Object.entries(params)) {
    addParam(key, value);
  }

  return formPairs.join('&');
}

/**
 * Build query string from an object
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const queryPairs: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (key === 'created' && typeof value === 'object') {
      // Handle Stripe's date filter format
      const dateFilter = value as Record<string, number>;
      if (dateFilter.gte) queryPairs.push(`created[gte]=${dateFilter.gte}`);
      if (dateFilter.lte) queryPairs.push(`created[lte]=${dateFilter.lte}`);
      if (dateFilter.gt) queryPairs.push(`created[gt]=${dateFilter.gt}`);
      if (dateFilter.lt) queryPairs.push(`created[lt]=${dateFilter.lt}`);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        queryPairs.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(String(item))}`);
      });
    } else {
      queryPairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return queryPairs.length > 0 ? `?${queryPairs.join('&')}` : '';
}

/**
 * Call Edge Function via Supabase
 */
export async function callEdgeFunction(
  functionName: string,
  payload: Record<string, unknown>
): Promise<Response> {
  const url = `${SUPABASE_CONFIG.edgeFunctionUrl}/${functionName}`;

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
    },
    body: JSON.stringify(payload),
  });
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!STRIPE_CONFIG.secretKey;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_CONFIG.url && SUPABASE_CONFIG.serviceRoleKey);
}

/**
 * Check if in test mode
 */
export function isTestMode(): boolean {
  return STRIPE_CONFIG.secretKey.startsWith('sk_test_');
}

/**
 * Get configuration status for debugging
 */
export function getConfigStatus(): Record<string, boolean | string> {
  return {
    stripeConfigured: isStripeConfigured(),
    supabaseConfigured: isSupabaseConfigured(),
    hasSecretKey: !!STRIPE_CONFIG.secretKey,
    hasWebhookSecret: !!STRIPE_CONFIG.webhookSecret,
    isTestMode: isTestMode(),
    stripeApiVersion: STRIPE_CONFIG.apiVersion,
    supabaseUrl: SUPABASE_CONFIG.url ? 'configured' : 'missing',
    edgeFunctionUrl: SUPABASE_CONFIG.edgeFunctionUrl ? 'configured' : 'missing',
    webhookUrl: WEBHOOK_CONFIG.webhookUrl ? 'configured' : 'missing',
  };
}

// =============================================================================
// Response Transformation Helpers
// =============================================================================

/**
 * Convert Stripe snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Transform Stripe API response to camelCase
 */
export function transformResponse<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;

  if (Array.isArray(obj)) {
    return obj.map(transformResponse) as T;
  }

  if (typeof obj === 'object') {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      transformed[snakeToCamel(key)] = transformResponse(value);
    }
    return transformed as T;
  }

  return obj as T;
}
