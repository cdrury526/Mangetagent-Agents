# Gemini CLI Quick Reference

## Command Pattern

```bash
cd /Users/chrisdrury/development/outlook-manager/mcp-bridge
npx tsx call.ts gemini <tool> '<json-args>'
```

## Auto-Routing (Recommended)

Use a simple name for `outputDir` and files auto-route to the correct folder:

```bash
# Instead of absolute paths...
npx tsx call.ts gemini create_wireframe '{"description":"...","outputDir":"/full/path/to/folder"}'

# Just use a name - it auto-routes!
npx tsx call.ts gemini create_wireframe '{"description":"...","outputDir":"login-form"}'
# → Creates: /Gemini-Creations/wireframes/login-form/wireframe.html
```

### Auto-Routing Map

| Tool | Framework | Output Directory |
|------|-----------|------------------|
| `create_wireframe` | - | `Gemini-Creations/wireframes/{name}/` |
| `create_component` | react | `Gemini-Creations/components/react/{name}/` |
| `create_component` | vue | `Gemini-Creations/components/vue/{name}/` |
| `create_component` | svelte | `Gemini-Creations/components/svelte/{name}/` |
| `design_page` | html | `Gemini-Creations/pages/html/{name}/` |
| `design_page` | react | `Gemini-Creations/pages/react/{name}/` |
| `design_page` | vue | `Gemini-Creations/pages/vue/{name}/` |
| `design_page` | svelte | `Gemini-Creations/pages/svelte/{name}/` |
| `create_styles` | - | `Gemini-Creations/styles/{name}/` |
| `refine_design` | - | `Gemini-Creations/refined/{name}/` |

**Note**: Absolute paths (starting with `/`) bypass auto-routing.

---

## Tools at a Glance

### Design Tools

| Tool | Purpose | Key Args |
|------|---------|----------|
| `create_wireframe` | HTML/CSS wireframe | `description`, `outputDir` |
| `create_component` | React/Vue/Svelte component | `description`, `outputDir`, `framework`, `styling` |
| `design_page` | Full page layout | `description`, `outputDir`, `framework`, `styling` |
| `refine_design` | Modify existing file | `filePath`, `feedback` |
| `create_styles` | CSS/Tailwind config | `description`, `outputDir`, `type` |
| `create_project` | Full project scaffolding | `description`, `projectName` |
| `iterate_project` | Improve existing project | `projectPath`, `focus` |
| `suggest_improvements` | UI/UX analysis (JSON) | `projectPath` |

### Development Tools

| Tool | Purpose | Key Args |
|------|---------|----------|
| `research_topic` | Web research with citations | `query` |
| `analyze_codebase` | Bulk code analysis (1M context) | `directory` |
| `generate_docs` | Documentation from code | `targetPath`, `docType`, `outputDir` |
| `get_second_opinion` | Alternative AI perspective | `context`, `question` |

---

## create_wireframe

Generate HTML/CSS wireframe from description.

```bash
npx tsx call.ts gemini create_wireframe '{
  "description": "Login form with email, password, submit button, forgot password link",
  "outputDir": "/tmp/ui",
  "filename": "login.html",
  "style": "detailed",
  "responsive": true
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `description` | Yes | - | - |
| `outputDir` | Yes | - | - |
| `filename` | No | - | `wireframe.html` |
| `style` | No | `minimal`, `detailed`, `skeleton` | `detailed` |
| `responsive` | No | `true`, `false` | `true` |

---

## create_component

Generate framework component with styling.

```bash
npx tsx call.ts gemini create_component '{
  "description": "Button with variants: primary, secondary, outline. Sizes: sm, md, lg",
  "outputDir": "/tmp/components",
  "filename": "Button.tsx",
  "framework": "react",
  "styling": "tailwind",
  "typescript": true,
  "includeTests": false
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `description` | Yes | - | - |
| `outputDir` | Yes | - | - |
| `filename` | No | - | `Component.tsx` |
| `framework` | Yes | `react`, `vue`, `svelte` | - |
| `styling` | Yes | `tailwind`, `css-modules`, `styled-components`, `inline` | - |
| `typescript` | No | `true`, `false` | `true` |
| `includeTests` | No | `true`, `false` | `false` |

---

## design_page

Generate complete page with multiple sections.

```bash
npx tsx call.ts gemini design_page '{
  "description": "SaaS landing page with hero, features, pricing, testimonials, footer",
  "outputDir": "/tmp/landing",
  "pageName": "landing",
  "framework": "react",
  "styling": "tailwind",
  "sections": ["hero", "features", "pricing", "testimonials", "footer"]
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `description` | Yes | - | - |
| `outputDir` | Yes | - | - |
| `pageName` | No | - | `page` |
| `framework` | Yes | `html`, `react`, `vue`, `svelte` | - |
| `styling` | Yes | `tailwind`, `css`, `css-modules` | - |
| `sections` | No | Array of strings | - |

---

## refine_design

Modify existing file based on feedback.

```bash
npx tsx call.ts gemini refine_design '{
  "filePath": "/tmp/ui/login.html",
  "feedback": "Add a remember me checkbox and social login buttons for Google and GitHub",
  "outputDir": "/tmp/ui"
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `filePath` | Yes | - | - |
| `feedback` | Yes | - | - |
| `outputDir` | No | - | Same as filePath dir |

