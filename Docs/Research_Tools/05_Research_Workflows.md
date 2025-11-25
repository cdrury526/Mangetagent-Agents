# Research Workflows & Automation Patterns

## Overview

This guide provides comprehensive workflows for combining the research tools (Context7, Docfork, Brave Search, Perplexity) to maximize research efficiency. These patterns are designed for both manual research and autonomous research agent implementation.

## Core Research Workflows

### Workflow 1: Learning a New Library

**Scenario**: You need to learn and implement a new library/framework

**Steps**:

```typescript
// Step 1: Get official overview (Context7)
const overview = await context7_resolve_library_id({
  libraryName: "react-query"
})

const intro = await context7_get_library_docs({
  context7CompatibleLibraryID: overview[0].libraryId,
  topic: "getting started"
})

// Step 2: Find implementation examples (Docfork)
const examples = await docfork_search_docs({
  query: "react-query implementation patterns examples",
  tokens: 3000
})

const exampleCode = await docfork_read_url({
  url: examples[0].url
})

// Step 3: Get best practices (Perplexity)
const bestPractices = await perplexity_research({
  messages: [{
    role: "user",
    content: "React Query best practices 2025: setup, caching strategies, error handling, performance optimization"
  }],
  strip_thinking: true
})

// Step 4: Find tutorials (Brave)
const tutorials = await brave_video_search({
  query: "React Query tutorial 2025 complete guide"
})

const articles = await brave_web_search({
  query: "React Query practical guide examples",
  freshness: "py",
  count: 10
})

// Output: Comprehensive learning package
return {
  officialDocs: intro,
  codeExamples: exampleCode,
  bestPractices: bestPractices.response,
  tutorials: { videos: tutorials, articles: articles }
}
```

**Why This Works**:
- Context7: Authoritative API reference
- Docfork: Real working code
- Perplexity: Synthesized wisdom
- Brave: Community knowledge

---

### Workflow 2: Solving a Bug/Issue

**Scenario**: You're debugging a specific error or unexpected behavior

**Steps**:

```typescript
// Step 1: Search for exact error (Brave)
const exactError = await brave_web_search({
  query: `"Error: Connection timeout" Supabase realtime`,
  count: 10
})

// Step 2: Check GitHub issues (Brave)
const gitHubIssues = await brave_web_search({
  query: "site:github.com/supabase connection timeout",
  freshness: "pm",
  count: 5
})

// Step 3: Check Stack Overflow (Brave)
const stackoverflow = await brave_web_search({
  query: "site:stackoverflow.com Supabase realtime connection timeout",
  result_filter: ["discussions"]
})

// Step 4: Get diagnostic analysis (Perplexity)
const diagnosis = await perplexity_reason({
  messages: [{
    role: "user",
    content: `Analyze this Supabase error:
    Error: "Connection timeout" in realtime subscriptions
    Context: [your context]
    Environment: [your setup]

    Provide: likely causes, debugging steps, solutions`
  }]
})

// Step 5: Check official docs for solution (Context7)
const officialSolution = await context7_get_library_docs({
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "troubleshooting connection issues"
})

// Output: Comprehensive troubleshooting guide
return {
  communityReports: exactError,
  githubIssues: gitHubIssues,
  stackoverflowDiscussions: stackoverflow,
  aiDiagnosis: diagnosis.response,
  officialGuidance: officialSolution
}
```

---

### Workflow 3: Technology Evaluation & Selection

**Scenario**: Choosing between technologies for a project

**Steps**:

