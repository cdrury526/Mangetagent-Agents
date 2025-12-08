/**
 * [SERVER_NAME] MCP Tool Types
 *
 * Copy this file to types/[server-name].types.ts and customize.
 *
 * Type definitions for [server-name] MCP tools.
 * These should mirror the actual MCP tool schemas.
 */

// =============================================================================
// tool_name_1
// =============================================================================

/**
 * Input for tool_name_1
 *
 * Document each field with JSDoc comments.
 */
export interface ToolName1Input {
  /** Required parameter description */
  requiredParam: string;

  /** Optional parameter description */
  optionalParam?: string;

  /** Array parameter with default value */
  arrayParam?: string[];
}

/**
 * Output for tool_name_1
 */
export interface ToolName1Output {
  /** Description of result field */
  result: string;

  /** Description of data field */
  data?: unknown;
}

// =============================================================================
// tool_name_2
// =============================================================================

export interface ToolName2Input {
  // Define input fields
}

export interface ToolName2Output {
  // Define output fields
}

// =============================================================================
// Common/Shared Types
// =============================================================================

/**
 * Common enum used across multiple tools
 */
export type CommonStatusType = 'pending' | 'active' | 'completed' | 'failed';

/**
 * Common interface used across multiple tools
 */
export interface CommonMetadata {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Type Guards (Optional)
// =============================================================================

/**
 * Type guard to check if value is ToolName1Output
 */
export function isToolName1Output(value: unknown): value is ToolName1Output {
  return (
    typeof value === 'object' &&
    value !== null &&
    'result' in value &&
    typeof (value as ToolName1Output).result === 'string'
  );
}

/**
 * Best Practices for Type Definitions:
 *
 * 1. Use descriptive interface names: [ToolName][Input|Output]
 * 2. Document all fields with JSDoc comments
 * 3. Use optional (?) for non-required fields
 * 4. Define enums for constrained string values
 * 5. Create shared types for common patterns
 * 6. Add type guards for runtime validation
 * 7. Mirror the actual MCP tool schema structure
 */
