# Docfork - GitHub Documentation Search

## Overview

Docfork is an MCP server that searches documentation from GitHub repositories and the web, with a focus on programming libraries and frameworks. It excels at finding real-world implementation examples, README files, and community-driven documentation.

## Core Capabilities

### 1. Documentation Search
- **Function**: `mcp__Docfork__docfork_search_docs`
- **Purpose**: Search for documentation across GitHub and web sources
- **Returns**: List of relevant documentation URLs with snippets

### 2. URL Reading
- **Function**: `mcp__Docfork__docfork_read_url`
- **Purpose**: Fetch and read the full content of documentation URLs
- **Returns**: Complete markdown/text content from the URL

## How It Works

### Search Workflow

```typescript
// Step 1: Search for documentation
const results = await mcp__Docfork__docfork_search_docs({
  query: "Stripe webhooks Node.js",
  libraryId: "stripe/stripe-node",  // Optional: filter to specific library
  tokens: "dynamic"                  // Optional: token budget control
})

// Step 2: Read detailed content from a result
const content = await mcp__Docfork__docfork_read_url({
  url: "https://github.com/stripe/stripe-node/blob/v19.3.0/README.md#L376-L392"
})
```

## Function Details

### `docfork_search_docs`

**Parameters**:

```typescript
{
  query: string,          // Required: Search query
  libraryId?: string,     // Optional: Filter to specific library (e.g., "stripe/stripe-node")
  tokens?: string | number // Optional: Token budget ("dynamic" or 100-10000)
}
```

**Query Best Practices**:
```typescript
// ✅ GOOD: Include language and framework
query: "Stripe subscription webhooks Node.js"
query: "React hooks cleanup patterns TypeScript"
query: "Supabase authentication Next.js"

// ✅ GOOD: Include specific feature names
query: "useEffect cleanup function examples"
query: "HMAC signature verification implementation"

// ❌ AVOID: Too generic
query: "webhooks"
query: "authentication"

// ❌ AVOID: Too specific (use after initial search)
query: "line 45 of stripe-node index.js file"
```

**Response Format**:

```javascript
{
  "title": "stripe/stripe-node - README.md > Webhook signing",
  "url": "https://github.com/stripe/stripe-node/blob/v19.3.0/README.md#L376-L392"
}
```

### `docfork_read_url`

**Parameters**:

```typescript
{
  url: string  // Required: Complete URL from search results
}
```

**Important**: Always use the **exact URL** from search results. The URL includes:
- Repository path
- Branch/version
- File path
- Line number ranges (e.g., `#L376-L392`)

**Response Format**:

```markdown
# Stripe Node.js Library

## Configuration

### Webhook signing

Stripe can optionally sign the webhook events it sends to your endpoint...

```js
const event = stripe.webhooks.constructEvent(
  webhookRawBody,
  webhookStripeSignatureHeader,
  webhookSecret
);
```
```

## Token Budget Control

The `tokens` parameter controls response size:

### Dynamic Mode (Recommended)
```typescript
tokens: "dynamic"  // System determines optimal size
```
- Balances completeness with token efficiency
- Good for exploratory searches
- Adapts to content complexity

### Fixed Token Limits
```typescript
tokens: 1000   // Small, focused results
tokens: 2000   // Medium coverage (good default)
tokens: 5000   // Comprehensive results
tokens: 10000  // Maximum depth
```

**Guidelines**:
- **100-500**: Quick reference lookup
- **500-2000**: Standard documentation search
- **2000-5000**: Deep dive into complex topics
- **5000-10000**: Comprehensive research (use sparingly)

## Library Filtering

### Using libraryId

```typescript
// Without libraryId: Broad search across all repos
docfork_search_docs({
  query: "webhook signature verification"
})
// Returns: Results from Stripe, GitHub, Shopify, etc.

// With libraryId: Focused on specific library
docfork_search_docs({
  query: "webhook signature verification",
  libraryId: "stripe/stripe-node"
})
// Returns: Only stripe/stripe-node documentation
```

