# Brave Search - Web Search Engine

## Overview

Brave Search is a comprehensive web search engine MCP server that provides multiple search capabilities: web search, news search, video search, image search, and local business search. It's ideal for finding current information, community discussions, tutorials, and location-based content.

## Core Search Functions

### 1. Web Search - `brave_web_search`
General web search across all content types

### 2. News Search - `brave_news_search`
Current news articles and announcements

### 3. Video Search - `brave_video_search`
Video content from YouTube and other platforms

### 4. Image Search - `brave_image_search`
Image search for visual content

### 5. Local Search - `brave_local_search`
Location-based business and place search

### 6. Summarizer - `brave_summarizer`
AI-generated summaries of search results (requires Pro)

## Function Details

### `brave_web_search`

**Primary Use**: General web searches for information, tutorials, blog posts, discussions

```typescript
mcp__brave-search__brave_web_search({
  query: string,                    // Required: Search query (max 400 chars, 50 words)
  count?: number,                   // Optional: 1-20 results (default: 10)
  offset?: number,                  // Optional: 0-9 pagination (default: 0)
  country?: string,                 // Optional: 2-char country code (default: "US")
  search_lang?: string,            // Optional: Language code (default: "en")
  ui_lang?: string,                // Optional: UI language (default: "en-US")
  safesearch?: string,             // Optional: "off"|"moderate"|"strict" (default: "moderate")
  freshness?: string,              // Optional: "pd"|"pw"|"pm"|"py"|date range
  result_filter?: string[],        // Optional: Filter result types
  spellcheck?: boolean,            // Optional: Enable spellcheck (default: true)
  goggles?: string[],              // Optional: Custom re-ranking
  text_decorations?: boolean,      // Optional: Highlight markers (default: true)
  extra_snippets?: boolean,        // Optional: Additional excerpts
  summary?: boolean,               // Optional: Enable summary key (for summarizer)
  units?: string                   // Optional: "metric"|"imperial"
})
```

**Response Structure**:

```javascript
{
  "url": "https://example.com/article",
  "title": "Article Title",
  "description": "Article description with highlighted terms",
  "extra_snippets": [
    "Additional excerpt 1",
    "Additional excerpt 2"
  ],
  "age": "2 days ago",              // Optional: For time-sensitive content
  "thumbnail_url": "...",           // Optional: Image thumbnail
  "page_age": "2025-11-21T10:30:00" // Optional: ISO timestamp
}
```

**Examples**:

```typescript
// Basic web search
await brave_web_search({
  query: "Supabase real-time subscriptions best practices 2025",
  count: 10
})

// Recent content only
await brave_web_search({
  query: "React 19 new features",
  freshness: "pw",  // Past week
  count: 5
})

// Web results only (no videos, news, etc.)
await brave_web_search({
  query: "TypeScript tutorial",
  result_filter: ["web"]
})

// With extra context snippets
await brave_web_search({
  query: "Stripe webhook integration",
  extra_snippets: true,
  count: 5
})
```

### `brave_news_search`

**Primary Use**: Current news, announcements, breaking updates

```typescript
mcp__brave-search__brave_news_search({
  query: string,                    // Required: Search query
  count?: number,                   // Optional: 1-50 results (default: 20)
  offset?: number,                  // Optional: 0-9 pagination
  freshness?: string,              // Optional: Default "pd" (past day)
  country?: string,                 // Optional: Country filter
  search_lang?: string,            // Optional: Language filter
  extra_snippets?: boolean         // Optional: Additional excerpts
})
```

**Freshness Options**:
- `"pd"` - Past 24 hours (default for news)
- `"pw"` - Past week
- `"pm"` - Past month
- `"py"` - Past year
- `"YYYY-MM-DDtoYYYY-MM-DD"` - Custom date range

**Examples**:

