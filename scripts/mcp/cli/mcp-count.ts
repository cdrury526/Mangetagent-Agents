#!/usr/bin/env npx tsx

/**
 * MCP Count Shortcut
 *
 * Quick way to count rows in a table.
 *
 * Usage:
 *   npx tsx scripts/mcp/cli/mcp-count.ts <table>
 *   npm run mcp:count <table>
 *
 * Examples:
 *   npm run mcp:count transactions
 *   npm run mcp:count contacts
 */

import { getSupabaseConfig } from '../servers/supabase/config.js';

async function main(): Promise<void> {
  const table = process.argv[2];

  if (!table) {
    console.error('Usage: mcp:count <table>');
    console.error('Example: npm run mcp:count transactions');
    process.exit(1);
  }

  const config = getSupabaseConfig();
  if (!config) {
    console.error('Supabase configuration not found. Check .env file.');
    process.exit(1);
  }

  try {
    // Use run-sql for accurate count
    const query = `SELECT COUNT(*) as count FROM ${table}`;
    const url = `https://api.supabase.com/v1/projects/${config.projectRef}/database/query`;

    const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('SUPABASE_ACCESS_TOKEN required for count. Get it from Dashboard > Account > Access Tokens.');
      process.exit(1);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error: ${error.message || response.statusText}`);
      process.exit(1);
    }

    const result = await response.json();
    const count = result[0]?.count ?? 0;
    console.log(count);
  } catch (error) {
    console.error('Failed to count rows:', error);
    process.exit(1);
  }
}

main();
