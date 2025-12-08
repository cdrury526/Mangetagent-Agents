# MCP Bridge Reference

Complete reference for the MCP Code Execution Bridge.

## CLI Commands

### `npm run mcp:list`

List all available MCP servers.

```bash
npm run mcp:list
```

**Output:**
```
Available MCP Servers
==================================================

supabase (v1.0.0)
  Supabase database, auth, storage, and edge functions management
  Tools: 6
  CLI Prefix: npx supabase
  Docs: Docs/Supabase/README.md
```

### `npm run mcp -- list-tools <server>`

List all tools for a specific server.

```bash
npm run mcp -- list-tools supabase
```

**Output:**
```
Tools for supabase (...)
==================================================

list-tables
  Lists all tables in one or more schemas...
  MCP: mcp__supabase__list_tables
  Tags: database, schema, tables, rls, introspection
```

### `npm run mcp -- describe <server> <tool>`

Get detailed information about a tool.

```bash
npm run mcp -- describe supabase list-tables
```

**Output:**
```
supabase/list-tables
  MCP: mcp__supabase__list_tables
  Description: Lists all tables in one or more schemas...
  Tags: database, schema, tables, rls, introspection
  CLI: supabase db dump --schema <schemas>

Examples:
  List all public tables
    Input: {"schemas":["public"]}
    Output: [{ schema: "public", name: "profiles"...
```

### `npm run mcp:search <query>`

Search for tools by name, description, or tags.

```bash
npm run mcp:search "database"
```

**Output:**
```
Found 4 tools matching "database":
==================================================

supabase/list-tables
  Lists all tables in one or more schemas...
  Tags: database, schema, tables, rls, introspection
```

### `npm run mcp -- run <server> <tool> [json]`

Execute a tool with optional JSON input.

```bash
# Without input
npm run mcp -- run supabase generate-types

# With input
npm run mcp -- run supabase list-tables '{"schemas":["public","auth"]}'
```

**Output:**
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "tool": "list-tables",
    "server": "supabase",
    "executionTimeMs": 1234,
    "executionType": "cli"
  }
}
```

### `npm run mcp:registry`

Regenerate the tool registry after adding/modifying tools.

```bash
npm run mcp:registry
```

## Supabase Tools

### list-tables

List tables in specified schemas with columns, constraints, and RLS status.

**Input:**
```typescript
{
  schemas?: string[];  // Default: ['public']
}
```

**Example:**
```bash
npm run mcp -- run supabase list-tables '{"schemas":["public"]}'
```

**Output:** Array of `TableDefinition` objects with schema, name, columns, RLS status.

### execute-sql

Execute raw SQL queries. Use `apply-migration` for DDL operations.

**Input:**
```typescript
{
  query: string;  // SQL query to execute
}
```

**Example:**
```bash
npm run mcp -- run supabase execute-sql '{"query":"SELECT * FROM profiles LIMIT 5"}'
```

**Output:** Query results as array of row objects.

### apply-migration

Apply DDL migrations (CREATE, ALTER, etc.).

**Input:**
```typescript
{
  name: string;   // Migration name in snake_case
  query: string;  // SQL DDL statements
}
```

**Example:**
```bash
npm run mcp -- run supabase apply-migration '{"name":"add_avatar_column","query":"ALTER TABLE profiles ADD COLUMN avatar_url text"}'
```

### get-logs

Get service logs from the last 24 hours.

**Input:**
```typescript
{
  service: 'api' | 'branch-action' | 'postgres' | 'edge-function' | 'auth' | 'storage' | 'realtime';
}
```

**Example:**
```bash
npm run mcp -- run supabase get-logs '{"service":"api"}'
```

### get-advisors

Get security or performance advisory notices.

**Input:**
```typescript
{
  type: 'security' | 'performance';
}
```

**Example:**
```bash
npm run mcp -- run supabase get-advisors '{"type":"security"}'
```

**Note:** Requires `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN` environment variables.

### generate-types

Generate TypeScript types from database schema (CLI-based, requires Docker).

**Input:** None required.

**Example:**
```bash
npm run mcp -- run supabase generate-types
```

**Output:** TypeScript type definitions as string.

### generate-types-api

Generate TypeScript types via Management API (works without Docker).

**Input:**
```typescript
{
  includedSchemas?: string[];  // Default: ['public']
  outputPath?: string;         // Optional: save to file
}
```

**Example:**
```bash
# Generate to console
npm run mcp -- run supabase generate-types-api '{}'

