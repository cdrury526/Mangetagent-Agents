---
description: Review the most recent session context file and summarize work progress
allowed-tools: Bash(find:*), Bash(ls:*), Read, Glob
---

# Review Session Context

This command reads the most recent context file and provides a comprehensive summary of what was being worked on.

## Find Most Recent Context File

- List context files (newest first): !`ls -t /Users/chrisdrury/Dev/Bolt-Magnet-Agent-2025/Docs/Context/context-*.json 2>/dev/null | head -1`

## Your Task

You are reviewing a previous Claude Code session to understand what was being worked on and what needs to happen next.

### Step 1: Read the Context File

1. Read the most recent context file from the path shown above
2. If no context files exist, inform the user that no previous sessions have been saved
3. Parse the JSON structure to extract all key information

### Step 2: Provide Comprehensive Summary

Present a well-organized summary that includes:

#### Session Overview
- **Subject:** What was being worked on
- **Goal:** The objective of the session
- **Priority:** High/Medium/Low
- **Timestamp:** When the context was saved
- **Duration:** Estimated vs actual time (if available)
- **Model Used:** Which Claude model was used

#### Files Modified
List all files that were created, modified, or deleted, with descriptions of what changed:
```
✏️  src/pages/Pricing.tsx - Added Stripe Checkout button for subscription plans
📝 src/components/ui/Button.tsx - Enhanced button component with loading state
```

#### Documentation Referenced
List all documentation files that were consulted or updated:
```
📚 Docs/Stripe/Stripe-Integration.md - Referenced webhook signature verification pattern
```

#### Plan & Progress
- **Approach:** High-level strategy that was used
- **Steps Completed:** Which plan steps are done (with ✅)
- **Steps In Progress:** What's currently being worked on (with 🔄)
- **Steps Blocked:** What's blocked and why (with 🚫)

#### Decisions Made
For each key decision:
- What was decided
- Why (rationale)
- What alternatives were considered
- Expected impact

Example:
```
📌 Decision: Use Stripe Checkout instead of Payment Intents
   Rationale: Checkout handles more edge cases and provides better UX
   Alternatives: Payment Intents, Payment Links
   Impact: Simpler implementation, less custom code to maintain
```

#### Current Blockers
For any unresolved blockers:
- **Issue description**
- **Severity:** High/Medium/Low
- **Solutions attempted**
- **Current status:** Investigating/Solution found/Resolved

Highlight high-severity blockers with ⚠️ or 🚨

#### Subagents Used
List any specialized subagents that were delegated work:
```
🤖 stripe-specialist - Implemented webhook signature verification
🤖 supabase-backend-specialist - Created RLS policies for subscriptions table
```

#### Testing Status
- Unit tests: ✅ Passed / ❌ Failed / ⚪ Not run / N/A
- Integration tests: ✅ Passed / ❌ Failed / ⚪ Not run / N/A
- Manual testing: Description of what was tested
- Edge cases covered: List of edge cases tested

#### Knowledge Gained
Any lessons learned or insights from the session:
```
💡 Stripe webhooks retry up to 3 days if endpoint returns non-200 status
💡 BoldSign OAuth tokens expire after 1 hour and need refresh
```

#### Next Steps (Prioritized)

List all next steps in priority order with:
- **Action:** Specific task to do
- **Priority:** 🔴 High / 🟡 Medium / 🟢 Low
- **Assigned to:** Who/what should handle this
- **Estimated effort:** Time in hours
- **Dependencies:** What needs to happen first (if any)
- **Success criteria:** How to know it's done

Example:
```
1. 🔴 Deploy Stripe webhook Edge Function to production
   Assigned to: human
   Effort: 0.5 hours
   Dependencies: None
   Success: Production webhook receives and processes events successfully

2. 🟡 Add unit tests for webhook signature verification
   Assigned to: agent
   Effort: 1 hour
   Dependencies: Step 1 complete
   Success: All edge cases covered, tests passing
```

#### Session Summary

Present the 1-2 paragraph summary from the context file that provides the complete picture.

### Step 3: Recommendations

Based on the context, provide:
1. **What to focus on first** - Highest priority unblocked task
2. **Any urgent blockers** - Issues that need immediate attention
3. **Suggested approach** - How to tackle the next steps efficiently
4. **Subagent recommendations** - Which specialists to delegate to

### Output Format

Use clear headers, emojis for visual scanning, and proper markdown formatting to make the summary easy to read and actionable.

If the context file has any validation warnings (e.g., missing fields), note them at the end but still provide as much information as possible from the available data.
