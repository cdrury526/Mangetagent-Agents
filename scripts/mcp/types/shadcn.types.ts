/**
 * shadcn MCP Tool Types
 *
 * Type definitions for shadcn/ui MCP tools.
 * These mirror the actual MCP tool schemas.
 */

// =============================================================================
// Common Types
// =============================================================================

export interface RegistryItem {
  name: string;
  type: 'registry:ui' | 'registry:component' | 'registry:example' | 'registry:block' | 'registry:hook' | 'registry:lib';
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryItemFile[];
  tailwind?: {
    config?: Record<string, unknown>;
  };
  cssVars?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}

export interface RegistryItemFile {
  path: string;
  content: string;
  type: 'registry:ui' | 'registry:component' | 'registry:example' | 'registry:block' | 'registry:hook' | 'registry:lib';
  target?: string;
}

// =============================================================================
// get_project_registries
// =============================================================================

export interface GetProjectRegistriesInput {
  /** No input required */
}

export type GetProjectRegistriesOutput = string[];

// =============================================================================
// list_items_in_registries
// =============================================================================

export interface ListItemsInput {
  /** Array of registry names to search (e.g., ['@shadcn', '@acme']) */
  registries: string[];
  /** Maximum number of items to return */
  limit?: number;
  /** Number of items to skip for pagination */
  offset?: number;
}

export interface ListItemsResult {
  name: string;
  type: string;
  description?: string;
  registry: string;
}

export type ListItemsOutput = ListItemsResult[];

// =============================================================================
// search_items_in_registries
// =============================================================================

export interface SearchItemsInput {
  /** Array of registry names to search */
  registries: string[];
  /** Search query string for fuzzy matching */
  query: string;
  /** Maximum number of items to return */
  limit?: number;
  /** Number of items to skip for pagination */
  offset?: number;
}

export interface SearchItemsResult {
  name: string;
  type: string;
  description?: string;
  registry: string;
  score?: number;
}

export type SearchItemsOutput = SearchItemsResult[];

// =============================================================================
// view_items_in_registries
// =============================================================================

export interface ViewItemsInput {
  /** Array of item names with registry prefix (e.g., ['@shadcn/button', '@shadcn/card']) */
  items: string[];
}

export interface ViewItemResult {
  name: string;
  type: string;
  description?: string;
  registry: string;
  files: RegistryItemFile[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
}

export type ViewItemsOutput = ViewItemResult[];

// =============================================================================
// get_item_examples_from_registries
// =============================================================================

export interface GetExamplesInput {
  /** Array of registry names to search */
  registries: string[];
  /** Search query for examples (e.g., 'accordion-demo', 'button example') */
  query: string;
}

export interface ExampleResult {
  name: string;
  description?: string;
  registry: string;
  files: RegistryItemFile[];
  dependencies?: string[];
}

export type GetExamplesOutput = ExampleResult[];

// =============================================================================
// get_add_command_for_items
// =============================================================================

export interface GetAddCommandInput {
  /** Array of items to get the add command for (e.g., ['@shadcn/button', '@shadcn/card']) */
  items: string[];
}

export interface AddCommandResult {
  command: string;
  items: string[];
}

export type GetAddCommandOutput = AddCommandResult;

// =============================================================================
// init_project (if needed)
// =============================================================================

export interface InitProjectInput {
  /** Project directory path */
  cwd?: string;
  /** Use default configuration */
  defaults?: boolean;
  /** Force overwrite existing files */
  force?: boolean;
}

export interface InitProjectOutput {
  success: boolean;
  message: string;
  componentsJsonPath?: string;
}

// =============================================================================
// Audit Checklist
// =============================================================================

export interface AuditChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'pass' | 'fail';
}

export type GetAuditChecklistOutput = AuditChecklistItem[];
