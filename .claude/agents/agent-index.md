# Agent Index

> Comprehensive registry of all subagents in the Bolt-Magnet-Agent-2025 project

**Last Updated:** 2025-11-23
**Total Agents:** 10
**Active Categories:** 4

## Overview

This registry catalogs all custom subagents available in the Bolt-Magnet-Agent-2025 project. Subagents are specialized AI assistants that handle specific types of tasks with focused expertise, custom system prompts, and dedicated context windows.

Each subagent is designed to integrate seamlessly with the project's technology stack:
- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments:** Stripe
- **Documents:** Boldsign
- **Real-time:** Supabase Realtime

## Quick Reference

| Category | Agent Name | Use When | Key Technologies |
|----------|-----------|----------|------------------|
| Backend | supabase-backend-specialist | Database design, RLS policies, Auth, Storage, Realtime, Edge Functions | PostgreSQL 15/17, Supabase v2.80.x, Deno, RLS |
| Frontend | shadcn-ui-designer | UI component design, theming, accessibility, modern design patterns, Tailwind v3/v4 | shadcn/ui, Tailwind CSS, Radix UI, TypeScript, React |
| Integration | boldsign-specialist | BoldSign e-signature API, embedded signing, webhook handling, real estate workflows | BoldSign API v1, OAuth 2.0, HMAC-SHA256, Deno |
| Integration | stripe-specialist | Payment Intents, Subscriptions, Checkout, Webhooks, React Stripe Elements | Stripe API 2024-11-20, @stripe/react-stripe-js, Deno |
| Meta | claude-hook-specialist | Creating, debugging, optimizing Claude Code hooks for automation, standards enforcement, security | Hook events, Python, Bash, TypeScript, Prettier, ESLint |
| Meta | claude-maintainer | CLAUDE.md optimization, maintenance, performance monitoring, best practices enforcement | Best Practices Research, Glob, Grep |
| Meta | eslint-code-quality-specialist | ESLint error fixing, TypeScript any type replacement, React Hook dependency fixes, code quality enforcement | ESLint, @typescript-eslint, React Hooks, TypeScript 5.5+ |
| Meta | github-specialist | Git operations, commits, pull requests, branch management, code review, GitHub CLI automation | Git, GitHub CLI (gh), Conventional Commits, GitHub Actions |
| Meta | research-specialist | Technical research, library evaluation, debugging, implementation planning, staying current | Context7, Docfork, Brave Search, Perplexity |
| Meta | script-writer-specialist | TypeScript automation scripts, ESLint plugins, Vitest tests, pgTAP tests, CI/CD workflows, code analysis | ts-morph, Vitest, @typescript-eslint/utils, pgTAP, GitHub Actions |
| Meta | subagent-builder | Creating/updating subagents, maintaining registry | Context7, Brave Search, Docfork |

## Agents by Category

### Backend

Backend agents handle server-side development, database design, API implementation, and backend service integration.

---

### Frontend

Frontend agents handle user interface development, component design, styling, accessibility, and client-side user experience.

#### supabase-backend-specialist

- **File:** `.claude/agents/backend/supabase-backend-specialist.md`
- **Purpose:** Comprehensive Supabase backend expert specializing in PostgreSQL database design, Row Level Security policies, authentication flows, storage management, realtime subscriptions, and Edge Functions development
- **When to Use:**
  - Designing database schemas with proper constraints and relationships
  - Implementing Row Level Security (RLS) policies with 2024-2025 best practices
  - Configuring Supabase Authentication (email/password, OAuth, magic links, SSO)
  - Managing Storage buckets with RLS policies and access control
  - Implementing Realtime subscriptions for live data updates
  - Developing and deploying Deno-based Edge Functions
  - Optimizing database performance with indexes and query analysis
  - Integrating Supabase with React/TypeScript frontend
  - Troubleshooting Supabase-related issues
  - Migrating or updating Supabase schemas
- **Technologies:**
  - PostgreSQL 15 & 17
  - Supabase JS Client v2.80.x
  - Row Level Security (RLS) with performance optimization
  - Supabase Auth (JWT, OAuth, Magic Links, SSO)
  - Supabase Storage (S3-compatible with RLS)
  - Supabase Realtime (Postgres Changes, Broadcast, Presence)
  - Edge Functions (Deno runtime, TypeScript)
  - Supabase MCP Server
- **Model:** `sonnet`
- **Tools:** Read, Edit, Write, Bash, Grep, Glob
- **Key Patterns:**
  - Performance-optimized RLS policies (specify roles, wrap auth.uid(), minimize joins)
  - Indexed foreign keys and RLS policy columns
  - Security definer functions for complex authorization
  - Profile creation triggers on user signup
  - User-scoped storage with folder-based RLS
  - Type-safe database operations with generated types
  - CORS-enabled Edge Functions with auth validation
