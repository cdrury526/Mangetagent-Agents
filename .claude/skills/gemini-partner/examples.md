# Gemini Partner Examples

Real-world examples of Claude + Gemini collaboration patterns.

## Example 1: Large Codebase Analysis

**Scenario:** Need to understand a new codebase with 500+ files

**Claude's approach:** Would need multiple queries, building context incrementally

**Gemini partnership:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Analyze this entire codebase and create a comprehensive overview.

I need to understand:
1. Overall architecture and design patterns
2. Key entry points and data flows
3. How the frontend (React) connects to backend (Supabase)
4. Authentication and authorization patterns
5. Real-time subscription usage
6. Third-party integrations (Stripe, BoldSign)

Create a structured report I can reference while working.
Save to: docs/codebase-overview.md"
```

**Result:** Gemini reads entire codebase in one context, produces comprehensive overview.

---

## Example 2: Second Opinion on Database Schema

**Scenario:** Designing a new feature's database schema

**Claude's initial design:**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  status TEXT,
  -- ... other fields
);
```

**Ask Gemini for review:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Review this database schema design for a real estate transaction management system.

Current design is in supabase/migrations/. The new feature needs to track:
- Transaction phases (prospecting -> closing)
- Multiple parties (buyer, seller, agents)
- Document associations
- Task dependencies

Review the existing schema and provide:
1. Does this fit well with existing patterns?
2. Are there normalization issues?
3. RLS policy considerations
4. Performance concerns at scale
5. Alternative approaches to consider"
```

---

## Example 3: Debugging a Complex Issue

**Scenario:** Real-time subscriptions randomly stop working

**Claude's investigation:** Limited by context, can only see files one at a time

**Gemini deep dive:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Debug why Supabase real-time subscriptions intermittently fail.

Symptoms:
- Subscriptions work initially
- After ~30 minutes, updates stop arriving
- No errors in console
- Refreshing the page fixes it

Analyze:
1. All files using supabase.channel() or .on()
2. Cleanup patterns in useEffect
3. Connection management
4. Error handling for realtime

Find the root cause and suggest a fix."
```

**Result:** Gemini finds missing cleanup in a parent component causing channel leaks.

---

## Example 4: Generating Comprehensive Documentation

**Scenario:** Need to document all Edge Functions for the team

**Sequential generation with Gemini:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Generate complete documentation for all Supabase Edge Functions in this project.

For each function in supabase/functions/:
1. Purpose and description
2. HTTP method and endpoint
3. Request format (headers, body)
4. Response format
5. Error codes
6. Authentication requirements
7. Example curl commands
8. Related database tables

Format as a markdown file per function.
Save to: docs/edge-functions/"
```

---

## Example 5: UI Component Generation

**Scenario:** Need a complex data table with filters

**Gemini generation:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Create a TransactionsTable component for displaying real estate transactions.

Requirements:
- React + TypeScript
- Tailwind CSS + shadcn/ui patterns
- Features:
  - Sortable columns (date, price, status)
  - Filter by status (dropdown)
  - Search by address
  - Pagination (10, 25, 50 per page)
  - Row actions (view, edit, delete)
  - Loading skeleton
  - Empty state
- Accessible (keyboard nav, screen readers)

Use existing patterns from src/components/.
Save to: src/components/transactions/TransactionsTable.tsx"
```

**Claude follows up:** Reviews generated code, integrates with existing hooks

---

## Example 6: Research for Implementation

**Scenario:** Implementing Stripe subscription billing

**Gemini research:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Research Stripe subscription implementation best practices for 2025.

Our stack: React + Supabase Edge Functions + TypeScript

Research:
1. Latest Stripe API version and features
2. Subscription vs Payment Intents for recurring
3. Webhook handling patterns
4. Trial period implementation
5. Proration for plan changes
6. Customer portal integration
7. Testing with Stripe CLI

Provide implementation guide with code examples.
Cite official Stripe documentation."
```

**Claude implements:** Uses Gemini's research to implement with current best practices

---

## Example 7: Code Review Before PR

**Scenario:** Major feature ready for review

**Gemini review:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Perform a thorough code review of recent changes.

Focus on:
1. Code quality and consistency
2. TypeScript type safety (no 'any' types)
3. React patterns (hooks, effects, cleanup)
4. Error handling completeness
5. Security (input validation, XSS, injection)
6. Performance (re-renders, memoization)
7. Accessibility compliance
8. Test coverage gaps

Provide actionable feedback with file:line references.
Categorize by severity: Critical, High, Medium, Low"
```

---

## Example 8: Refactoring Analysis

**Scenario:** Need to refactor authentication from context to Zustand

**Gemini analysis:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Analyze the current authentication implementation for refactoring to Zustand.

Current: React Context in src/contexts/AuthContext.tsx

Tasks:
1. Map all files using AuthContext
2. Identify all auth-related state
3. List all auth actions/methods
4. Find async operations (login, logout, refresh)
5. Check for side effects (localStorage, cookies)

Provide:
- Migration plan with ordered steps
- Risk assessment
- Estimated file changes
- Testing strategy"
```

---

## Example 9: Batch Type Fixes

**Scenario:** 50+ ESLint errors for `any` types

**Gemini bulk fix:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Fix all @typescript-eslint/no-explicit-any errors in this codebase.

For each 'any' type:
1. Analyze usage to determine correct type
2. Create interfaces if needed
3. Use 'unknown' for truly dynamic data
4. Add eslint-disable with comment only if truly necessary

Rules:
- Event handlers: Use React event types
- API responses: Create interfaces or use existing types
- Catch blocks: Use 'unknown' with type guards
- Third-party: Check @types packages first

Save changes directly to files."
```

---

## Example 10: Cross-Codebase Pattern Check

**Scenario:** Ensure consistent patterns across all hooks

**Gemini pattern analysis:**
```powershell
gemini -y -o json -m gemini-3-pro-preview "Audit all custom hooks in src/hooks/ for consistency.

Check each hook for:
1. Naming convention (use* prefix)
2. Return type consistency
3. Error handling pattern
4. Loading state pattern
5. Cleanup in useEffect
6. Dependency array completeness
7. TypeScript types (no 'any')

Create a report showing:
- Hooks following patterns
- Hooks needing fixes
- Specific fixes needed per hook
- Suggested refactoring for consistency"
```

---

## Collaboration Tips

### When to use Gemini vs Claude

| Task | Use Gemini | Use Claude |
|------|-----------|------------|
| Analyze 100+ files at once | Yes | No |
| Step-by-step implementation | No | Yes |
| Research with web search | Yes | Limited |
| Interactive debugging | No | Yes |
| Generate initial drafts | Yes | Yes |
| Integrate and refine | No | Yes |
| Bulk file modifications | Yes | Yes |

### Effective Handoff Pattern

1. **Claude identifies need** - Recognizes task suits Gemini's strengths
2. **Claude crafts prompt** - Detailed, structured prompt for Gemini
3. **Gemini executes** - Runs analysis/generation with 1M context
4. **Claude reviews output** - Validates, refines, integrates
5. **Claude continues** - Proceeds with implementation

### Output Handling

Gemini returns JSON. Parse the response:
```powershell
$result = gemini -y -o json -m gemini-3-pro-preview "your prompt" | ConvertFrom-Json
$result.response  # The AI's text response
$result.stats     # Token usage and tool stats
```
