# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated:** 2025-12-01
**Maintenance Schedule:** Weekly review during active development
**Version:** 2.0

## CRITICAL: Mandatory Subagent Delegation

**Context preservation is CRITICAL.** You MUST delegate work to specialized subagents whenever possible to preserve your context window. This is not optional—it is mandatory for efficient operation.

### When to Delegate (ALWAYS)

Delegate to subagents for ANY task matching these domains:
- **Supabase/Database work** → Use `supabase-backend-specialist`
- **BoldSign e-signature integration** → Use `boldsign-specialist`
- **Stripe payment processing** → Use `stripe-specialist`
- **Claude Code hooks** → Use `claude-hook-specialist`
- **ESLint errors and code quality** → Use `eslint-code-quality-specialist`
- **Git/GitHub operations** → Use `github-specialist`
- **Creating/updating subagents** → Use `subagent-builder`

### How to Delegate

The Task tool with `subagent_type` parameter invokes specialized agents:

```typescript
// Example: Delegate Supabase RLS policy creation
Task({
  subagent_type: "supabase-backend-specialist",
  prompt: "Create RLS policies for the transactions table that ensure agents can only access their own transactions",
  description: "Create transaction RLS policies"
})
```

### Available Subagents

See `.claude/agents/agent-index.md` for the complete registry. Current specialists:

| Subagent | Use For | Proactive |
|----------|---------|-----------|
| `supabase-backend-specialist` | Database design, RLS, Auth, Storage, Realtime, Edge Functions | Yes |
| `boldsign-specialist` | BoldSign API, embedded signing, webhooks, real estate workflows | Yes |
| `stripe-specialist` | Payment Intents, Subscriptions, Checkout, webhooks, React integration | Yes |
| `claude-hook-specialist` | Creating, debugging, optimizing Claude Code hooks for automation and standards | Yes |
| `claude-maintainer` | CLAUDE.md optimization, maintenance, best practices enforcement, performance monitoring | Yes |
| `eslint-code-quality-specialist` | Fixing ESLint errors, TypeScript any types, React Hook dependencies, code quality | Yes |
| `github-specialist` | Git operations, commits, PRs, branch management, code review, GitHub CLI automation | Yes |
| `script-writer-specialist` | TypeScript automation scripts, ESLint plugins, Vitest tests, pgTAP tests, CI/CD workflows | Yes |
| `subagent-builder` | Creating/updating subagents, maintaining agent registry | Yes |

### Rules

1. **ALWAYS check** if a subagent exists for the task domain before doing work yourself
2. **NEVER** implement Supabase, Stripe, or BoldSign features without delegating to the specialist
3. **DELEGATE PROACTIVELY** - Don't wait to be asked; use subagents automatically
4. **Reference the index** at `.claude/agents/agent-index.md` when unsure which agent to use

## CRITICAL: Plan Execution Workflow

When working on a feature with an active plan in `Docs/Plans/`, you MUST update the plan as you progress. Plans become stale without updates.

### Before Starting Work

```bash
# Check plan status and your assignments
python Docs/Plans/plan-update.py <plan-file>.json --status-check
python Docs/Plans/plan-update.py <plan-file>.json --my-assignment <agent-name>

# Start the next available phase
python Docs/Plans/plan-update.py <plan-file>.json --start-next
```

### During Work

Update progress periodically (every 30-60 min or after completing steps):
```bash
python Docs/Plans/plan-update.py <plan-file>.json --phase N --completion 50
python Docs/Plans/plan-update.py <plan-file>.json --phase N --step M --status completed
```

### After Completing a Phase

```bash
# Complete with notes and actual effort tracking
python Docs/Plans/plan-update.py <plan-file>.json --complete-current \
  --completion-notes "Implemented X with Y approach" \
  --actual-effort 4.5
```

### Rules

1. **ALWAYS run `--start-next`** before beginning work on a phase
2. **ALWAYS run `--complete-current`** when finishing a phase (include notes and effort)
3. **NEVER leave a phase as `in_progress` at session end** - either complete it or note blockers
4. **DELEGATE to subagents** with plan context - tell them which plan/phase they're working on

### Subagent Plan Instructions