### Finding Library IDs

Library IDs typically follow GitHub's `owner/repo` format:

```typescript
// Common patterns
"stripe/stripe-node"
"supabase/supabase-js"
"vercel/next.js"
"facebook/react"
"microsoft/TypeScript"

// Organization libraries
"remix-run/react-router"
"trpc/trpc"
"tanstack/query"
```

**Pro Tip**: If you see a library ID in search results URLs, you can use it to filter future searches:
```
URL: https://github.com/stripe/stripe-node/...
Library ID: "stripe/stripe-node"
```

## Response Types

### Search Results

Docfork returns results with hierarchical titles:

```javascript
// Pattern: repo - file > section > subsection
"title": "stripe/stripe-node - README.md > Configuration > Webhook signing"

// Breakdown:
// - Repository: stripe/stripe-node
// - File: README.md
// - Section: Configuration
// - Subsection: Webhook signing
```

### URL Structure

URLs include precise locations:

```
https://github.com/stripe/stripe-node/blob/v19.3.0/README.md#L376-L392
                   └─────┬─────┘       └──┬──┘  └──┬──┘    └────┬────┘
                         repo          version   file      line range
```

This precision means:
- ✅ Version-specific documentation
- ✅ Exact code location
- ✅ Reproducible references
- ✅ Historical documentation access

## Practical Examples

### Example 1: Finding Stripe Implementation

```typescript
// Step 1: Search for Stripe webhook examples
const results = await docfork_search_docs({
  query: "Stripe webhook signature verification Node.js",
  libraryId: "stripe/stripe-node"
})

// Results might include:
// - README.md webhook signing section
// - Examples directory
// - Test files showing usage
// - TypeScript type definitions

// Step 2: Read the most relevant result
const webhookDoc = await docfork_read_url({
  url: results[0].url
})

// You now have the complete implementation guide
```

### Example 2: Learning React Patterns

```typescript
// Broad search first
const hookPatterns = await docfork_search_docs({
  query: "React custom hooks patterns best practices",
  tokens: 2000
})

// Read specific pattern documentation
const content = await docfork_read_url({
  url: hookPatterns[0].url
})
```

### Example 3: Comparing Implementations

```typescript
// Search across multiple libraries
const supabaseAuth = await docfork_search_docs({
  query: "authentication implementation",
  libraryId: "supabase/supabase-js"
})

const firebaseAuth = await docfork_search_docs({
  query: "authentication implementation",
  libraryId: "firebase/firebase-js-sdk"
})

// Read both and compare
const supabaseImpl = await docfork_read_url({ url: supabaseAuth[0].url })
const firebaseImpl = await docfork_read_url({ url: firebaseAuth[0].url })
```

### Example 4: TypeScript Type Definitions

```typescript
// Find type definition documentation
const typeDocs = await docfork_search_docs({
  query: "TypeScript utility types Partial Pick Omit",
  tokens: "dynamic"
})

// Read the type documentation
const typeDetails = await docfork_read_url({
  url: typeDocs[0].url
})
```

## Advanced Search Strategies

### Strategy 1: Progressive Refinement

```typescript
// Start broad
const broad = await docfork_search_docs({
  query: "React hooks"
})

// Analyze titles, then narrow
const specific = await docfork_search_docs({
  query: "React useEffect cleanup patterns",
  libraryId: "facebook/react"  // Identified from broad search
})

// Read exact implementation
const impl = await docfork_read_url({ url: specific[0].url })
```

### Strategy 2: Multi-Library Pattern Research

```typescript
// Research pattern across ecosystem
const libraries = [
  "stripe/stripe-node",
  "square/square-nodejs-sdk",
  "paypal/paypal-rest-api"
]

const patterns = await Promise.all(
  libraries.map(lib =>
    docfork_search_docs({
      query: "webhook signature verification",
      libraryId: lib
    })
  )
)

// Compare implementations
const implementations = await Promise.all(
  patterns.map(p => docfork_read_url({ url: p[0].url }))
)
```

