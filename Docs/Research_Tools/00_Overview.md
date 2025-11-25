# Research Tools Overview

## Introduction

This directory contains comprehensive documentation for the research MCP (Model Context Protocol) servers available in this project. These tools enable AI-powered research capabilities to gather up-to-date information on APIs, libraries, workflows, and technical documentation.

## Available Research Tools

### 1. **Context7** - Library Documentation & Code Examples
- **Primary Use**: Official documentation and code examples for specific libraries/frameworks
- **Best For**: Learning how to use specific library features, API references, code patterns
- **Strengths**: Curated, high-quality documentation from official sources
- **File**: `01_Context7.md`

### 2. **Docfork** - GitHub Documentation Search
- **Primary Use**: Searching GitHub repositories for documentation and implementation examples
- **Best For**: Finding real-world code examples, README documentation, implementation patterns
- **Strengths**: Access to open-source projects, community-driven solutions
- **File**: `02_Docfork.md`

### 3. **Brave Search** - Web Search Engine
- **Primary Use**: General web searches, news, videos, images, local businesses
- **Best For**: Current information, blog posts, tutorials, community discussions
- **Strengths**: Multiple search types (web, news, video, local, images), fresh content
- **File**: `03_Brave_Search.md`

### 4. **Perplexity** - AI-Powered Research Assistant
- **Primary Use**: Deep research with citations, conversational queries, reasoning tasks
- **Best For**: Complex questions requiring synthesis, comparative analysis, latest best practices
- **Strengths**: AI-generated summaries with citations, comprehensive research reports
- **File**: `04_Perplexity.md`

## Decision Matrix: Which Tool to Use?

### Scenario-Based Selection Guide

| Scenario | Recommended Tool | Why |
|----------|-----------------|-----|
| "How do I use React's useEffect hook?" | **Context7** | Official React documentation with curated examples |
| "Show me Stripe webhook implementation in Node.js" | **Docfork** | Real GitHub code examples from stripe-node SDK |
| "What are the latest Supabase features in 2025?" | **Brave Search (News)** | Recent announcements and blog posts |
| "Compare Supabase vs Firebase real-time features" | **Perplexity** | AI synthesis with citations from multiple sources |
| "Find restaurants near me" | **Brave Search (Local)** | Location-based business search |
| "What are webhook security best practices?" | **Perplexity Research** | Comprehensive analysis with citations |
| "TypeScript utility types examples" | **Context7** or **Docfork** | Official docs or community examples |
| "How to implement authentication in Next.js?" | **Docfork** | Real implementation examples from repos |
| "Latest React hooks patterns 2025" | **Brave Search** | Current blog posts and articles |
| "Show me BoldSign API integration code" | **Docfork** | SDK documentation and examples |

## Research Workflow Patterns

### Pattern 1: Deep Dive Research
1. **Start with Context7**: Get official documentation and API reference
2. **Supplement with Docfork**: Find real-world implementation examples
3. **Cross-reference with Perplexity**: Get best practices and comparative analysis
4. **Update with Brave Search**: Check for latest blog posts or breaking changes

### Pattern 2: Current Events Research
1. **Start with Brave Search (News)**: Get latest announcements
2. **Deep dive with Perplexity**: Get AI analysis of implications
3. **Verify with Context7/Docfork**: Check official documentation updates

### Pattern 3: Problem Solving
1. **Start with Docfork**: Search for similar implementations
2. **Consult Context7**: Check API reference for specific methods
3. **Use Perplexity**: Get comprehensive solution with best practices
4. **Validate with Brave Search**: Find community discussions and edge cases

### Pattern 4: Learning New Technology
1. **Start with Context7**: Learn core concepts from official docs
2. **Find examples with Docfork**: See real-world usage patterns
3. **Get context with Perplexity**: Understand when/why to use it
4. **Stay current with Brave Search**: Find tutorials and guides

## Best Practices

### General Guidelines
1. **Always specify context**: Include language, framework, and version when relevant
2. **Use multiple sources**: Cross-reference information from different tools
3. **Verify recency**: Check publication dates for time-sensitive information
4. **Cite sources**: Keep track of where information came from
5. **Test examples**: Verify code examples work with your setup

### Performance Optimization
1. **Start specific**: Use the most targeted tool first
2. **Parallel queries**: Run independent queries simultaneously when possible
3. **Cache results**: Store frequently accessed documentation locally
4. **Token management**: Be mindful of response sizes with Docfork and Perplexity

### Quality Control
1. **Verify sources**: Check reputation scores (Context7) and source credibility
2. **Check dates**: Ensure information is current (especially for "2025" queries)
3. **Cross-validate**: Use multiple tools to confirm critical information
4. **Test code**: Always test code examples before implementation

## Integration with Subagent Architecture

This documentation is designed to support the creation of a **Research Specialist Subagent** that can:

1. **Autonomous Tool Selection**: Choose the right research tool based on query type
2. **Multi-Source Synthesis**: Combine results from multiple tools intelligently
3. **Quality Filtering**: Prioritize high-quality, recent, and relevant results
4. **Structured Output**: Present research findings in actionable format
5. **Citation Management**: Track and provide source attribution

## Quick Reference: Tool Commands

```javascript
// Context7 - Get library documentation
mcp__context7__resolve-library-id({ libraryName: "react" })
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/websites/react_dev",
  topic: "useEffect cleanup",
  page: 1
})

// Docfork - Search GitHub docs
mcp__Docfork__docfork_search_docs({
  query: "Stripe webhooks Node.js",
  libraryId: "stripe/stripe-node" // optional
})
mcp__Docfork__docfork_read_url({ url: "https://github.com/..." })

// Brave Search - Multiple search types
mcp__brave-search__brave_web_search({ query: "...", count: 10 })
mcp__brave-search__brave_news_search({ query: "...", freshness: "pw" })
mcp__brave-search__brave_video_search({ query: "..." })
mcp__brave-search__brave_local_search({ query: "restaurants near me" })
mcp__brave-search__brave_image_search({ query: "..." })

// Perplexity - AI research
mcp__plugin_perplexity_perplexity__perplexity_search({ query: "...", max_results: 5 })
mcp__plugin_perplexity_perplexity__perplexity_research({
  messages: [{ role: "user", content: "..." }]
})
mcp__plugin_perplexity_perplexity__perplexity_ask({
  messages: [{ role: "user", content: "..." }]
})
mcp__plugin_perplexity_perplexity__perplexity_reason({
  messages: [{ role: "user", content: "..." }]
})
```

## Next Steps

1. Review each tool's detailed documentation in order
2. Experiment with different query patterns
3. Build mental models for tool selection
4. Practice multi-tool research workflows
5. Develop automation patterns for common research tasks

## Contributing

When using these tools in your development workflow:
- Document new use cases and patterns
- Share successful multi-tool workflows
- Report tool limitations or issues
- Suggest improvements to query strategies
