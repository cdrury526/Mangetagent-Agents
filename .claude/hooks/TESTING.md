# Testing Claude Code Hooks

Quick reference for testing the installed hooks.

## Quick Test Commands

### 1. Validate Configuration

```bash
# Check JSON syntax is valid
python3 -m json.tool .claude/settings.json

# Verify hook script is executable
ls -la .claude/hooks/end-of-turn-check.sh

# Expected output: -rwxr-xr-x (executable permissions)
```

### 2. Test Auto-Format Hook Manually

```bash
# Create a poorly formatted test file
cat > /tmp/test-format.tsx << 'EOF'
export   const    TestComponent  =  ( )   =>  {
return(<div  className="test"  >
<p  >Hello,    World!</p>
</div>);
};
EOF

# Run Prettier (simulates the hook)
npx prettier --write /tmp/test-format.tsx

# View formatted result
cat /tmp/test-format.tsx

# Expected: Properly formatted TypeScript/React code
```

### 3. Test End-of-Turn Hook Manually

```bash
# Run the hook with sample JSON input
echo '{
  "session_id": "test-123",
  "cwd": "/Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025",
  "hook_event_name": "Stop",
  "stop_hook_active": false
}' | .claude/hooks/end-of-turn-check.sh

# Expected output:
# 🔍 Running end-of-turn quality checks...
# 🔤 Type checking...
# (TypeScript errors if any)
# 🧹 Linting...
# (ESLint warnings if any)
# ✅ All quality checks passed! (or error messages)
```

## Testing in Claude Code

### Test 1: Auto-Format Hook

1. Start Claude Code:
   ```bash
   claude
   ```

2. Ask Claude to create a file:
   ```
   Create a file at /tmp/test-hook.tsx with this poorly formatted code:
   export const test=()=>{return(<div><p>test</p></div>);}
   ```

3. Verify:
   - Hook should run automatically after the Write operation
   - You'll see Prettier output in the transcript
   - Check the file is properly formatted:
     ```bash
     cat /tmp/test-hook.tsx
     ```

### Test 2: End-of-Turn Quality Gates

1. In Claude Code, make a change to any TypeScript file:
   ```
   Add a comment to src/App.tsx
   ```

2. When Claude finishes (shows "Type a message..."):
   - The Stop hook runs automatically
   - You'll see quality check output in the terminal
   - Output format:
     ```
     🔍 Running end-of-turn quality checks...
     🔤 Type checking...
     ✅ Type check passed
     🧹 Linting...
     ✅ Lint check passed
     ✅ All quality checks passed!
     ```

### Test 3: View All Hooks

In Claude Code, run:
```
/hooks
```

Expected output:
- List of all configured hooks
- Shows event types, matchers, and commands
- Confirms hooks are registered correctly

## Expected Behavior

### Auto-Format Hook (PostToolUse)
- **Triggers**: After Write or Edit on `.ts`, `.tsx`, `.js`, `.jsx` files
- **Action**: Runs Prettier formatting
- **Performance**: <200ms typically
- **Exit code**: Always 0 (success)
- **Visible**: You'll see "prettier --write" output in transcript

### End-of-Turn Hook (Stop)
- **Triggers**: When Claude finishes a turn (after all tool calls complete)
- **Action**: Runs `npm run typecheck` and `npm run lint`
- **Performance**: 5-30 seconds depending on project size
- **Exit code**:
  - 0 if all checks pass
  - 1 if type check or lint fails (non-blocking warning)
- **Visible**: Full output appears in your terminal

## Troubleshooting

### Hook Not Running

1. **Check settings.json syntax**:
   ```bash
   python3 -m json.tool .claude/settings.json > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"
   ```

2. **Restart Claude Code**:
   - Exit Claude Code (`Ctrl+D` or type `exit`)
   - Start again: `claude`
   - Settings are loaded at session start

3. **Check matcher pattern** (for PostToolUse hook):
   - Matcher: `Write.*\.(ts|tsx|js|jsx)|Edit.*\.(ts|tsx|js|jsx)`
   - Case-sensitive: `Write` not `write`
   - Must match file extension

### Hook Failing

1. **Verify executable permissions**:
   ```bash
   chmod +x .claude/hooks/end-of-turn-check.sh
   ```

2. **Check shebang line**:
   ```bash
   head -1 .claude/hooks/end-of-turn-check.sh
   # Should output: #!/bin/bash
   ```

3. **Test with empty JSON**:
   ```bash
   echo '{}' | .claude/hooks/end-of-turn-check.sh
   # Should run without crashing
   ```

### Performance Issues

**If hooks are too slow**:

1. **Auto-format hook** (target <200ms):
   - Already optimized (Prettier is fast)
   - No changes needed

2. **End-of-turn hook** (target <5s, acceptable up to 30s):
   - Consider adding `--skipLibCheck` to typecheck:
     ```json
     "typecheck": "tsc --noEmit --skipLibCheck -p tsconfig.app.json"
     ```
   - Or run in background (won't block Claude):
     ```json
     {
       "type": "command",
       "command": ".claude/hooks/end-of-turn-check.sh",
       "run_in_background": true
     }
     ```

## Debug Logging

To enable debug logging, add this to the top of `end-of-turn-check.sh`:

```bash
#!/bin/bash
# Log all input to debug file
cat > /tmp/hook-debug.log

# ... rest of script
```

Then check the log:
```bash
cat /tmp/hook-debug.log
```

## Success Criteria

- [ ] `python3 -m json.tool .claude/settings.json` succeeds
- [ ] `ls -la .claude/hooks/end-of-turn-check.sh` shows executable permissions
- [ ] Manual Prettier test formats code correctly
- [ ] Manual end-of-turn test runs type check and lint
- [ ] `/hooks` command in Claude shows both hooks registered
- [ ] Auto-format hook triggers when Claude writes/edits TS/JS files
- [ ] End-of-turn hook runs when Claude finishes a turn
- [ ] No errors in hook execution

## Next Steps

Once hooks are verified working:

1. **Commit to version control**:
   ```bash
   git add .claude/settings.json .claude/hooks/
   git commit -m "Add Claude Code hooks for auto-format and quality gates"
   ```

2. **Share with team**: All team members will automatically get these hooks when they pull the repo

3. **Monitor performance**: If hooks become slow, optimize or add `run_in_background: true`

4. **Add more hooks** as needed (see README.md for examples)
