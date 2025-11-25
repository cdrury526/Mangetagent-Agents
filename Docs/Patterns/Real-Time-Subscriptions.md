# Real-Time Subscriptions Pattern

This document describes the real-time subscription pattern used throughout the application.

## Pattern Overview

All custom hooks follow this pattern for real-time data synchronization:

```typescript
// Pattern used in useTransactions, useDocuments, useTasks, etc.
const channel = supabase
  .channel('table-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'table_name',
    filter: `agent_id=eq.${agentId}`
  }, () => {
    fetchData(); // Refetch on change
  })
  .subscribe();

return () => supabase.removeChannel(channel);
```

## Critical Requirements

### 1. Always Include Cleanup
**MUST** call `supabase.removeChannel(channel)` in the useEffect cleanup function to prevent memory leaks.

```typescript
useEffect(() => {
  const channel = setupSubscription();
  return () => supabase.removeChannel(channel); // REQUIRED
}, [dependencies]);
```

### 2. Filter by agent_id
**MUST** include `agent_id` filter to respect data isolation:

```typescript
filter: `agent_id=eq.${agentId}`
```

This ensures users only receive updates for their own data.

### 3. Consolidate Subscriptions
**AVOID** creating multiple subscriptions to the same table in one component. Consolidate into a single channel:

```typescript
// ❌ BAD - Multiple channels
const channel1 = supabase.channel('transactions-updates')...
const channel2 = supabase.channel('transactions-deletes')...

// ✅ GOOD - Single channel with multiple listeners
const channel = supabase
  .channel('transactions')
  .on('postgres_changes', { event: 'UPDATE', ... }, handleUpdate)
  .on('postgres_changes', { event: 'DELETE', ... }, handleDelete)
  .subscribe();
```

## Implementation Examples

### Basic Hook Pattern

```typescript
export function useTransactions(agentId: string) {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', agentId);

      if (!error) setData(data);
      setLoading(false);
    }

    fetchData();

    // Setup real-time subscription
    const channel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `agent_id=eq.${agentId}`
      }, () => {
        fetchData(); // Refetch on any change
      })
      .subscribe();

    // Cleanup REQUIRED
    return () => supabase.removeChannel(channel);
  }, [agentId]);

  return { data, loading };
}
```

### Advanced Pattern with Specific Events

```typescript
useEffect(() => {
  const channel = supabase
    .channel('documents-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'documents',
      filter: `agent_id=eq.${agentId}`
    }, (payload) => {
      setDocuments(prev => [...prev, payload.new]);
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'documents',
      filter: `agent_id=eq.${agentId}`
    }, (payload) => {
      setDocuments(prev =>
        prev.map(doc => doc.id === payload.new.id ? payload.new : doc)
      );
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'documents',
      filter: `agent_id=eq.${agentId}`
    }, (payload) => {
      setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [agentId]);
```

## Performance Considerations

### Channel Naming
Use descriptive, unique channel names to avoid conflicts:

```typescript
// ✅ GOOD - Descriptive and unique
.channel('transactions-realtime')
.channel('documents-updates')

// ❌ BAD - Generic names may conflict
.channel('changes')
.channel('updates')
```

### Subscription State
Monitor subscription state for debugging:

```typescript
const channel = supabase
  .channel('my-channel')
  .on('postgres_changes', {...})
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to real-time updates');
    }
  });
```

### Error Handling
Handle subscription errors gracefully:

```typescript
const channel = supabase
  .channel('my-channel')
  .on('postgres_changes', {...})
  .subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('Subscription error:', err);
      // Implement retry logic if needed
    }
  });
```

## Testing Real-Time Subscriptions

### Local Testing
1. Start Supabase locally: `supabase start`
2. Open two browser tabs
3. Make a change in one tab
4. Verify the other tab updates automatically

### Common Issues
- **No updates received**: Check filter clause matches your data
- **Memory leaks**: Ensure cleanup function is called
- **Multiple fetches**: Check for duplicate subscriptions
- **Performance issues**: Consolidate multiple channels into one

## See Also
- [Supabase Realtime Documentation](../Supabase/04-Realtime.md)
- [Custom Hooks](../../src/hooks/)
- [Authentication Context](../../src/contexts/AuthContext.tsx)
