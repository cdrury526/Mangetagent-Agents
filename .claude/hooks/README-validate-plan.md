# Plan Validation Hook

## Overview

The `validate-plan.py` hook ensures all plan files in `Docs/Plans/` follow the template structure defined in `plan-template.json` and adhere to the naming convention. This prevents structural errors, circular dependencies, and invalid subagent references before files are written.

**Hook Type:** PreToolUse (validates before Write/Edit completes)
**Language:** Python 3
**Exit Codes:**
- **0**: Success (file is valid)
- **1**: Warning (quality issues detected, non-blocking)
- **2**: Blocking error (invalid structure, must fix before continuing)

## Features

### Validation Stages

1. **Filename Validation**
   - Pattern: `plan-[feature-name]-MM-DD-YY.json`
   - Lowercase and hyphens only in feature name
   - Feature name max 50 characters
   - Valid date components (MM: 01-12, DD: 01-31, YY: 00-99)

2. **Required Fields Validation**
   - All top-level fields from template
   - Required subfields within metadata and planning
   - Minimum 2 phases required

3. **Phase Validation**
   - Unique phase numbers
   - Valid statuses (not_started, in_progress, completed, blocked)
   - Completion percentage 0-100
   - Positive estimated_effort
   - Non-empty steps array
   - Circular dependency detection

4. **Subagent Assignment Validation**
   - Subagent names match those in `.claude/agents/agent-index.md`
   - Referenced phases exist
   - Helpful suggestions for typos

5. **Quality Checks** (warnings only)
   - High-severity blockers without mitigation strategy
   - Empty success criteria
   - Phases > 8 (over-planning warning)
   - Phases > 20 hours (suggest breaking down)
   - Complex phases (>10h) assigned to 'human'

## Filename Convention

### Valid Examples
```
✓ plan-stripe-integration-11-23-25.json
✓ plan-boldsign-embedded-signing-11-25-25.json
✓ plan-real-time-updates-12-01-25.json
✓ plan-auth-11-23-25.json
```

### Invalid Examples
```
✗ plan-Stripe-Integration-11-23-25.json        (uppercase not allowed)
✗ plan-stripe_integration-11-23-25.json        (underscores not allowed)
✗ plan-stripe-integration-2025-11-23.json      (wrong date format)
✗ plan--invalid-11-23-25.json                  (feature name starts with hyphen)
```

### Regex Pattern
```regex
^plan-[a-z0-9]([a-z0-9-]*[a-z0-9])?-\d{2}-\d{2}-\d{2}\.json$
```

## Skipped Files

The hook automatically skips:
- `plan-template.json` (the template itself)
- Files starting with `plan-example-` (example files)
- Files outside `Docs/Plans/` directory
- Non-JSON files

## Circular Dependency Detection

The hook uses Depth-First Search (DFS) to detect circular dependencies between phases.

### Example: Circular Dependency
```json
{
  "phases": [
    {
      "number": 1,
      "dependencies": [2]  // Phase 1 depends on Phase 2
    },
    {
      "number": 2,
      "dependencies": [3]  // Phase 2 depends on Phase 3
    },
    {
      "number": 3,
      "dependencies": [1]  // Phase 3 depends on Phase 1 → CIRCULAR!
    }
  ]
}
```

**Error:** `Circular dependency detected: Phase 1 → Phase 2 → Phase 3 → Phase 1`

## Subagent Validation

The hook reads `.claude/agents/agent-index.md` to validate subagent names.

### Valid Subagents (as of 2025-11-23)
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
- `human` (always valid)

### Invalid Subagent Error
```
Phase 1: Unknown subagent 'stripe-expert'
  Valid subagents: boldsign-specialist, claude-hook-specialist, ...
  Did you mean: stripe-specialist?
```

## Quality Warnings

Non-blocking warnings that suggest improvements:

1. **High-Impact Blocker Without Mitigation**
   ```
   ⚠ High-impact blocker lacks mitigation strategy: 'API keys missing'
     Recommendation: Add 'mitigation_strategy' field
   ```

2. **Empty Success Criteria**
   ```
   ⚠ No success criteria defined
     Recommendation: Add measurable success criteria to verify completion
   ```

3. **Too Many Phases**
   ```
   ⚠ Plan has 10 phases (>8)
     Suggestion: Consider if some phases can be combined to avoid over-planning
   ```

4. **Phase Too Large**
   ```
   ⚠ Phase 2: estimated_effort is 25 hours (>20h)
     Suggestion: Consider breaking this phase into smaller phases
   ```

5. **Complex Phase Without Subagent**
   ```
   ⚠ Phase 3: Complex phase (15h) assigned to 'human'
     Consider: Could a specialist subagent help with this?
   ```

## Installation

Already configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "comment": "Validate plan files match template structure and naming convention",
            "command": ".claude/hooks/validate-plan.py"
          }
        ]
      }
    ]
  }
}
```

The hook is automatically invoked when writing or editing plan files in `Docs/Plans/`.

## Testing

### Manual Testing

Test with sample JSON input:

```bash
# Test invalid filename
echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-Invalid-Name-11-23-25.json",
    "content": "{}"
  }
}' | .claude/hooks/validate-plan.py

