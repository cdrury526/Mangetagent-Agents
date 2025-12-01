# Gemini CLI - Claude Code Parity

This document describes how Gemini CLI has been configured to achieve feature parity with Claude Code for this project.

## Feature Comparison

| Claude Code Feature | Gemini CLI Equivalent | Status |
|--------------------|----------------------|--------|
| `CLAUDE.md` instructions | `GEMINI.md` with `@import` | ✅ Implemented |
| Subagents via `Task` tool | Custom commands with embedded prompts | ✅ Implemented |
| Skills (`.claude/skills/`) | Custom commands (`~/.gemini/commands/`) | ✅ Implemented |
| Slash commands | Custom commands with `/name` syntax | ✅ Implemented |
| MCP tools (direct) | MCP Bridge extension | ✅ **Working** |
| Session context | Manual (use `/workflow:context`) | ⚠️ Partial |
| Structured planning | `/plan` command | ✅ Implemented |

## MCP Bridge Integration (Updated 2024-11-26)

The MCP Bridge extension allows Gemini CLI to access all MCP servers (Supabase, n8n, Make.com, Hostinger, Brave Search) just like Claude Code.

### How It Works

1. **Extension Location**: `~/.gemini/extensions/mcp-bridge/`
2. **Extension Enabled**: `~/.gemini/extensions/extension-enablement.json`
3. **Gemini reads** `GEMINI.md` context which tells it how to call MCP tools
4. **Gemini uses** `run_shell_command` to execute MCP bridge CLI commands
5. **Bridge returns** results which Gemini incorporates into its response

### Configuration Files

```
~/.gemini/extensions/mcp-bridge/
├── gemini-extension.json    # Extension metadata + MCP server config
├── GEMINI.md                # Instructions for Gemini on how to use MCP tools
├── package.json             # Dependencies
└── mcp-server/              # Optional: Direct MCP server (not currently used)
    └── dist/index.js
```

### Verified Working (2024-11-26)

```bash
# Query Supabase - returns "12 rows"
npx tsx call.ts gemini research_topic '{"query":"Use supabase_query to count rows in the emails table"}'

# List n8n workflows - returns all 100 workflows with status
npx tsx call.ts gemini research_topic '{"query":"Use n8n_workflows to list all workflows"}'
```

## Architecture

### Context Loading (GEMINI.md)

```
GEMINI.md (root)
├── @./.gemini/context/mcp-resources.md   (IDs & URLs)
├── @./.gemini/context/mcp-tools.md       (Tool reference)
└── @./.gemini/context/workflows.md       (Pipeline docs)
```

The `@import` syntax loads modular context at runtime, similar to how Claude Code loads CLAUDE.md.

### Custom Commands Structure

```
~/.gemini/commands/
├── plan.toml                    # /plan - Create implementation plans
├── mcp/
│   ├── query.toml              # /mcp:query - SQL queries
│   ├── n8n.toml                # /mcp:n8n - Workflow management
│   ├── make.toml               # /mcp:make - Scenario management
│   ├── search.toml             # /mcp:search - Web search
│   └── tools.toml              # /mcp:tools - List MCP tools
└── workflow/
    ├── status.toml             # /workflow:status - Pipeline health
    ├── debug.toml              # /workflow:debug - Troubleshooting
    ├── context.toml            # /workflow:context - Load context
    └── research.toml           # /workflow:research - Research topics
```

### MCP Bridge Extension

Located at `~/.gemini/extensions/mcp-bridge/`, provides these MCP tools to Gemini:

| Tool | Description | Example |
|------|-------------|---------|
| `mcp_call` | Generic tool caller (any server) | `mcp_call({server:"make", tool:"list_scenarios", args:{teamId:1624247}})` |
| `supabase_query` | Execute SQL on Supabase | `supabase_query({query:"SELECT * FROM emails LIMIT 5"})` |
| `n8n_workflows` | List all n8n workflows | `n8n_workflows()` |
| `web_search` | Search via Brave Search | `web_search({query:"React 19 features"})` |
| `list_mcp_servers` | Show available servers | `list_mcp_servers()` |
| `list_server_tools` | List tools for a server | `list_server_tools({server:"supabase"})` |

**Available MCP Servers:**
- `supabase` - Database (project: tlwzpacimgfnziccqnox)
- `n8n` - Workflows (host: n8n.srv1152647.hstgr.cloud)
- `make` - Scenarios (team: 1624247)
- `hostinger` - VPS management
- `brave-search` - Web search
- `context7` - Library docs

## Usage Examples

### In Gemini CLI (Interactive)

```bash
# Start in project directory
cd /Users/chrisdrury/development/outlook-manager
gemini

# Use custom commands
> /mcp:query SELECT * FROM emails LIMIT 5
> /workflow:status
> /mcp:n8n executions
> /plan Add error handling to webhook
```

### Headless Mode

```bash
# Quick query
gemini -p "Use supabase_query to count emails from today"

# With structured output
gemini -p "/workflow:status" --output-format json
```

## Key Differences from Claude Code

1. **No Subagent Isolation**: Commands run inline, not in separate contexts
2. **No Automatic Context Persistence**: Must manually save/load context
3. **Shell Commands Require Confirmation**: Unlike Claude's auto-approval
4. **Different Token Window**: Gemini has 1M tokens vs Claude's ~200k

## Best Practices

1. **Use Commands for Repetitive Tasks**: The `/mcp:*` commands save typing
2. **Leverage 1M Context**: Use `analyze_codebase` for bulk analysis
3. **Chain Commands**: Run `/workflow:status` then `/workflow:debug` if issues
4. **Save Important Output**: Gemini doesn't persist conversation by default

## Adding New Commands

Create a `.toml` file in `~/.gemini/commands/` or `.gemini/commands/`:

```toml
# ~/.gemini/commands/mycommand.toml
description = "My custom command"
prompt = """
Your prompt here. Use {{args}} for user input.

Available tools:
- supabase_query({query: "..."})
- mcp_call({server: "...", tool: "...", args: {...}})
"""
```

Invoke with `/mycommand <args>`.
