# MCP Unified Server

HTTP REST API server that exposes all MCP tools for unified access.

## Features

- **REST API** for all 34 MCP tools (Supabase, shadcn/ui)
- **WebUI Dashboard** for monitoring and debugging at `/ui`
- **Discovery endpoints** for servers, tools, and search
- **Tool execution** with automatic history tracking
- **Hot reload** when new tools are added to the registry
- **Single instance protection** with lock file
- **Graceful shutdown** on SIGINT/SIGTERM
- **Request/response logging** with structured JSON logs
- **CORS enabled** for development

## Quick Start

```bash
# Start the server
npm run mcp:server

# Server runs at http://localhost:3456
# WebUI Dashboard: http://localhost:3456/ui
```

## WebUI Dashboard

The server includes a modern web dashboard for monitoring and interacting with MCP tools:

**Access:** http://localhost:3456/ui

**Features:**
- Real-time server status (uptime, version, metrics)
- Browse all servers and tools with search
- View tool details (schema, examples, tags)
- Execute tools directly from browser
- View execution history with results
- Auto-refreshing health and history data

See [webui/README.md](webui/README.md) for detailed documentation.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_SERVER_PORT` | `3456` | Port to listen on |
| `NODE_ENV` | - | Set to `production` for production mode |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

## API Endpoints

### Server Discovery

#### GET `/mcp/servers`
List all available MCP servers.

**Response:**
```json
{
  "success": true,
  "data": {
    "servers": ["supabase", "shadcn"]
  }
}
```

#### GET `/mcp/servers/:server`
Get server manifest including version and tools.

**Parameters:**
- `server` (string) - Server name (e.g., `supabase`)

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "supabase",
    "description": "Supabase database, storage, auth...",
    "version": "4.2.0",
    "tools": [...]
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Server 'invalid' not found",
    "details": {
      "availableServers": ["supabase", "shadcn"]
    }
  }
}
```

### Tool Discovery

#### GET `/mcp/servers/:server/tools`
List all tools for a specific server.

**Parameters:**
- `server` (string) - Server name

**Response:**
```json
{
  "success": true,
  "data": {
    "server": "supabase",
    "tools": [
      {
        "name": "query-table",
        "mcpName": "mcp__supabase__query_table",
        "description": "Query a table using Supabase REST API...",
        "tags": ["database", "query", "api"]
      }
    ]
  }
}
```

#### GET `/mcp/servers/:server/tools/:tool`
Get detailed definition for a specific tool.

**Parameters:**
- `server` (string) - Server name
- `tool` (string) - Tool name (kebab-case, e.g., `query-table`)

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "query-table",
    "mcpName": "mcp__supabase__query_table",
    "description": "Query a table using Supabase REST API...",
    "tags": ["database", "query"],
    "examples": [...]
  }
}
```

#### GET `/mcp/tools/search?q=query`
Search for tools by name, description, or tags.

**Query Parameters:**
- `q` (string, required) - Search query

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "database",
    "count": 10,
    "results": [
      {
        "server": "supabase",
        "tool": {
          "name": "query-table",
          "description": "..."
        }
      }
    ]
  }
}
```

### Registry Metadata

#### GET `/mcp/stats`
Get registry statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalServers": 2,
    "totalTools": 34,
    "toolsByServer": {
      "supabase": 30,
      "shadcn": 4
    },
    "lastUpdated": "2025-12-01T17:33:21.320Z"
  }
}
```

### Tool Execution

#### POST `/mcp/servers/:server/tools/:tool/run`
Execute a tool with the provided input.

**Parameters:**
- `server` (string) - Server name
- `tool` (string) - Tool name (kebab-case)

**Request Body:**
JSON object with tool-specific input parameters. Example:

```json
{
  "table": "profiles",
  "limit": 10
}
```

**Response:**
Returns the standard `MCPToolResult<T>` format:

```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "tool": "query-table",
    "server": "supabase",
    "executionTimeMs": 182,
    "timestamp": "2025-12-01T18:15:30.123Z",
    "executionType": "api"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Required field 'table' is missing"
  },
  "metadata": {...}
}
```

### Execution History

#### GET `/mcp/history`
Get execution history (last 100 executions).

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 3,
    "maxSize": 100,
    "history": [
      {
        "id": "uuid-here",
        "timestamp": "2025-12-01T18:15:30.123Z",
        "server": "supabase",
        "tool": "query-table",
        "input": {...},
        "result": {...},
        "durationMs": 182
      }
    ]
  }
}
```

### Health Check

