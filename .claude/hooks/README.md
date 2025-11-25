# Claude Code Hooks for Bolt-Magnet-Agent-2025

This directory contains Claude Code hooks that automate code quality and formatting standards.

## Installed Hooks

### 1. Auto-Format Hook (PostToolUse)

**Event**: `PostToolUse`
**Matcher**: `Write.*\.(ts|tsx|js|jsx)|Edit.*\.(ts|tsx|js|jsx)`
**Purpose**: Automatically format TypeScript/JavaScript files with Prettier after Write/Edit operations

**How it works**:
- Triggers after Claude writes or edits any `.ts`, `.tsx`, `.js`, or `.jsx` file
- Runs `npx prettier --write` on the modified files
- Uses environment variable `$CLAUDE_FILE_PATHS` to get file paths
- Completes in <200ms for typical files

**Testing**:
```bash
# Test Prettier formatting manually
echo 'export const test=()=>{return "test";}' > /tmp/test.tsx
CLAUDE_FILE_PATHS="/tmp/test.tsx" npx prettier --write "/tmp/test.tsx"
cat /tmp/test.tsx  # Should be formatted
```

### 2. End-of-Turn Quality Gates (Stop)

**Event**: `Stop`
**Matcher**: None (runs on every turn completion)
**Script**: `.claude/hooks/end-of-turn-check.sh`
**Purpose**: Run type checking and linting when Claude finishes a turn

**Checks performed**:
1. Detects if `package.json` changed (suggests `npm install`)
2. Runs TypeScript type checking (`npm run typecheck`)
3. Runs ESLint (`npm run lint`)
4. Reports results with emoji indicators

**Exit codes**:
- `0`: All checks passed
- `1`: Non-blocking warning (shows to user, Claude continues)

**Testing**:
```bash
# Test the hook manually with sample JSON input
echo '{
  "session_id": "test-123",
  "cwd": "/Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}' | .claude/hooks/end-of-turn-check.sh
```

## Hook Configuration

Configuration is in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write.*\\.(ts|tsx|js|jsx)|Edit.*\\.(ts|tsx|js|jsx)",
        "hooks": [
          {
            "type": "command",
            "comment": "Auto-format TypeScript/JavaScript files with Prettier",
            "command": "npx prettier --write \"$CLAUDE_FILE_PATHS\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "comment": "Run end-of-turn quality checks (type checking and linting)",
            "command": ".claude/hooks/end-of-turn-check.sh"
          }
        ]
      }
    ]
  }
}
```

## Testing in Claude Code

1. **Start Claude Code**:
   ```bash
   claude
   ```

2. **Test Auto-Format Hook**:
   ```
   > Create a poorly formatted TypeScript file at /tmp/test-format.tsx with export const test=()=>{return "hello";}
   ```
   - The file should be automatically formatted after creation
   - You'll see Prettier output in the transcript

3. **Test End-of-Turn Hook**:
   - Make any code changes with Claude
   - When Claude finishes the turn (shows "Type a message...")
   - The hook runs automatically and shows:
     - "🔍 Running end-of-turn quality checks..."
     - Type checking results
     - Linting results

4. **View Configured Hooks**:
   ```
   > /hooks
   ```
   - Shows all registered hooks
   - Displays matchers and commands

## Troubleshooting

### Hook Not Firing

1. **Check settings.json syntax**:
   ```bash
   python3 -m json.tool .claude/settings.json
   ```

2. **Verify hook script is executable**:
   ```bash
   ls -la .claude/hooks/
   # Should show -rwxr-xr-x
   ```

3. **Check matcher pattern**:
   - Matchers are case-sensitive
   - Tool names: `Write`, `Edit`, `MultiEdit`, `Bash`, etc.
   - Use regex patterns for file extensions

4. **Restart Claude Code session**:
   - Exit and restart `claude` command
   - Settings are loaded at session start

### Hook Failing

1. **Check shebang** (first line of script):
   ```bash
   head -1 .claude/hooks/end-of-turn-check.sh
   # Should be: #!/bin/bash
   ```

2. **Test manually** with sample input:
   ```bash
   echo '{"session_id":"test"}' | .claude/hooks/end-of-turn-check.sh
   ```

3. **Check permissions**:
   ```bash
   chmod +x .claude/hooks/end-of-turn-check.sh
   ```

### Performance Issues

- **Auto-format hook** should complete in <200ms
- **End-of-turn hook** may take 5-30s depending on project size
- If hooks timeout (60s), consider:
  - Running type check on specific files only
  - Using `--skipLibCheck` flag
  - Enabling `run_in_background: true` for non-critical checks

## Adding New Hooks

See `/Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025/Docs/Claude_Code/Research/Hooks/hooks-research.md` for comprehensive guide.

### Quick Example: Block Dangerous Bash Commands

1. Create hook script:
   ```bash
   cat > .claude/hooks/block-dangerous.py << 'EOF'
   #!/usr/bin/env python3
   import sys, json

   input_data = json.load(sys.stdin)
   command = input_data.get("tool_input", {}).get("command", "")

   DANGEROUS = ["rm -rf /", "sudo rm", "dd if="]
   if any(d in command for d in DANGEROUS):
       print(f"🚫 Blocked dangerous command: {command}", file=sys.stderr)
       sys.exit(2)  # BLOCK

   sys.exit(0)
   EOF
   chmod +x .claude/hooks/block-dangerous.py
   ```

2. Add to settings.json:
   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "Bash",
           "hooks": [
             {
               "type": "command",
               "command": ".claude/hooks/block-dangerous.py"
             }
           ]
         }
       ]
     }
   }
   ```

## Environment Variables

Available in hook scripts:

- `CLAUDE_PROJECT_DIR` - Absolute path to project root
- `CLAUDE_TOOL_NAME` - Tool name (Write, Bash, Edit, etc.)
- `CLAUDE_FILE_PATHS` - Space-separated file paths (Write/Edit)
- `CLAUDE_TOOL_OUTPUT` - Tool output (PostToolUse only)

## Resources

- [Official Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Comprehensive Research Document](../Docs/Claude_Code/Research/Hooks/hooks-research.md)
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code)
