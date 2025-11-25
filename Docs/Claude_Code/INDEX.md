# Claude Code Documentation Index

**Purpose**: Quick reference guide for Claude Code features, commands, and tools available during Context-Crate development.

---

## 📚 Quick Navigation

| Document | Purpose | Key Topics |
|----------|---------|-----------|
| [Agent_skills.md](#agent-skills) | Create & manage AI Skills that extend Claude's capabilities | Skill creation, discovery, best practices, sharing |
| [Claude_Code_CLI_Reference.md](#cli-reference) | Complete CLI command and flag reference | Commands, flags, agents flag format |
| [Claude_Code_MCP.md](#mcp) | Model Context Protocol integration guide | Adding MCP servers, authentication, resources, enterprise config |
| [Hooks.md](#hooks) | Customize Claude Code behavior with shell commands | Hook events, examples (logging, formatting, protection) |
| [Hooks_Reference.md](#hooks-reference) | Complete hook event reference and security | All hook events, security considerations |
| [Slash_Commands.md](#slash-commands) | Built-in and custom commands in interactive mode | Built-in commands, custom command creation |
| [Subagents.md](#subagents) | Create specialized AI assistants for specific tasks | Subagent configuration, CLI usage, plugins |
| [Interactive_Mode.md](#interactive-mode) | Keyboard shortcuts and input modes | Shortcuts, vim mode, multiline input |
| [Claude_Code_Settings.md](#settings) | Configuration files and environment variables | settings.json structure, permissions, sandbox config |
| [Claude_Code_Memory.md](#memory) | CLAUDE.md memory file for project context | Memory management, guidelines |
| [Claude_Code_Status_Line.md](#status-line) | Custom status line configuration | Status line types, templates |
| [Model_Configuration.md](#model-config) | Model selection and configuration | Model aliases, switching models |
| [Github_Actions.md](#github-actions) | CI/CD automation with Claude Code | Workflows, examples |
| [Headless.md](#headless) | Running Claude Code without UI | Headless mode configuration |
| [Claude_Code_Troubleshooting.md](#troubleshooting) | Common issues and solutions | Debugging, error resolution |

---

## 📋 Detailed Reference

### Agent Skills
**File**: `Agent_skills.md`

**What it is**: Model-invoked capabilities that extend Claude's functionality through organized folders with instructions and supporting files.

**Key Concepts**:
- Skills are automatically discovered and invoked by Claude when relevant
- Different from slash commands (slash commands are user-invoked)
- Three types: Personal (`~/.claude/skills/`), Project (`.claude/skills/`), Plugin

**How to Use**:
1. Create skill directory: `mkdir -p .claude/skills/my-skill-name/`
2. Write `SKILL.md` with YAML frontmatter
3. Add supporting files (scripts, templates, docs)
4. Claude autonomously uses when appropriate

**Key Fields in SKILL.md**:
- `name`: Lowercase, hyphens only (max 64 chars)
- `description`: What it does + when to use (max 1024 chars)
- `allowed-tools`: Optional list of tools allowed for this skill

**Best Practices**:
- Keep Skills focused on one capability
- Write specific, discoverable descriptions
- Include trigger keywords in description
- Test with questions that match your description
- Document version history if needed

**Common Issues**:
- Claude doesn't use skill? Check description specificity
- Skill not loading? Check YAML syntax and file location
- Multiple skills conflicting? Use distinct trigger terms

---

### CLI Reference
**File**: `Claude_Code_CLI_Reference.md`

**Main Commands**:
```bash
claude                      # Start interactive REPL
claude "query"             # Start with initial prompt
claude -p "query"          # Query via SDK, then exit (print mode)
claude -c                  # Continue most recent conversation
claude -c -p "query"       # Continue via SDK
claude -r "session-id"     # Resume specific session
claude update              # Update to latest version
claude mcp                 # Configure MCP servers
```

**Key Flags**:
| Flag | Purpose | Example |
|------|---------|---------|
| `--add-dir` | Add working directories | `claude --add-dir ../apps ../lib` |
| `--agents` | Define custom subagents via JSON | See schema below |
| `--allowedTools` | Allow tools without prompting | `--allowedTools "Bash(git log:*)" "Read"` |
| `--disallowedTools` | Disallow tools | `--disallowedTools "Edit"` |
| `-p, --print` | Print response without interactive mode | `claude -p "query"` |
| `--append-system-prompt` | Add to system prompt (with --print) | `--append-system-prompt "Instruction"` |
| `--output-format` | Output format | `text`, `json`, `stream-json` |
| `--verbose` | Enable verbose logging | `claude --verbose` |
| `--max-turns` | Limit agentic turns | `claude -p --max-turns 3 "query"` |
| `--model` | Select model | `claude --model sonnet` or full name |
| `--permission-mode` | Start in specific mode | `plan`, `acceptEdits`, `ask` |
| `--resume` | Resume session | `claude --resume abc123 "query"` |
| `--dangerously-skip-permissions` | Skip permission prompts | Use with caution |

**Agents Flag Format**:
```json
{
  "subagent-name": {
    "description": "When to use this subagent",
    "prompt": "System prompt for subagent",
    "tools": ["Read", "Edit", "Bash"],  // Optional
    "model": "sonnet"  // Optional: sonnet, opus, haiku
  }
}
```

---

### MCP
**File**: `Claude_Code_MCP.md`

**What is MCP**: Open standard for AI-tool integrations. Hundreds of MCP servers available for databases, APIs, tools, services.

**Installation Methods**:
```bash
# HTTP server (recommended for remote)
claude mcp add --transport http <name> <url>

# SSE server (deprecated, use HTTP instead)
claude mcp add --transport sse <name> <url>

# Local stdio server
claude mcp add --transport stdio <name> -- <command>
```

**Managing Servers**:
```bash
claude mcp list              # List all configured servers
claude mcp get <name>        # Get details for specific server
claude mcp remove <name>     # Remove a server
/mcp                         # Check status in Claude Code
```

**Installation Scopes**:
- **Local** (default): Project-specific, private to you
- **Project**: Shared in `.mcp.json`, checked into version control
- **User**: Cross-project, available globally to you

**Authentication**:
```bash
# Add server requiring authentication
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Authenticate within Claude Code
/mcp
# Follow browser OAuth flow
```

**Using MCP Resources**:
```
@server:protocol://resource/path
@github:issue://123
@postgres:schema://users
```

**Using MCP Prompts as Slash Commands**:
```
/mcp__servername__promptname [arguments]
/mcp__github__list_prs
/mcp__jira__create_issue "Bug title" high
```

**Common Servers for Your Project**:
- **GitHub**: Code management and reviews
- **Linear/Jira**: Project management
- **Notion**: Documentation
- **Supabase/PostgreSQL**: Database access
- **Sentry**: Error monitoring
- **Figma**: Design integration

---

### Hooks
**File**: `Hooks.md`

**What are Hooks**: Shell commands that execute at specific points in Claude Code's lifecycle. **Deterministic** control (always happens, not relying on LLM).

**Hook Events**:
- `PreToolUse`: Before tool calls (can block them)
- `PostToolUse`: After tool calls complete
- `UserPromptSubmit`: When user submits prompt
- `Notification`: When Claude sends notifications
- `Stop`: When Claude finishes responding
- `SubagentStop`: When subagents complete
- `PreCompact`: Before conversation compaction
- `SessionStart`: When session starts/resumes
- `SessionEnd`: When session ends

**Quick Setup Example** (Logging bash commands):
```bash
/hooks
# Select PreToolUse
# Add matcher: Bash
# Add hook: jq -r '"\(.tool_input.command) - \(.tool_input.description // "No description")"' >> ~/.claude/bash-command-log.txt
# Save to User settings
```

**Common Hook Examples**:

**Code Formatting** (Auto-format TypeScript):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; if echo \"$file_path\" | grep -q '\\.ts$'; then npx prettier --write \"$file_path\"; fi; }"
          }
        ]
      }
    ]
  }
}
```

**File Protection** (Block sensitive files):
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 -c \"import json, sys; data=json.load(sys.stdin); path=data.get('tool_input',{}).get('file_path',''); sys.exit(2 if any(p in path for p in ['.env', 'package-lock.json', '.git/']) else 0)\""
          }
        ]
      }
    ]
  }
}
```

**Notifications** (Desktop alerts):
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Awaiting your input'"
          }
        ]
      }
    ]
  }
}
```

---

### Hooks Reference
**File**: `Hooks_Reference.md`

**Detailed hook event documentation** with input schemas and security considerations.

---

### Slash Commands
**File**: `Slash_Commands.md`

**Built-in Commands** (main ones for development):
| Command | Purpose |
|---------|---------|
| `/add-dir` | Add additional working directories |
| `/agents` | Manage custom subagents |
| `/clear` | Clear conversation history |
| `/compact` | Compact conversation with optional instructions |
| `/config` | Open Settings interface |
| `/cost` | Show token usage statistics |
| `/doctor` | Check Claude Code installation health |
| `/help` | Get usage help |
| `/init` | Initialize project with CLAUDE.md guide |
| `/mcp` | Manage MCP servers and OAuth authentication |
| `/memory` | Edit CLAUDE.md memory files |
| `/model` | Select/change AI model |
| `/permissions` | View/update permissions |
| `/sandbox` | Enable sandboxed bash tool |
| `/rewind` | Rewind conversation and/or code |
| `/status` | Show version, model, account, connectivity |
| `/vim` | Enter vim mode |

**Custom Commands**:
- **Project commands**: `.claude/commands/` (shared with team)
- **Personal commands**: `~/.claude/commands/` (personal use)

**Creating Custom Commands**:
```bash
# Create project command
mkdir -p .claude/commands
echo "Your prompt/instructions here" > .claude/commands/command-name.md
```

**Command Arguments**:
```
$ARGUMENTS        # All arguments passed to command
$ARGUMENT_0, etc. # Specific arguments by index
```

**Namespacing** (organize in subdirectories):
```
.claude/commands/frontend/component.md  → /component (project:frontend)
~/.claude/commands/component.md         → /component (user)
```

---

### Subagents
**File**: `Subagents.md`

**What are Subagents**: Specialized AI assistants with separate context windows, custom prompts, and specific tool access.

**Key Benefits**:
- Separate context prevents pollution of main conversation
- Fine-tuned expertise for specific domains
- Reusable across projects and shareable with team
- Flexible tool permissions

**File Locations**:
- **Project subagents**: `.claude/agents/` (take precedence)
- **User subagents**: `~/.claude/agents/`
- **Plugin agents**: From installed plugins

**Quick Start** (`/agents` command):
1. Run `/agents`
2. Select "Create New Agent"
3. Choose project or user level
4. Define: description, tools, custom system prompt
5. Save and Claude uses automatically when appropriate

**Configuration File Format**:
```markdown
---
name: subagent-name
description: What this subagent does and when to use it
tools:
  - Read
  - Edit
  - Bash
model: sonnet  # Optional: sonnet, opus, haiku
---

# System Prompt
Detailed instructions for how this subagent should behave...
```

**CLI Configuration** (alternative to `/agents`):
```bash
claude --agents '{"reviewer":{"description":"Code reviewer","prompt":"You review code..."}}'
```

---

### Interactive Mode
**File**: `Interactive_Mode.md`

**Essential Keyboard Shortcuts**:

**General**:
| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Cancel current input/generation |
| `Ctrl+D` | Exit Claude Code |
| `Ctrl+L` | Clear screen (keeps history) |
| `Ctrl+O` | Toggle verbose output |
| `Ctrl+R` | Reverse search history |
| `Up/Down` | Navigate command history |
| `Esc+Esc` | Rewind code/conversation |
| `Tab` | Toggle extended thinking |
| `Shift+Tab` | Toggle permission modes |

**Multiline Input**:
| Method | Shortcut | Context |
|--------|----------|---------|
| Quick | `\ + Enter` | All terminals |
| macOS | `Option+Enter` | macOS default |
| Terminal setup | `Shift+Enter` | After `/terminal-setup` |
| Control | `Ctrl+J` | Line feed |

**Quick Commands**:
| Start | Purpose |
|-------|---------|
| `#` | Memory shortcut - add to CLAUDE.md |
| `/` | Slash command |
| `!` | Bash mode - run commands directly |
| `@` | File path mention autocomplete |

**Vim Mode** (`/vim`):
- `Esc`: Enter NORMAL mode
- `i/I/a/A/o/O`: Insert modes
- `h/j/k/l`: Navigate
- `w/e/b`: Word navigation
- `0/$`/`^`: Line navigation
- `gg/G`: Document navigation
- `d/c/y`: Delete/change/yank

---

### Settings
**File**: `Claude_Code_Settings.md`

**Settings Hierarchy**:
1. **User settings**: `~/.claude/settings.json` (all projects)
2. **Project settings**: `.claude/settings.json` (team-shared)
3. **Project local**: `.claude/settings.local.json` (personal, not checked in)
4. **Enterprise managed**: System-wide policies (enterprise only)

**Key Configuration Options**:

| Setting | Purpose | Example |
|---------|---------|---------|
| `permissions` | Tool access rules | `{"allow": [], "deny": [], "ask": []}` |
| `env` | Environment variables | `{"FOO": "bar"}` |
| `hooks` | Hook configuration | See Hooks section |
| `model` | Default model | `"claude-sonnet-4-5-20250929"` |
| `statusLine` | Custom status display | `{"type": "command", "command": "..."}` |
| `outputStyle` | System prompt adjustment | `"Explanatory"` |
| `includeCoAuthoredBy` | Git commit byline | `true` |
| `cleanupPeriodDays` | Transcript retention | `30` |
| `forceLoginMethod` | Restrict login type | `"claudeai"` or `"console"` |
| `enableAllProjectMcpServers` | Auto-approve project MCP servers | `true` |

**Permission Rules**:
- `allow`: Tools always allowed
- `ask`: Prompt for confirmation
- `deny`: Block tool use
- Bash uses prefix matching (not regex)

**Sandbox Settings** (macOS/Linux):
```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["git", "docker"],
    "network.allowUnixSockets": ["~/.ssh/agent-socket"]
  }
}
```

---

### Memory (CLAUDE.md)
**File**: `Claude_Code_Memory.md`

**Purpose**: Persistent project context and guidelines stored in CLAUDE.md files.

**File Locations**:
- **Project**: `CLAUDE.md` in project root
- **User**: `~/.claude/CLAUDE.md` for personal guidelines

**Access**: Use `/memory` command to edit

**Best Practices**:
- Keep concise and actionable
- Update as project evolves
- Share team guidelines in project CLAUDE.md
- Use shorthand `#` in prompts to append to memory

---

### Status Line
**File**: `Claude_Code_Status_Line.md`

**Purpose**: Customizable status line showing project context and information.

**Configuration Types**:
- **Command-based**: Run shell script to generate status
- **Template-based**: Use predefined template with variables

---

### Model Configuration
**File**: `Model_Configuration.md`

**Selecting Models**:
```bash
claude --model sonnet         # Latest Sonnet
claude --model opus           # Latest Opus
claude --model claude-sonnet-4-5-20250929  # Specific version
```

**Configuration in settings.json**:
```json
{
  "model": "claude-sonnet-4-5-20250929"
}
```

---

### GitHub Actions
**File**: `Github_Actions.md`

**Purpose**: CI/CD automation using Claude Code in workflows.

---

### Headless Mode
**File**: `Headless.md`

**Purpose**: Running Claude Code without interactive UI for automation.

---

### Troubleshooting
**File**: `Claude_Code_Troubleshooting.md`

**Purpose**: Common issues and solutions for Claude Code problems.

---

## 🔧 Common Workflows for Context-Crate Development

### 1. **Setting Up New Feature Development**
```bash
claude --init                          # Initialize CLAUDE.md
# OR
/memory                               # Edit existing CLAUDE.md

# Create specialized subagent if needed
/agents
```

### 2. **Using MCP for Database Access**
```bash
# Add Supabase database MCP
claude mcp add --transport stdio supabase -- \
  npx -y @supabase-community/supabase-mcp

# In Claude Code, reference database
@supabase:schema://users
/mcp__supabase__query_table "users"
```

### 3. **Automating Code Quality**
Use hooks for:
- Auto-formatting on edits
- Linting on file changes
- Protecting sensitive files
- Logging all bash commands

```bash
/hooks
# Add PostToolUse hook for prettier
# Add PreToolUse hook for file protection
```

### 4. **Managing Agent Skills**
Create project-specific Skills:
```bash
mkdir -p .claude/skills/context-crate-tasks
# Create SKILL.md with project-specific task management
```

### 5. **Custom Commands for Recurring Tasks**
```bash
mkdir -p .claude/commands
echo "Your frequently-used prompt" > .claude/commands/deploy-checklist.md
# Use: /deploy-checklist
```

### 6. **Team Collaboration Settings**
In `.claude/settings.json` (checked into git):
```json
{
  "permissions": {
    "allow": ["Bash(git:*)", "Read"],
    "deny": ["Read(.env)"]
  },
  "enableAllProjectMcpServers": true
}
```

---

## 🎯 Quick Reference by Task

### "I want to extend Claude's capabilities"
→ Create **Skills** with `Agent_skills.md`

### "I need Claude to always do something"
→ Use **Hooks** with `Hooks.md`

### "I want a specialized AI assistant for a type of task"
→ Create a **Subagent** with `Subagents.md`

### "I need access to an external tool/API/database"
→ Install **MCP server** with `Claude_Code_MCP.md`

### "I want a shortcut for a common prompt"
→ Create **Slash Command** with `Slash_Commands.md`

### "I need to configure permissions/environment"
→ Modify **settings.json** with `Claude_Code_Settings.md`

### "I'm stuck or something's broken"
→ Check `Claude_Code_Troubleshooting.md`

### "I want to automate in CI/CD"
→ Use `Github_Actions.md`

---

## 📞 Key Information for Main Claude Instance

**When working on Context-Crate:**

1. **Check CLAUDE.md first** - Contains project-specific guidelines and context
2. **Use /memory** - To update project context as you work
3. **Leverage subagents** - For specialized tasks (testing, code review, documentation)
4. **Refer to this INDEX** - Quick lookup for feature capabilities
5. **Reference individual docs** - For detailed implementation

**Project-Level Configuration** is in:
- `.claude/settings.json` - Permissions and shared config
- `.claude/agents/` - Project-specific subagents
- `.claude/skills/` - Project-specific skills
- `.claude/commands/` - Project-specific commands
- `CLAUDE.md` - Project guidelines and context

**Key MCP Servers for This Project**:
- Supabase (database access)
- GitHub (code management)
- Any others configured in `.mcp.json`

---

**Last Updated**: 2025-10-30
**Version**: 1.0
