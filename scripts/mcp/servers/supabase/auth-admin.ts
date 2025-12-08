/**
 * Supabase: Auth Admin API
 *
 * Manage users via the Supabase Auth Admin API.
 * Uses the service role key for administrative operations.
 *
 * @example
 * await createUser({ email: 'user@example.com', password: 'pass123', email_confirm: true })
 * await listUsers({ page: 1, per_page: 50 })
 * await getUser({ id: 'user-uuid' })
 * await updateUser({ id: 'user-uuid', email: 'newemail@example.com' })
 * await deleteUser({ id: 'user-uuid' })
 */

import { z } from 'zod';
import { executeApiCall } from '../../core/api-executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { validateConfig, isErrorResult, getRestHeaders } from './config.js';

const SERVER = 'supabase';

// =============================================================================
// Create User
// =============================================================================

const TOOL_CREATE = 'create-user';

export const createUserInputSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email_confirm: z.boolean().default(true).optional(),
  user_metadata: z.record(z.unknown()).optional(),
  app_metadata: z.record(z.unknown()).optional(),
});

export interface CreateUserInput {
  email: string;
  password: string;
  email_confirm?: boolean;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
  banned_until: string | null;
}

export type CreateUserOutput = AuthUser;

/**
 * Create a new user with email and password
 */
export async function createUser(
  input: CreateUserInput
): Promise<MCPToolResult<CreateUserOutput>> {
  const validated = createUserInputSchema.parse(input);

  const configOrError = validateConfig<CreateUserOutput>(SERVER, TOOL_CREATE);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/auth/v1/admin/users`;

  return executeApiCall<CreateUserOutput>(url, SERVER, TOOL_CREATE, {
    method: 'POST',
    headers: getRestHeaders(config, true),
    body: {
      email: validated.email,
      password: validated.password,
      email_confirm: validated.email_confirm,
      user_metadata: validated.user_metadata,
      app_metadata: validated.app_metadata,
    },
  });
}

export const createUserDefinition: MCPToolDefinition = {
  name: TOOL_CREATE,
  mcpName: 'mcp__supabase__create_user',
  apiEndpoint: '{SUPABASE_URL}/auth/v1/admin/users',
  description: 'Create a new user with email and password (uses service role key)',
  inputSchema: createUserInputSchema,
  tags: ['auth', 'admin', 'users', 'create', 'api'],
  examples: [
    {
      description: 'Create user with auto-confirmed email',
      input: {
        email: 'agent@example.com',
        password: 'secure123',
        email_confirm: true,
      },
      expectedOutput: '{ id: "uuid", email: "agent@example.com", ... }',
    },
    {
      description: 'Create user with metadata',
      input: {
        email: 'agent@example.com',
        password: 'secure123',
        email_confirm: true,
        user_metadata: { first_name: 'John', last_name: 'Doe' },
        app_metadata: { role: 'agent' },
      },
      expectedOutput: '{ id: "uuid", email: "agent@example.com", user_metadata: {...}, ... }',
    },
  ],
};

// =============================================================================
// List Users
// =============================================================================

const TOOL_LIST = 'list-users';

export const listUsersInputSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  per_page: z.number().min(1).max(1000).default(50).optional(),
});

export interface ListUsersInput {
  page?: number;
  per_page?: number;
}

export interface ListUsersOutput {
  users: AuthUser[];
  total: number;
}

/**
 * List all users (paginated)
 */
export async function listUsers(
  input: ListUsersInput = {}
): Promise<MCPToolResult<ListUsersOutput>> {
  const validated = listUsersInputSchema.parse(input);

  const configOrError = validateConfig<ListUsersOutput>(SERVER, TOOL_LIST);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  // Apply defaults for undefined values
  const page = validated.page ?? 1;
  const perPage = validated.per_page ?? 50;
  const url = `${config.url}/auth/v1/admin/users?page=${page}&per_page=${perPage}`;

  return executeApiCall<ListUsersOutput>(url, SERVER, TOOL_LIST, {
    method: 'GET',
    headers: getRestHeaders(config, true),
  });
}

export const listUsersDefinition: MCPToolDefinition = {
  name: TOOL_LIST,
  mcpName: 'mcp__supabase__list_users',
  apiEndpoint: '{SUPABASE_URL}/auth/v1/admin/users',
  description: 'List all users with pagination (uses service role key)',
  inputSchema: listUsersInputSchema,
  tags: ['auth', 'admin', 'users', 'list', 'api'],
  examples: [
    {
      description: 'List first 50 users',
      input: { page: 1, per_page: 50 },
      expectedOutput: '{ users: [...], total: 150 }',
    },
    {
      description: 'List page 2 with 100 users per page',
      input: { page: 2, per_page: 100 },
      expectedOutput: '{ users: [...], total: 150 }',
    },
  ],
};

// =============================================================================
// Get User
// =============================================================================

const TOOL_GET = 'get-user';

export const getUserInputSchema = z.object({
  id: z.string().uuid('Valid user UUID is required'),
});

export interface GetUserInput {
  id: string;
}

export type GetUserOutput = AuthUser;

/**
 * Get a user by ID
 */
export async function getUser(
  input: GetUserInput
): Promise<MCPToolResult<GetUserOutput>> {
  const validated = getUserInputSchema.parse(input);

  const configOrError = validateConfig<GetUserOutput>(SERVER, TOOL_GET);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/auth/v1/admin/users/${validated.id}`;

  return executeApiCall<GetUserOutput>(url, SERVER, TOOL_GET, {
    method: 'GET',
    headers: getRestHeaders(config, true),
  });
}

