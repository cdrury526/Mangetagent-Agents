/**
 * Supabase: Storage Files
 *
 * Manage files in storage buckets using the Supabase Storage API.
 *
 * @example
 * await listFiles({ bucket: 'documents', path: '' })
 * await deleteFile({ bucket: 'documents', path: 'contracts/old.pdf' })
 * await getPublicUrl({ bucket: 'images', path: 'logo.png' })
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult, createSuccessResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getRestHeaders } from './config.js';

const SERVER = 'supabase';

// =============================================================================
// List Files
// =============================================================================

const TOOL_LIST = 'list-files';

export const listFilesInputSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  path: z.string().default(''),
  limit: z.number().default(100),
  offset: z.number().default(0),
});

export interface ListFilesInput {
  bucket: string;
  path?: string;
  limit?: number;
  offset?: number;
}

export interface StorageFile {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: Record<string, unknown> | null;
}

export type ListFilesOutput = StorageFile[];

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  input: ListFilesInput
): Promise<MCPToolResult<ListFilesOutput>> {
  const validated = listFilesInputSchema.parse(input);

  const configOrError = validateConfig<ListFilesOutput>(SERVER, TOOL_LIST);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/storage/v1/object/list/${validated.bucket}`;

  return executeApiCall<ListFilesOutput>(url, SERVER, TOOL_LIST, {
    method: 'POST',
    headers: getRestHeaders(config, true),
    body: {
      prefix: validated.path,
      limit: validated.limit,
      offset: validated.offset,
    },
  });
}

export const listFilesDefinition: MCPToolDefinition = {
  name: TOOL_LIST,
  mcpName: 'mcp__supabase__list_files',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/object/list/{bucket}',
  description: 'List files in a storage bucket or folder',
  inputSchema: listFilesInputSchema,
  tags: ['storage', 'files', 'list', 'api'],
  examples: [
    {
      description: 'List files in bucket root',
      input: { bucket: 'documents', path: '' },
      expectedOutput: '[{ name: "contract.pdf", ... }]',
    },
    {
      description: 'List files in a folder',
      input: { bucket: 'documents', path: 'contracts/' },
      expectedOutput: '[{ name: "2024-sale.pdf", ... }]',
    },
  ],
};

// =============================================================================
// Delete File
// =============================================================================

const TOOL_DELETE = 'delete-file';

export const deleteFileInputSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  paths: z.array(z.string()).min(1, 'At least one file path is required'),
});

export interface DeleteFileInput {
  bucket: string;
  paths: string[];
}

export interface DeleteFileOutput {
  message: string;
}

/**
 * Delete one or more files from a bucket
 */
