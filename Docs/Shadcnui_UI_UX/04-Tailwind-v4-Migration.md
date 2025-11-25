# Shadcn UI with Tailwind CSS v4

## Overview

**As of February 2025**, Shadcn UI fully supports Tailwind CSS v4! This guide covers the new installation process and migration from v3 to v4.

## What's New in Tailwind v4

### Major Changes

1. **CSS-First Configuration** - No more JavaScript config files
2. **New @theme Directive** - Define themes directly in CSS
3. **@import Instead of @tailwind** - New import syntax
4. **Built-in Color Functions** - Colors now include `hsl()` wrapper
5. **New Animation System** - `tailwindcss-animate` deprecated, use `tw-animate-css`
6. **PostCSS Plugin Split** - New `@tailwindcss/postcss` package
7. **Modern Browser Targets** - Safari 16.4+, Chrome 111+, Firefox 128+

### Browser Support

Tailwind v4 requires modern browsers:
- Safari 16.4+
- Chrome 111+
- Firefox 128+

**If you need older browser support, stay on Tailwind v3.**

## Fresh Installation with Tailwind v4

### Next.js 15 + Tailwind v4 + Shadcn UI

```bash
# Create Next.js 15 project
npx create-next-app@latest my-app
cd my-app

# Install Tailwind v4 (if not already installed)
npm install tailwindcss@next @tailwindcss/postcss@next

# Initialize Shadcn UI with v4 support
npx shadcn@latest init
```

During initialization:
- Choose **CSS variables for colors** (recommended)
- Select your preferred style (Default or New York)
- Choose base color (slate, gray, zinc, etc.)

### Vite + React + Tailwind v4 + Shadcn UI

```bash
# Create Vite project
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# Install Tailwind v4
npm install -D tailwindcss@next @tailwindcss/postcss@next

# Install path resolution
npm install -D @types/node

# Initialize Shadcn UI
npx shadcn@latest init
```

**Important Vite Configuration:**

`vite.config.ts`:
```ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

## CSS Configuration (Tailwind v4)

### New CSS Structure

In Tailwind v4, configuration happens in CSS, not JavaScript.

**app/globals.css** (or **src/index.css** for Vite):

```css
@import "tailwindcss";

/* Define your theme */
@theme {
  /* Color palette */
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;

  --color-card: 0 0% 100%;
  --color-card-foreground: 222.2 84% 4.9%;

  --color-popover: 0 0% 100%;
  --color-popover-foreground: 222.2 84% 4.9%;

  --color-primary: 222.2 47.4% 11.2%;
  --color-primary-foreground: 210 40% 98%;

  --color-secondary: 210 40% 96.1%;
  --color-secondary-foreground: 222.2 47.4% 11.2%;

  --color-muted: 210 40% 96.1%;
  --color-muted-foreground: 215.4 16.3% 46.9%;

  --color-accent: 210 40% 96.1%;
  --color-accent-foreground: 222.2 47.4% 11.2%;

  --color-destructive: 0 84.2% 60.2%;
  --color-destructive-foreground: 210 40% 98%;

  --color-border: 214.3 31.8% 91.4%;
  --color-input: 214.3 31.8% 91.4%;
  --color-ring: 222.2 84% 4.9%;

  /* Radius */
  --radius-lg: 0.5rem;
  --radius-md: calc(0.5rem - 2px);
  --radius-sm: calc(0.5rem - 4px);
}

/* Dark mode colors */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: 222.2 84% 4.9%;
    --color-foreground: 210 40% 98%;

    --color-card: 222.2 84% 4.9%;
    --color-card-foreground: 210 40% 98%;

    --color-popover: 222.2 84% 4.9%;
    --color-popover-foreground: 210 40% 98%;

    --color-primary: 210 40% 98%;
    --color-primary-foreground: 222.2 47.4% 11.2%;

    --color-secondary: 217.2 32.6% 17.5%;
    --color-secondary-foreground: 210 40% 98%;

    --color-muted: 217.2 32.6% 17.5%;
    --color-muted-foreground: 215 20.2% 65.1%;

    --color-accent: 217.2 32.6% 17.5%;
    --color-accent-foreground: 210 40% 98%;

    --color-destructive: 0 62.8% 30.6%;
    --color-destructive-foreground: 210 40% 98%;

    --color-border: 217.2 32.6% 17.5%;
    --color-input: 217.2 32.6% 17.5%;
    --color-ring: 212.7 26.8% 83.9%;
  }
}