```typescript
// Step 1: Quick overview of each option (Perplexity Ask)
const option1Overview = await perplexity_ask({
  messages: [{
    role: "user",
    content: "Brief overview of Supabase: key features, strengths, ideal use cases"
  }]
})

const option2Overview = await perplexity_ask({
  messages: [{
    role: "user",
    content: "Brief overview of Firebase: key features, strengths, ideal use cases"
  }]
})

// Step 2: Deep comparative analysis (Perplexity Research)
const comparison = await perplexity_research({
  messages: [{
    role: "user",
    content: `Compare Supabase vs Firebase for real estate SaaS:

    Requirements:
    - Real-time collaboration features
    - Complex queries with joins
    - Row-level security
    - 100-1000 concurrent users
    - Team knows PostgreSQL

    Compare: architecture, performance, cost, developer experience, scaling

    Provide data-driven analysis with sources.`
  }]
})

// Step 3: Check recent updates/news (Brave News)
const supabaseNews = await brave_news_search({
  query: "Supabase updates features",
  freshness: "pm"
})

const firebaseNews = await brave_news_search({
  query: "Firebase updates features",
  freshness: "pm"
})

// Step 4: Community sentiment (Brave Web)
const communityOpinions = await brave_web_search({
  query: "Supabase vs Firebase reddit developer experience 2025",
  result_filter: ["discussions"],
  freshness: "py"
})

// Step 5: Get official capabilities (Context7)
const supabaseDocs = await context7_get_library_docs({
  context7CompatibleLibraryID: "/supabase/supabase",
  topic: "realtime subscriptions"
})

// Step 6: Final reasoning (Perplexity Reason)
const recommendation = await perplexity_reason({
  messages: [{
    role: "user",
    content: `Based on these requirements [from step 2], which should I choose: Supabase or Firebase?

    Consider:
    - Technical requirements fit
    - Team expertise (PostgreSQL)
    - Long-term maintenance
    - Cost at scale
    - Migration risk

    Provide clear recommendation with reasoning.`
  }]
})

// Output: Complete evaluation package
return {
  quickOverviews: { supabase: option1Overview, firebase: option2Overview },
  detailedComparison: comparison.response,
  recentNews: { supabase: supabaseNews, firebase: firebaseNews },
  communityInsights: communityOpinions,
  officialCapabilities: supabaseDocs,
  finalRecommendation: recommendation.response
}
```

---

### Workflow 4: Implementing a New Feature

**Scenario**: You need to implement a specific feature you haven't done before

**Steps**:

```typescript
const feature = "webhook signature verification"
const technology = "Stripe"
const language = "Node.js"

// Step 1: Get official API documentation (Context7)
const apiDocs = await context7_get_library_docs({
  context7CompatibleLibraryID: "/stripe/stripe-node",
  topic: feature
})

// Step 2: Find real implementation examples (Docfork)
const implementations = await docfork_search_docs({
  query: `${technology} ${feature} ${language} implementation`,
  libraryId: "stripe/stripe-node",
  tokens: 3000
})

const exampleCode = await Promise.all(
  implementations.slice(0, 2).map(impl =>
    docfork_read_url({ url: impl.url })
  )
)

// Step 3: Get best practices (Perplexity Research)
const bestPractices = await perplexity_research({
  messages: [{
    role: "user",
    content: `${technology} ${feature} best practices for production:
    - Security considerations
    - Error handling
    - Testing strategies
    - Common pitfalls
    - Performance optimization

    Include code examples and authoritative sources.`
  }],
  strip_thinking: true
})

// Step 4: Find tutorials (Brave)
const tutorials = await brave_web_search({
  query: `${technology} ${feature} ${language} tutorial guide`,
  freshness: "py",
  count: 5
})

const videoTutorials = await brave_video_search({
  query: `${technology} ${feature} tutorial`,
  count: 3
})

// Step 5: Get test examples (Docfork)
const testExamples = await docfork_search_docs({
  query: `${technology} ${feature} tests examples`,
  libraryId: "stripe/stripe-node",
  tokens: 2000
})

// Output: Complete implementation guide
return {
  officialApi: apiDocs,
  workingExamples: exampleCode,
  bestPractices: bestPractices.response,
  tutorials: { written: tutorials, video: videoTutorials },
  testExamples: testExamples
}
```

---

### Workflow 5: Staying Current with Technology

**Scenario**: Regular updates on technologies you use

**Steps**:

