# Context Management System

This directory contains session context files that capture the state of Claude Code work sessions. The context system enables seamless transitions between sessions by preserving all critical information about what was being worked on, decisions made, and next steps.

## Purpose

When working on complex features across multiple Claude Code sessions, context is critical. Instead of re-explaining:
- What you were working on
- Which files were modified
- What decisions were made
- What blockers exist
- What needs to happen next

...you can simply type `/review_context` and the new agent will have complete understanding of the previous session.

## File Structure

### Naming Convention

All context files follow the pattern: `context-MM-DD-YY-H-MMPM.json`

**Examples:**
- `context-11-23-25-2-30pm.json` - November 23, 2025, 2:30 PM
- `context-12-15-25-10-45am.json` - December 15, 2025, 10:45 AM
- `context-01-08-26-9-05am.json` - January 8, 2026, 9:05 AM

**Format Breakdown:**
- `MM` - Two-digit month (01-12)
- `DD` - Two-digit day (01-31)
- `YY` - Two-digit year (25 = 2025)
- `H` - Hour without leading zero (1-12)
- `MM` - Two-digit minute (00-59)
- `PM|AM` - Lowercase meridiem indicator

### Template Structure

See `context-template.json` for the complete schema. All context files must include:

#### Required Fields

1. **metadata** - Session metadata
   - `timestamp` - ISO-8601 datetime
   - `session_id` - Unique identifier
   - `version` - Template version (currently 1.0)
   - `claude_model` - Model used during session

2. **session** - Session overview
   - `subject` - What you're working on
   - `goal` - Objective of the session
   - `priority` - High/Medium/Low

3. **context** - Detailed context
   - `files` - Array of files created/modified/deleted
   - `documentation` - Docs referenced or updated
   - `plan` - Steps and their status
   - `subagents_used` - Any subagents that were delegated work

4. **progress** - Session progress tracking
   - `blockers` - Issues encountered
   - `decisions_made` - Key decisions and rationale
   - `testing_status` - Test coverage and results

5. **next_steps** - What to do next
   - Array of prioritized actions with assignments

6. **summary** - 1-2 paragraph overview

#### Optional Fields

- `session.actual_duration` - Actual time spent
- `files[].lines_changed` - Number of lines modified
- `knowledge_gained` - Lessons learned during session
- `testing_status.edge_cases_covered` - Edge cases tested

## Usage

### Saving Context

When you're running low on context or ready to end a session:

```bash
/save_context
```

This command will:
1. Analyze your git history and current modifications
2. Review session conversation history
3. Create a comprehensive context JSON file
4. Save it with the correct timestamp and naming convention

The file will be automatically validated to ensure it matches the template structure.

### Reviewing Context

When starting a new session:

```bash
/review_context
```

This command will:
1. Find the most recent context file
2. Read and analyze its contents
3. Provide a comprehensive summary including:
   - What was being worked on
   - Files that were modified
   - Key decisions made
   - Current blockers
   - Recommended next steps

### Manual Context Review

You can also manually review context files:

```bash
# List all context files (newest first)
ls -lt Docs/Context/context-*.json

# Read a specific context file
cat Docs/Context/context-11-23-25-2-30pm.json | jq '.'
```

## Validation

All context files are automatically validated when saved. The validation hook checks:

### Filename Validation
- ✅ Matches pattern `context-MM-DD-YY-H-MMPM.json`
- ✅ Uses lowercase for am/pm
- ✅ Valid date and time values

### Structure Validation
- ✅ All required top-level fields present
- ✅ Required subfields in each section
- ✅ Valid JSON syntax
- ✅ Proper data types (arrays, objects, strings)

### Validation Errors

If validation fails, you'll see helpful error messages:

```
⚠️  Warning: Filename 'context-11-23-2025.json' doesn't match pattern context-MM-DD-YY-H-MMPM.json
   Example: context-11-23-25-2-30pm.json
```

```
❌ Context file validation failed:
   - Missing top-level key: session
   - Missing context.files
   - Missing next_steps
```

## Best Practices

### When to Save Context

Save context when:
- ✅ Approaching context limits (check with `/cost`)
- ✅ Ending a work session
- ✅ Reaching a natural breakpoint (feature complete, tests passing)
- ✅ About to switch to a different task/feature
- ✅ Encountering a complex blocker that needs research