# Generate to file
npm run mcp -- run supabase generate-types-api '{"outputPath":"src/types/database.ts"}'
```

**Output:** TypeScript type definitions as string, or `{ saved: true, path: "..." }` if outputPath provided.

**Note:** Requires `SUPABASE_ACCESS_TOKEN` environment variable.

## Auth Admin Tools

### create-user

Create a new user with email/password.

**Input:**
```typescript
{
  email: string;           // Required
  password: string;        // Required (min 6 chars)
  email_confirm?: boolean; // Default: true (auto-confirm)
  user_metadata?: object;  // Optional user metadata
  app_metadata?: object;   // Optional app metadata
}
```

**Example:**
```bash
npm run mcp -- run supabase create-user '{"email":"agent@realty.com","password":"secure123"}'
```

### list-users

List all users with pagination.

**Input:**
```typescript
{
  page?: number;      // Default: 1
  per_page?: number;  // Default: 50 (max: 1000)
}
```

**Example:**
```bash
npm run mcp -- run supabase list-users '{"page":1,"per_page":100}'
```

### get-user

Get a user by UUID.

**Input:**
```typescript
{
  id: string;  // User UUID
}
```

**Example:**
```bash
npm run mcp -- run supabase get-user '{"id":"abc-123-uuid"}'
```

### update-user

Update user properties.

**Input:**
```typescript
{
  id: string;              // Required: User UUID
  email?: string;          // New email
  password?: string;       // New password (min 6 chars)
  email_confirm?: boolean; // Confirm email change
  user_metadata?: object;  // Update user metadata
  app_metadata?: object;   // Update app metadata
  ban_duration?: string;   // Ban duration (e.g., "24h", "none" to unban)
}
```

**Example:**
```bash
# Update email
npm run mcp -- run supabase update-user '{"id":"user-uuid","email":"new@example.com"}'

# Ban user for 24 hours
npm run mcp -- run supabase update-user '{"id":"user-uuid","ban_duration":"24h"}'

# Unban user
npm run mcp -- run supabase update-user '{"id":"user-uuid","ban_duration":"none"}'
```

### delete-user

Permanently delete a user.

**Input:**
```typescript
{
  id: string;  // User UUID
}
```

**Example:**
```bash
npm run mcp -- run supabase delete-user '{"id":"user-uuid"}'
```

## Storage Upload/Download Tools

### upload-file

Upload a file to a storage bucket.

**Input:**
```typescript
{
  bucket: string;       // Bucket name
  path: string;         // File path within bucket
  content: string;      // Base64-encoded file content
  contentType?: string; // MIME type (default: 'application/octet-stream')
  upsert?: boolean;     // Overwrite if exists (default: false)
}
```

**Example:**
```bash
npm run mcp -- run supabase upload-file '{"bucket":"documents","path":"contracts/deal.pdf","content":"JVBERi0xLjQK...","contentType":"application/pdf","upsert":true}'
```

### download-file

Download a file from a storage bucket.

**Input:**
```typescript
{
  bucket: string;  // Bucket name
  path: string;    // File path within bucket
}
```

**Example:**
```bash
npm run mcp -- run supabase download-file '{"bucket":"documents","path":"contracts/deal.pdf"}'
```

**Output:**
```json
{
  "success": true,
  "data": {
    "content": "JVBERi0xLjQK...",
    "contentType": "application/pdf",
    "size": 12345
  }
}
```

## Edge Function Tools

### invoke-function

Invoke a deployed Edge Function.

**Input:**
```typescript
{
  name: string;           // Function name
  payload?: object;       // JSON payload to send
  useServiceRole?: boolean; // Use service role key (default: false uses anon key)
}
```

**Example:**
```bash
# Basic invocation
npm run mcp -- run supabase invoke-function '{"name":"hello-world","payload":{"name":"John"}}'

