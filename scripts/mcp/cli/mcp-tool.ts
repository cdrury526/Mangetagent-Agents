#!/usr/bin/env npx tsx

/**
 * MCP Tool CLI
 *
 * Main entry point for CLI-based MCP tool interaction.
 * Claude Code can use this to discover and execute MCP tools.
 *
 * Usage:
 *   npx tsx scripts/mcp/cli/mcp-tool.ts list-servers
 *   npx tsx scripts/mcp/cli/mcp-tool.ts list-tools <server>
 *   npx tsx scripts/mcp/cli/mcp-tool.ts describe <server> <tool>
 *   npx tsx scripts/mcp/cli/mcp-tool.ts run <server> <tool> [input-json]
 *   npx tsx scripts/mcp/cli/mcp-tool.ts search <query>
 *   npx tsx scripts/mcp/cli/mcp-tool.ts stats
 *
 * Flags:
 *   --quiet          Output only data without metadata wrapper
 *   --input-file     Read JSON input from file instead of command line
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  listServers,
  getServerManifest,
  listTools,
  getToolDefinition,
  searchTools,
  getRegistryStats,
  formatServerInfo,
  formatToolInfo,
} from '../core/discovery.js';
import { kebabToCamel } from '../types/index.js';

/**
 * Parse CLI flags from arguments
 */
interface CLIFlags {
  quiet: boolean;
  inputFile: string | null;
}

function parseFlags(argv: string[]): { flags: CLIFlags; args: string[] } {
  const flags: CLIFlags = {
    quiet: false,
    inputFile: null,
  };
  const filteredArgs: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--quiet' || arg === '-q') {
      flags.quiet = true;
    } else if (arg === '--input-file' || arg === '-f') {
      flags.inputFile = argv[++i] || null;
    } else if (arg.startsWith('--input-file=')) {
      flags.inputFile = arg.split('=')[1];
    } else {
      filteredArgs.push(arg);
    }
  }

  return { flags, args: filteredArgs };
}

// Parse command line arguments and flags
const rawArgs = process.argv.slice(2);
const { flags: cliFlags, args: parsedArgs } = parseFlags(rawArgs);
const [command, ...args] = parsedArgs;

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
MCP Tool CLI - Claude Code MCP Bridge
=====================================

Usage:
  npx tsx scripts/mcp/cli/mcp-tool.ts <command> [options] [flags]

Commands:
  list-servers              List all available MCP servers
  list-tools <server>       List all tools for a specific server
  describe <server> <tool>  Show detailed tool definition
  run <server> <tool> [json] Execute a tool with optional JSON input
  search <query>            Search for tools by name/description/tags
  stats                     Show registry statistics

Flags:
  --quiet, -q               Output only data without metadata wrapper
  --input-file, -f <path>   Read JSON input from file (useful for Windows)

Examples:
  # List all servers
  mcp-tool list-servers

  # List Supabase tools
  mcp-tool list-tools supabase

  # Get tool details
  mcp-tool describe supabase list-tables

  # Run a tool
  mcp-tool run supabase list-tables '{"schemas":["public"]}'

  # Run with quiet output (data only)
  mcp-tool run supabase list-users '{}' --quiet

  # Run with input from file (Windows-friendly)
  mcp-tool run supabase run-sql --input-file query.json

  # Search for database tools
  mcp-tool search database

Environment Variables:
  SUPABASE_PROJECT_REF     Supabase project reference (for API calls)
  SUPABASE_ACCESS_TOKEN    Supabase access token (for API calls)