### Strategy 3: Version-Specific Research

```typescript
// Find documentation for specific version
const v19Docs = await docfork_search_docs({
  query: "Stripe Node.js v19 breaking changes",
  libraryId: "stripe/stripe-node"
})

// URLs will include version tags:
// .../blob/v19.3.0/...
```

### Strategy 4: Example-Driven Learning

```typescript
// Search for example directories
const examples = await docfork_search_docs({
  query: "examples directory webhook integration",
  libraryId: "stripe/stripe-node",
  tokens: 5000
})

// Often finds:
// - /examples/webhooks/
// - /examples/subscriptions/
// - Test files with usage patterns
```

## Content Quality Indicators

### High-Quality Results

Look for these indicators:

1. **Official Repositories**
   - Maintained by library authors
   - Active recent commits
   - Comprehensive README files

2. **Complete Documentation**
   - Code examples included
   - Explanation of parameters
   - Common pitfalls noted
   - Version compatibility mentioned

3. **Precise Line References**
   - `#L376-L392` shows exact code section
   - Not just file-level references

4. **Recent Versions**
   - Check version in URL (e.g., `v19.3.0`)
   - Newer versions generally preferred
   - But match your project's version

### Red Flags

Be cautious of:

- ❌ Forked repositories (unless specifically needed)
- ❌ Very old versions (check if outdated)
- ❌ Incomplete code examples
- ❌ Missing context or explanations
- ❌ Deprecated APIs or patterns

## Integration with Other Tools

### Complement with Context7

```typescript
// Use Context7 for official docs
const officialDocs = await context7.get-library-docs({
  context7CompatibleLibraryID: "/stripe/stripe",
  topic: "webhooks"
})

// Use Docfork for implementation examples
const implementations = await docfork_search_docs({
  query: "Stripe webhook implementation examples",
  libraryId: "stripe/stripe-node"
})

// Combine: Official API + Real examples
```

### Validate with Brave Search

```typescript
// Find implementation on Docfork
const code = await docfork_search_docs({
  query: "React useEffect cleanup"
})

// Validate with community discussions
const discussions = await brave_web_search({
  query: "React useEffect cleanup best practices 2025"
})

// Cross-reference both sources
```

### Deep Dive with Perplexity

```typescript
// Get code examples from Docfork
const examples = await docfork_search_docs({
  query: "webhook security patterns"
})

// Get analysis from Perplexity
const analysis = await perplexity_research({
  messages: [{
    role: "user",
    content: "Analyze webhook security patterns and best practices"
  }]
})

// Combine: Code + Expert analysis
```

## Common Use Cases

### Use Case 1: Implementing Third-Party Integration

```typescript
// Find SDK documentation
const sdkDocs = await docfork_search_docs({
  query: "BoldSign API integration Node.js SDK",
  tokens: 3000
})

// Read implementation guide
const guide = await docfork_read_url({ url: sdkDocs[0].url })

// Read example code
const example = await docfork_read_url({ url: sdkDocs[1].url })
```

### Use Case 2: Debugging Library Issues

```typescript
// Search for known issues
const issues = await docfork_search_docs({
  query: "Supabase realtime connection drops troubleshooting",
  libraryId: "supabase/supabase-js"
})

// Read issue documentation
const solution = await docfork_read_url({ url: issues[0].url })
```

### Use Case 3: Migrating Between Versions

```typescript
// Find migration guide
const migration = await docfork_search_docs({
  query: "migration guide v1 to v2",
  libraryId: "stripe/stripe-node"
})

// Read breaking changes
const changes = await docfork_read_url({ url: migration[0].url })
```

### Use Case 4: Learning Testing Patterns

