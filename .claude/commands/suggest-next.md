---
description: Analyze recent work and suggest next steps for features, UI/UX, subagents, and documentation
allowed-tools: Bash(git log:*), Bash(git diff:*), Bash(git status:*), Read, Glob, Grep
---

# Suggest Next Steps

You have just completed work on this project. Now analyze the recent work context and provide **3-4 actionable suggestions** to guide the next development steps.

## Context to Analyze

### Recent Git Activity
- Last 10 commits: !`git log --oneline -10`
- Modified files: !`git status --short`
- Recent changes summary: !`git diff HEAD~3..HEAD --stat`
- Current branch: !`git branch --show-current`

### Available Resources
- Review `.claude/agents/agent-index.md` for available subagents
- Check `Docs/` directory structure for documentation gaps
- Consider current project architecture from `CLAUDE.md`

## Your Task

Provide **3-4 specific, actionable suggestions** in the following categories:

### 1. Feature Enhancements
Based on the files recently modified and patterns in commits:
- What natural next features build on this work?
- What user workflows could be improved?
- What edge cases or enhancements are missing?

### 2. UI/UX Improvements
Focus on user experience and interface design:
- Component design enhancements (consider shadcn-ui-designer subagent)
- Accessibility improvements
- User feedback and loading states
- Mobile responsiveness
- Visual polish and consistency

### 3. Subagent Workflow Optimizations
Identify opportunities to leverage specialized subagents:
- What work could be delegated to `supabase-backend-specialist`?
- Should `boldsign-specialist` handle e-signature enhancements?
- Could `stripe-specialist` improve payment flows?
- Would `claude-hook-specialist` help automate workflows?
- Should `research-specialist` investigate new tools/approaches?

### 4. Documentation Updates
Cross-reference code changes with existing documentation:
- What docs in `Docs/` need updates based on recent changes?
- Are there new features that need documentation?
- Should we create integration guides or examples?
- Are there README updates needed?

## Output Format

For each suggestion, provide:

**Title**: Clear, specific title
**Category**: Feature | UI/UX | Subagent | Documentation
**Priority**: High | Medium | Low
**Rationale**: Why this matters based on recent work (1-2 sentences)
**Action Steps**: 2-4 specific, actionable tasks
**Subagent**: Which subagent to delegate to (if applicable)
**Files Affected**: Key files that would change

## Guidelines

- Be **specific and actionable**, not generic
- Base suggestions on **actual recent work patterns**
- Prioritize suggestions that **build momentum** on current work
- Consider **user value** and **technical debt** balance
- Identify **quick wins** vs longer-term improvements
- Only suggest subagent delegation when it truly fits the task domain
- Reference actual file paths and component names from the codebase
