# Gemini Partner Request

The user wants you to use **Gemini CLI** (gemini-3-pro-preview) to handle this task.

## User's Request
$ARGUMENTS

## Instructions

1. **Invoke Gemini** using the Bash tool with this pattern:
```bash
gemini -y -o json -m gemini-3-pro-preview "<detailed prompt based on user's request>"
```

2. **Craft a good prompt** that:
   - Clearly describes what the user wants
   - References project context (Gemini has GEMINI.md loaded automatically)
   - Asks for structured output when appropriate
   - Specifies file paths if Gemini should create/edit files

3. **Review the response** from Gemini's JSON output and:
   - Summarize key findings for the user
   - If Gemini created/modified files, verify they follow project patterns
   - If there are issues, iterate with Gemini or fix them yourself

4. **Use Gemini's strengths**:
   - **Large codebase analysis** (1M token context)
   - **Web search** for research tasks
   - **Bulk file operations** when many files need changes
   - **Second opinion** on architecture/approach

## Example Invocations

**Research:**
```bash
gemini -y -o json -m gemini-3-pro-preview "Research the latest best practices for [topic]. Include code examples and cite sources."
```

**Debug/Investigate:**
```bash
gemini -y -o json -m gemini-3-pro-preview "Investigate this error in the codebase: [error]. Check all related files and identify the root cause."
```

**Create Component:**
```bash
gemini -y -o json -m gemini-3-pro-preview "Create a React TypeScript component for [description]. Follow the patterns in src/components/ and use Tailwind CSS + shadcn/ui. Save to: src/components/[name].tsx"
```

**Code Review:**
```bash
gemini -y -o json -m gemini-3-pro-preview "Review the code in [file/directory] for issues, security concerns, and improvements. Reference project patterns from GEMINI.md."
```

Now invoke Gemini with a well-crafted prompt for the user's request above.