```typescript
// Latest Supabase news
await brave_news_search({
  query: "Supabase new features 2025",
  freshness: "pw",
  count: 5
})

// Breaking tech news
await brave_news_search({
  query: "JavaScript framework releases",
  freshness: "pd",
  count: 10
})

// News with context
await brave_news_search({
  query: "Stripe API updates",
  extra_snippets: true,
  freshness: "pm"
})
```

### `brave_video_search`

**Primary Use**: Tutorials, demos, presentations, conference talks

```typescript
mcp__brave-search__brave_video_search({
  query: string,                    // Required: Search query
  count?: number,                   // Optional: 1-50 results (default: 20)
  offset?: number,                  // Optional: 0-9 pagination
  country?: string,
  freshness?: string,
  safesearch?: string
})
```

**Response Includes**:
- Video title
- URL (often YouTube)
- Description
- Duration
- Thumbnail URL
- Creator/Channel
- Publisher
- Age

**Examples**:

```typescript
// Find tutorial videos
await brave_video_search({
  query: "Next.js 14 tutorial server components",
  count: 10
})

// Recent conference talks
await brave_video_search({
  query: "React conf 2025 talks",
  freshness: "pm"
})

// Specific technology demos
await brave_video_search({
  query: "Supabase realtime demo implementation"
})
```

### `brave_image_search`

**Primary Use**: UI mockups, diagrams, design inspiration, visual references

```typescript
mcp__brave-search__brave_image_search({
  query: string,                    // Required: Search query
  count?: number,                   // Optional: 1-200 results (default: 50)
  country?: string,
  search_lang?: string,
  safesearch?: string,             // Optional: "off"|"strict" (default: "strict")
  spellcheck?: boolean
})
```

**Examples**:

```typescript
// Find UI design examples
await brave_image_search({
  query: "modern dashboard UI design",
  count: 20
})

// Architecture diagrams
await brave_image_search({
  query: "microservices architecture diagram"
})

// Component patterns
await brave_image_search({
  query: "React component structure diagram"
})
```

### `brave_local_search`

**Primary Use**: Finding businesses, restaurants, services, locations

**Note**: Requires Brave Search API Pro plan. Falls back to `brave_web_search` if not available.

```typescript
mcp__brave-search__brave_local_search({
  query: string,                    // Required: Location-based query
  count?: number,
  country?: string,
  // ... same parameters as web_search
})
```

**Returns**:
- Business names and addresses
- Ratings and review counts
- Phone numbers
- Opening hours
- Location coordinates

**Examples**:

```typescript
// Find local services
await brave_local_search({
  query: "coffee shops near San Francisco"
})

// Business information
await brave_local_search({
  query: "coworking spaces downtown"
})
```

### `brave_summarizer`

**Primary Use**: AI-generated summaries from search results

**Requirements**:
1. Must first run `brave_web_search` with `summary: true`
2. Requires Pro AI subscription
3. Use the `key` from search results

```typescript
// Step 1: Search with summary enabled
const results = await brave_web_search({
  query: "webhook security best practices",
  summary: true
})

// Step 2: Generate summary
const summary = await brave_summarizer({
  key: results.summary_key,         // From search results
  inline_references?: boolean,      // Optional: Add source citations
  entity_info?: boolean             // Optional: Extra entity information
})
```

## Search Parameters Deep Dive

### Freshness Parameter

Controls how recent results should be:

```typescript
// Specific periods
freshness: "pd"    // Past day (24 hours)
freshness: "pw"    // Past week (7 days)
freshness: "pm"    // Past month (31 days)
freshness: "py"    // Past year (365 days)

// Custom date range
freshness: "2025-01-01to2025-03-31"  // Q1 2025
freshness: "2024-11-01to2025-11-23"  // Last year
```

**When to Use**:
- News/announcements: `"pd"` or `"pw"`
- Recent tutorials: `"pm"`
- Technology trends: `"py"`
- Historical research: Custom date range or omit

### Result Filtering

Control what types of results appear:

```typescript
result_filter: ["web"]                    // Only web pages
result_filter: ["web", "query"]           // Default
result_filter: ["news", "web"]            // News + web
result_filter: ["videos"]                 // Only videos
result_filter: ["discussions", "faq"]     // Community content
```

**Available Filters**:
- `"web"` - Standard web pages
- `"news"` - News articles
- `"videos"` - Video content
- `"discussions"` - Forum/community discussions
- `"faq"` - FAQ pages
- `"infobox"` - Information boxes
- `"query"` - Query interpretation
- `"locations"` - Local results
- `"rich"` - Rich results

### Country and Language

```typescript
// Country codes (ISO 3166-1 alpha-2)
country: "US"      // United States
country: "GB"      // United Kingdom
country: "DE"      // Germany
country: "JP"      // Japan
country: "ALL"     // All countries

// Search language (content language)
search_lang: "en"
search_lang: "es"
search_lang: "fr"
search_lang: "de"

// UI language (interface language)
ui_lang: "en-US"
ui_lang: "en-GB"
ui_lang: "es-ES"
ui_lang: "fr-FR"
```

### SafeSearch Levels

```typescript
safesearch: "off"        // No filtering
safesearch: "moderate"   // Filter explicit content (default)
safesearch: "strict"     // Filter all adult content
```

## Practical Examples

### Example 1: Research Latest Framework Features

```typescript
// Step 1: Find recent announcements
const news = await brave_news_search({
  query: "Next.js 15 new features",
  freshness: "pw",
  count: 5
})

// Step 2: Find tutorials
const videos = await brave_video_search({
  query: "Next.js 15 tutorial",
  freshness: "pm",
  count: 5
})

// Step 3: Find blog posts
const articles = await brave_web_search({
  query: "Next.js 15 migration guide",
  freshness: "pm",
  result_filter: ["web"],
  count: 10
})
```

### Example 2: Debugging Issues

```typescript
// Find community discussions
const discussions = await brave_web_search({
  query: "Supabase realtime connection drops error",
  result_filter: ["discussions", "faq"],
  count: 10
})

// Find Stack Overflow threads
const stackoverflow = await brave_web_search({
  query: "site:stackoverflow.com Supabase realtime disconnect",
  count: 5
})

// Find GitHub issues
const issues = await brave_web_search({
  query: "site:github.com supabase realtime connection issues",
  count: 5
})
```

### Example 3: Learning New Technology

```typescript
// Official documentation
const docs = await brave_web_search({
  query: "BoldSign API documentation",
  result_filter: ["web"]
})

// Tutorial videos
const tutorials = await brave_video_search({
  query: "BoldSign API integration tutorial",
  count: 10
})

// Blog posts and guides
const guides = await brave_web_search({
  query: "BoldSign API integration guide examples",
  freshness: "py",
  count: 10
})

// Recent updates
const updates = await brave_news_search({
  query: "BoldSign API new features",
  freshness: "pm"
})
```

### Example 4: Comparative Research

```typescript
// Find comparison articles
const comparisons = await brave_web_search({
  query: "Supabase vs Firebase comparison 2025",
  freshness: "py",
  count: 10
})

// Find video comparisons
const videoComparisons = await brave_video_search({
  query: "Supabase vs Firebase which to choose"
})

// Recent discussions
const discussions = await brave_web_search({
  query: "Supabase Firebase reddit discussion",
  result_filter: ["discussions"],
  freshness: "pm"
})
```

## Advanced Search Techniques

### Site-Specific Searches

```typescript
// Search specific websites
query: "site:dev.to React hooks patterns"
query: "site:medium.com TypeScript best practices"
query: "site:github.com stripe webhook examples"
query: "site:stackoverflow.com Next.js authentication"
```

### Operator Searches

```typescript
// Exact phrase
query: '"useEffect cleanup function"'

// Exclude terms
query: "React hooks -class components"

// OR operator
query: "Supabase OR Firebase realtime"

// Wildcard
query: "React * patterns"

// Combine operators
query: 'site:github.com "stripe webhooks" -archived'
```

