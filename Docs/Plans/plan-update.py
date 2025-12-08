#!/usr/bin/env python3
"""
Plan Update Utility
Safe, validated, atomic updates to plan JSON files

Usage:
  plan-update.py <plan-file> --phase <N> --status <status>
  plan-update.py <plan-file> --phase <N> --completion <0-100>
  plan-update.py <plan-file> --phase <N> --actual-effort <hours>
  plan-update.py <plan-file> --phase <N> --step <M> --status <status>
  plan-update.py <plan-file> --add-history --context <context-file> --notes "<text>"
  plan-update.py <plan-file> --summary

  # Quick workflow commands (agents can use without parsing full plan):
  plan-update.py <plan-file> --start-next           # Start next available phase
  plan-update.py <plan-file> --complete-current     # Complete current in_progress phase
  plan-update.py <plan-file> --status-check         # Show current status and next actions
  plan-update.py <plan-file> --my-assignment <agent> # Show phases assigned to agent

Features:
  - Atomic writes (temp file + atomic rename)
  - Daily backups to .plan-backups/
  - Validation integration (invokes validate-plan.py hook)
  - Auto-restore on validation failure
  - Smart defaults (auto-update metadata.last_updated, etc.)
  - Status transition validation
  - Multi-update support (all in one transaction)
  - Auto-archive to Completed/ when all phases done
  - Phase index for quick status lookups
  - Dependency validation before starting phases

Exit Codes:
  0 - Success
  1 - Validation warnings (non-blocking)
  2 - Error (validation failure, invalid input, etc.)
"""

import sys
import json
import argparse
import subprocess
import shutil
import os
from pathlib import Path
from datetime import datetime, date
from typing import Dict, List, Any, Tuple, Optional
import tempfile

# ANSI color codes
RED = "\033[91m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"

# Cross-platform symbols (ASCII fallback for Windows)
if os.name == 'nt':
    # Windows: use ASCII symbols
    SYM_ARROW = "->"
    SYM_CHECK = "[OK]"
    SYM_WARN = "[!]"
    SYM_CIRCLE = "[ ]"
    SYM_SPIN = "[~]"
    SYM_BLOCK = "[X]"
    SYM_READY = "[>]"
    SYM_INFO = "[i]"
else:
    # Unix/macOS: use Unicode symbols
    SYM_ARROW = "→"
    SYM_CHECK = "✓"
    SYM_WARN = "⚠"
    SYM_CIRCLE = "○"
    SYM_SPIN = "⟳"
    SYM_BLOCK = "⊘"
    SYM_READY = "→"
    SYM_INFO = "ℹ"

# Constants
VALID_STATUSES = ["not_started", "in_progress", "completed", "blocked"]
STATUS_TRANSITIONS = {
    "not_started": ["in_progress", "blocked", "completed"],  # Allow direct completion for retroactive updates
    "in_progress": ["completed", "blocked"],
    "blocked": ["in_progress", "completed"],  # Allow completing blocked items after resolution
    "completed": [],
}
BACKUP_DIR = ".plan-backups"
COMPLETED_DIR = "Completed"


