# Perplexity - AI-Powered Research Assistant

## Overview

Perplexity is an AI-powered research MCP server that provides four specialized capabilities: conversational queries, deep research with citations, reasoning tasks, and traditional search. It excels at synthesizing information from multiple sources, answering complex questions, and providing comprehensive analysis with proper attribution.

## Core Functions

### 1. `perplexity_search` - Web Search
Traditional search with ranked results

### 2. `perplexity_ask` - Conversational Queries
Quick Q&A with AI synthesis

### 3. `perplexity_research` - Deep Research
Comprehensive research reports with citations

### 4. `perplexity_reason` - Reasoning Tasks
Complex reasoning and analysis

## Function Details

### `perplexity_search`

**Primary Use**: Finding specific facts, recent information, or targeted queries

```typescript
mcp__plugin_perplexity_perplexity__perplexity_search({
  query: string,                    // Required: Search query
  max_results?: number,             // Optional: 1-20 (default: 10)
  max_tokens_per_page?: number,     // Optional: 256-2048 (default: 1024)
  country?: string                  // Optional: ISO 3166-1 alpha-2 code
})
```

**Returns**: Ranked search results with:
- Title
- URL
- Snippet/excerpt
- Metadata (date, source, etc.)

**Examples**:

```typescript
// Find specific information
await perplexity_search({
  query: "BoldSign API integration best practices",
  max_results: 5
})

// Regional search
await perplexity_search({
  query: "Stripe payment regulations",
  country: "US",
  max_results: 10
})

// Deep page extraction
await perplexity_search({
  query: "webhook security patterns",
  max_tokens_per_page: 2048,
  max_results: 5
})
```

**Response Format**:

```javascript
{
  "results": [
    {
      "title": "Result Title",
      "url": "https://...",
      "snippet": "Excerpt from the page...",
      "date": "2025-11-23",
      "source": "domain.com"
    }
  ]
}
```

### `perplexity_ask`

**Primary Use**: Quick conversational queries, direct answers, clarifications

```typescript
mcp__plugin_perplexity_perplexity__perplexity_ask({
  messages: [
    { role: "user", content: "Your question here" }
  ]
})
```

**Message Format**:
```typescript
{
  role: "user" | "assistant" | "system",
  content: string
}
```

**Examples**:

```typescript
// Quick technical question
await perplexity_ask({
  messages: [{
    role: "user",
    content: "What are the key differences between Supabase and Firebase real-time features?"
  }]
})

// Follow-up conversation
await perplexity_ask({
  messages: [
    { role: "user", content: "How do React hooks work?" },
    { role: "assistant", content: "React hooks are functions..." },
    { role: "user", content: "Can you give an example of useEffect?" }
  ]
})

// Specific technical query
await perplexity_ask({
  messages: [{
    role: "user",
    content: "Explain HMAC signature verification for webhooks in simple terms"
  }]
})
```

**Response Format**:

```javascript
{
  "response": "Direct answer with inline citations[1][2]...\n\nCitations:\n[1] https://...\n[2] https://..."
}
```

**Key Features**:
- **Conversational**: Supports multi-turn dialogue
- **Fast**: Optimized for quick responses
- **Cited**: Includes source references
- **Concise**: Focused answers

### `perplexity_research`

**Primary Use**: Comprehensive research, comparative analysis, best practices, in-depth investigations

```typescript
mcp__plugin_perplexity_perplexity__perplexity_research({
  messages: [
    { role: "user", content: "Research query" }
  ],
  strip_thinking?: boolean          // Optional: Remove <think> tags (default: false)
})
```

**Examples**:

```typescript
// Deep research on best practices
await perplexity_research({
  messages: [{
    role: "user",
    content: "What are the latest webhook security best practices for payment processors like Stripe in 2025?"
  }]
})

// Comparative analysis
await perplexity_research({
  messages: [{
    role: "user",
    content: "Compare Supabase vs Firebase: architecture, performance, pricing, and use cases"
  }]
})

// Technology evaluation
await perplexity_research({
  messages: [{
    role: "user",
    content: "Evaluate BoldSign API for e-signature integration: features, pricing, pros/cons vs competitors"
  }]
})

// Implementation guidance
await perplexity_research({
  messages: [{
    role: "user",
    content: "How should I implement real-time subscriptions in a React app using Supabase? Include best practices, common pitfalls, and code patterns."
  }]
})
```

**Response Format**:

Based on my testing, Perplexity Research returns **comprehensive reports** with:

