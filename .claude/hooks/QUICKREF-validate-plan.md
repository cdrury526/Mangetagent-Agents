# Plan Validation Hook - Quick Reference

## Filename Pattern
```
plan-[feature-name]-MM-DD-YY.json
```

**Rules:**
- Lowercase letters, numbers, hyphens only
- Feature name: max 50 chars, no leading/trailing hyphens
- Date: MM (01-12), DD (01-31), YY (two digits)

**Examples:**
```
✓ plan-stripe-integration-11-23-25.json
✓ plan-auth-flow-12-01-25.json
✗ plan-Stripe-Integration-11-23-25.json  (uppercase)
✗ plan-stripe_integration-11-23-25.json  (underscore)
```

## Required Fields

```json
{
  "metadata": {
    "created": "ISO-8601",
    "created_by": "claude-model-id",
    "plan_id": "UUID",
    "version": "1.0"
  },
  "planning": {
    "goal": "string",
    "reason": "string",
    "scope": "string",
    "success_metrics": ["array"],
    "estimated_timeline": "string",
    "priority": "Critical|High|Medium|Low"
  },
  "files_impacted": [],
  "phases": [],  // Minimum 2
  "subagent_assignments": [],
  "reference_documents": [],
  "potential_blockers": [],
  "success_criteria": []
}
```

## Phase Requirements

```json
{
  "number": 1,  // Must be unique
  "name": "string",
  "description": "string",
  "status": "not_started|in_progress|completed|blocked",
  "completion_percentage": 0,  // 0-100
  "estimated_effort": "3",  // Positive number
  "assigned_subagent": "name-from-agent-index",
  "steps": [/* non-empty */],
  "dependencies": [/* phase numbers */],
  "blockers": [],
  "deliverables": []
}
```

## Valid Subagents

- `supabase-backend-specialist`
- `shadcn-ui-designer`
- `boldsign-specialist`
- `stripe-specialist`
- `claude-hook-specialist`
- `claude-maintainer`
- `eslint-code-quality-specialist`
- `github-specialist`
- `research-specialist`
- `script-writer-specialist`
- `subagent-builder`
- `human`

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | File written |
| 1 | Warning | File written, fix quality issues |
| 2 | Error | File blocked, must fix |

## Common Errors

| Error | Fix |
|-------|-----|
| Invalid filename | Use lowercase, hyphens, correct date format |
| Missing required field | Add field from template |
| Unknown subagent | Check spelling, see valid list above |
| Circular dependency | Remove dependency creating cycle |
| Duplicate phase number | Make phase numbers unique |
| Invalid status | Use: not_started, in_progress, completed, blocked |

## Quick Test

```bash
# Test the hook manually
echo '{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-test-11-23-25.json",
    "content": "..."
  }
}' | .claude/hooks/validate-plan.py
```

## Skipped Files

- `plan-template.json`
- `plan-example-*.json`
- Files outside `Docs/Plans/`
- Non-JSON files

## Troubleshooting

```bash
# Make executable
chmod +x .claude/hooks/validate-plan.py

# Validate settings.json
python3 -m json.tool .claude/settings.json

# Run test suite
bash .claude/hooks/test-validate-plan.sh
```

---
**Full Docs:** `.claude/hooks/README-validate-plan.md`
