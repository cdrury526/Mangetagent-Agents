# Development Workflows

This document describes common development patterns and workflows for the Bolt-Magnet-Agent-2025 platform.

## Adding a New Page

1. Create component in `src/pages/agent/`
2. Add route in `src/App.tsx` with `PrivateRoute` wrapper
3. Add navigation link in appropriate nav component

### Example

```typescript
// 1. Create src/pages/agent/NewFeature.tsx
export function NewFeature() {
  return <div>New Feature</div>;
}

// 2. Add to src/App.tsx
import { NewFeature } from './pages/agent/NewFeature';

<Route path="/new-feature" element={
  <PrivateRoute>
    <NewFeature />
  </PrivateRoute>
} />

// 3. Add navigation link
<NavLink to="/new-feature">New Feature</NavLink>
```

## Adding a New Database Table

1. Create migration: `supabase migration new add_table_name`
2. Define table schema with RLS policies
3. Add TypeScript types to `src/types/database.ts`
4. Create custom hook in `src/hooks/` for data access
5. Test locally with `supabase db reset`

### Example Migration

```sql
-- Create table
CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_name_per_agent UNIQUE (agent_id, name)
);

-- Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own records"
  ON public.new_table
  FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert their own records"
  ON public.new_table
  FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update their own records"
  ON public.new_table
  FOR UPDATE
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can delete their own records"
  ON public.new_table
  FOR DELETE
  USING (auth.uid() = agent_id);

-- Indexes
CREATE INDEX idx_new_table_agent_id ON public.new_table(agent_id);

-- Updated timestamp trigger
CREATE TRIGGER update_new_table_updated_at
  BEFORE UPDATE ON public.new_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Calling External APIs

**CRITICAL**: Frontend code should NOT call external APIs directly.

### Pattern
1. Create Edge Function in `supabase/functions/`
2. Use service role key for privileged operations
3. Implement error handling and validation
4. Call from frontend via Supabase client

### Example: BoldSign Integration Pattern

```typescript
// ❌ BAD - Direct API call from frontend
const response = await fetch('https://api.boldsign.com/v1/...', {
  headers: { 'X-API-Key': process.env.BOLDSIGN_API_KEY } // EXPOSED!
});

// ✅ GOOD - Edge Function proxy
const { data, error } = await supabase.functions.invoke('boldsign-api', {
  body: { action: 'send-document', documentId: '...' }
});
```

### Edge Function Template

```typescript
// supabase/functions/my-api/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Parse request
    const body = await req.json();

    // Call external API with secrets
    const response = await fetch('https://external-api.com/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('API_SECRET')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

## Working with Documents

- Documents stored in Supabase Storage (bucket: `documents`)
- Metadata in `documents` table
- Upload through `useDocuments` hook
- Access control via RLS based on `agent_id`

### Upload Pattern

```typescript
// Upload file to Storage
const { data: storageData, error: storageError } = await supabase.storage
  .from('documents')
  .upload(`${agentId}/${fileName}`, file);

// Save metadata to database
const { data, error } = await supabase
  .from('documents')
  .insert({
    agent_id: agentId,
    transaction_id: transactionId,
    name: fileName,
    type: documentType,
    storage_path: storageData.path
  });
```

### Download Pattern

```typescript
// Get signed URL (valid for 1 hour)
const { data, error } = await supabase.storage
  .from('documents')
  .createSignedUrl(storagePath, 3600);

// Download file
window.open(data.signedUrl);
```

## Testing Workflows

### Manual Testing Checklist

1. **Account Tier Testing**
   - Test with free account (5 transaction limit)
   - Test with pro account (unlimited)
   - Verify upgrade/downgrade flows

2. **Data Isolation**
   - Create two test accounts
   - Verify each can only see their own data
   - Test cross-agent data access prevention

3. **Stripe Webhooks**
   - Install Stripe CLI: `stripe login`
   - Forward webhooks: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
   - Trigger test events: `stripe trigger payment_intent.succeeded`

4. **BoldSign Webhooks**
   - Use ngrok for local testing: `ngrok http 54321`
   - Configure webhook URL in BoldSign dashboard
   - Test document status changes

5. **Real-time Subscriptions**
   - Open two browser tabs
   - Make changes in one tab
   - Verify other tab updates automatically

### Local Development Testing

```bash
# Start all services
supabase start
npm run dev

# Reset database (careful - drops all data)
supabase db reset

# View logs
supabase functions logs boldsign-api
supabase functions logs stripe-webhook

# Test Edge Function locally
curl -i --location --request POST 'http://localhost:54321/functions/v1/boldsign-api' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"action":"test"}'
```

## Common Issues and Solutions

### Issue: Real-time updates not working
**Solution**: Check filter clause, ensure cleanup function is called, verify subscription state

### Issue: RLS policy blocking queries
**Solution**: Verify `agent_id` is set correctly, check policy conditions, use service role key in Edge Functions only

### Issue: CORS errors from Edge Functions
**Solution**: Add CORS headers to Edge Function responses

```typescript
return new Response(JSON.stringify(data), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  }
});
```

### Issue: Webhook signature verification failing
**Solution**: Check webhook secret is correct, verify signature calculation, ensure raw body is used

## See Also
- [Architecture Overview](../Architecture.md)
- [Real-Time Subscriptions](./Real-Time-Subscriptions.md)
- [Supabase Documentation](../Supabase/README.md)
- [Stripe Documentation](../Stripe/README.md)
- [BoldSign Documentation](../Boldsign/README.md)