# With service role key
npm run mcp -- run supabase invoke-function '{"name":"admin-task","useServiceRole":true,"payload":{"action":"cleanup"}}'
```

### list-functions

List all deployed Edge Functions.

**Input:** None required.

**Example:**
```bash
npm run mcp -- run supabase list-functions '{}'
```

**Output:** Array of function objects with id, slug, name, status, version, etc.

**Note:** Requires `SUPABASE_ACCESS_TOKEN` environment variable.

## shadcn Tools

### search-items

Search for components in registries using fuzzy matching.

**Input:**
```typescript
{
  registries: string[];  // e.g., ['@shadcn']
  query: string;
  limit?: number;
  offset?: number;
}
```

**Example:**
```bash
npm run mcp -- run shadcn search-items '{"registries":["@shadcn"],"query":"button"}'
```

### view-items

View detailed information about registry items.

**Input:**
```typescript
{
  items: string[];  // e.g., ['@shadcn/button', '@shadcn/card']
}
```

**Example:**
```bash
npm run mcp -- run shadcn view-items '{"items":["@shadcn/button"]}'
```

### get-examples

Get usage examples for components.

**Input:**
```typescript
{
  registries: string[];
  query: string;  // e.g., 'button-demo'
}
```

**Example:**
```bash
npm run mcp -- run shadcn get-examples '{"registries":["@shadcn"],"query":"button-demo"}'
```

### get-add-command

Get the `npx shadcn add` command for items.

**Input:**
```typescript
{
  items: string[];  // e.g., ['@shadcn/button', '@shadcn/card']
}
```

**Example:**
```bash
npm run mcp -- run shadcn get-add-command '{"items":["@shadcn/button","@shadcn/card"]}'
```

**Output:**
```json
{
  "success": true,
  "data": {
    "command": "npx shadcn@latest add button card",
    "items": ["button", "card"]
  }
}
```

## Core Types

### MCPToolResult<T>

Standard result type for all tool calls.

```typescript
interface MCPToolResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata: {
    tool: string;
    server: string;
    executionTimeMs: number;
    timestamp: string;
    executionType: 'cli' | 'api';
  };
}
```

### MCPToolDefinition

Tool definition for registry.

```typescript
interface MCPToolDefinition {
  name: string;           // kebab-case tool name
  mcpName: string;        // mcp__server__tool_name
  cliCommand?: string;    // CLI equivalent
  apiEndpoint?: string;   // API URL if applicable
  description: string;
  inputSchema: z.ZodSchema;
  tags: string[];
  examples?: MCPToolExample[];
}
```

### MCPServerManifest

Server manifest with all tools.

```typescript
interface MCPServerManifest {
  name: string;
  description: string;
  version: string;
  cliPrefix?: string;     // e.g., 'npx supabase'
  apiBaseUrl?: string;
  tools: MCPToolDefinition[];
  documentation?: string;
}
```

## Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `CLI_ERROR` | CLI command failed | Invalid command, missing deps |
| `CLI_TIMEOUT` | Command exceeded timeout | Long-running operation |
| `API_ERROR` | API request failed | Network issues, invalid URL |
| `API_TIMEOUT` | Request timed out | Slow server, network issues |
| `HTTP_400` | Bad request | Invalid parameters |
| `HTTP_401` | Unauthorized | Invalid/missing auth token |
| `HTTP_403` | Forbidden | Insufficient permissions |
| `HTTP_404` | Not found | Invalid resource ID |
| `HTTP_500` | Server error | Backend issues |
| `MISSING_CONFIG` | Missing env vars | Env not configured |
| `GRAPHQL_ERROR` | GraphQL query failed | Invalid query |

## Executor Options

### CLIExecutorOptions

```typescript
interface CLIExecutorOptions {
  timeout?: number;       // Default: 30000ms
  cwd?: string;           // Working directory
  env?: Record<string, string>;  // Extra env vars
  parseJson?: boolean;    // Parse stdout as JSON (default: true)
}
```

### APIExecutorOptions

```typescript
interface APIExecutorOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;       // Default: 30000ms
}
```

## Helper Functions

### buildCommand

Build CLI command string from parts.

```typescript
import { buildCommand } from './scripts/mcp/core/executor';

const cmd = buildCommand('npx supabase', 'db dump', {
  schema: ['public', 'auth'],
  'data-only': false,
});
// Returns: 'npx supabase db dump --schema public,auth'
```

### buildUrl

Build URL with query parameters.

```typescript
import { buildUrl } from './scripts/mcp/core/api-executor';

const url = buildUrl('https://api.example.com/endpoint', {
  param: 'value',
  arr: ['a', 'b'],
});
// Returns: 'https://api.example.com/endpoint?param=value&arr=a&arr=b'
```

### createSuccessResult / createErrorResult

Create standardized results.

```typescript
import { createSuccessResult, createErrorResult } from './scripts/mcp/types';

// Success
return createSuccessResult(data, {
  tool: 'my-tool',
  server: 'my-server',
  executionTimeMs: 100,
  executionType: 'cli',
});

// Error
return createErrorResult({
  code: 'MY_ERROR',
  message: 'Something went wrong',
}, metadata);
```
