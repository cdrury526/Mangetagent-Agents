---
description: Create comprehensive structured JSON plan for feature implementation with subagent assignments
allowed-tools: Bash, Read, Glob, Grep, Write, Task
argument-hint: [feature description]
---

# Create Feature Implementation Plan

This command analyzes your feature request and creates a comprehensive, structured JSON plan with phases, subagent assignments, and success criteria.

## Current Information

### Timestamp for filename (Cross-Platform)
Generate the date for the filename using a cross-platform approach:
- **Windows (PowerShell):** `powershell -Command "Get-Date -Format 'MM-dd-yy'"`
- **Unix/macOS:** `date "+%m-%d-%y"`

Detect the platform and use the appropriate command to get the date in `MM-DD-YY` format.

### Available Subagents
Read the agent registry to know which subagents are available for assignment:
- Agent Registry: @.claude/agents/agent-index.md

### Plan Template
Use this template as the structure for the plan:
- Template: @Docs/Plans/plan-template.json

## Your Task

You are creating a comprehensive implementation plan for a new feature. This plan will guide the implementation across multiple sessions.

### Step 0: Research & Exploration (REQUIRED)

Before planning, you MUST explore the codebase to understand existing patterns and identify reusable code. Use the Task tool with `subagent_type=Explore` for thorough investigation.

**Research Checklist:**

1. **Search for Similar Features**
   - Look for existing implementations that solve similar problems
   - Identify patterns that can be reused or extended
   - Example: Before planning "add notifications", search for existing notification code

2. **Identify Reusable Components**
   - Search for hooks, utilities, and components that could be leveraged
   - Check `src/hooks/`, `src/components/`, `src/lib/` for relevant code
   - Document what already exists vs. what needs to be built

3. **Check Database Schema**
   - Review existing tables that might be extended
   - Look for related tables with foreign key opportunities
   - Check `supabase/migrations/` for schema history

4. **Review Integration Patterns**
   - If involving Stripe/BoldSign/external APIs, check existing Edge Functions
   - Look at `supabase/functions/` for established patterns
   - Note authentication and error handling approaches

5. **Document Findings**
   Record your research in the `exploration_summary` field of the plan:
   ```json
   {
     "exploration_summary": {
       "similar_features_found": ["list of related existing code"],
       "reusable_components": ["hooks, components, utilities to leverage"],
       "existing_tables": ["tables that could be extended"],
       "patterns_to_follow": ["established patterns in codebase"],
       "new_code_required": ["what must be built from scratch"]
     }
   }
   ```

**Why This Matters:**
- Prevents duplicate code and reinventing the wheel
- Ensures consistency with existing architecture
- Reduces implementation time by leveraging existing work
- Produces more accurate effort estimates

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
- **Calculate risk score** (see formula below)
- Provide mitigation strategy
- Optionally provide fallback plan

**Risk Scoring Formula:**
```
Likelihood values: High=3, Medium=2, Low=1
Impact values: High=3, Medium=2, Low=1
Risk Score = Likelihood × Impact (range: 1-9)

Priority based on score:
- 7-9: Critical - Address immediately before starting
- 4-6: High - Have mitigation ready before reaching that phase
- 1-3: Low - Monitor but don't block progress
```

Example blocker with risk scoring:
```json
{
  "issue": "Stripe API keys not configured",
  "likelihood": "Medium",
  "impact": "High",
  "risk_score": 6,
  "priority_rank": "High",
  "mitigation_strategy": "Document required env vars, check on project setup",
  "fallback_plan": "Use Stripe test mode keys for development"
}
```

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

### Step 7: Define Rollback Strategy

Every plan should include a rollback strategy in case implementation needs to be reverted. This is especially critical for:
- Database migrations (schema changes)
- External service integrations (Stripe, BoldSign)
- Breaking changes to existing functionality

**Rollback Strategy Structure:**
```json
{
  "rollback_strategy": {
    "database": {
      "approach": "Migration down scripts or manual revert steps",
      "scripts": ["List migration files that would need reverting"],
      "data_impact": "Description of any data that would be lost"
    },
    "code": {
      "approach": "Git revert or feature flag disable",
      "commits_to_revert": "Describe which commits/branches",
      "feature_flags": "List any feature flags that control this"
    },
    "external_services": {
      "stripe": "Steps to clean up Stripe resources (webhooks, products, etc.)",
      "boldsign": "Steps to clean up BoldSign resources (templates, etc.)",
      "other": "Other service cleanup steps"
    },
    "estimated_rollback_time": "How long rollback would take",
    "rollback_risks": ["Things that could go wrong during rollback"]
  }
}
```

**Common Rollback Patterns:**
- **Database:** Always write reversible migrations with `down` logic
- **Edge Functions:** Previous versions remain available; redeploy old version
- **Frontend:** Git revert or deploy previous build
- **External Services:** Document manual cleanup steps in advance

### Step 8: Create Dependency Graph

Visualize phase dependencies using ASCII art to make the execution order clear:

**Simple Linear Flow:**
```
Phase 1 (Schema) → Phase 2 (Backend) → Phase 3 (Frontend) → Phase 4 (Testing)
```

**Parallel Execution Possible:**
```
Phase 1 (Schema)
    ├──→ Phase 2 (Backend) ──→ Phase 4 (Integration)
    └──→ Phase 3 (Frontend) ─┘
                              └──→ Phase 5 (Testing)
```

**Complex Dependencies:**
```
Phase 1 (Schema)
    │
    ├──→ Phase 2 (Stripe Edge Functions)
    │         │
    │         └──────────────────┐
    │                            ▼
    └──→ Phase 3 (BoldSign Edge Functions) ──→ Phase 5 (Integration Testing)
                                                      │
Phase 4 (Frontend Components) ◄───────────────────────┘
    │
    └──→ Phase 6 (E2E Testing)
```

Include this visualization in the `dependency_graph` field of the plan:
```json
{
  "dependency_graph": {
    "ascii": "Phase 1 → Phase 2 → Phase 3...",
    "critical_path": ["Phase 1", "Phase 2", "Phase 4"],
    "parallelizable": [["Phase 2", "Phase 3"]],
    "bottlenecks": ["Phase 2 blocks both Phase 3 and Phase 4"]
  }
}
```

### Step 9: Apply Effort Estimation Multipliers

Use these multipliers to refine effort estimates based on complexity factors:

**Base Effort Estimation:**
- Simple CRUD operation: 1-2 hours
- New database table with RLS: 2-4 hours
- New Edge Function: 3-5 hours
- New React component: 2-4 hours
- Integration with external API: 4-8 hours

**Complexity Multipliers:**
| Factor | Multiplier | When to Apply |
|--------|------------|---------------|
| Real-time features | 1.5x | Supabase subscriptions, live updates |
| External API integration | 1.5x | Stripe, BoldSign, third-party APIs |
| New database tables | 1.2x | Schema design, RLS policies |
| Webhook handling | 1.4x | Signature verification, retry logic |
| Authentication/authorization | 1.3x | RLS policies, role-based access |
| First-time pattern | 1.5x | Implementing something new to codebase |
| Existing pattern | 0.8x | Following established codebase patterns |
| Complex state management | 1.3x | Multiple contexts, complex updates |
| File uploads/storage | 1.4x | Supabase Storage, file handling |

**Example Calculation:**
```
Task: Create Stripe checkout with webhook handling
Base: 5 hours (Edge Function)
× 1.5 (External API - Stripe)
× 1.4 (Webhook handling)
= 10.5 hours estimated

Round up for buffer: 12 hours
```

Include estimation breakdown in the plan:
```json
{
  "effort_estimation": {
    "base_hours": 5,
    "multipliers_applied": [
      {"factor": "External API", "multiplier": 1.5},
      {"factor": "Webhook handling", "multiplier": 1.4}
    ],
    "calculated_hours": 10.5,
    "final_estimate": 12,
    "confidence": "Medium",
    "assumptions": ["Stripe account already configured", "Familiar with Stripe API"]
  }
}
```

### Step 10: Link to Context System

Connect this plan to the session context system for continuity across sessions:

**Integration with `/save_context` and `/review_context`:**

1. **When creating the plan**, note the plan file in any saved context:
   ```json
   {
     "active_plans": ["Docs/Plans/plan-feature-name-MM-DD-YY.json"],
     "current_phase": 1,
     "next_actions": ["Start Phase 1 with supabase-backend-specialist"]
   }
   ```

2. **When resuming work**, use `/review_context` to find active plans

3. **After completing phases**, update both the plan AND save context:
   - Update plan's `execution_history` array
   - Run `/save_context` with progress notes

**Plan-Context Linking Structure:**
```json
{
  "context_integration": {
    "created_in_session": "context-MM-DD-YY-HH-MMpm.json (if applicable)",
    "related_contexts": ["List of context files related to this plan"],
    "continuation_notes": "What to know when resuming this plan"
  }
}
```

**Best Practice:** After creating a plan, immediately run `/save_context` to record the planning session.

### Step 11: Generate Feature Name for Filename

From the feature description, create a concise feature name:
- Lowercase with hyphens
- Max 50 characters
- Descriptive and specific

**Examples:**
- "Implement Stripe subscriptions" → `stripe-subscriptions`
- "Add BoldSign embedded signing to transactions" → `boldsign-embedded-signing`
- "Real-time transaction status updates" → `realtime-transaction-updates`
- "Transaction filtering and search UI" → `transaction-filtering-ui`

### Step 12: Create and Save Plan JSON

Using the template structure from `Docs/Plans/plan-template.json`, create a comprehensive plan JSON file with:

**Required fields (all must be populated):**
- `metadata` - created (ISO-8601), created_by (your model), plan_id (UUID), version (2.1)
- `phase_index` - Quick status lookup (auto-updated by plan-update.py, initialize with all phases as not_started)
- `planning` - goal, reason, scope, success_metrics (array), estimated_timeline, priority
- `files_impacted` - array of files with path, type, reason
- `phases` - array of 3-5 phases with all subfields
- `subagent_assignments` - array of subagent objects
- `reference_documents` - array of docs
- `potential_blockers` - array of blockers with mitigation
- `success_criteria` - array of criteria with verification

