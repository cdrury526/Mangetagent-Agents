# Plan Management System

This directory contains feature implementation plans that provide structured, phase-based roadmaps with subagent assignments and progress tracking. Plans are created **before** work begins and guide the implementation process.

## Purpose

### Plans vs Contexts

The plan and context systems work together to provide a complete work lifecycle:

| Aspect | **Plans** (This System) | **Contexts** (../Context/) |
|--------|------------------------|---------------------------|
| **When Created** | BEFORE work begins (proactive) | DURING/AFTER work (reactive) |
| **Purpose** | Define what we're building and how | Capture what we did and current state |
| **Lifecycle** | Referenced/updated during work | Saved when session ends |
| **Audience** | Planning team, stakeholders | Next session continuation |
| **Structure** | Goal-driven, phase-based, subagent assignments | Session-driven, decision-focused, blocker-tracking |
| **Tracking** | Completion percentage of phases | Status of completed work |
| **Reference** | Plans → Context (context files reference plan) | Contexts may reference multiple plans |

**Workflow:**
1. Create a **Plan** → Defines what to build, how to build it, who builds it
2. Implement following the plan → Work happens across one or more sessions
3. Save **Context** when session ends → Captures what was done, references the plan
4. Resume work in new session → Review context, continue from plan's current phase

## File Structure

### Naming Convention

All plan files follow the pattern: `plan-[feature-name]-MM-DD-YY.json`

**Examples:**
- `plan-stripe-integration-11-23-25.json` - Stripe payment integration plan
- `plan-boldsign-embedded-signing-11-25-25.json` - BoldSign integration plan
- `plan-transaction-filtering-ui-11-23-25.json` - Transaction filtering feature
- `plan-real-time-subscriptions-11-24-25.json` - Real-time subscription system

**Format Breakdown:**
- `plan-` - Required prefix
- `[feature-name]` - Lowercase, hyphens for spaces, max 50 chars, descriptive
- `MM-DD-YY` - Date plan was created (11-23-25 = November 23, 2025)
- `.json` - File extension

**Naming Rules:**
- Feature name must be descriptive and concise
- Use hyphens instead of spaces or underscores
- Keep feature name under 50 characters
- No timestamps in plan filenames (unlike contexts)
- Lowercase only

### Template Structure

See `plan-template.json` for the complete schema. All plan files must include:

#### Required Fields

1. **metadata** - Plan metadata
   - `created` - ISO-8601 timestamp
   - `created_by` - Claude model identifier
   - `plan_id` - Unique UUID
   - `version` - Template version (currently 1.0)

2. **planning** - High-level planning
   - `goal` - What we're trying to achieve
   - `reason` - Why this is important
   - `scope` - What's in/out of scope
   - `success_metrics` - Array of measurable outcomes
   - `estimated_timeline` - Total estimated time
   - `priority` - Critical/High/Medium/Low

3. **files_impacted** - Files that will be created/modified/deleted
   - Array of file objects with path, type, reason

4. **phases** - Implementation phases (minimum 2)
   - Array of phase objects with:
     - `number`, `name`, `description`
     - `status` - not_started|in_progress|completed|blocked
     - `completion_percentage` - 0-100
     - `estimated_effort` - Hours
     - `assigned_subagent` - Which specialist handles this
     - `steps` - Array of tasks within phase
     - `dependencies` - Other phases this depends on
     - `blockers` - Potential issues with mitigation
     - `deliverables` - What this phase produces

5. **subagent_assignments** - Specialist assignments
   - Array of subagent objects with:
     - `subagent` - Name from agent-index.md
     - `domain` - Their expertise
     - `responsibilities` - What they handle
     - `phases_involved` - Which phases
     - `estimated_effort` - Hours
     - `key_deliverables` - Major outputs

6. **reference_documents** - Documentation to consult
   - Array of doc objects with path, relevance, status

7. **potential_blockers** - Anticipated issues
   - Array of blocker objects with:
     - `issue` - Description
     - `likelihood` - High/Medium/Low
     - `impact` - High/Medium/Low
     - `mitigation_strategy` - How to handle

8. **success_criteria** - How we know we're done
   - Array of criterion objects with:
     - `criterion` - Specific metric
     - `how_to_verify` - Verification method
     - `priority` - Critical/High/Medium/Low

#### Optional Fields

