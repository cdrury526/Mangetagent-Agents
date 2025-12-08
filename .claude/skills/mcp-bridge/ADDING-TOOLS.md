# Adding New MCP Tools

Step-by-step guide for adding new tools to the MCP Code Execution Bridge.

## Adding a Tool to an Existing Server

### Step 1: Define Types

Add input/output types to `scripts/mcp/types/<server>.types.ts`:

```typescript
// scripts/mcp/types/supabase.types.ts

// Add your new types
export interface NewToolInput {
  /** Required parameter description */
  requiredParam: string;
  /** Optional parameter */
  optionalParam?: string;
}

export interface NewToolOutput {
  result: string;
  data?: unknown;
}
```

### Step 2: Create the Tool Wrapper

Create `scripts/mcp/servers/<server>/<tool-name>.ts`:

```typescript
/**
 * Supabase: New Tool
 *
 * Description of what this tool does.
 *
 * @example
 * await newTool({ requiredParam: 'value' })
 */

import { z } from 'zod';
import { executeCliCommand, buildCommand } from '../../core/executor.js';
import { MCPToolDefinition, MCPToolResult } from '../../types/index.js';
import { NewToolInput, NewToolOutput } from '../../types/supabase.types.js';

const SERVER = 'supabase';
const TOOL = 'new-tool';
const MCP_NAME = 'mcp__supabase__new_tool';

// Input validation
export const inputSchema = z.object({
  requiredParam: z.string().min(1, 'Required param is required'),
  optionalParam: z.string().optional(),
});

// Main function
export async function newTool(
  input: NewToolInput
): Promise<MCPToolResult<NewToolOutput>> {
  const validated = inputSchema.parse(input);

  const command = buildCommand('npx supabase', 'subcommand', {
    param: validated.requiredParam,
  });

  return executeCliCommand<NewToolOutput>(command, SERVER, TOOL);
}

// Tool definition for registry
export const toolDefinition: MCPToolDefinition = {
  name: TOOL,
  mcpName: MCP_NAME,
  cliCommand: 'supabase subcommand --param <value>',
  description: 'Description for discovery',
  inputSchema,
  tags: ['relevant', 'tags', 'for', 'search'],
  examples: [
    {
      description: 'Example usage',
      input: { requiredParam: 'value' },
      expectedOutput: '{ result: "..." }',
    },
  ],
};
```

### Step 3: Export from Server Index

Update `scripts/mcp/servers/<server>/index.ts`:

```typescript
// Add export
export * from './new-tool.js';

// Import definition
import { toolDefinition as newToolDefinition } from './new-tool.js';

// Add to manifest.tools array
export const manifest: MCPServerManifest = {
  // ...
  tools: [
    // existing tools...
    newToolDefinition,
  ],
};
```

### Step 4: Regenerate Registry

```bash
npm run mcp:registry
```

### Step 5: Test

```bash
# Verify it appears in the registry
npm run mcp -- describe supabase new-tool

# Test execution
npm run mcp -- run supabase new-tool '{"requiredParam":"test"}'
```

## Adding a New Server

### Step 1: Create Server Directory

```bash
mkdir -p scripts/mcp/servers/new-server
```

### Step 2: Create Types

Create `scripts/mcp/types/new-server.types.ts`:

```typescript
/**
 * NewServer MCP Tool Types
 */

export interface Tool1Input {
  param: string;
}

export interface Tool1Output {
  result: string;
}

// Add more types as needed
```

### Step 3: Create Server Index

Create `scripts/mcp/servers/new-server/index.ts`:

```typescript
/**
 * NewServer MCP Server
 *
 * Description of what this server provides.
 */

import { MCPServerManifest } from '../../types/index.js';

// Export tools
export * from './tool1.js';

// Import definitions
import { toolDefinition as tool1Definition } from './tool1.js';

export const manifest: MCPServerManifest = {
  name: 'new-server',
  description: 'Description for discovery',
  version: '1.0.0',
  cliPrefix: 'cli-command', // e.g., 'gh', 'stripe'
  tools: [tool1Definition],
  documentation: 'https://docs.example.com',
};
```