### Time-Sensitive Queries

```typescript
// Force recent results
query: "React best practices 2025"
freshness: "pw"

// Historical comparison
query: "JavaScript frameworks popularity 2024"
freshness: "2024-01-01to2024-12-31"

// Breaking news
query: "Supabase announcement"
freshness: "pd"
```

## Integration Patterns

### Pattern 1: Multi-Source Validation

```typescript
// Get official info from Context7
const officialDocs = await context7_get_docs({
  context7CompatibleLibraryID: "/stripe/stripe",
  topic: "webhooks"
})

// Get community best practices from Brave
const bestPractices = await brave_web_search({
  query: "Stripe webhooks best practices 2025",
  freshness: "py",
  count: 10
})

// Get recent issues from Brave
const issues = await brave_web_search({
  query: "site:github.com stripe webhooks issues",
  freshness: "pm"
})

// Cross-reference all three
```

### Pattern 2: Technology Evaluation

```typescript
// Official features
const features = await brave_web_search({
  query: "Supabase features documentation"
})

// User reviews
const reviews = await brave_web_search({
  query: "Supabase review reddit developer experience",
  result_filter: ["discussions"]
})

// Video demos
const demos = await brave_video_search({
  query: "Supabase full application demo"
})

// Recent updates
const updates = await brave_news_search({
  query: "Supabase updates",
  freshness: "pm"
})
```

### Pattern 3: Problem Solving

```typescript
// 1. Search for error message
const errorResults = await brave_web_search({
  query: '"Error: Connection timeout" Supabase',
  count: 10
})

// 2. Find discussions
const discussions = await brave_web_search({
  query: "Supabase connection timeout site:stackoverflow.com",
  result_filter: ["discussions"]
})

// 3. Check recent issues
const recentIssues = await brave_web_search({
  query: "site:github.com/supabase connection timeout",
  freshness: "pm"
})

// 4. Find solutions
const solutions = await brave_web_search({
  query: "Supabase connection timeout solution fix"
})
```

## Response Handling

### Parsing Results

```typescript
interface BraveSearchResult {
  url: string
  title: string
  description: string
  extra_snippets?: string[]
  age?: string
  page_age?: string
  thumbnail_url?: string
  breaking?: boolean  // News only
}

// Process results
results.forEach(result => {
  console.log(`Title: ${result.title}`)
  console.log(`URL: ${result.url}`)
  console.log(`Description: ${result.description}`)

  if (result.extra_snippets) {
    result.extra_snippets.forEach(snippet => {
      console.log(`  - ${snippet}`)
    })
  }

  if (result.age) {
    console.log(`Published: ${result.age}`)
  }
})
```

### Filtering Results

```typescript
// Filter by recency
const recentResults = results.filter(r => {
  if (!r.page_age) return false
  const age = new Date(r.page_age)
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return age >= oneMonthAgo
})

// Filter by domain
const githubResults = results.filter(r =>
  r.url.includes('github.com')
)

// Filter by keywords in title
const tutorialResults = results.filter(r =>
  r.title.toLowerCase().includes('tutorial') ||
  r.title.toLowerCase().includes('guide')
)
```

## Best Practices

### Query Construction

```typescript
// ✅ GOOD: Specific, actionable queries
"React hooks useEffect cleanup patterns"
"Stripe webhook signature verification Node.js"
"Supabase real-time subscriptions best practices 2025"

// ✅ GOOD: Use operators for precision
'site:dev.to "React Server Components"'
"Next.js authentication -Firebase"
'"TypeScript" "utility types" tutorial'

// ❌ AVOID: Too broad
"React"
"webhooks"
"authentication"

// ❌ AVOID: Questions (use Perplexity instead)
"how do I use React hooks?"
"what is the best authentication library?"
```

### Result Filtering Strategy

