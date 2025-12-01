# Gemini Partner Prompt Templates

Curated prompts optimized for Gemini CLI headless invocation.

## Codebase Analysis

### Full Architecture Review

```powershell
gemini -y -o json -m gemini-3-pro-preview "Perform a comprehensive architecture review of this codebase.

Analyze:
1. **Project Structure** - Directory organization, file naming, module boundaries
2. **Design Patterns** - Identify patterns used (MVC, Repository, etc.)
3. **Data Flow** - How data moves through the application
4. **Dependencies** - Key libraries and their purposes
5. **Configuration** - Environment, build, and runtime configuration

Output a structured report with:
- Executive summary (2-3 sentences)
- Detailed findings by category
- Architecture diagram (text-based)
- Recommendations for improvement"
```

### Component Dependency Analysis

```powershell
gemini -y -o json -m gemini-3-pro-preview "Analyze component dependencies in the src/components directory.

For each component, identify:
1. Direct imports (what it uses)
2. Dependents (what uses it)
3. Circular dependencies (if any)
4. Orphaned components (unused)

Create a dependency report showing:
- Component hierarchy
- Coupling analysis (tight vs loose)
- Suggestions for refactoring"
```

### Dead Code Detection

```powershell
gemini -y -o json -m gemini-3-pro-preview "Scan this codebase for dead code.

Look for:
1. Unused exports
2. Unreachable code paths
3. Commented-out code blocks
4. Deprecated functions still present
5. Unused dependencies in package.json

Report with file paths and line numbers.
Categorize by confidence level (definite, likely, possible)."
```

## Second Opinion

### Architecture Decision Review

```powershell
gemini -y -o json -m gemini-3-pro-preview "Review this architecture decision:

**Decision:** [describe the decision]
**Context:** [why we're making this decision]
**Current approach:** [what we're planning]

Provide:
1. **Analysis** - Pros and cons of this approach
2. **Risks** - What could go wrong
3. **Alternatives** - Other approaches to consider
4. **Recommendation** - Your suggested path forward
5. **Questions** - What would you want to clarify"
```

### Code Approach Review

```powershell
gemini -y -o json -m gemini-3-pro-preview "I'm implementing [feature] with this approach:

[paste code or describe approach]

Review and provide:
1. What's good about this approach
2. Potential issues or edge cases
3. Performance considerations
4. Security considerations
5. How you would approach it differently (if at all)"
```

### Debugging Assistance

```powershell
gemini -y -o json -m gemini-3-pro-preview "Help debug this issue:

**Problem:** [describe the issue]
**Error:** [paste error message if any]
**Steps to reproduce:** [how to trigger it]
**What I've tried:** [debugging attempts]

Analyze the codebase and:
1. Identify likely root causes
2. Suggest specific files/lines to investigate
3. Propose solutions to try
4. Explain the underlying issue"
```

## Research Tasks

### Library Evaluation

```powershell
gemini -y -o json -m gemini-3-pro-preview "Research and evaluate libraries for [purpose].

Requirements:
- [requirement 1]
- [requirement 2]

For each candidate library, provide:
1. Name and current version
2. Key features
3. Bundle size / performance
4. Community health (stars, maintenance)
5. Pros and cons
6. Code example

Recommend the best choice with reasoning."
```

### Best Practices Research

```powershell
gemini -y -o json -m gemini-3-pro-preview "Research current best practices for [topic] in 2025.

Cover:
1. Industry standards and recommendations
2. Common anti-patterns to avoid
3. Implementation patterns with examples
4. Tools and libraries that help
5. Resources for further learning

Cite sources and note when practices changed recently."
```

### Framework Comparison

```powershell
gemini -y -o json -m gemini-3-pro-preview "Compare [Framework A] vs [Framework B] for [use case].

Evaluation criteria:
1. Learning curve
2. Performance
3. Ecosystem and tooling
4. Community and support
5. Long-term viability

Provide:
- Feature comparison table
- Pros/cons for each
- When to use each
- Your recommendation for our project"
```

## UI Generation

### React Component

```powershell
gemini -y -o json -m gemini-3-pro-preview "Create a React TypeScript component: [ComponentName]

Description: [what it does]

Requirements:
- TypeScript with proper types
- Tailwind CSS styling
- Accessible (WCAG 2.1 AA)
- Responsive (mobile-first)
- Include loading and error states

Props:
- [prop1]: [type] - [description]
- [prop2]: [type] - [description]

Save to: src/components/[ComponentName].tsx"
```

### HTML Wireframe

```powershell
gemini -y -o json -m gemini-3-pro-preview "Create an HTML wireframe for [page/feature].

Requirements:
- Semantic HTML5
- Embedded CSS (no external deps)
- Responsive breakpoints
- Placeholder content
- Visual hierarchy with subtle borders

Sections needed:
1. [section 1]
2. [section 2]
3. [section 3]

Save to: wireframes/[name].html"
```

### Page Layout

```powershell
gemini -y -o json -m gemini-3-pro-preview "Design a complete page layout for [page name].

Purpose: [what the page does]

Include sections:
- Header with navigation
- Hero section
- [main content sections]
- Footer

Requirements:
- React + TypeScript
- Tailwind CSS
- Responsive design
- Skeleton loading states

Create component files in: src/pages/[PageName]/"
```

## Documentation

### API Documentation

```powershell
gemini -y -o json -m gemini-3-pro-preview "Generate API documentation for this codebase.

Document:
1. All exported functions/classes
2. Parameters with types
3. Return values
4. Usage examples
5. Error handling

Format: Markdown with code blocks
Save to: docs/api/"
```

### README Generation

```powershell
gemini -y -o json -m gemini-3-pro-preview "Generate a comprehensive README.md for this project.

Include:
1. Project title and description
2. Features list
3. Tech stack
4. Prerequisites
5. Installation instructions
6. Usage examples
7. Configuration options
8. Contributing guidelines
9. License

Make it professional and welcoming to new contributors.
Save to: README.md"
```

### Migration Guide

```powershell
gemini -y -o json -m gemini-3-pro-preview "Create a migration guide from [old version/pattern] to [new version/pattern].

Cover:
1. What's changing and why
2. Step-by-step migration process
3. Breaking changes
4. Code examples (before/after)
5. Common issues and solutions
6. Rollback procedure

Save to: docs/migration-guide.md"
```

## Code Quality

### Security Audit

```powershell
gemini -y -o json -m gemini-3-pro-preview "Perform a security audit of this codebase.

Check for:
1. Injection vulnerabilities (SQL, XSS, command)
2. Authentication/authorization issues
3. Sensitive data exposure
4. Security misconfigurations
5. Dependency vulnerabilities
6. OWASP Top 10 issues

Report:
- Severity (Critical/High/Medium/Low)
- File path and line number
- Description of issue
- Remediation steps"
```

### Performance Analysis

```powershell
gemini -y -o json -m gemini-3-pro-preview "Analyze this codebase for performance issues.

Check:
1. React re-render optimization
2. Bundle size concerns
3. Database query efficiency
4. Memory leaks
5. Expensive computations

Provide:
- Issue description
- Location (file:line)
- Impact assessment
- Optimization suggestions"
```

### Test Coverage Analysis

```powershell
gemini -y -o json -m gemini-3-pro-preview "Analyze test coverage and quality in this codebase.

Evaluate:
1. Which modules have tests
2. Which modules lack tests
3. Test quality (assertions, edge cases)
4. Test patterns used
5. Mocking strategies

Recommend:
- Priority areas for new tests
- Specific test cases to add
- Testing patterns to adopt"
```
