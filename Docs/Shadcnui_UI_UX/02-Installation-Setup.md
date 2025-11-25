# Shadcn UI - Installation & Setup

## Prerequisites

Before installing Shadcn UI, ensure you have:

- Node.js 18.0.0 or higher
- React 18 or higher
- Tailwind CSS 3.0 or higher (or Tailwind CSS v4 - see [Tailwind v4 Migration Guide](./04-Tailwind-v4-Migration.md))
- A React framework (Next.js, Vite, Remix, etc.)

> **Note**: As of February 2025, Shadcn UI fully supports **Tailwind CSS v4**! See our [Tailwind v4 Migration Guide](./04-Tailwind-v4-Migration.md) for the new CSS-first configuration approach.

## Quick Start

### 1. Initialize Your Project

For a new Next.js project:

```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint
cd my-app
```

For Vite:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Initialize Shadcn UI

Run the initialization command:

```bash
npx shadcn@latest init
```

This will:
1. Install required dependencies
2. Create `components.json` configuration file
3. Set up Tailwind CSS configuration
4. Create CSS variables for theming
5. Add utility functions

You'll be prompted with several questions:

```
Would you like to use TypeScript? (recommended) … yes
Which style would you like to use? › Default
Which color would you like to use as base color? › Slate
Where is your global CSS file? › app/globals.css
Would you like to use CSS variables for colors? › yes
Where is your tailwind.config located? › tailwind.config.ts
Configure the import alias for components: › @/components
Configure the import alias for utils: › @/lib/utils
Are you using React Server Components? › yes
```

## Framework-Specific Setup

### Next.js (App Router)

```bash
npx create-next-app@latest my-app
cd my-app
npx shadcn@latest init
```

`next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Shadcn UI works out of the box
}

module.exports = nextConfig
```

### Next.js (Pages Router)

```bash
npx create-next-app@latest my-app
cd my-app
npx shadcn@latest init
```

When prompted for React Server Components, select **No**.

### Vite

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install path resolution
npm install -D @types/node

# Initialize Shadcn UI
npx shadcn@latest init
```

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

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Remix

```bash
npx create-remix@latest my-app
cd my-app

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Initialize Shadcn UI
npx shadcn@latest init
```

`remix.config.js`:
```js
/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  tailwind: true,
  // ...
}
```

### Astro

```bash
npm create astro@latest my-app
cd my-app

# Enable React
npx astro add react tailwind

# Initialize Shadcn UI
npx shadcn@latest init
```

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
})
```

## Manual Setup

If you prefer manual setup or the CLI doesn't work:

### Step 1: Install Dependencies

```bash
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot
```

### Step 2: Configure Tailwind

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

### Step 3: Add CSS Variables

> **Note**: The syntax below is for **Tailwind CSS v3**. For **Tailwind v4**, see the [Tailwind v4 Migration Guide](./04-Tailwind-v4-Migration.md) which uses `@import "tailwindcss"` and `@theme` directive instead.

`app/globals.css` (Tailwind v3):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Step 4: Create Utility Functions

`lib/utils.ts`:
```ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Step 5: Create components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
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

## Adding Components

After initialization, you can add components:

```bash
# Add a single component
npx shadcn@latest add button

# Add multiple components
npx shadcn@latest add button dialog card

# Add all components
npx shadcn@latest add
```

This will:
1. Download the component code
2. Add it to `components/ui/`
3. Install any required dependencies
4. Configure imports

## Project Structure

After setup, your project structure will look like:

```
my-app/
├── app/
│   ├── globals.css
│   └── page.tsx
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── dialog.tsx
│       └── ...
├── lib/
│   └── utils.ts
├── components.json
├── tailwind.config.ts
└── package.json
```

## Configuration Options

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",           // "default" | "new-york"
  "rsc": true,                  // React Server Components
  "tsx": true,                  // Use TypeScript
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",       // "slate" | "gray" | "zinc" | "neutral" | "stone"
    "cssVariables": true        // Use CSS variables for colors
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Style Options

**default**: Modern, clean design
**new-york**: Slightly different aesthetic with sharper edges

### Base Colors

Choose from: `slate`, `gray`, `zinc`, `neutral`, or `stone`

This determines the neutral color palette for your theme.

### CSS Variables vs. Utility Classes

**CSS Variables (recommended)**:
```tsx
<div className="bg-primary text-primary-foreground" />
```

**Utility Classes**:
```tsx
<div className="bg-slate-900 text-slate-50" />
```

CSS variables are recommended because they:
- Support theming out of the box
- Easy to customize
- Work with dark mode
- Maintain consistency

## TypeScript Configuration

Ensure your `tsconfig.json` includes path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Common Issues & Solutions

### Import Alias Not Working

**Problem**: `Cannot find module '@/components/ui/button'`

**Solution**:
1. Check `tsconfig.json` has correct path aliases
2. Restart your TypeScript server
3. For Vite, ensure `vite.config.ts` has resolve aliases

### Tailwind Classes Not Working

**Problem**: Styles not applying

**Solution**:
1. Verify Tailwind is configured correctly
2. Check `content` paths in `tailwind.config.ts`
3. Ensure `globals.css` is imported
4. Clear cache: `rm -rf .next` or `rm -rf node_modules/.vite`

### Dark Mode Not Working

**Problem**: Dark mode classes not applying

**Solution**:
1. Ensure `darkMode: ["class"]` in `tailwind.config.ts`
2. Add dark mode toggle to apply `dark` class to `<html>`

### Component Styles Look Wrong

**Problem**: Components don't match documentation

**Solution**:
1. Ensure CSS variables are defined in `globals.css`
2. Check Tailwind animation plugin is installed
3. Verify `tailwindcss-animate` is in plugins

## Next Steps

1. [Theming & Customization](./03-Theming-Customization.md)
2. [Common Components Guide](./04-Common-Components.md)
3. [Building Forms](./07-Building-Forms.md)
4. [Dark Mode Setup](./08-Dark-Mode.md)

## Useful Commands

```bash
# See what components are available
npx shadcn@latest add

# Check for component updates
npx shadcn@latest diff

# Update a component
npx shadcn@latest update button

# See CLI help
npx shadcn@latest --help
```
