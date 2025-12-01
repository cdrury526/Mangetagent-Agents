#!/usr/bin/env python3
"""
Hook: End-of-Turn Quality Gates
Event: Stop
Purpose: Run type checking and linting when Claude finishes a turn

Cross-platform script that works on Windows, macOS, and Linux.
"""

import subprocess
import sys
import os
from pathlib import Path


def get_project_dir() -> Path:
    """Get the project directory (where this script's .claude folder lives)."""
    # Script is in .claude/hooks/, so go up two levels
    script_dir = Path(__file__).resolve().parent
    return script_dir.parent.parent


def run_command(cmd: list[str], cwd: Path) -> tuple[bool, str]:
    """Run a command and return (success, output)."""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            shell=(os.name == 'nt')  # Use shell on Windows for npm
        )
        output = result.stdout + result.stderr
        return result.returncode == 0, output
    except FileNotFoundError as e:
        return False, f"Command not found: {e}"
    except Exception as e:
        return False, f"Error running command: {e}"


def check_package_changes(project_dir: Path) -> None:
    """Check if package files changed and warn user."""
    success, output = run_command(
        ["git", "diff", "--name-only", "HEAD"],
        project_dir
    )
    if success and ("package.json" in output or "package-lock.json" in output):
        print("Package files changed - you may want to run npm install", file=sys.stderr)


def run_typecheck(project_dir: Path) -> bool:
    """Run TypeScript type checking."""
    print("Type checking...", file=sys.stderr)

    # Check if typecheck script exists in package.json
    success, output = run_command(["npm", "run", "typecheck"], project_dir)

    if success:
        print("Type check passed", file=sys.stderr)
        return True
    else:
        # Check if it's just a missing script vs actual type errors
        if "Missing script" in output or "missing script" in output.lower():
            print("Type check script not found - skipping", file=sys.stderr)
            return True  # Don't fail if script doesn't exist
        print("Type check failed - please review errors:", file=sys.stderr)
        print(output, file=sys.stderr)
        return False


def run_lint(project_dir: Path) -> bool:
    """Run ESLint."""
    print("Linting...", file=sys.stderr)

    success, output = run_command(["npm", "run", "lint"], project_dir)

    if success:
        print("Lint check passed", file=sys.stderr)
        return True
    else:
        if "Missing script" in output or "missing script" in output.lower():
            print("Lint script not found - skipping", file=sys.stderr)
            return True  # Don't fail if script doesn't exist
        print("Lint check failed - please review warnings:", file=sys.stderr)
        print(output, file=sys.stderr)
        return False


def main() -> int:
    """Main entry point."""
    print("Running end-of-turn quality checks...", file=sys.stderr)

    project_dir = get_project_dir()

    if not project_dir.exists():
        print(f"Project directory not found: {project_dir}", file=sys.stderr)
        return 1

    # Check for package.json changes
    check_package_changes(project_dir)

    # Run quality checks
    typecheck_passed = run_typecheck(project_dir)
    lint_passed = run_lint(project_dir)

    # Summary
    if typecheck_passed and lint_passed:
        print("All quality checks passed!", file=sys.stderr)
        return 0
    else:
        print("Some quality checks failed - please review above", file=sys.stderr)
        return 1  # Non-zero exit = warning (non-blocking)


if __name__ == "__main__":
    sys.exit(main())
