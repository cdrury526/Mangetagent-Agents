# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Last Updated:** 2025-11-23
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
```

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
