# Shadcn UI & Modern UI/UX Documentation

Welcome to the comprehensive guide for Shadcn UI, modern UI/UX patterns, and AI-assisted development workflows for 2025.

## 📚 Documentation Structure

### Core Shadcn UI Guides

1. **[Shadcn UI Overview](./01-Shadcn-UI-Overview.md)**
   - What is Shadcn UI and why use it
   - Core philosophy and architecture
   - Key benefits and use cases
   - Component categories
   - Design principles

2. **[Installation & Setup](./02-Installation-Setup.md)**
   - Quick start guide
   - Framework-specific setup (Next.js, Vite, Remix, Astro)
   - Manual installation steps
   - Configuration options
   - Troubleshooting common issues

3. **[Theming & Customization](./03-Theming-Customization.md)**
   - CSS variable-based theming system
   - Creating custom themes
   - Using OKLCH color space (2025 best practice)
   - Pre-built themes
   - Component customization with CVA
   - Advanced customization techniques

3.5. **[Tailwind v4 Migration](./04-Tailwind-v4-Migration.md)** ⭐ NEW
   - What's new in Tailwind v4
   - Fresh installation with v4
   - Migration guide from v3 to v4
   - New CSS-first configuration
   - @theme directive usage
   - Common migration issues

4. **[Modern UI/UX Patterns](./06-Modern-UI-UX-Patterns.md)**
   - CSS variable-based theming system
   - Creating custom themes
   - Using OKLCH color space (2025 best practice)
   - Pre-built themes
   - Component customization with CVA
   - Advanced customization techniques

### AI-Assisted Development

4. **[MCP Server Usage](./05-MCP-Server-Usage.md)**
   - What is the Shadcn MCP Server
   - Installation for different IDEs (Claude, Cursor, Windsurf, Cline)
   - Available MCP tools and their usage
   - Practical examples
   - Advanced configuration
   - Best practices for working with AI

### Modern Design Patterns

5. **[Modern UI/UX Patterns](./06-Modern-UI-UX-Patterns.md)**
   - Core design principles (Accessibility, Mobile-First, Performance)
   - Modern UI patterns (Glassmorphism, Micro-interactions, Progressive Disclosure)
   - Color and theming patterns
   - Layout patterns (Dashboard, Card Grid, Data Tables)
   - Form patterns (Multi-step, Inline Editing)
   - Accessibility best practices
   - Performance optimization

## 🚀 Quick Start

### For New Projects

```bash
# Create a new Next.js project
npx create-next-app@latest my-app --typescript --tailwind --eslint
cd my-app

# Initialize Shadcn UI
npx shadcn@latest init

# Add your first component
npx shadcn@latest add button dialog card
```

### For AI-Assisted Development

```bash
# Install Shadcn MCP Server (for Claude Code)
npx shadcn@latest mcp add

# Or for Cursor/Windsurf, see MCP Server Usage guide
```

## 📖 Learning Path

### Beginners
1. Start with [01-Shadcn-UI-Overview.md](./01-Shadcn-UI-Overview.md) to understand the philosophy
2. Follow [02-Installation-Setup.md](./02-Installation-Setup.md) for your framework
3. Explore [03-Theming-Customization.md](./03-Theming-Customization.md) to customize

### Intermediate
1. Read [06-Modern-UI-UX-Patterns.md](./06-Modern-UI-UX-Patterns.md) for design patterns
2. Study component composition techniques
3. Implement accessibility best practices

### Advanced
1. Set up [05-MCP-Server-Usage.md](./05-MCP-Server-Usage.md) for AI assistance
2. Create custom registries
3. Build a complete design system

## 🎯 Key Concepts

### Copy-Paste, Not Install
Shadcn UI is **not** a traditional npm package. You copy component source code into your project, giving you:
- ✅ Full ownership and control
- ✅ Complete customization freedom
- ✅ No version conflicts
- ✅ Zero bundle bloat

### Built on Solid Foundations
- **Radix UI** - Accessible primitives
- **Tailwind CSS** (v3 or v4) - Utility-first styling
- **TypeScript** - Type safety
- **CSS Variables** - Easy theming

> **🎉 New in 2025**: Full support for Tailwind CSS v4 with CSS-first configuration!

### Accessibility First
All components are:
- WCAG 2.1 Level AA compliant
- Keyboard navigable
- Screen reader friendly
- Focus managed properly

## 🎨 Design System Approach

Shadcn UI is designed to be the **foundation** of your design system:

```
Your Design System
├── Shadcn UI (base components)
├── Custom components (built on Shadcn)
├── Theme (CSS variables)
├── Patterns (reusable compositions)
└── Guidelines (usage rules)
```

