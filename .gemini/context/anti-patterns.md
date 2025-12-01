# Anti-Patterns (NEVER DO)

## Security Violations

### NEVER expose service role key to frontend
```typescript
// BAD - Service role key in frontend
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// GOOD - Anon key in frontend, service role only in Edge Functions
const supabase = createClient(url, process.env.VITE_SUPABASE_ANON_KEY);
```

### NEVER skip webhook signature verification
```typescript
// BAD - Processing unverified webhooks
app.post('/webhook', (req, res) => {
  const event = req.body; // DANGEROUS - could be spoofed
  processEvent(event);
});

// GOOD - Always verify signatures
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  processEvent(event);
});
```

### NEVER call external APIs from frontend
```typescript
// BAD - Direct API call from React component
const response = await fetch('https://api.stripe.com/v1/charges', {
  headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } // EXPOSED!
});

// GOOD - Call Edge Function which calls external API
const { data } = await supabase.functions.invoke('create-charge', {
  body: { amount, customerId }
});
```

### NEVER commit secrets
```bash
# BAD - These should NEVER be in git
.env
credentials.json
*.pem
service-account.json

# GOOD - Use .env.example with placeholder values
STRIPE_SECRET_KEY=sk_test_your_key_here
```

## Real-time Subscription Violations

### NEVER forget cleanup
```typescript
// BAD - Memory leak, subscriptions accumulate
useEffect(() => {
  const channel = supabase.channel('changes').on(...).subscribe();
  // No cleanup!
}, []);

// GOOD - Always cleanup
useEffect(() => {
  const channel = supabase.channel('changes').on(...).subscribe();
  return () => { supabase.removeChannel(channel); }; // CRITICAL
}, []);
```

### NEVER subscribe without agent_id filter
```typescript
// BAD - Receives ALL users' data (RLS blocks it, but wasteful)
.on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, ...)

// GOOD - Filter to current user's data only
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'transactions',
  filter: `agent_id=eq.${user.id}`  // Only this user's changes
}, ...)
```

### NEVER create multiple subscriptions to same table
```typescript
// BAD - Multiple channels to same table
const channel1 = supabase.channel('ch1').on('postgres_changes', { table: 'tasks' }...);
const channel2 = supabase.channel('ch2').on('postgres_changes', { table: 'tasks' }...);

// GOOD - Single channel with multiple event handlers if needed
const channel = supabase.channel('tasks-channel')
  .on('postgres_changes', { table: 'tasks', filter: `status=eq.pending` }, handlePending)
  .on('postgres_changes', { table: 'tasks', filter: `status=eq.completed` }, handleCompleted)
  .subscribe();
```

## Data Access Violations

### NEVER bypass RLS policies
```typescript
// BAD - Using service role to bypass RLS from Edge Function unnecessarily
const supabase = createClient(url, SERVICE_ROLE_KEY);
const { data } = await supabase.from('transactions').select('*'); // Gets ALL data

// GOOD - Use user's JWT, let RLS filter
const supabase = createClient(url, ANON_KEY, {
  global: { headers: { Authorization: req.headers.get('Authorization') } }
});
const { data } = await supabase.from('transactions').select('*'); // Only user's data
```

### NEVER allow cross-agent data access
```typescript
// BAD - No agent_id check
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('id', transactionId); // Could be another agent's transaction!

// GOOD - RLS handles this, but double-check in application code if critical
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('id', transactionId)
  .eq('agent_id', user.id) // Explicit check (RLS also enforces)
  .single();
```

### NEVER hard delete transactions
```typescript
// BAD - Destroys audit trail
await supabase.from('transactions').delete().eq('id', id);

// GOOD - Soft delete preserves history
await supabase.from('transactions').update({ status: 'cancelled' }).eq('id', id);
```

## Transaction Workflow Violations

### NEVER skip status validation
```typescript
// BAD - Direct status update without validation
await supabase.from('transactions').update({ status: 'closed' }).eq('id', id);

// GOOD - Validate transition is allowed
const ALLOWED_TRANSITIONS = {
  prospecting: ['pending', 'cancelled'],
  pending: ['active', 'cancelled'],
  active: ['under_contract', 'cancelled'],
  // ...
};

if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
  throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
}
```

## TypeScript Violations

### NEVER use `any` without justification
```typescript
// BAD
const data: any = await fetchData();
const handler = (e: any) => { ... };

// GOOD - Use proper types or `unknown` with type guards
const data: Transaction[] = await fetchData();
const handler = (e: React.MouseEvent<HTMLButtonElement>) => { ... };

// If truly dynamic, use unknown with type guard
const data: unknown = await fetchExternalApi();
if (isTransaction(data)) {
  // Now TypeScript knows it's Transaction
}
```

### NEVER ignore TypeScript errors
```typescript
// BAD
// @ts-ignore
doSomethingUnsafe();

// GOOD - Fix the actual type issue or use proper type assertion with comment
doSomethingSafe() as ExpectedType; // Type assertion when we know better than TS
```