```typescript
// Start broad
const broad = await brave_web_search({
  query: "React hooks patterns"
})

// Analyze, then narrow
const narrow = await brave_web_search({
  query: "React hooks patterns",
  result_filter: ["web"],
  freshness: "py",
  count: 5
})

// Get specific
const specific = await brave_web_search({
  query: 'site:react.dev "custom hooks" patterns',
  result_filter: ["web"]
})
```

### Freshness Selection

```typescript
// Current news and updates
freshness: "pd"  // or "pw"

// Tutorials and guides
freshness: "pm"  // or "py"

// Evergreen content
// Omit freshness parameter

// Historical analysis
freshness: "2024-01-01to2024-12-31"
```

## Common Use Cases

### Use Case 1: Staying Current

```typescript
// Daily tech news
await brave_news_search({
  query: "JavaScript TypeScript React updates",
  freshness: "pd",
  count: 20
})

// Weekly framework updates
await brave_news_search({
  query: "web development framework releases",
  freshness: "pw"
})
```

### Use Case 2: Finding Tutorials

```typescript
// Video tutorials
await brave_video_search({
  query: "Next.js 14 complete tutorial beginner"
})

// Written tutorials
await brave_web_search({
  query: "Next.js 14 tutorial step by step",
  freshness: "py"
})
```

### Use Case 3: Community Research

```typescript
// Reddit discussions
await brave_web_search({
  query: "site:reddit.com/r/webdev Supabase vs Firebase",
  result_filter: ["discussions"]
})

// Dev.to articles
await brave_web_search({
  query: 'site:dev.to "Supabase" tutorial'
})
```

### Use Case 4: Troubleshooting

```typescript
// Error messages
await brave_web_search({
  query: '"Error: ECONNREFUSED" Supabase Node.js'
})

// Stack Overflow
await brave_web_search({
  query: "site:stackoverflow.com Supabase connection refused"
})

// GitHub issues
await brave_web_search({
  query: "site:github.com supabase-js connection issues",
  freshness: "pm"
})
```

## Performance Optimization

### Request Batching

```typescript
// Run searches in parallel
const [webResults, newsResults, videoResults] = await Promise.all([
  brave_web_search({ query: "React 19 features" }),
  brave_news_search({ query: "React 19 release", freshness: "pw" }),
  brave_video_search({ query: "React 19 tutorial" })
])
```

### Result Limiting

```typescript
// Quick overview
count: 5

// Standard research
count: 10

// Comprehensive search
count: 20

// Maximum (videos/images)
count: 50  // or 200 for images
```

### Pagination Strategy

```typescript
// Get first page
const page1 = await brave_web_search({
  query: "React hooks patterns",
  offset: 0,
  count: 10
})

// If needed, get more
const page2 = await brave_web_search({
  query: "React hooks patterns",
  offset: 1,
  count: 10
})

// Maximum offset is 9
```

## Limitations

### Known Limitations

1. **Max offset**: Limited to 9 (max 10 pages)
2. **Query length**: 400 characters, 50 words
3. **Country specific**: Some features vary by region
4. **Rate limits**: Standard API rate limiting applies
5. **Summarizer**: Requires Pro AI subscription

### Workarounds

```typescript
// Limitation: Max 10 pages
// Solution: Refine query to get better results in first pages

// Limitation: Query length
// Solution: Use multiple specific queries instead of one long query

// Limitation: Summarizer needs Pro
// Solution: Use Perplexity for AI summaries instead
```

## Summary

**When to Use Brave Search**:
- ✅ Finding current information and news
- ✅ Discovering tutorials and blog posts
- ✅ Community discussions and forums
- ✅ Video content and demos
- ✅ Stack Overflow and GitHub searches
- ✅ Visual references and UI inspiration
- ✅ Location-based searches (Pro)

**When to Use Alternatives**:
- ❌ Official API documentation → Context7
- ❌ SDK code examples → Docfork
- ❌ AI synthesis and analysis → Perplexity
- ❌ Curated code patterns → Context7
- ❌ Deep comparative analysis → Perplexity
