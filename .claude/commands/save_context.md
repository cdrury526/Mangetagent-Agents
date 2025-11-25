---
description: Save current session context and work progress to timestamped JSON file
allowed-tools: Bash(git log:*), Bash(git status:*), Bash(git diff:*), Bash(date:*), Read, Glob, Grep, Write
---

# Save Session Context

This command analyzes your current work session and creates a comprehensive context file following the context-template.json structure.

## Context Analysis

### Git Information
- Recent commits: !`git log --oneline -20`
- Modified files: !`git status --short`
- Detailed changes: !`git diff --stat HEAD~10..HEAD`
- Current branch: !`git branch --show-current`

### Current Timestamp
- Timestamp for filename: !`date "+context-%m-%d-%y-%-I-%M%p.json" | tr '[:upper:]' '[:lower:]'`

## Your Task

You are saving the current Claude Code session context so that a future session can pick up exactly where we left off.

### Step 1: Analyze Session Context

Review the above git information and the conversation history to understand:
1. **What we're working on** (subject) - e.g., "Stripe Payment Integration", "BoldSign E-Signature Workflow"
2. **The goal** - What we're trying to accomplish
3. **Priority level** - High/Medium/Low based on urgency
4. **All files modified/created** - From git status and conversation
5. **Documentation referenced** - Any docs in Docs/ that were consulted
6. **The plan and its steps** - What approach was taken, which steps are complete/in-progress/blocked
7. **Blockers encountered** - Any issues, errors, or challenges faced
8. **Decisions made** - Key technical decisions and why
9. **Subagents used** - Any specialized agents that were delegated work
10. **Next steps** - Concrete, prioritized actions to continue the work

### Step 2: Create Context JSON File

Using the template from `/Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025/Docs/Context/context-template.json`:

1. Create a comprehensive context JSON file with all required fields
2. Use the timestamp from the bash command above for the filename
3. Ensure all required fields are populated:
   - `metadata` (timestamp, session_id, version, claude_model)
   - `session` (subject, goal, priority)
   - `context` (files, documentation, plan, subagents_used)
   - `progress` (blockers, decisions_made, testing_status)
   - `next_steps` (prioritized array of actions)
   - `summary` (1-2 paragraph overview)

4. Be comprehensive and specific:
   - Include ALL files modified, with descriptions of what changed and why
   - Document ALL decisions with rationale and alternatives considered
   - List ALL blockers, even if resolved, with attempted solutions
   - Reference ALL documentation consulted
   - Provide SPECIFIC next steps with success criteria

5. Save the file to: `/Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025/Docs/Context/[timestamp].json`

### Step 3: Confirm Success

After saving, confirm:
- ✅ File saved with correct timestamp filename
- ✅ All required fields are populated
- ✅ Summary provides clear overview for future sessions
- ✅ Next steps are specific and actionable

### Output to User

Provide a brief summary of what was saved, including:
- Filename of the context file
- Subject and goal
- Number of files modified
- Number of blockers (if any)
- Top 3 next steps

The validation hook will automatically verify the file structure and naming convention.
