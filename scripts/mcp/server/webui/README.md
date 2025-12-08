# MCP Bridge WebUI Dashboard

A modern, single-page web dashboard for monitoring and interacting with the MCP Unified Server.

## Features

- **Real-time Server Status**: View uptime, version, server count, and tool count
- **Server & Tool Browser**: Browse all available servers and their tools with search functionality
- **Tool Details**: View detailed information about each tool including:
  - Input schema
  - Examples
  - Tags and metadata
- **Tool Execution**: Execute tools directly from the browser with JSON input
- **Execution History**: View past executions with status, duration, and results
- **Auto-refresh**: Health and history data refreshes automatically

## Access

Once the MCP server is running:

```bash
npm run mcp:server
```

Open your browser to: **http://localhost:3456/ui**

## UI Layout

### Header
- Server name and status indicator (green = healthy)
- Real-time metrics: uptime, version, server count, tool count

### Main Panels (3-column layout)

**Left Panel: Server & Tool Browser**
- Search box to filter tools
- Expandable list of servers
- Click a server to view its tools
- Click a tool to view details

**Center Panel: Tool Details**
- Tool name and description
- Input schema (JSON)
- Example inputs
- Server and tags

**Right Panel: Execute Tool**
- JSON input editor
- Execute button
- Result display with syntax highlighting
- Success/error status indicators

### Bottom Panel: Execution History
- Table of recent executions
- Columns: Time, Server, Tool, Status, Duration
- Click a row to view full result
- Clear history button

## Dark Theme

The dashboard uses a modern dark theme optimized for readability:
- Background: Slate 900 (#0f172a)
- Panels: Slate 800 (#1e293b)
- Text: Slate 200 (#e2e8f0)
- Accent: Blue 500 (#3b82f6)
- Success: Green 500 (#22c55e)
- Error: Red 500 (#ef4444)

## Technology

Built with vanilla HTML, CSS, and JavaScript (no build process required):
- **Pure JavaScript**: No frameworks or dependencies
- **Fetch API**: For REST API communication
- **CSS Grid**: For responsive layout
- **CSS Variables**: For theming
- **Modern ES6+**: Async/await, template literals, etc.

## API Endpoints Used

The dashboard consumes these MCP server endpoints:

```
GET  /mcp/health                           → Server health check
GET  /mcp/stats                            → Registry statistics
GET  /mcp/servers                          → List all servers
GET  /mcp/servers/:server                  → Get server manifest
GET  /mcp/servers/:server/tools/:tool      → Get tool details
POST /mcp/servers/:server/tools/:tool/run  → Execute a tool
GET  /mcp/history                          → Get execution history
```

## Auto-refresh Intervals

- **Health data**: Every 5 seconds
- **Execution history**: Every 10 seconds

## Features in Detail

### Search & Filter
Type in the search box to filter tools by name or tags. The UI automatically expands matching servers.

### Tool Execution
1. Select a tool from the browser
2. Input area auto-fills with example (if available)
3. Modify JSON input as needed
4. Click "Execute" button
5. View result with syntax highlighting
6. Success/error status clearly indicated

### Execution History
- Most recent executions shown at top
- Click any row to view full result
- Status badges: Green for success, Red for error
- Duration shown in milliseconds
- Clear history button to reset

## Browser Compatibility

Modern browsers with ES6+ support:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

```
webui/
├── index.html       # Complete single-page application
└── README.md        # This file
```

## Customization

All styling is embedded in the `<style>` tag. Key CSS variables:

```css
/* Colors */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--text-primary: #e2e8f0;
--text-secondary: #94a3b8;
--accent: #3b82f6;
--success: #22c55e;
--error: #ef4444;
--border: #334155;
```

## Development

To modify the dashboard:

1. Edit `scripts/mcp/server/webui/index.html`
2. Save (no build process needed)
3. Refresh browser (Cmd/Ctrl + R)
4. Changes appear immediately

## Troubleshooting

**Dashboard won't load:**
- Check that MCP server is running: `npm run mcp:server`
- Verify port 3456 is not in use by another process
- Check browser console for errors

**Tools not appearing:**
- Ensure registry is up to date: `npm run mcp:registry`
- Restart the server
- Check `/mcp/stats` endpoint for tool count

**Execution fails:**
- Verify JSON input is valid
- Check tool input schema requirements
- View error message in result display

**Auto-refresh not working:**
- Check browser console for network errors
- Ensure server is still running
- Try manual refresh (reload page)

## Future Enhancements

Potential improvements:
- [ ] Log viewer panel
- [ ] Tool favorites/bookmarks
- [ ] Export execution history
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] WebSocket support for real-time updates
- [ ] Tool input validation
- [ ] Batch tool execution
- [ ] Save/load input templates