```typescript
const technologies = ["Supabase", "React", "Stripe", "TypeScript"]

// Step 1: Get latest news (Brave News)
const latestNews = await Promise.all(
  technologies.map(tech =>
    brave_news_search({
      query: `${tech} updates features releases`,
      freshness: "pw",
      count: 5
    })
  )
)

// Step 2: Check breaking changes (Brave Web)
const breakingChanges = await Promise.all(
  technologies.map(tech =>
    brave_web_search({
      query: `${tech} breaking changes migration 2025`,
      freshness: "pm",
      count: 3
    })
  )
)

// Step 3: Get analysis of important updates (Perplexity)
const significantUpdates = latestNews
  .flat()
  .filter(news => isSignificant(news))

const analyses = await Promise.all(
  significantUpdates.slice(0, 3).map(update =>
    perplexity_research({
      messages: [{
        role: "user",
        content: `Analyze this update: ${update.title}

        Context: ${update.description}

        Provide:
        - Significance and impact
        - Breaking changes if any
        - Migration considerations
        - Benefits and new capabilities`
      }],
      strip_thinking: true
    })
  )
)

// Step 4: Community reactions (Brave Web)
const communityReactions = await Promise.all(
  significantUpdates.slice(0, 3).map(update =>
    brave_web_search({
      query: `${update.title} reddit discussion review`,
      result_filter: ["discussions"],
      freshness: "pw"
    })
  )
)

// Output: Technology update report
return {
  allNews: latestNews,
  breakingChanges: breakingChanges,
  detailedAnalyses: analyses.map(a => a.response),
  communityFeedback: communityReactions
}
```

---

## Advanced Automation Patterns

### Pattern 1: Parallel Research

**Use Case**: Research multiple independent topics simultaneously

```typescript
async function parallelResearch(topics: string[]) {
  // Launch all searches in parallel
  const results = await Promise.all(
    topics.map(async (topic) => {
      const [context7Docs, docforkExamples, braveArticles, perplexityAnalysis] =
        await Promise.all([
          context7_search(topic),
          docfork_search_docs({ query: topic }),
          brave_web_search({ query: topic }),
          perplexity_research({
            messages: [{ role: "user", content: `Analyze: ${topic}` }]
          })
        ])

      return {
        topic,
        officialDocs: context7Docs,
        examples: docforkExamples,
        articles: braveArticles,
        analysis: perplexityAnalysis.response
      }
    })
  )

  return results
}

// Usage
const research = await parallelResearch([
  "React Server Components",
  "Supabase Edge Functions",
  "Stripe Payment Links"
])
```

---

### Pattern 2: Progressive Refinement

**Use Case**: Start broad, progressively narrow based on findings

```typescript
async function progressiveRefinement(initialQuery: string) {
  // Stage 1: Broad search
  const broad = await brave_web_search({
    query: initialQuery,
    count: 20
  })

  // Analyze results to identify key themes
  const themes = extractThemes(broad)

  // Stage 2: Deep dive on each theme
  const deepDives = await Promise.all(
    themes.slice(0, 3).map(theme =>
      perplexity_research({
        messages: [{
          role: "user",
          content: `Deep analysis of: ${theme} in context of ${initialQuery}`
        }]
      })
    )
  )

  // Stage 3: Get specific implementations
  const implementations = await Promise.all(
    themes.slice(0, 3).map(theme =>
      docfork_search_docs({
        query: `${theme} implementation examples`,
        tokens: 3000
      })
    )
  )

  // Stage 4: Synthesize findings
  const synthesis = await perplexity_reason({
    messages: [{
      role: "user",
      content: `Synthesize these findings about ${initialQuery}:

      Key themes: ${themes.join(", ")}

      Provide unified analysis and recommendations.`
    }]
  })

  return {
    initialFindings: broad,
    identifiedThemes: themes,
    themeAnalyses: deepDives.map(d => d.response),
    implementations: implementations,
    finalSynthesis: synthesis.response
  }
}
```

---

### Pattern 3: Multi-Source Validation

**Use Case**: Validate critical information across multiple sources