`);
}

/**
 * Main CLI handler
 */
async function main(): Promise<void> {
  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  switch (command) {
    case 'list-servers': {
      const servers = listServers();
      if (servers.length === 0) {
        console.log('No servers found. Run `npm run mcp:registry` first.');
        return;
      }

      console.log('Available MCP Servers');
      console.log('='.repeat(50));

      for (const serverName of servers) {
        const manifest = getServerManifest(serverName);
        if (manifest) {
          console.log('\n' + formatServerInfo(manifest));
        }
      }
      break;
    }

    case 'list-tools': {
      const [serverName] = args;
      if (!serverName) {
        console.error('Usage: mcp-tool list-tools <server-name>');
        console.error('Example: mcp-tool list-tools supabase');
        process.exit(1);
      }

      const tools = listTools(serverName);
      if (tools.length === 0) {
        console.error(`No tools found for server: ${serverName}`);
        console.error('Available servers:', listServers().join(', '));
        process.exit(1);
      }

      const manifest = getServerManifest(serverName);
      console.log(`Tools for ${serverName} (${manifest?.description || ''})`);
      console.log('='.repeat(50));

      for (const tool of tools) {
        console.log(`\n${tool.name}`);
        console.log(`  ${tool.description}`);
        console.log(`  MCP: ${tool.mcpName}`);
        console.log(`  Tags: ${tool.tags.join(', ')}`);
      }
      break;
    }

    case 'describe': {
      const [serverName, toolName] = args;
      if (!serverName || !toolName) {
        console.error('Usage: mcp-tool describe <server-name> <tool-name>');
        console.error('Example: mcp-tool describe supabase list-tables');
        process.exit(1);
      }

      const tool = getToolDefinition(serverName, toolName);
      if (!tool) {
        console.error(`Tool not found: ${serverName}/${toolName}`);
        const availableTools = listTools(serverName);
        if (availableTools.length > 0) {
          console.error(
            'Available tools:',
            availableTools.map((t) => t.name).join(', ')
          );
        }
        process.exit(1);
      }

      console.log(formatToolInfo(serverName, tool));

      if (tool.examples?.length) {
        console.log('\nExamples:');
        for (const example of tool.examples) {
          console.log(`  ${example.description}`);
          console.log(`    Input: ${JSON.stringify(example.input)}`);
          if (example.expectedOutput) {
            console.log(`    Output: ${example.expectedOutput}`);
          }
        }
      }
      break;
    }

    case 'run': {
      const [serverName, toolName, inputJson] = args;
      if (!serverName || !toolName) {
        console.error('Usage: mcp-tool run <server-name> <tool-name> [input-json]');
        console.error(
          'Example: mcp-tool run supabase list-tables \'{"schemas":["public"]}\''
        );
        console.error('Flags: --quiet (data only), --input-file <path>');
        process.exit(1);
      }

      // Verify tool exists
      const toolDef = getToolDefinition(serverName, toolName);
      if (!toolDef) {
        console.error(`Tool not found: ${serverName}/${toolName}`);
        process.exit(1);
      }

      // Parse input - from file or command line
      let input: Record<string, unknown> = {};

      if (cliFlags.inputFile) {
        // Read input from file
        try {
          const filePath = path.resolve(process.cwd(), cliFlags.inputFile);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          input = JSON.parse(fileContent);
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
            console.error(`Input file not found: ${cliFlags.inputFile}`);
          } else if (e instanceof SyntaxError) {
            console.error(`Invalid JSON in input file: ${cliFlags.inputFile}`);
          } else {
            console.error(`Error reading input file: ${e}`);
          }
          process.exit(1);
        }
      } else if (inputJson) {
        // Parse from command line argument
        try {
          input = JSON.parse(inputJson);
        } catch (e) {
          console.error(`Invalid JSON input: ${inputJson}`);
          process.exit(1);
        }
      }

      // Dynamic import of the server module
      try {
        const serverModule = await import(`../servers/${serverName}/index.js`);

        // Convert tool name to function name (list-tables -> listTables)
        const fnName = kebabToCamel(toolName);
        const toolFn = serverModule[fnName];

        if (!toolFn || typeof toolFn !== 'function') {
          console.error(`Tool function not found: ${fnName}`);
          console.error('Available exports:', Object.keys(serverModule).join(', '));
          process.exit(1);
        }

        // Execute the tool
        if (!cliFlags.quiet) {
          console.log(`Executing ${serverName}/${toolName}...`);
        }
        const result = await toolFn(input);

        // Output result - quiet mode returns data only
        if (cliFlags.quiet) {
          // In quiet mode, output just the data (or error message)
          if (result.success && result.data !== undefined) {
            console.log(JSON.stringify(result.data, null, 2));
          } else if (!result.success && result.error) {
            console.error(JSON.stringify(result.error, null, 2));
            process.exit(1);
          } else {
            console.log('null');
          }
        } else {
          // Full output with metadata
          console.log(JSON.stringify(result, null, 2));
        }
      } catch (error) {
        console.error('Failed to execute tool:', error);
        process.exit(1);
      }
      break;
    }

    case 'search': {
      const [query] = args;
      if (!query) {
        console.error('Usage: mcp-tool search <query>');
        console.error('Example: mcp-tool search database');
        process.exit(1);
      }

      const results = searchTools(query);

      if (results.length === 0) {
        console.log(`No tools found matching: ${query}`);
        return;
      }

      console.log(`Found ${results.length} tools matching "${query}":`);
      console.log('='.repeat(50));

      for (const { server, tool } of results) {
        console.log(`\n${server}/${tool.name}`);
        console.log(`  ${tool.description}`);
        console.log(`  Tags: ${tool.tags.join(', ')}`);
      }
      break;
    }

    case 'stats': {
      const stats = getRegistryStats();

      console.log('MCP Bridge Registry Statistics');
      console.log('='.repeat(50));
      console.log(`Total Servers: ${stats.totalServers}`);
      console.log(`Total Tools: ${stats.totalTools}`);
      console.log(`Last Updated: ${stats.lastUpdated || 'Never'}`);
      console.log('\nTools by Server:');

      for (const [server, count] of Object.entries(stats.toolsByServer)) {
        console.log(`  ${server}: ${count} tools`);
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run with --help for usage information.');
      process.exit(1);
  }
}

// Run the CLI
main().catch((error) => {
  console.error('CLI Error:', error);
  process.exit(1);
});