/* Base styles */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Key Differences from v3

#### 1. Variable Naming
```css
/* v3 - Variables in :root */
:root {
  --background: 0 0% 100%;
  --primary: 222.2 47.4% 11.2%;
}

/* v4 - Variables in @theme with --color- prefix */
@theme {
  --color-background: 0 0% 100%;
  --color-primary: 222.2 47.4% 11.2%;
}
```

#### 2. HSL Wrapper
In v4, colors automatically get the `hsl()` wrapper:

```tsx
// v3 - You had to wrap manually
<div className="bg-primary">  // Actually uses hsl(var(--primary))

// v4 - Colors already include hsl()
<div className="bg-primary">  // Uses var(--color-primary) with hsl() built-in
```

This means for charts and JavaScript usage:

```tsx
// v3
const chartConfig = {
  desktop: {
    color: "hsl(var(--chart-1))",  // Had to wrap
  },
}

// v4
const chartConfig = {
  desktop: {
    color: "var(--chart-1)",  // No wrapper needed!
  },
}
```

#### 3. Animation System
```bash
# v3
npm install -D tailwindcss-animate

# v4 (March 2025+)
npm install -D tw-animate-css
```

```css
/* v3 - In tailwind.config.js */
plugins: [require("tailwindcss-animate")]

/* v4 - In globals.css */
@import "tailwindcss";
@import "tw-animate-css";
```

## Migrating from Tailwind v3 to v4

### Step 1: Use the Official Upgrade Tool

```bash
# Run the Tailwind upgrade codemod
npx @tailwindcss/upgrade@next
```

This will:
- Remove deprecated utility classes
- Update your Tailwind config
- Migrate CSS variables to `@theme` directive
- Update your `globals.css`

### Step 2: Update Dependencies

```bash
# Remove old Tailwind v3
npm uninstall tailwindcss postcss autoprefixer

# Install Tailwind v4
npm install -D tailwindcss@next @tailwindcss/postcss@next
```

### Step 3: Update PostCSS Config

**postcss.config.mjs** (or .js):

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Step 4: Update CSS Variables

The Shadcn CLI will help with this:

```bash
npx shadcn@latest init -f
```

Or manually update your `globals.css` following the structure above.

### Step 5: Update Animation Library (March 2025+)

```bash
# Remove old animation plugin
npm uninstall tailwindcss-animate

# Install new animation library
npm install -D tw-animate-css
```

Update `globals.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";  /* Add this */
```

### Step 6: Update Chart Colors

If you use Recharts with Shadcn charts:

```tsx
// Before (v3)
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
}

// After (v4)
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",  // Remove hsl() wrapper
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
}
```

### Step 7: Update Size Utilities

The new `size-*` utility is now supported:

```tsx
// Before
<div className="h-10 w-10">

// After (both work, but size-* is preferred)
<div className="size-10">
```

### Step 8: Remove React.forwardRef (React 19)

If you're also upgrading to React 19:

```tsx
// Before (React 18)
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={className} {...props} />
  )
)

// After (React 19)
const Button = ({ className, ...props }: ButtonProps) => (
  <button className={className} {...props} />
)
```

## Dark Mode with Tailwind v4

### Class-Based Dark Mode

**globals.css**:
```css
@import "tailwindcss";

@theme {
  /* Light mode colors */
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 84% 4.9%;
}

/* Dark mode with .dark class */
.dark {
  @theme {
    --color-background: 222.2 84% 4.9%;
    --color-foreground: 210 40% 98%;
  }
}
```

