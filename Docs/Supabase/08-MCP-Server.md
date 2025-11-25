# Supabase MCP Server Integration

Model Context Protocol (MCP) servers enable AI assistants to interact with Supabase databases and services.

## Available MCP Servers

### 1. alexander-zuev/supabase-mcp-server

Query and manage Supabase databases through MCP.

**GitHub**: https://github.com/alexander-zuev/supabase-mcp-server

### 2. coleam00/supabase-mcp

Alternative MCP server implementation for Supabase.

**GitHub**: https://github.com/coleam00/supabase-mcp

## Installation

### alexander-zuev/supabase-mcp-server

```bash
# Install globally
npm install -g @modelcontextprotocol/server-supabase

# Or using npx
npx @modelcontextprotocol/server-supabase
```

### From Source

```bash
git clone https://github.com/alexander-zuev/supabase-mcp-server.git
cd supabase-mcp-server
npm install
npm run build
```

## Configuration

### Environment Variables

```bash
# Required
QUERY_API_KEY=your-api-key  # Get from thequery.dev
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-db-password

# Optional
SUPABASE_REGION=us-east-1
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Getting Project Reference

```bash
# From Supabase URL: https://abcdefghijk.supabase.co
# Project ref: abcdefghijk

# Or from CLI
supabase projects list
```

## Claude Desktop Setup

### Configuration File Location

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Configuration Example

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/path/to/supabase-mcp-server",
      "env": {
        "QUERY_API_KEY": "your-api-key",
        "SUPABASE_PROJECT_REF": "your-project-ref",
        "SUPABASE_DB_PASSWORD": "your-db-password",
        "SUPABASE_REGION": "us-east-1",
        "SUPABASE_ACCESS_TOKEN": "your-access-token",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Finding the Binary Path

```bash
# After npm install -g
which supabase-mcp-server

# Or if installed locally
npm bin -g
```

## Cursor IDE Setup

Add to `.cursorrules` or Cursor settings:

```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "command": "npx",
        "args": ["@modelcontextprotocol/server-supabase"],
        "env": {
          "QUERY_API_KEY": "your-api-key",
          "SUPABASE_PROJECT_REF": "your-project-ref",
          "SUPABASE_DB_PASSWORD": "your-db-password"
        }
      }
    }
  }
}
```

## Windsurf Setup

Configuration in Windsurf settings:

```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "command": "/path/to/supabase-mcp-server",
        "env": {
          "QUERY_API_KEY": "your-api-key",
          "SUPABASE_PROJECT_REF": "your-project-ref",
          "SUPABASE_DB_PASSWORD": "your-db-password"
        }
      }
    }
  }
}
```

## Cline Setup

Add to Cline MCP settings:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["/path/to/supabase-mcp-server/dist/index.js"],
      "env": {
        "QUERY_API_KEY": "your-api-key",
        "SUPABASE_PROJECT_REF": "your-project-ref",
        "SUPABASE_DB_PASSWORD": "your-db-password"
      }
    }
  }
}
```

## Docker Setup

### coleam00/supabase-mcp

```bash
# Build Docker image
docker build -t mcp/supabase .

# Run container
docker run -p 3000:3000 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  mcp/supabase
```

### Docker Compose

```yaml
version: '3.8'
services:
  supabase-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      SUPABASE_URL: https://your-project.supabase.co
      SUPABASE_ANON_KEY: your-anon-key
      SUPABASE_SERVICE_ROLE_KEY: your-service-role-key
```

## Features

### Universal Safety Mode

The MCP server includes safety confirmations for destructive operations:

- DELETE operations
- UPDATE operations
- DROP operations
- TRUNCATE operations

### Confirmation Flow

1. AI proposes a query
2. User is shown the query and asked to confirm
3. User approves or rejects
4. Query executes only after approval

### Configuration

```json
{
  "mcpServers": {
    "supabase": {
      "command": "/path/to/supabase-mcp-server",
      "env": {
        "ENABLE_SAFETY_MODE": "true"
      }
    }
  }
}
```

## Available Tools

Depending on the MCP server implementation, available tools may include:

### Database Operations
- Execute SQL queries
- List tables and schemas
- Describe table structure
- Run migrations
- View query results

### Authentication
- Create users
- Manage user sessions
- Update user metadata

### Storage
- Upload files
- List buckets
- Download files
- Delete files

### Realtime
- Subscribe to changes
- Manage channels

## Usage Examples

### Querying Database

```
AI: "Show me all users created in the last 7 days"

MCP Server executes:
SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'
```

### Creating Tables

```
AI: "Create a products table with id, name, price, and created_at"

MCP Server executes:
CREATE TABLE products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Analyzing Data

```
AI: "What's the average order value by month?"

MCP Server executes:
SELECT
  DATE_TRUNC('month', created_at) as month,
  AVG(total) as avg_order_value
FROM orders
GROUP BY month
ORDER BY month DESC
```

## Troubleshooting

### PostgreSQL Installation

Some MCP servers require PostgreSQL client libraries:

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Connection Issues

```bash
# Test connection
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Check project status
supabase status
```

### Permission Errors

Ensure you have the correct keys:
- Use **anon key** for client-side operations
- Use **service role key** for admin operations

### Common Errors

**Error**: "Invalid API key"
- Solution: Check QUERY_API_KEY is correct

**Error**: "Connection refused"
- Solution: Verify SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD

**Error**: "Permission denied"
- Solution: Ensure RLS policies allow the operation or use service role key

## Security Considerations

1. **Never expose service role key** in client-side code
2. **Use environment variables** for sensitive data
3. **Enable safety mode** for destructive operations
4. **Implement RLS policies** to protect data
5. **Audit MCP queries** regularly
6. **Use read-only keys** when possible

## Best Practices

1. **Test queries first** in Supabase Studio
2. **Use transactions** for related operations
3. **Monitor query performance** with EXPLAIN ANALYZE
4. **Set query timeouts** to prevent long-running queries
5. **Log all operations** for audit trail
6. **Use parameterized queries** to prevent SQL injection

## Integration with AI Tools

### Claude Desktop
- Natural language database queries
- Automatic schema exploration
- Data analysis and insights
- Migration assistance

### Cursor IDE
- Code generation with database context
- SQL query optimization
- Schema-aware completions

### Windsurf
- Interactive database management
- Query building assistance
- Data visualization suggestions

## Resources

### alexander-zuev/supabase-mcp-server
- GitHub: https://github.com/alexander-zuev/supabase-mcp-server
- Issues: https://github.com/alexander-zuev/supabase-mcp-server/issues

### coleam00/supabase-mcp
- GitHub: https://github.com/coleam00/supabase-mcp
- Planning: https://github.com/coleam00/supabase-mcp/blob/main/PLANNING.md
- Tasks: https://github.com/coleam00/supabase-mcp/blob/main/TASKS.md

### Model Context Protocol
- MCP Docs: https://modelcontextprotocol.io
- Spec: https://spec.modelcontextprotocol.io

### Supabase
- Main Docs: https://supabase.com/docs
- API Reference: https://supabase.com/docs/reference