---

## create_styles

Generate CSS or Tailwind configuration.

```bash
npx tsx call.ts gemini create_styles '{
  "description": "Modern dark theme with purple accents, clean typography",
  "outputDir": "/tmp/styles",
  "type": "css-variables",
  "theme": {
    "colors": {"primary": "#8b5cf6", "background": "#0f0f0f"},
    "fonts": ["Inter", "JetBrains Mono"],
    "spacing": "4px base"
  }
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `description` | Yes | - | - |
| `outputDir` | Yes | - | - |
| `type` | Yes | `css`, `tailwind-config`, `css-variables` | - |
| `theme` | No | Object with colors/fonts/spacing | - |

---

## Output Format

All tools return JSON:

```json
{
  "success": true,
  "response": "Gemini's description of what was created",
  "files": ["/path/to/created/file.html"],
  "stats": {
    "models": { ... },
    "tools": { "write_file": { "count": 1 } },
    "files": { "totalLinesAdded": 150 }
  }
}
```

---

## Discovery Commands

```bash
# List all tools
npx tsx call.ts gemini --list-tools

# Show help
npx tsx call.ts --help
```

---

## Development Tools

### research_topic

Research a topic with web search and synthesis.

```bash
npx tsx call.ts gemini research_topic '{
  "query": "n8n webhook security best practices",
  "focusAreas": ["authentication", "validation"],
  "outputFormat": "detailed",
  "maxSources": 5
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `query` | Yes | - | - |
| `focusAreas` | No | Array of strings | - |
| `sources` | No | `web`, `docs`, `both` | `both` |
| `outputFormat` | No | `summary`, `detailed`, `bullet-points` | `detailed` |
| `maxSources` | No | Number | `5` |

---

### analyze_codebase

Analyze a codebase using Gemini's 1M token context.

```bash
npx tsx call.ts gemini analyze_codebase '{
  "directory": "/path/to/project",
  "focus": "architecture",
  "depth": "medium",
  "questions": ["How does authentication work?", "What patterns are used?"]
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `directory` | Yes | Absolute path | - |
| `questions` | No | Array of strings | - |
| `focus` | No | `architecture`, `dependencies`, `patterns`, `issues`, `all` | `all` |
| `depth` | No | `shallow`, `medium`, `deep` | `medium` |
| `filePatterns` | No | Array of globs | `["*.ts", "*.tsx", "*.js"]` |
| `excludePatterns` | No | Array of globs | `["node_modules", "dist"]` |

---

### generate_docs

Generate documentation from source code.

```bash
npx tsx call.ts gemini generate_docs '{
  "targetPath": "/path/to/src",
  "docType": "api",
  "outputDir": "./docs",
  "audience": "developer",
  "includeExamples": true
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `targetPath` | Yes | File or directory path | - |
| `docType` | Yes | `readme`, `api`, `architecture`, `tutorial`, `changelog` | - |
| `outputDir` | Yes | - | - |
| `outputFilename` | No | - | Based on docType |
| `includeExamples` | No | `true`, `false` | `true` |
| `audience` | No | `developer`, `user`, `contributor` | `developer` |

---

### get_second_opinion

Get an alternative AI perspective on your approach.

```bash
npx tsx call.ts gemini get_second_opinion '{
  "context": "Building a caching layer for API responses",
  "question": "Should I use Redis or in-memory cache?",
  "currentApproach": "In-memory LRU cache with 1000 item limit",
  "concerns": ["Scalability across instances", "Persistence on restart"]
}'
```

| Param | Required | Options | Default |
|-------|----------|---------|---------|
| `context` | Yes | - | - |
| `question` | Yes | - | - |
| `codeSnippet` | No | - | - |
| `filesToRead` | No | Array of file paths | - |
| `currentApproach` | No | - | - |
| `concerns` | No | Array of strings | - |

---

## Troubleshooting

**Chrome/Electron Auth Error**: If you see `ENOENT: no such file or directory, stat '.../SingletonCookie'`:

```bash
# Clean up stale Electron/Chrome lock files
rm -rf /var/folders/*/T/.com.google.Chrome.scoped_dir.*
rm -rf /var/folders/*/T/.com.spotify.client.*
```

---

## Tips

1. **Output directory**: Always use absolute paths or `/tmp/` for experiments
2. **Descriptions**: Be specific about what you want - Gemini responds well to detailed requirements
3. **Iteration**: Use `refine_design` to iterate on existing files rather than regenerating
4. **Framework choice**: Match your project's stack (React + Tailwind is well-supported)
5. **Testing output**: Files are created immediately - check them before integrating
6. **Development tools**: Use `research_topic` for web research, `analyze_codebase` for large codebases
7. **Second opinions**: Great for validating architectural decisions before implementation