- **Examples:**
  ```
  > Design a database schema for a multi-tenant application with RLS
  > Create RLS policies for a messaging system with room-based access
  > Implement OAuth authentication with Google and GitHub
  > Set up storage buckets for user avatars with RLS policies
  > Create an Edge Function for Stripe webhook handling
  > Optimize slow queries with proper indexes
  > Add realtime subscriptions for a collaborative editor
  ```

#### shadcn-ui-designer

- **File:** `.claude/agents/frontend/shadcn-ui-designer.md`
- **Purpose:** Expert in creating beautiful, accessible, and modular UI components using shadcn/ui with intelligent Tailwind CSS version detection (v3/v4), modern design patterns, theming, and comprehensive accessibility support
- **When to Use:**
  - Creating or customizing shadcn/ui components
  - Implementing modern UI/UX patterns (glassmorphism, micro-interactions, progressive disclosure)
  - Designing accessible interfaces (WCAG 2.1 Level AA)
  - Setting up theming with CSS variables and semantic colors
  - Implementing dark mode and multi-theme support
  - Working with Tailwind CSS configuration (v3 or v4)
  - Integrating Radix UI primitives
  - Creating responsive, mobile-first designs
  - Building design systems and component libraries
  - Troubleshooting UI component issues
  - Migrating between Tailwind v3 and v4
  - Using the shadcn MCP server for component discovery
- **Technologies:**
  - shadcn/ui (2024-2025 components)
  - Tailwind CSS v3.4.1 (with v4 migration support)
  - Radix UI primitives (accessible headless components)
  - React 18.3+ with TypeScript
  - Class Variance Authority (CVA) for variants
  - Lucide React icons
  - next-themes for dark mode
  - OKLCH color space (2025 best practice)
  - shadcn MCP server
- **Model:** `sonnet`
- **Tools:** Read, Write, Edit, Bash, Grep, Glob, shadcn MCP tools (get_project_registries, list_items, search_items, view_items, get_examples, get_add_command)
- **Key Features:**
  - **Automatic Tailwind Version Detection:** Detects v3 vs v4 and uses appropriate syntax
  - **MCP Integration:** Uses shadcn MCP server for accurate component source and examples
  - **Accessibility First:** WCAG 2.1 Level AA compliance, keyboard navigation, ARIA labels
  - **Modern Design Patterns:** Glassmorphism, micro-interactions, skeleton loading, progressive disclosure
  - **Responsive Design:** Mobile-first approach with touch-friendly targets
  - **Dark Mode:** Semantic CSS variables with automatic dark mode support
  - **Component Composition:** Wrapper components, custom variants, CVA patterns
  - **Performance:** Optimized animations, lazy loading, minimal layout shift
- **Tailwind v3 vs v4 Support:**
  - Detects version from package.json and config files
  - v3: JavaScript config, @tailwind directives, tailwindcss-animate plugin
  - v4: CSS-first config, @import "tailwindcss", @theme directive, tw-animate-css
  - Provides version-specific migration guidance
- **Design System Patterns:**
  - Semantic color tokens (primary, secondary, accent, destructive, muted)
  - CSS variable-based theming (HSL format)
  - OKLCH color space support (better perceptual uniformity)
  - Multi-theme support with data attributes
  - Component variant systems with CVA
- **Examples:**
  ```
  > Create a glassmorphism card component for the hero section
  > Add a dialog component for delete confirmation
  > Implement dark mode toggle with theme persistence
  > Create a responsive data table with filters
  > Build a multi-step form with validation
  > Set up theming with custom brand colors
  > Migrate our Tailwind configuration from v3 to v4
  > Create an accessible command palette (⌘K pattern)
  > Implement skeleton loading states
  > Design a mobile-first navigation menu
  ```

---

### Integration

Integration agents handle third-party service integrations, APIs, webhooks, and external platform connectivity.

#### boldsign-specialist

- **File:** `.claude/agents/integration/boldsign-specialist.md`
- **Purpose:** Expert in BoldSign e-signature API integration, embedded signing workflows, webhook handling, document automation, and real estate transaction signing features
- **When to Use:**
  - Implementing BoldSign API calls and OAuth 2.0 authentication
  - Setting up embedded signing interfaces (iframe/SDK)
  - Configuring webhook handlers for document status events
  - Creating document templates with form field pre-filling
  - Implementing sequential/parallel signing workflows
  - Building automatic signed PDF download systems
  - Troubleshooting BoldSign API issues or webhook failures
  - Optimizing real estate document workflows (purchase agreements, disclosures)
  - Configuring sender identities and custom branding
  - Setting up automated reminders and document expiration
- **Technologies:**
  - BoldSign API v1 (2024-2025)
  - OAuth 2.0 client credentials flow
  - HMAC-SHA256 webhook signature verification
  - Supabase Edge Functions (Deno runtime)
  - Supabase Storage for signed PDF archival
  - React embedded signing components