echo "Exit code: $?"
```

### Automated Test Suite

Run the comprehensive test suite:

```bash
bash .claude/hooks/test-validate-plan.sh
```

This tests:
1. Invalid filename (uppercase)
2. Invalid filename (wrong date format)
3. Missing required fields
4. Invalid subagent reference
5. Circular dependency detection
6. Quality warnings
7. Template file skipping
8. Non-plan file skipping

## Troubleshooting

### Hook Not Firing

1. **Check hook is registered:**
   ```
   claude
   > /hooks
   ```
   Look for `validate-plan.py` in the list.

2. **Verify file permissions:**
   ```bash
   ls -la .claude/hooks/validate-plan.py
   # Should show -rwxr-xr-x (executable)
   ```

3. **Make executable if needed:**
   ```bash
   chmod +x .claude/hooks/validate-plan.py
   ```

4. **Validate settings.json syntax:**
   ```bash
   python3 -m json.tool .claude/settings.json
   ```

5. **Restart Claude Code session**

### Hook Errors

If the hook shows errors, check:

1. **Python version:** Requires Python 3.6+
   ```bash
   python3 --version
   ```

2. **File paths:** Hook uses `CLAUDE_PROJECT_DIR` environment variable
   ```bash
   echo $CLAUDE_PROJECT_DIR
   ```

3. **Agent index exists:**
   ```bash
   ls -la .claude/agents/agent-index.md
   ```

### False Positives

If the hook incorrectly flags valid plans:

1. **Check template alignment:** Ensure your plan follows `plan-template.json` structure
2. **Review error messages:** They include specific field names and suggestions
3. **Verify subagent names:** Must match exactly (case-sensitive) from agent-index.md
4. **Check phase dependencies:** Use phase numbers (not names) in dependency arrays

## Performance

- **Typical execution time:** <100ms
- **Timeout:** 60 seconds (Claude Code default)
- **Impact:** Minimal - only runs when writing/editing plan files

## Output Examples

### Success
```
Validating Plan: plan-stripe-integration-11-23-25.json
============================================================

Stage 1: Filename Validation
  ✓ Filename follows naming convention

Stage 2: Required Fields Validation
  ✓ All required fields present

Stage 3: Phase Validation (4 phases)
  ✓ All phases valid

Stage 4: Subagent Assignment Validation
  ✓ All subagent assignments valid

Stage 5: Quality Checks
  ✓ No quality issues detected

============================================================
Validation Summary
============================================================
Errors:   0
Warnings: 0

✓ VALIDATION SUCCESSFUL
Plan file is valid and follows all best practices!
```

### Blocking Error
```
Validating Plan: plan-test-feature-11-23-25.json
============================================================

Stage 1: Filename Validation
  ✓ Filename follows naming convention

Stage 2: Required Fields Validation
  ✗ Missing required field: 'metadata.created'
  ✗ Missing required field: 'planning.goal'

Stage 3: Phase Validation (2 phases)
  ✗ Phase 1: Unknown subagent 'stripe-expert'
    Valid subagents: stripe-specialist, ...
    Did you mean: stripe-specialist?
  ✗ Circular dependency detected: Phase 1 → Phase 2 → Phase 1
    Fix: Remove or reorder dependencies to break the cycle

============================================================
Validation Summary
============================================================
Errors:   4
Warnings: 0

✗ VALIDATION FAILED
Plan file has 4 blocking error(s). Please fix before continuing.
```

### Warning (Non-Blocking)
```
Validating Plan: plan-large-feature-11-23-25.json
============================================================

Stage 1: Filename Validation
  ✓ Filename follows naming convention

Stage 2: Required Fields Validation
  ✓ All required fields present

Stage 3: Phase Validation (10 phases)
  ✓ All phases valid
  ⚠ Phase 2: estimated_effort is 25 hours (>20h)
    Suggestion: Consider breaking this phase into smaller phases
  ⚠ Plan has 10 phases (>8)
    Suggestion: Consider if some phases can be combined

Stage 4: Subagent Assignment Validation
  ✓ All subagent assignments valid

Stage 5: Quality Checks
  ⚠ No success criteria defined
    Recommendation: Add measurable success criteria

============================================================
Validation Summary
============================================================
Errors:   0
Warnings: 3

⚠ VALIDATION PASSED WITH WARNINGS
Plan file has 3 quality issue(s). Consider addressing them.
```

## Related Files

- **Hook Script:** `.claude/hooks/validate-plan.py`
- **Settings:** `.claude/settings.json`
- **Template:** `Docs/Plans/plan-template.json`
- **Agent Index:** `.claude/agents/agent-index.md`
- **Test Suite:** `.claude/hooks/test-validate-plan.sh`
- **Documentation:** `.claude/hooks/README-validate-plan.md` (this file)

## Best Practices

1. **Always use lowercase:** Feature names must be lowercase with hyphens
2. **Keep phases focused:** Aim for 2-6 phases per plan
3. **Assign specialists:** Use specific subagents instead of 'human' when possible
4. **Define success criteria:** Add at least 2-3 measurable criteria
5. **Break down large phases:** Keep estimated effort under 20 hours per phase
6. **Add mitigation strategies:** Especially for high-severity blockers
7. **Validate before commit:** The hook catches issues early

## Examples

See `Docs/Plans/plan-example-feature-11-23-25.json` for a complete valid plan.

## Maintenance

- **Update when template changes:** If `plan-template.json` is updated, review hook validation rules
- **Update when agents change:** The hook automatically reads from `agent-index.md`
- **Review warnings periodically:** Adjust quality thresholds if needed (MAX_PHASES, MAX_PHASE_HOURS)

---

**Created:** 2025-11-23
**Last Updated:** 2025-11-23
**Version:** 1.0
