#!/usr/bin/env python3
"""
Hook: Validate Context File Structure and Naming Convention
Event: PreToolUse
Matcher: Write|Edit
Purpose: Ensure all context JSON files follow the template structure and naming convention

Exit Codes:
  0 = Success (valid context file)
  1 = Warning (filename doesn't match pattern - warn but allow)
  2 = Blocking error (invalid JSON structure - prevent write)
"""

import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Filename pattern: context-MM-DD-YY-H-MMPM.json
# Examples: context-11-23-25-2-30pm.json, context-12-15-25-10-45am.json
FILENAME_PATTERN = r'^context-\d{2}-\d{2}-\d{2}-\d{1,2}-\d{2}[ap]m\.json$'

# Required top-level fields and their subfields
REQUIRED_STRUCTURE = {
    'metadata': ['timestamp', 'session_id', 'version', 'claude_model'],
    'session': ['subject', 'goal', 'priority'],
    'context': {
        'files': 'array',
        'documentation': 'array',
        'plan': 'object',
        'subagents_used': 'array'
    },
    'progress': {
        'blockers': 'array',
        'decisions_made': 'array',
        'testing_status': 'object'
    },
    'next_steps': 'array',
    'summary': 'string'
}


def validate_filename(filepath: str) -> Tuple[bool, str]:
    """
    Validate filename matches context-MM-DD-YY-H-MMPM.json pattern.

    Returns:
        Tuple of (is_valid, error_message)
    """
    filename = Path(filepath).name

    if not re.match(FILENAME_PATTERN, filename):
        error_msg = f"""
⚠️  Filename pattern mismatch: {filename}

Expected pattern: context-MM-DD-YY-H-MMPM.json

Valid examples:
  ✅ context-11-23-25-2-30pm.json
  ✅ context-12-15-25-10-45am.json

Invalid examples:
  ❌ context-11-23-2025.json (wrong year format)
  ❌ context-11-23-25-2-30PM.json (uppercase AM/PM)
  ❌ context-11-23-25.json (missing time)

Regex pattern: {FILENAME_PATTERN}
"""
        return False, error_msg.strip()

    return True, ""