1. **Thinking Process** (optional):
   - Wrapped in `<think>` tags
   - Shows reasoning and analysis
   - Can be stripped with `strip_thinking: true`

2. **Main Content**:
   - Structured analysis
   - Multiple sections/headings
   - Detailed explanations
   - Code examples (when relevant)

3. **Citations**:
   - Inline references [1][2][3]
   - Full citation list at end
   - URLs with titles

**Example Response Structure**:

```markdown
<think>
Analysis of the query...
Key themes identified...
Sources reviewed...
</think>

# Main Topic

## Section 1: Overview
Comprehensive explanation with citations[1][2]...

## Section 2: Key Features
Detailed analysis with examples[3][4]...

## Section 3: Best Practices
- Practice 1 with explanation[5]
- Practice 2 with reasoning[6]

## Comparison Table

| Feature | Option A | Option B |
|---------|----------|----------|
| ...     | ...      | ...      |

## Conclusion
Summary and recommendations[7][8]...

Citations:
[1] https://source1.com - Title
[2] https://source2.com - Title
...
```

**Key Features**:
- **Comprehensive**: 5000+ token responses common
- **Structured**: Organized with headings and sections
- **Cited**: Extensive source attribution
- **Analytical**: Synthesizes multiple perspectives
- **Current**: Includes latest 2025 information

### `perplexity_reason`

**Primary Use**: Complex reasoning, problem-solving, logical analysis, architectural decisions

```typescript
mcp__plugin_perplexity_perplexity__perplexity_reason({
  messages: [
    { role: "user", content: "Reasoning task" }
  ],
  strip_thinking?: boolean          // Optional: Remove <think> tags (default: false)
})
```

**Examples**:

```typescript
// Architectural decision
await perplexity_reason({
  messages: [{
    role: "user",
    content: "I'm building a real estate transaction platform. Should I use Supabase or Firebase? Consider: real-time features, complex queries, cost at scale, team expertise in PostgreSQL vs NoSQL."
  }]
})

// Problem diagnosis
await perplexity_reason({
  messages: [{
    role: "user",
    content: "My Supabase real-time subscriptions are dropping frequently. What are the most likely causes and how should I debug this?"
  }]
})

// Design pattern selection
await perplexity_reason({
  messages: [{
    role: "user",
    content: "For webhook processing at scale (1000+ webhooks/min), should I use: 1) Direct processing, 2) Queue-based async, or 3) Event-driven architecture? Consider reliability, performance, and complexity."
  }]
})

// Trade-off analysis
await perplexity_reason({
  messages: [{
    role: "user",
    content: "Analyze the trade-offs between client-side and server-side authentication token refresh in a React SPA using Supabase."
  }]
})
```

**Key Features**:
- **Reasoning Process**: Shows thinking in `<think>` tags
- **Logical**: Step-by-step analysis
- **Contextual**: Considers constraints
- **Recommendations**: Actionable conclusions
- **Trade-offs**: Balanced perspective

## Response Characteristics

### Citation Format

All Perplexity functions include citations:

```markdown
The implementation requires HMAC-SHA256 signatures[1]. Stripe's
documentation recommends using constant-time comparison[2][3].

Citations:
[1] https://stripe.com/docs/webhooks/signatures
[2] https://example.com/article
[3] https://example.com/guide
```

### Thinking Tags

Research and Reasoning include `<think>` tags:

```markdown
<think>
This query requires analyzing multiple aspects:
1. Technical architecture differences
2. Performance characteristics
3. Cost implications
4. Use case alignment

Let me examine each systematically...
</think>

[Main response follows]
```

**Control Thinking Output**:

```typescript
// Include thinking process
strip_thinking: false  // or omit (default)

// Remove thinking for cleaner output
strip_thinking: true
```

**When to Keep Thinking**:
- ✅ Debugging complex analysis
- ✅ Understanding reasoning process
- ✅ Evaluating source quality
- ✅ Learning how AI approaches problems

**When to Strip Thinking**:
- ✅ Production use (save tokens)
- ✅ User-facing outputs
- ✅ When only conclusions matter
- ✅ Token budget constraints

## Practical Examples

### Example 1: Learning New Technology

