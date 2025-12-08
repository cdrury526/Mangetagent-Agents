#!/usr/bin/env npx tsx

/**
 * MCP Users Shortcut
 *
 * Quick way to list users.
 *
 * Usage:
 *   npx tsx scripts/mcp/cli/mcp-users.ts [--json]
 *   npm run mcp:users
 *
 * Flags:
 *   --json    Output raw JSON instead of formatted list
 */

import { listUsers } from '../servers/supabase/auth-admin.js';

async function main(): Promise<void> {
  const outputJson = process.argv.includes('--json');

  const result = await listUsers({ page: 1, per_page: 100 });

  if (!result.success) {
    console.error('Error:', result.error?.message || 'Unknown error');
    process.exit(1);
  }

  const users = result.data?.users || [];

  if (outputJson) {
    console.log(JSON.stringify(users, null, 2));
    return;
  }

  // Formatted output
  if (users.length === 0) {
    console.log('No users found.');
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);

  for (const user of users) {
    const name = user.user_metadata?.full_name || user.email;
    const role = user.user_metadata?.role || 'user';
    const confirmed = user.email_confirmed_at ? '✓' : '✗';
    const lastSignIn = user.last_sign_in_at
      ? new Date(user.last_sign_in_at).toLocaleDateString()
      : 'Never';

    console.log(`${confirmed} ${name}`);
    console.log(`    Email: ${user.email}`);
    console.log(`    Role: ${role}`);
    console.log(`    Last sign in: ${lastSignIn}`);
    console.log(`    ID: ${user.id}`);
    console.log();
  }
}

main();
