# MCP Code Execution Bridge

This bridge allows Claude Code to interact with MCP servers (Supabase, shadcn) through CLI wrapper scripts instead of loading all tool definitions into context, reducing context overhead while maintaining reliability.

## Quick Start

```bash
# List available servers
npx tsx scripts/mcp/cli/mcp-tool.ts list-servers

# List tools for a server
npx tsx scripts/mcp/cli/mcp-tool.ts list-tools supabase

# Run a tool
npx tsx scripts/mcp/cli/mcp-tool.ts run supabase list-tables '{"schemas":["public"]}'

# Search for tools
npx tsx scripts/mcp/cli/mcp-tool.ts search "database"
```

## MCP Unified Server

The MCP Unified Server provides a REST API and WebUI for all MCP tools with hot reload support.

### Starting the Server

```bash
npm run mcp:server
```

The server starts on `http://localhost:3456` (configurable via `MCP_SERVER_PORT` environment variable).

### Features

- **REST API** - Execute all 34 MCP tools via HTTP
- **Hot Reload** - Automatically reloads when registry changes (no restart needed)
- **WebUI** - Monitoring dashboard for tool execution (coming soon)
- **Execution History** - Tracks last 100 tool executions
- **Single Instance** - Lock file prevents multiple servers on same port

### API Endpoints

```bash
# Server Discovery
GET  /mcp/servers                           # List all servers
GET  /mcp/servers/:server                   # Get server manifest
GET  /mcp/servers/:server/tools             # List tools for server
GET  /mcp/servers/:server/tools/:tool       # Get tool definition
GET  /mcp/tools/search?q=query              # Search tools

# Registry Metadata
GET  /mcp/stats                             # Get registry stats

# Tool Execution
POST /mcp/servers/:server/tools/:tool/run   # Execute a tool

# History & Monitoring
GET  /mcp/history                           # Get execution history
GET  /mcp/health                            # Health check
POST /mcp/reload                            # Manually reload registry
```

### API Examples

```bash
# Get server stats
curl http://localhost:3456/mcp/stats

# Search for tools
curl "http://localhost:3456/mcp/tools/search?q=database"

# Execute a tool
curl -X POST http://localhost:3456/mcp/servers/supabase/tools/query-table/run \
  -H "Content-Type: application/json" \
  -d '{"table":"profiles","limit":10}'

# Manual reload (after regenerating registry)
curl -X POST http://localhost:3456/mcp/reload
```

### Hot Reload

The server automatically detects changes to `registry.json` and tool files:

```bash
# Start server in one terminal
npm run mcp:server

# In another terminal, regenerate registry
npm run mcp:registry

# Server logs show:
# "Registry file changed, scheduling reload..."
# "Registry reloaded successfully"

# Stats endpoint now reflects new registry without restart
curl http://localhost:3456/mcp/stats
```

**What's Hot Reloaded:**
- Registry file changes (`registry.json`)
- Registry metadata updates (tool count, lastUpdated)

**What Requires Restart:**
- Tool code changes (TypeScript files)
- Server configuration (port, environment)
- Dependency updates

See `Docs/Plans/mcp-hot-reload-implementation.md` for detailed documentation.

## Available Servers

### Supabase (`servers/supabase/`)
Database, auth, storage, and edge functions management. **29 tools total** (23 API-based + 6 CLI-based).

#### PostgREST API Tools (Service Role Key)
| Tool | Description |
|------|-------------|
| `query-table` | Query a table with filters, select, order, limit |
| `insert-row` | Insert a row into a table |
| `update-rows` | Update rows (filter required) |
| `delete-rows` | Delete rows (filter required) |

#### Storage API Tools (Service Role Key)
| Tool | Description |
|------|-------------|
| `list-buckets` | List all storage buckets |
| `create-bucket` | Create a new bucket |
| `delete-bucket` | Delete a bucket (must be empty) |
| `get-bucket` | Get bucket details |
| `list-files` | List files in bucket/folder |
| `delete-file` | Delete one or more files |
| `move-file` | Move/rename a file |
| `get-public-url` | Get public URL for a file |
| `create-signed-url` | Create temporary signed URL |
| `upload-file` | Upload file (base64-encoded) **NEW** |
| `download-file` | Download file as base64 **NEW** |

#### Edge Functions API Tools **NEW**
| Tool | Description |
|------|-------------|
| `invoke-function` | Invoke Edge Function with payload (anon or service role) |
| `list-functions` | List deployed Edge Functions (Management API) |

#### Auth Admin API Tools (Service Role Key)
| Tool | Description |
|------|-------------|
| `create-user` | Create user with email/password |
| `list-users` | List all users (paginated) |
| `get-user` | Get user by UUID |
| `update-user` | Update user details, metadata, ban status |
| `delete-user` | Delete user permanently |

