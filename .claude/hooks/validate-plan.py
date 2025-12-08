#!/usr/bin/env python3
"""
Hook: Validate Plan JSON Files
Event: PreToolUse
Matcher: Write|Edit
Purpose: Ensure all plan files follow template structure and naming convention

Exit Codes:
  0 - Success (valid plan file)
  1 - Warning (quality issues, non-blocking)
  2 - Blocking error (invalid structure, circular dependencies, invalid references)
"""

import sys
import json
import re
import os
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any, Optional

# ANSI color codes for pretty output
RED = "\033[91m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"

# Template paths
AGENT_INDEX_PATH = ".claude/agents/agent-index.md"
PLAN_DIR = "Docs/Plans/"

# Validation constants
FILENAME_PATTERN = r"^plan-[a-z0-9]([a-z0-9-]*[a-z0-9])?-\d{2}-\d{2}-\d{2}\.json$"
MAX_FEATURE_NAME_LENGTH = 50
VALID_STATUSES = ["not_started", "in_progress", "completed", "blocked"]
VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"]
MAX_PHASES = 8
MAX_PHASE_HOURS = 20


def load_valid_subagents() -> Set[str]:
    """Load valid subagent names from agent-index.md"""
    try:
        project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
        agent_index = Path(project_dir) / AGENT_INDEX_PATH

        if not agent_index.exists():
            print(f"{YELLOW}Warning: Agent index not found at {agent_index}{RESET}", file=sys.stderr)
            return set()

        with open(agent_index, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract subagent names from the quick reference table
        subagents = set()

        # Pattern to match agent names in the table
        # Format: | Category | agent-name | Use When | Key Technologies |
        pattern = r'\|\s+\w+\s+\|\s+([\w-]+)\s+\|'
        matches = re.finditer(pattern, content)

        for match in matches:
            agent_name = match.group(1).strip()
            if agent_name not in ["Agent", "Category"]:  # Skip header rows
                subagents.add(agent_name)

        # Also add 'human' as valid
        subagents.add("human")

        return subagents
    except Exception as e:
        print(f"{YELLOW}Warning: Failed to load agent index: {e}{RESET}", file=sys.stderr)
        return {"human"}  # Fallback to at least allowing 'human'


def validate_filename(filename: str) -> Tuple[bool, List[str]]:
    """Validate plan filename against naming convention"""
    errors = []

    # Skip template and examples
    if filename in ["plan-template.json"] or filename.startswith("plan-example-"):
        return True, []

    # Check overall pattern
    if not re.match(FILENAME_PATTERN, filename):
        errors.append(
            f"Filename '{filename}' does not match pattern: plan-[feature-name]-MM-DD-YY.json\n"
            f"  Requirements:\n"
            f"    - Lowercase letters, numbers, and hyphens only\n"
            f"    - Feature name cannot start/end with hyphen\n"
            f"    - Date format: MM-DD-YY (two digits each)\n"
            f"  Examples:\n"
            f"    {GREEN}✓{RESET} plan-stripe-integration-11-23-25.json\n"
            f"    {GREEN}✓{RESET} plan-boldsign-embedded-signing-11-25-25.json\n"
            f"    {RED}✗{RESET} plan-Stripe-Integration-11-23-25.json (uppercase)\n"
            f"    {RED}✗{RESET} plan-stripe_integration-11-23-25.json (underscore)"
        )
        return False, errors

    # Extract feature name and validate
    parts = filename.replace(".json", "").split("-")
    if len(parts) < 5:
        errors.append(f"Filename '{filename}' has invalid structure")
        return False, errors

    # Feature name is everything between 'plan-' and the date
    feature_name = "-".join(parts[1:-3])

    if len(feature_name) > MAX_FEATURE_NAME_LENGTH:
        errors.append(
            f"Feature name '{feature_name}' exceeds {MAX_FEATURE_NAME_LENGTH} characters "
            f"(actual: {len(feature_name)})"
        )

    # Validate date components
    month = parts[-3]
    day = parts[-2]
    year = parts[-1]

    if not (month.isdigit() and 1 <= int(month) <= 12):
        errors.append(f"Invalid month: {month} (must be 01-12)")

    if not (day.isdigit() and 1 <= int(day) <= 31):
        errors.append(f"Invalid day: {day} (must be 01-31)")

    if not (year.isdigit() and len(year) == 2):
        errors.append(f"Invalid year: {year} (must be two digits)")

    return len(errors) == 0, errors


def validate_required_fields(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validate required top-level fields exist"""
    errors = []

    required_top_level = {
        "metadata": ["created", "created_by", "plan_id", "version"],
        "planning": ["goal", "reason", "scope", "success_metrics", "estimated_timeline", "priority"],
        "files_impacted": None,  # Array
        "phases": None,  # Array, minimum 2
        "subagent_assignments": None,  # Array
        "reference_documents": None,  # Array
        "potential_blockers": None,  # Array
        "success_criteria": None,  # Array
    }

    for field, subfields in required_top_level.items():
        if field not in data:
            errors.append(f"Missing required top-level field: '{field}'")
            continue

        # If subfields are specified, validate them
        if subfields is not None and isinstance(data[field], dict):
            for subfield in subfields:
                if subfield not in data[field]:
                    errors.append(f"Missing required field: '{field}.{subfield}'")

        # Validate arrays are actually arrays
        if field in ["files_impacted", "phases", "subagent_assignments",
                     "reference_documents", "potential_blockers", "success_criteria"]:
            if not isinstance(data[field], list):
                errors.append(f"Field '{field}' must be an array")

    # Validate minimum phases
    if "phases" in data and isinstance(data["phases"], list):
        if len(data["phases"]) < 2:
            errors.append(
                f"Plan must have at least 2 phases (found {len(data['phases'])})\n"
                f"  Tip: Break work into logical phases (setup, implementation, testing, etc.)"
            )

    return len(errors) == 0, errors


def validate_phases(phases: List[Dict[str, Any]], valid_subagents: Set[str]) -> Tuple[bool, List[str], List[str]]:
    """Validate phase structure and dependencies"""
    errors = []
    warnings = []

    phase_numbers = set()
    phase_names = {}

    for i, phase in enumerate(phases, 1):
        phase_context = f"Phase {i}"

        # Required phase fields
        required = [
            "number", "name", "description", "status", "completion_percentage",
            "estimated_effort", "assigned_subagent", "steps", "dependencies",
            "blockers", "deliverables"
        ]

        for field in required:
            if field not in phase:
                errors.append(f"{phase_context}: Missing required field '{field}'")

        # Validate phase number
        if "number" in phase:
            num = phase["number"]
            if num in phase_numbers:
                errors.append(f"{phase_context}: Duplicate phase number {num}")
            phase_numbers.add(num)
            phase_names[num] = phase.get("name", f"Phase {num}")

        # Validate status
        if "status" in phase:
            if phase["status"] not in VALID_STATUSES:
                errors.append(
                    f"{phase_context}: Invalid status '{phase['status']}'\n"
                    f"  Valid statuses: {', '.join(VALID_STATUSES)}"
                )

        # Validate completion_percentage
        if "completion_percentage" in phase:
            pct = phase["completion_percentage"]
            if not isinstance(pct, int) or not (0 <= pct <= 100):
                errors.append(
                    f"{phase_context}: completion_percentage must be integer 0-100 (got {pct})"
                )

        # Validate estimated_effort
        if "estimated_effort" in phase:
            effort = phase["estimated_effort"]
            try:
                hours = float(str(effort))
                if hours <= 0:
                    errors.append(f"{phase_context}: estimated_effort must be positive (got {effort})")
                elif hours > MAX_PHASE_HOURS:
                    warnings.append(
                        f"{phase_context}: estimated_effort is {hours} hours (>{MAX_PHASE_HOURS}h)\n"
                        f"  Suggestion: Consider breaking this phase into smaller phases"
                    )
            except (ValueError, TypeError):
                errors.append(f"{phase_context}: estimated_effort must be a number (got {effort})")
        else:
            warnings.append(f"{phase_context}: Missing 'estimated_effort' - helpful for planning")

        # Validate assigned_subagent
        if "assigned_subagent" in phase:
            subagent = phase["assigned_subagent"]
            if subagent not in valid_subagents:
                # Provide helpful suggestions
                suggestions = [s for s in valid_subagents if s in subagent or subagent in s]
                error_msg = (
                    f"{phase_context}: Unknown subagent '{subagent}'\n"
                    f"  Valid subagents: {', '.join(sorted(valid_subagents))}"
                )
                if suggestions:
                    error_msg += f"\n  Did you mean: {', '.join(suggestions)}?"
                errors.append(error_msg)

            # Warn if complex phase has no subagent
            if subagent == "human" and "estimated_effort" in phase:
                try:
                    hours = float(str(phase["estimated_effort"]))
                    if hours > 10:
                        warnings.append(
                            f"{phase_context}: Complex phase ({hours}h) assigned to 'human'\n"
                            f"  Consider: Could a specialist subagent help with this?"
                        )
                except (ValueError, TypeError):
                    pass

        # Validate steps array
        if "steps" in phase:
            if not isinstance(phase["steps"], list):
                errors.append(f"{phase_context}: 'steps' must be an array")
            elif len(phase["steps"]) == 0:
                errors.append(f"{phase_context}: 'steps' array is empty - add at least one step")

        # Validate dependencies array
        if "dependencies" in phase:
            if not isinstance(phase["dependencies"], list):
                errors.append(f"{phase_context}: 'dependencies' must be an array")

    # Check for circular dependencies
    circular_errors = detect_circular_dependencies(phases)
    errors.extend(circular_errors)

    # Warn if too many phases
    if len(phases) > MAX_PHASES:
        warnings.append(
            f"Plan has {len(phases)} phases (>{MAX_PHASES})\n"
            f"  Suggestion: Consider if some phases can be combined to avoid over-planning"
        )

    return len(errors) == 0, errors, warnings


def detect_circular_dependencies(phases: List[Dict[str, Any]]) -> List[str]:
    """Detect circular dependencies using DFS"""
    errors = []

    # Build adjacency list
    graph: Dict[int, List[int]] = {}
    phase_by_number = {}

    for phase in phases:
        num = phase.get("number")
        if num is None:
            continue

        phase_by_number[num] = phase
        graph[num] = []

        # Parse dependencies
        deps = phase.get("dependencies", [])
        for dep in deps:
            # Dependencies can be phase numbers or names like "Phase 1"
            dep_num = None
            if isinstance(dep, int):
                dep_num = dep
            elif isinstance(dep, str):
                # Try to extract number from strings like "Phase 1" or "1"
                match = re.search(r'\d+', dep)
                if match:
                    dep_num = int(match.group())

            if dep_num is not None:
                graph[num].append(dep_num)

    # DFS to detect cycles
    visited = set()
    rec_stack = set()

    def has_cycle(node: int, path: List[int]) -> Optional[List[int]]:
        visited.add(node)
        rec_stack.add(node)
        path.append(node)

        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                cycle = has_cycle(neighbor, path[:])
                if cycle:
                    return cycle
            elif neighbor in rec_stack:
                # Found a cycle
                cycle_start = path.index(neighbor)
                return path[cycle_start:] + [neighbor]

        rec_stack.remove(node)
        return None

    for node in graph:
        if node not in visited:
            cycle = has_cycle(node, [])
            if cycle:
                cycle_str = " → ".join([f"Phase {n}" for n in cycle])
                errors.append(
                    f"Circular dependency detected: {cycle_str}\n"
                    f"  Fix: Remove or reorder dependencies to break the cycle"
                )
                break  # Report first cycle found

    return errors


def validate_subagent_assignments(
    assignments: List[Dict[str, Any]],
    phases: List[Dict[str, Any]],
    valid_subagents: Set[str]
) -> Tuple[bool, List[str], List[str]]:
    """Validate subagent assignments reference valid subagents and phases"""
    errors = []
    warnings = []

    phase_numbers = {p.get("number") for p in phases if "number" in p}

    for i, assignment in enumerate(assignments, 1):
        context = f"Subagent Assignment {i}"

        # Validate subagent name
        if "subagent" not in assignment:
            errors.append(f"{context}: Missing 'subagent' field")
            continue

        subagent = assignment["subagent"]
        if subagent not in valid_subagents:
            suggestions = [s for s in valid_subagents if s in subagent or subagent in s]
            error_msg = (
                f"{context}: Unknown subagent '{subagent}'\n"
                f"  Valid subagents: {', '.join(sorted(valid_subagents))}"
            )
            if suggestions:
                error_msg += f"\n  Did you mean: {', '.join(suggestions)}?"
            errors.append(error_msg)

        # Validate phases_involved
        if "phases_involved" in assignment:
            involved = assignment["phases_involved"]
            if not isinstance(involved, list):
                errors.append(f"{context}: 'phases_involved' must be an array")
            else:
                for phase_num in involved:
                    if phase_num not in phase_numbers:
                        errors.append(
                            f"{context}: References non-existent phase {phase_num}\n"
                            f"  Valid phase numbers: {sorted(phase_numbers)}"
                        )

    return len(errors) == 0, errors, warnings


def validate_quality(data: Dict[str, Any]) -> List[str]:
    """Perform quality checks (warnings only, non-blocking)"""
    warnings = []

    # Check for high-severity blockers without mitigation
    if "potential_blockers" in data:
        for blocker in data["potential_blockers"]:
            if blocker.get("impact") == "High" and not blocker.get("mitigation_strategy"):
                warnings.append(
                    f"High-impact blocker lacks mitigation strategy: '{blocker.get('issue', 'Unknown')}'\n"
                    f"  Recommendation: Add 'mitigation_strategy' field"
                )

    # Check for empty success criteria
    if "success_criteria" in data and len(data["success_criteria"]) == 0:
        warnings.append(
            "No success criteria defined\n"
            f"  Recommendation: Add measurable success criteria to verify completion"
        )

    # Check priority is valid
    if "planning" in data and "priority" in data["planning"]:
        priority = data["planning"]["priority"]
        if priority not in VALID_PRIORITIES:
            warnings.append(
                f"Invalid priority '{priority}'\n"
                f"  Valid priorities: {', '.join(VALID_PRIORITIES)}"
            )

    return warnings


def main():
    """Main validation logic"""
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"{RED}✗ Invalid JSON input: {e}{RESET}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"{RED}✗ Hook error: {e}{RESET}", file=sys.stderr)
        sys.exit(1)

    # Get file path from input
    tool_name = input_data.get("tool_name", "")

    # Only validate Write/Edit operations
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

    # Get file path
    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")

    # Only validate files in Docs/Plans/
    if not file_path.startswith(PLAN_DIR) or not file_path.endswith(".json"):
        sys.exit(0)

    filename = os.path.basename(file_path)

    # Skip template and examples
    if filename in ["plan-template.json"] or filename.startswith("plan-example-"):
        print(f"{BLUE}ℹ Skipping validation for {filename} (template/example){RESET}", file=sys.stderr)
        sys.exit(0)

    print(f"\n{BOLD}Validating Plan: {filename}{RESET}", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    # Validation stages
    all_errors = []
    all_warnings = []

    # Stage 1: Filename validation
    print(f"\n{BLUE}Stage 1: Filename Validation{RESET}", file=sys.stderr)
    filename_valid, filename_errors = validate_filename(filename)
    if not filename_valid:
        all_errors.extend(filename_errors)
        for error in filename_errors:
            print(f"  {RED}✗{RESET} {error}", file=sys.stderr)
    else:
        print(f"  {GREEN}✓{RESET} Filename follows naming convention", file=sys.stderr)

    # Parse JSON content
    content = tool_input.get("content", "")
    if not content:
        # Try to read existing file for Edit operations
        project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
        full_path = Path(project_dir) / file_path
        if full_path.exists():
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

    if not content:
        print(f"\n{RED}✗ No content to validate{RESET}", file=sys.stderr)
        sys.exit(2)

    try:
        plan_data = json.loads(content)
    except json.JSONDecodeError as e:
        print(f"\n{RED}✗ Invalid JSON in plan file: {e}{RESET}", file=sys.stderr)
        sys.exit(2)

    # Stage 2: Required fields validation
    print(f"\n{BLUE}Stage 2: Required Fields Validation{RESET}", file=sys.stderr)
    fields_valid, field_errors = validate_required_fields(plan_data)
    if not fields_valid:
        all_errors.extend(field_errors)
        for error in field_errors:
            print(f"  {RED}✗{RESET} {error}", file=sys.stderr)
    else:
        print(f"  {GREEN}✓{RESET} All required fields present", file=sys.stderr)

    # Load valid subagents
    valid_subagents = load_valid_subagents()

    # Stage 3: Phase validation
    if "phases" in plan_data and isinstance(plan_data["phases"], list):
        print(f"\n{BLUE}Stage 3: Phase Validation ({len(plan_data['phases'])} phases){RESET}", file=sys.stderr)
        phases_valid, phase_errors, phase_warnings = validate_phases(
            plan_data["phases"],
            valid_subagents
        )
        all_errors.extend(phase_errors)
        all_warnings.extend(phase_warnings)

        if phases_valid:
            print(f"  {GREEN}✓{RESET} All phases valid", file=sys.stderr)
        else:
            for error in phase_errors:
                print(f"  {RED}✗{RESET} {error}", file=sys.stderr)

        for warning in phase_warnings:
            print(f"  {YELLOW}⚠{RESET} {warning}", file=sys.stderr)

    # Stage 4: Subagent assignments validation
    if "subagent_assignments" in plan_data and isinstance(plan_data["subagent_assignments"], list):
        print(f"\n{BLUE}Stage 4: Subagent Assignment Validation{RESET}", file=sys.stderr)
        assignments_valid, assignment_errors, assignment_warnings = validate_subagent_assignments(
            plan_data["subagent_assignments"],
            plan_data.get("phases", []),
            valid_subagents
        )
        all_errors.extend(assignment_errors)
        all_warnings.extend(assignment_warnings)

        if assignments_valid:
            print(f"  {GREEN}✓{RESET} All subagent assignments valid", file=sys.stderr)
        else:
            for error in assignment_errors:
                print(f"  {RED}✗{RESET} {error}", file=sys.stderr)

    # Stage 5: Quality checks
    print(f"\n{BLUE}Stage 5: Quality Checks{RESET}", file=sys.stderr)
    quality_warnings = validate_quality(plan_data)
    all_warnings.extend(quality_warnings)

    if len(quality_warnings) == 0:
        print(f"  {GREEN}✓{RESET} No quality issues detected", file=sys.stderr)
    else:
        for warning in quality_warnings:
            print(f"  {YELLOW}⚠{RESET} {warning}", file=sys.stderr)

    # Summary
    print("\n" + "=" * 60, file=sys.stderr)
    print(f"{BOLD}Validation Summary{RESET}", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(f"Errors:   {len(all_errors)}", file=sys.stderr)
    print(f"Warnings: {len(all_warnings)}", file=sys.stderr)

    # Determine exit code
    if len(all_errors) > 0:
        print(f"\n{RED}{BOLD}✗ VALIDATION FAILED{RESET}", file=sys.stderr)
        print(f"{RED}Plan file has {len(all_errors)} blocking error(s). Please fix before continuing.{RESET}\n", file=sys.stderr)
        sys.exit(2)  # Blocking error
    elif len(all_warnings) > 0:
        print(f"\n{YELLOW}{BOLD}⚠ VALIDATION PASSED WITH WARNINGS{RESET}", file=sys.stderr)
        print(f"{YELLOW}Plan file has {len(all_warnings)} quality issue(s). Consider addressing them.{RESET}\n", file=sys.stderr)
        sys.exit(1)  # Non-blocking warning
    else:
        print(f"\n{GREEN}{BOLD}✓ VALIDATION SUCCESSFUL{RESET}", file=sys.stderr)
        print(f"{GREEN}Plan file is valid and follows all best practices!{RESET}\n", file=sys.stderr)
        sys.exit(0)  # Success


if __name__ == "__main__":
    main()
