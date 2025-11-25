# Shadcn UI - Theming & Customization

## Theming Philosophy

Shadcn UI uses a **CSS variable-based theming system** that provides:
- Easy color customization
- Built-in dark mode support
- Consistent design tokens
- Semantic color naming
- Quick theme switching

## Color System

### Semantic Color Tokens

Shadcn UI uses semantic color names that describe their **purpose**, not their appearance:

```css
--background      /* Main background color */
--foreground      /* Main text color */
--card           /* Card background */
--card-foreground /* Card text */
--popover        /* Popover/dropdown background */
--popover-foreground /* Popover text */
--primary        /* Primary brand color */
--primary-foreground /* Text on primary */
--secondary      /* Secondary actions */
--secondary-foreground /* Text on secondary */
--muted          /* Muted/disabled backgrounds */
--muted-foreground /* Muted text */
--accent         /* Accent backgrounds */
--accent-foreground /* Accent text */
--destructive    /* Destructive actions (delete, etc.) */
--destructive-foreground /* Text on destructive */
--border         /* Border color */
--input          /* Input border color */
--ring           /* Focus ring color */
```

### Color Naming Convention

Colors follow a **background/foreground** pattern:
- Base color (e.g., `primary`) = background color
- Foreground color (e.g., `primary-foreground`) = text color on that background

```tsx
// This ensures proper contrast automatically
<div className="bg-primary text-primary-foreground">
  Button
</div>
```

## Creating Themes

### Using Theme Generators

Several tools help generate custom themes:

1. **Official Shadcn Themes**: [ui.shadcn.com/themes](https://ui.shadcn.com/themes)
2. **Shadcn Studio**: [shadcnstudio.com/theme-generator](https://shadcnstudio.com/theme-generator)
3. **Tweakcn**: [tweakcn.com](https://tweakcn.com)
4. **StyleGlide**: Custom theme editor

### Manual Theme Creation

#### Step 1: Choose Base Colors

Pick your primary, secondary, and accent colors in HSL format:

```css
/* Example: Blue theme */
--primary: 217 91% 60%;        /* HSL: Blue */
--secondary: 210 40% 96%;      /* Light gray-blue */
--accent: 34 89% 52%;          /* Orange accent */
```

#### Step 2: Define Color Palette

Create both light and dark versions in `globals.css`:

```css
@layer base {
  :root {
    /* Light theme */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 34 89% 52%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 217 91% 60%;

    --radius: 0.5rem;
  }

  .dark {
    /* Dark theme */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 217 91% 60%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 34 89% 52%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 217 91% 60%;
  }
}
```

### Using OKLCH Color Space (2025 Best Practice)

OKLCH provides better perceptual uniformity and broader color gamut:

```css
@layer base {
  :root {
    /* Using OKLCH for more vibrant, perceptually uniform colors */
    --primary: oklch(0.65 0.25 250);
    --primary-foreground: oklch(1 0 0);

    --accent: oklch(0.75 0.20 120);
    --accent-foreground: oklch(0.2 0 0);
  }
}
```

**Benefits of OKLCH**:
- More vibrant colors
- Better perceptual uniformity
- Easier to create harmonious palettes
- Better dark mode colors

## Pre-built Themes

### Official Themes

Copy these directly into your `globals.css`:

**Zinc Theme** (Default):
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  /* ... rest of colors */
}
```

**Slate Theme**:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... rest of colors */
}
```

**Rose Theme**:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 346.8 77.2% 49.8%;
  --primary-foreground: 355.7 100% 97.3%;
  /* ... rest of colors */
}
```

### Community Themes

Explore more themes at:
- [ui.shadcn.com/themes](https://ui.shadcn.com/themes)
- [shadcnstudio.com](https://shadcnstudio.com)
- [shadcnblocks.com/themes](https://www.shadcnblocks.com/themes)

## Component Customization

### Adding Custom Variants

Extend component variants using Class Variance Authority (CVA):

```tsx
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",

        // Add your custom variants
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",

        // Add custom sizes
        xl: "h-12 rounded-md px-10 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

Usage:
```tsx
<Button variant="success">Save</Button>
<Button variant="warning" size="xl">Warning</Button>
```

### Creating Wrapper Components

Instead of modifying base components, create wrappers:

```tsx
// components/custom/brand-button.tsx
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BrandButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        className
      )}
      {...props}
    />
  )
}
```

### Custom Animations

Add custom animations to `tailwind.config.ts`:

```ts
export default {
  theme: {
    extend: {
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-in",
        "bounce-subtle": "bounce-subtle 2s infinite",
      },
    },
  },
}
```

Usage:
```tsx
<div className="animate-slide-in">Content</div>
```

## Border Radius Customization

Adjust border radius globally:

```css
:root {
  --radius: 0.5rem;  /* Default */
}

/* Sharp corners */
:root {
  --radius: 0rem;
}

/* Very rounded */
:root {
  --radius: 1rem;
}
```

Components automatically inherit this via:
```tsx
className="rounded-lg"  // Uses calc(var(--radius) + 2px)
className="rounded-md"  // Uses var(--radius)
className="rounded-sm"  // Uses calc(var(--radius) - 2px)
```

## Typography Customization

### Custom Fonts

Add custom fonts to your theme:

```ts
// tailwind.config.ts
import { fontFamily } from "tailwindcss/defaultTheme"

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        mono: ["var(--font-geist-mono)", ...fontFamily.mono],
        heading: ["var(--font-heading)", ...fontFamily.sans],
      },
    },
  },
}
```

In your layout/app file:
```tsx
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Typography Scale

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      fontSize: {
        '2xs': '0.625rem',     // 10px
        'xs': '0.75rem',       // 12px
        'sm': '0.875rem',      // 14px
        'base': '1rem',        // 16px
        'lg': '1.125rem',      // 18px
        'xl': '1.25rem',       // 20px
        '2xl': '1.5rem',       // 24px
        '3xl': '1.875rem',     // 30px
        '4xl': '2.25rem',      // 36px
        '5xl': '3rem',         // 48px
      },
    },
  },
}
```

## Spacing Customization

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
}
```

## Multi-Theme Support

Create multiple themes for different brands or contexts:

```css
/* globals.css */
@layer base {
  /* Default theme */
  :root {
    /* ... default colors ... */
  }

  /* Brand A theme */
  [data-theme="brand-a"] {
    --primary: 217 91% 60%;
    --accent: 34 89% 52%;
    /* ... */
  }

  /* Brand B theme */
  [data-theme="brand-b"] {
    --primary: 142 76% 36%;
    --accent: 271 91% 65%;
    /* ... */
  }
}
```

Apply theme via data attribute:
```tsx
<div data-theme="brand-a">
  <Button>Brand A Button</Button>