### What to Include

**Be Comprehensive:**
- Include ALL files modified, even minor changes
- Document ALL decisions made, with rationale
- List ALL blockers, even if resolved
- Reference ALL documentation consulted

**Be Specific:**
- Don't say "Updated API" - say "Updated Stripe webhook handler to verify HMAC signatures"
- Don't say "Fixed bug" - say "Fixed race condition in real-time subscription cleanup"
- Include specific error messages, file paths, line numbers

**Be Forward-Looking:**
- List concrete next steps, not vague tasks
- Assign priority levels accurately
- Include success criteria for next steps
- Note dependencies between steps

### Example Context Entry

See `context-template.json` for field descriptions, but here's a minimal valid example:

```json
{
  "metadata": {
    "timestamp": "2025-11-23T14:30:00-08:00",
    "session_id": "sess_20251123_143000",
    "version": "1.0",
    "claude_model": "claude-sonnet-4-5-20250929"
  },
  "session": {
    "subject": "Stripe Subscription Integration",
    "goal": "Implement recurring billing with webhook handling",
    "priority": "High",
    "estimated_duration": "3"
  },
  "context": {
    "files": [
      {
        "path": "src/pages/Pricing.tsx",
        "status": "modified",
        "description": "Added Stripe Checkout button for subscription plans"
      }
    ],
    "documentation": [
      {
        "path": "Docs/Stripe/Stripe-Integration.md",
        "relevance": "Referenced webhook signature verification pattern",
        "status": "referenced"
      }
    ],
    "plan": {
      "approach": "Server-side payment creation using Supabase Edge Functions",
      "steps": [
        {
          "number": 1,
          "description": "Create Stripe Checkout Edge Function",
          "status": "completed",
          "completion_percentage": "100"
        }
      ]
    },
    "subagents_used": []
  },
  "progress": {
    "blockers": [],
    "decisions_made": [
      {
        "decision": "Use Stripe Checkout instead of Payment Intents",
        "rationale": "Checkout handles more edge cases and provides better UX",
        "alternatives_considered": ["Payment Intents", "Payment Links"],
        "impact": "Simpler implementation, less custom code to maintain"
      }
    ],
    "testing_status": {
      "unit_tests": "n/a",
      "integration_tests": "passed",
      "manual_testing": "Tested subscription flow in test mode"
    }
  },
  "next_steps": [
    {
      "action": "Deploy Edge Function to production",
      "priority": "High",
      "assigned_to": "human",
      "estimated_effort": "0.5",
      "success_criteria": "Production webhook receives and processes events"
    }
  ],
  "knowledge_gained": [],
  "summary": "Successfully implemented Stripe subscription integration using Checkout. Edge Function handles session creation and webhook signature verification. Tested in test mode with successful subscription creation. Ready for production deployment."
}
```

## Troubleshooting

### Hook Not Running

If the validation hook isn't running:

1. Check `.claude/settings.json` includes the hook configuration
2. Verify `.claude/hooks/validate-context.py` is executable
3. Check hook logs with `claude --debug`

### Validation Failing

If your context file fails validation:

1. Check the error message - it tells you exactly what's missing
2. Compare your file structure to `context-template.json`
3. Validate JSON syntax with `cat file.json | jq '.'`
4. Check filename matches pattern exactly

### Can't Find Recent Context

If `/review_context` can't find files:

1. Check files are in `/Docs/Context/` directory
2. Verify filename follows `context-*.json` pattern
3. List files with `ls -lt Docs/Context/`

## Integration with Git

Context files are tracked in version control, which means:
- ✅ Team members can see what was worked on
- ✅ Context history is preserved across branches
- ✅ You can review context from previous features

**Best Practice:** Commit context files when committing the related code changes.

## Version History

- **v1.0** (2025-11-23) - Initial context management system with template, slash commands, and validation hook

## See Also

- [Slash Commands Documentation](../Claude_Code/Slash_Commands.md)
- [CLAUDE.md](../../CLAUDE.md) - Project instructions and subagent delegation
- [.claude/hooks/README.md](../../.claude/hooks/README.md) - Hook system documentation
