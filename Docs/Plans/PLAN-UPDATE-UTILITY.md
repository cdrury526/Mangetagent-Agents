# Plan Update Utility

**File:** `Docs/Plans/plan-update.py`
**Version:** 1.0
**Last Updated:** 2025-11-23

## Overview

The Plan Update Utility is a Python script that provides safe, validated, atomic updates to plan JSON files. It integrates with the validation hook system to ensure all modifications maintain plan integrity and follow best practices.

## Purpose

**Why use this utility instead of manual editing?**

- ✅ **Atomic writes** - Changes are written atomically (temp file + rename), never corrupting the original on failure
- ✅ **Automatic backups** - Daily backups created before any modification
- ✅ **Validation integration** - Automatically invokes validation hook after writing
- ✅ **Auto-restore** - Restores from backup if validation fails with blocking errors
- ✅ **Smart defaults** - Automatically updates metadata, calculates completion percentages
- ✅ **Status transition validation** - Prevents invalid status changes
- ✅ **Error prevention** - Validates all inputs before making changes
- ✅ **Multi-update support** - Apply multiple updates in one transaction

**When to use the utility:**
- Updating phase status during execution
- Tracking actual effort vs. estimated
- Marking steps complete
- Adding execution history entries
- Quick status checks with `--summary`

**When to manually edit:**
- Major structural changes (adding/removing phases)
- Modifying phase descriptions or deliverables
- Updating planning goals or scope
- Complex edits across multiple sections

## Installation

The script is located at `/Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025/Docs/Plans/plan-update.py` and requires:

- **Python 3.6+** (standard library only, no external dependencies)
- **Executable permissions** (already set)

No additional setup required!

## Usage

### Basic Syntax

```bash
./plan-update.py <plan-file> [OPTIONS]
```

All commands should be run from the project root or the `Docs/Plans/` directory.

### Command-Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--phase N` | Target phase number | `--phase 2` |
| `--step M` | Target step number (requires `--phase`) | `--step 3` |
| `--status STATUS` | Update status (not_started, in_progress, completed, blocked) | `--status in_progress` |
| `--completion PCT` | Update completion percentage (0-100) | `--completion 75` |
| `--actual-effort HRS` | Update actual effort in hours | `--actual-effort 6.5` |
| `--add-history` | Add execution history entry | `--add-history` |
| `--context FILE` | Context file for history (requires `--add-history`) | `--context context-11-23-25-2-30pm.json` |
| `--notes "TEXT"` | Notes for history entry | `--notes "Phase 2 completed"` |
| `--summary` | Display plan summary (read-only) | `--summary` |
| `--force` | Allow backward status transitions | `--force` |
| `--no-backup` | Skip backup creation | `--no-backup` |

## Operations

### 1. Update Phase Status

Change the status of a phase:

```bash
./plan-update.py plan-stripe-integration-11-23-25.json --phase 2 --status in_progress
```

**Valid statuses:**
- `not_started` - Phase hasn't started yet
- `in_progress` - Phase is currently being worked on
- `completed` - Phase is finished
- `blocked` - Phase is blocked by an issue

**Status Transition Rules:**

Without `--force`:
```
not_started → in_progress, blocked
in_progress → completed, blocked
blocked → in_progress
completed → (no transitions allowed)
```

With `--force`, all backward transitions are allowed.

**Smart defaults:**
- `status = completed` → Auto-sets `completion_percentage = 100`
- `status = not_started` → Auto-sets `completion_percentage = 0`

**Example output:**
```
ℹ Using existing backup: plan-stripe-integration-11-23-25.2025-11-23.backup.json
✓ Updated Phase 2 status: not_started → in_progress
ℹ Plan file written successfully

Running validation...
[validation output...]

✓ Plan updated and validated successfully!
```

### 2. Update Completion Percentage

Track progress within a phase:

```bash
./plan-update.py plan-stripe-integration-11-23-25.json --phase 2 --completion 75
```

**Validation:**
- Must be integer between 0 and 100
- Automatically updated when marking steps complete

