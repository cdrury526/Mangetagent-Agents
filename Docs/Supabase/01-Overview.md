# Supabase Documentation Overview

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- **PostgreSQL Database** - Full-featured relational database
- **Authentication** - Built-in auth with multiple providers
- **Storage** - File storage with CDN
- **Realtime** - WebSocket-based real-time subscriptions
- **Edge Functions** - Serverless functions powered by Deno
- **Auto-generated APIs** - REST and GraphQL APIs via PostgREST

## Core Components

### 1. Database (PostgreSQL)
- Full PostgreSQL 15 & 17 support
- Row Level Security (RLS) policies
- Extensions (PostGIS, pg_vector, TimescaleDB, etc.)
- Automatic migrations
- Database functions and triggers

### 2. Authentication
- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Magic links
- Phone authentication
- SSO/SAML
- Multi-factor authentication

### 3. Storage (Buckets)
- File upload/download
- Access control with RLS
- Image transformations
- CDN integration
- Resume uploads
- Standard and Vector buckets

### 4. Realtime
- Postgres Changes (CDC)
- Broadcast messages
- Presence tracking
- Channel-based subscriptions

### 5. Edge Functions
- Deno runtime
- Deploy serverless functions
- Execute on the edge
- Access to Supabase client

### 6. CLI
- Local development environment
- Database migrations
- Type generation
- Project management
- Function deployment

## Official Resources

- **Main Documentation**: https://supabase.com/docs
- **GitHub Organization**: https://github.com/supabase
- **API Reference**: Auto-generated from your schema
- **Community**: https://github.com/supabase/supabase/discussions

## JavaScript/TypeScript SDKs

### @supabase/supabase-js
Main client library for browser and Node.js applications.

### Component Libraries
- `@supabase/auth-js` - Authentication
- `@supabase/postgrest-js` - Database queries
- `@supabase/storage-js` - File storage
- `@supabase/realtime-js` - Real-time subscriptions
- `@supabase/functions-js` - Edge functions client

### SSR Support
- `@supabase/ssr` - Server-side rendering utilities
- Framework-specific packages for Next.js, SvelteKit, etc.

## Development Workflow

1. **Local Development**
   ```bash
   supabase init
   supabase start
   supabase db reset
   ```

2. **Database Migrations**
   ```bash
   supabase migration new <name>
   supabase db push
   ```

3. **Type Generation**
   ```bash
   supabase gen types typescript --local > types/supabase.ts
   ```

4. **Deployment**
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   supabase functions deploy
   ```

## Architecture

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase API   │
│   (PostgREST)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│    Database     │
└─────────────────┘

Realtime WebSocket ←→ Postgres CDC
Edge Functions ←→ Deno Runtime
Storage ←→ S3-compatible backend
```

## Next Steps

- [CLI Reference](./02-CLI-Reference.md)
- [JavaScript Client](./03-JavaScript-Client.md)
- [Realtime Guide](./04-Realtime.md)
- [Storage & Buckets](./05-Storage.md)
- [Authentication](./06-Authentication.md)
- [Database & Postgres](./07-Database.md)
- [MCP Server Integration](./08-MCP-Server.md)