</div>
```

## Advanced Customization Techniques

### Gradient Backgrounds

```tsx
<Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
  Gradient Button
</Button>
```

### Glass Morphism

```tsx
<Card className="bg-white/10 backdrop-blur-md border border-white/20">
  <CardHeader>
    <CardTitle>Glassmorphism Card</CardTitle>
  </CardHeader>
</Card>
```

### Neumorphism (Use Sparingly)

```css
.neumorphic {
  background: #e0e0e0;
  box-shadow:
    8px 8px 16px #bebebe,
    -8px -8px 16px #ffffff;
}
```

**Note**: Neumorphism can hurt accessibility. Use with caution.

### Custom Focus Rings

```css
:root {
  --ring: 217 91% 60%;  /* Custom focus color */
}
```

Or per component:
```tsx
<Input className="focus-visible:ring-blue-500" />
```

## Best Practices for Theming

### 1. Use Semantic Colors
✅ **Good**:
```tsx
<Button className="bg-primary text-primary-foreground">Submit</Button>
```

❌ **Bad**:
```tsx
<Button className="bg-blue-600 text-white">Submit</Button>
```

### 2. Maintain Contrast Ratios
Ensure text is readable with proper contrast (WCAG AA: 4.5:1 for normal text):
- Use tools like [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Test both light and dark modes

### 3. Test Dark Mode
Always test your theme in both light and dark modes:
```tsx
<Button className="bg-primary text-primary-foreground">
  Works in both modes
</Button>
```

### 4. Keep It Consistent
Use the same color tokens throughout your app:
- Don't mix `bg-blue-500` with `bg-primary`
- Use variants instead of inline styles

### 5. Document Your Theme
Create a style guide documenting:
- Color usage
- When to use each variant
- Custom components
- Accessibility considerations

## Theme Preview

Create a theme preview page:

```tsx
// app/theme-preview/page.tsx
export default function ThemePreview() {
  return (
    <div className="space-y-8 p-8">
      <h1 className="text-4xl font-bold">Theme Preview</h1>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Colors</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-primary text-primary-foreground p-4 rounded-lg">Primary</div>
          <div className="bg-secondary text-secondary-foreground p-4 rounded-lg">Secondary</div>
          <div className="bg-accent text-accent-foreground p-4 rounded-lg">Accent</div>
          <div className="bg-destructive text-destructive-foreground p-4 rounded-lg">Destructive</div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Button Variants</h2>
        <div className="flex gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>
    </div>
  )
}
```

## Resources

- [Shadcn Theme Generator](https://ui.shadcn.com/themes)
- [Tweakcn Theme Editor](https://tweakcn.com)
- [Shadcn Studio](https://shadcnstudio.com)
- [Radix Colors](https://www.radix-ui.com/colors)
- [OKLCH Color Picker](https://oklch.com)

## Next Steps

- [Common Components](./04-Common-Components.md)
- [Dark Mode Implementation](./08-Dark-Mode.md)
- [Accessibility Best Practices](./09-Accessibility.md)
