# Research Tools Documentation

**Comprehensive guide to leveraging Context7, Docfork, Brave Search, and Perplexity for autonomous AI research.**

## 📚 Documentation Structure

### Getting Started
1. **[00_Overview.md](./00_Overview.md)** - Start here
   - Introduction to all research tools
   - Decision matrix for tool selection
   - Quick reference commands
   - Best practices overview

### Individual Tool Guides
2. **[01_Context7.md](./01_Context7.md)** - Official library documentation
   - Library resolution and documentation retrieval
   - Quality indicators and version support
   - Practical examples and use cases
   - Integration patterns

3. **[02_Docfork.md](./02_Docfork.md)** - GitHub documentation search
   - Searching GitHub repositories
   - Reading documentation URLs
   - Token budget optimization
   - Real-world implementation examples

4. **[03_Brave_Search.md](./03_Brave_Search.md)** - Web search engine
   - Web, news, video, image, and local search
   - Advanced search operators
   - Freshness and filtering strategies
   - Community research patterns

5. **[04_Perplexity.md](./04_Perplexity.md)** - AI-powered research
   - Search, ask, research, and reasoning functions
   - Citation handling and quality
   - Complex query construction
   - Multi-turn conversations

### Advanced Topics
6. **[05_Research_Workflows.md](./05_Research_Workflows.md)** - Automation patterns
   - Core research workflows
   - Advanced automation patterns
   - Research agent architecture
   - Performance optimization

## 🎯 Quick Start

### Choose Your Path