- **Model:** `sonnet`
- **Tools:** Read, Write, Edit, Bash, Grep, Glob
- **Key Patterns:**
  - OAuth token caching (1-hour TTL) to minimize token requests
  - HMAC-SHA256 signature verification for all webhooks
  - Idempotency in webhook handlers to prevent duplicate processing
  - Sequential signing for purchase agreements (buyer first, seller second)
  - Form field pre-filling from transaction data
  - Automatic signed PDF download on `document.completed` event
  - Embedded signing with iframe and postMessage communication
- **Examples:**
  ```
  > Implement BoldSign document sending with sequential signing for purchase agreements
  > Set up webhook handler to automatically download signed PDFs
  > Create embedded signing component for in-app signature collection
  > Configure document templates with form field pre-filling
  > Troubleshoot webhook signature verification issues
  > Implement automated reminders for pending signatures
  > Set up sender identities for agent branding
  ```

#### stripe-specialist

- **File:** `.claude/agents/integration/stripe-specialist.md`
- **Purpose:** Comprehensive Stripe payment processing expert for Payment Intents, Subscriptions, Checkout, secure webhook handling, and React Stripe Elements integration with PCI compliance
- **When to Use:**
  - Implementing one-time payments with Payment Intents API
  - Building subscription systems with recurring billing
  - Setting up Stripe Checkout for hosted payment pages
  - Creating secure webhook handlers with signature verification
  - Integrating Stripe Elements in React components
  - Handling payment failures, refunds, and disputes
  - Implementing trial periods and subscription proration
  - Managing customer payment methods and saved cards
  - Processing partial captures and authorization holds
  - Handling 3D Secure authentication challenges
  - Syncing Stripe data with Supabase database
  - Implementing customer billing portals
  - Troubleshooting Stripe integration issues
  - Ensuring PCI DSS compliance
- **Technologies:**
  - Stripe API 2024-11-20 or latest
  - Payment Intents API (SCA-ready)
  - Subscriptions & Billing API
  - Stripe Checkout Sessions
  - Stripe Webhooks with signature verification
  - @stripe/stripe-js (client-side)
  - @stripe/react-stripe-js (React components)
  - Stripe CLI for local testing
  - Supabase Edge Functions (Deno) for webhooks
  - TypeScript with Stripe type definitions
- **Model:** `sonnet`
- **Tools:** Read, Edit, Write, Bash, Grep, Glob
- **Key Patterns:**
  - Server-side Payment Intent creation, client-side confirmation
  - Webhook-driven order fulfillment (never client-side only)
  - `express.raw()` middleware for webhook routes (NOT `express.json()`)
  - Signature verification with `stripe.webhooks.constructEvent()`
  - Idempotent webhook handlers to prevent duplicate processing
  - Stripe customer IDs linked to Supabase user IDs
  - Subscription status synced to database via webhooks
  - Payment Element for multi-payment-method support
  - 3D Secure handled automatically by Stripe.js
  - Test mode with test cards and Stripe CLI locally
  - Environment variables for all API keys
  - Proper error handling for card declines and failures
- **Examples:**
  ```
  > Implement Payment Intent flow with React Stripe Elements
  > Create subscription checkout with trial period
  > Set up webhook handler in Supabase Edge Function
  > Build customer billing portal for subscription management
  > Handle failed payment recovery flow
  > Implement Stripe Checkout for one-time payments
  > Add support for saving payment methods for future use
  > Create proration logic for subscription upgrades/downgrades
  > Implement partial capture for order modifications
  > Set up test environment with Stripe CLI
  ```

---

### Meta

Meta-agents are responsible for managing and maintaining the subagent system itself, as well as providing specialized research capabilities.

#### claude-hook-specialist

- **File:** `.claude/agents/meta/claude-hook-specialist.md`
- **Purpose:** Expert in Claude Code Hooks for creating, debugging, optimizing, and securing hook scripts that control Claude Code's behavior at specific lifecycle events
- **When to Use:**
  - Creating new hooks for automation (formatting, testing, validation)
  - Debugging hooks that aren't firing or working correctly
  - Optimizing slow hooks with caching, parallelization, or background execution
  - Security reviewing hooks for dangerous patterns
  - Converting natural language workflows to hook implementations
  - Setting up project-specific hook configurations
  - Learning about Claude Code hooks and their capabilities
  - Enforcing coding standards automatically
  - Blocking dangerous operations (rm -rf, production access)
  - Running end-of-turn quality gates
- **Technologies:**
  - All 8 Claude Code hook events (SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Notification, Stop, SubagentStop, SessionEnd)
  - Hook configuration (.claude/settings.json)
  - Python (most common for hooks)
  - Bash (simple hooks)
  - TypeScript with Bun (type-safe hooks)
  - Prettier, ESLint, tsc (for TypeScript projects)
  - Black, Ruff (for Python projects)
  - SwiftFormat, SwiftLint (for Swift projects)