- `planning.last_updated` - When plan was last modified
- `files_impacted[].estimated_changes` - Approximate LOC
- `phases[].actual_effort` - Actual hours spent
- `phases[].steps[].estimated_effort` - Step-level estimates
- `potential_blockers[].fallback_plan` - Alternative approach
- `success_criteria[].acceptance_test` - Specific test case
- `risks_and_assumptions` - Array of risks/assumptions
- `technical_approach` - Architecture, decisions, tech stack
- `execution_history` - Tracking across sessions
- `testing_strategy` - Test approach
- `rollout_plan` - Deployment strategy
- `notes` - Additional context

## Usage

### Creating a Plan

When starting a new feature:

```bash
/plan Implement Stripe subscription with recurring billing, handle webhook events for payment failures, store subscription status in database
```

This command will:
1. Analyze your feature request
2. Identify technology stack involved (Stripe, Supabase, etc.)
3. Auto-assign relevant subagents based on domain
4. Generate 3-5 logical implementation phases
5. Create comprehensive JSON plan file
6. Display summary with key information

The file will be automatically validated to ensure it matches the template structure.

### Reviewing a Plan

To see plan details:

```bash
# List all plans (newest first)
ls -lt Docs/Plans/plan-*.json

# Read a specific plan with pretty formatting
cat Docs/Plans/plan-stripe-integration-11-23-25.json | jq '.'

# See just the phases
cat Docs/Plans/plan-stripe-integration-11-23-25.json | jq '.phases'

# Check completion status
cat Docs/Plans/plan-stripe-integration-11-23-25.json | jq '.phases[] | {name: .name, status: .status, completion: .completion_percentage}'
```

### Updating Plans

Plans are living documents that should be updated as work progresses. You have two options for updating plans:

#### Option 1: Plan Update Utility (Recommended)

Use the `plan-update.py` utility for safe, validated updates:

```bash
# Update phase status
./plan-update.py plan-stripe-11-23-25.json --phase 2 --status in_progress

# Update completion percentage
./plan-update.py plan-stripe-11-23-25.json --phase 2 --completion 75

# Mark step complete (auto-calculates phase completion)
./plan-update.py plan-stripe-11-23-25.json --phase 2 --step 3 --status completed

# Record actual effort
./plan-update.py plan-stripe-11-23-25.json --phase 2 --actual-effort 6.5

# Add execution history entry
./plan-update.py plan-stripe-11-23-25.json \
  --add-history \
  --context context-11-23-25-2-30pm.json \
  --notes "Phase 2 completed"

# View summary (read-only)
./plan-update.py plan-stripe-11-23-25.json --summary

# Multi-update (all in one transaction)
./plan-update.py plan-stripe-11-23-25.json \
  --phase 2 \
  --status in_progress \
  --completion 50 \
  --actual-effort 3
```

**Why use the utility?**
- ✅ Atomic writes (never corrupts original file)
- ✅ Automatic daily backups to `.plan-backups/`
- ✅ Validation integration (auto-validates after writing)
- ✅ Auto-restore on validation failure
- ✅ Smart defaults (auto-updates metadata, calculates completion)
- ✅ Status transition validation
- ✅ Clear error messages with helpful guidance

See [PLAN-UPDATE-UTILITY.md](PLAN-UPDATE-UTILITY.md) for complete documentation.

#### Option 2: Manual Editing

For complex changes (adding/removing phases, modifying descriptions, scope changes):

```bash
# Edit plan file directly
vim Docs/Plans/plan-stripe-integration-11-23-25.json

# Validation hook runs automatically on save (if using Claude Code)
```

**When to manually edit:**
- Adding or removing phases
- Changing phase descriptions or deliverables
- Modifying planning goals or scope
- Complex edits across multiple sections

**When to use the utility:**
- Updating phase/step status during execution
- Recording actual effort vs. estimated
- Marking steps complete
- Adding execution history entries
- Quick status summaries

**Fields to update during execution:**
- `phases[].status` - Change from not_started → in_progress → completed
- `phases[].completion_percentage` - Update as work progresses (or let utility auto-calculate from steps)
- `phases[].actual_effort` - Track actual time spent
- `phases[].steps[].status` - Mark steps complete
- `execution_history` - Add entries when saving context
- `metadata.last_updated` - Update timestamp (utility does this automatically)

### Linking Plans and Contexts

When saving context, reference the plan being implemented:

