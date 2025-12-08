/**
 * Supabase MCP Tool Types
 *
 * Type definitions for Supabase MCP tools.
 * These mirror the actual MCP tool schemas.
 */

// =============================================================================
// list_tables
// =============================================================================

export interface ListTablesInput {
  /** List of schemas to include. Defaults to ['public'] */
  schemas?: string[];
}

export interface TableColumn {
  name: string;
  data_type: string;
  format: string;
  options: string[];
  default_value?: string;
  comment?: string;
  enums?: string[];
  check?: string;
}

export interface TableDefinition {
  schema: string;
  name: string;
  rls_enabled: boolean;
  rows: number;
  columns: TableColumn[];
  primary_keys: string[];
  comment?: string;
  foreign_key_constraints?: Array<{
    name: string;
    source: string;
    target: string;
  }>;
}

export type ListTablesOutput = TableDefinition[];

// =============================================================================
// execute_sql
// =============================================================================

export interface ExecuteSQLInput {
  /** The SQL query to execute */
  query: string;
}

/** Output varies based on query - typically array of row objects */
export type ExecuteSQLOutput = unknown[];

// =============================================================================
// apply_migration
// =============================================================================

export interface ApplyMigrationInput {
  /** The name of the migration in snake_case */
  name: string;
  /** The SQL query to apply */
  query: string;
}

export interface ApplyMigrationOutput {
  success: boolean;
  migration_name: string;
  version?: string;
}

// =============================================================================
// get_logs
// =============================================================================

export type LogServiceType =
  | 'api'
  | 'branch-action'
  | 'postgres'
  | 'edge-function'
  | 'auth'
  | 'storage'
  | 'realtime';

export interface GetLogsInput {
  /** The service to fetch logs for */
  service: LogServiceType;
}

export interface LogEntry {
  timestamp: string;
  event_message?: string;
  level?: string;
  path?: string;
  method?: string;
  status_code?: number;
  metadata?: Record<string, unknown>;
}

export type GetLogsOutput = LogEntry[];

// =============================================================================
// get_advisors
// =============================================================================

export type AdvisorType = 'security' | 'performance';

export interface GetAdvisorsInput {
  /** The type of advisors to fetch */
  type: AdvisorType;
}

export interface AdvisoryNotice {
  id: string;
  name: string;
  title: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  facing: string;
  categories: string[];
  description: string;
  detail: string;
  remediation: string;
  metadata?: {
    schema?: string;
    table?: string;
    column?: string;
    type?: string;
  };
}

export type GetAdvisorsOutput = AdvisoryNotice[];

// =============================================================================
// generate_typescript_types
// =============================================================================

export interface GenerateTypesInput {
  /** No input required - uses project configuration */
}

/** Returns TypeScript type definitions as a string */
export type GenerateTypesOutput = string;

// =============================================================================
// list_extensions
// =============================================================================

export interface ListExtensionsInput {
  /** No input required */
}

export interface ExtensionDefinition {
  name: string;
  comment: string;
  default_version: string;
  installed_version: string | null;
  schema: string | null;
}

export type ListExtensionsOutput = ExtensionDefinition[];

// =============================================================================
// list_migrations
// =============================================================================

export interface ListMigrationsInput {
  /** No input required */
}

export interface MigrationDefinition {
  version: string;
  name: string;
  statements: string[];
}

export type ListMigrationsOutput = MigrationDefinition[];

// =============================================================================
// search_docs
// =============================================================================

export interface SearchDocsInput {
  /** GraphQL query string for searching Supabase docs */
  graphql_query: string;
}

export interface DocSearchResult {
  title: string | null;
  href: string | null;
  content: string | null;
}

export type SearchDocsOutput = {
  nodes: DocSearchResult[];
  totalCount: number;
};

// =============================================================================
// Storage Types
// =============================================================================

export interface StorageBucket {
  id: string;
  name: string;
  owner: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
}

export type ListStorageBucketsOutput = StorageBucket[];

export interface StorageConfig {
  fileSizeLimit: number;
  features: {
    imageTransformation: { enabled: boolean };
    s3Protocol: { enabled: boolean };
  };
}

// =============================================================================
// Edge Functions Types
// =============================================================================

export interface EdgeFunction {
  id: string;
  slug: string;
  name: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export type ListEdgeFunctionsOutput = EdgeFunction[];

export interface EdgeFunctionFile {
  name: string;
  content: string;
}

export interface GetEdgeFunctionInput {
  function_slug: string;
}

export interface DeployEdgeFunctionInput {
  name: string;
  files: EdgeFunctionFile[];
  entrypoint_path?: string;
  import_map_path?: string;
}
