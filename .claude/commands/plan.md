---
description: Create comprehensive structured JSON plan for feature implementation with subagent assignments
allowed-tools: Bash(date:*), Read, Glob, Grep, Write
argument-hint: [feature description]
---

# Create Feature Implementation Plan

This command analyzes your feature request and creates a comprehensive, structured JSON plan with phases, subagent assignments, and success criteria.

## Current Information

### Timestamp for filename
- Plan filename: !`date "+plan-%m-%d-%y.json" | tr '[:upper:]' '[:lower:]'`

### Available Subagents
Read the agent registry to know which subagents are available for assignment:
- Agent Registry: @.claude/agents/agent-index.md

### Plan Template
Use this template as the structure for the plan:
- Template: @Docs/Plans/plan-template.json

## Your Task

You are creating a comprehensive implementation plan for a new feature. This plan will guide the implementation across multiple sessions.

### Step 1: Analyze Feature Request

From the user's description (provided as `$ARGUMENTS`), identify:

1. **Goal** - What are we trying to achieve?
2. **Reason** - Why is this feature important/needed?
3. **Scope** - What's included and excluded?
4. **Technology Stack** - Which systems are involved? (Stripe, Supabase, BoldSign, React, etc.)
5. **Files Impacted** - Which files will need to be created/modified?
6. **Complexity** - Is this simple (2-4 hours), moderate (4-12 hours), or complex (12+ hours)?

**Feature Request:** $ARGUMENTS

### Step 2: Generate Implementation Phases

Create 3-5 logical phases based on the feature complexity and technology stack:

**Common Phase Patterns:**

For **Supabase features** (database, RLS, realtime):
1. Database Schema Setup (create tables, RLS policies, indexes)
2. Backend Implementation (Edge Functions if needed)
3. Frontend Integration (hooks, UI components)
4. Testing and Documentation

For **Stripe features** (payments, subscriptions):
1. Database Schema Setup (payment/subscription tables)
2. Stripe Edge Function Implementation (checkout, webhooks)
3. Frontend Integration (payment UI, status display)
4. Testing and Documentation

For **BoldSign features** (e-signatures):
1. Database Schema Setup (document tracking)
2. BoldSign Edge Function Implementation (OAuth, API calls, webhooks)
3. Frontend Integration (embedded signing UI)
4. Testing and Documentation

For **UI/UX features**:
1. Component Design (shadcn/ui components)
2. State Management (contexts, hooks)
3. Integration (connect to backend)
4. Testing and Polish

**Each phase should have:**
- Clear name and description
- 2-6 specific steps
- Estimated effort (2-20 hours per phase)
- Assigned subagent (match domain to specialist)
- Dependencies on other phases
- Potential blockers with mitigation strategies
- Deliverables (files, docs)

### Step 3: Assign Subagents

Based on the technology stack, assign appropriate subagents to phases:

**Assignment Rules:**
- Database/Supabase work → `supabase-backend-specialist`
- Stripe payments → `stripe-specialist`
- BoldSign e-signatures → `boldsign-specialist`
- UI components → `shadcn-ui-designer`
- Hooks/automation → `claude-hook-specialist`
- Scripts/testing → `script-writer-specialist`
- Frontend-only work → `human` (or no specialist needed)

Create detailed subagent assignment objects with:
- Subagent name
- Domain/expertise
- Specific responsibilities for this feature
- Phases they're involved in
- Estimated effort
- Key deliverables

### Step 4: Identify Reference Documents

List documentation that will be needed:
- **reference** - Existing docs to consult (e.g., Docs/Stripe/Stripe-Integration.md)
- **update** - Existing docs that need updates (e.g., Docs/Architecture.md)
- **create** - New docs to create (e.g., Docs/NewFeature/Implementation.md)

Common references:
- `Docs/Architecture.md` - For database schema changes
- `Docs/Patterns/Real-Time-Subscriptions.md` - For realtime features
- `Docs/Stripe/` - For payment features
- `Docs/Supabase/` - For backend features
- `Docs/Boldsign/` - For e-signature features

### Step 5: Anticipate Blockers

Identify potential issues and mitigation strategies:

**Common blockers:**
- Missing environment variables (API keys, secrets)
- External service configuration (Stripe pricing IDs, BoldSign templates)
- SSL certificate issues in development (webhooks)
- Race conditions (webhook vs frontend)
- Authentication/authorization issues (RLS policies)

For each blocker:
- Describe the issue
- Assess likelihood (High/Medium/Low)
- Assess impact (High/Medium/Low)
- Provide mitigation strategy
- Optionally provide fallback plan

### Step 6: Define Success Criteria

Create 3-5 specific, measurable success criteria:

**Good criteria format:**
```
{
  "criterion": "User can [action] and [observable outcome]",
  "how_to_verify": "Concrete test steps",
  "priority": "Critical|High|Medium|Low",
  "acceptance_test": "Given [context], when [action], then [result]"
}
```

**Examples:**
- "User can subscribe to Pro plan and see subscription status in dashboard"
- "Failed payments trigger webhook that updates status and sends email"
- "Webhook signature verification rejects unauthorized requests"

### Step 7: Generate Feature Name for Filename

From the feature description, create a concise feature name:
- Lowercase with hyphens
- Max 50 characters
- Descriptive and specific

**Examples:**
- "Implement Stripe subscriptions" → `stripe-subscriptions`
- "Add BoldSign embedded signing to transactions" → `boldsign-embedded-signing`
- "Real-time transaction status updates" → `realtime-transaction-updates`
- "Transaction filtering and search UI" → `transaction-filtering-ui`

### Step 8: Create and Save Plan JSON

Using the template structure from `Docs/Plans/plan-template.json`, create a comprehensive plan JSON file with:

**Required fields (all must be populated):**
- `metadata` - created (ISO-8601), created_by (your model), plan_id (UUID), version (1.0)
- `planning` - goal, reason, scope, success_metrics (array), estimated_timeline, priority
- `files_impacted` - array of files with path, type, reason
- `phases` - array of 3-5 phases with all subfields
- `subagent_assignments` - array of subagent objects
- `reference_documents` - array of docs
- `potential_blockers` - array of blockers with mitigation
- `success_criteria` - array of criteria with verification

**Optional but recommended:**
- `technical_approach` - architecture, key_decisions, tech_stack, integration_points
- `testing_strategy` - unit_tests, integration_tests, manual_tests, edge_cases
- `risks_and_assumptions` - array of risks/assumptions

**Filename:** `/Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025/Docs/Plans/plan-[feature-name]-MM-DD-YY.json`

Use the date from the bash command above to generate the filename.

### Step 9: Validate and Confirm

After creating the plan:

1. Ensure all required fields are populated
2. Verify phase numbers are sequential and unique
3. Verify no circular dependencies
4. Verify subagent names match agent-index.md
5. Verify success criteria are specific and measurable

The validation hook will automatically check the structure.

### Step 10: Output Summary

Provide a brief, well-formatted summary to the user:

```
✅ Plan created: plan-[feature-name]-MM-DD-YY.json

📋 Summary:
- Goal: [One-line goal]
- Priority: [Priority level]
- Estimated Timeline: [X hours/days]
- Phases: [N] phases
- Assigned Subagents: [list subagents and phases]
- Files Impacted: [N] files
- Success Criteria: [N] defined
- Potential Blockers: [N] identified with mitigation strategies

📁 Files to be created/modified:
[List key files]

🤖 Subagent Assignments:
[List subagents with their responsibilities]

🎯 Next Steps:
1. Review the plan file for details
2. Start with Phase 1: [Phase 1 name]
3. Delegate to [assigned subagent] or implement directly

Use this plan to guide implementation. Update phase completion status as you progress.
```

## Important Notes

- **Be comprehensive** - Include all files, phases, blockers
- **Be specific** - Avoid vague descriptions
- **Be realistic** - Better to overestimate effort than underestimate
- **Assign subagents** - Leverage specialists for their domains
- **Anticipate blockers** - Think ahead about what could go wrong
- **Define success** - Make criteria measurable and verifiable

The plan is a living document - it can be updated as implementation progresses and new information is discovered.