In your context file (`context-*.json`):
```json
{
  "context": {
    "related_plans": [
      {
        "plan_file": "plan-stripe-integration-11-23-25.json",
        "phases_completed": [1, 2],
        "phase_in_progress": 3,
        "blockers_encountered": []
      }
    ]
  }
}
```

In your plan file (optional tracking):
```json
{
  "execution_history": [
    {
      "date": "2025-11-23",
      "context_file": "context-11-23-25-2-30pm.json",
      "phases_completed": [1],
      "notes": "Phase 1 completed, starting Phase 2 next session"
    }
  ]
}
```

## Validation

All plan files are automatically validated when created or modified. The validation hook checks:

### Filename Validation
- ✅ Matches pattern `plan-[feature-name]-MM-DD-YY.json`
- ✅ Feature name is lowercase with hyphens
- ✅ Feature name is under 50 characters
- ✅ Valid date values (MM: 01-12, DD: 01-31)

### Structure Validation
- ✅ Valid JSON syntax
- ✅ All required top-level fields present
- ✅ Proper data types (arrays, objects, strings, numbers)
- ✅ At least 2 phases defined
- ✅ Unique phase numbers (no duplicates)
- ✅ No circular phase dependencies
- ✅ Status values in allowed set
- ✅ Completion percentages between 0-100
- ✅ Effort estimates are positive numbers

### Subagent Validation
- ✅ Referenced subagent names exist in `.claude/agents/agent-index.md`
- ✅ Warn if critical phases lack subagent assignment
- ✅ Phases involved list valid phase numbers

### Quality Checks
- ⚠️ Warn if phases lack estimated effort
- ⚠️ Warn if critical blockers without mitigation
- ⚠️ Warn if success criteria are too vague
- ⚠️ Suggest more detail if steps are generic

### Validation Errors

If validation fails, you'll see helpful error messages:

```
⚠️  Warning: Filename 'plan-stripe-integration-2025-11-23.json' doesn't match pattern
   Expected: plan-[feature-name]-MM-DD-YY.json
   Example: plan-stripe-integration-11-23-25.json
```

```
❌ Plan file validation failed:
   - Missing required field: planning.goal
   - Phase 3 depends on non-existent Phase 5
   - Subagent 'stripe-expert' not found in agent-index.md (did you mean 'stripe-specialist'?)
   - Phase 2 completion_percentage is 150 (must be 0-100)
```

## Phase Structure

Phases are the core of the plan. Each phase represents a logical unit of work.

### Phase Best Practices

**Number of Phases:**
- Minimum: 2 phases (e.g., Setup + Implementation)
- Optimal: 3-5 phases for most features
- Maximum: 8 phases (if more, consider splitting into multiple plans)

**Phase Sizing:**
- Each phase: 2-20 hours estimated effort
- If phase is >20 hours, consider breaking into sub-phases
- If phase is <2 hours, consider combining with another

**Phase Dependencies:**
- Clearly identify dependencies
- Avoid circular dependencies
- Linear dependencies are fine (Phase 2 depends on Phase 1)
- Parallel phases can have no dependencies

**Phase Status Progression:**
```
not_started → in_progress → completed
                 ↓
              blocked → (resolve blocker) → in_progress
```

### Example Phase

```json
{
  "number": 2,
  "name": "Stripe Edge Function Implementation",
  "description": "Create Deno-based Edge Functions for Stripe Checkout and webhook handling with signature verification",
  "status": "not_started",
  "completion_percentage": 0,
  "estimated_effort": "6",
  "assigned_subagent": "stripe-specialist",
  "steps": [
    {
      "number": 1,
      "task": "Create stripe-create-checkout-session Edge Function",
      "status": "not_started",
      "details": "Accept plan tier, create Stripe Checkout session, return session URL",
      "estimated_effort": "2"
    },
    {
      "number": 2,
      "task": "Create stripe-webhook-handler Edge Function",
      "status": "not_started",
      "details": "Verify webhook signature (HMAC-SHA256), process events, update database",
      "estimated_effort": "3"
    },
    {
      "number": 3,
      "task": "Add error handling and logging",
      "status": "not_started",
      "details": "Proper error responses, structured logging for debugging",
      "estimated_effort": "1"
    }
  ],
  "dependencies": ["Phase 1: Database Schema Setup"],
  "blockers": [
    {
      "issue": "Stripe webhook secret not in environment variables",
      "mitigation": "Document STRIPE_WEBHOOK_SECRET in .env.example, add to deployment checklist",
      "severity": "High"
    }
  ],
  "deliverables": [
    "Edge Function: supabase/functions/stripe-create-checkout-session/index.ts",
    "Edge Function: supabase/functions/stripe-webhook-handler/index.ts",
    "Documentation: Docs/Stripe/Edge-Functions.md"
  ]
}
```