When delegating to a subagent for plan work, include:
```typescript
Task({
  subagent_type: "supabase-backend-specialist",
  prompt: `Working on plan-feature-name-MM-DD-YY.json, Phase 2.

  Task: Create RLS policies for transactions table...

  When done, run: python Docs/Plans/plan-update.py Docs/Plans/plan-feature-name-MM-DD-YY.json --complete-current --completion-notes "Your summary" --actual-effort X`,
  description: "Phase 2: Create RLS policies"
})
```

## Anti-Patterns (NEVER DO)

**Security:**
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to frontend code - it must only be used in Edge Functions
- **NEVER** skip webhook signature verification (Stripe/BoldSign) - this prevents spoofing attacks
- **NEVER** call external APIs directly from frontend - ALWAYS use Edge Functions as proxies
- **NEVER** commit .env files or secrets to version control
- **NEVER** hardcode API keys or credentials in source code

**Real-time Subscriptions:**
- **NEVER** forget cleanup in useEffect return - MUST call `supabase.removeChannel(channel)` to prevent memory leaks
- **NEVER** create subscriptions without filtering by `agent_id` - this violates data isolation
- **NEVER** create multiple subscriptions to the same table in one component - consolidate into a single channel

**Data Access:**
- **NEVER** query database with service role key from frontend - use anon key with RLS policies
- **NEVER** bypass RLS policies - all data access must respect `agent_id` isolation
- **NEVER** allow cross-agent data access - each agent must only see their own data
- **NEVER** trust client-side data validation alone - always validate on the backend

**Transaction Workflow:**
- **NEVER** skip status validation when updating transactions
- **NEVER** allow status transitions that violate real estate workflow sequence
- **NEVER** modify transaction status without checking allowed transitions
- **NEVER** delete transactions - use soft delete (status = 'cancelled') to maintain audit trail

**Webhook Handling:**
- **NEVER** process webhook payloads without signature verification
- **NEVER** return non-200 status codes for successfully processed webhooks (this triggers retries)
- **NEVER** perform long-running operations in webhook handlers - use background jobs

**Plan Execution:**
- **NEVER** start work on a plan without running `--start-next` first
- **NEVER** end a session with phases left `in_progress` - complete or document blockers
- **NEVER** delegate plan work to subagents without telling them which plan/phase they're on
- **NEVER** forget to track actual effort with `--actual-effort` when completing phases

## Project Overview

Bolt-Magnet-Agent-2025 is a real estate transaction management platform built with React, TypeScript, Vite, Supabase, and integrated with Stripe (payments) and BoldSign (e-signatures). The application helps real estate agents manage transactions, contacts, documents, tasks, and e-signatures throughout the entire property transaction lifecycle.

## Development Commands

```bash
# Frontend
npm run dev              # Vite dev server (http://localhost:5173)
npm run build            # Production build
npm run lint             # ESLint + TypeScript checking

# Supabase (local development)
supabase start           # Start local instance
supabase db reset        # Reset database (drops data)
supabase migration new <name>  # Create migration
supabase functions serve # Run Edge Functions locally

# MCP Code Execution Bridge (context-efficient tool access)
npm run mcp:list         # List available MCP servers
npm run mcp:search <q>   # Search for tools
npm run mcp -- list-tools <server>  # List tools for a server
npm run mcp -- run <server> <tool> '<json>'  # Execute a tool
npm run mcp:registry     # Regenerate tool registry
```

## MCP Code Execution Bridge

For **context-efficient MCP tool access**, use `scripts/mcp/` instead of loading all MCP tool definitions into context. This follows the "Code Execution with MCP" pattern for progressive disclosure.

**Key Benefit:** API-based tools work without Docker or MCP servers enabled.

### Quick Database Operations

```bash
# Query a table
npm run mcp -- run supabase query-table '{"table":"profiles","limit":5}'

# Query with filter
npm run mcp -- run supabase query-table '{"table":"transactions","filter":"status=eq.active","limit":10}'

# Insert a row
npm run mcp -- run supabase insert-row '{"table":"contacts","data":{"name":"John"}}'

# Update rows (filter required)
npm run mcp -- run supabase update-rows '{"table":"profiles","filter":"id=eq.abc","data":{"name":"Updated"}}'

# Delete rows (filter required)
npm run mcp -- run supabase delete-rows '{"table":"contacts","filter":"id=eq.abc"}'
```