#### Management API Tools (Access Token)
| Tool | Description |
|------|-------------|
| `run-sql` | Execute ANY SQL query (most powerful) |

#### CLI-Based Tools (Local Supabase)
| Tool | Description |
|------|-------------|
| `list-tables` | List tables in schemas |
| `execute-sql` | Execute raw SQL |
| `apply-migration` | Apply a migration |
| `get-logs` | Get service logs |
| `get-advisors` | Get security/performance advisors |
| `generate-types` | Generate TypeScript types |

### shadcn (`servers/shadcn/`)
UI component registry and installation.

| Tool | Description | CLI Equivalent |
|------|-------------|----------------|
| `search-items` | Search component registry | `npx shadcn@latest search` |
| `view-items` | View component details | `npx shadcn@latest info` |
| `get-examples` | Get usage examples | `npx shadcn@latest examples` |
| `get-add-command` | Get install command | `npx shadcn@latest add` |

## Usage Examples

### Auth Admin API Examples

```bash
# Create a new user with auto-confirmed email
npm run mcp -- run supabase create-user '{
  "email": "agent@example.com",
  "password": "secure123",
  "email_confirm": true,
  "user_metadata": { "first_name": "John", "last_name": "Doe" },
  "app_metadata": { "role": "agent" }
}'

# List all users (paginated)
npm run mcp -- run supabase list-users '{"page": 1, "per_page": 50}'

# Get a specific user by UUID
npm run mcp -- run supabase get-user '{"id": "550e8400-e29b-41d4-a716-446655440000"}'

# Update user email
npm run mcp -- run supabase update-user '{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newemail@example.com"
}'

# Ban user for 24 hours
npm run mcp -- run supabase update-user '{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ban_duration": "24h"
}'

# Unban user
npm run mcp -- run supabase update-user '{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "ban_duration": "none"
}'

# Delete user permanently
npm run mcp -- run supabase delete-user '{"id": "550e8400-e29b-41d4-a716-446655440000"}'
```

### Database Operations

```bash
# Query a table
npm run mcp -- run supabase query-table '{"table": "profiles", "limit": 10}'

# Query with filter
npm run mcp -- run supabase query-table '{
  "table": "transactions",
  "filter": "status=eq.active",
  "limit": 20
}'

# Insert a row
npm run mcp -- run supabase insert-row '{
  "table": "contacts",
  "data": { "name": "John Doe", "email": "john@example.com" }
}'

# Update rows
npm run mcp -- run supabase update-rows '{
  "table": "profiles",
  "filter": "id=eq.abc123",
  "data": { "name": "Updated Name" }
}'

# Delete rows
npm run mcp -- run supabase delete-rows '{
  "table": "contacts",
  "filter": "id=eq.abc123"
}'
```

### Storage Operations

```bash
# List files in bucket
npm run mcp -- run supabase list-files '{"bucket": "documents", "path": ""}'

# Get public URL
npm run mcp -- run supabase get-public-url '{
  "bucket": "images",
  "path": "logo.png"
}'

# Create signed URL (1 hour expiry)
npm run mcp -- run supabase create-signed-url '{
  "bucket": "documents",
  "path": "contract.pdf",
  "expiresIn": 3600
}'
```

## Directory Structure

```
scripts/mcp/
├── README.md              # This file
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── registry.json          # Auto-generated tool registry
├── types/                 # Type definitions
│   ├── index.ts           # Core types
│   ├── supabase.types.ts  # Supabase tool types
│   └── shadcn.types.ts    # shadcn tool types
├── core/                  # Core infrastructure
│   ├── executor.ts        # CLI command executor
│   ├── api-executor.ts    # API fallback executor
│   └── discovery.ts       # Tool discovery
├── servers/               # Server implementations
│   ├── supabase/          # Supabase tools
│   └── shadcn/            # shadcn tools
├── cli/                   # CLI entry points
│   ├── mcp-tool.ts        # Main CLI
│   └── generate-registry.ts
└── templates/             # Templates for new tools
```

## Adding New Tools

### Adding a Tool to Existing Server

1. Add types to `types/<server>.types.ts`
2. Create wrapper at `servers/<server>/<tool-name>.ts`
3. Export from `servers/<server>/index.ts`
4. Run `npm run generate-registry`

### Adding a New Server

1. Create `servers/<server>/` directory
2. Create `types/<server>.types.ts`
3. Copy from `templates/server-template.ts`
4. Run `npm run generate-registry`

## How It Works

1. Claude Code reads this README to understand available tools
2. Explores `servers/` directory to find specific tools
3. Reads individual tool files for type definitions and usage
4. Executes tools via CLI or imports TypeScript functions directly

This follows the "Code Execution with MCP" pattern for progressive disclosure and context efficiency.