```typescript
// Quick overview
const overview = await perplexity_ask({
  messages: [{
    role: "user",
    content: "What is BoldSign and when should I use it over DocuSign?"
  }]
})

// Deep dive
const research = await perplexity_research({
  messages: [{
    role: "user",
    content: "Comprehensive analysis of BoldSign API: features, pricing, integration complexity, pros/cons vs DocuSign and HelloSign"
  }]
})

// Implementation guidance
const implementation = await perplexity_research({
  messages: [{
    role: "user",
    content: "How to implement BoldSign e-signature workflow in a Node.js/React app: architecture, security, best practices, code examples"
  }],
  strip_thinking: true
})
```

### Example 2: Comparative Analysis

```typescript
const comparison = await perplexity_research({
  messages: [{
    role: "user",
    content: `Compare real-time database solutions for a React app:

    Requirements:
    - Real-time subscriptions
    - Complex queries with joins
    - Row-level security
    - Good TypeScript support
    - Reasonable cost at scale

    Compare: Supabase, Firebase, AWS Amplify, Hasura

    Include: Architecture, performance, developer experience, pricing, use case fit`
  }]
})
```

### Example 3: Best Practices Research

```typescript
const bestPractices = await perplexity_research({
  messages: [{
    role: "user",
    content: "Latest best practices for webhook security in 2025, specifically for payment processors. Include: authentication methods, replay prevention, payload validation, infrastructure patterns, monitoring, compliance (PCI DSS)"
  }]
})
```

### Example 4: Problem Solving

```typescript
// Diagnose issue
const diagnosis = await perplexity_reason({
  messages: [{
    role: "user",
    content: `My React app using Supabase shows these symptoms:
    - Real-time subscriptions disconnect after 5 minutes
    - Reconnection works but loses some events
    - Happens only in production, not development

    Analyze possible causes and suggest debugging approach.`
  }]
})

// Research solutions
const solutions = await perplexity_research({
  messages: [{
    role: "user",
    content: "Supabase real-time subscription connection stability: common issues, troubleshooting, configuration best practices, monitoring"
  }],
  strip_thinking: true
})
```

### Example 5: Architectural Decision

```typescript
const decision = await perplexity_reason({
  messages: [{
    role: "user",
    content: `I'm building a SaaS with these characteristics:
    - Real estate transaction management
    - 100-1000 concurrent users
    - Complex workflows and state machines
    - Document storage and e-signatures
    - Real-time updates for collaboration
    - Multi-tenant with row-level security
    - Team has PostgreSQL experience

    Should I use:
    A) Supabase (PostgreSQL + real-time)
    B) Firebase (NoSQL + real-time)
    C) Custom backend (Node.js + PostgreSQL + Socket.io)

    Analyze trade-offs considering: development speed, scaling, cost, team fit, feature requirements.`
  }]
})
```

## Advanced Usage Patterns

### Pattern 1: Progressive Research

```typescript
// Start with quick overview
const overview = await perplexity_ask({
  messages: [{
    role: "user",
    content: "What are React Server Components?"
  }]
})

// Deep dive on specific aspect
const deepDive = await perplexity_research({
  messages: [{
    role: "user",
    content: "React Server Components: architecture, data fetching patterns, caching strategies, best practices, migration from client components"
  }]
})

// Reasoning for specific use case
const decision = await perplexity_reason({
  messages: [{
    role: "user",
    content: "Should I use Server Components for a dashboard with real-time updates? Consider: data freshness requirements, interactivity, performance."
  }]
})
```

### Pattern 2: Multi-Turn Conversation

```typescript
// Initial query
const response1 = await perplexity_ask({
  messages: [{
    role: "user",
    content: "Explain how Stripe webhooks work"
  }]
})

// Follow-up with context
const response2 = await perplexity_ask({
  messages: [
    { role: "user", content: "Explain how Stripe webhooks work" },
    { role: "assistant", content: response1.response },
    { role: "user", content: "How do I verify the webhook signature in Node.js?" }
  ]
})

// Further refinement
const response3 = await perplexity_ask({
  messages: [
    { role: "user", content: "Explain how Stripe webhooks work" },
    { role: "assistant", content: response1.response },
    { role: "user", content: "How do I verify the webhook signature in Node.js?" },
    { role: "assistant", content: response2.response },
    { role: "user", content: "What about replay attack prevention?" }
  ]
})
```

### Pattern 3: Comprehensive Technology Evaluation

```typescript
const evaluation = await perplexity_research({
  messages: [{
    role: "user",
    content: `Evaluate Supabase for production use in 2025:

    Research areas:
    1. Stability and reliability track record
    2. Performance benchmarks vs alternatives
    3. Security posture and compliance
    4. Cost analysis at different scales
    5. Developer experience and ecosystem
    6. Migration and vendor lock-in concerns
    7. Recent updates and roadmap
    8. Community health and support

    Provide data-driven analysis with sources.`
  }]
})
```