export const getUserDefinition: MCPToolDefinition = {
  name: TOOL_GET,
  mcpName: 'mcp__supabase__get_user',
  apiEndpoint: '{SUPABASE_URL}/auth/v1/admin/users/{id}',
  description: 'Get a user by UUID (uses service role key)',
  inputSchema: getUserInputSchema,
  tags: ['auth', 'admin', 'users', 'get', 'api'],
  examples: [
    {
      description: 'Get user by ID',
      input: { id: '550e8400-e29b-41d4-a716-446655440000' },
      expectedOutput: '{ id: "550e8400-...", email: "user@example.com", ... }',
    },
  ],
};

// =============================================================================
// Update User
// =============================================================================

const TOOL_UPDATE = 'update-user';

export const updateUserInputSchema = z.object({
  id: z.string().uuid('Valid user UUID is required'),
  email: z.string().email().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  email_confirm: z.boolean().optional(),
  user_metadata: z.record(z.unknown()).optional(),
  app_metadata: z.record(z.unknown()).optional(),
  ban_duration: z.string().optional(),
});

export interface UpdateUserInput {
  id: string;
  email?: string;
  password?: string;
  email_confirm?: boolean;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  ban_duration?: string;
}

export type UpdateUserOutput = AuthUser;

/**
 * Update a user's details
 */
export async function updateUser(
  input: UpdateUserInput
): Promise<MCPToolResult<UpdateUserOutput>> {
  const validated = updateUserInputSchema.parse(input);

  const configOrError = validateConfig<UpdateUserOutput>(SERVER, TOOL_UPDATE);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/auth/v1/admin/users/${validated.id}`;

  // Build body with only provided fields
  const body: Record<string, unknown> = {};
  if (validated.email !== undefined) body.email = validated.email;
  if (validated.password !== undefined) body.password = validated.password;
  if (validated.email_confirm !== undefined) body.email_confirm = validated.email_confirm;
  if (validated.user_metadata !== undefined) body.user_metadata = validated.user_metadata;
  if (validated.app_metadata !== undefined) body.app_metadata = validated.app_metadata;
  if (validated.ban_duration !== undefined) body.ban_duration = validated.ban_duration;

  return executeApiCall<UpdateUserOutput>(url, SERVER, TOOL_UPDATE, {
    method: 'PUT',
    headers: getRestHeaders(config, true),
    body,
  });
}

export const updateUserDefinition: MCPToolDefinition = {
  name: TOOL_UPDATE,
  mcpName: 'mcp__supabase__update_user',
  apiEndpoint: '{SUPABASE_URL}/auth/v1/admin/users/{id}',
  description: 'Update a user (email, password, metadata, ban status) using service role key',
  inputSchema: updateUserInputSchema,
  tags: ['auth', 'admin', 'users', 'update', 'api'],
  examples: [
    {
      description: 'Update user email',
      input: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'newemail@example.com',
      },
      expectedOutput: '{ id: "550e8400-...", email: "newemail@example.com", ... }',
    },
    {
      description: 'Ban user for 24 hours',
      input: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ban_duration: '24h',
      },
      expectedOutput: '{ id: "550e8400-...", banned_until: "2025-12-02T...", ... }',
    },
    {
      description: 'Unban user',
      input: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ban_duration: 'none',
      },
      expectedOutput: '{ id: "550e8400-...", banned_until: null, ... }',
    },
    {
      description: 'Update user metadata',
      input: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        user_metadata: { phone: '+1234567890' },
      },
      expectedOutput: '{ id: "550e8400-...", user_metadata: { phone: "+1234567890" }, ... }',
    },
  ],
};

// =============================================================================
// Delete User
// =============================================================================

const TOOL_DELETE = 'delete-user';

export const deleteUserInputSchema = z.object({
  id: z.string().uuid('Valid user UUID is required'),
});

export interface DeleteUserInput {
  id: string;
}

export interface DeleteUserOutput {
  message: string;
}

/**
 * Delete a user permanently
 */
export async function deleteUser(
  input: DeleteUserInput
): Promise<MCPToolResult<DeleteUserOutput>> {
  const validated = deleteUserInputSchema.parse(input);

  const configOrError = validateConfig<DeleteUserOutput>(SERVER, TOOL_DELETE);
  if (isErrorResult(configOrError)) return configOrError;
  const config = configOrError;

  const url = `${config.url}/auth/v1/admin/users/${validated.id}`;

  return executeApiCall<DeleteUserOutput>(url, SERVER, TOOL_DELETE, {
    method: 'DELETE',
    headers: getRestHeaders(config, true),
  });
}

export const deleteUserDefinition: MCPToolDefinition = {
  name: TOOL_DELETE,
  mcpName: 'mcp__supabase__delete_user',
  apiEndpoint: '{SUPABASE_URL}/auth/v1/admin/users/{id}',
  description: 'Delete a user permanently (uses service role key)',
  inputSchema: deleteUserInputSchema,
  tags: ['auth', 'admin', 'users', 'delete', 'api'],
  examples: [
    {
      description: 'Delete user by ID',
      input: { id: '550e8400-e29b-41d4-a716-446655440000' },
      expectedOutput: '{ message: "User deleted successfully" }',
    },
  ],
};