### Discovery Commands

```bash
npm run mcp:list                     # List servers
npm run mcp -- list-tools supabase   # List tools for server
npm run mcp:search "database"        # Search tools
npm run mcp -- describe supabase query-table  # Tool details
```

### Available Servers

| Server | Tools | Description |
|--------|-------|-------------|
| `supabase` | 30 | **API:** CRUD, Storage, Auth Admin, Edge Functions, SQL. **CLI:** schema, migrations, logs |
| `shadcn` | 4 | Component search, view, examples, install commands |
| `boldsign` | 23 | **Documents:** list, status, send, download, embedded signing, field prefill. **Templates:** list, get, send, merge. **Bulk Ops:** reminders, merge-and-send. **Webhooks:** events, health, test, replay. **Debug:** timeline, API credits, config. **Modify:** change recipient, void-and-resend |
| `stripe` | 15 | Customers, payments, subscriptions, products, prices, invoices, webhooks, balance, disputes |

### Directory Structure

- `scripts/mcp/servers/supabase/` - Supabase tools (CRUD, Storage, Auth, SQL)
- `scripts/mcp/servers/shadcn/` - shadcn/ui tools (search, view, examples)
- `scripts/mcp/servers/boldsign/` - BoldSign tools (documents, templates, webhooks)
- `scripts/mcp/servers/stripe/` - Stripe tools (customers, payments, subscriptions)
- `scripts/mcp/types/` - TypeScript type definitions
- `scripts/mcp/templates/` - Templates for adding new tools

### Adding New Tools

1. Add types to `scripts/mcp/types/<server>.types.ts`
2. Create wrapper at `scripts/mcp/servers/<server>/<tool-name>.ts`
3. Export from `scripts/mcp/servers/<server>/index.ts`
4. Run `npm run mcp:registry` to update the registry

See `scripts/mcp/README.md` for detailed documentation.

## Architecture & Key Patterns

**Frontend:**
- React Context (`AuthContext`) + custom hooks with Supabase real-time
- All hooks pattern: fetch → subscribe → cleanup on unmount (CRITICAL: cleanup prevents memory leaks)
- Real-time pattern details: See `Docs/Patterns/Real-Time-Subscriptions.md`

**Backend (Supabase):**
- Row Level Security (RLS) on all tables, scoped to `agent_id`
- Transaction lifecycle: `prospecting` → `pending` → `active` → `under_contract` → `inspection` → `appraisal` → `closing` → `closed`
- Hierarchical tasks with phase categorization
- Edge Functions for ALL external API calls (NEVER call external APIs from frontend)

**Third-Party Integration Pattern:**
- Frontend → Edge Function → External API (NEVER frontend → external API directly)
- BoldSign: OAuth token caching (1hr TTL), HMAC-SHA256 webhook verification required
- Stripe: Server-side payment creation, webhook signature verification required
- Google Maps: Address autocomplete for transaction properties

**Critical Security Patterns:**
- Webhook signature verification is REQUIRED (Stripe: `stripe.webhooks.constructEventAsync()`, BoldSign: HMAC-SHA256)
- Service role key ONLY in Edge Functions, NEVER in frontend
- RLS policies enforce `agent_id` isolation on all queries

See detailed documentation:
- `Docs/Architecture.md` - Complete system design, database schema, migrations
- `Docs/Patterns/Real-Time-Subscriptions.md` - Real-time pattern with examples
- `Docs/Patterns/Development-Workflows.md` - Common workflows, testing, troubleshooting
- `Docs/Supabase/` - Database, RLS policies, Edge Functions
- `Docs/Stripe/` - Payment integration, webhooks, subscriptions
- `Docs/Boldsign/` - E-signature workflows, embedded signing

## Environment Variables

**Frontend (VITE_* prefix):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_MAPS_API_KEY`

**Backend (Edge Functions):** Stripe, BoldSign, Supabase, Resend secrets

See `.env.example` for complete configuration.
