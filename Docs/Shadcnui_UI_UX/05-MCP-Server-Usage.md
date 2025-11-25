# Shadcn UI - MCP Server Usage

## What is the Shadcn MCP Server?

The Shadcn Model Context Protocol (MCP) server is a **specialized tool that allows AI assistants** (like Claude, Cursor, Cline, Windsurf) to directly access, fetch, and work with Shadcn UI component source code, demos, and installation guides.

### What is MCP?

**Model Context Protocol (MCP)** is an open protocol that enables AI assistants to securely connect to external data sources and tools. It bridges the gap between AI models and specific data/functionality they need to assist you better.

### Why Use the Shadcn MCP Server?

- ✅ **Accurate Component Code**: AI gets the latest component source directly from the official repository
- ✅ **Proper Installation**: AI knows exactly how to add components to your project
- ✅ **Usage Examples**: Access to real demos and best practices
- ✅ **Framework-Specific Guidance**: Instructions tailored to your setup (Next.js, Vite, etc.)
- ✅ **Registry Support**: Access multiple component registries
- ✅ **No Hallucination**: AI works with real code, not memory

## Installation

### For Claude Code (Desktop)

```bash
# Add the Shadcn MCP server
npx shadcn@latest mcp add
```

Or manually add to your MCP config:
```bash
claude mcp add shadcn https://ui.shadcn.com/mcp
```

### For Cursor

Add to `~/.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "shadcn-ui": {
      "command": "npx",
      "args": ["-y", "@jpisnice/shadcn-ui-mcp-server"]
    }
  }
}
```

Or using the official server:
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "shadcn", "mcp", "start"]
    }
  }
}
```

### For Windsurf (Codeium)

Add to `~/.codeium/windsurf/model_config.json`:

```json
{
  "mcpServers": {
    "shadcn-ui": {
      "command": "npx",
      "args": ["-y", "shadcn-ui-mcp-server"]
    }
  }
}
```

### For Cline (VS Code)

Add to Cline's MCP settings:

```json
{
  "mcpServers": {
    "shadcn-ui": {
      "command": "npx",
      "args": ["-y", "@jpisnice/shadcn-ui-mcp-server"]
    }
  }
}
```

### For Zed Editor

Add to Zed's MCP config:

```json
{
  "context_servers": {
    "shadcn-ui": {
      "command": "npx",
      "args": ["-y", "shadcn-ui-mcp-server"]
    }
  }
}
```

## Available MCP Servers

### 1. Official Shadcn MCP Server
```bash
npx shadcn@latest mcp start
```

**Features**:
- Access to official Shadcn registry
- Multi-registry support
- Framework-specific guidance
- Example lookups

**Tools**:
- `get_project_registries` - Get configured registries
- `list_items_in_registries` - List available components
- `search_items_in_registries` - Search for components
- `view_items_in_registries` - View component details
- `get_item_examples_from_registries` - Get usage examples
- `get_add_command_for_items` - Get CLI commands

### 2. Community MCP Servers

**@jpisnice/shadcn-ui-mcp-server**:
```bash
npx @jpisnice/shadcn-ui-mcp-server
```

Features:
- Support for React, Vue, Svelte, React Native
- GitHub API integration (higher rate limits with token)
- Comprehensive component metadata

**@heilgar/shadcn-ui-mcp-server**:
```bash
npx @heilgar/shadcn-ui-mcp-server
```

Features:
- Component listing
- Documentation access
- Installation guides

## MCP Tools Reference

### get_project_registries

Get configured registry names from your `components.json`.

**Usage**:
```
Ask AI: "What registries are configured in my project?"
```

**Returns**:
- List of registry names (e.g., `@shadcn`, `@acme`)
- Error if no `components.json` exists

### list_items_in_registries

List all available components from specified registries.

**Parameters**:
- `registries`: Array of registry names
- `limit`: Maximum items to return (optional)
- `offset`: Pagination offset (optional)

**Usage**:
```
Ask AI: "List all components from @shadcn registry"
Ask AI: "Show me the first 10 components"
```

### search_items_in_registries

Search for components using fuzzy matching.

**Parameters**:
- `registries`: Array of registry names
- `query`: Search string
- `limit`: Maximum results (optional)

**Usage**:
```
Ask AI: "Search for button components"
Ask AI: "Find card-related components"
Ask AI: "Search for form components"
```

### view_items_in_registries

View detailed information about specific components.

**Parameters**:
- `items`: Array of component names with registry prefix (e.g., `@shadcn/button`)

**Usage**:
```
Ask AI: "Show me details for @shadcn/button"
Ask AI: "View the dialog component"
```

**Returns**:
- Component name
- Description
- Type (component/ui/block)
- File contents
- Dependencies

### get_item_examples_from_registries

Find usage examples and demos for components.

**Parameters**:
- `registries`: Array of registry names
- `query`: Example search query

**Usage**:
```
Ask AI: "Show me button examples"
Ask AI: "Find accordion-demo"
Ask AI: "Get card usage examples"
```

**Common patterns**:
- `{component}-demo` (e.g., "button-demo")
- `{component} example` (e.g., "button example")
- `example-{feature}` (e.g., "example-booking-form")

### get_add_command_for_items

Get the CLI command to add components.

**Parameters**:
- `items`: Array of component names with registry prefix

**Usage**:
```
Ask AI: "How do I add button and dialog?"
Ask AI: "Give me the command to install card component"
```

**Returns**:
```bash
npx shadcn@latest add button dialog
```

### get_audit_checklist

Get a checklist to verify component setup.

**Usage**:
```
Ask AI: "Give me an audit checklist for my components"
```

## Practical Usage Examples

### Example 1: Adding a New Component

**User**: "I need a dialog component"

**AI with MCP**:
1. Searches for dialog in registry
2. Views component details
3. Gets usage examples
4. Provides installation command
5. Shows implementation code

```bash
# AI provides:
npx shadcn@latest add dialog