```typescript
async function multiSourceValidation(claim: string) {
  // Source 1: Official documentation
  const officialDocs = await context7_search(claim)

  // Source 2: GitHub implementations
  const implementations = await docfork_search_docs({
    query: claim,
    tokens: 2000
  })

  // Source 3: Web searches
  const webResults = await brave_web_search({
    query: claim,
    count: 10
  })

  // Source 4: AI analysis
  const aiAnalysis = await perplexity_research({
    messages: [{
      role: "user",
      content: `Validate this claim with sources: "${claim}"`
    }]
  })

  // Cross-reference
  const validation = {
    claim: claim,
    officialDocumentation: officialDocs,
    realWorldImplementations: implementations,
    webSources: webResults,
    aiAnalysis: aiAnalysis.response,
    consensus: determineConsensus([
      officialDocs,
      implementations,
      webResults,
      aiAnalysis
    ])
  }

  return validation
}

function determineConsensus(sources: any[]): string {
  // Logic to determine if sources agree
  // Return: "Confirmed", "Conflicting", "Insufficient Evidence"
}
```

---

### Pattern 4: Contextual Deep Dive

**Use Case**: Research with context from previous findings

```typescript
async function contextualDeepDive(
  mainTopic: string,
  context: any
) {
  // Use context to formulate better queries
  const enrichedQuery = `${mainTopic} considering: ${summarizeContext(context)}`

  // Get focused research
  const research = await perplexity_research({
    messages: [{
      role: "user",
      content: enrichedQuery
    }]
  })

  // Extract key technical terms from research
  const technicalTerms = extractTechnicalTerms(research.response)

  // Deep dive on each technical term
  const termExplanations = await Promise.all(
    technicalTerms.map(term =>
      context7_get_library_docs({
        context7CompatibleLibraryID: determineLibrary(term, context),
        topic: term
      })
    )
  )

  // Find real-world applications
  const applications = await Promise.all(
    technicalTerms.map(term =>
      docfork_search_docs({
        query: `${term} implementation example`,
        tokens: 2000
      })
    )
  )

  return {
    mainResearch: research.response,
    technicalDeepDives: termExplanations,
    practicalApplications: applications
  }
}
```

---

### Pattern 5: Comparative Matrix Generation

**Use Case**: Create structured comparison across multiple dimensions

```typescript
async function generateComparisonMatrix(
  options: string[],
  criteria: string[]
) {
  // Get overview of each option
  const overviews = await Promise.all(
    options.map(option =>
      perplexity_ask({
        messages: [{
          role: "user",
          content: `Brief overview of ${option}: key features and characteristics`
        }]
      })
    )
  )

  // Research each criterion for each option
  const matrix = await Promise.all(
    options.map(async (option) => {
      const criteriaResearch = await Promise.all(
        criteria.map(async (criterion) => {
          // Get specific info
          const info = await perplexity_research({
            messages: [{
              role: "user",
              content: `${option}: ${criterion}. Be specific and data-driven.`
            }],
            strip_thinking: true
          })

          return {
            criterion,
            analysis: info.response
          }
        })
      )

      return {
        option,
        overview: overviews.response,
        criteria: criteriaResearch
      }
    })
  )

  // Generate final comparison
  const comparison = await perplexity_reason({
    messages: [{
      role: "user",
      content: `Compare these options: ${options.join(", ")}

      Based on criteria: ${criteria.join(", ")}

      Provide structured comparison and recommendation.`
    }]
  })

  return {
    detailedMatrix: matrix,
    finalComparison: comparison.response
  }
}

// Usage
const comparison = await generateComparisonMatrix(
  ["Supabase", "Firebase", "AWS Amplify"],
  [
    "Real-time capabilities",
    "Query complexity support",
    "Pricing at scale",
    "Developer experience",
    "TypeScript support"
  ]
)
```

---

## Research Agent Architecture

### Agent Structure

