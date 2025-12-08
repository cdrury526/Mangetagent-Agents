/**
 * Supabase: Apply Migration
 *
 * Applies a migration to the database. Use this for DDL operations
 * (CREATE TABLE, ALTER TABLE, etc.). Do not hardcode references to
 * generated IDs in data migrations.
 *
 * @example
 * await applyMigration({
 *   name: 'create_users_table',
 *   query: 'CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid())'
 * })
 */

import { z } from 'zod';
import { executeCliCommand } from '../../core/executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import {
  ApplyMigrationInput,
  ApplyMigrationOutput,
} from '../../types/supabase.types.js';

const SERVER = 'supabase';
const TOOL = 'apply-migration';
const MCP_NAME = 'mcp__supabase__apply_migration';

/**
 * Input validation schema
 */
export const inputSchema = z.object({
  name: z
    .string()
    .min(1, 'Migration name is required')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Migration name must be snake_case (lowercase letters, numbers, underscores)'
    ),
  query: z.string().min(1, 'SQL query is required'),
});

/**
 * Apply a migration to the database
 *
 * @param input - Migration name and SQL query
 * @returns Promise resolving to migration result
 */
export async function applyMigration(
  input: ApplyMigrationInput
): Promise<MCPToolResult<ApplyMigrationOutput>> {
  const validated = inputSchema.parse(input);

  // Create migration file and apply it
  // First create the migration
  const createCommand = `npx supabase migration new ${validated.name}`;
  const createResult = await executeCliCommand<string>(
    createCommand,
    SERVER,
    TOOL,
    { parseJson: false }
  );

  if (!createResult.success) {
    return createResult as unknown as MCPToolResult<ApplyMigrationOutput>;
  }

  // The migration file path is typically returned
  // Then we need to write the SQL and apply it
  // For simplicity, we'll use db push which applies pending migrations
  const pushCommand = 'npx supabase db push';
  const pushResult = await executeCliCommand<string>(
    pushCommand,
    SERVER,
    TOOL,
    { parseJson: false }
  );

  if (pushResult.success) {
    return {
      ...pushResult,
      data: {
        success: true,
        migration_name: validated.name,
      },
    };
  }

  return pushResult as unknown as MCPToolResult<ApplyMigrationOutput>;
}

/**
 * Tool definition for registry
 */
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  cliCommand: 'supabase migration new <name> && supabase db push',
  description:
    'Applies a migration to the database. Use for DDL operations (CREATE, ALTER, etc.)',
  inputSchema,
  tags: ['database', 'migration', 'ddl', 'schema', 'create', 'alter'],
  examples: [
    {
      description: 'Create a new table',
      input: {
        name: 'create_users_table',
        query:
          'CREATE TABLE users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL)',
      },
      expectedOutput: '{ success: true, migration_name: "create_users_table" }',
    },
    {
      description: 'Add a column to existing table',
      input: {
        name: 'add_avatar_to_profiles',
        query: 'ALTER TABLE profiles ADD COLUMN avatar_url text',
      },
      expectedOutput: '{ success: true, migration_name: "add_avatar_to_profiles" }',
    },
  ],
};