**I want to:**
- **Learn a new library** → Start with [Context7](./01_Context7.md), then [Docfork](./02_Docfork.md)
- **Debug an issue** → Start with [Brave Search](./03_Brave_Search.md), then [Perplexity](./04_Perplexity.md)
- **Evaluate technologies** → Start with [Perplexity Research](./04_Perplexity.md)
- **Stay current** → Use [Brave News](./03_Brave_Search.md#brave_news_search)
- **Find code examples** → Start with [Docfork](./02_Docfork.md)
- **Get best practices** → Start with [Perplexity Research](./04_Perplexity.md#perplexity_research)

## 🔍 Tool Comparison at a Glance

| Tool | Best For | Response Type | Speed | Cost |
|------|----------|---------------|-------|------|
| **Context7** | Official docs, API reference | Curated snippets | Fast | Low |
| **Docfork** | GitHub code examples | URLs + content | Fast | Low |
| **Brave Search** | Current info, community | Search results | Fast | Low |
| **Perplexity** | AI synthesis, analysis | AI-generated text | Medium | Medium |

## 📖 Learning Path

### Beginner Path
1. Read [00_Overview.md](./00_Overview.md) - Understand when to use each tool
2. Read [01_Context7.md](./01_Context7.md) - Learn official documentation lookup
3. Try examples from [02_Docfork.md](./02_Docfork.md) - Find code examples
4. Experiment with [03_Brave_Search.md](./03_Brave_Search.md) - Web searches

### Intermediate Path
1. Complete Beginner Path
2. Study [04_Perplexity.md](./04_Perplexity.md) - AI-powered research
3. Review workflows in [05_Research_Workflows.md](./05_Research_Workflows.md)
4. Practice combining multiple tools

### Advanced Path
1. Complete Intermediate Path
2. Implement automation patterns from [05_Research_Workflows.md](./05_Research_Workflows.md)
3. Build custom research workflows
4. Develop autonomous research agents

## 🚀 Common Scenarios

### Scenario 1: "I need to implement Stripe webhooks"

```typescript
// Step 1: Get official API docs (Context7)
const apiDocs = await context7_get_library_docs({
  context7CompatibleLibraryID: "/stripe/stripe-node",
  topic: "webhook signature verification"
})

// Step 2: Find real examples (Docfork)
const examples = await docfork_search_docs({
  query: "Stripe webhook implementation Node.js",
  libraryId: "stripe/stripe-node"
})

// Step 3: Get best practices (Perplexity)
const bestPractices = await perplexity_research({
  messages: [{
    role: "user",
    content: "Stripe webhook security best practices 2025"
  }]
})
```

See [Workflow 4: Implementing a New Feature](./05_Research_Workflows.md#workflow-4-implementing-a-new-feature)

### Scenario 2: "Which database should I use?"

```typescript
// Use Perplexity Research for comprehensive comparison
const comparison = await perplexity_research({
  messages: [{
    role: "user",
    content: `Compare Supabase vs Firebase for:
    - Real-time features
    - Complex queries
    - Cost at 1000 users
    - TypeScript support
    Provide detailed analysis with sources.`
  }]
})
```

See [Workflow 3: Technology Evaluation](./05_Research_Workflows.md#workflow-3-technology-evaluation--selection)

### Scenario 3: "My code is throwing an error"

```typescript
// Step 1: Search for exact error (Brave)
const errorResults = await brave_web_search({
  query: '"Error: Connection timeout" Supabase realtime',
  count: 10
})

// Step 2: Get AI diagnosis (Perplexity)
const diagnosis = await perplexity_reason({
  messages: [{
    role: "user",
    content: "Analyze Supabase Connection timeout error: causes and solutions"
  }]
})
```

See [Workflow 2: Solving a Bug](./05_Research_Workflows.md#workflow-2-solving-a-bugissue)

### Scenario 4: "I want to learn React hooks"

```typescript
// Step 1: Official docs (Context7)
const docs = await context7_get_library_docs({
  context7CompatibleLibraryID: "/websites/react_dev",
  topic: "hooks"
})

// Step 2: Video tutorials (Brave)
const videos = await brave_video_search({
  query: "React hooks tutorial 2025"
})

// Step 3: Best practices (Perplexity)
const practices = await perplexity_research({
  messages: [{
    role: "user",
    content: "React hooks best practices and patterns 2025"
  }]
})
```

See [Workflow 1: Learning a New Library](./05_Research_Workflows.md#workflow-1-learning-a-new-library)

## 🎓 Key Concepts

### Information Quality Hierarchy

1. **Primary Sources** (Highest Quality)
   - Official documentation (Context7)
   - Source code (Docfork - GitHub)
   - Official announcements (Brave News)

2. **Secondary Sources** (Good Quality)
   - Tutorials from reputable sites (Brave Search)
   - Stack Overflow discussions (Brave Search)
   - Technical blog posts (Brave Search)

3. **Synthesized Sources** (AI-Generated)
   - Perplexity Research reports
   - Perplexity Reasoning
   - AI summaries

**Best Practice**: Combine multiple levels for validation

### Tool Selection Framework

**Use Context7 when:**
- You know the library name
- You need official API reference
- You want curated code examples
- Version-specific docs needed

**Use Docfork when:**
- Library not in Context7
- You need real implementation examples
- Searching GitHub repositories
- Finding test code

**Use Brave Search when:**
- Need current information
- Looking for community discussions
- Finding tutorials/videos
- Error message lookup

**Use Perplexity when:**
- Need synthesis from multiple sources
- Comparing technologies
- Complex questions requiring analysis
- Want AI-generated summaries with citations

## 🔧 Development Guidelines

### For Manual Research

1. **Start with clear intent**: What are you trying to accomplish?
2. **Choose optimal tool**: Use decision matrix from Overview
3. **Verify information**: Cross-reference multiple sources
4. **Document findings**: Keep track of sources and citations
5. **Test code examples**: Always verify code works in your context

### For Autonomous Agent Development

1. **Implement decision logic**: Tool selection based on query intent
2. **Build workflow executor**: Chain tools systematically
3. **Add quality scoring**: Evaluate source credibility
4. **Implement caching**: Avoid redundant requests
5. **Create synthesis engine**: Combine results intelligently
6. **Monitor performance**: Track costs and response times
7. **Learn from feedback**: Improve tool selection over time

See [Research Agent Architecture](./05_Research_Workflows.md#research-agent-architecture)

## 📊 Performance Considerations

### Response Times (Approximate)

- Context7: 1-3 seconds
- Docfork: 2-5 seconds
- Brave Search: 1-2 seconds
- Perplexity Ask: 3-5 seconds
- Perplexity Research: 10-30 seconds

### Token Usage (Approximate)

- Context7: 1,000-3,000 tokens
- Docfork: 500-5,000 tokens (controllable)
- Brave Search: 500-2,000 tokens
- Perplexity Ask: 500-2,000 tokens
- Perplexity Research: 5,000-15,000 tokens

### Cost Optimization

1. **Cache frequent queries**: Store commonly accessed docs locally
2. **Use token limits**: Control Docfork response size
3. **Strip thinking tags**: Use `strip_thinking: true` for Perplexity
4. **Batch requests**: Run independent queries in parallel
5. **Choose appropriate tool**: Don't use Research for simple questions

## 🎯 Best Practices Summary

### Research Quality

- ✅ Always cite sources
- ✅ Cross-reference multiple tools
- ✅ Verify code examples by testing
- ✅ Check publication dates for recency
- ✅ Evaluate source reputation
- ❌ Don't trust single source
- ❌ Don't skip verification
- ❌ Don't ignore conflicts between sources

### Query Construction

- ✅ Be specific about technology and version
- ✅ Include programming language
- ✅ Use technical terminology
- ✅ Specify context when relevant
- ❌ Avoid vague queries
- ❌ Don't use questions for search (use Perplexity)
- ❌ Don't omit important context

### Tool Combination

- ✅ Start with most specific tool
- ✅ Use parallel requests when independent
- ✅ Validate with multiple sources
- ✅ Synthesize findings with Perplexity
- ❌ Don't use all tools for every query
- ❌ Don't ignore tool strengths/weaknesses

## 🚦 Getting Started Checklist

- [ ] Read [00_Overview.md](./00_Overview.md)
- [ ] Understand when to use each tool
- [ ] Try Context7 with a known library
- [ ] Search GitHub with Docfork
- [ ] Perform web search with Brave
- [ ] Ask Perplexity a complex question
- [ ] Review one complete workflow
- [ ] Practice combining multiple tools
- [ ] Experiment with automation patterns

## 📝 Next Steps

### For Immediate Use
1. Read Overview and tool guides
2. Try examples from each tool
3. Use workflows for common scenarios
4. Build mental model for tool selection

### For Research Agent Development
1. Study [Research Workflows](./05_Research_Workflows.md)
2. Implement decision logic
3. Build workflow executor
4. Add quality assurance
5. Create synthesis engine
6. Deploy and monitor

## 🔗 External Resources

- Context7 API: Uses official library documentation
- Docfork: Searches GitHub repositories
- Brave Search API: https://brave.com/search/api/
- Perplexity API: AI-powered research platform

## 📞 Support

For issues or questions:
1. Review relevant tool documentation
2. Check workflows for similar scenarios
3. Consult best practices
4. Test with simplified queries
5. Document findings for future reference

---

**Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: Development Team

**Purpose**: This documentation enables both manual research workflows and the development of autonomous research agents capable of gathering, validating, and synthesizing information from multiple sources.