```typescript
interface ResearchAgent {
  // Core capabilities
  context7: Context7Client
  docfork: DocforkClient
  braveSearch: BraveSearchClient
  perplexity: PerplexityClient

  // Decision engine
  selectTool(query: Query): Tool
  executeWorkflow(workflow: Workflow): Results
  synthesizeFindings(results: Results[]): Report

  // Memory and learning
  cacheResults(results: Results): void
  learnFromFeedback(feedback: Feedback): void
}

interface Query {
  intent: "learn" | "debug" | "evaluate" | "implement" | "stay_current"
  topic: string
  context: any
  constraints: Constraint[]
}

interface Tool {
  name: string
  function: Function
  confidence: number
}

interface Workflow {
  steps: Step[]
  parallelizable: boolean
  dependencies: Map<Step, Step[]>
}
```

### Decision Logic

```typescript
class ResearchAgentCore {
  selectTool(query: Query): Tool {
    // Intent-based routing
    switch (query.intent) {
      case "learn":
        // Start with official docs
        return this.selectContext7OrDocfork(query)

      case "debug":
        // Start with community searches
        return this.selectBraveOrPerplexity(query)

      case "evaluate":
        // Use AI for analysis
        return { name: "perplexity", function: this.perplexity.research }

      case "implement":
        // Combination: docs + examples
        return this.selectImplementationTools(query)

      case "stay_current":
        // News and updates
        return { name: "brave_news", function: this.braveSearch.news }
    }
  }

  private selectContext7OrDocfork(query: Query): Tool {
    // If library is known and in Context7
    if (this.isInContext7(query.topic)) {
      return { name: "context7", function: this.context7.getDocs, confidence: 0.9 }
    }

    // Otherwise use Docfork
    return { name: "docfork", function: this.docfork.search, confidence: 0.7 }
  }

  private selectBraveOrPerplexity(query: Query): Tool {
    // If simple error lookup
    if (this.isSimpleErrorQuery(query)) {
      return { name: "brave_web", function: this.braveSearch.web, confidence: 0.8 }
    }

    // If needs analysis
    return { name: "perplexity_reason", function: this.perplexity.reason, confidence: 0.9 }
  }

  async executeWorkflow(workflow: Workflow): Promise<Results> {
    const results = new Map()

    // Build dependency graph
    const graph = this.buildDependencyGraph(workflow)

    // Execute in topological order
    for (const step of graph.topologicalSort()) {
      // Wait for dependencies
      await this.waitForDependencies(step, results)

      // Execute step
      const result = await step.execute()
      results.set(step, result)
    }

    return this.combineResults(results)
  }

  async synthesizeFindings(results: Results[]): Promise<Report> {
    // Use Perplexity to synthesize
    const synthesis = await this.perplexity.research({
      messages: [{
        role: "user",
        content: this.formatSynthesisPrompt(results)
      }],
      strip_thinking: true
    })

    return {
      summary: this.extractSummary(synthesis),
      details: results,
      recommendations: this.extractRecommendations(synthesis),
      sources: this.extractSources(results),
      confidence: this.calculateConfidence(results)
    }
  }
}
```

---

## Quality Assurance Patterns

### Pattern 1: Source Quality Scoring

```typescript
function scoreSource(source: any): number {
  let score = 0

  // Source reputation
  if (source.reputation === "High") score += 30
  else if (source.reputation === "Medium") score += 15

  // Recency (for time-sensitive topics)
  if (source.age) {
    const ageInDays = calculateAge(source.age)
    if (ageInDays < 30) score += 20
    else if (ageInDays < 90) score += 10
    else if (ageInDays < 365) score += 5
  }

  // Citation count (if available)
  if (source.citations) {
    score += Math.min(source.citations * 2, 30)
  }

  // Domain authority
  if (isAuthoritative(source.domain)) score += 20

  return score
}

function filterByQuality(sources: any[], minScore: number = 50): any[] {
  return sources
    .map(s => ({ ...s, score: scoreSource(s) }))
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
}
```

### Pattern 2: Consensus Building