class PlanUpdater:
    """Safely update plan JSON files with validation and backups"""

    def __init__(self, plan_file: Path, force: bool = False):
        self.plan_file = plan_file.resolve()
        self.force = force
        self.data: Dict[str, Any] = {}
        self.backup_file: Optional[Path] = None
        self.original_content: str = ""

        # Validate file exists
        if not self.plan_file.exists():
            self.error(f"Plan file not found: {self.plan_file}")

        # Load plan data
        try:
            with open(self.plan_file, 'r', encoding='utf-8') as f:
                self.original_content = f.read()
                self.data = json.loads(self.original_content)
        except json.JSONDecodeError as e:
            self.error(f"Invalid JSON in plan file: {e}")
        except Exception as e:
            self.error(f"Failed to read plan file: {e}")

    def error(self, message: str, exit_code: int = 2) -> None:
        """Print error and exit"""
        print(f"{RED}✗ {message}{RESET}", file=sys.stderr)
        sys.exit(exit_code)

    def warning(self, message: str) -> None:
        """Print warning"""
        print(f"{YELLOW}{SYM_WARN} {message}{RESET}", file=sys.stderr)

    def success(self, message: str) -> None:
        """Print success"""
        print(f"{GREEN}{SYM_CHECK} {message}{RESET}", file=sys.stderr)

    def info(self, message: str) -> None:
        """Print info"""
        print(f"{BLUE}{SYM_INFO} {message}{RESET}", file=sys.stderr)

    def create_backup(self) -> None:
        """Create daily backup if one doesn't exist yet"""
        backup_dir = self.plan_file.parent / BACKUP_DIR
        backup_dir.mkdir(exist_ok=True)

        # Backup filename: original-name.YYYY-MM-DD.backup.json
        today = date.today().isoformat()
        backup_name = f"{self.plan_file.stem}.{today}.backup.json"
        self.backup_file = backup_dir / backup_name

        # Only create one backup per day
        if not self.backup_file.exists():
            try:
                shutil.copy2(self.plan_file, self.backup_file)
                self.info(f"Created backup: {self.backup_file.name}")
            except Exception as e:
                self.warning(f"Failed to create backup: {e}")
                self.backup_file = None
        else:
            self.info(f"Using existing backup: {self.backup_file.name}")

    def restore_backup(self) -> None:
        """Restore from backup if validation fails"""
        if self.backup_file and self.backup_file.exists():
            try:
                shutil.copy2(self.backup_file, self.plan_file)
                self.warning(f"Restored from backup: {self.backup_file.name}")
            except Exception as e:
                self.error(f"Failed to restore backup: {e}")

    def validate_phase_number(self, phase_num: int) -> None:
        """Validate phase number exists"""
        if "phases" not in self.data or not isinstance(self.data["phases"], list):
            self.error("Plan has no phases array")

        phase_count = len(self.data["phases"])
        if phase_num < 1 or phase_num > phase_count:
            self.error(f"Phase {phase_num} not found (plan has {phase_count} phases)")

    def validate_step_number(self, phase_num: int, step_num: int) -> None:
        """Validate step number exists in phase"""
        self.validate_phase_number(phase_num)
        phase = self.get_phase(phase_num)

        if "steps" not in phase or not isinstance(phase["steps"], list):
            self.error(f"Phase {phase_num} has no steps array")

        step_count = len(phase["steps"])
        if step_num < 1 or step_num > step_count:
            self.error(f"Step {step_num} in Phase {phase_num} not found (phase has {step_count} steps)")

    def validate_status(self, status: str) -> None:
        """Validate status value"""
        if status not in VALID_STATUSES:
            self.error(
                f"Invalid status '{status}' (valid: {', '.join(VALID_STATUSES)})"
            )

    def validate_status_transition(self, current_status: str, new_status: str) -> None:
        """Validate status transition is allowed"""
        if current_status == new_status:
            return  # No transition

        if self.force:
            return  # Allow any transition with --force

        allowed = STATUS_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            self.error(
                f"Invalid transition from '{current_status}' to '{new_status}'\n"
                f"  Allowed transitions: {', '.join(allowed) if allowed else 'none (use --force to override)'}"
            )

    def validate_completion(self, completion: int) -> None:
        """Validate completion percentage"""
        if not isinstance(completion, int) or not (0 <= completion <= 100):
            self.error(f"Completion {completion} invalid (must be 0-100)")

    def validate_effort(self, effort: float) -> None:
        """Validate effort value"""
        try:
            effort_val = float(effort)
            if effort_val <= 0:
                self.error(f"Actual effort must be positive number (got '{effort}')")
        except (ValueError, TypeError):
            self.error(f"Actual effort must be number (got '{effort}')")

    def get_phase(self, phase_num: int) -> Dict[str, Any]:
        """Get phase by number"""
        for phase in self.data["phases"]:
            if phase.get("number") == phase_num:
                return phase
        self.error(f"Phase {phase_num} not found")

    def get_step(self, phase_num: int, step_num: int) -> Dict[str, Any]:
        """Get step by number"""
        phase = self.get_phase(phase_num)
        for step in phase.get("steps", []):
            if step.get("number") == step_num:
                return step
        self.error(f"Step {step_num} not found in Phase {phase_num}")

    def _check_dependencies_satisfied(self, phase: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Check if all dependency phases are completed. Returns (satisfied, blocking_phases)"""
        dependencies = phase.get("dependencies", [])
        blocking = []

        for dep in dependencies:
            # Handle both "Phase 1" string and integer formats
            if isinstance(dep, str):
                if dep.lower().startswith("phase "):
                    dep_num = int(dep.split()[-1])
                else:
                    try:
                        dep_num = int(dep)
                    except ValueError:
                        # Skip non-numeric dependencies (named references)
                        continue
            else:
                dep_num = int(dep)

            try:
                dep_phase = self.get_phase(dep_num)
                if dep_phase.get("status") != "completed":
                    blocking.append(f"Phase {dep_num} ({dep_phase.get('status', 'not_started')})")
            except SystemExit:
                # Phase doesn't exist, skip
                continue

        return len(blocking) == 0, blocking

    def update_phase_index(self) -> None:
        """Update the phase_index field for quick status lookups"""
        phases = self.data.get("phases", [])

        completed = []
        in_progress = []
        blocked = []
        not_started = []
        current_in_progress = None
        next_available = None

        for phase in phases:
            num = phase.get("number")
            status = phase.get("status", "not_started")

            if status == "completed":
                completed.append(num)
            elif status == "in_progress":
                in_progress.append(num)
                if current_in_progress is None:
                    current_in_progress = num
            elif status == "blocked":
                blocked.append(num)
            else:
                not_started.append(num)
                # Find next available (first not_started with satisfied dependencies)
                if next_available is None:
                    satisfied, _ = self._check_dependencies_satisfied(phase)
                    if satisfied:
                        next_available = num

        self.data["phase_index"] = {
            "total": len(phases),
            "current_in_progress": current_in_progress,
            "completed": completed,
            "blocked": blocked,
            "not_started": not_started,
            "next_available": next_available
        }

    def start_next_phase(self) -> bool:
        """Find first not_started phase with satisfied dependencies and mark in_progress"""
        phases = self.data.get("phases", [])

        # Check if there's already an in_progress phase
        in_progress = [p for p in phases if p.get("status") == "in_progress"]
        if in_progress:
            self.warning(f"Phase {in_progress[0].get('number')} is already in_progress. Complete it first or use --force.")
            return False

        for phase in phases:
            if phase.get("status") == "not_started":
                satisfied, blocking = self._check_dependencies_satisfied(phase)
                if satisfied:
                    phase_num = phase.get("number")
                    phase["status"] = "in_progress"
                    self.success(f"Started Phase {phase_num}: {phase.get('name', 'Unnamed')}")
                    self.info(f"Assigned to: {phase.get('assigned_subagent', 'unassigned')}")
                    return True
                else:
                    self.info(f"Phase {phase.get('number')} blocked by: {', '.join(blocking)}")

        self.warning("No eligible phases to start (all completed or blocked by dependencies)")
        return False

    def complete_current_phase(self, notes: Optional[str] = None, effort: Optional[float] = None) -> bool:
        """Complete the currently in_progress phase with optional notes and effort"""
        phases = self.data.get("phases", [])

        for phase in phases:
            if phase.get("status") == "in_progress":
                phase_num = phase.get("number")
                phase["status"] = "completed"
                phase["completion_percentage"] = 100

                # Add completion notes if provided
                if notes:
                    phase["completion_notes"] = notes
                    self.info(f"Added completion notes")

                # Add actual effort if provided
                if effort is not None:
                    phase["actual_effort"] = str(effort)
                    self.info(f"Recorded actual effort: {effort}h")

                self.success(f"Completed Phase {phase_num}: {phase.get('name', 'Unnamed')}")
                return True

        self.warning("No phase currently in_progress")
        return False

    def check_and_archive_if_complete(self) -> bool:
        """Move plan to Completed/ folder if all phases are done"""
        phases = self.data.get("phases", [])
        if not phases:
            return False

        all_completed = all(p.get("status") == "completed" for p in phases)

        if all_completed:
            completed_dir = self.plan_file.parent / COMPLETED_DIR
            completed_dir.mkdir(exist_ok=True)

            # Add completion metadata
            if "metadata" not in self.data:
                self.data["metadata"] = {}
            self.data["metadata"]["completed_at"] = datetime.now().isoformat()
            self.data["metadata"]["status"] = "completed"

            # Calculate total actual effort
            total_effort = 0
            for phase in phases:
                try:
                    total_effort += float(phase.get("actual_effort", 0))
                except (ValueError, TypeError):
                    pass
            if total_effort > 0:
                self.data["metadata"]["total_actual_effort"] = str(total_effort)

            dest = completed_dir / self.plan_file.name

            # Write final version
            self.write_plan()

            # Move to completed folder
            try:
                shutil.move(str(self.plan_file), str(dest))
                self.success(f"Plan completed! Archived to: {dest}")
                return True
            except Exception as e:
                self.warning(f"Failed to archive plan: {e}")
                return False

        return False

    def display_status_check(self) -> None:
        """Show current status and next actions (quick view for agents)"""
        phases = self.data.get("phases", [])
        planning = self.data.get("planning", {})

        print(f"\n{BOLD}Plan: {self.plan_file.name}{RESET}")
        print(f"Goal: {planning.get('goal', 'N/A')}")

        # Count by status
        completed = [p for p in phases if p.get("status") == "completed"]
        in_progress = [p for p in phases if p.get("status") == "in_progress"]
        blocked = [p for p in phases if p.get("status") == "blocked"]
        not_started = [p for p in phases if p.get("status") == "not_started"]

        print(f"\n{BOLD}Status:{RESET} {len(completed)}/{len(phases)} phases completed")

        # Current work
        if in_progress:
            p = in_progress[0]
            print(f"\n{BOLD}Currently In Progress:{RESET}")
            print(f"  Phase {p.get('number')}: {p.get('name')}")
            print(f"  Assigned: {p.get('assigned_subagent', 'unassigned')}")
            print(f"  Completion: {p.get('completion_percentage', 0)}%")
            steps = p.get("steps", [])
            completed_steps = sum(1 for s in steps if s.get("status") == "completed")
            print(f"  Steps: {completed_steps}/{len(steps)} completed")

        # Next up
        if not_started:
            print(f"\n{BOLD}Next Available:{RESET}")
            for p in not_started[:3]:  # Show up to 3
                satisfied, blocking = self._check_dependencies_satisfied(p)
                status_icon = SYM_READY if satisfied else SYM_BLOCK
                print(f"  {status_icon} Phase {p.get('number')}: {p.get('name')} [{p.get('assigned_subagent', 'unassigned')}]")
                if not satisfied:
                    print(f"    Blocked by: {', '.join(blocking)}")

        # Blocked phases
        if blocked:
            print(f"\n{BOLD}Blocked:{RESET}")
            for p in blocked:
                print(f"  {SYM_WARN} Phase {p.get('number')}: {p.get('name')}")
                blockers = p.get("blockers", [])
                for b in blockers[:2]:
                    print(f"    - {b.get('issue', 'Unknown issue')}")

        # Quick commands
        print(f"\n{BOLD}Quick Commands:{RESET}")
        if in_progress:
            print(f"  --complete-current  # Complete Phase {in_progress[0].get('number')}")
        if not_started:
            for p in not_started:
                satisfied, _ = self._check_dependencies_satisfied(p)
                if satisfied:
                    print(f"  --start-next        # Start Phase {p.get('number')}")
                    break
        print()

    def display_my_assignments(self, agent_name: str) -> None:
        """Show phases assigned to a specific agent"""
        phases = self.data.get("phases", [])
        planning = self.data.get("planning", {})

        # Find matching phases (case-insensitive partial match)
        agent_lower = agent_name.lower()
        my_phases = [p for p in phases if agent_lower in p.get("assigned_subagent", "").lower()]

        if not my_phases:
            print(f"\n{YELLOW}No phases assigned to '{agent_name}'{RESET}")
            print(f"Available assignments: {', '.join(set(p.get('assigned_subagent', 'unassigned') for p in phases))}")
            return

        print(f"\n{BOLD}Plan: {self.plan_file.name}{RESET}")
        print(f"Goal: {planning.get('goal', 'N/A')}")
        print(f"\n{BOLD}Your Assignments ({agent_name}):{RESET}")

        for p in my_phases:
            status = p.get("status", "not_started")
            status_icon = {
                "not_started": SYM_CIRCLE,
                "in_progress": SYM_SPIN,
                "completed": SYM_CHECK,
                "blocked": SYM_WARN
            }.get(status, "?")

            print(f"\n  {status_icon} Phase {p.get('number')}: {p.get('name')}")
            print(f"    Status: {status} | Completion: {p.get('completion_percentage', 0)}%")
            print(f"    Estimated: {p.get('estimated_effort', '?')}h | Actual: {p.get('actual_effort', 'N/A')}h")

            # Show dependencies if not started
            if status == "not_started":
                satisfied, blocking = self._check_dependencies_satisfied(p)
                if not satisfied:
                    print(f"    {YELLOW}Blocked by: {', '.join(blocking)}{RESET}")
                else:
                    print(f"    {GREEN}Ready to start{RESET}")

            # Show steps
            steps = p.get("steps", [])
            if steps:
                completed_steps = sum(1 for s in steps if s.get("status") == "completed")
                print(f"    Steps: {completed_steps}/{len(steps)}")

        print()

    def update_phase_status(self, phase_num: int, status: str, notes: Optional[str] = None) -> None:
        """Update phase status with validation and optional completion notes"""
        self.validate_phase_number(phase_num)
        self.validate_status(status)

        phase = self.get_phase(phase_num)
        current_status = phase.get("status", "not_started")

        self.validate_status_transition(current_status, status)

        phase["status"] = status

        # Smart defaults
        if status == "completed":
            phase["completion_percentage"] = 100
            self.info(f"Auto-set completion to 100% (status = completed)")
            # Add completion notes if provided
            if notes:
                phase["completion_notes"] = notes
                self.info(f"Added completion notes")
        elif status == "not_started":
            phase["completion_percentage"] = 0
            self.info(f"Auto-set completion to 0% (status = not_started)")

        self.success(f"Updated Phase {phase_num} status: {current_status} {SYM_ARROW} {status}")

    def update_phase_completion(self, phase_num: int, completion: int) -> None:
        """Update phase completion percentage"""
        self.validate_phase_number(phase_num)
        self.validate_completion(completion)

        phase = self.get_phase(phase_num)
        old_completion = phase.get("completion_percentage", 0)
        phase["completion_percentage"] = completion

        self.success(f"Updated Phase {phase_num} completion: {old_completion}% {SYM_ARROW} {completion}%")

    def update_phase_effort(self, phase_num: int, effort: float) -> None:
        """Update phase actual effort"""
        self.validate_phase_number(phase_num)
        self.validate_effort(effort)

        phase = self.get_phase(phase_num)
        old_effort = phase.get("actual_effort")
        phase["actual_effort"] = str(effort)

        if old_effort:
            self.success(f"Updated Phase {phase_num} actual effort: {old_effort}h {SYM_ARROW} {effort}h")
        else:
            self.success(f"Set Phase {phase_num} actual effort: {effort}h")

    def update_step_status(self, phase_num: int, step_num: int, status: str) -> None:
        """Update step status"""
        self.validate_step_number(phase_num, step_num)
        self.validate_status(status)

        step = self.get_step(phase_num, step_num)
        current_status = step.get("status", "not_started")

        self.validate_status_transition(current_status, status)

        step["status"] = status
        self.success(f"Updated Phase {phase_num}, Step {step_num} status: {current_status} {SYM_ARROW} {status}")

        # Update phase completion based on step completion
        phase = self.get_phase(phase_num)
        total_steps = len(phase.get("steps", []))
        completed_steps = sum(1 for s in phase.get("steps", []) if s.get("status") == "completed")

        if total_steps > 0:
            new_completion = int((completed_steps / total_steps) * 100)
            old_completion = phase.get("completion_percentage", 0)
            if new_completion != old_completion:
                phase["completion_percentage"] = new_completion
                self.info(f"Auto-updated Phase {phase_num} completion: {old_completion}% {SYM_ARROW} {new_completion}% ({completed_steps}/{total_steps} steps)")

    def add_execution_history(self, context_file: str, notes: str) -> None:
        """Add entry to execution_history"""
        # Validate context file exists
        context_path = Path(context_file)
        if not context_path.is_absolute():
            # Try relative to plan file directory
            context_path = self.plan_file.parent.parent / "Context" / context_file

        if not context_path.exists():
            self.error(f"Context file not found: {context_file}")

        # Initialize execution_history if not exists
        if "execution_history" not in self.data:
            self.data["execution_history"] = []

        # Create entry
        entry = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "context_file": context_path.name,
            "notes": notes
        }

        # Add phase completion summary
        phases = self.data.get("phases", [])
        completed_phases = [p.get("number") for p in phases if p.get("status") == "completed"]
        in_progress_phases = [p.get("number") for p in phases if p.get("status") == "in_progress"]

        if completed_phases:
            entry["phases_completed"] = completed_phases
        if in_progress_phases:
            entry["phases_in_progress"] = in_progress_phases

        self.data["execution_history"].append(entry)
        self.success(f"Added execution history entry (context: {context_path.name})")

    def update_metadata(self) -> None:
        """Update metadata.last_updated"""
        if "metadata" not in self.data:
            self.data["metadata"] = {}

        self.data["metadata"]["last_updated"] = datetime.now().isoformat()

    def write_plan(self) -> None:
        """Write plan to file atomically"""
        # Update metadata
        self.update_metadata()

        # Update phase index for quick lookups
        self.update_phase_index()

        # Write to temp file first
        temp_fd, temp_path = tempfile.mkstemp(
            suffix=".json",
            prefix=f".{self.plan_file.stem}_",
            dir=self.plan_file.parent,
            text=True
        )

        try:
            with os.fdopen(temp_fd, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
                f.write('\n')  # Trailing newline

            # Atomic rename
            shutil.move(temp_path, self.plan_file)
            self.info("Plan file written successfully")

        except Exception as e:
            # Clean up temp file on error
            try:
                os.unlink(temp_path)
            except:
                pass
            self.error(f"Failed to write plan file: {e}")

    def run_validation(self) -> Tuple[int, str]:
        """Run validation hook and return exit code and stderr"""
        hook_path = Path(".claude/hooks/validate-plan.py")

        # Make hook path relative to project root
        project_root = self.plan_file.parent.parent.parent
        hook_full_path = project_root / hook_path

        if not hook_full_path.exists():
            self.warning(f"Validation hook not found: {hook_full_path}")
            return 0, ""

        # Prepare hook input
        hook_input = {
            "tool_name": "Write",
            "tool_input": {
                "file_path": f"Docs/Plans/{self.plan_file.name}",
                "content": json.dumps(self.data, indent=2)
            }
        }

        try:
            result = subprocess.run(
                [sys.executable, str(hook_full_path)],
                input=json.dumps(hook_input),
                capture_output=True,
                text=True,
                cwd=str(project_root),
                env={**os.environ, "CLAUDE_PROJECT_DIR": str(project_root)}
            )
            return result.returncode, result.stderr
        except Exception as e:
            self.warning(f"Failed to run validation hook: {e}")
            return 0, ""

    def display_summary(self) -> None:
        """Display plan summary (read-only)"""
        metadata = self.data.get("metadata", {})
        planning = self.data.get("planning", {})
        phases = self.data.get("phases", [])

        # Header
        print(f"\n{BOLD}Plan: {self.plan_file.name}{RESET}")
        print(f"Goal: {planning.get('goal', 'N/A')}")
        priority = planning.get('priority', 'N/A')
        timeline = planning.get('estimated_timeline', 'N/A')
        print(f"Priority: {priority} | Timeline: {timeline} | Phases: {len(phases)}")

        # Phase summary
        for phase in phases:
            num = phase.get("number", "?")
            name = phase.get("name", "Unnamed Phase")
            status = phase.get("status", "not_started")
            completion = phase.get("completion_percentage", 0)
            estimated = phase.get("estimated_effort", "?")
            actual = phase.get("actual_effort", "N/A")
            assigned = phase.get("assigned_subagent", "unassigned")
            steps = phase.get("steps", [])
            completed_steps = sum(1 for s in steps if s.get("status") == "completed")

            # Status icon
            status_icon = {
                "not_started": SYM_CIRCLE,
                "in_progress": SYM_SPIN,
                "completed": SYM_CHECK,
                "blocked": SYM_WARN
            }.get(status, "?")

            print(f"\n{BOLD}Phase {num}: {name}{RESET}")
            print(f"  Status: {status_icon} {status} | Completion: {completion}% | Effort: {estimated}h (estimated) / {actual}h (actual)")
            print(f"  Assigned: {assigned}")
            print(f"  Steps: {completed_steps}/{len(steps)} completed")

        # Execution history
        if "execution_history" in self.data and self.data["execution_history"]:
            print(f"\n{BOLD}Execution History:{RESET}")
            for entry in self.data["execution_history"]:
                date_str = entry.get("date", "?")
                context = entry.get("context_file", "N/A")
                notes = entry.get("notes", "")
                print(f"  {date_str} - {context}")
                if notes:
                    print(f"    {notes}")

        print()


def main():
    parser = argparse.ArgumentParser(
        description="Safely update plan JSON files with validation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Update phase status
  plan-update.py plan-stripe-11-23-25.json --phase 2 --status in_progress

  # Update completion percentage
  plan-update.py plan-stripe-11-23-25.json --phase 2 --completion 75

  # Update actual effort
  plan-update.py plan-stripe-11-23-25.json --phase 2 --actual-effort 6.5

  # Mark step complete
  plan-update.py plan-stripe-11-23-25.json --phase 2 --step 3 --status completed

  # Add execution history
  plan-update.py plan-stripe-11-23-25.json --add-history --context context-11-23-25-2-30pm.json --notes "Phase 2 completed"

  # View summary
  plan-update.py plan-stripe-11-23-25.json --summary

  # Multi-update (all in one transaction)
  plan-update.py plan-stripe-11-23-25.json --phase 2 --status in_progress --completion 50 --actual-effort 3

  # Quick workflow commands (for agents):
  plan-update.py plan-stripe-11-23-25.json --start-next
  plan-update.py plan-stripe-11-23-25.json --complete-current
  plan-update.py plan-stripe-11-23-25.json --complete-current --completion-notes "Implemented webhook handler with retry logic"
  plan-update.py plan-stripe-11-23-25.json --complete-current --completion-notes "Done" --actual-effort 4.5
  plan-update.py plan-stripe-11-23-25.json --status-check
  plan-update.py plan-stripe-11-23-25.json --my-assignment supabase-backend-specialist

  # Complete specific phase with notes
  plan-update.py plan-stripe-11-23-25.json --phase 2 --status completed --completion-notes "All tests passing"
        """
    )

    parser.add_argument("plan_file", help="Path to plan JSON file")
    parser.add_argument("--phase", type=int, help="Phase number to update")
    parser.add_argument("--step", type=int, help="Step number to update (requires --phase)")
    parser.add_argument("--status", choices=VALID_STATUSES, help="New status value")
    parser.add_argument("--completion", type=int, metavar="0-100", help="Completion percentage (0-100)")
    parser.add_argument("--actual-effort", type=float, metavar="HOURS", help="Actual effort in hours")
    parser.add_argument("--add-history", action="store_true", help="Add execution history entry")
    parser.add_argument("--context", help="Context file for execution history (requires --add-history)")
    parser.add_argument("--notes", help="Notes for execution history (requires --add-history)")
    parser.add_argument("--summary", action="store_true", help="Display plan summary (read-only)")
    parser.add_argument("--force", action="store_true", help="Allow backward status transitions")
    parser.add_argument("--no-backup", action="store_true", help="Skip backup creation")

    # Quick workflow commands for agents
    parser.add_argument("--start-next", action="store_true",
                        help="Start the next available phase (checks dependencies)")
    parser.add_argument("--complete-current", action="store_true",
                        help="Complete the currently in_progress phase")
    parser.add_argument("--completion-notes", metavar="TEXT",
                        help="Notes to add when completing a phase (use with --complete-current or --status completed)")
    parser.add_argument("--status-check", action="store_true",
                        help="Show current status and next actions (read-only)")
    parser.add_argument("--my-assignment", metavar="AGENT",
                        help="Show phases assigned to agent (read-only)")

    args = parser.parse_args()

    # Validate arguments
    if args.step and not args.phase:
        parser.error("--step requires --phase")

    if args.context and not args.add_history:
        parser.error("--context requires --add-history")

    if args.notes and not args.add_history:
        parser.error("--notes requires --add-history")

    if args.add_history and not args.context:
        parser.error("--add-history requires --context")

    # Create updater
    plan_path = Path(args.plan_file)
    updater = PlanUpdater(plan_path, force=args.force)

    # Read-only modes (no backup needed)
    if args.summary:
        updater.display_summary()
        sys.exit(0)

    if args.status_check:
        updater.display_status_check()
        sys.exit(0)

    if args.my_assignment:
        updater.display_my_assignments(args.my_assignment)
        sys.exit(0)

    # Check if any updates requested
    has_updates = any([
        args.status,
        args.completion is not None,
        args.actual_effort is not None,
        args.add_history,
        args.start_next,
        args.complete_current
    ])

    if not has_updates:
        parser.error("No updates specified. Use --summary, --status-check, or --my-assignment for read-only display, or specify update operations.")

    # Create backup
    if not args.no_backup:
        updater.create_backup()

    try:
        # Perform updates (all in one transaction)

        # Quick workflow commands
        if args.start_next:
            if not updater.start_next_phase():
                sys.exit(1)

        if args.complete_current:
            if not updater.complete_current_phase(
                notes=args.completion_notes,
                effort=args.actual_effort
            ):
                sys.exit(1)

        # Specific phase/step updates
        if args.phase:
            if args.step:
                # Step update
                if args.status:
                    updater.update_step_status(args.phase, args.step, args.status)
            else:
                # Phase updates
                if args.status:
                    updater.update_phase_status(args.phase, args.status, notes=args.completion_notes)
                if args.completion is not None:
                    updater.update_phase_completion(args.phase, args.completion)
                if args.actual_effort is not None:
                    updater.update_phase_effort(args.phase, args.actual_effort)

        if args.add_history:
            updater.add_execution_history(args.context, args.notes or "")

        # Check if plan is complete and should be archived
        if updater.check_and_archive_if_complete():
            # Plan was archived, exit successfully
            sys.exit(0)

        # Write changes (if not already archived)
        updater.write_plan()

        # Run validation
        print(f"\n{BOLD}Running validation...{RESET}", file=sys.stderr)
        exit_code, stderr = updater.run_validation()

        if stderr:
            print(stderr, file=sys.stderr)

        if exit_code == 2:
            # Blocking error - restore backup
            updater.error("Validation failed with blocking errors. Restoring backup...", exit_code=0)
            updater.restore_backup()
            sys.exit(2)
        elif exit_code == 1:
            # Warnings - keep file but show warnings
            updater.warning("Validation passed with warnings. File saved but consider addressing issues.")
            sys.exit(1)
        else:
            # Success
            updater.success("Plan updated and validated successfully!")
            sys.exit(0)

    except KeyboardInterrupt:
        print(f"\n{YELLOW}Interrupted by user{RESET}", file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        updater.error(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()
