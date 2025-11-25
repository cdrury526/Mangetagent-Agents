# Context7 - Library Documentation & Code Examples

## Overview

Context7 is a specialized MCP server that provides curated, official documentation and code examples for popular libraries and frameworks. It serves as a high-quality source for learning how to use specific library features, understanding API references, and discovering proven code patterns.

## Core Capabilities

### 1. Library Resolution
- **Function**: `mcp__context7__resolve-library-id`
- **Purpose**: Find the correct Context7-compatible library ID for a given library name
- **Returns**: List of matching libraries with metadata

### 2. Documentation Retrieval
- **Function**: `mcp__context7__get-library-docs`
- **Purpose**: Fetch up-to-date documentation and code examples
- **Returns**: Curated code snippets and explanations

## How It Works

### Step 1: Resolve Library ID

First, you must resolve the library name to get its Context7-compatible ID:

```typescript
mcp__context7__resolve-library-id({
  libraryName: "react"
})
```

**Response Structure**:
```javascript
{
  "Title": "React",
  "Context7-compatible library ID": "/websites/react_dev",
  "Description": "React is a JavaScript library for building user interfaces...",
  "Code Snippets": 1926,
  "Source Reputation": "High",
  "Benchmark Score": 89,
  "Versions": [] // Optional version list
}
```

### Step 2: Get Documentation

Once you have the library ID, fetch specific documentation:

```typescript
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/websites/react_dev",
  topic: "useEffect cleanup",  // Optional: focus on specific topic
  page: 1                       // Optional: pagination (default: 1)
})
```

**Response Structure**:
```javascript
{
  "Title": "useEffect with Cleanup Function for Chat Disconnection",
  "Source": "https://react.dev/learn/synchronizing-with-effects",
  "Description": "Implements a complete useEffect hook with a cleanup function...",
  "Code": "useEffect(() => { ... })"
}
```

## Key Features

### 1. Quality Indicators

Each library result includes quality metrics:

- **Source Reputation**: `High`, `Medium`, `Low`, or `Unknown`
  - Indicates trustworthiness of the documentation source
  - Prefer `High` reputation sources for critical implementations

- **Benchmark Score**: 0-100 scale
  - Quality indicator (100 is highest)
  - Scores above 80 indicate excellent documentation
  - Scores 70-80 are good quality
  - Below 70 may have gaps or outdated content

- **Code Snippets Count**: Number of available examples
  - Higher counts mean more comprehensive documentation
  - Look for 500+ snippets for major frameworks

### 2. Version Support

Some libraries provide version-specific documentation:

```javascript
// Example: React Admin with versions
{
  "library ID": "/marmelab/react-admin",
  "Versions": ["v2_9_9", "v4.16.0", "v2.9.0", "v3.19.0", "v5_10_2"]
}

// To use specific version:
context7CompatibleLibraryID: "/marmelab/react-admin/v5_10_2"
```

### 3. Topic Filtering

Use the `topic` parameter to narrow results:

```typescript
// Instead of getting all React docs
topic: "useEffect cleanup"      // ✅ Specific and targeted

// Be specific but not too narrow
topic: "hooks"                   // ✅ Good - returns multiple hook examples
topic: "useEffect"               // ✅ Good - focuses on one hook
topic: "cleanup function line 45" // ❌ Too specific - may return nothing
```

### 4. Pagination

Large documentation sets are paginated:

```typescript
// Start with page 1
page: 1  // Returns first set of results

// If context is insufficient, try subsequent pages
page: 2  // Returns next set of results
page: 3  // Continue as needed
```

## Practical Examples

### Example 1: Learning React Hooks

```typescript
// Step 1: Find React library
const libraries = await mcp__context7__resolve-library-id({
  libraryName: "react"
})

// Select highest benchmark score with most snippets
// Result: "/websites/react_dev" (89 score, 1926 snippets)

// Step 2: Get useEffect documentation
const docs = await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/websites/react_dev",
  topic: "useEffect cleanup"
})

// Result: Multiple code examples showing:
// - Chat disconnection cleanup
// - Ignore flags for data fetching
// - Timer cleanup with clearTimeout
// - Subscription cleanup patterns
```

