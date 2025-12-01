# Gemini CLI Tools and Prompt Templates

## Available Tools

### Design Tools

| Tool | Description | Primary Output |
|------|-------------|----------------|
| `create_wireframe` | Generate HTML/CSS wireframe from description | `.html` file |
| `create_component` | Generate React/Vue/Svelte component | `.tsx`/`.vue`/`.svelte` file |
| `design_page` | Full page layout with multiple sections | Multiple files |
| `refine_design` | Iterate on existing file with feedback | Modified file |
| `create_styles` | Generate CSS/Tailwind styles | `.css`/`.tailwind.css` file |
| `create_project` | Full project scaffolding with configs | Project directory |
| `iterate_project` | Improve existing project | Modified files |
| `suggest_improvements` | UI/UX analysis with structured JSON | JSON response |

### Development Tools

| Tool | Description | Primary Output |
|------|-------------|----------------|
| `research_topic` | Web research with synthesis and citations | Text report |
| `analyze_codebase` | Bulk codebase analysis (1M token context) | Architecture report |
| `generate_docs` | Documentation from source code | `.md` files |
| `get_second_opinion` | Alternative AI perspective on decisions | Text analysis |

## Tool Definitions

### 1. create_wireframe

**Purpose**: Generate a static HTML/CSS wireframe for rapid UI prototyping.

**Input Parameters**:
```typescript
interface CreateWireframeInput {
  description: string;      // What the UI should contain/do
  outputDir: string;        // Where to create files
  filename?: string;        // Output filename (default: wireframe.html)
  style?: 'minimal' | 'detailed' | 'skeleton';  // Visual style
  responsive?: boolean;     // Include responsive breakpoints (default: true)
}
```

**Output**:
```typescript
interface CreateWireframeOutput {
  response: string;         // Gemini's description of what was created
  files: string[];          // Paths to created files
  stats: GeminiStats;       // Token/tool usage stats
}
```

**Prompt Template**:
```
Create an HTML wireframe file.

REQUIREMENTS:
- Description: {{description}}
- Filename: {{filename}}
- Style: {{style}}
- Responsive: {{responsive}}

OUTPUT RULES:
1. Create a single HTML file with embedded CSS
2. Use semantic HTML5 elements
3. Include a modern CSS reset
4. Use CSS variables for colors/spacing
5. {{#if responsive}}Include mobile-first responsive breakpoints{{/if}}
6. Use placeholder content (lorem ipsum, placeholder images)
7. Add subtle borders/backgrounds to show element boundaries

Do NOT:
- Use external dependencies or CDN links
- Include JavaScript unless absolutely necessary
- Over-complicate the structure
```

---

### 2. create_component

**Purpose**: Generate a production-ready React/Vue/Svelte component.

**Input Parameters**:
```typescript
interface CreateComponentInput {
  description: string;      // Component purpose and behavior
  outputDir: string;        // Where to create files
  filename?: string;        // Output filename (default: Component.tsx)
  framework: 'react' | 'vue' | 'svelte';  // Target framework
  styling: 'tailwind' | 'css-modules' | 'styled-components' | 'inline';
  typescript?: boolean;     // Use TypeScript (default: true)
  includeTests?: boolean;   // Generate test file (default: false)
}
```

**Output**:
```typescript
interface CreateComponentOutput {
  response: string;
  files: string[];
  stats: GeminiStats;
}
```

**Prompt Template**:
```
Create a {{framework}} component.

REQUIREMENTS:
- Description: {{description}}
- Filename: {{filename}}
- Styling: {{styling}}
- TypeScript: {{typescript}}

COMPONENT RULES:
1. Use {{framework}} best practices and conventions
2. Include proper TypeScript types for all props
3. Add JSDoc comments for the component and props
4. Use {{styling}} for styling
5. Make the component accessible (ARIA labels, keyboard nav)
6. Include sensible default props where appropriate

STRUCTURE:
{{#if react}}
- Functional component with hooks
- Props interface exported
- Named export (not default)
{{/if}}
{{#if vue}}
- Composition API with <script setup>
- defineProps with TypeScript
{{/if}}
{{#if svelte}}
- TypeScript in <script lang="ts">
- Exported props with types
{{/if}}

{{#if includeTests}}
Also create a test file using Vitest/Jest with:
- Render test
- Props test
- Interaction test (if applicable)
{{/if}}
```

