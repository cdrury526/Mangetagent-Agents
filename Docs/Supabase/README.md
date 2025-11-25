# Supabase Documentation

Comprehensive documentation for Supabase - the open-source Firebase alternative.

## 📚 Documentation Files

1. **[Overview](./01-Overview.md)** - Introduction to Supabase and its core components
2. **[CLI Reference](./02-CLI-Reference.md)** - Complete command-line interface guide
3. **[JavaScript Client](./03-JavaScript-Client.md)** - Client library API reference
4. **[Realtime](./04-Realtime.md)** - WebSocket-based real-time features
5. **[Storage](./05-Storage.md)** - File storage and bucket management
6. **[Authentication](./06-Authentication.md)** - User authentication and authorization
7. **[Database](./07-Database.md)** - PostgreSQL database features and best practices
8. **[MCP Server](./08-MCP-Server.md)** - Model Context Protocol integration

## 🚀 Quick Start

### Installation

```bash
# Install CLI
brew install supabase/tap/supabase

# Install JavaScript client
npm install @supabase/supabase-js
```

### Initialize Project

```bash
# Initialize Supabase project
supabase init

# Start local development
supabase start

# Link to remote project
supabase link --project-ref your-project-ref
```

### Basic Usage

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Query data
const { data, error } = await supabase
  .from('countries')
  .select('*')

// Insert data
const { data, error } = await supabase
  .from('countries')
  .insert({ name: 'Denmark' })

// Real-time subscription
supabase
  .channel('db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'countries' },
    payload => console.log(payload)
  )
  .subscribe()
```

## 🔑 Key Features

### Database
- Full PostgreSQL 15 & 17
- Row Level Security (RLS)
- 40+ extensions (PostGIS, pgvector, TimescaleDB)
- Auto-generated REST & GraphQL APIs

### Authentication
- Email/password, OAuth, magic links
- Multi-factor authentication
- Row Level Security integration
- SSO/SAML support

### Storage
- S3-compatible object storage
- Image transformations
- Access control with RLS
- CDN integration

### Realtime
- Database change subscriptions
- Broadcast messages
- Presence tracking
- WebSocket-based

### Edge Functions
- Deno-powered serverless functions
- Global deployment
- TypeScript support
- Direct database access

## 📖 Core Concepts

### Row Level Security (RLS)
Control data access at the row level:

```sql
alter table posts enable row level security;

create policy "Users can see own posts"
  on posts for select
  using (auth.uid() = user_id);
```

### Migrations
Version control for database schema:

```bash
supabase migration new create_posts_table
supabase db push
```

### Type Generation
Auto-generate TypeScript types:

```bash
supabase gen types typescript --local > types/database.ts
```

## 🛠️ Development Workflow

1. **Local Development**
   ```bash
   supabase start
   ```

2. **Make Changes**
   - Edit migrations
   - Update functions
   - Modify policies

3. **Test Locally**
   ```bash
   supabase db reset
   ```

4. **Deploy**
   ```bash
   supabase db push
   supabase functions deploy
   ```

## 🔗 Official Resources

- **Website**: https://supabase.com
- **Documentation**: https://supabase.com/docs
- **GitHub**: https://github.com/supabase
- **Discord**: https://discord.supabase.com
- **Twitter**: [@supabase](https://twitter.com/supabase)

## 📦 Packages

### Core Libraries
- `@supabase/supabase-js` - Main client library
- `@supabase/auth-js` - Authentication
- `@supabase/postgrest-js` - Database queries
- `@supabase/storage-js` - File storage
- `@supabase/realtime-js` - Real-time subscriptions

### Framework Helpers
- `@supabase/ssr` - Server-side rendering
- `@supabase/auth-helpers-nextjs` - Next.js integration
- `@supabase/auth-helpers-sveltekit` - SvelteKit integration
- `@supabase/auth-helpers-remix` - Remix integration

### Tools
- `supabase` - CLI tool
- `@supabase/postgres-meta` - Database introspection

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│         Client Apps             │
│   (Web, Mobile, Desktop)        │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│       Supabase Platform         │
├─────────────────────────────────┤
│  API Gateway (Kong)             │
│  ├─ REST API (PostgREST)        │
│  ├─ GraphQL API                 │
│  ├─ Auth API (GoTrue)           │
│  ├─ Storage API                 │
│  └─ Realtime (WebSockets)       │
├─────────────────────────────────┤
│  PostgreSQL Database            │
│  ├─ Tables & Relations          │
│  ├─ Functions & Triggers        │
│  ├─ Extensions                  │
│  └─ Row Level Security          │
├─────────────────────────────────┤
│  Storage Backend (S3)           │
└─────────────────────────────────┘
```

## 🔐 Security

### Best Practices
1. Enable Row Level Security on all tables
2. Use anon key for client-side
3. Use service role key only server-side
4. Implement proper RLS policies
5. Validate user input
6. Use HTTPS in production
7. Rotate secrets regularly

### RLS Policy Examples

```sql
-- Public read access
create policy "Public access"
  on posts for select
  using (is_public = true);

-- Authenticated users only
create policy "Authenticated access"
  on posts for all
  using (auth.role() = 'authenticated');

-- User-specific access
create policy "Own data access"
  on posts for all
  using (auth.uid() = user_id);
```

## 📊 Monitoring & Debugging

### Database Logs
```bash
# View logs
supabase db logs

# Inspect issues
supabase inspect db long-running-queries
supabase inspect db bloat
```

### Error Handling
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')

if (error) {
  console.error('Error:', error.message, error.code, error.details)
}
```

## 🤝 Community

### Getting Help
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Discord Community](https://discord.supabase.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)
- [Twitter](https://twitter.com/supabase)

### Contributing
- [Contributing Guide](https://github.com/supabase/supabase/blob/master/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/supabase/supabase/blob/master/CODE_OF_CONDUCT.md)

## 📝 License

Supabase is open source under the [Apache 2.0 License](https://github.com/supabase/supabase/blob/master/LICENSE).

## 🎯 Next Steps

1. Read the [Overview](./01-Overview.md) for a comprehensive introduction
2. Follow the [CLI Reference](./02-CLI-Reference.md) to set up your development environment
3. Explore the [JavaScript Client](./03-JavaScript-Client.md) API
4. Learn about [Authentication](./06-Authentication.md) and security
5. Dive into [Database](./07-Database.md) features and PostgreSQL

---

**Last Updated**: 2025-01-23

**Documentation Version**: Based on latest Supabase releases
- CLI: Latest
- supabase-js: v2.80.x
- PostgreSQL: 15.14 & 17.x
- Realtime: v2.62.x
