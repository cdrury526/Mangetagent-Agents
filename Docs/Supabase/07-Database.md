# Supabase Database & PostgreSQL

Supabase provides a full PostgreSQL database with extensions, Row Level Security, and powerful querying capabilities.

## PostgreSQL Versions

- **PostgreSQL 15** - Stable, production-ready
- **PostgreSQL 17** - Latest features and improvements
- **OrioleDB-17** - Experimental storage engine

## Core Concepts

### Tables

Standard PostgreSQL tables with full SQL support:

```sql
create table countries (
  id bigint primary key generated always as identity,
  name text not null,
  iso2 text not null unique,
  created_at timestamptz default now()
);
```

### Row Level Security (RLS)

Control data access at the row level:

```sql
-- Enable RLS
alter table countries enable row level security;

-- Create policy
create policy "Public countries are visible"
  on countries for select
  using (is_public = true);

-- User-specific policy
create policy "Users can see own data"
  on profiles for select
  using (auth.uid() = user_id);
```

### Foreign Keys & Relations

```sql
create table cities (
  id bigint primary key generated always as identity,
  name text not null,
  country_id bigint references countries(id) on delete cascade,
  population bigint
);
```

### Indexes

```sql
-- Standard index
create index idx_cities_country on cities(country_id);

-- Unique index
create unique index idx_users_email on users(email);

-- Partial index
create index idx_active_users on users(id) where is_active = true;

-- Full-text search index
create index idx_posts_content on posts using gin(to_tsvector('english', content));
```

## Extensions

Supabase includes many PostgreSQL extensions:

### Popular Extensions

```sql
-- UUID generation
create extension if not exists "uuid-ossp";

-- PostGIS (geospatial)
create extension if not exists postgis;

-- pgvector (AI/embeddings)
create extension if not exists vector;

-- pg_cron (scheduled jobs)
create extension if not exists pg_cron;

-- pg_jsonschema (JSON validation)
create extension if not exists pg_jsonschema;

-- pgjwt (JWT handling)
create extension if not exists pgjwt;

-- TimescaleDB (time-series)
create extension if not exists timescaledb;

-- pg_graphql (GraphQL)
create extension if not exists pg_graphql;
```

### Available Extensions

View all available extensions:

```sql
select * from pg_available_extensions order by name;
```

## Functions

### Database Functions

```sql
-- Simple function
create or replace function get_country_count()
returns bigint
language sql
as $$
  select count(*) from countries;
$$;

-- Function with parameters
create or replace function get_cities_by_country(country_name text)
returns table (city_name text, population bigint)
language sql
as $$
  select c.name, c.population
  from cities c
  join countries co on c.country_id = co.id
  where co.name = country_name;
$$;

-- PL/pgSQL function
create or replace function create_user_profile()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email);
  return new;
end;
$$;
```

### Calling Functions

```typescript
// From JavaScript
const { data, error } = await supabase
  .rpc('get_cities_by_country', {
    country_name: 'United States'
  })
```

## Triggers

### Basic Trigger

```sql
-- Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on countries
  for each row
  execute function update_updated_at_column();
```

### After Insert Trigger

```sql
-- Create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function create_user_profile();
```

## Views

### Basic View

```sql
create view country_stats as
select
  c.name,
  count(ci.id) as city_count,
  sum(ci.population) as total_population
from countries c
left join cities ci on c.id = ci.country_id
group by c.id, c.name;
```

### Materialized View

```sql
create materialized view popular_cities as
select
  name,
  population,
  country_id
from cities
where population > 1000000
order by population desc;

-- Refresh materialized view
refresh materialized view popular_cities;
```

### Security Definer Views

```sql
create view private_user_info
with (security_invoker = false)
as
select
  id,
  email,
  created_at
from auth.users;
```

## Full-Text Search

```sql
-- Add search column
alter table posts
add column search_vector tsvector
generated always as (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
) stored;

-- Create index
create index idx_posts_search on posts using gin(search_vector);

-- Search query
select *
from posts
where search_vector @@ to_tsquery('english', 'postgres & database');
```

### From JavaScript

```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .textSearch('search_vector', 'postgres & database')
```

## Vector Search (AI/ML)

Using pgvector for semantic search:

```sql
-- Create table with vector column
create table documents (
  id bigint primary key generated always as identity,
  content text,
  embedding vector(1536) -- OpenAI embeddings dimension
);

-- Create index
create index on documents using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Query similar vectors
select
  content,
  1 - (embedding <=> '[0.1, 0.2, ...]'::vector) as similarity
from documents
order by embedding <=> '[0.1, 0.2, ...]'::vector
limit 5;
```

### From JavaScript