## Subagent Assignment

Plans should identify which specialized subagents handle which phases.

### Available Subagents

From `.claude/agents/agent-index.md`:

| Subagent | Domain | Use For |
|----------|--------|---------|
| `supabase-backend-specialist` | Database, RLS, Auth, Storage, Realtime, Edge Functions | Database design, RLS policies, Edge Functions |
| `stripe-specialist` | Payment processing | Payment Intents, Subscriptions, Checkout, webhooks |
| `boldsign-specialist` | E-signatures | BoldSign API, embedded signing, webhooks |
| `claude-hook-specialist` | Automation | Creating hooks, standards enforcement |
| `script-writer-specialist` | Scripting | TypeScript automation, ESLint plugins, tests |
| `shadcn-ui-designer` | UI/UX | Component design, theming, accessibility |

### Assignment Best Practices

**When to assign subagents:**
- ✅ Database work → `supabase-backend-specialist`
- ✅ Stripe integration → `stripe-specialist`
- ✅ BoldSign integration → `boldsign-specialist`
- ✅ Frontend components → `shadcn-ui-designer`
- ✅ Hook creation → `claude-hook-specialist`
- ✅ Automation scripts → `script-writer-specialist`

**Assignment tips:**
- One primary subagent per phase
- Document their responsibilities clearly
- Estimate their effort separately
- List their key deliverables
- Human can be assigned to phases (e.g., deployment, configuration)

### Example Subagent Assignment

```json
{
  "subagent": "stripe-specialist",
  "domain": "Payment processing and webhook handling",
  "responsibilities": "Create Edge Functions for Stripe Checkout and webhook verification, implement signature validation, handle subscription lifecycle events",
  "phases_involved": [2, 3],
  "estimated_effort": "10",
  "key_deliverables": [
    "Edge Function: stripe-create-checkout-session",
    "Edge Function: stripe-webhook-handler",
    "Webhook signature verification implementation",
    "Documentation: Stripe webhook handling"
  ]
}
```

## Reference Documents

Plans should reference relevant documentation that will be needed during implementation.

### Document Statuses

- **reference** - Existing doc that will be consulted (no changes)
- **update** - Existing doc that needs updates due to this feature
- **create** - New doc that needs to be created

### Example

```json
{
  "reference_documents": [
    {
      "path": "Docs/Stripe/Stripe-Integration.md",
      "relevance": "Webhook signature verification implementation pattern",
      "status": "reference",
      "sections": "Webhook Security, Testing Webhooks"
    },
    {
      "path": "Docs/Architecture.md",
      "relevance": "Update with subscription data model",
      "status": "update",
      "sections": "Database Schema"
    },
    {
      "path": "Docs/Stripe/Subscription-Lifecycle.md",
      "relevance": "New doc explaining subscription states and transitions",
      "status": "create"
    }
  ]
}
```

## Success Criteria

Success criteria define how you know the feature is complete and working correctly.

### Writing Good Success Criteria

**Good criteria are:**
- ✅ Specific and measurable
- ✅ Verifiable with concrete test
- ✅ Prioritized (Critical → Low)
- ✅ User-focused or system-focused

**Bad criteria:**
- ❌ "Stripe integration works"
- ❌ "Code is clean"
- ❌ "Users are happy"

### Example Success Criteria

```json
{
  "success_criteria": [
    {
      "criterion": "User can successfully subscribe to any plan tier (Free, Pro, Enterprise) and see subscription status in dashboard",
      "how_to_verify": "Manual test: Sign up, navigate to Pricing, click Subscribe on Pro, complete Stripe Checkout, verify dashboard shows 'Pro' status",
      "priority": "Critical",
      "acceptance_test": "Given user on Free plan, when user completes Stripe Checkout for Pro, then dashboard displays 'Pro Plan' badge and subscription status 'active'"
    },
    {
      "criterion": "Failed payments trigger webhook that updates subscription status to 'past_due' and sends email notification",
      "how_to_verify": "Use Stripe CLI to send test webhook for payment_failed event, check database status updated, verify email sent via Resend logs",
      "priority": "High"
    },
    {
      "criterion": "Webhook signature verification rejects unauthorized webhook requests",
      "how_to_verify": "Send webhook with invalid signature, expect 401 response and no database changes",
      "priority": "Critical",
      "acceptance_test": "Given webhook request with invalid HMAC signature, when webhook handler processes request, then return 401 and do not update database"
    }
  ]
}
```