**Example:**
```bash
# Mark phase as 50% done
./plan-update.py plan-stripe-11-23-25.json --phase 3 --completion 50

# Output:
# ✓ Updated Phase 3 completion: 25% → 50%
```

### 3. Update Actual Effort

Track time spent on a phase:

```bash
./plan-update.py plan-stripe-integration-11-23-25.json --phase 2 --actual-effort 6.5
```

**Validation:**
- Must be positive number (int or float)
- Useful for comparing estimated vs. actual effort

**Example:**
```bash
# Record 4.5 hours spent on Phase 1
./plan-update.py plan-stripe-11-23-25.json --phase 1 --actual-effort 4.5

# Output:
# ✓ Set Phase 1 actual effort: 4.5h
```

### 4. Mark Step Complete

Update the status of individual steps within a phase:

```bash
./plan-update.py plan-stripe-integration-11-23-25.json --phase 2 --step 3 --status completed
```

**Smart defaults:**
- Automatically recalculates phase `completion_percentage` based on completed steps
- Example: If 2 of 4 steps are complete, phase completion = 50%

**Example:**
```bash
# Mark step 2 of phase 3 as completed
./plan-update.py plan-stripe-11-23-25.json --phase 3 --step 2 --status completed

# Output:
# ✓ Updated Phase 3, Step 2 status: in_progress → completed
# ℹ Auto-updated Phase 3 completion: 25% → 50% (2/4 steps)
```

### 5. Add Execution History

Record work sessions by linking to context files:

```bash
./plan-update.py plan-stripe-integration-11-23-25.json \
  --add-history \
  --context context-11-23-25-2-30pm.json \
  --notes "Phase 2 completed, webhook handling implemented"
```

**What it does:**
- Creates entry in `execution_history` array
- Automatically includes:
  - Current date
  - Context file reference
  - List of completed phases
  - List of in-progress phases
  - Your custom notes

**Context file validation:**
- Script checks if context file exists
- Looks in `Docs/Context/` directory
- Errors if file not found

**Example output:**
```
✓ Added execution history entry (context: context-11-23-25-2-30pm.json)

# Result in JSON:
{
  "execution_history": [
    {
      "date": "2025-11-23",
      "context_file": "context-11-23-25-2-30pm.json",
      "notes": "Phase 2 completed, webhook handling implemented",
      "phases_completed": [1, 2],
      "phases_in_progress": [3]
    }
  ]
}
```

### 6. View Summary

Display a formatted summary of the plan (read-only, no modifications):

```bash
./plan-update.py plan-stripe-integration-11-23-25.json --summary
```

**Output format:**
```
Plan: plan-stripe-integration-11-23-25.json
Goal: Implement Stripe subscription billing with recurring payments
Priority: High | Timeline: 18 hours | Phases: 4

Phase 1: Database Schema Setup
  Status: ✓ completed | Completion: 100% | Effort: 3h (estimated) / 2.5h (actual)
  Assigned: supabase-backend-specialist
  Steps: 3/3 completed

Phase 2: Stripe Edge Function Implementation
  Status: ⟳ in_progress | Completion: 75% | Effort: 6h (estimated) / 4.5h (actual)
  Assigned: stripe-specialist
  Steps: 2/3 completed

Phase 3: Frontend Integration
  Status: ○ not_started | Completion: 0% | Effort: 5h (estimated) / N/A (actual)
  Assigned: human
  Steps: 0/4 completed

Phase 4: Testing and Documentation
  Status: ○ not_started | Completion: 0% | Effort: 4h (estimated) / N/A (actual)
  Assigned: human
  Steps: 0/4 completed

Execution History:
  2025-11-23 - context-11-23-25-2-30pm.json
    Phase 2 completed, webhook handling implemented
```

**Use cases:**
- Quick status check without opening JSON
- Share progress with team
- Review plan before resuming work

### 7. Multi-Update (Atomic Transaction)

Apply multiple updates in one operation:

```bash
./plan-update.py plan-stripe-integration-11-23-25.json \
  --phase 2 \
  --status in_progress \
  --completion 50 \
  --actual-effort 3
```