export async function deleteFile(
  input: DeleteFileInput
): Promise<MCPToolResult<DeleteFileOutput>> {
  const validated = deleteFileInputSchema.parse(input);

  const configOrError = validateConfig<DeleteFileOutput>(SERVER, TOOL_DELETE);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/storage/v1/object/${validated.bucket}`;

  return executeApiCall<DeleteFileOutput>(url, SERVER, TOOL_DELETE, {
    method: 'DELETE',
    headers: getRestHeaders(config, true),
    body: {
      prefixes: validated.paths,
    },
  });
}

export const deleteFileDefinition: MCPToolDefinition = {
  name: TOOL_DELETE,
  mcpName: 'mcp__supabase__delete_file',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/object/{bucket}',
  description: 'Delete one or more files from a bucket',
  inputSchema: deleteFileInputSchema,
  tags: ['storage', 'files', 'delete', 'api'],
  examples: [
    {
      description: 'Delete a single file',
      input: { bucket: 'documents', paths: ['old-contract.pdf'] },
      expectedOutput: '{ message: "Successfully deleted" }',
    },
    {
      description: 'Delete multiple files',
      input: { bucket: 'documents', paths: ['file1.pdf', 'file2.pdf'] },
      expectedOutput: '{ message: "Successfully deleted" }',
    },
  ],
};

// =============================================================================
// Get Public URL
// =============================================================================

const TOOL_PUBLIC_URL = 'get-public-url';

export const getPublicUrlInputSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  path: z.string().min(1, 'File path is required'),
});

export interface GetPublicUrlInput {
  bucket: string;
  path: string;
}

export interface GetPublicUrlOutput {
  publicUrl: string;
}

/**
 * Get the public URL for a file (bucket must be public)
 */
export async function getPublicUrl(
  input: GetPublicUrlInput
): Promise<MCPToolResult<GetPublicUrlOutput>> {
  const validated = getPublicUrlInputSchema.parse(input);
  const startTime = Date.now();

  const configOrError = validateConfig<GetPublicUrlOutput>(SERVER, TOOL_PUBLIC_URL);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const publicUrl = `${config.url}/storage/v1/object/public/${validated.bucket}/${validated.path}`;

  return createSuccessResult<GetPublicUrlOutput>(
    { publicUrl },
    {
      tool: TOOL_PUBLIC_URL,
      server: SERVER,
      executionTimeMs: Date.now() - startTime,
      executionType: 'api',
    }
  );
}

export const getPublicUrlDefinition: MCPToolDefinition = {
  name: TOOL_PUBLIC_URL,
  mcpName: 'mcp__supabase__get_public_url',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}',
  description: 'Get the public URL for a file (bucket must be public)',
  inputSchema: getPublicUrlInputSchema,
  tags: ['storage', 'files', 'url', 'public', 'api'],
  examples: [
    {
      description: 'Get public URL for an image',
      input: { bucket: 'images', path: 'logo.png' },
      expectedOutput: '{ publicUrl: "https://xxx.supabase.co/storage/v1/object/public/images/logo.png" }',
    },
  ],
};

// =============================================================================
// Create Signed URL
// =============================================================================

const TOOL_SIGNED_URL = 'create-signed-url';

export const createSignedUrlInputSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  path: z.string().min(1, 'File path is required'),
  expiresIn: z.number().default(3600), // 1 hour default
});

export interface CreateSignedUrlInput {
  bucket: string;
  path: string;
  expiresIn?: number;
}

export interface CreateSignedUrlOutput {
  signedUrl: string;
}

/**
 * Create a signed URL for temporary access to a private file
 */
export async function createSignedUrl(
  input: CreateSignedUrlInput
): Promise<MCPToolResult<CreateSignedUrlOutput>> {
  const validated = createSignedUrlInputSchema.parse(input);

  const configOrError = validateConfig<CreateSignedUrlOutput>(SERVER, TOOL_SIGNED_URL);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/storage/v1/object/sign/${validated.bucket}/${validated.path}`;

  return executeApiCall<CreateSignedUrlOutput>(url, SERVER, TOOL_SIGNED_URL, {
    method: 'POST',
    headers: getRestHeaders(config, true),
    body: {
      expiresIn: validated.expiresIn,
    },
  });
}

export const createSignedUrlDefinition: MCPToolDefinition = {
  name: TOOL_SIGNED_URL,
  mcpName: 'mcp__supabase__create_signed_url',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/object/sign/{bucket}/{path}',
  description: 'Create a signed URL for temporary access to a private file',
  inputSchema: createSignedUrlInputSchema,
  tags: ['storage', 'files', 'url', 'signed', 'api'],
  examples: [
    {
      description: 'Create 1-hour signed URL',
      input: { bucket: 'documents', path: 'contract.pdf', expiresIn: 3600 },
      expectedOutput: '{ signedUrl: "https://..." }',
    },
  ],
};

// =============================================================================
// Move File
// =============================================================================

const TOOL_MOVE = 'move-file';

export const moveFileInputSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  fromPath: z.string().min(1, 'Source path is required'),
  toPath: z.string().min(1, 'Destination path is required'),
});

export interface MoveFileInput {
  bucket: string;
  fromPath: string;
  toPath: string;
}

export interface MoveFileOutput {
  message: string;
}

/**
 * Move/rename a file within a bucket
 */
export async function moveFile(
  input: MoveFileInput
): Promise<MCPToolResult<MoveFileOutput>> {
  const validated = moveFileInputSchema.parse(input);

  const configOrError = validateConfig<MoveFileOutput>(SERVER, TOOL_MOVE);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/storage/v1/object/move`;

  return executeApiCall<MoveFileOutput>(url, SERVER, TOOL_MOVE, {
    method: 'POST',
    headers: getRestHeaders(config, true),
    body: {
      bucketId: validated.bucket,
      sourceKey: validated.fromPath,
      destinationKey: validated.toPath,
    },
  });
}

export const moveFileDefinition: MCPToolDefinition = {
  name: TOOL_MOVE,
  mcpName: 'mcp__supabase__move_file',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/object/move',
  description: 'Move or rename a file within a bucket',
  inputSchema: moveFileInputSchema,
  tags: ['storage', 'files', 'move', 'rename', 'api'],
  examples: [
    {
      description: 'Rename a file',
      input: {
        bucket: 'documents',
        fromPath: 'draft.pdf',
        toPath: 'final.pdf',
      },
      expectedOutput: '{ message: "Successfully moved" }',
    },
  ],
};