## Best Practices

### When to Create a Plan

Create a plan when:
- ✅ Starting a new feature (always)
- ✅ Feature will take >4 hours
- ✅ Multiple systems/services involved
- ✅ Requires subagent coordination
- ✅ Complex enough to need phase breakdown
- ✅ Will span multiple sessions

Don't create plans for:
- ❌ Quick bug fixes (<1 hour)
- ❌ Simple typo corrections
- ❌ Single-file changes with no architectural impact

### What to Include

**Be Comprehensive:**
- List ALL files that will be touched
- Document ALL phases, even small ones
- Identify ALL potential blockers
- Assign subagents to ALL complex phases
- Define success criteria for ALL critical outcomes

**Be Specific:**
- Don't say "Add API" - say "Create Stripe webhook Edge Function with HMAC-SHA256 verification"
- Don't say "Update database" - say "Add subscriptions table with agent_id, stripe_subscription_id, status, plan_tier columns"
- Include specific file paths, function names, table names

**Be Forward-Looking:**
- Anticipate blockers before they happen
- Plan mitigation strategies proactively
- Define clear success criteria upfront
- Estimate effort realistically (better to overestimate)

### Updating Plans During Execution

Plans are living documents. Update them as you learn:

**Update when:**
- Phase status changes (started, completed, blocked)
- Completion percentage increases
- New blockers discovered
- Scope changes
- Actual effort differs significantly from estimates
- Technical decisions change

**Add to execution_history when:**
- Saving a context file
- Completing a phase
- Discovering major blockers
- Making significant scope/approach changes

## Integration with Git

Plan files should be committed to version control:

```bash
# When creating a new plan
git add Docs/Plans/plan-[feature-name]-MM-DD-YY.json
git commit -m "Add plan for [feature name]"

# When updating plan progress
git add Docs/Plans/plan-[feature-name]-MM-DD-YY.json
git commit -m "Update plan: Phase 2 complete"
```

**Benefits:**
- ✅ Team visibility into planned work
- ✅ Plan history tracked alongside code
- ✅ Can reference plan in commit messages
- ✅ Review plans in pull requests

## Troubleshooting

### Hook Not Running

If the validation hook isn't running:

1. Check `.claude/settings.json` includes hook configuration
2. Verify `.claude/hooks/validate-plan.py` exists and is executable
3. Check hook logs with `claude --debug`

### Validation Failing

If your plan file fails validation:

1. Read the error message - it tells you exactly what's wrong
2. Compare your file structure to `plan-template.json`
3. Validate JSON syntax with `cat file.json | jq '.'`
4. Check filename matches pattern exactly
5. Verify subagent names against `.claude/agents/agent-index.md`

### Subagent Not Found

If validation says subagent doesn't exist:

1. Check `.claude/agents/agent-index.md` for exact name
2. Verify spelling (e.g., `stripe-specialist` not `stripe-expert`)
3. Use exact name from registry
4. If specialist doesn't exist, assign to `human` or create specialist

### Circular Dependencies

If validation detects circular dependencies:

```
❌ Circular dependency detected: Phase 2 → Phase 3 → Phase 2
```

**Fix:**
1. Review phase dependencies
2. Remove circular references
3. Ensure dependencies flow in one direction
4. Consider if phases need to be reordered or merged

## Examples

See `plan-example-feature-11-23-25.json` for a complete example plan.

## Version History

- **v1.0** (2025-11-23) - Initial plan management system with template, slash command, and validation hook

## See Also

- [Context Management System](../Context/README.md) - Session context capture system
- [Slash Commands Documentation](../Claude_Code/Slash_Commands.md) - All available commands
- [Agent Index](../../.claude/agents/agent-index.md) - Available subagents for assignment
- [CLAUDE.md](../../CLAUDE.md) - Project instructions and subagent delegation rules