## 🛠️ Essential Tools

### Theme Generators
- [Official Shadcn Themes](https://ui.shadcn.com/themes)
- [Shadcn Studio](https://shadcnstudio.com/theme-generator)
- [Tweakcn](https://tweakcn.com)

### MCP Servers
- Official: `npx shadcn@latest mcp start`
- Community: `npx @jpisnice/shadcn-ui-mcp-server`

### Development Tools
- [MCP Inspector](http://127.0.0.1:6274) - Debug MCP connections
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Accessibility
- [OKLCH Color Picker](https://oklch.com) - Modern color selection

## 📋 Best Practices

### Component Customization
```tsx
// ✅ Good: Create wrapper components
export function BrandButton({ children, ...props }) {
  return <Button variant="default" className="custom-styles" {...props}>
    {children}
  </Button>
}

// ❌ Bad: Modifying ui/button.tsx directly
```

### Theming
```tsx
// ✅ Good: Use semantic colors
<div className="bg-primary text-primary-foreground">

// ❌ Bad: Hardcoded colors
<div className="bg-blue-500 text-white">
```

### Accessibility
```tsx
// ✅ Good: Descriptive labels
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// ❌ Bad: Icon without label
<Button>
  <X className="h-4 w-4" />
</Button>
```

## 🌟 2025 Design Trends

### Must-Have Features
- ✅ Dark mode support
- ✅ Mobile-first responsive design
- ✅ WCAG AA accessibility
- ✅ Performance optimized (LCP < 2.5s)
- ✅ Keyboard navigation
- ✅ Loading and error states
- ✅ Toast notifications
- ✅ Command palette (⌘K)

### Modern Patterns
- Glassmorphism for overlays
- Soft shadows for depth
- Micro-interactions for feedback
- Progressive disclosure
- Skeleton loading
- Smart defaults

### Color Systems
- OKLCH color space (better than HSL)
- Semantic color tokens
- Dark mode by default
- Color blind friendly palettes
- High contrast mode support

## 🤖 AI-Assisted Development

With the Shadcn MCP Server, AI assistants can:
- Search for components in registries
- Fetch component source code
- Provide usage examples
- Generate installation commands
- Offer framework-specific guidance

Example prompts:
```
"Add a dialog component with a form inside"
"Show me button examples with all variants"
"Create a data table with sorting and filtering"
"Build a multi-step form with validation"
```

## 📊 Component Overview

### Form Components
Button, Input, Textarea, Select, Checkbox, Radio, Switch, Label, Form, Command, Combobox

### Layout Components
Card, Container, Separator, Tabs, Accordion, Collapsible, Sidebar

### Feedback Components
Alert, Toast, Dialog, Sheet, Popover, Tooltip, Progress, Skeleton, Badge

### Navigation Components
Breadcrumb, Pagination, Menu, Navigation Menu

### Data Display
Table, Data Table, Avatar, Calendar, Date Picker, Chart

## 🔗 Useful Links

### Official Resources
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [GitHub Repository](https://github.com/shadcn-ui/ui)
- [Component Registry](https://ui.shadcn.com/r)

### Community Resources
- [Awesome Shadcn UI](https://github.com/birobirobiro/awesome-shadcn-ui)
- [Shadcn Templates](https://www.shadcn.io/template)
- [MCP Servers Directory](https://mcpservers.org)

### Learning Resources
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🎓 Examples & Templates

### Dashboard Templates
- Admin panels
- Analytics dashboards
- SaaS platforms

### Landing Pages
- Product launches
- Marketing sites
- Portfolio sites

### Applications
- E-commerce
- Social platforms
- Productivity tools

## 🐛 Common Issues

### Import Errors
**Problem**: `Cannot find module '@/components/ui/button'`

**Solution**: Check `tsconfig.json` path aliases and restart TypeScript server

### Styles Not Applying
**Problem**: Tailwind classes not working

**Solution**: Verify `content` paths in `tailwind.config.ts` and import `globals.css`

### Dark Mode Issues
**Problem**: Dark mode not switching

**Solution**: Ensure `darkMode: ["class"]` in Tailwind config and `dark` class on `<html>`

See [02-Installation-Setup.md](./02-Installation-Setup.md#common-issues--solutions) for more.

## 📝 Contributing

These docs are maintained for internal project use. Feel free to:
- Add examples
- Update best practices
- Document new patterns
- Share learnings

## 📄 License

This documentation is for project use. Shadcn UI itself is MIT licensed.

---

**Last Updated**: 2025-11-23

**Maintained By**: Project Team

**Questions?** Check the individual guide files or refer to [official Shadcn documentation](https://ui.shadcn.com).