**Benefits:**
- All updates in single transaction (atomic)
- One backup, one validation run
- Faster than multiple separate commands
- Ensures consistency (all changes succeed or all fail)

**Example:**
```bash
# Start Phase 3, set it to 25% done, record 2 hours of effort
./plan-update.py plan-stripe-11-23-25.json \
  --phase 3 \
  --status in_progress \
  --completion 25 \
  --actual-effort 2

# Output:
# ✓ Updated Phase 3 status: not_started → in_progress
# ℹ Auto-set completion to 0% (status = not_started)
# ✓ Updated Phase 3 completion: 0% → 25%
# ✓ Set Phase 3 actual effort: 2h
```

## Safety Features

### 1. Atomic Writes

The script uses a **temp file + atomic rename** strategy:

1. Writes changes to temporary file: `.plan-stripe-11-23-25_XXXXXX.json`
2. Validates the temp file is written correctly
3. Atomically renames temp file to original filename
4. Original file is never corrupted if write fails

### 2. Daily Backups

Before making any changes, the script creates a daily backup:

**Backup location:** `Docs/Plans/.plan-backups/`
**Backup format:** `{original-name}.{YYYY-MM-DD}.backup.json`

**Example:**
```
Docs/Plans/
├── plan-stripe-integration-11-23-25.json
└── .plan-backups/
    ├── plan-stripe-integration-11-23-25.2025-11-23.backup.json
    └── plan-stripe-integration-11-23-25.2025-11-24.backup.json
```