```typescript
// Find test examples
const tests = await docfork_search_docs({
  query: "test examples unit tests integration",
  libraryId: "stripe/stripe-node",
  tokens: 5000
})

// Read test implementation
const testCode = await docfork_read_url({ url: tests[0].url })
```

## Best Practices

### Query Construction

```typescript
// ✅ GOOD: Structured queries
"[Library] [Feature] [Language/Framework]"
"Stripe webhooks Node.js Express"
"Supabase realtime React hooks"
"TypeScript generics utility types"

// ✅ GOOD: Include action verbs
"implementing authentication Supabase"
"handling errors React hooks"
"testing webhooks Jest"

// ✅ GOOD: Technical terminology
"HMAC signature verification"
"JWT token validation"
"OAuth 2.0 flow"

// ❌ AVOID: Natural language questions
"how do I use webhooks?"
"what is the best way to..."
```

### Result Selection

```typescript
// 1. Prioritize by title relevance
// "README.md > Webhooks" beats "tests > misc.test.js"

// 2. Check version compatibility
// v19.3.0 vs v10.0.0 - choose based on your needs

// 3. Look for example directories
// "examples/webhooks/" often has working code

// 4. README files first
// Usually most comprehensive

// 5. Then API docs
// Technical reference

// 6. Test files last
// Good for edge cases
```

### URL Management

```typescript
// ✅ GOOD: Use exact URLs from search
const url = searchResults[0].url
const content = await docfork_read_url({ url })

// ❌ BAD: Modify URLs manually
const url = searchResults[0].url.replace("v19", "v20")  // Don't do this

// ❌ BAD: Construct URLs yourself
const url = "https://github.com/stripe/stripe-node/README.md"  // Missing version, line numbers
```

### Token Optimization

```typescript
// For quick lookups
tokens: 1000

// For standard research (recommended default)
tokens: 2000

// For comprehensive documentation
tokens: 5000

// For maximum coverage (use sparingly)
tokens: 10000

// For adaptive sizing
tokens: "dynamic"
```

## Performance Tips

1. **Use libraryId when known**: Dramatically reduces search space
2. **Start with moderate tokens**: 2000 is usually sufficient
3. **Read selectively**: Don't read every URL, choose best matches
4. **Cache frequently accessed docs**: Store locally for repeated use
5. **Parallel searches**: Search multiple libraries simultaneously

## Limitations

### Current Limitations

1. **GitHub-Centric**: Primarily indexes GitHub repositories
2. **Public Repos Only**: Private repositories not accessible
3. **No Real-Time Updates**: May lag behind latest commits
4. **Token Limits**: Very large files may be truncated
5. **No Interactive Content**: Can't access embedded demos

### Workarounds

```typescript
// Limitation: Can't find private repos
// Solution: Use Brave Search for blog posts about the library

// Limitation: May lag behind latest updates
// Solution: Cross-reference with Brave News for recent changes

// Limitation: Large files truncated
// Solution: Use line number ranges from URLs to read specific sections

// Limitation: Can't show interactive demos
// Solution: Get URL and open in browser for interactive content
```

## Error Handling

### Common Issues

```typescript
// Issue: No results found
// Cause: Query too specific or wrong libraryId
// Solution: Broaden query, remove libraryId filter

// Issue: URL read fails
// Cause: Content moved or deleted
// Solution: Try alternative URLs from search results

// Issue: Truncated content
// Cause: Token limit exceeded
// Solution: Increase tokens parameter or read specific sections
```

## Summary

**When to Use Docfork**:
- ✅ Finding real-world code examples
- ✅ Reading SDK/library documentation
- ✅ Discovering implementation patterns
- ✅ Learning from test files
- ✅ Accessing version-specific docs
- ✅ Comparing library implementations

**When to Use Alternatives**:
- ❌ Need curated official docs → Use Context7
- ❌ Want latest news → Use Brave Search
- ❌ Need synthesis/comparison → Use Perplexity
- ❌ Looking for tutorials → Use Brave Search
- ❌ Need interactive demos → Use Brave Search + browser