```typescript
async function buildConsensus(topic: string): Promise<Consensus> {
  // Gather from multiple sources
  const [official, community, ai, recent] = await Promise.all([
    context7_search(topic),
    brave_web_search({ query: topic, result_filter: ["discussions"] }),
    perplexity_research({
      messages: [{ role: "user", content: `What is the consensus on: ${topic}` }]
    }),
    brave_news_search({ query: topic, freshness: "pm" })
  ])

  // Extract claims from each source
  const officialClaims = extractClaims(official)
  const communityClaims = extractClaims(community)
  const aiClaims = extractClaims(ai.response)
  const recentClaims = extractClaims(recent)

  // Find overlapping claims
  const consensus = findOverlap([
    officialClaims,
    communityClaims,
    aiClaims,
    recentClaims
  ])

  // Find conflicting claims
  const conflicts = findConflicts([
    officialClaims,
    communityClaims,
    aiClaims,
    recentClaims
  ])

  return {
    agreedPoints: consensus,
    conflictingPoints: conflicts,
    confidence: calculateConsensusConfidence(consensus, conflicts),
    sources: { official, community, ai, recent }
  }
}
```

---

## Performance Optimization

### Caching Strategy

```typescript
class ResearchCache {
  private cache = new Map<string, CachedResult>()
  private ttl = new Map<string, number>()

  async get(
    key: string,
    fetcher: () => Promise<any>,
    ttlHours: number = 24
  ): Promise<any> {
    // Check cache
    if (this.cache.has(key) && !this.isExpired(key)) {
      return this.cache.get(key).data
    }

    // Fetch new data
    const data = await fetcher()

    // Cache it
    this.cache.set(key, { data, timestamp: Date.now() })
    this.ttl.set(key, ttlHours * 3600 * 1000)

    return data
  }

  private isExpired(key: string): boolean {
    const timestamp = this.cache.get(key)?.timestamp || 0
    const ttl = this.ttl.get(key) || 0
    return Date.now() - timestamp > ttl
  }
}

// Usage
const cache = new ResearchCache()

const officialDocs = await cache.get(
  `context7:react:hooks`,
  () => context7_get_library_docs({
    context7CompatibleLibraryID: "/websites/react_dev",
    topic: "hooks"
  }),
  168  // Cache for 1 week
)
```

### Batch Processing

```typescript
async function batchResearch(queries: string[]): Promise<Results[]> {
  // Group by tool type
  const grouped = {
    context7: [],
    docfork: [],
    brave: [],
    perplexity: []
  }

  queries.forEach(q => {
    const tool = selectOptimalTool(q)
    grouped[tool].push(q)
  })

  // Execute each group in parallel
  const results = await Promise.all([
    Promise.all(grouped.context7.map(q => context7_search(q))),
    Promise.all(grouped.docfork.map(q => docfork_search_docs({ query: q }))),
    Promise.all(grouped.brave.map(q => brave_web_search({ query: q }))),
    Promise.all(grouped.perplexity.map(q => perplexity_ask({
      messages: [{ role: "user", content: q }]
    })))
  ])

  return results.flat()
}
```

---

## Error Handling & Resilience

```typescript
async function resilientResearch(query: string): Promise<Results> {
  const attempts = [
    // Primary: Context7
    () => context7_search(query),

    // Fallback 1: Docfork
    () => docfork_search_docs({ query }),

    // Fallback 2: Brave Search
    () => brave_web_search({ query }),

    // Fallback 3: Perplexity
    () => perplexity_ask({
      messages: [{ role: "user", content: query }]
    })
  ]

  for (const attempt of attempts) {
    try {
      const result = await attempt()
      if (isValidResult(result)) {
        return result
      }
    } catch (error) {
      console.warn(`Attempt failed: ${error.message}`)
      continue
    }
  }

  throw new Error("All research attempts failed")
}
```

---

## Summary

These workflows and patterns provide a foundation for:

1. **Manual Research**: Copy and adapt workflows for specific needs
2. **Automation**: Build research agents using these patterns
3. **Quality**: Ensure high-quality, validated results
4. **Efficiency**: Optimize performance and costs
5. **Resilience**: Handle failures gracefully

**Next Steps for Research Agent Development**:

1. Implement core decision logic (tool selection)
2. Build workflow executor
3. Add caching and optimization
4. Implement quality scoring
5. Create synthesis engine
6. Add learning and adaptation
7. Build monitoring and feedback loops

This documentation enables both immediate manual use and future autonomous agent development.