### Pattern 4: Best Practices Synthesis

```typescript
const synthesis = await perplexity_research({
  messages: [{
    role: "user",
    content: `Synthesize React hooks best practices from 2025:

    Cover:
    - Custom hooks patterns and composition
    - useEffect cleanup and dependencies
    - Performance optimization (useMemo, useCallback)
    - State management patterns
    - Common pitfalls and anti-patterns
    - TypeScript integration
    - Testing strategies

    Include code examples and authoritative sources.`
  }],
  strip_thinking: true
})
```

## Integration with Other Tools

### Complement Context7

```typescript
// Get official API docs from Context7
const apiDocs = await context7_get_docs({
  context7CompatibleLibraryID: "/stripe/stripe",
  topic: "webhooks"
})

// Get best practices analysis from Perplexity
const bestPractices = await perplexity_research({
  messages: [{
    role: "user",
    content: "Stripe webhook implementation best practices 2025: security, reliability, testing, monitoring"
  }]
})

// Combine: Official API + Expert analysis
```

### Validate Docfork Findings

```typescript
// Find implementation examples on Docfork
const examples = await docfork_search_docs({
  query: "Stripe webhook signature verification Node.js"
})

// Validate approach with Perplexity
const validation = await perplexity_reason({
  messages: [{
    role: "user",
    content: "Is this Stripe webhook verification approach secure and following best practices? [include code from Docfork]"
  }]
})
```

### Contextualize Brave Search Results

```typescript
// Get recent articles from Brave
const articles = await brave_web_search({
  query: "Next.js 15 new features",
  freshness: "pw"
})

// Get synthesis and analysis from Perplexity
const analysis = await perplexity_research({
  messages: [{
    role: "user",
    content: "Analyze Next.js 15 new features: significance, breaking changes, migration considerations, real-world impact"
  }]
})

// Combine: Recent news + Expert analysis
```

## Query Optimization

### Effective Prompts

```typescript
// ✅ GOOD: Specific, structured queries
"Compare X vs Y: [specific criteria]"
"Best practices for X in 2025: [specific aspects]"
"How to implement X: architecture, code examples, pitfalls"
"Analyze trade-offs between A, B, C for [use case]"

// ✅ GOOD: Context-rich prompts
"For a [type] app with [requirements], should I use X or Y? Consider: [factors]"

// ❌ AVOID: Vague questions
"Is X good?"
"How do I use Y?"
"Tell me about Z"

// ❌ AVOID: Yes/no questions (for research)
"Is Supabase better than Firebase?"
"Should I use TypeScript?"
```

### Research Query Structure

**Optimal Structure**:

```
[Main Topic/Question]

[Context/Constraints]
- Requirement 1
- Requirement 2
- Constraint 3

[Specific Areas to Cover]
1. Aspect A
2. Aspect B
3. Aspect C

[Desired Output Format]
Include: examples, comparisons, sources
```

**Example**:

```typescript
await perplexity_research({
  messages: [{
    role: "user",
    content: `
Evaluate authentication solutions for a React SPA

Context:
- Real estate SaaS platform
- Multi-tenant with role-based access
- Need SSO support
- Team familiar with JWT

Compare:
1. Supabase Auth
2. Auth0
3. Firebase Auth
4. Custom JWT solution

For each, analyze:
- Security features
- Implementation complexity
- Cost at 1000 users
- SSO capabilities
- Developer experience

Include code examples and current pricing.
    `.trim()
  }]
})
```

## Response Processing

### Extracting Citations

```typescript
const response = await perplexity_research({
  messages: [{ role: "user", content: "..." }]
})

// Parse citations
const citations = response.response.match(/\[\d+\] https?:\/\/[^\s]+/g)

// Extract citation map
const citationMap = {}
citations?.forEach(citation => {
  const match = citation.match(/\[(\d+)\] (.+)/)
  if (match) {
    citationMap[match[1]] = match[2]
  }
})

console.log(citationMap)
// { '1': 'https://source1.com', '2': 'https://source2.com', ... }
```

### Removing Thinking Tags

```typescript
// Manual removal
function stripThinking(response: string): string {
  return response.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

// Or use built-in
const response = await perplexity_research({
  messages: [{ role: "user", content: "..." }],
  strip_thinking: true
})
```

### Extracting Structured Data