def validate_structure(data: Dict, filepath: str) -> Tuple[bool, List[str]]:
    """
    Validate JSON structure matches required template.

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    # Check top-level required fields
    for field in ['metadata', 'session', 'context', 'progress', 'next_steps', 'summary']:
        if field not in data:
            errors.append(f"Missing required top-level field: '{field}'")

    # Validate metadata subfields
    if 'metadata' in data:
        if not isinstance(data['metadata'], dict):
            errors.append("Field 'metadata' must be an object")
        else:
            for subfield in REQUIRED_STRUCTURE['metadata']:
                if subfield not in data['metadata']:
                    errors.append(f"Missing required field: metadata.{subfield}")

    # Validate session subfields
    if 'session' in data:
        if not isinstance(data['session'], dict):
            errors.append("Field 'session' must be an object")
        else:
            for subfield in REQUIRED_STRUCTURE['session']:
                if subfield not in data['session']:
                    errors.append(f"Missing required field: session.{subfield}")

    # Validate context structure
    if 'context' in data:
        if not isinstance(data['context'], dict):
            errors.append("Field 'context' must be an object")
        else:
            context = data['context']

            # Check context.files (array)
            if 'files' not in context:
                errors.append("Missing required field: context.files")
            elif not isinstance(context['files'], list):
                errors.append("Field 'context.files' must be an array")

            # Check context.documentation (array)
            if 'documentation' not in context:
                errors.append("Missing required field: context.documentation")
            elif not isinstance(context['documentation'], list):
                errors.append("Field 'context.documentation' must be an array")

            # Check context.plan (object)
            if 'plan' not in context:
                errors.append("Missing required field: context.plan")
            elif not isinstance(context['plan'], dict):
                errors.append("Field 'context.plan' must be an object")

            # Check context.subagents_used (array)
            if 'subagents_used' not in context:
                errors.append("Missing required field: context.subagents_used")
            elif not isinstance(context['subagents_used'], list):
                errors.append("Field 'context.subagents_used' must be an array")

    # Validate progress structure
    if 'progress' in data:
        if not isinstance(data['progress'], dict):
            errors.append("Field 'progress' must be an object")
        else:
            progress = data['progress']

            # Check progress.blockers (array)
            if 'blockers' not in progress:
                errors.append("Missing required field: progress.blockers")
            elif not isinstance(progress['blockers'], list):
                errors.append("Field 'progress.blockers' must be an array")

            # Check progress.decisions_made (array)
            if 'decisions_made' not in progress:
                errors.append("Missing required field: progress.decisions_made")
            elif not isinstance(progress['decisions_made'], list):
                errors.append("Field 'progress.decisions_made' must be an array")

            # Check progress.testing_status (object)
            if 'testing_status' not in progress:
                errors.append("Missing required field: progress.testing_status")
            elif not isinstance(progress['testing_status'], dict):
                errors.append("Field 'progress.testing_status' must be an object")

    # Validate next_steps (array)
    if 'next_steps' in data:
        if not isinstance(data['next_steps'], list):
            errors.append("Field 'next_steps' must be an array")

    # Validate summary (string)
    if 'summary' in data:
        if not isinstance(data['summary'], str):
            errors.append("Field 'summary' must be a string")

    return len(errors) == 0, errors


def main():
    """Main hook execution."""
    try:
        # Parse JSON input from stdin
        try:
            input_data = json.load(sys.stdin)
        except json.JSONDecodeError as e:
            print(f"Hook error: Invalid JSON input - {e}", file=sys.stderr)
            sys.exit(1)

        # Extract file paths from tool input
        tool_input = input_data.get('tool_input', {})
        file_path = tool_input.get('file_path', '')

        # Only validate files in Docs/Context/ directory
        if not file_path or 'Docs/Context/' not in file_path:
            sys.exit(0)  # Not a context file, skip validation

        # Only validate .json files
        if not file_path.endswith('.json'):
            sys.exit(0)  # Not a JSON file, skip validation

        # Skip template file
        if 'context-template.json' in file_path:
            sys.exit(0)  # Template file, skip validation

        # Validate filename pattern
        filename_valid, filename_error = validate_filename(file_path)

        # Get file content from tool_input
        content = tool_input.get('content', '')

        if not content:
            print("⚠️  No content to validate", file=sys.stderr)
            sys.exit(1)

        # Parse JSON content
        try:
            json_data = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"🚫 Invalid JSON in context file", file=sys.stderr)
            print(f"Parse error: {e}", file=sys.stderr)
            print(f"File: {file_path}", file=sys.stderr)
            sys.exit(2)  # BLOCK - invalid JSON

        # Validate structure
        structure_valid, structure_errors = validate_structure(json_data, file_path)

        # Handle validation results
        if not structure_valid:
            # BLOCKING error - invalid structure
            print(f"🚫 Context file validation FAILED: {Path(file_path).name}", file=sys.stderr)
            print(f"\nStructure validation errors:", file=sys.stderr)
            for error in structure_errors:
                print(f"  • {error}", file=sys.stderr)
            print(f"\nTemplate reference: /Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025/Docs/Context/context-template.json", file=sys.stderr)
            sys.exit(2)  # BLOCK - invalid structure

        if not filename_valid:
            # NON-BLOCKING warning - filename pattern mismatch
            print(filename_error, file=sys.stderr)
            print("\nStructure is valid, but filename doesn't match convention.", file=sys.stderr)
            sys.exit(1)  # Warning only

        # Success - valid context file
        print(f"✅ Context file validation passed: {Path(file_path).name}")
        sys.exit(0)

    except Exception as e:
        print(f"Hook error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)  # Non-blocking error


if __name__ == '__main__':
    main()