- **Model:** `sonnet`
- **Tools:** Read, Write, Edit, Bash, Grep, Glob
- **Knowledge Base:** Comprehensive hooks research document at `/Docs/Claude_Code/Research/Hooks/hooks-research.md`
- **Key Capabilities:**
  - **Hook Recommendations:** Project-type-specific setups (TypeScript, Python, Swift, Flutter, React)
  - **Script Generation:** Complete hook scripts with error handling, security validations, correct exit codes
  - **Debugging Support:** Diagnostic checklists for hooks not firing, permission errors, timeouts
  - **Performance Optimization:** SHA256 caching (<5ms), parallelization, background execution, debouncing
  - **Security Reviews:** Input validation, path sanitization, dangerous operation blocking, production protection
  - **Workflow Conversion:** Natural language → working hook implementations
- **Hook Event Types:**
  - **SessionStart:** Load context, install dependencies, set environment
  - **UserPromptSubmit:** Add context, inject instructions before Claude sees prompt
  - **PreToolUse:** Block dangerous operations, validate inputs (exit 2 creates feedback loop)
  - **PostToolUse:** Auto-format code, run tests, log actions
  - **Stop:** End-of-turn quality gates, run full test suites, commit changes
  - **Notification:** Custom notification routing, logging
  - **SubagentStop:** Subagent-specific cleanup
  - **SessionEnd:** Save state, export logs, cleanup
- **Exit Code Behaviors:**
  - 0: Success, continue (stdout ignored except UserPromptSubmit/SessionStart)
  - 1: Non-blocking warning (stderr shown to user, continue)
  - 2: BLOCKING error (halt operation, stderr fed to Claude for retry)
- **Examples:**
  ```
  > Create a hook to auto-format TypeScript files with Prettier
  > Set up hooks to block dangerous Bash commands
  > Debug why my PostToolUse hook isn't firing
  > Optimize this slow validation hook
  > Convert "always run tests after editing" to a hook
  > What hooks should I use for a React/TypeScript project?
  > Create a hook to prevent writes to production paths
  > Set up end-of-turn quality gates for type checking and linting
  ```

#### claude-maintainer

- **File:** `.claude/agents/meta/claude-maintainer.md`
- **Purpose:** CLAUDE.md optimization and maintenance specialist that reviews, optimizes, and maintains CLAUDE.md files following research-backed best practices to prevent context pollution and ensure performance as codebases grow
- **When to Use:**
  - Reviewing CLAUDE.md for optimization opportunities
  - Analyzing CLAUDE.md for stale or outdated content
  - Ensuring CLAUDE.md follows best practices (<100 lines, mandatory delegation, anti-patterns)
  - Identifying anti-patterns to add based on codebase analysis
  - Creating modular CLAUDE.md structure for growing projects
  - Regular maintenance (weekly for active projects, monthly for stable)
  - After major architectural changes or refactors
  - When Claude Code performance degrades or context seems polluted
  - Before onboarding new team members
  - Post-session to capture learnings in CLAUDE.md
- **Technologies:**
  - Best Practices Research Documentation
  - CLAUDE.md analysis and optimization
  - Glob for project structure analysis
  - Grep for anti-pattern detection
  - @import syntax for modular organization
- **Model:** `sonnet`
- **Tools:** Read, Edit, Write, Glob, Grep
- **Key Capabilities:**
  - **Health Assessment:** Scores CLAUDE.md on 0-100 scale across 6 dimensions (length, delegation, anti-patterns, freshness, project-specificity, modularity)
  - **Stale Content Detection:** Identifies outdated APIs, deprecated patterns, fixed issues still documented
  - **Anti-Pattern Mining:** Greps codebase for common mistakes and suggests adding to CLAUDE.md
  - **Length Optimization:** Recommends content to move to external docs, keeping CLAUDE.md under 100 lines
  - **Delegation Enhancement:** Ensures mandatory language and proactive triggers for subagents
  - **Modular Organization:** Designs hierarchical CLAUDE.md structure for large projects
  - **Structured Reporting:** Provides actionable recommendations with before/after comparisons and rationale
  - **Maintenance Scheduling:** Recommends review frequency based on project activity
- **Best Practices Applied:**
  - Keep CLAUDE.md under 100 lines (70-100 ideal) for optimal performance
  - Use mandatory language ("MUST", "REQUIRED", "CRITICAL") for subagent delegation
  - Include project-specific anti-patterns section
  - Use @import syntax for external documentation
  - Focus on project-specific patterns, not general knowledge
  - Regular maintenance (weekly for active projects)
  - Version control all changes
  - Document reasoning for key patterns