### Step 4: Create Tool Files

Use the template at `scripts/mcp/templates/tool-template.ts` as a starting point.

### Step 5: Register the Server

Update `scripts/mcp/servers/index.ts`:

```typescript
// Add export
export * as newServer from './new-server/index.js';

// Import manifest
import { manifest as newServerManifest } from './new-server/index.js';

// Add to manifests
export const manifests = {
  supabase: supabaseManifest,
  shadcn: shadcnManifest,
  newServer: newServerManifest,  // Add here
};
```

### Step 6: Regenerate Registry

```bash
npm run mcp:registry
```

## CLI vs API Execution

### CLI-Based Tools

Use `executeCliCommand` for tools with CLI equivalents:

```typescript
import { executeCliCommand, buildCommand } from '../../core/executor.js';

export async function myTool(input: Input) {
  const command = buildCommand('cli-base', 'subcommand', {
    flag: input.value,
  });
  return executeCliCommand<Output>(command, SERVER, TOOL);
}
```

### API-Based Tools

Use `executeApiCall` for tools requiring HTTP requests:

```typescript
import { executeApiCall, buildUrl } from '../../core/api-executor.js';

export async function myTool(input: Input) {
  const url = buildUrl('https://api.example.com/endpoint', {
    param: input.value,
  });
  return executeApiCall<Output>(url, SERVER, TOOL, {
    headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
  });
}
```

### Hybrid Approach

Some tools may need both:

```typescript
export async function myTool(input: Input) {
  // Try CLI first
  const cliResult = await executeCliCommand<Output>(command, SERVER, TOOL);

  if (cliResult.success) {
    return cliResult;
  }

  // Fallback to API
  return executeApiCall<Output>(url, SERVER, TOOL, options);
}
```

## Best Practices

### 1. Use Descriptive Names

```typescript
// Good
name: 'list-storage-buckets'
mcpName: 'mcp__supabase__list_storage_buckets'

// Bad
name: 'lsb'
mcpName: 'mcp__supabase__lsb'
```

### 2. Add Comprehensive Tags

```typescript
tags: ['storage', 'buckets', 'list', 's3', 'files']
```

### 3. Include Examples

```typescript
examples: [
  {
    description: 'List all buckets',
    input: {},
    expectedOutput: '[{ id: "...", name: "..." }]',
  },
  {
    description: 'With specific options',
    input: { publicOnly: true },
    expectedOutput: '[...]',
  },
]
```

### 4. Add Convenience Functions

```typescript
// Main function
export async function listBuckets(input: Input) { ... }

// Convenience wrappers
export async function getPublicBuckets() {
  return listBuckets({ publicOnly: true });
}

export async function getBucketByName(name: string) {
  const result = await listBuckets({});
  if (result.success && result.data) {
    return result.data.find(b => b.name === name);
  }
  return null;
}
```

### 5. Document Environment Requirements

```typescript
/**
 * @requires SUPABASE_PROJECT_REF - Project reference
 * @requires SUPABASE_ACCESS_TOKEN - API access token
 */
export async function myTool(input: Input) {
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  if (!projectRef) {
    return createErrorResult({
      code: 'MISSING_CONFIG',
      message: 'SUPABASE_PROJECT_REF is required',
    }, metadata);
  }
  // ...
}
```

## Templates

Use these templates as starting points:

- `scripts/mcp/templates/server-template.ts` - New server
- `scripts/mcp/templates/tool-template.ts` - New tool
- `scripts/mcp/templates/types-template.ts` - Type definitions

## Troubleshooting

### Tool Not Found

1. Check exports in server `index.ts`
2. Verify registry was regenerated: `npm run mcp:registry`
3. Check for TypeScript errors: `cd scripts/mcp && npx tsc --noEmit`

### CLI Command Fails

1. Test command manually first
2. Check `buildCommand` output
3. Verify environment variables
4. Check timeout settings

### Types Not Matching

1. Verify Zod schema matches TypeScript interface
2. Check JSON parsing in executor
3. Review CLI output format
