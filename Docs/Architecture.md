# Architecture Documentation

This document provides detailed architectural information for the Bolt-Magnet-Agent-2025 platform.

## Frontend Architecture

### State Management Pattern
- React Context API for global auth state (`AuthContext`)
- Custom hooks for data fetching with real-time subscriptions (e.g., `useTransactions`, `useDocuments`, `useTasks`)
- All custom hooks follow pattern: fetch initial data, setup Supabase real-time subscription, cleanup on unmount

### Routing Structure
- Public routes: `/login`, `/signup`, `/pricing`
- Protected routes: All agent-facing pages under `/dashboard`, `/transactions`, `/contacts`, `/tasks`, `/documents`, `/e-signatures`, `/settings`
- Route guards: `PrivateRoute` and `PublicRoute` components in `App.tsx`

### Component Organization
- `src/components/ui/` - Reusable UI primitives (Button, Card, Input, etc.)
- `src/components/forms/` - Form-specific components with validation
- `src/components/boldsign/` - BoldSign e-signature integration components
- `src/components/documents/` - Document management UI
- `src/components/tasks/` - Task/subtask management UI
- `src/components/transaction-detail/` - Transaction detail page tabs (ContactsTab, DocumentsTab, TasksTab, DetailsTab)
- `src/pages/agent/` - Main agent-facing pages

## Backend Architecture (Supabase)

### Database Schema
- Core tables: `profiles`, `transactions`, `contacts`, `documents`, `tasks`, `bold_sign_documents`, `transaction_contacts`
- Stripe integration tables: `stripe_customers`, `stripe_subscriptions`, `stripe_orders`
- All tables use UUID primary keys and have `created_at`/`updated_at` timestamps
- Row Level Security (RLS) enabled on all tables, scoped to authenticated user's agent_id

### Transaction Lifecycle
Transaction statuses follow real estate workflow:
```
prospecting → pending → active → under_contract → inspection → appraisal → closing → closed
```
Alternative end state: `cancelled`

### Task System
- Hierarchical: Parent tasks with optional subtasks
- Tasks can be linked to transactions or standalone
- Phase-based categorization: `pre_offer`, `offer`, `inspection`, `appraisal`, `financing`, `closing`, `post_closing`
- Parent tasks track completion percentage based on subtask completion

### Edge Functions
Located in `supabase/functions/`:
- `boldsign-api` - Proxy for BoldSign API calls with OAuth token caching
- `boldsign-webhooks` - Handles BoldSign webhook events
- `stripe-checkout` - Creates Stripe checkout sessions
- `stripe-portal` - Generates Stripe customer portal links
- `stripe-webhook` - Processes Stripe webhook events (subscriptions, payments)

## Database Migrations

Migrations are in `supabase/migrations/` and run in chronological order.

### Creating Migrations
```bash
supabase migration new descriptive_name
# Edit the generated SQL file
supabase db reset  # Test locally
supabase db push   # Deploy to remote
```

### Migration Best Practices
- Always include RLS policies with new tables
- Use `IF NOT EXISTS` for idempotent migrations
- Include rollback instructions in migration comments
- Test migrations locally before pushing to production

## Type System

- All database types defined in `src/types/database.ts`
- TypeScript strict mode enabled
- Enums for finite states: `TransactionStatus`, `TransactionSide`, `ContactType`, `DocumentType`, `ESignatureStatus`, `TaskPhase`

## Styling

- Tailwind CSS for all styling
- `@tailwindcss/forms` plugin for form styling
- No custom CSS files (everything in utility classes)
- shadcn-style components in `src/components/ui/`

## Environment Variables

### Frontend Variables (must start with `VITE_`)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key

### Backend Variables (Edge Functions secrets)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_DB_URL` - Direct database connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `BOLDSIGN_CLIENT_ID` - BoldSign OAuth client ID
- `BOLDSIGN_CLIENT_SECRET` - BoldSign OAuth client secret
- `BOLDSIGN_API_KEY` - BoldSign API key (fallback)
- `BOLDSIGN_BASE_URL` - BoldSign API base URL
- `BOLDSIGN_WEBHOOK_SECRET` - BoldSign webhook signing secret
- `RESEND_API_KEY` - Resend email API key

See `.env.example` for complete configuration template.