- **Output Format:**
  - Section 1: Health Assessment (line count, best practices score, overall health, critical issues)
  - Section 2: Findings (what's working, what needs improvement, stale content, missing elements)
  - Section 3: Recommendations (prioritized: Critical/High/Medium/Low)
  - Section 4: Proposed Changes (before/after comparisons with rationale and expected impact)
- **Examples:**
  ```
  > Review our CLAUDE.md and provide optimization recommendations
  > Analyze CLAUDE.md for stale content and performance issues
  > Optimize CLAUDE.md following best practices
  > What anti-patterns should we add to CLAUDE.md based on our codebase?
  > Is our CLAUDE.md too long? How can we streamline it?
  > Create a modular CLAUDE.md structure for our growing project
  > Check if CLAUDE.md reflects our latest architectural changes
  > Prepare CLAUDE.md for weekly review
  ```

#### eslint-code-quality-specialist

- **File:** `.claude/agents/meta/eslint-code-quality-specialist.md`
- **Purpose:** ESLint and code quality specialist that systematically fixes TypeScript `any` types, React Hook dependency arrays, unused variables, and enforces best practices across frontend and backend code
- **When to Use:**
  - Fixing ESLint errors reported by `npm run lint`
  - Replacing `any` types with proper TypeScript types or `unknown`
  - Fixing React Hook exhaustive-deps warnings
  - Removing unused variables and imports
  - Improving code quality and type safety
  - Before code reviews or pull requests
  - After adding new features with type safety issues
  - Cleaning up technical debt related to type safety
  - Enforcing TypeScript strict mode compliance
  - Preparing codebase for production deployment
- **Technologies:**
  - ESLint with @typescript-eslint/parser
  - @typescript-eslint/no-explicit-any rule
  - react-hooks/exhaustive-deps rule
  - TypeScript 5.5+ (any vs unknown, type guards)
  - React 18.3+ Hooks (useState, useEffect, useCallback, useMemo)
  - Deno runtime for Edge Functions
  - Vite build tool
- **Model:** `sonnet`
- **Tools:** Read, Edit, Write, Bash, Grep, Glob
- **Key Capabilities:**
  - **Systematic Analysis:** Categorizes ESLint errors by type and severity before fixing
  - **Intelligent Type Replacement:** Knows when to use proper types vs `unknown` vs legitimate `any`
  - **React Hook Expertise:** Applies exhaustive-deps fixes (add dependencies, move functions inside, useCallback)
  - **Type Safety Decision Tree:** Documents reasoning for type choices
  - **Incremental Testing:** Tests changes after each batch of fixes
  - **Supabase Pattern Awareness:** Ensures real-time subscriptions have cleanup functions
  - **Deno/Edge Function Support:** Handles Deno-specific types and patterns
  - **Documentation:** Adds clear comments when eslint-disable is legitimately needed
- **Type Decision Patterns:**
  - Event handlers: Use proper React event types (ChangeEvent, MouseEvent, FormEvent)
  - Catch blocks: Use `unknown` with `instanceof Error` type guard
  - API responses: Create interfaces or use `unknown` with runtime validation
  - Webhook payloads: Document if `any` is kept (e.g., "100+ Stripe event types")
  - Third-party libraries: Use `any` with comment if no @types available
- **Hook Dependency Fixes:**
  - Add missing dependencies (preferred solution)
  - Move function definitions inside useEffect
  - Wrap callbacks with useCallback for stable references
  - Only disable rule when intentionally one-time (with comment)
- **Examples:**
  ```
  > Fix all ESLint errors in the codebase
  > Replace any types in src/components/documents/ with proper types
  > Fix exhaustive-deps warnings in useTransactions hook
  > Clean up unused imports across the project
  > Review and fix type safety issues before deployment
  > Fix ESLint errors in Supabase Edge Functions
  > Replace any types in event handlers with proper React types
  ```

#### github-specialist

- **File:** `.claude/agents/meta/github-specialist.md`
- **Purpose:** Git and GitHub workflow specialist for intelligent Git operations, conventional commits, comprehensive pull requests, code review, and GitHub CLI automation
- **When to Use:**
  - Analyzing committed and uncommitted changes with git status/diff
  - Creating atomic commits with conventional commit messages
  - Generating pull requests with comprehensive descriptions
  - Managing branches (create, switch, merge, rebase)
  - Reviewing code changes and providing feedback
  - Using GitHub CLI for PR/issue management
  - Detecting and preventing secret commits (API keys, .env files)
  - Grouping related changes for logical commits
  - Linking commits/PRs to issues
  - Handling merge conflicts
  - Managing GitHub Actions workflows
  - Creating changelogs from commit history
  - Enforcing commit message standards
  - Suggesting reviewers based on changed files
- **Technologies:**
  - Git (all operations: commit, branch, merge, rebase, diff, log)
  - GitHub CLI (gh) for PR, issue, review, workflow management
  - Conventional Commits specification (feat, fix, docs, refactor, etc.)
  - GitHub Actions (workflow viewing, re-running, log analysis)
  - Secret detection patterns (API keys, tokens, credentials)
  - Bash for git commands and automation
- **Model:** `sonnet`
- **Tools:** Bash, Read, Grep, Glob, Edit, Write
- **Key Patterns:**
  - **Smart Change Analysis:** Run git status/diff/log before any commit to understand full context
  - **Conventional Commits:** `type(scope): description` format with proper types (feat, fix, docs, etc.)
  - **Atomic Commits:** Each commit is self-contained, functional, and reviewable
  - **Secret Detection:** Scan for API keys, tokens, .env files before staging
  - **Logical Grouping:** Separate feature work, bug fixes, refactors, docs, tests
  - **Comprehensive PRs:** Include Summary, Motivation, Changes, Test Plan, Related Issues
  - **Issue Linking:** Use "Closes #123", "Fixes #456", "Relates to #789"
  - **GitHub CLI First:** Use gh for all GitHub operations (not direct API)
  - **Branch Naming:** feat/, fix/, refactor/, docs/, chore/, hotfix/ prefixes
  - **Code Review:** Use gh pr review with actionable feedback
  - **Claude Attribution:** Include co-author line in commits
- **Conventional Commit Types:**
  - `feat` - New feature (user-facing functionality)
  - `fix` - Bug fix
  - `docs` - Documentation only
  - `style` - Code formatting (whitespace, semicolons)
  - `refactor` - Code refactoring without behavior change
  - `perf` - Performance improvements
  - `test` - Test additions/updates
  - `build` - Build system or dependency changes
  - `ci` - CI/CD configuration changes
  - `chore` - Maintenance tasks
- **Project-Specific Scopes:**
  - auth, transactions, documents, tasks, contacts
  - stripe, boldsign, supabase
  - ui, hooks, types, config
- **Security Checks:**
  - NEVER commit .env files, credentials.json, secrets files
  - Scan diffs for API keys, tokens, passwords
  - Warn user immediately if secrets detected
  - Verify .gitignore includes sensitive patterns
- **Git Safety:**
  - NEVER skip git hooks (--no-verify)
  - NEVER force push to main/master without confirmation
  - ALWAYS verify branch before destructive operations
  - ALWAYS respect pre-commit/pre-push hooks
- **Examples:**
  ```
  > Create commits for my current changes
  > Generate a pull request for this feature branch
  > Review the changes in PR #42
  > Help me resolve this merge conflict
  > Create a branch for fixing the login bug
  > Link this commit to issue #123
  > What commits are in this branch since main?
  > Check if I'm about to commit any secrets
  > Merge this PR with squash strategy
  > Generate a changelog from recent commits
  ```

#### research-specialist

- **File:** `.claude/agents/meta/research-specialist.md`
- **Purpose:** Autonomous research expert that leverages Context7, Docfork, Brave Search, and Perplexity to conduct comprehensive technical research, validate information across multiple sources, and deliver structured analysis with proper citations
- **When to Use:**
  - Learning new libraries or frameworks
  - Debugging complex errors or issues
  - Evaluating technologies for project selection
  - Researching implementation approaches for new features
  - Staying current with framework/library updates
  - Comparing alternative solutions or approaches
  - Finding best practices for specific patterns
  - Validating technical claims or approaches
  - Synthesizing information from multiple sources
  - Building comprehensive implementation guides
- **Technologies:**
  - Context7 MCP (official library documentation)
  - Docfork MCP (GitHub docs and code examples)
  - Brave Search MCP (web, news, video search)
  - Perplexity MCP (AI research and reasoning)
- **Model:** `sonnet`
- **Tools:** mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__Docfork__docfork_search_docs, mcp__Docfork__docfork_read_url, mcp__brave-search__brave_web_search, mcp__brave-search__brave_news_search, mcp__brave-search__brave_video_search, mcp__plugin_perplexity_perplexity__perplexity_search, mcp__plugin_perplexity_perplexity__perplexity_ask, mcp__plugin_perplexity_perplexity__perplexity_research, mcp__plugin_perplexity_perplexity__perplexity_reason
- **Key Capabilities:**
  - **Intelligent Tool Selection:** Automatically chooses optimal tools based on query intent
  - **Multi-Tool Workflows:** Combines Context7 (official docs), Docfork (examples), Brave (community), Perplexity (synthesis)
  - **Source Quality Scoring:** Evaluates sources on reputation, recency, authority (50-100 scale)
  - **Cross-Validation:** Verifies critical information across 2+ independent sources
  - **Consensus Building:** Identifies agreement/conflicts, calculates confidence scores
  - **Citation Management:** Tracks and attributes all information with URLs
  - **Structured Reporting:** Delivers findings in actionable format with recommendations
- **Research Workflows:**
  - **Learning:** Context7 (official API) → Docfork (examples) → Perplexity (best practices) → Brave (tutorials)
  - **Debugging:** Brave (error search) → Brave (discussions) → Perplexity Reason (diagnosis) → Context7 (official fixes)
  - **Evaluation:** Perplexity Ask (overview) → Perplexity Research (comparison) → Brave News (updates) → Context7 (capabilities)
  - **Implementation:** Context7 (API docs) → Docfork (real code) → Perplexity Research (practices) → Brave (tutorials)
  - **Staying Current:** Brave News (updates) → Brave Web (breaking changes) → Perplexity Research (analysis)
- **Examples:**
  ```
  > Research the latest React hooks best practices for 2025
  > Compare Supabase vs Firebase for real-time features in our use case
  > Find implementation examples for Stripe subscription webhooks
  > Debug this Supabase connection timeout error
  > Evaluate BoldSign API for e-signature integration
  > What are the latest updates in Next.js 15?
  > Research webhook security best practices for payment processors
  > How should I implement real-time subscriptions with RLS?
  ```

#### script-writer-specialist

- **File:** `.claude/agents/meta/script-writer-specialist.md`
- **Purpose:** Expert automation script architect specializing in TypeScript-native development scripts, custom ESLint plugins, Vitest integration tests, pgTAP database tests, and CI/CD workflows for React + TypeScript + Vite + Supabase projects
- **When to Use:**
  - Creating automation scripts for code quality analysis (complexity, dead code, theme consistency)
  - Building custom ESLint plugins and rules for project-specific patterns
  - Writing Vitest integration tests for Supabase, real-time subscriptions, or API testing
  - Developing pgTAP tests for database schemas, RLS policies, and constraints
  - Generating GitHub Actions CI/CD workflows for testing and deployment
  - Implementing ts-morph-based code analysis tools (AST manipulation)
  - Creating pre-commit hooks for code formatting and validation
  - Building bundle size analyzers and performance monitors
  - Setting up accessibility testing automation with Pa11y or axe-core
  - Creating test generators or scaffolding scripts
  - Optimizing existing scripts for performance or maintainability
  - Adding configuration systems to scripts (JSON/YAML config support)
- **Technologies:**
  - ts-morph 21+ (TypeScript AST manipulation and analysis)
  - Vitest (latest) with React Testing Library
  - @typescript-eslint/utils 8+ (custom ESLint rule creation)
  - pgTAP (PostgreSQL testing framework for Supabase)
  - GitHub Actions (CI/CD workflows)
  - TypeScript 5.5+ with strict mode
  - Node.js ESM modules
  - tsx (TypeScript execution)
  - Vite build tooling and plugins
  - rollup-plugin-visualizer (bundle analysis)
- **Model:** `sonnet`
- **Tools:** Read, Write, Edit, Bash, Grep, Glob, mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__brave-search__brave_web_search, mcp__Docfork__docfork_search_docs, mcp__Docfork__docfork_read_url
- **Key Capabilities:**
  - **Research-Driven Development:** Uses MCP tools to research latest best practices and API versions before creating scripts
  - **TypeScript-Native:** All scripts written in TypeScript with strict type checking, proper error handling, and modern ESM patterns
  - **Analysis-Then-Manipulate Pattern:** Follows ts-morph performance best practice of separating analysis and manipulation phases
  - **Actionable Output:** Scripts provide file paths, line numbers, severity levels, and specific suggestions (not just pass/fail)
  - **Configuration-Driven:** Supports JSON/YAML config files and CLI arguments for thresholds and behavior
  - **CI/CD Integration:** Proper exit codes (0=success, 1=warning, 2=error), JSON output for parsing, GitHub Actions workflows
  - **npm Integration:** Adds scripts to package.json with clear naming conventions
  - **Comprehensive Documentation:** Includes README with usage examples, configuration options, and troubleshooting
- **Script Types:**
  - **Code Analysis:** Component complexity analyzers, theme consistency checkers, dead code detectors
  - **Custom ESLint Rules:** Project-specific linting (theme tokens, component patterns, accessibility)
  - **Vitest Tests:** Supabase integration tests, RLS policy validation, real-time subscription tests
  - **pgTAP Tests:** Database schema validation, constraint checking, RLS policy testing
  - **CI/CD Workflows:** GitHub Actions for lint, test, build, deploy with caching and matrix builds
  - **Bundle Analysis:** Size monitoring, chunk analysis, performance budgets
  - **Pre-commit Hooks:** Auto-formatting, type checking, test running
- **Best Practices Applied:**
  - Strict TypeScript mode (no `any` types)
  - Separation of concerns (config, analysis, formatting, output)
  - Error handling with helpful messages
  - Performance optimization (caching, parallelization, incremental analysis)
  - Testing for script validation
  - Logging to stderr (errors) and stdout (results)
  - Version-aware (uses 2024-2025 library APIs)
- **Examples:**
  ```
  > Create a script to detect React components with high cyclomatic complexity
  > Build a custom ESLint plugin to enforce semantic Tailwind color tokens
  > Write Vitest integration tests for Supabase RLS policies
  > Generate a pgTAP test suite for the transactions table schema
  > Create a GitHub Actions workflow for running tests on PR
  > Build a bundle size checker with configurable thresholds
  > Create a pre-commit hook to run Prettier and ESLint
  > Write a script to detect unused React hooks in components
  > Set up accessibility testing automation with Pa11y
  > Create a theme consistency analyzer for Tailwind classes
  ```

#### subagent-builder

- **File:** `.claude/agents/meta/subagent-builder.md`
- **Purpose:** Expert subagent architect that researches, designs, and creates high-quality subagents based on current best practices and latest API versions
- **When to Use:**
  - Creating new subagents for specific tasks or domains
  - Updating existing agents when APIs or frameworks change
  - Maintaining the agent registry (agent-index.md)
  - Ensuring agents follow project templates and standards
  - Researching latest best practices for agent domains
  - Auditing agents for outdated patterns or APIs
- **Technologies:** Context7 MCP, Brave Search MCP, Docfork MCP, all project documentation
- **Model:** `sonnet`
- **Tools:** Read, Write, Edit, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__brave-search__brave_web_search, mcp__Docfork__docfork_search_docs, mcp__Docfork__docfork_read_url
- **Examples:**
  ```
  > Create a subagent for Stripe payment processing
  > Update the React testing agent to use the latest Testing Library patterns
  > Refresh the agent index with current best practices
  > Create a Supabase Edge Functions specialist agent
  ```

---

## Integration Patterns

### Automatic Delegation

Agents with "Use PROACTIVELY" in their descriptions are automatically invoked when Claude detects matching tasks. The subagent-builder, for example, is automatically used when you request agent creation or updates.

### Explicit Invocation

You can directly request any agent:
```
> Use the [agent-name] subagent to [task]
```

### Chaining Agents

For complex workflows, chain multiple agents:
```
> First use the subagent-builder to create a testing agent, then use that new agent to write tests
```

## Best Practices

### Using Subagents Effectively

1. **Trust proactive delegation** - Agents with clear descriptions are invoked automatically
2. **Be specific in requests** - Mention the task type to help agent selection
3. **Review agent outputs** - Subagents return detailed summaries of their work
4. **Chain when appropriate** - Some workflows benefit from multiple specialized agents

### Creating New Agents

1. **Start with subagent-builder** - Let it research and design the agent
2. **Be specific about domain** - Clear purpose leads to better agent design
3. **Request technology research** - Ensure agents use current best practices
4. **Review the template** - Understand the structure before customizing
5. **Test thoroughly** - Invoke new agents with representative tasks

### Maintaining Agents

1. **Regular audits** - Review agents quarterly for outdated patterns
2. **Update for new APIs** - When frameworks update, update relevant agents
3. **Keep registry current** - Always update agent-index.md with changes
4. **Version control** - Commit agents to git for team collaboration
5. **Document changes** - Note what was updated and why

## Development Workflow Integration

### Planning Phase

Use the subagent-builder to create specialized agents for your project's unique needs:
- Domain-specific specialists (Stripe, Supabase, etc.)
- Workflow automators (testing, deployment, etc.)
- Quality assurance agents (review, security, etc.)

### Implementation Phase

Invoke specialized agents as you work:
- Backend agents for API development
- Frontend agents for UI implementation
- Database agents for schema design

### Maintenance Phase

Use meta-agents to keep the system current:
- Update agents when technologies evolve
- Audit for deprecated patterns
- Refresh documentation and best practices

## Agent Categories

Current categories in use:

- **meta** - Agents that manage other agents and the subagent system
- **backend** - Server-side development, APIs, business logic
- **frontend** - UI/UX, components, client-side logic
- **database** - Schema design, queries, optimization
- **integration** - Third-party services, APIs, webhooks
- **testing** - Test creation, quality assurance, validation
- **documentation** - Technical writing, API docs, guides

## Adding New Agents

To add a new agent to this registry:

1. Create the agent file in `.claude/agents/[category]/[name].md`
2. Follow the template in `Docs/Claude_Code/Subagent-Development-Template.md`
3. Update this index with a new entry
4. Commit both files to version control

Or simply:
```
> Use the subagent-builder to create a new [domain] specialist agent
```

The subagent-builder will handle research, creation, and registry updates automatically.

## Resources

- **Template:** `Docs/Claude_Code/Subagent-Development-Template.md`
- **Official Docs:** `Docs/Claude_Code/Subagents.md`
- **Project Docs:** `Docs/` directory for domain-specific context
- **Agent Files:** `.claude/agents/` directory

---

*This index is maintained by the subagent-builder agent. For updates or corrections, use the subagent-builder to modify this file.*
