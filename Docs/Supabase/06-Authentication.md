# Supabase Authentication

Comprehensive authentication solution with support for email/password, OAuth, magic links, phone authentication, and more.

## Installation

```bash
npm install @supabase/supabase-js
```

## Basic Setup

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)
```

## Sign Up

### Email & Password

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
})
```

### With User Metadata

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      age: 27
    },
    emailRedirectTo: 'https://your-app.com/welcome'
  }
})
```

### Phone Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  phone: '+1234567890',
  password: 'secure-password'
})
```

## Sign In

### Email & Password

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})
```

### Magic Link (Passwordless)

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://your-app.com/auth/callback'
  }
})
```

### Phone OTP

```typescript
// Send OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890'
})

// Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456',
  type: 'sms'
})
```

### OAuth Providers

```typescript
// Redirect to OAuth provider
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://your-app.com/auth/callback',
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
})
```

#### Supported Providers

- Google
- GitHub
- GitLab
- Bitbucket
- Azure
- Facebook
- Twitter
- Discord
- Twitch
- LinkedIn
- Spotify
- Slack
- Apple
- And more...

### SSO / SAML

```typescript
const { data, error } = await supabase.auth.signInWithSSO({
  domain: 'company.com'
})

// Or with provider ID
const { data, error } = await supabase.auth.signInWithSSO({
  providerId: 'your-saml-provider-id'
})
```

## Sign Out

```typescript
const { error } = await supabase.auth.signOut()
```

### Sign Out from All Sessions

```typescript
const { error } = await supabase.auth.signOut({ scope: 'global' })
```

## Session Management

### Get Current Session

```typescript
const { data: { session }, error } = await supabase.auth.getSession()
```

### Get Current User

```typescript
const { data: { user }, error } = await supabase.auth.getUser()
```

### Set Session (for SSR)

```typescript
await supabase.auth.setSession({
  access_token: session.access_token,
  refresh_token: session.refresh_token
})
```

### Refresh Session

```typescript
const { data, error } = await supabase.auth.refreshSession()
```

## Auth State Changes

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth event:', event)
    console.log('Session:', session)
  }
)

// Events:
// - SIGNED_IN
// - SIGNED_OUT
// - TOKEN_REFRESHED
// - USER_UPDATED
// - PASSWORD_RECOVERY

// Unsubscribe
subscription.unsubscribe()
```

## User Management

### Update User

```typescript
// Update email
const { data, error } = await supabase.auth.updateUser({
  email: 'new@example.com'
})

// Update password
const { data, error } = await supabase.auth.updateUser({
  password: 'new-password'
})

// Update metadata
const { data, error } = await supabase.auth.updateUser({
  data: {
    first_name: 'Jane',
    display_name: 'Jane Doe'
  }
})
```

### Update Phone

```typescript
const { data, error } = await supabase.auth.updateUser({
  phone: '+19876543210'
})
```

## Password Reset

### Request Password Reset

```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://your-app.com/update-password'
  }
)
```

### Update Password (After Reset Link)

```typescript
// After user clicks reset link and is redirected
const { data, error } = await supabase.auth.updateUser({
  password: 'new-secure-password'
})
```

## Email Verification

### Resend Verification Email

```typescript
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://your-app.com/confirm'
  }
})
```

### Verify OTP

```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: 'user@example.com',
  token: '123456',
  type: 'email'
})
```

## Multi-Factor Authentication (MFA)

### Enroll MFA

```typescript
// Get factors
const { data: { factors } } = await supabase.auth.mfa.listFactors()

// Enroll new factor
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'My Authenticator App'
})

// data.totp.qr_code - QR code for authenticator app
// data.totp.secret - Secret for manual entry
// data.totp.uri - URI for authenticator apps
```

### Verify MFA

```typescript
const { data, error } = await supabase.auth.mfa.challengeAndVerify({
  factorId: 'factor-id',
  code: '123456'
})
```

### Unenroll MFA

```typescript
const { data, error } = await supabase.auth.mfa.unenroll({
  factorId: 'factor-id'
})
```

## Admin Functions (Service Role Required)

Use server-side with service role key:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-service-role-key' // WARNING: Never expose this client-side
)
```

### List Users

```typescript
const { data: { users }, error } = await supabase.auth.admin.listUsers()

// With pagination
const { data: { users }, error } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 10
})
```

### Get User by ID

```typescript
const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)
```

### Create User

```typescript
const { data: { user }, error } = await supabase.auth.admin.createUser({
  email: 'user@example.com',
  password: 'password',
  email_confirm: true,
  user_metadata: {
    first_name: 'John'
  }
})
```

### Update User

```typescript
const { data: { user }, error } = await supabase.auth.admin.updateUserById(
  userId,
  {
    email: 'new@example.com',
    user_metadata: { role: 'admin' }
  }
)
```

### Delete User

```typescript
const { data, error } = await supabase.auth.admin.deleteUser(userId)
```

### Invite User

```typescript
const { data: { user }, error } = await supabase.auth.admin.inviteUserByEmail(
  'user@example.com',
  {
    redirectTo: 'https://your-app.com/welcome',
    data: { role: 'member' }
  }
)
```

### Generate Link

```typescript
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'signup',
  email: 'user@example.com',
  password: 'password',
  options: {
    redirectTo: 'https://your-app.com/welcome'
  }
})

// Types: signup, invite, magiclink, recovery, email_change_current, email_change_new
```

## Row Level Security (RLS) Integration

Access user ID in PostgreSQL policies:

```sql
-- Example: Users can only see their own data
create policy "Users can view own data"
  on profiles for select
  using (auth.uid() = user_id);

-- Check if user is authenticated
create policy "Authenticated users only"
  on posts for all
  using (auth.role() = 'authenticated');

-- Check user metadata
create policy "Admin users only"
  on admin_panel for all
  using (
    auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );
```

## Email Templates

Customize email templates in Dashboard > Authentication > Email Templates:

- Confirmation email
- Magic link email
- Password reset email
- Email change confirmation

## Configuration

### Auth Settings (Dashboard)

- Enable/disable email confirmations
- Enable/disable email change confirmations
- Set JWT expiry time
- Configure redirect URLs
- Set up OAuth providers
- Configure SMTP settings

### Site URL

Set your site URL for OAuth redirects:

```bash
# Dashboard > Authentication > URL Configuration
Site URL: https://your-app.com
Redirect URLs: https://your-app.com/**, https://localhost:3000/**
```

## Security Best Practices

1. **Never expose service role key** client-side
2. **Use RLS policies** to secure data access
3. **Validate redirectTo URLs** - whitelist in dashboard
4. **Use HTTPS** in production
5. **Store tokens securely** - HttpOnly cookies for SSR
6. **Implement PKCE** for mobile apps
7. **Use MFA** for sensitive operations
8. **Rotate secrets** regularly

## Server-Side Rendering (SSR)

For Next.js, SvelteKit, etc., use `@supabase/ssr`:

```bash
npm install @supabase/ssr
```

### Next.js Example

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

## References

- Auth Docs: https://supabase.com/docs/guides/auth
- GitHub: https://github.com/supabase/supabase-js/tree/master/packages/core/auth-js
- Auth Helpers: https://supabase.com/docs/guides/auth/auth-helpers
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