### Example 2: Finding Stripe Integration Examples

```typescript
// Step 1: Resolve Stripe library
const result = await mcp__context7__resolve-library-id({
  libraryName: "stripe node"
})

// Step 2: Get webhook signature verification docs
const webhookDocs = await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/stripe/stripe-node",
  topic: "webhook signature verification"
})
```

### Example 3: Exploring TypeScript Utilities

```typescript
// Find TypeScript documentation
const tsLibs = await mcp__context7__resolve-library-id({
  libraryName: "typescript"
})

// Get utility types documentation
const utilityTypes = await mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/microsoft/TypeScript",
  topic: "utility types mapped types"
})
```

## Response Format Details

### Library Resolution Response

Each library match includes:

```javascript
{
  "Title": "Library Name",
  "Context7-compatible library ID": "/org/project",
  "Description": "Brief description of the library",
  "Code Snippets": 1234,           // Number of available examples
  "Source Reputation": "High",     // High, Medium, Low, Unknown
  "Benchmark Score": 85.5,         // 0-100 quality score
  "Versions": ["v1.0", "v2.0"]    // Optional version list
}
```

### Documentation Response

Each documentation snippet includes:

```javascript
{
  "Title": "Feature or Pattern Name",
  "Source": "https://...",         // Original documentation URL
  "Description": "Explanation...", // Context and use case
  "Code": "code snippet here"      // Actual implementation
}
```

## Selection Strategy

When multiple libraries match your query:

### 1. Prioritize by Name Match
- Exact name match over partial
- Official org/project over community forks
- Example: `/reactjs/react.dev` over `/user/react-fork`

### 2. Check Source Reputation
- `High` reputation sources first
- Official documentation sites
- Well-maintained community projects

### 3. Consider Benchmark Score
- 90-100: Excellent, comprehensive documentation
- 80-89: Good quality, reliable
- 70-79: Adequate, may have some gaps
- Below 70: Use with caution, verify elsewhere

### 4. Evaluate Code Snippet Count
- More snippets = more comprehensive
- Major frameworks: 1000+ snippets expected
- Utility libraries: 50-500 snippets typical
- New libraries: May have fewer but still quality

### 5. Version Compatibility
- Use specific versions when available
- Match version to your project requirements
- Latest version isn't always best (breaking changes)

## Best Practices

### Query Optimization

```typescript
// ✅ GOOD: Specific library name
libraryName: "react"
libraryName: "stripe node"
libraryName: "supabase js"

// ❌ AVOID: Generic terms
libraryName: "javascript framework"
libraryName: "database library"

// ✅ GOOD: Specific topics
topic: "useEffect cleanup"
topic: "webhook signature verification"
topic: "real-time subscriptions"

// ❌ AVOID: Vague topics
topic: "how to use"
topic: "examples"
```

### Multi-Page Research

```typescript
// Pattern for comprehensive research
async function comprehensiveResearch(libraryId, topic) {
  let allDocs = [];

  // Start with page 1
  let page1 = await get-library-docs({
    context7CompatibleLibraryID: libraryId,
    topic: topic,
    page: 1
  });
  allDocs.push(...page1);

  // If needed, get page 2
  if (needsMoreContext(page1)) {
    let page2 = await get-library-docs({
      context7CompatibleLibraryID: libraryId,
      topic: topic,
      page: 2
    });
    allDocs.push(...page2);
  }

  return allDocs;
}
```

### Version-Specific Queries

```typescript
// For new projects: Use latest
context7CompatibleLibraryID: "/remix-run/react-router/react-router_7.9.4"

// For existing projects: Match your version
context7CompatibleLibraryID: "/remix-run/react-router/v5.2.1"

// For learning: Use latest stable
context7CompatibleLibraryID: "/remix-run/react-router"  // Gets default/latest
```

## Limitations & Workarounds