#### GET `/mcp/health`
Server health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "uptime": 128.46,
  "version": "1.0.0",
  "timestamp": "2025-12-01T18:19:27.998Z"
}
```

## Examples

### List All Servers
```bash
curl http://localhost:3456/mcp/servers
```

### Get Supabase Tools
```bash
curl http://localhost:3456/mcp/servers/supabase/tools
```

### Search for Database Tools
```bash
curl "http://localhost:3456/mcp/tools/search?q=database"
```

### Execute a Tool
```bash
curl -X POST http://localhost:3456/mcp/servers/supabase/tools/list-users/run \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Query a Table
```bash
curl -X POST http://localhost:3456/mcp/servers/supabase/tools/query-table/run \
  -H "Content-Type: application/json" \
  -d '{"table":"profiles","limit":5}'
```

### View Execution History
```bash
curl http://localhost:3456/mcp/history
```

## Testing

Run the comprehensive test suite:

```bash
bash scripts/mcp/server/test-api.sh
```

## Architecture

### File Structure

```
scripts/mcp/server/
├── index.ts          # Main server entry point
├── routes.ts         # Route definitions
├── handlers.ts       # Request handlers
├── logger.ts         # Structured logging
├── lock.ts           # Single-instance protection
├── watcher.ts        # File watcher for hot reload
├── test-api.sh       # Test suite
├── webui/            # WebUI dashboard
│   ├── index.html    # Single-page dashboard app
│   └── README.md     # WebUI documentation
└── README.md         # This file
```

### Components

**index.ts** - Server initialization
- Fastify setup with CORS
- Static file serving for WebUI
- Request/response logging middleware
- Error handling
- Graceful shutdown

**routes.ts** - Route registration
- All API routes defined in one place
- Clean separation of routing and logic

**handlers.ts** - Request handling logic
- Discovery handlers (servers, tools, search)
- Execution handler with dynamic import
- History tracking (in-memory, last 100)
- Consistent error responses

**logger.ts** - Structured logging
- Timestamp, log level, message, context
- Color-coded output (info, warn, error, debug)
- JSON-structured for production parsing

**lock.ts** - Single instance protection
- File-based locking with PID tracking
- Prevents multiple server instances
- Graceful cleanup on shutdown

**watcher.ts** - Hot reload functionality
- Watches registry.json and server directories
- Auto-reloads registry when tools change
- Debounced reload to prevent spam

**webui/** - Web dashboard
- Single-page application (vanilla JS)
- Real-time monitoring and tool execution
- No build process required

## Error Codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Server or tool not found (404) |
| `INVALID_QUERY` | Search query missing or empty (400) |
| `FUNCTION_NOT_FOUND` | Tool function not exported (500) |
| `EXECUTION_ERROR` | Tool execution failed (500) |
| `INTERNAL_ERROR` | Unexpected server error (500) |

## Implementation Notes

### Tool Execution Flow

1. Validate server exists (via registry)
2. Validate tool exists (via registry)
3. Dynamic import of server module: `../servers/${server}/index.js`
4. Convert tool name to function name: `list-tables` → `listTables`
5. Execute tool function with input
6. Track execution in history
7. Return `MCPToolResult<T>` directly

### History Tracking

- In-memory array (cleared on restart)
- FIFO queue with max size of 100
- Stores: id, timestamp, server, tool, input, result, durationMs
- Accessible via `GET /mcp/history`

### Response Format

**Success responses:**
```json
{
  "success": true,
  "data": <response-data>
}
```

**Error responses:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": <optional-context>
  }
}
```

**Tool execution responses** return `MCPToolResult<T>` directly (already has success/data/error structure).

## Logging

All requests and responses are logged with:

```
[timestamp] [LEVEL]: message
  key: value
  key: value
```

Example:
```
[18:15:30] INFO: ← GET /mcp/servers - 200
  method: "GET"
  url: "/mcp/servers"
  statusCode: 200
  responseTime: 12
```

## Performance

- **Cold start**: ~50ms
- **Discovery endpoints**: <10ms
- **Tool execution**: Varies by tool (typically 100-500ms for API calls)
- **History retrieval**: <5ms

## Security Considerations

- **CORS**: Enabled for all origins (development mode)
- **Input validation**: Tools validate input via Zod schemas
- **No authentication**: Currently open for local development
- **Rate limiting**: Not implemented yet

## Future Enhancements

- [x] WebUI for monitoring and debugging
- [x] Hot reload when new tools are added
- [ ] Authentication/API keys
- [ ] Rate limiting
- [ ] Persistent execution history (database)
- [ ] WebSocket support for real-time updates
- [ ] OpenAPI/Swagger documentation
- [ ] Prometheus metrics endpoint
- [ ] Tool input validation UI
- [ ] Export execution history (CSV/JSON)

## Related Files

- `scripts/mcp/core/discovery.ts` - Registry discovery logic
- `scripts/mcp/types/index.ts` - Type definitions
- `scripts/mcp/servers/*/` - Tool implementations
- `scripts/mcp/registry.json` - Tool registry
