# GEMINI.md

Project-specific instructions for Gemini CLI when working on this codebase.

## Project Overview

**Bolt-Magnet-Agent-2025** is a real estate transaction management platform for agents. It manages the complete property transaction lifecycle including contacts, documents, tasks, e-signatures (BoldSign), and payments (Stripe).

## Directory Structure

```
src/
├── components/     # React components (ui/, documents/, tasks/, boldsign/, forms/)
├── contexts/       # React Context (AuthContext)
├── hooks/          # Custom hooks (useTransactions, useDocuments, useTasks, etc.)
├── pages/          # Route pages
├── lib/            # Supabase client
├── types/          # TypeScript types
└── utils/          # Utility functions

supabase/
├── functions/      # Edge Functions (Deno) - ALL external API calls go here
└── migrations/     # Database migrations

Docs/               # Comprehensive project documentation
.claude/            # Claude Code configuration
.gemini/            # Gemini CLI configuration & context
```

## When Working on This Codebase

1. **Check existing patterns first** - Look at similar files before creating new ones
2. **Respect the hook patterns** - All data hooks follow fetch → subscribe → cleanup
3. **Check RLS implications** - Any database change needs RLS policy consideration
4. **External APIs → Edge Functions** - NEVER call Stripe/BoldSign from frontend
5. **Review Docs/** - Comprehensive documentation exists for all integrations

## Key Files to Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main project instructions (parallel to this file) |
| `Docs/Architecture.md` | Complete system design |
| `Docs/Patterns/Real-Time-Subscriptions.md` | Real-time patterns with examples |
| `src/contexts/AuthContext.tsx` | Authentication implementation |
| `src/hooks/useTransactions.ts` | Example of proper hook pattern |
| `supabase/functions/` | Edge Function examples |

## Detailed Context (Imported Modules)

@./.gemini/context/tech-stack.md

@./.gemini/context/integrations.md

@./.gemini/context/patterns.md

@./.gemini/context/anti-patterns.md
