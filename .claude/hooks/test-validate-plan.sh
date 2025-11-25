#!/bin/bash
# Test script for validate-plan.py hook
# Run: bash .claude/hooks/test-validate-plan.sh

HOOK_SCRIPT=".claude/hooks/validate-plan.py"
GREEN="\033[92m"
RED="\033[91m"
BLUE="\033[94m"
YELLOW="\033[93m"
RESET="\033[0m"
BOLD="\033[1m"

echo -e "${BOLD}Testing Plan Validation Hook${RESET}"
echo "========================================"
echo ""

# Test 1: Invalid filename (uppercase)
echo -e "${BLUE}Test 1: Invalid filename (uppercase)${RESET}"
echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-Stripe-Integration-11-23-25.json",
    "content": "{}"
  }
}' | $HOOK_SCRIPT
EXIT_CODE=$?
echo -e "Exit code: $EXIT_CODE (expected: 2)\n"

# Test 2: Invalid filename (wrong date format)
echo -e "${BLUE}Test 2: Invalid filename (wrong date format)${RESET}"
echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-stripe-integration-2025-11-23.json",
    "content": "{}"
  }
}' | $HOOK_SCRIPT
EXIT_CODE=$?
echo -e "Exit code: $EXIT_CODE (expected: 2)\n"

# Test 3: Valid filename but missing required fields
echo -e "${BLUE}Test 3: Valid filename but missing required fields${RESET}"
echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-test-feature-11-23-25.json",
    "content": "{\"metadata\": {\"created\": \"2025-11-23\"}}"
  }
}' | $HOOK_SCRIPT
EXIT_CODE=$?
echo -e "Exit code: $EXIT_CODE (expected: 2)\n"

# Test 4: Invalid subagent reference
echo -e "${BLUE}Test 4: Invalid subagent reference${RESET}"
cat > /tmp/test-plan-invalid-subagent.json <<'EOF'
{
  "metadata": {
    "created": "2025-11-23T14:30:00-08:00",
    "created_by": "claude-sonnet-4-5-20250929",
    "plan_id": "test-123",
    "version": "1.0"
  },
  "planning": {
    "goal": "Test feature",
    "reason": "Testing",
    "scope": "Test scope",
    "success_metrics": ["Metric 1"],
    "estimated_timeline": "5 hours",
    "priority": "Medium"
  },
  "files_impacted": [],
  "phases": [
    {
      "number": 1,
      "name": "Phase 1",
      "description": "Test phase",
      "status": "not_started",
      "completion_percentage": 0,
      "estimated_effort": "3",
      "assigned_subagent": "nonexistent-agent",
      "steps": [{"number": 1, "task": "Test task", "status": "not_started"}],
      "dependencies": [],
      "blockers": [],
      "deliverables": ["Test"]
    },
    {
      "number": 2,
      "name": "Phase 2",
      "description": "Test phase 2",
      "status": "not_started",
      "completion_percentage": 0,
      "estimated_effort": "2",
      "assigned_subagent": "human",
      "steps": [{"number": 1, "task": "Test task", "status": "not_started"}],
      "dependencies": [],
      "blockers": [],
      "deliverables": ["Test"]
    }
  ],
  "subagent_assignments": [],
  "reference_documents": [],
  "potential_blockers": [],
  "success_criteria": []
}
EOF

echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-test-invalid-subagent-11-23-25.json",
    "content": '"$(cat /tmp/test-plan-invalid-subagent.json | jq -Rs .)"'
  }
}' | $HOOK_SCRIPT
EXIT_CODE=$?
echo -e "Exit code: $EXIT_CODE (expected: 2)\n"