**Phase Index (REQUIRED - enables quick agent workflow):**
```json
{
  "phase_index": {
    "total": 4,
    "current_in_progress": null,
    "completed": [],
    "blocked": [],
    "not_started": [1, 2, 3, 4],
    "next_available": 1
  }
}
```
This field is auto-updated by `plan-update.py` on every save. Initialize it with all phase numbers in `not_started`.

**Optional but recommended:**
- `technical_approach` - architecture, key_decisions, tech_stack, integration_points
- `testing_strategy` - unit_tests, integration_tests, manual_tests, edge_cases
- `risks_and_assumptions` - array of risks/assumptions

**New fields from enhanced planning (include these):**
- `exploration_summary` - findings from Step 0 research
- `rollback_strategy` - from Step 7
- `dependency_graph` - from Step 8
- `effort_estimation` - from Step 9 with multipliers
- `context_integration` - from Step 10

**Filename:** `Docs/Plans/plan-[feature-name]-MM-DD-YY.json` (relative to project root)

Use the date from the cross-platform command above to generate the filename.

### Step 13: Validate and Confirm

After creating the plan:

1. Ensure all required fields are populated
2. Verify phase numbers are sequential and unique
3. Verify no circular dependencies (check dependency_graph)
4. Verify subagent names match agent-index.md
5. Verify success criteria are specific and measurable
6. Verify risk scores are calculated correctly
7. Verify rollback strategy covers all changes
8. Verify exploration_summary reflects actual research done

The validation hook will automatically check the structure.

### Step 14: Output Summary

Provide a brief, well-formatted summary to the user:

```
Plan created: plan-[feature-name]-MM-DD-YY.json

SUMMARY:
- Goal: [One-line goal]
- Priority: [Priority level]
- Estimated Timeline: [X hours/days] (with multipliers applied)
- Phases: [N] phases
- Assigned Subagents: [list subagents and phases]
- Files Impacted: [N] files
- Success Criteria: [N] defined
- Potential Blockers: [N] identified (sorted by risk score)

EXPLORATION FINDINGS:
- Similar features found: [list or "None"]
- Reusable components: [list]
- Patterns to follow: [list]

DEPENDENCY GRAPH:
[ASCII visualization of phase dependencies]

Critical Path: Phase X -> Phase Y -> Phase Z

FILES TO BE CREATED/MODIFIED:
[List key files]

SUBAGENT ASSIGNMENTS:
[List subagents with their responsibilities and phases]

RISK SUMMARY:
- Critical (7-9): [N] blockers - address before starting
- High (4-6): [N] blockers - have mitigation ready
- Low (1-3): [N] blockers - monitor

ROLLBACK STRATEGY:
- Database: [brief description]
- Code: [brief description]
- External Services: [brief description]

NEXT STEPS:
1. Review the plan file for details
2. Run /save_context to record this planning session
3. Start with Phase 1: [Phase 1 name]
4. Delegate to [assigned subagent] or implement directly

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

## Plan Update Workflow

Use `Docs/Plans/plan-update.py` to update plans efficiently without manual JSON editing:

### Quick Commands for Agents (no need to parse full plan):

```bash
# Check current status - what phase am I on?
python Docs/Plans/plan-update.py plan-file.json --status-check

# See my assignments (as a specific agent)
python Docs/Plans/plan-update.py plan-file.json --my-assignment supabase-backend-specialist

# Start the next available phase
python Docs/Plans/plan-update.py plan-file.json --start-next

# Complete the current phase
python Docs/Plans/plan-update.py plan-file.json --complete-current

# Complete with notes explaining what was done
python Docs/Plans/plan-update.py plan-file.json --complete-current --completion-notes "Implemented webhook with retry logic"

# Complete with notes and effort tracking
python Docs/Plans/plan-update.py plan-file.json --complete-current --completion-notes "All tests passing" --actual-effort 4.5
```

### Detailed Updates:

```bash
# Start a specific phase
python Docs/Plans/plan-update.py plan-file.json --phase 2 --status in_progress

# Update completion percentage
python Docs/Plans/plan-update.py plan-file.json --phase 2 --completion 75

# Record actual effort
python Docs/Plans/plan-update.py plan-file.json --phase 2 --actual-effort 6.5

# Complete a specific step
python Docs/Plans/plan-update.py plan-file.json --phase 2 --step 3 --status completed

# Multiple updates in one transaction
python Docs/Plans/plan-update.py plan-file.json --phase 2 --status in_progress --completion 50 --actual-effort 3
```

### Auto-Archive on Completion

When all phases are marked `completed`, the plan is automatically:
1. Updated with `metadata.completed_at` timestamp
2. Updated with `metadata.status = "completed"`
3. Total actual effort calculated across all phases
4. Moved to `Docs/Plans/Completed/` folder

This keeps the active plans folder clean and provides a history of completed work.
