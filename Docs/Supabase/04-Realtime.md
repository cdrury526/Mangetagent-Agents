# Supabase Realtime

Supabase Realtime enables real-time functionality through WebSockets. It provides three main features: Postgres Changes, Broadcast, and Presence.

## Features

### 1. Postgres Changes (CDC)
Listen to INSERT, UPDATE, and DELETE operations on your database tables.

### 2. Broadcast
Send ephemeral messages between connected clients.

### 3. Presence
Track and synchronize shared state between users.

## Installation

```bash
npm install @supabase/realtime-js
```

Or use through the main Supabase client:
```bash
npm install @supabase/supabase-js
```

## Postgres Changes

### Basic Setup

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Subscribe to all changes
const channel = supabase
  .channel('schema-db-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'countries'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### Filter by Event Type

```typescript
// Listen to INSERT only
supabase
  .channel('db-insertss')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'countries'
    },
    (payload) => {
      console.log('New row:', payload.new)
    }
  )
  .subscribe()

// Listen to UPDATE only
supabase
  .channel('db-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'countries'
    },
    (payload) => {
      console.log('Updated from:', payload.old)
      console.log('Updated to:', payload.new)
    }
  )
  .subscribe()

// Listen to DELETE only
supabase
  .channel('db-deletes')
  .on(
    'postgres_changes',
    {
      event: 'DELETE',
      schema: 'public',
      table: 'countries'
    },
    (payload) => {
      console.log('Deleted row:', payload.old)
    }
  )
  .subscribe()
```

### Filter by Column Value

```typescript
// Listen to changes where id = 1
supabase
  .channel('specific-row')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'countries',
      filter: 'id=eq.1'
    },
    (payload) => {
      console.log('Row 1 changed:', payload)
    }
  )
  .subscribe()
```

### Multiple Tables

```typescript
const channel = supabase.channel('db-changes')

channel
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'countries' },
    handleCountryChange
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'cities' },
    handleCityChange
  )
  .subscribe()
```

## Broadcast

Send and receive ephemeral messages between clients.

### Basic Broadcast

```typescript
const channel = supabase.channel('room-1')

// Listen to broadcasts
channel
  .on('broadcast', { event: 'cursor-pos' }, (payload) => {
    console.log('Cursor position:', payload)
  })
  .subscribe()

// Send broadcast
channel.send({
  type: 'broadcast',
  event: 'cursor-pos',
  payload: { x: 100, y: 100 }
})
```

### Multiple Events

```typescript
const channel = supabase.channel('game-room')

channel
  .on('broadcast', { event: 'move' }, ({ payload }) => {
    console.log('Player moved:', payload)
  })
  .on('broadcast', { event: 'score' }, ({ payload }) => {
    console.log('Score updated:', payload)
  })
  .subscribe()

// Send different events
channel.send({
  type: 'broadcast',
  event: 'move',
  payload: { player: 'A', position: [10, 20] }
})

channel.send({
  type: 'broadcast',
  event: 'score',
  payload: { player: 'A', points: 100 }
})
```

## Presence

Track which users are online and share state between them.

### Basic Presence

```typescript
const channel = supabase.channel('room-1')

// Track presence state
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', state)
  })
  .on('presence', { event: 'join' }, ({ newPresences }) => {
    console.log('New users joined:', newPresences)
  })
  .on('presence', { event: 'leave' }, ({ leftPresences }) => {
    console.log('Users left:', leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: userId,
        online_at: new Date().toISOString()
      })
    }
  })
```

### Update Presence

```typescript
// Update your presence data
await channel.track({
  user_id: userId,
  online_at: new Date().toISOString(),
  status: 'active',
  cursor: { x: 100, y: 200 }
})
```

### Remove Presence

```typescript
// Stop tracking
await channel.untrack()

// Or unsubscribe from channel
await channel.unsubscribe()
```

## Channel Configuration

### Channel Options

```typescript
const channel = supabase.channel('room-1', {
  config: {
    broadcast: {
      self: true, // Receive own broadcasts
      ack: false // Acknowledge broadcasts
    },
    presence: {
      key: 'user_id' // Unique key for presence
    }
  }
})
```

### Connection States

```typescript
channel.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected!')
  }
  if (status === 'CHANNEL_ERROR') {
    console.log('Error:', err)
  }
  if (status === 'TIMED_OUT') {
    console.log('Connection timed out')
  }
  if (status === 'CLOSED') {
    console.log('Connection closed')
  }
})
```

## Advanced Patterns

### Combined Features

```typescript
const channel = supabase.channel('collaborative-editor')

// Database changes
channel.on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'documents' },
  (payload) => {
    console.log('Document updated in DB:', payload)
  }
)

// Broadcast for cursors
channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
  updateCursor(payload.user, payload.position)
})

// Presence for online users
channel.on('presence', { event: 'sync' }, () => {
  const users = channel.presenceState()
  updateUserList(users)
})

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({ user_id: currentUser.id })
  }
})
```

### Cleanup

```typescript
// Unsubscribe from specific channel
await channel.unsubscribe()

// Remove all channels
await supabase.removeAllChannels()

// Remove specific channels
await supabase.removeChannel(channel)
```

## Server Configuration

To enable Realtime, you need to configure it on your Supabase project:

1. Go to Database > Replication
2. Select tables you want to broadcast changes from
3. Enable "Realtime" for those tables

### Enable for Table (SQL)

```sql
alter publication supabase_realtime add table countries;
```

### Row Level Security

Realtime respects Row Level Security policies:

```sql
-- Only broadcast public countries
create policy "Public countries are visible"
  on countries for select
  using (is_public = true);
```

## Connection Configuration

### Environment Variables

```bash
# Default Realtime endpoint
REALTIME_URL=wss://your-project.supabase.co/realtime/v1
```

### Custom Configuration

```typescript
import { RealtimeClient } from '@supabase/realtime-js'

const client = new RealtimeClient('wss://your-project.supabase.co/realtime/v1', {
  params: {
    apikey: 'your-anon-key',
    eventsPerSecond: 10
  }
})

const channel = client.channel('room-1')
await channel.subscribe()
```

## Error Handling

```typescript
channel.subscribe((status, err) => {
  if (err) {
    console.error('Channel error:', err)
  }
})

// Listen for errors
channel.on('system', {}, (payload) => {
  if (payload.status === 'error') {
    console.error('System error:', payload)
  }
})
```

## Performance Tips

1. **Limit subscriptions**: Don't subscribe to too many channels
2. **Use filters**: Filter at the database level when possible
3. **Debounce broadcasts**: Don't send too many messages too quickly
4. **Clean up**: Always unsubscribe when done
5. **Use presence carefully**: Presence state is replicated to all clients

## References

- Realtime Docs: https://supabase.com/docs/guides/realtime
- GitHub: https://github.com/supabase/realtime
- Client Library: https://github.com/supabase/supabase-js/tree/master/packages/core/realtime-js
- Multiplayer Demo: https://multiplayer.dev