---

### 3. design_page

**Purpose**: Generate a complete page layout with multiple components/sections.

**Input Parameters**:
```typescript
interface DesignPageInput {
  description: string;      // Page purpose and sections
  outputDir: string;        // Where to create files
  pageName?: string;        // Page name (default: page)
  framework: 'html' | 'react' | 'vue' | 'svelte';
  styling: 'tailwind' | 'css' | 'css-modules';
  sections?: string[];      // Specific sections to include
}
```

**Prompt Template**:
```
Design a complete {{framework}} page layout.

REQUIREMENTS:
- Description: {{description}}
- Page name: {{pageName}}
- Styling: {{styling}}
{{#if sections}}
- Required sections: {{sections}}
{{/if}}

PAGE STRUCTURE:
1. Create a main page/layout file
2. Create separate component files for each major section
3. Use consistent naming: {{pageName}}/index.{{ext}}, {{pageName}}/Header.{{ext}}, etc.

DESIGN PRINCIPLES:
1. Mobile-first responsive design
2. Consistent spacing using CSS variables or Tailwind config
3. Accessible navigation and interactive elements
4. Clear visual hierarchy
5. Placeholder content that demonstrates the layout

OUTPUT:
Create all files in {{outputDir}}/{{pageName}}/
```

---

### 4. refine_design

**Purpose**: Modify an existing file based on feedback.

**Input Parameters**:
```typescript
interface RefineDesignInput {
  filePath: string;         // Path to existing file
  feedback: string;         // What to change/improve
  outputDir?: string;       // Where to save (default: same location)
}
```

**Prompt Template**:
```
Refine an existing design file.

FILE TO MODIFY: {{filePath}}
FEEDBACK: {{feedback}}

RULES:
1. Read the existing file first
2. Make targeted changes based on the feedback
3. Preserve the overall structure and style
4. Don't rewrite from scratch unless necessary
5. Keep existing functionality intact

Save the modified file to {{outputDir}}/{{filename}}
```

---

### 5. create_styles

**Purpose**: Generate standalone CSS or Tailwind configuration.

**Input Parameters**:
```typescript
interface CreateStylesInput {
  description: string;      // Style requirements
  outputDir: string;        // Where to create files
  type: 'css' | 'tailwind-config' | 'css-variables';
  theme?: {
    colors?: Record<string, string>;
    fonts?: string[];
    spacing?: string;
  };
}
```

**Prompt Template**:
```
Create a {{type}} file.

REQUIREMENTS:
- Description: {{description}}
{{#if theme}}
- Colors: {{theme.colors}}
- Fonts: {{theme.fonts}}
- Spacing scale: {{theme.spacing}}
{{/if}}

OUTPUT:
{{#if css}}
- Modern CSS with custom properties
- Include reset/normalize
- Utility classes for common patterns
{{/if}}
{{#if tailwind-config}}
- tailwind.config.js with theme extensions
- Include common plugins
{{/if}}
{{#if css-variables}}
- CSS file with :root variables
- Light/dark theme variants
- Organized by category (colors, spacing, typography)
{{/if}}
```

---

## Output Directory Strategy

### Option A: Temp Directory (Recommended for Prototyping)
```
/tmp/gemini-ui/{timestamp}/
```
- Auto-cleanup on system restart
- No project pollution
- Good for quick experiments

### Option B: Project-Specific (Recommended for Integration)
```
{projectRoot}/.gemini-output/
```
- Add to `.gitignore`
- Persistent across sessions
- Easy to review and integrate

### Option C: Direct Output (User-Specified)
```
{userSpecifiedDir}/
```
- Full control
- User provides absolute path
- Risk of overwriting

**Decision**: Support all three via the `outputDir` parameter:
- If `outputDir` starts with `/tmp`, use as-is
- If `outputDir` is relative, resolve from cwd
- If `outputDir` is `.gemini-output`, create in project root

---

## Shared Types

