# Plan Update Utility - Quick Reference

## Common Operations

```bash
# View plan summary
./plan-update.py plan-file.json --summary

# Start a phase
./plan-update.py plan-file.json --phase 2 --status in_progress

# Update progress
./plan-update.py plan-file.json --phase 2 --completion 50 --actual-effort 3

# Mark step complete (auto-calculates phase completion)
./plan-update.py plan-file.json --phase 2 --step 3 --status completed

# Complete a phase
./plan-update.py plan-file.json --phase 2 --status completed --actual-effort 6.5

# Add execution history
./plan-update.py plan-file.json \
  --add-history \
  --context context-11-23-25-2-30pm.json \
  --notes "Phase 2 completed"

# Multi-update (atomic transaction)
./plan-update.py plan-file.json \
  --phase 2 \
  --status in_progress \
  --completion 50 \
  --actual-effort 3
```

## Valid Status Values

- `not_started` - Phase hasn't started yet
- `in_progress` - Phase is currently being worked on
- `completed` - Phase is finished
- `blocked` - Phase is blocked by an issue

## Status Transitions

Without `--force`:
- `not_started` → `in_progress`, `blocked`
- `in_progress` → `completed`, `blocked`
- `blocked` → `in_progress`
- `completed` → (no transitions)

With `--force`, all backward transitions allowed.

## Smart Defaults

| When you... | It automatically... |
|-------------|---------------------|
| Set status to `completed` | Sets `completion_percentage = 100` |
| Set status to `not_started` | Sets `completion_percentage = 0` |
| Mark a step complete | Recalculates phase completion based on completed steps |
| Make any change | Updates `metadata.last_updated` timestamp |
| Add execution history | Includes `phases_completed` and `phases_in_progress` |

## Safety Features

✅ **Atomic writes** - Temp file + atomic rename (never corrupts original)
✅ **Daily backups** - Stored in `.plan-backups/` (one per file per day)
✅ **Validation** - Runs validation hook after writing
✅ **Auto-restore** - Restores from backup if validation fails
✅ **Input validation** - Validates all inputs before making changes

## Exit Codes

- `0` - Success
- `1` - Validation warnings (file saved but quality issues)
- `2` - Error (validation failure, invalid input, file not found)

## Options

| Option | Description |
|--------|-------------|
| `--phase N` | Target phase number |
| `--step M` | Target step number (requires `--phase`) |
| `--status STATUS` | Update status |
| `--completion PCT` | Update completion (0-100) |
| `--actual-effort HRS` | Update actual effort (hours) |
| `--add-history` | Add execution history entry |
| `--context FILE` | Context file (requires `--add-history`) |
| `--notes "TEXT"` | Notes for history |
| `--summary` | Display summary (read-only) |
| `--force` | Allow backward status transitions |
| `--no-backup` | Skip backup creation |

## Full Documentation

See [PLAN-UPDATE-UTILITY.md](PLAN-UPDATE-UTILITY.md) for complete documentation.
