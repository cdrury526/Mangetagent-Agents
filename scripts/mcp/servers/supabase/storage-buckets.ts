/**
 * Supabase: Storage Buckets
 *
 * Manage storage buckets using the Supabase Storage API.
 * Works with service role key - no additional auth needed.
 *
 * @example
 * await listBuckets()
 * await createBucket({ name: 'documents', public: false })
 * await deleteBucket({ name: 'old-bucket' })
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getRestHeaders } from './config.js';

const SERVER = 'supabase';

// =============================================================================
// List Buckets
// =============================================================================

const TOOL_LIST = 'list-buckets';

export const listBucketsInputSchema = z.object({});

export interface Bucket {
  id: string;
  name: string;
  owner: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
}

export type ListBucketsOutput = Bucket[];

/**
 * List all storage buckets
 */
export async function listBuckets(): Promise<MCPToolResult<ListBucketsOutput>> {
  const configOrError = validateConfig<ListBucketsOutput>(SERVER, TOOL_LIST);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/storage/v1/bucket`;

  return executeApiCall<ListBucketsOutput>(url, SERVER, TOOL_LIST, {
    headers: getRestHeaders(config, true),
  });
}

export const listBucketsDefinition: MCPToolDefinition = {
  name: TOOL_LIST,
  mcpName: 'mcp__supabase__list_buckets',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/bucket',
  description: 'List all storage buckets',
  inputSchema: listBucketsInputSchema,
  tags: ['storage', 'buckets', 'list', 'api'],
  examples: [
    {
      description: 'List all buckets',
      input: {},
      expectedOutput: '[{ id: "...", name: "documents", public: false }]',
    },
  ],
};

// =============================================================================
// Create Bucket
// =============================================================================

const TOOL_CREATE = 'create-bucket';

export const createBucketInputSchema = z.object({
  name: z.string().min(1, 'Bucket name is required'),
  public: z.boolean().default(false),
  fileSizeLimit: z.number().optional(),
  allowedMimeTypes: z.array(z.string()).optional(),
});

export interface CreateBucketInput {
  name: string;
  public?: boolean;
  fileSizeLimit?: number;
  allowedMimeTypes?: string[];
}

export interface CreateBucketOutput {
  name: string;
}

/**
 * Create a new storage bucket
 */
export async function createBucket(
  input: CreateBucketInput
): Promise<MCPToolResult<CreateBucketOutput>> {
  const validated = createBucketInputSchema.parse(input);

  const configOrError = validateConfig<CreateBucketOutput>(SERVER, TOOL_CREATE);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/storage/v1/bucket`;

  return executeApiCall<CreateBucketOutput>(url, SERVER, TOOL_CREATE, {
    method: 'POST',
    headers: getRestHeaders(config, true),
    body: {
      name: validated.name,
      id: validated.name,
      public: validated.public,
      file_size_limit: validated.fileSizeLimit,
      allowed_mime_types: validated.allowedMimeTypes,
    },
  });
}

export const createBucketDefinition: MCPToolDefinition = {
  name: TOOL_CREATE,
  mcpName: 'mcp__supabase__create_bucket',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/bucket',
  description: 'Create a new storage bucket',
  inputSchema: createBucketInputSchema,
  tags: ['storage', 'buckets', 'create', 'api'],
  examples: [
    {
      description: 'Create a private bucket',
      input: { name: 'documents', public: false },
      expectedOutput: '{ name: "documents" }',
    },
    {
      description: 'Create bucket with restrictions',
      input: {
        name: 'images',
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['image/png', 'image/jpeg'],
      },
      expectedOutput: '{ name: "images" }',
    },
  ],
};

// =============================================================================
// Delete Bucket
// =============================================================================

const TOOL_DELETE = 'delete-bucket';

export const deleteBucketInputSchema = z.object({
  name: z.string().min(1, 'Bucket name is required'),
});

export interface DeleteBucketInput {
  name: string;
}

export interface DeleteBucketOutput {
  message: string;
}

/**
 * Delete a storage bucket (must be empty)
 */
export async function deleteBucket(
  input: DeleteBucketInput
): Promise<MCPToolResult<DeleteBucketOutput>> {
  const validated = deleteBucketInputSchema.parse(input);

  const configOrError = validateConfig<DeleteBucketOutput>(SERVER, TOOL_DELETE);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/storage/v1/bucket/${validated.name}`;

  return executeApiCall<DeleteBucketOutput>(url, SERVER, TOOL_DELETE, {
    method: 'DELETE',
    headers: getRestHeaders(config, true),
  });
}

export const deleteBucketDefinition: MCPToolDefinition = {
  name: TOOL_DELETE,
  mcpName: 'mcp__supabase__delete_bucket',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/bucket/{name}',
  description: 'Delete a storage bucket (must be empty)',
  inputSchema: deleteBucketInputSchema,
  tags: ['storage', 'buckets', 'delete', 'api'],
  examples: [
    {
      description: 'Delete a bucket',
      input: { name: 'old-bucket' },
      expectedOutput: '{ message: "Successfully deleted" }',
    },
  ],
};

// =============================================================================
// Get Bucket
// =============================================================================

const TOOL_GET = 'get-bucket';

export const getBucketInputSchema = z.object({
  name: z.string().min(1, 'Bucket name is required'),
});

export interface GetBucketInput {
  name: string;
}

/**
 * Get details of a specific bucket
 */
export async function getBucket(
  input: GetBucketInput
): Promise<MCPToolResult<Bucket>> {
  const validated = getBucketInputSchema.parse(input);

  const configOrError = validateConfig<Bucket>(SERVER, TOOL_GET);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/storage/v1/bucket/${validated.name}`;

  return executeApiCall<Bucket>(url, SERVER, TOOL_GET, {
    headers: getRestHeaders(config, true),
  });
}

export const getBucketDefinition: MCPToolDefinition = {
  name: TOOL_GET,
  mcpName: 'mcp__supabase__get_bucket',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/bucket/{name}',
  description: 'Get details of a specific bucket',
  inputSchema: getBucketInputSchema,
  tags: ['storage', 'buckets', 'get', 'api'],
  examples: [
    {
      description: 'Get bucket details',
      input: { name: 'documents' },
      expectedOutput: '{ id: "...", name: "documents", public: false, ... }',
    },
  ],
};
