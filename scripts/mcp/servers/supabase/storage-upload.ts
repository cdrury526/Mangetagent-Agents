/**
 * Supabase: Storage Upload/Download
 *
 * Upload and download files from storage buckets using the Supabase Storage API.
 *
 * @example
 * await uploadFile({ bucket: 'documents', path: 'contracts/deal.pdf', content: 'base64string...', contentType: 'application/pdf' })
 * await uploadFile({ bucket: 'documents', path: 'contracts/deal.pdf', filePath: './local/file.pdf' })
 * await downloadFile({ bucket: 'documents', path: 'contracts/deal.pdf' })
 */

import * as fs from 'fs';
import * as nodePath from 'path';
import { z } from 'zod';
import { MCPToolDefinition, MCPToolResult, createSuccessResult, createErrorResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getRestHeaders } from './config.js';

const SERVER = 'supabase';

/**
 * Content type mapping by file extension
 */
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ts': 'application/typescript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.csv': 'text/csv',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/**
 * Get content type from file extension
 */
function getContentTypeFromPath(filePath: string): string {
  const ext = nodePath.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// =============================================================================
// Upload File
// =============================================================================

const TOOL_UPLOAD = 'upload-file';

export const uploadFileInputSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  path: z.string().min(1, 'Storage path is required'),
  content: z.string().optional(),
  filePath: z.string().optional(),
  contentType: z.string().optional(),
  upsert: z.boolean().default(false).optional(),
}).refine(data => data.content || data.filePath, {
  message: 'Either content (base64) or filePath (local file) is required',
});

export interface UploadFileInput {
  bucket: string;
  path: string;
  content?: string;
  filePath?: string;
  contentType?: string;
  upsert?: boolean;
}

export interface UploadFileOutput {
  key: string;
  message: string;
}

/**
 * Upload a file to a storage bucket
 */
export async function uploadFile(
  input: UploadFileInput
): Promise<MCPToolResult<UploadFileOutput>> {
  const validated = uploadFileInputSchema.parse(input);

  const configOrError = validateConfig<UploadFileOutput>(SERVER, TOOL_UPLOAD);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const startTime = Date.now();

  try {
    let fileBuffer: Buffer;
    let contentType = validated.contentType;

    if (validated.filePath) {
      // Read from local file path
      const resolvedPath = nodePath.resolve(process.cwd(), validated.filePath);
      if (!fs.existsSync(resolvedPath)) {
        return createErrorResult(
          {
            code: 'FILE_NOT_FOUND',
            message: `File not found: ${validated.filePath}`,
            details: { resolvedPath },
          },
          {
            tool: TOOL_UPLOAD,
            server: SERVER,
            executionTimeMs: Date.now() - startTime,
            executionType: 'api',
          }
        );
      }
      fileBuffer = fs.readFileSync(resolvedPath);
      // Auto-detect content type from file extension if not provided
      if (!contentType) {
        contentType = getContentTypeFromPath(validated.filePath);
      }
    } else {
      // Decode base64 content to Buffer
      fileBuffer = Buffer.from(validated.content!, 'base64');
    }

    // Build URL
    const url = `${config.url}/storage/v1/object/${validated.bucket}/${validated.path}`;

    // Get base headers (without Content-Type, we'll set it ourselves)
    const headers = getRestHeaders(config, true);
    delete headers['Content-Type']; // Remove default Content-Type

    // Make request with binary body
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': contentType || 'application/octet-stream',
        'x-upsert': validated.upsert ? 'true' : 'false',
      },
      body: fileBuffer,
    });

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
          tool: TOOL_UPLOAD,
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
        }
      );
    }

    // Parse response
    const data = await response.json();

    return createSuccessResult<UploadFileOutput>(
      {
        key: data.Key || validated.path,
        message: 'File uploaded successfully',
      },
      {
        tool: TOOL_UPLOAD,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  } catch (error) {
    return createErrorResult(
      {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown upload error',
        details: { error },
      },
      {
        tool: TOOL_UPLOAD,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }
}

export const uploadFileDefinition: MCPToolDefinition = {
  name: TOOL_UPLOAD,
  mcpName: 'mcp__supabase__upload_file',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/object/{bucket}/{path}',
  description: 'Upload a file to a storage bucket (from local file path or base64 content)',
  inputSchema: uploadFileInputSchema,
  tags: ['storage', 'files', 'upload', 'api'],
  examples: [
    {
      description: 'Upload from local file path (auto-detects content type)',
      input: {
        bucket: 'documents',
        path: 'contracts/deal-2024.pdf',
        filePath: './local/contract.pdf',
      },
      expectedOutput: '{ key: "contracts/deal-2024.pdf", message: "File uploaded successfully" }',
    },
    {
      description: 'Upload base64-encoded content',
      input: {
        bucket: 'documents',
        path: 'contracts/deal-2024.pdf',
        content: 'JVBERi0xLjQK...',
        contentType: 'application/pdf',
      },
      expectedOutput: '{ key: "contracts/deal-2024.pdf", message: "File uploaded successfully" }',
    },
    {
      description: 'Upload and overwrite existing file',
      input: {
        bucket: 'images',
        path: 'logo.png',
        filePath: './assets/logo.png',
        upsert: true,
      },
      expectedOutput: '{ key: "logo.png", message: "File uploaded successfully" }',
    },
  ],
};

// =============================================================================
// Download File
// =============================================================================

const TOOL_DOWNLOAD = 'download-file';

export const downloadFileInputSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
  path: z.string().min(1, 'File path is required'),
});

