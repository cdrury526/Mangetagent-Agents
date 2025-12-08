/**
 * API Executor
 *
 * Executes HTTP API calls as a fallback for tools without CLI equivalents.
 * Uses native fetch API for HTTP requests.
 */

import {
  MCPToolResult,
  APIExecutorOptions,
  createSuccessResult,
  createErrorResult,
} from '../types/index.js';

/**
 * Default options for API execution
 */
const DEFAULT_OPTIONS: Required<APIExecutorOptions> = {
  method: 'GET',
  headers: {},
  body: undefined,
  timeout: 30000,
};

/**
 * Execute an API call and return structured result
 *
 * @param url - The API endpoint URL
 * @param server - The server name (for metadata)
 * @param tool - The tool name (for metadata)
 * @param options - Request options
 * @returns Promise resolving to structured result
 *
 * @example
 * const result = await executeApiCall(
 *   'https://api.supabase.com/v1/projects/xxx/advisors',
 *   'supabase',
 *   'get-advisors',
 *   { headers: { Authorization: 'Bearer xxx' } }
 * );
 */
export async function executeApiCall<T>(
  url: string,
  server: string,
  tool: string,
  options: APIExecutorOptions = {}
): Promise<MCPToolResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

  try {
    const response = await fetch(url, {
      method: opts.method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...opts.headers,
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      return createErrorResult(
        {
          code: `HTTP_${response.status}`,
          message: `HTTP ${response.status}: ${response.statusText}`,
          details: {
            url,
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
          },
        },
        {
          tool,
          server,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
        }
      );
    }

    // Parse response
    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T;
    } else {
      data = (await response.text()) as unknown as T;
    }

    return createSuccessResult(data, {
      tool,
      server,
      executionTimeMs: Date.now() - startTime,
      executionType: 'api',
    });
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return createErrorResult(
        {
          code: 'API_TIMEOUT',
          message: `Request timed out after ${opts.timeout}ms`,
          details: { url },
        },
        {
          tool,
          server,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
        }
      );
    }

    // Handle other errors
    return createErrorResult(
      {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown API error',
        details: { url, error },
      },
      {
        tool,
        server,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }
}

/**
 * Execute a GraphQL query
 *
 * @param url - The GraphQL endpoint URL
 * @param query - The GraphQL query string
 * @param variables - Query variables
 * @param server - The server name (for metadata)
 * @param tool - The tool name (for metadata)
 * @param options - Request options
 * @returns Promise resolving to structured result
 */
export async function executeGraphQLQuery<T>(
  url: string,
  query: string,
  variables: Record<string, unknown> | undefined,
  server: string,
  tool: string,
  options: Omit<APIExecutorOptions, 'method' | 'body'> = {}
): Promise<MCPToolResult<T>> {
  return executeApiCall<{ data: T; errors?: Array<{ message: string }> }>(
    url,
    server,
    tool,
    {
      ...options,
      method: 'POST',
      body: { query, variables },
    }
  ).then((result) => {
    if (!result.success) return result as unknown as MCPToolResult<T>;

    // Handle GraphQL errors
    if (result.data?.errors?.length) {
      return createErrorResult<T>(
        {
          code: 'GRAPHQL_ERROR',
          message: result.data.errors.map((e) => e.message).join('; '),
          details: { errors: result.data.errors },
        },
        result.metadata
      );
    }

    return createSuccessResult(result.data!.data, result.metadata);
  });
}

/**
 * Build URL with query parameters
 *
 * @param baseUrl - Base URL
 * @param params - Query parameters
 * @returns URL string with query parameters
 */
export function buildUrl(
  baseUrl: string,
  params: Record<string, unknown> = {}
): string {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, String(v)));
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}
