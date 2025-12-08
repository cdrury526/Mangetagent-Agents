/**
 * Supabase MCP Server
 *
 * 24 API-based tools + 6 CLI tools for interacting with Supabase:
 *
 * PostgREST API (4 tools - use Service Role Key):
 * - query-table, insert-row, update-rows, delete-rows
 *
 * Storage API (11 tools - use Service Role Key):
 * - Buckets: list-buckets, create-bucket, delete-bucket, get-bucket
 * - Files: list-files, delete-file, move-file, get-public-url, create-signed-url
 * - Upload/Download: upload-file, download-file
 *
 * Auth Admin API (5 tools - use Service Role Key):
 * - create-user, list-users, get-user, update-user, delete-user
 *
 * Edge Functions API (2 tools):
 * - invoke-function (use anon or service role key)
 * - list-functions (use Access Token)
 *
 * Management API (2 tools - use Access Token):
 * - run-sql: Execute ANY SQL query (most powerful tool)
 * - generate-types-api: Generate TypeScript types from schema
 *
 * CLI-Based Tools (6 tools - require local Supabase/Docker):
 * - list-tables, execute-sql, apply-migration, get-logs, get-advisors, generate-types
 */

import { MCPServerManifest } from '../../types/index.js';

// Export configuration
export * from './config.js';

// PostgREST API tools (work with service role key)
export * from './query-table.js';
export * from './insert-row.js';
export * from './update-rows.js';
export * from './delete-rows.js';

// Storage API tools (work with service role key)
export * from './storage-buckets.js';
export * from './storage-files.js';
export * from './storage-upload.js';

// Auth Admin API tools (work with service role key)
export * from './auth-admin.js';

// Edge Functions API tools
export * from './edge-functions.js';

// Management API tools (require access token)
export * from './management-api.js';
export * from './generate-types-api.js';

// CLI-based tools (require local Supabase)
export * from './list-tables.js';
export * from './execute-sql.js';
export * from './apply-migration.js';
export * from './get-logs.js';
export * from './get-advisors.js';
export * from './generate-types.js';

// Import tool definitions for registry
// PostgREST API
import { toolDefinition as queryTableDefinition } from './query-table.js';
import { toolDefinition as insertRowDefinition } from './insert-row.js';
import { toolDefinition as updateRowsDefinition } from './update-rows.js';
import { toolDefinition as deleteRowsDefinition } from './delete-rows.js';

// Storage API - Buckets
import {
  listBucketsDefinition,
  createBucketDefinition,
  deleteBucketDefinition,
  getBucketDefinition,
} from './storage-buckets.js';

// Storage API - Files
import {
  listFilesDefinition,
  deleteFileDefinition,
  getPublicUrlDefinition,
  createSignedUrlDefinition,
  moveFileDefinition,
} from './storage-files.js';

// Storage API - Upload/Download
import {
  uploadFileDefinition,
  downloadFileDefinition,
} from './storage-upload.js';

// Edge Functions API
import {
  invokeFunctionDefinition,
  listFunctionsDefinition,
} from './edge-functions.js';

// Auth Admin API
import {
  createUserDefinition,
  listUsersDefinition,
  getUserDefinition,
  updateUserDefinition,
  deleteUserDefinition,
} from './auth-admin.js';

// Management API (require access token)
import {
  runSqlDefinition,
} from './management-api.js';
import {
  generateTypesApiDefinition,
} from './generate-types-api.js';

// CLI-based
import { toolDefinition as listTablesDefinition } from './list-tables.js';
import { toolDefinition as executeSqlDefinition } from './execute-sql.js';
import { toolDefinition as applyMigrationDefinition } from './apply-migration.js';
import { toolDefinition as getLogsDefinition } from './get-logs.js';
import { toolDefinition as getAdvisorsDefinition } from './get-advisors.js';
import { toolDefinition as generateTypesDefinition } from './generate-types.js';

/**
 * Supabase server manifest
 */
export const manifest: MCPServerManifest = {
  name: 'supabase',
  description: 'Supabase database, storage, auth, edge functions, and management via REST APIs',
  version: '4.2.0',
  apiBaseUrl: 'Uses VITE_SUPABASE_URL from .env',
  cliPrefix: 'npx supabase',
  tools: [
    // PostgREST API (primary - work with service role key)
    queryTableDefinition,
    insertRowDefinition,
    updateRowsDefinition,
    deleteRowsDefinition,

    // Storage API - Buckets
    listBucketsDefinition,
    createBucketDefinition,
    deleteBucketDefinition,
    getBucketDefinition,

    // Storage API - Files
    listFilesDefinition,
    deleteFileDefinition,
    getPublicUrlDefinition,
    createSignedUrlDefinition,
    moveFileDefinition,

    // Storage API - Upload/Download
    uploadFileDefinition,
    downloadFileDefinition,

    // Edge Functions API
    invokeFunctionDefinition,
    listFunctionsDefinition,

    // Auth Admin API (require service role key)
    createUserDefinition,
    listUsersDefinition,
    getUserDefinition,
    updateUserDefinition,
    deleteUserDefinition,

    // Management API (requires SUPABASE_ACCESS_TOKEN)
    runSqlDefinition,
    generateTypesApiDefinition,

    // CLI-based tools (require local Supabase)
    listTablesDefinition,
    executeSqlDefinition,
    applyMigrationDefinition,
    getLogsDefinition,
    getAdvisorsDefinition,
    generateTypesDefinition,
  ],
  documentation: 'Docs/Supabase/README.md',
};
