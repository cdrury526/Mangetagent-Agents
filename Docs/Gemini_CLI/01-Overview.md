# Gemini CLI Wrapper Overview

## Purpose

Invoke Gemini CLI as a headless design agent to generate UI wireframes, components, and layouts. Uses existing Gemini Ultra subscription (free) instead of per-API-call costs.

## Architecture

```
Claude Code
    │
    ▼
npx tsx call.ts gemini <tool> '<json-args>'
    │
    ▼
gemini.ts → spawns → gemini -y -o json "<structured prompt>"
    │
    ▼
Gemini CLI creates files in specified outputDir
    │
    ▼
Returns JSON: { response, files, stats }
```

## Gemini CLI Installation

```bash
# Already installed at:
/Users/chrisdrury/.npm-global/bin/gemini

# Version: 0.9.0
```

## Key Command-Line Flags

| Flag | Description | Usage |
|------|-------------|-------|
| `<prompt>` | Positional prompt (non-interactive) | `gemini "Create a button"` |
| `-p, --prompt` | Prompt flag (deprecated, use positional) | `gemini -p "prompt"` |
| `-y, --yolo` | Auto-approve all actions | `gemini -y "prompt"` |
| `--approval-mode` | Set approval mode | `--approval-mode yolo` |
| `-o, --output-format` | Output format (text/json) | `-o json` |
| `-m, --model` | Specify model | `-m gemini-2.5-flash` |
| `-i, --prompt-interactive` | Execute then enter interactive | `-i "prompt"` |
| `--include-directories` | Additional workspace dirs | `--include-directories ../lib` |
| `-s, --sandbox` | Run in sandbox mode | `-s` |

## Authentication

Uses cached Google OAuth credentials from initial `gemini` setup.

```bash
# Check auth status
gemini  # Will prompt for login if needed
```

- **Gemini Ultra subscription**: 60 req/min, 1000 req/day
- **Model**: gemini-2.5-pro (default, 1M token context)

## Built-in Tools

Gemini CLI has these built-in capabilities:

| Tool | Description |
|------|-------------|
| `write_file` | Create/overwrite files |
| `edit_file` | Modify existing files |
| `read_file` | Read file contents |
| `shell` | Execute shell commands |
| `web_search` | Google Search grounding |
| `web_fetch` | Fetch web content |

## JSON Output Format

When using `-o json`, Gemini returns:

```json
{
  "response": "Text response from Gemini",
  "stats": {
    "models": {
      "gemini-2.5-pro": {
        "api": {
          "totalRequests": 2,
          "totalErrors": 0,
          "totalLatencyMs": 7223
        },
        "tokens": {
          "prompt": 17134,
          "candidates": 79,
          "total": 17476,
          "cached": 3250,
          "thoughts": 263,
          "tool": 0
        }
      }
    },
    "tools": {
      "totalCalls": 1,
      "totalSuccess": 1,
      "totalFail": 0,
      "totalDurationMs": 31,
      "totalDecisions": {
        "accept": 0,
        "reject": 0,
        "modify": 0,
        "auto_accept": 1
      },
      "byName": {
        "write_file": {
          "count": 1,
          "success": 1,
          "fail": 0,
          "durationMs": 31
        }
      }
    },
    "files": {
      "totalLinesAdded": 11,
      "totalLinesRemoved": 0
    }
  }
}
```

## Headless Invocation Pattern

```bash
# Basic pattern
cd <working-directory> && gemini -y -o json "<prompt>"

# Example: Create a login form
cd /tmp/ui-output && gemini -y -o json "Create an HTML file called login.html with a styled login form. Use modern CSS with flexbox centering."
```

## Error Handling

- MCP server connection errors appear in stderr but don't block execution
- Non-zero exit code on failure
- JSON output still returned on success even with stderr warnings

## Related Files

- `/mcp-bridge/gemini.ts` - Bridge module (Phase 2)
- `/mcp-bridge/gemini-prompts.ts` - Prompt templates (Phase 2)
- `/mcp-tools/gemini/` - TypeScript wrapper interfaces (Phase 4)