### Limitation 1: Not All Libraries Available
- **Issue**: Smaller or newer libraries may not be indexed
- **Workaround**: Use Docfork to search GitHub directly
- **Alternative**: Use Brave Search for blog posts/tutorials

### Limitation 2: Documentation Recency
- **Issue**: Docs may lag behind latest releases
- **Workaround**: Check Brave News for recent updates
- **Alternative**: Cross-reference with official changelog

### Limitation 3: No Real-Time Updates
- **Issue**: Breaking changes may not reflect immediately
- **Workaround**: Always verify with official docs
- **Alternative**: Use Perplexity for "latest 2025" context

### Limitation 4: Topic Filtering Variance
- **Issue**: Different topics return varied result counts
- **Workaround**: Start broad, then narrow with pagination
- **Alternative**: Use multiple related topics

## Common Use Cases

### Use Case 1: Learning a New Library
```typescript
// 1. Find the library
const libs = await resolve-library-id({ libraryName: "supabase" })

// 2. Get introduction/getting started
const intro = await get-library-docs({
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "getting started"
})

// 3. Get specific feature docs
const realtime = await get-library-docs({
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "realtime subscriptions"
})
```

### Use Case 2: Implementing a Specific Feature
```typescript
// Direct to feature documentation
const featureDocs = await get-library-docs({
  context7CompatibleLibraryID: "/stripe/stripe-node",
  topic: "create subscription checkout"
})
```

### Use Case 3: Debugging Issues
```typescript
// Get cleanup/error handling patterns
const cleanupDocs = await get-library-docs({
  context7CompatibleLibraryID: "/websites/react_dev",
  topic: "useEffect cleanup common mistakes"
})
```

### Use Case 4: Code Review Reference
```typescript
// Get best practices documentation
const bestPractices = await get-library-docs({
  context7CompatibleLibraryID: "/websites/react_dev",
  topic: "custom hooks best practices"
})
```

## Integration Patterns

### Pattern 1: Documentation-First Development
```typescript
// Before implementing, get official patterns
const patterns = await get-library-docs({
  context7CompatibleLibraryID: libraryId,
  topic: featureName
})
// Implement based on official examples
```

### Pattern 2: Validation & Verification
```typescript
// After implementation, verify against docs
const officialImplementation = await get-library-docs({
  context7CompatibleLibraryID: libraryId,
  topic: implementedFeature
})
// Compare and adjust
```

### Pattern 3: Multi-Library Research
```typescript
// Compare approaches across libraries
const reactDocs = await get-library-docs({
  context7CompatibleLibraryID: "/websites/react_dev",
  topic: "state management"
})

const vueDocs = await get-library-docs({
  context7CompatibleLibraryID: "/vuejs/vue",
  topic: "state management"
})
// Analyze differences
```

## Performance Considerations

- **Response Time**: Generally fast (< 2 seconds)
- **Token Usage**: Moderate (1000-3000 tokens per response)
- **Rate Limits**: Unknown - assume standard API limits
- **Caching**: Recommended for frequently accessed docs

## Quality Assurance

### Verification Checklist
- [ ] Source URL is official or high-reputation
- [ ] Code examples are complete (not truncated)
- [ ] Descriptions match code functionality
- [ ] Examples are compatible with your library version
- [ ] Multiple examples confirm the pattern

### Red Flags
- ❌ Source reputation is "Unknown"
- ❌ Benchmark score below 70
- ❌ Very few code snippets (< 10)
- ❌ Description doesn't match code
- ❌ Deprecated syntax or APIs

## Summary

**When to Use Context7**:
- ✅ Learning official API usage
- ✅ Finding curated code examples
- ✅ Understanding best practices from source
- ✅ Getting version-specific documentation
- ✅ Validating implementation approaches

**When to Use Alternatives**:
- ❌ Library not in Context7 → Use Docfork
- ❌ Need latest breaking news → Use Brave Search
- ❌ Want community discussions → Use Brave Search
- ❌ Need comprehensive comparison → Use Perplexity
- ❌ Seeking real-world implementations → Use Docfork
