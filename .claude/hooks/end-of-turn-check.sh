#!/bin/bash
# Hook: End-of-Turn Quality Gates
# Event: Stop
# Purpose: Run type checking and linting when Claude finishes a turn

PROJECT_DIR="/Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025"

echo "🔍 Running end-of-turn quality checks..." >&2

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Check if package.json changed (might need npm install)
if git diff --name-only HEAD 2>/dev/null | grep -q "package.json\|package-lock.json"; then
    echo "📦 Package files changed - you may want to run npm install" >&2
fi

# Run TypeScript type checking
echo "🔤 Type checking..." >&2
typecheck_failed=0
if ! npm run typecheck 2>&1; then
    typecheck_failed=1
    echo "❌ Type check failed - please review errors above" >&2
else
    echo "✅ Type check passed" >&2
fi

# Run ESLint
echo "🧹 Linting..." >&2
lint_failed=0
if ! npm run lint 2>&1; then
    lint_failed=1
    echo "⚠️  Lint check failed - please review warnings above" >&2
else
    echo "✅ Lint check passed" >&2
fi

# Summary
if [ $typecheck_failed -eq 0 ] && [ $lint_failed -eq 0 ]; then
    echo "✅ All quality checks passed!" >&2
    exit 0
else
    echo "⚠️  Some quality checks failed - please review above" >&2
    exit 1  # Non-blocking warning
fi
