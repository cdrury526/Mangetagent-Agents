# Supabase CLI Reference

## Installation

### macOS (Homebrew)
```bash
brew install supabase/tap/supabase
```

### macOS (direct download)
```bash
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
```

### Linux (apt)
```bash
wget -O supabase.deb https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.deb
sudo dpkg -i supabase.deb
```

### npm/npx
```bash
npm install -g supabase
# or use npx
npx supabase <command>
```

### Windows (Scoop)
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Core Commands

### Project Initialization

```bash
# Initialize a new Supabase project
supabase init

# Link to an existing project
supabase link --project-ref <project-ref>

# Start local Supabase services
supabase start

# Stop local services
supabase stop

# Check status of services
supabase status
```

### Database Commands

```bash
# Create a new migration
supabase migration new <migration_name>

# List migrations
supabase migration list

# Apply migrations
supabase db push

# Reset database (local only)
supabase db reset

# Dump database schema
supabase db dump --data-only > seed.sql
supabase db dump --schema-only > schema.sql

# Generate database diff
supabase db diff

# Lint database for issues
supabase db lint
```

### Type Generation

```bash
# Generate TypeScript types from database schema
supabase gen types typescript --local > types/database.ts
supabase gen types typescript --project-ref <ref> > types/database.ts

# Generate types for specific schema
supabase gen types typescript --schema public,auth
```

### Edge Functions

```bash
# Create a new function
supabase functions new <function_name>

# Serve functions locally
supabase functions serve

# Deploy a function
supabase functions deploy <function_name>

# List deployed functions
supabase functions list

# Delete a function
supabase functions delete <function_name>
```

### Storage Commands

```bash
# Example: Seed storage buckets programmatically
# See examples/seed-storage directory in CLI repo
```

### Secrets Management

```bash
# List secrets
supabase secrets list

# Set a secret
supabase secrets set MY_SECRET=value

# Unset a secret
supabase secrets unset MY_SECRET
```

### Project Management

```bash
# Login to Supabase
supabase login

# List projects
supabase projects list

# Get project API settings
supabase projects api-keys
```

### Inspection Commands

```bash
# Check for long-running queries
supabase inspect db long-running-queries

# Check database bloat
supabase inspect db bloat

# Check cache hit rates
supabase inspect db cache-hit

# Check unused indexes
supabase inspect db unused-indexes
```

## Configuration Files

### config.toml
Located at `supabase/config.toml`, this file contains:

```toml
[api]
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
major_version = 15

[studio]
port = 54323

[inbucket]
port = 54324

[storage]
file_size_limit = "50MiB"

[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

## Local Development URLs

When running `supabase start`:

- **API Gateway**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio (UI)**: http://localhost:54323
- **Inbucket (Email testing)**: http://localhost:54324
- **Storage**: http://localhost:54321/storage/v1

## Environment Variables

```bash
# For CLI operations
export SUPABASE_ACCESS_TOKEN="your-access-token"
export SUPABASE_PROJECT_ID="your-project-id"
export SUPABASE_DB_PASSWORD="your-db-password"

# For application
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Common Workflows

### Setting up a new project

```bash
# 1. Initialize
supabase init

# 2. Start local development
supabase start

# 3. Create first migration
supabase migration new init_schema

# 4. Edit migration file in supabase/migrations/
# 5. Apply migration
supabase db reset
```

### Deploying changes

```bash
# 1. Link to remote project
supabase link --project-ref abc123

# 2. Push database changes
supabase db push

# 3. Deploy functions
supabase functions deploy

# 4. Verify deployment
supabase db remote commit
```

### Migrating from existing database

```bash
# 1. Dump remote database
supabase db dump --db-url "postgresql://..." > dump.sql

# 2. Import to local
psql "postgresql://postgres:postgres@localhost:54322/postgres" < dump.sql

# 3. Generate diff
supabase db diff --use-migra > new_migration.sql
```

## GitHub Repository

Full CLI source code and documentation:
https://github.com/supabase/cli

## References

- CLI GitHub: https://github.com/supabase/cli/blob/develop/README.md
- CLI Commands: https://github.com/supabase/cli/blob/develop/docs/
- Examples: https://github.com/supabase/cli/blob/develop/examples/