**Backup rules:**
- Only **one backup per file per day** (doesn't create duplicates)
- If backup already exists for today, it's reused
- Can disable with `--no-backup` flag (not recommended)

**Manual restore:**
```bash
# Restore from backup
cp .plan-backups/plan-stripe-11-23-25.2025-11-23.backup.json plan-stripe-11-23-25.json
```

### 3. Validation Integration

After writing changes, the script automatically invokes the validation hook:

**Hook location:** `.claude/hooks/validate-plan.py`

**Validation exit codes:**
- `0` - Success (no errors, no warnings)
- `1` - Warnings (non-blocking quality issues)
- `2` - Blocking errors (invalid structure, circular dependencies, etc.)

**Behavior:**
- **Exit code 0:** Success message, file saved
- **Exit code 1:** Warning message, file saved but issues noted
- **Exit code 2:** Error message, **file restored from backup**, changes discarded

**Example (validation failure):**
```bash
./plan-update.py plan-stripe-11-23-25.json --phase 2 --status invalid_status

# Output:
# ✗ Invalid status 'invalid_status' (valid: not_started, in_progress, completed, blocked)
```

### 4. Auto-Restore on Failure

If validation returns exit code 2 (blocking error), the script automatically restores from the daily backup:

```
⚠ Validation failed with blocking errors. Restoring backup...
⚠ Restored from backup: plan-stripe-integration-11-23-25.2025-11-23.backup.json
✗ Validation failed with blocking errors. Restoring backup...
```

Your original file is safe!

### 5. Smart Defaults

The script automatically updates related fields:

| When you... | It automatically... |
|-------------|---------------------|
| Set status to `completed` | Sets `completion_percentage = 100` |
| Set status to `not_started` | Sets `completion_percentage = 0` |
| Mark a step complete | Recalculates phase completion (completed_steps / total_steps) |
| Make any change | Updates `metadata.last_updated` to current timestamp |
| Add execution history | Includes `phases_completed` and `phases_in_progress` lists |

### 6. Input Validation

All inputs are validated before making changes:

**Phase number:**
```bash
./plan-update.py plan.json --phase 10 --status completed
# ✗ Phase 10 not found (plan has 4 phases)
```

**Step number:**
```bash
./plan-update.py plan.json --phase 2 --step 5 --status completed
# ✗ Step 5 in Phase 2 not found (phase has 3 steps)
```

**Status value:**
```bash
./plan-update.py plan.json --phase 2 --status finished
# ✗ Invalid status 'finished' (valid: not_started, in_progress, completed, blocked)
```

**Completion percentage:**
```bash
./plan-update.py plan.json --phase 2 --completion 150
# ✗ Completion 150 invalid (must be 0-100)
```

**Actual effort:**
```bash
./plan-update.py plan.json --phase 2 --actual-effort abc
# ✗ Actual effort must be number (got 'abc')

./plan-update.py plan.json --phase 2 --actual-effort -5
# ✗ Actual effort must be positive number (got '-5')
```

**Context file:**
```bash
./plan-update.py plan.json --add-history --context nonexistent.json --notes "test"
# ✗ Context file not found: nonexistent.json
```

## Error Handling

The script provides **clear, helpful error messages** for all error cases:

### Common Errors

**1. Plan file not found:**
```
✗ Plan file not found: /path/to/plan-missing.json
```

**2. Invalid JSON:**
```
✗ Invalid JSON in plan file: Expecting property name enclosed in double quotes: line 10 column 5 (char 234)
```

**3. Phase not found:**
```
✗ Phase 5 not found (plan has 4 phases)
```

**4. Invalid status transition:**
```
✗ Invalid transition from 'completed' to 'in_progress'
  Allowed transitions: none (use --force to override)
```

**5. Missing required arguments:**
```
error: --step requires --phase
error: --add-history requires --context
error: No updates specified. Use --summary for read-only display or specify update operations.
```

### Exit Codes

The script uses standard exit codes for shell integration:

- **0** - Success (changes applied and validated)
- **1** - Validation warnings (changes saved but quality issues noted)
- **2** - Error (invalid input, validation failure, file not found, etc.)
- **130** - Interrupted by user (Ctrl+C)

**Use in shell scripts:**
```bash
if ./plan-update.py plan.json --phase 2 --status completed; then
  echo "Phase 2 marked complete!"
else
  echo "Failed to update plan"
  exit 1
fi
```

## Integration with Validation Hook

The plan update utility integrates seamlessly with the validation hook system:

### How It Works

1. **User runs plan-update.py** with update operations
2. **Script validates inputs** (phase exists, status is valid, etc.)
3. **Script makes changes** to in-memory plan data
4. **Script writes to temp file** atomically
5. **Script invokes validation hook** (`.claude/hooks/validate-plan.py`)
6. **Hook validates** structure, dependencies, subagents, etc.
7. **Script checks hook exit code:**
   - Exit 0: Success, display success message
   - Exit 1: Warnings, keep file but show warnings
   - Exit 2: Errors, restore from backup

### Hook Invocation Details

```python
def run_validation(self) -> Tuple[int, str]:
    """Run validation hook and return exit code and stderr"""
    hook_path = Path(".claude/hooks/validate-plan.py")
    project_root = self.plan_file.parent.parent.parent
    hook_full_path = project_root / hook_path

    hook_input = {
        "tool_name": "Write",
        "tool_input": {
            "file_path": f"Docs/Plans/{self.plan_file.name}",
            "content": json.dumps(self.data, indent=2)
        }
    }

    result = subprocess.run(
        [sys.executable, str(hook_full_path)],
        input=json.dumps(hook_input),
        capture_output=True,
        text=True,
        cwd=str(project_root),
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(project_root)}
    )

    return result.returncode, result.stderr
```

### Validation Output Example

```
Running validation...

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

✓ Plan updated and validated successfully!
```

## Common Workflows

### Workflow 1: Starting a New Phase

When you begin working on a phase:

```bash
# Mark phase as in progress
./plan-update.py plan-stripe-11-23-25.json --phase 2 --status in_progress

# Later, update progress
./plan-update.py plan-stripe-11-23-25.json --phase 2 --completion 25 --actual-effort 1.5
```

### Workflow 2: Completing Steps

As you finish individual steps:

```bash
# Mark step 1 complete
./plan-update.py plan-stripe-11-23-25.json --phase 2 --step 1 --status completed

# Mark step 2 complete
./plan-update.py plan-stripe-11-23-25.json --phase 2 --step 2 --status completed

# Phase completion is auto-calculated based on completed steps
```

### Workflow 3: Completing a Phase

When finishing a phase:

```bash
# Mark phase complete and record final effort
./plan-update.py plan-stripe-11-23-25.json \
  --phase 2 \
  --status completed \
  --actual-effort 5.5

# Completion is auto-set to 100%
```

### Workflow 4: End of Work Session

When saving context at end of session:

```bash
# Create context file first (via Claude Code)
# Then link plan to context:

./plan-update.py plan-stripe-11-23-25.json \
  --add-history \
  --context context-11-23-25-4-15pm.json \
  --notes "Completed Phase 2 (webhook handling), started Phase 3 (frontend integration)"
```

### Workflow 5: Handling Blockers

If a phase becomes blocked:

```bash
# Mark phase as blocked
./plan-update.py plan-stripe-11-23-25.json --phase 3 --status blocked

# Later, when blocker is resolved
./plan-update.py plan-stripe-11-23-25.json --phase 3 --status in_progress
```

### Workflow 6: Quick Status Check

Before starting work:

```bash
# Review current state
./plan-update.py plan-stripe-11-23-25.json --summary

# Shows which phases are complete, in progress, blocked
```

## Troubleshooting

### Issue: "Plan file not found"

**Problem:**
```
✗ Plan file not found: plan-stripe-11-23-25.json
```

**Solution:**
- Provide full path: `./Docs/Plans/plan-stripe-11-23-25.json`
- Or run from `Docs/Plans/` directory: `./plan-update.py plan-stripe-11-23-25.json`

### Issue: "Validation hook not found"

**Problem:**
```
⚠ Validation hook not found: /path/to/.claude/hooks/validate-plan.py
```

**Solution:**
- Ensure hook exists: `ls .claude/hooks/validate-plan.py`
- Make hook executable: `chmod +x .claude/hooks/validate-plan.py`
- Run from project root or verify project structure

### Issue: "Invalid transition"

**Problem:**
```
✗ Invalid transition from 'completed' to 'in_progress'
  Allowed transitions: none (use --force to override)
```

**Solution:**
- **Option 1:** Use `--force` flag to allow backward transitions:
  ```bash
  ./plan-update.py plan.json --phase 2 --status in_progress --force
  ```
- **Option 2:** Verify you're updating the correct phase

### Issue: "Context file not found"

**Problem:**
```
✗ Context file not found: context-11-23-25.json
```

**Solution:**
- Ensure context file exists in `Docs/Context/`
- Provide full filename: `context-11-23-25-2-30pm.json`
- Or provide full path: `../Context/context-11-23-25-2-30pm.json`

### Issue: Validation fails after update

**Problem:**
```
✗ VALIDATION FAILED
Plan file has 2 blocking error(s). Please fix before continuing.

⚠ Validation failed with blocking errors. Restoring backup...
```

**Solution:**
- Script automatically restores from backup
- Review validation errors in output
- Fix issues manually if needed
- Validation errors are usually from:
  - Invalid phase dependencies
  - Circular dependencies
  - Unknown subagent names
  - Invalid status values

### Issue: Backup directory not writable

**Problem:**
```
⚠ Failed to create backup: [Errno 13] Permission denied: '.plan-backups'
```

**Solution:**
- Check directory permissions: `ls -la Docs/Plans/`
- Create backup directory manually: `mkdir Docs/Plans/.plan-backups`
- Or use `--no-backup` flag (not recommended)

## Best Practices

### When to Use the Utility

**✅ DO use for:**
- Updating phase/step status during execution
- Recording actual effort vs. estimated
- Marking steps complete
- Adding execution history entries
- Quick status summaries

**❌ DON'T use for:**
- Adding or removing phases (manual edit required)
- Changing phase descriptions or deliverables
- Modifying plan goals or scope
- Complex structural changes

### Frequency of Updates

**Recommended update frequency:**
- **Status changes:** Update immediately when phase status changes
- **Completion percentage:** Update every few hours or when milestones reached
- **Actual effort:** Update at end of each work session
- **Step completion:** Update as each step finishes
- **Execution history:** Update when saving context at session end

### Backup Management

**Backup retention:**
- Backups accumulate in `.plan-backups/` directory
- One backup per file per day
- Manually clean up old backups periodically:
  ```bash
  # Keep last 30 days, delete older
  find Docs/Plans/.plan-backups/ -name "*.backup.json" -mtime +30 -delete
  ```

**Git and backups:**
- Add `.plan-backups/` to `.gitignore` (backups are local only)
- Commit plan files to git for version history
- Backups are for same-day recovery, git is for long-term history

### Multi-Update Operations

**When to use multi-update:**
```bash
# ✅ GOOD - Atomic transaction
./plan-update.py plan.json --phase 2 --status in_progress --completion 50 --actual-effort 3

# ❌ BAD - Multiple separate operations
./plan-update.py plan.json --phase 2 --status in_progress
./plan-update.py plan.json --phase 2 --completion 50
./plan-update.py plan.json --phase 2 --actual-effort 3
```

**Benefits:**
- Single backup created
- Single validation run
- Faster execution
- Atomic (all changes succeed or all fail)

## Technical Details

### Dependencies

- **Python:** 3.6+ (uses standard library only)
- **Modules:** `sys`, `json`, `argparse`, `subprocess`, `shutil`, `os`, `pathlib`, `datetime`, `tempfile`, `typing`
- **External programs:** None (pure Python)

### File Structure

```python
class PlanUpdater:
    """Main class handling plan updates"""

    def __init__(self, plan_file: Path, force: bool = False)
    def create_backup(self) -> None
    def restore_backup(self) -> None
    def validate_phase_number(self, phase_num: int) -> None
    def validate_step_number(self, phase_num: int, step_num: int) -> None
    def validate_status(self, status: str) -> None
    def validate_status_transition(self, current: str, new: str) -> None
    def validate_completion(self, completion: int) -> None
    def validate_effort(self, effort: float) -> None
    def update_phase_status(self, phase_num: int, status: str) -> None
    def update_phase_completion(self, phase_num: int, completion: int) -> None
    def update_phase_effort(self, phase_num: int, effort: float) -> None
    def update_step_status(self, phase_num: int, step_num: int, status: str) -> None
    def add_execution_history(self, context_file: str, notes: str) -> None
    def update_metadata(self) -> None
    def write_plan(self) -> None
    def run_validation(self) -> Tuple[int, str]
    def display_summary(self) -> None
```

### Atomic Write Implementation

```python
def write_plan(self) -> None:
    """Write plan atomically"""
    # 1. Create temp file in same directory
    temp_fd, temp_path = tempfile.mkstemp(
        suffix=".json",
        prefix=f".{self.plan_file.stem}_",
        dir=self.plan_file.parent,
        text=True
    )

    # 2. Write to temp file
    with os.fdopen(temp_fd, 'w') as f:
        json.dump(self.data, f, indent=2)
        f.write('\n')

    # 3. Atomic rename (POSIX guarantees atomicity)
    shutil.move(temp_path, self.plan_file)
```

### Validation Hook Integration

```python
def run_validation(self) -> Tuple[int, str]:
    """Invoke validation hook"""
    hook_path = Path(".claude/hooks/validate-plan.py")
    project_root = self.plan_file.parent.parent.parent

    hook_input = {
        "tool_name": "Write",
        "tool_input": {
            "file_path": f"Docs/Plans/{self.plan_file.name}",
            "content": json.dumps(self.data, indent=2)
        }
    }

    result = subprocess.run(
        [sys.executable, str(hook_full_path)],
        input=json.dumps(hook_input),
        capture_output=True,
        text=True,
        cwd=str(project_root),
        env={**os.environ, "CLAUDE_PROJECT_DIR": str(project_root)}
    )

    return result.returncode, result.stderr
```

## Version History

- **v1.0** (2025-11-23) - Initial release with atomic writes, backups, validation integration

## See Also

- [Plan Management System](README.md) - Overview of the plan system
- [Plan Template](plan-template.json) - Plan file structure
- [Validation Hook](.claude/hooks/validate-plan.py) - Plan validation implementation
- [Context Management System](../Context/README.md) - Session context capture
