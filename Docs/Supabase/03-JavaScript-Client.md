# Supabase JavaScript Client

## Installation

```bash
npm install @supabase/supabase-js
```

## Initialization

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)
```

### With TypeScript (Type-safe)

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './types/database.types'

const supabase = createClient<Database>(supabaseUrl, supabaseKey)
```

## Database Operations

### Select

```typescript
// Select all
const { data, error } = await supabase
  .from('countries')
  .select('*')

// Select specific columns
const { data, error } = await supabase
  .from('countries')
  .select('name, capital_city')

// Select with filters
const { data, error } = await supabase
  .from('countries')
  .select('*')
  .eq('id', 1)
  .single()

// Select with joins
const { data, error } = await supabase
  .from('countries')
  .select(`
    name,
    cities (
      name,
      population
    )
  `)

// Pagination
const { data, error } = await supabase
  .from('countries')
  .select('*')
  .range(0, 9)

// Ordering
const { data, error } = await supabase
  .from('countries')
  .select('*')
  .order('name', { ascending: true })

// Count
const { count, error } = await supabase
  .from('countries')
  .select('*', { count: 'exact', head: true })
```

### Insert

```typescript
// Insert single row
const { data, error } = await supabase
  .from('countries')
  .insert({ name: 'Denmark', code: 'DK' })
  .select()

// Insert multiple rows
const { data, error } = await supabase
  .from('countries')
  .insert([
    { name: 'Denmark', code: 'DK' },
    { name: 'Finland', code: 'FI' }
  ])
  .select()

// Upsert (insert or update)
const { data, error } = await supabase
  .from('countries')
  .upsert({ id: 1, name: 'Denmark' })
  .select()
```

### Update

```typescript
// Update with filter
const { data, error } = await supabase
  .from('countries')
  .update({ name: 'Denmark' })
  .eq('id', 1)
  .select()

// Update multiple rows
const { data, error } = await supabase
  .from('countries')
  .update({ continent: 'Europe' })
  .in('code', ['DK', 'FI', 'SE'])
```

### Delete

```typescript
// Delete with filter
const { error } = await supabase
  .from('countries')
  .delete()
  .eq('id', 1)

// Delete multiple
const { error } = await supabase
  .from('countries')
  .delete()
  .in('id', [1, 2, 3])
```

### RPC (Call Database Functions)

```typescript
const { data, error } = await supabase
  .rpc('function_name', {
    param1: 'value1',
    param2: 'value2'
  })
```

## Filter Operators

```typescript
// Equals
.eq('column', 'value')

// Not equals
.neq('column', 'value')

// Greater than
.gt('column', 10)

// Greater than or equal
.gte('column', 10)

// Less than
.lt('column', 10)

// Less than or equal
.lte('column', 10)

// Pattern matching
.like('column', '%pattern%')
.ilike('column', '%pattern%') // case insensitive

// IN
.in('column', ['value1', 'value2'])

// IS NULL
.is('column', null)

// Contains (arrays/JSONB)
.contains('column', { key: 'value' })

// Overlaps (arrays)
.overlaps('column', ['value1', 'value2'])

// Text search
.textSearch('column', 'search terms')

// Range (for range types)
.rangeGt('column', '[1,10)')
```

## Authentication

### Sign Up

```typescript
// Email/password
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// With metadata
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      first_name: 'John',
      age: 27
    }
  }
})
```

### Sign In

```typescript
// Email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Magic link
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com'
})

// OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
})

// Phone
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890'
})
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut()
```

### Get User

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Get Session

```typescript
const { data: { session } } = await supabase.auth.getSession()
```

### Auth State Changes

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
  // Events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, etc.
})
```

### Update User

```typescript
const { data, error } = await supabase.auth.updateUser({
  email: 'new@example.com',
  data: { username: 'newusername' }
})
```

### Password Reset

```typescript
// Send reset email
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com'
)

// Update password (after clicking reset link)
const { data, error } = await supabase.auth.updateUser({
  password: 'new_password'
})
```

## Storage

### Upload File

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file, {
    cacheControl: '3600',
    upsert: false
  })
```

### Download File

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .download('public/avatar1.png')
```

### List Files

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .list('public', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  })
```

### Get Public URL

```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar1.png')
```

### Create Signed URL

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .createSignedUrl('public/avatar1.png', 60) // 60 seconds
```

### Delete Files

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .remove(['public/avatar1.png', 'public/avatar2.png'])
```

### Move/Copy Files

```typescript
// Move
const { data, error } = await supabase.storage
  .from('avatars')
  .move('public/avatar1.png', 'private/avatar1.png')

// Copy
const { data, error } = await supabase.storage
  .from('avatars')
  .copy('public/avatar1.png', 'backup/avatar1.png')
```

## Realtime

### Subscribe to Changes

```typescript
const channel = supabase
  .channel('db-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE, or *
      schema: 'public',
      table: 'countries'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()

// Unsubscribe
channel.unsubscribe()
```

### Broadcast

```typescript
const channel = supabase.channel('room-1')

// Send message
channel.send({
  type: 'broadcast',
  event: 'cursor-pos',
  payload: { x: 100, y: 100 }
})

// Listen to messages
channel.on('broadcast', { event: 'cursor-pos' }, (payload) => {
  console.log('Cursor position:', payload)
})

channel.subscribe()
```

### Presence

```typescript
const channel = supabase.channel('room-1')

// Track presence
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  console.log('Online users:', state)
})

channel.on('presence', { event: 'join' }, ({ newPresences }) => {
  console.log('New users joined:', newPresences)
})

channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
  console.log('Users left:', leftPresences)
})

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({ user_id: 1, online_at: new Date().toISOString() })
  }
})
```

## Edge Functions

```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { name: 'Functions' }
})
```

## Middleware & Hooks

### Set Session

```typescript
// For SSR frameworks
await supabase.auth.setSession({
  access_token: session.access_token,
  refresh_token: session.refresh_token
})
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('countries')
  .select('*')

if (error) {
  console.error('Error:', error.message)
  // error.code, error.details, error.hint
}
```

## References

- npm: https://www.npmjs.com/package/@supabase/supabase-js
- GitHub: https://github.com/supabase/supabase-js
- Docs: https://supabase.com/docs/reference/javascript