# Along with usage example:
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <p>Dialog content</p>
  </DialogContent>
</Dialog>
```

### Example 2: Finding the Right Component

**User**: "How do I create a dropdown menu?"

**AI with MCP**:
1. Searches registry for "dropdown" or "menu"
2. Finds `dropdown-menu` component
3. Shows examples
4. Explains usage

### Example 3: Building a Form

**User**: "Create a login form with email and password"

**AI with MCP**:
1. Searches for form-related components
2. Identifies: `form`, `input`, `button`, `label`
3. Gets examples for each
4. Composes a complete form with proper validation

```tsx
// AI generates with proper component knowledge:
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form"

// Complete implementation...
```

### Example 4: Checking Installation

**User**: "What Shadcn components do I have installed?"

**AI with MCP**:
1. Checks `components/ui/` directory
2. Lists installed components
3. Suggests related components you might need

### Example 5: Finding Examples

**User**: "Show me examples of using tabs"

**AI with MCP**:
1. Uses `get_item_examples_from_registries` with query "tabs-demo"
2. Returns complete demo code
3. Explains each part

## Advanced Configuration

### Multi-Registry Setup

Configure multiple registries in `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "registries": [
    {
      "name": "@shadcn",
      "url": "https://ui.shadcn.com/r"
    },
    {
      "name": "@acme",
      "url": "https://acme.com/r"
    }
  ]
}
```

Now AI can access components from both registries:
```
Ask AI: "Search for buttons in both @shadcn and @acme registries"
```

### GitHub API Token (Recommended)

For higher rate limits, configure a GitHub token:

```bash
# With token (5000 requests/hour)
npx @jpisnice/shadcn-ui-mcp-server --github-api-key ghp_your_token_here

# Without token (60 requests/hour)
npx @jpisnice/shadcn-ui-mcp-server
```

Create a token at: [github.com/settings/tokens](https://github.com/settings/tokens)

Required scope: `public_repo` (read access to public repositories)

### Framework-Specific Configuration

Tell the AI which framework you're using:

```bash
# For Svelte
npx @jpisnice/shadcn-ui-mcp-server --framework svelte

# For Vue
npx @jpisnice/shadcn-ui-mcp-server --framework vue

# For React Native
npx @jpisnice/shadcn-ui-mcp-server --framework react-native
```

## Debugging MCP

### Check MCP Connection

In Claude Code:
```bash
/mcp
```

This shows:
- Connected MCP servers
- Available tools
- Connection status

### View Logs

**Cursor**: View → Output → Select "MCP: project-*"

**VS Code (Cline)**: Check Cline output panel

**Claude Desktop**: Check `~/Library/Logs/Claude/mcp-*.log`

### Common Issues

**Issue**: MCP server not connecting

**Solution**:
1. Restart your IDE
2. Check MCP config file syntax
3. Verify `npx` can run the command
4. Check internet connection (needs to fetch from npm)

**Issue**: Rate limit errors

**Solution**:
Add GitHub token (see above)

**Issue**: Components not found

**Solution**:
1. Ensure `components.json` exists
2. Check registry configuration
3. Verify component name is correct

## Best Practices with MCP

### 1. Be Specific in Requests
✅ **Good**: "Add a dialog component with a form inside"
❌ **Bad**: "I need a popup"

### 2. Reference Examples
✅ **Good**: "Show me the button-demo example"
❌ **Bad**: "How do buttons work?"

### 3. Ask for Installation Commands
✅ **Good**: "What's the command to add button and dialog?"
❌ **Bad**: Let AI guess the command

### 4. Verify Component Details
✅ **Good**: "Show me the details of the select component"
❌ **Bad**: Assume AI remembers all props

### 5. Use Audit Checklist
After adding components:
```
Ask AI: "Give me an audit checklist for the components I just added"
```

## MCP Server Capabilities

### What MCP Enables

- ✅ Direct access to official component source
- ✅ Real-time component searches
- ✅ Accurate installation commands
- ✅ Usage examples with full code
- ✅ Multi-registry support
- ✅ Framework-specific guidance

### What MCP Doesn't Do

- ❌ Doesn't install components for you (provides commands)
- ❌ Doesn't modify your code directly
- ❌ Doesn't replace the Shadcn CLI
- ❌ Doesn't provide runtime component instances

## Prompts for Working with MCP

### Discovery Prompts
```
"What Shadcn components are available?"
"Search for form-related components"
"Find components for building a dashboard"
"List all navigation components"
```

### Implementation Prompts
```
"Add a dialog component and show me how to use it"
"Create a form with input and button components"
"Build a data table using Shadcn components"
"Show me how to implement a sidebar"
```

### Learning Prompts
```
"Show me examples of using the accordion component"
"What are all the button variants available?"
"How do I customize the card component?"
"Explain the select component props"
```

### Debugging Prompts
```
"Why isn't my dialog component working?"
"Check if I have the required dependencies for the form component"
"Compare my button usage with the example"
```

## Resources

- [Official MCP Documentation](https://ui.shadcn.com/docs/mcp)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Shadcn MCP Server Repository](https://github.com/shadcn-ui/ui)
- [MCP Servers Directory](https://mcpservers.org)

## Next Steps

- [Building Forms with Shadcn](./07-Building-Forms.md)
- [Component Patterns](./04-Common-Components.md)
- [AI-Assisted Development](./10-AI-Development-Workflow.md)