```typescript
interface GeminiStats {
  models: {
    [modelName: string]: {
      api: {
        totalRequests: number;
        totalErrors: number;
        totalLatencyMs: number;
      };
      tokens: {
        prompt: number;
        candidates: number;
        total: number;
        cached: number;
        thoughts: number;
        tool: number;
      };
    };
  };
  tools: {
    totalCalls: number;
    totalSuccess: number;
    totalFail: number;
    totalDurationMs: number;
    byName: Record<string, {
      count: number;
      success: number;
      fail: number;
      durationMs: number;
    }>;
  };
  files: {
    totalLinesAdded: number;
    totalLinesRemoved: number;
  };
}

interface GeminiToolResult<T> {
  success: boolean;
  response: string;
  files: string[];
  stats: GeminiStats;
  error?: string;
}
```

---

## Development Tools

These tools leverage Gemini's 1M token context window for supportive development tasks beyond UI design.

### 6. research_topic

**Purpose**: Research a topic using web search and synthesize findings with citations.

**Input Parameters**:
```typescript
interface ResearchTopicInput {
  query: string;              // The topic or question to research
  focusAreas?: string[];      // Specific aspects to focus on
  sources?: 'web' | 'docs' | 'both';  // Where to search (default: 'both')
  outputFormat?: 'summary' | 'detailed' | 'bullet-points';
  maxSources?: number;        // Max sources to cite (default: 5)
}
```

**Example**:
```bash
npx tsx call.ts gemini research_topic '{"query":"n8n webhook security best practices","focusAreas":["authentication","validation"],"outputFormat":"detailed"}'
```

**Output**: Comprehensive research report with citations and sources.

---

### 7. analyze_codebase

**Purpose**: Analyze a codebase directory to understand architecture, patterns, and answer specific questions.

**Input Parameters**:
```typescript
interface AnalyzeCodebaseInput {
  directory: string;          // Directory to analyze (absolute path)
  questions?: string[];       // Specific questions to answer
  focus?: 'architecture' | 'dependencies' | 'patterns' | 'issues' | 'all';
  depth?: 'shallow' | 'medium' | 'deep';  // Analysis depth
  filePatterns?: string[];    // Glob patterns to include
  excludePatterns?: string[]; // Glob patterns to exclude
}
```

**Example**:
```bash
npx tsx call.ts gemini analyze_codebase '{"directory":"/path/to/project","focus":"architecture","depth":"medium","questions":["How does auth work?"]}'
```

**Output**: Architecture analysis with structure, findings, and recommendations.

---

### 8. generate_docs

**Purpose**: Generate documentation from source code.

**Input Parameters**:
```typescript
interface GenerateDocsInput {
  targetPath: string;         // File or directory to document
  docType: 'readme' | 'api' | 'architecture' | 'tutorial' | 'changelog';
  outputDir: string;          // Where to save generated docs
  outputFilename?: string;    // Custom filename
  includeExamples?: boolean;  // Include code examples (default: true)
  audience?: 'developer' | 'user' | 'contributor';
}
```

**Example**:
```bash
npx tsx call.ts gemini generate_docs '{"targetPath":"./src","docType":"api","outputDir":"./docs","audience":"developer"}'
```

**Output**: Markdown documentation file created in the output directory.

---

### 9. get_second_opinion

**Purpose**: Get an alternative AI perspective on your approach, code, or technical decision.

**Input Parameters**:
```typescript
interface GetSecondOpinionInput {
  context: string;            // Description of what you're working on
  question: string;           // The specific question or decision
  codeSnippet?: string;       // Optional code to review
  filesToRead?: string[];     // Files Gemini should read for context
  currentApproach?: string;   // Your current approach for comparison
  concerns?: string[];        // Specific concerns to address
}
```

**Example**:
```bash
npx tsx call.ts gemini get_second_opinion '{"context":"Building a caching layer","question":"Should I use Redis or in-memory cache?","currentApproach":"In-memory with LRU","concerns":["Scalability","Persistence"]}'
```

**Output**: Structured analysis with strengths, concerns, alternatives, and recommendations.

---

## Troubleshooting

**Chrome/Electron Auth Error**: If you see `ENOENT: no such file or directory, stat '.../SingletonCookie'`:

```bash
# Clean up stale Electron/Chrome lock files
rm -rf /var/folders/*/T/.com.google.Chrome.scoped_dir.*
rm -rf /var/folders/*/T/.com.spotify.client.*
```

This is caused by stale browser temp directories from previous Gemini CLI sessions.
