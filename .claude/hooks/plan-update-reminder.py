#!/usr/bin/env python3
"""
Hook: Plan Update Reminder
Event: Stop (end of turn)
Purpose: Remind about active plans with in_progress phases that need updating

This hook checks for active plans and warns if any phases are left in_progress,
encouraging Claude and users to keep plans up-to-date.

Cross-platform script that works on Windows, macOS, and Linux.
"""

import json
import sys
from pathlib import Path
from typing import List, Dict, Any

# ANSI color codes for output
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def get_project_dir() -> Path:
    """Get the project directory (where this script's .claude folder lives)."""
    script_dir = Path(__file__).resolve().parent
    return script_dir.parent.parent


def find_active_plans(project_dir: Path) -> List[Path]:
    """Find all active plan files (not in Completed/ folder)."""
    plans_dir = project_dir / "Docs" / "Plans"
    if not plans_dir.exists():
        return []

    # Find plan-*.json files, excluding Completed/ subdirectory
    active_plans = []
    for plan_file in plans_dir.glob("plan-*.json"):
        # Skip if in Completed subfolder
        if "Completed" not in str(plan_file):
            active_plans.append(plan_file)

    return active_plans


def check_plan_status(plan_file: Path) -> Dict[str, Any]:
    """Check a plan file for phases that need attention."""
    try:
        with open(plan_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {"error": f"Could not read {plan_file.name}"}

    phases = data.get("phases", [])
    planning = data.get("planning", {})

    in_progress = []
    blocked = []

    for phase in phases:
        status = phase.get("status", "not_started")
        phase_num = phase.get("number", "?")
        phase_name = phase.get("name", "Unnamed")

        if status == "in_progress":
            in_progress.append({
                "number": phase_num,
                "name": phase_name,
                "completion": phase.get("completion_percentage", 0)
            })
        elif status == "blocked":
            blocked.append({
                "number": phase_num,
                "name": phase_name
            })

    return {
        "file": plan_file.name,
        "goal": planning.get("goal", "Unknown"),
        "in_progress": in_progress,
        "blocked": blocked,
        "needs_attention": len(in_progress) > 0
    }


def main() -> int:
    """Main entry point."""
    project_dir = get_project_dir()
    active_plans = find_active_plans(project_dir)

    if not active_plans:
        return 0  # No active plans, nothing to check

    plans_needing_attention = []

    for plan_file in active_plans:
        status = check_plan_status(plan_file)
        if status.get("needs_attention"):
            plans_needing_attention.append(status)

    if not plans_needing_attention:
        return 0  # All plans are up to date

    # Output warning about plans needing updates
    print(f"\n{YELLOW}{BOLD}PLAN UPDATE REMINDER{RESET}", file=sys.stderr)
    print(f"{YELLOW}━━━━━━━━━━━━━━━━━━━━━{RESET}", file=sys.stderr)

    for plan in plans_needing_attention:
        print(f"\n{BLUE}Plan:{RESET} {plan['file']}", file=sys.stderr)
        print(f"{BLUE}Goal:{RESET} {plan['goal']}", file=sys.stderr)

        if plan["in_progress"]:
            print(f"\n{YELLOW}Phases still in_progress:{RESET}", file=sys.stderr)
            for phase in plan["in_progress"]:
                print(f"  • Phase {phase['number']}: {phase['name']} ({phase['completion']}% complete)", file=sys.stderr)

            print(f"\n{YELLOW}To update, run:{RESET}", file=sys.stderr)
            print(f"  python Docs/Plans/plan-update.py Docs/Plans/{plan['file']} --complete-current --completion-notes \"...\" --actual-effort X", file=sys.stderr)

    print(f"\n{YELLOW}Remember:{RESET} Don't leave phases as 'in_progress' at session end!", file=sys.stderr)
    print(f"Either complete them or mark as blocked.\n", file=sys.stderr)

    return 1  # Non-blocking warning (exit code 1)


if __name__ == "__main__":
    sys.exit(main())