# Test 5: Circular dependency
echo -e "${BLUE}Test 5: Circular dependency detection${RESET}"
cat > /tmp/test-plan-circular.json <<'EOF'
{
  "metadata": {
    "created": "2025-11-23T14:30:00-08:00",
    "created_by": "claude-sonnet-4-5-20250929",
    "plan_id": "test-123",
    "version": "1.0"
  },
  "planning": {
    "goal": "Test circular dependencies",
    "reason": "Testing",
    "scope": "Test scope",
    "success_metrics": ["Metric 1"],
    "estimated_timeline": "5 hours",
    "priority": "Medium"
  },
  "files_impacted": [],
  "phases": [
    {
      "number": 1,
      "name": "Phase 1",
      "description": "Depends on Phase 2",
      "status": "not_started",
      "completion_percentage": 0,
      "estimated_effort": "3",
      "assigned_subagent": "human",
      "steps": [{"number": 1, "task": "Test task", "status": "not_started"}],
      "dependencies": [2],
      "blockers": [],
      "deliverables": ["Test"]
    },
    {
      "number": 2,
      "name": "Phase 2",
      "description": "Depends on Phase 1",
      "status": "not_started",
      "completion_percentage": 0,
      "estimated_effort": "2",
      "assigned_subagent": "human",
      "steps": [{"number": 1, "task": "Test task", "status": "not_started"}],
      "dependencies": [1],
      "blockers": [],
      "deliverables": ["Test"]
    }
  ],
  "subagent_assignments": [],
  "reference_documents": [],
  "potential_blockers": [],
  "success_criteria": []
}
EOF

echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-test-circular-11-23-25.json",
    "content": '"$(cat /tmp/test-plan-circular.json | jq -Rs .)"'
  }
}' | $HOOK_SCRIPT
EXIT_CODE=$?
echo -e "Exit code: $EXIT_CODE (expected: 2)\n"

# Test 6: Valid plan with quality warnings
echo -e "${BLUE}Test 6: Valid plan with quality warnings${RESET}"
cat > /tmp/test-plan-warnings.json <<'EOF'
{
  "metadata": {
    "created": "2025-11-23T14:30:00-08:00",
    "created_by": "claude-sonnet-4-5-20250929",
    "plan_id": "test-123",
    "version": "1.0"
  },
  "planning": {
    "goal": "Test feature with warnings",
    "reason": "Testing",
    "scope": "Test scope",
    "success_metrics": ["Metric 1"],
    "estimated_timeline": "50 hours",
    "priority": "Medium"
  },
  "files_impacted": [],
  "phases": [
    {
      "number": 1,
      "name": "Phase 1",
      "description": "Large phase",
      "status": "not_started",
      "completion_percentage": 0,
      "estimated_effort": "25",
      "assigned_subagent": "human",
      "steps": [{"number": 1, "task": "Test task", "status": "not_started"}],
      "dependencies": [],
      "blockers": [],
      "deliverables": ["Test"]
    },
    {
      "number": 2,
      "name": "Phase 2",
      "description": "Another large phase",
      "status": "not_started",
      "completion_percentage": 0,
      "estimated_effort": "25",
      "assigned_subagent": "human",
      "steps": [{"number": 1, "task": "Test task", "status": "not_started"}],
      "dependencies": [],
      "blockers": [],
      "deliverables": ["Test"]
    }
  ],
  "subagent_assignments": [],
  "reference_documents": [],
  "potential_blockers": [
    {
      "issue": "High impact blocker without mitigation",
      "likelihood": "High",
      "impact": "High"
    }
  ],
  "success_criteria": []
}
EOF

echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-test-warnings-11-23-25.json",
    "content": '"$(cat /tmp/test-plan-warnings.json | jq -Rs .)"'
  }
}' | $HOOK_SCRIPT
EXIT_CODE=$?
echo -e "Exit code: $EXIT_CODE (expected: 1)\n"

# Test 7: Skip template file
echo -e "${BLUE}Test 7: Skip template file${RESET}"
echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "Docs/Plans/plan-template.json",
    "content": "{}"
  }
}' | $HOOK_SCRIPT
EXIT_CODE=$?
echo -e "Exit code: $EXIT_CODE (expected: 0 - skipped)\n"

# Test 8: Skip non-plan file
echo -e "${BLUE}Test 8: Skip non-plan file${RESET}"
echo '{
  "session_id": "test",
  "cwd": "/tmp",
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "src/test.tsx",
    "content": "const x = 1;"
  }
}' | $HOOK_SCRIPT
EXIT_CODE=$?
echo -e "Exit code: $EXIT_CODE (expected: 0 - skipped)\n"

# Cleanup
rm -f /tmp/test-plan-*.json

echo -e "${BOLD}Test suite complete!${RESET}"