export interface DownloadFileInput {
  bucket: string;
  path: string;
}

export interface DownloadFileOutput {
  content: string;
  contentType: string;
  size: number;
}

/**
 * Download a file from a storage bucket (returns base64-encoded content)
 */
export async function downloadFile(
  input: DownloadFileInput
): Promise<MCPToolResult<DownloadFileOutput>> {
  const validated = downloadFileInputSchema.parse(input);

  const configOrError = validateConfig<DownloadFileOutput>(SERVER, TOOL_DOWNLOAD);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const startTime = Date.now();

  try {
    // Build URL
    const url = `${config.url}/storage/v1/object/${validated.bucket}/${validated.path}`;

    // Get base headers
    const headers = getRestHeaders(config, true);

    // Make request
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

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
          tool: TOOL_DOWNLOAD,
          server: SERVER,
          executionTimeMs: Date.now() - startTime,
          executionType: 'api',
        }
      );
    }

    // Get content type and size
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : 0;

    // Get binary content and convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Content = buffer.toString('base64');

    return createSuccessResult<DownloadFileOutput>(
      {
        content: base64Content,
        contentType,
        size,
      },
      {
        tool: TOOL_DOWNLOAD,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  } catch (error) {
    return createErrorResult(
      {
        code: 'DOWNLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown download error',
        details: { error },
      },
      {
        tool: TOOL_DOWNLOAD,
        server: SERVER,
        executionTimeMs: Date.now() - startTime,
        executionType: 'api',
      }
    );
  }
}

export const downloadFileDefinition: MCPToolDefinition = {
  name: TOOL_DOWNLOAD,
  mcpName: 'mcp__supabase__download_file',
  apiEndpoint: '{SUPABASE_URL}/storage/v1/object/{bucket}/{path}',
  description: 'Download a file from a storage bucket (returns base64-encoded content)',
  inputSchema: downloadFileInputSchema,
  tags: ['storage', 'files', 'download', 'api'],
  examples: [
    {
      description: 'Download a PDF document',
      input: {
        bucket: 'documents',
        path: 'contracts/deal-2024.pdf',
      },
      expectedOutput: '{ content: "JVBERi0xLjQK...", contentType: "application/pdf", size: 51234 }',
    },
    {
      description: 'Download an image',
      input: {
        bucket: 'images',
        path: 'logo.png',
      },
      expectedOutput: '{ content: "iVBORw0KGgo...", contentType: "image/png", size: 12845 }',
    },
  ],
};