**Theme Toggle Component**:
```tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

## Advanced Configuration

### Custom Colors

```css
@theme {
  /* Add custom brand colors */
  --color-brand: 217 91% 60%;
  --color-brand-foreground: 0 0% 100%;

  /* Add chart colors */
  --color-chart-1: 12 76% 61%;
  --color-chart-2: 173 58% 39%;
  --color-chart-3: 197 37% 24%;
}
```

Usage:
```tsx
<div className="bg-brand text-brand-foreground">
  Brand Color
</div>
```

### Custom Radius Values

```css
@theme {
  --radius-lg: 1rem;      /* More rounded */
  --radius-md: 0.75rem;
  --radius-sm: 0.5rem;
}
```

### Multiple Theme Support

```css
@import "tailwindcss";

/* Default theme */
@theme {
  --color-primary: 222.2 47.4% 11.2%;
}

/* Blue theme */
[data-theme="blue"] {
  @theme {
    --color-primary: 217 91% 60%;
  }
}

/* Green theme */
[data-theme="green"] {
  @theme {
    --color-primary: 142 76% 36%;
  }
}
```

## Common Migration Issues

### Issue 1: Colors Not Working

**Problem**: Colors aren't applying after upgrade.

**Solution**: Ensure you're using the `--color-` prefix in `@theme`:

```css
/* ❌ Wrong */
@theme {
  --background: 0 0% 100%;
}

/* ✅ Correct */
@theme {
  --color-background: 0 0% 100%;
}
```

### Issue 2: Animations Broken

**Problem**: Animations stopped working after upgrade.

**Solution**: Install and import `tw-animate-css`:

```bash
npm install -D tw-animate-css
```

```css
@import "tailwindcss";
@import "tw-animate-css";
```

### Issue 3: Dark Mode Not Switching

**Problem**: Dark mode toggle doesn't work.

**Solution**: Use `.dark` selector instead of `@media` for class-based dark mode:

```css
/* ❌ Wrong for class-based */
@media (prefers-color-scheme: dark) {
  @theme { /* ... */ }
}

/* ✅ Correct for class-based */
.dark {
  @theme { /* ... */ }
}
```

### Issue 4: Chart Colors Broken

**Problem**: Chart colors not displaying.

**Solution**: Remove `hsl()` wrapper from chart config:

```tsx
// ❌ Wrong (v3 syntax)
color: "hsl(var(--chart-1))"

// ✅ Correct (v4 syntax)
color: "var(--chart-1)"
```

## Component.json Configuration

No changes needed! The same `components.json` works with both v3 and v4:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",  // Empty for v4 (no JS config)
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Benefits of Tailwind v4

### 1. Simpler Configuration
- No more JavaScript config files
- Everything in CSS
- More intuitive for designers

### 2. Better Performance
- Faster build times
- Smaller CSS bundle
- Optimized for modern browsers

### 3. Improved Developer Experience
- CSS-first approach
- Better IDE support
- Easier to debug

### 4. Modern Features
- Native CSS variables support
- Better color mixing
- Advanced selectors

## Legacy Documentation (Tailwind v3)

If you need to stay on Tailwind v3, visit:
- [v3.shadcn.com/docs/installation](https://v3.shadcn.com/docs/installation)

## Testing Your Migration

### Checklist

- [ ] All components render correctly
- [ ] Dark mode switches properly
- [ ] Colors display as expected
- [ ] Animations work
- [ ] Charts display correct colors
- [ ] Build completes without errors
- [ ] No console warnings
- [ ] Performance is good (LCP < 2.5s)

### Visual Regression Testing

Test these components after migration:
- Buttons (all variants)
- Forms (inputs, selects, checkboxes)
- Cards and layouts
- Dialogs and modals
- Charts (if used)
- Dark mode toggle

## Resources

- [Official Tailwind v4 Docs](https://tailwindcss.com/docs)
- [Tailwind v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Shadcn Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [tw-animate-css](https://github.com/new-data-services/tailwindcss-animate)

## Next Steps

- [Theming & Customization](./03-Theming-Customization.md)
- [Common Components](./04-Common-Components.md)
- [Modern UI/UX Patterns](./06-Modern-UI-UX-Patterns.md)

---

**Last Updated**: March 2025

**Status**: ✅ Shadcn UI fully supports Tailwind CSS v4
