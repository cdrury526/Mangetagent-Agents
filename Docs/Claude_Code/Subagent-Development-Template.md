# Subagent Development Template

> A standardized template for creating consistent, effective subagents for the Claude Task Manager project

## Overview

This template ensures all subagents for the Context-Crate/Claude Task Manager project follow consistent patterns, have clear responsibilities, and integrate seamlessly with the development workflow.

---

## Template Structure

### Basic Information Section

```
Project: Claude Task Manager
Subagent Name: [descriptive-kebab-case-name]
Category: [backend | frontend | database | integration | testing | documentation]
Created: [YYYY-MM-DD]
Last Updated: [YYYY-MM-DD]
Version: 1.0
Complexity: [simple | moderate | complex]
```

### Purpose & Use Cases

**Primary Purpose:**
- [One clear, focused responsibility]

**When to Use:**
- [Specific task types or conditions that trigger this agent]
- [Integration points in the development workflow]

**When NOT to Use:**
- [Tasks that fall outside the agent's scope]
- [Situations where it would be inefficient]

---

## File Format & Location

### File Path Convention

```
.claude/agents/[category]/[subagent-name].md
```

**Example paths:**
```
.claude/agents/backend/database-optimizer.md
.claude/agents/frontend/ui-component-builder.md
.claude/agents/testing/test-suite-manager.md
```

### File Contents Template

```markdown
---
name: [subagent-name]
description: [Natural language description of when this subagent should be invoked - max 150 chars]
tools: [Tool1, Tool2, Tool3]  # Comma-separated list
model: [sonnet | opus | haiku | inherit]
---

# System Prompt

[Detailed system prompt goes here - see "System Prompt Guidelines" below]
```

---

## System Prompt Guidelines

### Structure

Your system prompt should follow this structure:

1. **Role Definition** (2-3 sentences)
   - Clear statement of expertise and responsibility
   - Who this agent is and what makes it qualified

2. **Core Responsibilities** (Bulleted list)
   - Main tasks the agent handles
   - Key workflows it executes

3. **Approach & Methodology** (2-3 paragraphs)
   - How the agent should think about problems
   - Best practices it should follow
   - Common patterns to look for

4. **Context About the Project** (1-2 paragraphs)
   - Relevant details about the Claude Task Manager
   - Tech stack elements it needs to know
   - Architecture context if applicable

5. **Specific Instructions** (Detailed section)
   - Step-by-step process for common tasks
   - Edge cases and how to handle them
   - Performance/quality requirements

6. **Quality Standards** (Checklist style)
   - What constitutes successful output
   - Testing or validation requirements
   - Code/documentation standards

7. **Constraints & Limitations** (Explicit list)
   - What the agent should NOT do
   - Security or safety considerations
   - Tool limitations

### Example System Prompt

```
You are a Backend Architecture Specialist focused on the Claude Task Manager Python application.

## Core Responsibilities
- Design database schema and migrations
- Optimize database queries and indexes
- Implement authentication and authorization
- Design Flask API endpoints
- Manage Supabase integrations

## Approach
When tackling backend tasks:
1. Consider the full data flow from database to API response
2. Prioritize security through Row Level Security (RLS) policies
3. Design for scalability with proper indexing
4. Maintain consistency with existing patterns
5. Document complex logic with clear comments

## Project Context
The Claude Task Manager uses:
- Python 3.10+ with Flask and Flask-SocketIO
- Supabase for authentication and database (PostgreSQL)
- Real-time WebSocket connections for live updates
- MCP server for Claude integration

The application has core modules in:
- `core/database.py` - Database operations
- `core/auth.py` - Authentication logic
- `core/mcp_server.py` - MCP integration

## Specific Instructions
### For Database Tasks
1. Review the schema in Project-Plan.md first
2. Check existing indexes and RLS policies
3. Write migrations using the Supabase API
4. Test with actual data volumes
5. Update indexes if query performance is critical

### For API Design
1. Follow REST conventions
2. Include proper authentication middleware
3. Handle errors with meaningful messages
4. Add input validation
5. Document endpoints with clear parameter descriptions

## Quality Standards
- [ ] Database queries are optimized (use EXPLAIN when needed)
- [ ] All endpoints are properly authenticated
- [ ] RLS policies are configured correctly
- [ ] Code follows existing patterns in the codebase
- [ ] Changes are documented in comments
- [ ] No hardcoded credentials or secrets
- [ ] Error handling is comprehensive

## Constraints
- Do not modify .env or expose sensitive configuration
- Always use parameterized queries to prevent SQL injection
- Respect Supabase RLS policies in all operations
- Keep WebSocket updates efficient and debounced
- Do not bypass authentication for testing
```

---

## Tool Access Configuration

### Tool Selection Principles

**Include tools when the agent needs to:**
- Read and analyze code files → `Read`, `Glob`, `Grep`
- Modify files → `Edit`, `Write`
- Run tests or build processes → `Bash`
- Interact with databases → `Bash` (for SQL), specific API tools
- Research and documentation → `WebFetch`, `WebSearch`

**Common Tool Combinations:**

| Agent Type | Primary Tools | Optional Tools |
|-----------|--------------|----------------|
| Backend Developer | Read, Edit, Bash, Grep, Glob | Task |
| Frontend Developer | Read, Edit, Bash, Grep, Glob | mcp__chrome-devtools__ |
| Database Specialist | Read, Write, Edit, Bash | mcp__supabase__ |
| Test Engineer | Read, Bash, Grep, Glob | Edit, Write |
| Documentation Writer | Read, Write, Edit, Glob | WebFetch |
| Code Reviewer | Read, Grep, Glob, Bash | Edit (for suggestions) |

**Default (Omit tools field):** Agent inherits all tools from main thread

### Example Tool Declarations

```yaml
# Minimal: Only essential tools
tools: Read, Edit, Bash

# Comprehensive: For complex tasks
tools: Read, Edit, Write, Bash, Grep, Glob, Task

# Database-focused: Supabase operations
tools: Read, Edit, Bash, mcp__supabase__execute_sql, mcp__supabase__apply_migration
```

---

## Model Selection Guidelines

| Complexity | Model | Use Case |
|-----------|-------|----------|
| Simple, focused | `haiku` | Code formatting, small edits, quick checks |
| Moderate | `sonnet` (default) | Most development tasks, analysis |
| Complex | `opus` | Architecture design, complex debugging |
| Adaptive | `inherit` | Inherit from main conversation |

**Recommendation:** Use `sonnet` as default unless you have specific reasons to use another model.

---

## Category-Specific Templates

### Backend Developer Subagent

```yaml
---
name: backend-developer
description: Backend specialist for Python, Flask, database operations, and API design
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

[System prompt focusing on Python, Flask, Supabase, architecture]
```

### Frontend Developer Subagent

```yaml
---
name: frontend-developer
description: Frontend specialist for HTML, CSS, JavaScript, and UI implementation
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

[System prompt focusing on HTML/CSS/JS, Tailwind, UI patterns]
```

### Database Specialist Subagent

```yaml
---
name: database-specialist
description: Database expert for schema design, migrations, queries, and optimization
tools: Read, Edit, Bash
model: sonnet
---

[System prompt focusing on PostgreSQL, Supabase, schema design]
```

### Test & QA Subagent

```yaml
---
name: test-qa-engineer
description: Testing specialist for writing tests, quality assurance, and bug detection
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

[System prompt focusing on testing strategies, coverage, quality gates]
```

### Documentation Subagent

```yaml
---
name: documentation-specialist
description: Documentation expert for guides, API docs, and technical writing
tools: Read, Write, Edit, Glob
model: sonnet
---

[System prompt focusing on clarity, structure, completeness]
```

### Code Reviewer Subagent

```yaml
---
name: code-reviewer
description: Expert code review specialist for quality, security, and best practices
tools: Read, Grep, Glob, Bash
model: sonnet
---

[System prompt focusing on code standards, security, maintainability]
```

### Integration Specialist Subagent

```yaml
---
name: integration-specialist
description: Integration expert for connecting components, APIs, and third-party services
tools: Read, Edit, Write, Bash, Grep, Glob, Task
model: sonnet
---

[System prompt focusing on integration patterns, APIs, MCP]
```

---

## Creating a New Subagent: Step-by-Step

### 1. Define the Need
- [ ] What specific task or workflow needs automation?
- [ ] How frequently will this agent be used?
- [ ] What expertise area does it cover?

### 2. Choose Category
- [ ] Select from: backend, frontend, database, integration, testing, documentation
- [ ] Or create new category if needed

### 3. Write System Prompt
- [ ] Follow the structure outlined above
- [ ] Include project-specific context
- [ ] Be explicit about responsibilities and constraints
- [ ] Include quality standards and validation approaches

### 4. Select Tools
- [ ] List the minimum tools needed
- [ ] Verify each tool selection is justified
- [ ] Consider security implications

### 5. Choose Model
- [ ] Default to `sonnet` unless specific reason otherwise
- [ ] Use `haiku` for simple, fast tasks
- [ ] Use `opus` for complex analysis

### 6. Create File
```bash
# Create in .claude/agents/[category]/
mkdir -p .claude/agents/[category]
touch .claude/agents/[category]/[subagent-name].md
```

### 7. Test & Validate
- [ ] Test the subagent with representative tasks
- [ ] Verify it uses intended tools appropriately
- [ ] Check tool access is sufficient
- [ ] Refine prompt based on performance

### 8. Document
- [ ] Add entry to project subagents registry (below)
- [ ] Include usage examples in team documentation
- [ ] Document any setup requirements

---

## Subagents Registry

### Active Subagents

Track all project subagents here for easy reference:

| Name | Category | Purpose | Status |
|------|----------|---------|--------|
| claude-task-manager-specialist | backend | Development specialist for architecture decisions, phase planning, technology integration, and implementation patterns with 2024 best practices | active |
| async-python-expert | backend | Python asyncio and concurrent programming specialist. Use PROACTIVELY for async/await patterns, task management, MCP server operations, and concurrent I/O handling. | active |
| project-plan-support-specialist | backend | Project Plan specialist for technology validation, architecture decisions, risk assessment, and implementation roadmap support. Use PROACTIVELY during phase planning. | active |
| oauth-integration-specialist | backend | OAuth 2.0 and social authentication expert. Handles OAuth flows, social providers (Google, GitHub, etc.), token management, Supabase auth, PKCE, and RFC 9700 compliance. Use PROACTIVELY for auth implementation. | active |
| accessibility-expert | frontend | Web accessibility (WCAG 2.1 Level AA) specialist for ARIA, keyboard navigation, screen reader testing, and inclusive design. Use PROACTIVELY for a11y audits. | active |
| cli-tool-builder | integration | Command-line interface creation with argparse/Click patterns, cross-platform support, MCP CLI integration | active |
| documentation-specialist | documentation | Technical documentation creation (README, API docs, guides, architecture). Use PROACTIVELY after code changes. | active |
| json-schema-expert | integration | JSON Schema design and validation for MCP tools, API schemas, and data structures. Use PROACTIVELY for schema design decisions. | active |
| api-design-architect | integration | RESTful API design for endpoints, HTTP methods, status codes, pagination, and versioning. Use PROACTIVELY when designing Flask endpoints. | active |
| mcp-agent-builder | integration | MCP agent creation specialist. Design, build, test, and package MCP server agents with FastMCP 2.0 patterns, tool definitions, and marketplace deployment. | active |
| rate-limiting-expert | integration | Rate limiting and throttling for API protection, script execution limits, and DDoS prevention. Use PROACTIVELY when implementing API quotas or resource limits. | active |
| github-actions-specialist | integration | GitHub Actions CI/CD workflows, matrix builds, automated testing, releases, and deployments. Use PROACTIVELY when setting up automation. | active |
| plugin-architecture-expert | backend | Plugin/extension system design specialist. Handles plugin discovery, dynamic loading, plugin API design, version compatibility, plugin isolation, and dependency management. Use PROACTIVELY when designing plugin systems. | active |
| ux-flow-designer | frontend | User experience and flow design: journey mapping, onboarding, error UX, loading states, feedback loops, progressive disclosure. Use PROACTIVELY for UX improvements. | active |
| file-system-operations | backend | Safe file system operations specialist for pathlib usage, atomic writes, cross-platform paths, permissions, and secure directory traversal. Use PROACTIVELY for file/agent/script operations. | active |

### Subagent Creation Log

| Date | Subagent | Creator | Purpose |
|------|----------|---------|---------|
| 2024-10-30 | claude-task-manager-specialist | Project Development | Development specialist for architecture decisions, phase planning, technology integration, MCP/Flask/Supabase patterns with 2024 best practices |
| 2024-10-30 | async-python-expert | Project Development | Python asyncio specialist for async/await patterns, task management, MCP server operations, concurrent I/O, WebSocket handling, error handling, performance optimization |
| 2024-10-30 | project-plan-support-specialist | Project Development | Project Plan specialist for technology validation, architecture decisions, risk assessment, implementation roadmap support with 2024-2025 API/version research |
| 2024-10-30 | oauth-integration-specialist | Project Development | OAuth 2.0 and social authentication specialist with RFC 9700 compliance, provider integration (Google, GitHub, LinkedIn), token management, Supabase auth, and secure flows |
| 2024-10-30 | accessibility-expert | Project Development | Web accessibility (WCAG 2.1 Level AA) specialist for ARIA, keyboard navigation, screen reader testing, and inclusive design |
| 2024-10-30 | cli-tool-builder | Project Development | CLI development for scripts, MCP interfaces, and command-line tools with cross-platform support |
| 2024-10-30 | documentation-specialist | Project Development | Technical documentation creation for README, API docs, user guides, architecture, and code docstrings with latest best practices |
| 2024-10-30 | json-schema-expert | Project Development | JSON Schema design and validation for MCP tool schemas, OpenAPI endpoints, Pydantic models, and data validation with 2024 standards (Draft 2020-12) |
| 2024-10-30 | api-design-architect | Project Development | RESTful API design expert for Flask endpoints, HTTP methods, status codes, pagination, filtering/sorting, error handling, and versioning with 2024-2025 best practices |
| 2024-10-30 | mcp-agent-builder | Project Development | MCP agent creation specialist for FastMCP 2.0 patterns, tool design, agent composition, comprehensive testing strategies, documentation, and marketplace distribution |
| 2024-10-30 | rate-limiting-expert | Project Development | Rate limiting and throttling specialist for token bucket algorithm, Redis-based distributed rate limiting, per-user quotas, script execution limits, and DDoS prevention with 2024-2025 strategies |
| 2024-10-30 | github-actions-specialist | Project Development | GitHub Actions CI/CD specialist for workflow design, matrix builds, automated testing, release automation, multi-platform builds, semantic versioning, artifact management, and security hardening with 2024-2025 best practices |
| 2024-10-30 | plugin-architecture-expert | Project Development | Plugin/extension system design specialist for plugin discovery, dynamic loading (importlib, entry points), API design, version compatibility (semantic versioning), isolation strategies, and dependency management |
| 2024-10-30 | ux-flow-designer | Project Development | UX specialist for user flow design, journey mapping, onboarding patterns, error messaging, loading states, feedback loops with 2024-2025 best practices |
| 2024-10-30 | file-system-operations | Project Development | File system specialist for safe pathlib operations, atomic writes, cross-platform paths, permissions, directory traversal security with 2024 best practices |

---

## Best Practices

### ✅ DO

- **Focus on a single responsibility** - One specialized role per subagent
- **Be explicit about tool access** - Only include tools the agent actually needs
- **Include project context** - Reference the tech stack and architecture
- **Write detailed instructions** - The more guidance, the better the output
- **Test thoroughly** - Validate with real tasks before relying on the agent
- **Document usage** - Include examples of when to invoke the agent
- **Version track** - Keep subagents in `.claude/agents/` directory
- **Use inherit model** - When consistency with main conversation is important

### ❌ DON'T

- **Create generic catch-all agents** - Agents work best when specialized
- **Grant all tools by default** - Only include what's necessary
- **Write vague descriptions** - Be specific about when the agent should be used
- **Assume project context** - Explicitly state relevant architecture details
- **Forget about constraints** - Clearly define what the agent should NOT do
- **Create overlapping agents** - Avoid duplicate functionality
- **Ignore performance** - Consider token usage and context efficiency

---

## Integration Patterns

### Proactive Delegation

Include trigger phrases in your description to enable proactive invocation:

```yaml
description: "Backend specialist. Use PROACTIVELY for Python code, Flask endpoints, and database design."
```

**Trigger phrases that encourage proactive use:**
- "Use PROACTIVELY"
- "Proactively analyze"
- "After any changes to [area]"
- "Whenever [condition]"

### Explicit Invocation

Agents can be explicitly requested in commands:

```
> Use the database-specialist subagent to optimize this query
> Have the code-reviewer subagent check my changes
> Ask the test-qa-engineer to write tests for this feature
```

### Chaining Agents

For complex workflows, chain multiple agents:

```
> First use the database-specialist to design the schema,
> then use the backend-developer to implement the API,
> then use the code-reviewer to check the implementation
```

---

## Subagent Communication Protocol

### Input from Main Thread

- **Task description** - Clear statement of what needs to be done
- **Context** - Current branch, recent changes, related issues
- **Constraints** - Time limits, specific requirements

### Output to Main Thread

- **Summary** - Brief overview of what was accomplished
- **Key findings** - Important discoveries or issues
- **Next steps** - Recommended follow-up actions
- **Files modified** - List of changed files with purpose

### Error Handling

Subagents should:
- Report errors clearly with context
- Suggest solutions when possible
- Return to main thread if the task is outside scope
- Preserve recent context for manual review

---

## Configuration Examples

### Example 1: Minimal Backend Agent

```markdown
---
name: backend-quick-fix
description: Quick fixes for Python/Flask issues
tools: Read, Edit, Bash
model: haiku
---

You are a quick-fix specialist for Python backend issues in the Claude Task Manager.
Focus on rapid diagnosis and minimal changes. Use the codebase context to understand patterns.

When you spot an issue:
1. Locate the problem area
2. Apply the minimal fix
3. Test the fix
4. Report what was changed and why
```

### Example 2: Comprehensive Database Agent

```markdown
---
name: database-architect
description: Database schema design, migrations, and optimization. Use PROACTIVELY for database tasks.
tools: Read, Edit, Write, Bash
model: sonnet
---

You are a database architect specializing in PostgreSQL and Supabase optimization.

[Detailed system prompt with full instructions]
```

### Example 3: Testing Specialist

```markdown
---
name: test-automation-engineer
description: Testing expert. Use PROACTIVELY after code changes to write and run tests.
tools: Read, Edit, Write, Bash, Glob, Grep
model: sonnet
---

You are a test automation specialist focused on code quality and coverage.

[Detailed system prompt with testing methodology]
```

---

## Maintenance & Evolution

### Regular Reviews

- **Monthly**: Review subagent usage patterns and effectiveness
- **Quarterly**: Update prompts based on lessons learned
- **As needed**: Adjust tool access based on actual requirements

### Version Management

```markdown
---
name: backend-developer
version: 2.1
last_updated: 2024-11-15
---

## Changelog
- v2.1: Added RLS policy guidance
- v2.0: Updated Flask patterns for SocketIO integration
- v1.0: Initial release
```

### Deprecation Process

1. Mark agent as "deprecated" in description
2. Recommend replacement agent
3. Keep file available for 2 weeks
4. Archive in comments if needed later

---

## Resources & References

- **Claude Code Docs**: `/docs/claude-code/agents`
- **Project Plan**: `Project-Plan.md`
- **MCP Documentation**: Supabase, Flask-SocketIO docs
- **Team Guidelines**: Check internal documentation

---

## Template Checklist

Use this when creating a new subagent:

- [ ] **File location**: Placed in `.claude/agents/[category]/[name].md`
- [ ] **YAML frontmatter**: name, description, tools, model all present
- [ ] **Role definition**: Clear statement of purpose (2-3 sentences)
- [ ] **Core responsibilities**: Bulleted list of main tasks
- [ ] **Project context**: References to tech stack and architecture
- [ ] **Specific instructions**: Step-by-step guidance for common tasks
- [ ] **Quality standards**: Checklist of success criteria
- [ ] **Constraints**: Clear boundaries on what NOT to do
- [ ] **Tool selection**: Justified, minimal set of tools
- [ ] **Model choice**: Appropriate complexity level
- [ ] **Testing**: Validated with representative tasks
- [ ] **Documentation**: Usage examples and integration points
- [ ] **Registry entry**: Added to Subagents Registry above

---

## Questions & Answers

**Q: Should I grant all tools or be restrictive?**
A: Be restrictive. Only include tools the agent actually needs. This improves security and focus.

**Q: When should I use `inherit` vs. a specific model?**
A: Use `inherit` when you want consistency with the main conversation. Use specific models for cost/speed optimization.

**Q: Can agents use MCP tools?**
A: Yes, if MCP tools are available and listed in the tools field.

**Q: What if my agent description is too vague?**
A: It won't be invoked proactively. Be specific about triggers and use cases.

**Q: How do I test a new agent?**
A: Invoke it explicitly with representative tasks, then refine based on performance.

**Q: Should I create one big agent or many small ones?**
A: Many small, focused agents. They're more reliable and easier to maintain.