```typescript
// For comparison tables
const response = await perplexity_research({
  messages: [{
    role: "user",
    content: "Compare Supabase vs Firebase in a markdown table"
  }]
})

// Parse markdown table from response
const tableMatch = response.response.match(/\|[\s\S]+?\|\n\|[\s\S]+?\|/)

// For lists
const listItems = response.response
  .split('\n')
  .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
  .map(line => line.trim().substring(2))
```

## Best Practices

### Function Selection

```typescript
// Use perplexity_search for:
- Specific facts
- Recent news
- Targeted information
- When you need raw URLs

// Use perplexity_ask for:
- Quick questions
- Clarifications
- Conversational queries
- Brief explanations

// Use perplexity_research for:
- Comprehensive analysis
- Best practices
- Comparisons
- In-depth investigations
- When you need citations

// Use perplexity_reason for:
- Complex decisions
- Trade-off analysis
- Problem diagnosis
- Architectural choices
- When you need step-by-step logic
```

### Token Management

```typescript
// perplexity_ask: ~500-2000 tokens
// Good for: Quick answers

// perplexity_search: ~1000-3000 tokens
// Control with: max_tokens_per_page

// perplexity_research: ~5000-15000 tokens
// Consider: strip_thinking: true to reduce

// perplexity_reason: ~3000-10000 tokens
// Consider: strip_thinking: true if needed
```

### Citation Verification

```typescript
// Always verify critical information
const research = await perplexity_research({
  messages: [{ role: "user", content: "..." }]
})

// Extract and check citations
const citations = extractCitations(research.response)

// For critical decisions, verify top sources
for (const url of citations.slice(0, 3)) {
  // Use Brave or Docfork to verify
  const verification = await brave_web_search({ query: `site:${url}` })
}
```

## Common Use Cases

### Use Case 1: Technology Decision

```typescript
const decision = await perplexity_research({
  messages: [{
    role: "user",
    content: "Should I use Supabase or build a custom backend for [specific requirements]? Provide detailed comparison with sources."
  }]
})
```

### Use Case 2: Best Practices

```typescript
const practices = await perplexity_research({
  messages: [{
    role: "user",
    content: "Webhook security best practices for payment systems in 2025: authentication, validation, infrastructure, monitoring"
  }],
  strip_thinking: true
})
```

### Use Case 3: Debugging Guidance

```typescript
const debugging = await perplexity_reason({
  messages: [{
    role: "user",
    content: "My Supabase queries are slow. Analyze possible causes and debugging approach: [provide context]"
  }]
})
```

### Use Case 4: Learning Path

```typescript
const learning = await perplexity_research({
  messages: [{
    role: "user",
    content: "Create a learning path for mastering React Server Components: fundamentals, patterns, gotchas, resources"
  }]
})
```

### Use Case 5: Quick Fact-Checking

```typescript
const fact = await perplexity_ask({
  messages: [{
    role: "user",
    content: "Does Supabase support real-time subscriptions with row-level security?"
  }]
})
```

## Limitations

### Known Limitations

1. **Token Costs**: Research produces long responses
2. **Speed**: Slower than simple searches
3. **Recency**: May lag behind very recent updates (hours)
4. **Code Execution**: Cannot run/test code
5. **Image Analysis**: Text-only responses

### Workarounds

```typescript
// Limitation: High token costs
// Solution: Use strip_thinking: true
// Solution: Use perplexity_ask for simple queries

// Limitation: Speed
// Solution: Use Brave Search for quick lookups
// Solution: Use Context7 for known libraries

// Limitation: Very recent info
// Solution: Combine with Brave News (freshness: "pd")

// Limitation: Cannot test code
// Solution: Use examples as starting point, test yourself
```

## Summary

**When to Use Perplexity**:
- ✅ Complex questions requiring synthesis
- ✅ Comparative analysis
- ✅ Best practices research
- ✅ Technology evaluation
- ✅ Architectural decisions
- ✅ Problem diagnosis
- ✅ Learning comprehensive topics
- ✅ When you need cited sources

**When to Use Alternatives**:
- ❌ Official API docs → Context7
- ❌ Code examples → Docfork
- ❌ Very recent news → Brave News
- ❌ Specific error messages → Brave Search
- ❌ Visual content → Brave Image Search
- ❌ Quick fact lookups → Brave Search

**Perplexity's Sweet Spot**:
- Answering "why" and "how" questions
- Synthesizing information from multiple sources
- Providing expert-level analysis
- Making informed recommendations
- Explaining complex concepts
- Comparing alternatives systematically