```typescript
const { data, error } = await supabase
  .rpc('match_documents', {
    query_embedding: embedding, // your embedding array
    match_threshold: 0.78,
    match_count: 10
  })
```

## Migrations

### Creating Migrations

```bash
# Create new migration file
supabase migration new create_countries_table

# Migration file: supabase/migrations/20240101000000_create_countries_table.sql
```

### Migration Example

```sql
-- Create table
create table if not exists countries (
  id bigint primary key generated always as identity,
  name text not null,
  iso2 text not null unique,
  created_at timestamptz default now()
);

-- Enable RLS
alter table countries enable row level security;

-- Create policies
create policy "Countries are viewable by everyone"
  on countries for select
  using (true);

create policy "Countries are editable by authenticated users only"
  on countries for all
  using (auth.role() = 'authenticated');

-- Create index
create index idx_countries_iso2 on countries(iso2);
```

### Apply Migrations

```bash
# Apply to local database
supabase db reset

# Apply to remote database
supabase db push
```

## Database Backups

### Automated Backups

Supabase provides automatic daily backups (Pro plan and above).

### Manual Backups

```bash
# Dump entire database
supabase db dump > backup.sql

# Dump schema only
supabase db dump --schema-only > schema.sql

# Dump data only
supabase db dump --data-only > data.sql
```

### Restore

```bash
psql "postgresql://postgres:postgres@localhost:54322/postgres" < backup.sql
```

## Performance Optimization

### EXPLAIN ANALYZE

```sql
explain analyze
select * from cities
where country_id = 1;
```

### Indexes

```sql
-- Check missing indexes
select
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
from pg_stats
where schemaname = 'public'
order by abs(correlation) desc;
```

### Vacuum

```sql
-- Vacuum table
vacuum analyze cities;

-- Autovacuum is enabled by default
```

### Connection Pooling

Supabase uses PgBouncer for connection pooling:

```
# Transaction mode (recommended)
postgresql://postgres:password@db.project.supabase.co:6543/postgres

# Session mode
postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

## Realtime Replication

Enable realtime for tables:

```sql
-- Enable realtime
alter publication supabase_realtime add table countries;

-- Disable realtime
alter publication supabase_realtime drop table countries;
```

### From JavaScript

```typescript
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'countries' },
    (payload) => console.log(payload)
  )
  .subscribe()
```

## Database Webhooks

Trigger webhooks on database events:

```sql
-- Using pg_net extension
select net.http_post(
  url := 'https://your-webhook.com/endpoint',
  body := jsonb_build_object(
    'event', 'new_user',
    'data', new
  )
);
```

## Scheduled Jobs (pg_cron)

```sql
-- Run every hour
select cron.schedule(
  'delete-old-data',
  '0 * * * *',
  $$
    delete from logs
    where created_at < now() - interval '30 days';
  $$
);

-- List scheduled jobs
select * from cron.job;

-- Unschedule job
select cron.unschedule('delete-old-data');
```

## Security Best Practices

### Row Level Security

```sql
-- Always enable RLS
alter table sensitive_data enable row level security;

-- Create restrictive policies
create policy "Users can only see own data"
  on sensitive_data for all
  using (user_id = auth.uid());
```

### Service Role vs Anon Key

```typescript
// Client-side: Use anon key (respects RLS)
const supabase = createClient(url, anonKey)

// Server-side: Use service role (bypasses RLS)
const supabaseAdmin = createClient(url, serviceRoleKey)
```

### SQL Injection Prevention

```typescript
// Bad - vulnerable to SQL injection
const { data } = await supabase.rpc('get_user', {
  user_input: userInput
})

// Good - use parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('name', userInput)
```

## Debugging

### Query Logs

```sql
-- Enable query logging
alter system set log_statement = 'all';
select pg_reload_conf();

-- View logs in Dashboard > Database > Logs
```

### Lock Monitoring

```sql
-- Check for locks
select
  locktype,
  relation::regclass,
  mode,
  transactionid,
  pid,
  granted
from pg_locks
where not granted;
```

### Long-Running Queries

```bash
# Using CLI
supabase inspect db long-running-queries
```

```sql
-- Or using SQL
select
  pid,
  now() - pg_stat_activity.query_start as duration,
  query,
  state
from pg_stat_activity
where state != 'idle'
  and now() - pg_stat_activity.query_start > interval '5 minutes';
```

## Database Limits

- Max table size: Depends on plan
- Max row size: ~400KB (TOAST for larger)
- Max connections: Varies by plan
- Max database size: Varies by plan

## References

- Database Docs: https://supabase.com/docs/guides/database
- PostgreSQL Docs: https://www.postgresql.org/docs/
- PostgREST Docs: https://postgrest.org/
- pgvector: https://github.com/pgvector/pgvector
- GitHub: https://github.com/supabase/postgres
