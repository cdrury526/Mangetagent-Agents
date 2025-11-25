# Modern UI/UX Design Patterns for 2025

## Introduction

Modern UI/UX design in 2025 focuses on **accessibility-first**, **performance-optimized**, and **user-centered** experiences. This guide covers contemporary design patterns, best practices, and implementation strategies using Shadcn UI.

## Core Design Principles

### 1. Accessibility First (A11y)

Accessibility isn't optional—it's fundamental. With 1 in 4 adults in the U.S. living with a disability, accessible design benefits everyone.

**Key Requirements**:
- ✅ WCAG 2.1 Level AA compliance minimum
- ✅ 4.5:1 contrast ratio for normal text
- ✅ 3:1 contrast ratio for large text and UI components
- ✅ Keyboard navigation for all interactive elements
- ✅ Screen reader compatibility
- ✅ Focus indicators that are visible
- ✅ Alternative text for images
- ✅ Semantic HTML structure

**Implementation with Shadcn UI**:
```tsx
// All Shadcn components have accessibility built-in
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

// Proper ARIA attributes automatically applied
<Dialog>
  <DialogContent>
    <DialogTitle>Accessible Dialog</DialogTitle>
    {/* Screen reader friendly */}
  </DialogContent>
</Dialog>

// Keyboard navigation works out of the box
<Button onClick={handleClick}>
  Submit Form
</Button>
```

### 2. Mobile-First Design

Design for mobile screens first, then scale up to larger devices.

**Best Practices**:
- Touch targets minimum 44×44px
- Vertical scrolling patterns
- Collapsible menus and navigation
- Thumb-friendly zone consideration
- Progressive disclosure of information

**Implementation**:
```tsx
<Button
  size="lg"  // Large enough for touch
  className="w-full sm:w-auto"  // Full width on mobile
>
  Submit
</Button>

<div className="flex flex-col sm:flex-row gap-4">
  {/* Stacks on mobile, side-by-side on desktop */}
</div>
```

### 3. Performance Optimization

Speed equals satisfaction. Lag equals lost users.

**Key Metrics (2025 Standards)**:
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

**Optimization Techniques**:
```tsx
// 1. Code splitting
const Dialog = lazy(() => import("@/components/ui/dialog"))

// 2. Image optimization
<Image
  src="/hero.jpg"
  alt="Hero image"
  loading="lazy"
  width={800}
  height={600}
  format="webp"
/>

// 3. Component lazy loading
<Suspense fallback={<Skeleton className="h-12 w-12" />}>
  <HeavyComponent />
</Suspense>

// 4. Virtual scrolling for long lists
import { useVirtualizer } from "@tanstack/react-virtual"
```

### 4. Consistency & Predictability

Users expect interfaces to be easy to navigate with clear patterns.

**Design System Approach**:
- Consistent spacing (8px grid system)
- Standardized components
- Predictable interactions
- Familiar patterns (don't reinvent the wheel)

**Shadcn UI Benefits**:
```tsx
// Consistent spacing automatically
<div className="space-y-4">  {/* 16px gaps */}
  <Card className="p-6">     {/* 24px padding */}
    <CardHeader className="pb-4">  {/* 16px bottom padding */}
      <CardTitle>Consistent Spacing</CardTitle>
    </CardHeader>
  </Card>
</div>
```

## Modern UI Patterns

### 1. Glassmorphism

Frosted glass effect with blur and transparency.

**When to Use**: Hero sections, modals, cards over images

**Implementation**:
```tsx
<Card className="bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20">
  <CardHeader>
    <CardTitle>Glassmorphism Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content with frosted glass effect</p>
  </CardContent>
</Card>

// Overlay with glassmorphism
<div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
```

**Best Practices**:
- Ensure text remains readable (check contrast)
- Use on top of images or gradients
- Keep blur subtle (8-16px)
- Test in dark mode

### 2. Soft Shadows & Depth

Modern shadow system for subtle depth.

**Implementation**:
```tsx
// Tailwind custom shadows
// tailwind.config.ts
export default {
  theme: {
    extend: {
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 8px 16px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'soft-xl': '0 12px 24px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.08)',
      },
    },
  },
}

// Usage
<Card className="shadow-soft hover:shadow-soft-lg transition-shadow">
  <CardContent>Subtle elevation</CardContent>
</Card>
```

### 3. Micro-interactions

Small animations that provide feedback and delight.

**Examples**:
```tsx
// Button with hover effect
<Button className="transition-all hover:scale-105 active:scale-95">
  Click me
</Button>

// Loading state
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Loading..." : "Submit"}
</Button>

// Success feedback
const [success, setSuccess] = useState(false)

<Button
  onClick={handleSubmit}
  className={cn(
    "transition-colors",
    success && "bg-green-600 hover:bg-green-700"
  )}
>
  {success ? (
    <>
      <Check className="mr-2 h-4 w-4" />
      Saved!
    </>
  ) : (
    "Save"
  )}
</Button>
```

### 4. Progressive Disclosure

Show only what users need, when they need it.

**Implementation**:
```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Collapsible sections
<Collapsible>
  <CollapsibleTrigger>
    <Button variant="ghost">
      Show advanced options
      <ChevronDown className="h-4 w-4" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Advanced form fields */}
  </CollapsibleContent>
</Collapsible>

// Accordion for FAQs
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>How does it work?</AccordionTrigger>
    <AccordionContent>Detailed explanation...</AccordionContent>
  </AccordionItem>
</Accordion>
```

### 5. Empty States

Engaging empty states that guide users.

**Best Practices**:
- Show clear next steps
- Use friendly illustrations or icons
- Explain why it's empty
- Provide action buttons

**Implementation**:
```tsx
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Inbox className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        When you receive messages, they'll appear here. Start a conversation to get started.
      </p>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Message
      </Button>
    </div>
  )
}
```

### 6. Skeleton Loading

Show content structure while loading.

**Implementation**:
```tsx
import { Skeleton } from "@/components/ui/skeleton"

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  )
}

// Usage
{isLoading ? <CardSkeleton /> : <Card>...</Card>}
```

### 7. Toast Notifications

Non-intrusive feedback messages.

**Implementation**:
```tsx
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

function MyComponent() {
  const { toast } = useToast()

  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Your changes have been saved.",
    })
  }

  const handleError = () => {
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description: "There was a problem with your request.",
    })
  }

  return (
    <>
      <Button onClick={handleSuccess}>Save</Button>
      <Toaster />
    </>
  )
}
```

### 8. Command Palette (⌘K Pattern)

Quick access to actions and navigation.

**Implementation**:
```tsx
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"

function CommandMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Suggestions">
        <CommandItem onSelect={() => router.push("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </CommandItem>
        <CommandItem onSelect={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </CommandItem>
      </CommandGroup>
    </CommandDialog>
  )
}
```

### 9. Contextual Actions

Actions appear in context, reducing cognitive load.

**Implementation**:
```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

<Card className="group relative">
  <CardContent>
    <p>Card content...</p>
  </CardContent>

  {/* Actions appear on hover */}
  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</Card>
```

### 10. Smart Defaults & Inline Validation

Reduce errors with intelligent defaults and real-time feedback.

**Implementation**:
```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
})

<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input
            placeholder="you@example.com"
            {...field}
            // Show success indicator
            className={cn(
              field.value && !form.formState.errors.email && "border-green-500"
            )}
          />
        </FormControl>
        <FormMessage />  {/* Shows error inline */}
      </FormItem>
    )}
  />
</Form>
```

## Color & Theming Patterns

### 1. Dark Mode

Essential in 2025. Users expect it.

**Implementation**:
```tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

function ThemeToggle() {
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

### 2. Color Blind Friendly Palettes

Never rely solely on color to convey information.

**Best Practices**:
```tsx
// ❌ Bad: Color only
<Badge className="bg-green-500">Active</Badge>
<Badge className="bg-red-500">Inactive</Badge>

// ✅ Good: Color + icon/text
<Badge className="bg-green-500">
  <CheckCircle className="mr-1 h-3 w-3" />
  Active
</Badge>
<Badge className="bg-red-500">
  <XCircle className="mr-1 h-3 w-3" />
  Inactive
</Badge>

// ✅ Good: Patterns
<div className="border-2 border-green-500 border-dashed">Success</div>
<div className="border-2 border-red-500">Error</div>
```

### 3. High Contrast Mode Support

```css
/* globals.css */
@media (prefers-contrast: high) {
  :root {
    --border: 0 0% 0%;
    --foreground: 0 0% 0%;
    --background: 0 0% 100%;
  }

  .dark {
    --border: 0 0% 100%;
    --foreground: 0 0% 100%;
    --background: 0 0% 0%;
  }
}
```

## Layout Patterns

### 1. Dashboard Layout

**Implementation**:
```tsx
import { Sidebar } from "@/components/ui/sidebar"

<div className="flex h-screen">
  {/* Sidebar */}
  <Sidebar className="w-64 border-r">
    <SidebarHeader>
      <h2>Dashboard</h2>
    </SidebarHeader>
    <SidebarContent>
      <SidebarNav items={navItems} />
    </SidebarContent>
  </Sidebar>

  {/* Main content */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Header */}
    <header className="border-b px-6 py-4">
      <h1>Page Title</h1>
    </header>

    {/* Scrollable content */}
    <main className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>
```

### 2. Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{item.description}</p>
      </CardContent>
      <CardFooter>
        <Button>View Details</Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

### 3. Data Table with Filters

```tsx
<div className="space-y-4">
  {/* Filters */}
  <div className="flex items-center justify-between">
    <Input
      placeholder="Search..."
      className="max-w-sm"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
    <div className="flex gap-2">
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Table */}
  <DataTable columns={columns} data={filteredData} />
</div>
```

## Form Patterns

### 1. Multi-Step Forms

```tsx
<Card>
  {/* Progress indicator */}
  <CardHeader>
    <div className="flex justify-between mb-4">
      {steps.map((step, index) => (
        <div key={index} className={cn(
          "flex items-center",
          index <= currentStep ? "text-primary" : "text-muted-foreground"
        )}>
          <div className="rounded-full border-2 p-2">
            {index + 1}
          </div>
          <span className="ml-2">{step.name}</span>
        </div>
      ))}
    </div>
  </CardHeader>

  <CardContent>
    {/* Step content */}
    {currentStep === 0 && <Step1Form />}
    {currentStep === 1 && <Step2Form />}
    {currentStep === 2 && <Step3Form />}
  </CardContent>

  <CardFooter className="flex justify-between">
    <Button
      variant="outline"
      onClick={() => setCurrentStep(s => s - 1)}
      disabled={currentStep === 0}
    >
      Previous
    </Button>
    <Button onClick={() => setCurrentStep(s => s + 1)}>
      {currentStep === steps.length - 1 ? "Submit" : "Next"}
    </Button>
  </CardFooter>
</Card>
```

### 2. Inline Editing

```tsx
const [isEditing, setIsEditing] = useState(false)
const [value, setValue] = useState(initialValue)

{isEditing ? (
  <div className="flex gap-2">
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoFocus
    />
    <Button size="icon" onClick={handleSave}>
      <Check className="h-4 w-4" />
    </Button>
    <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
      <X className="h-4 w-4" />
    </Button>
  </div>
) : (
  <div className="flex items-center gap-2 group">
    <span>{value}</span>
    <Button
      size="icon"
      variant="ghost"
      className="opacity-0 group-hover:opacity-100"
      onClick={() => setIsEditing(true)}
    >
      <Pencil className="h-4 w-4" />
    </Button>
  </div>
)}
```

## Accessibility Best Practices

### 1. Keyboard Navigation

```tsx
// Ensure all interactive elements are keyboard accessible
<Button onClick={handleClick}>
  Accessible Button
</Button>

// Custom focus styles
<Button className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
  Custom Focus Ring
</Button>

// Skip to content link
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50"
>
  Skip to content
</a>
```

### 2. ARIA Labels

```tsx
// Icon-only buttons
<Button size="icon" aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Loading states
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? "Loading..." : "Submit"}
</Button>

// Expandable sections
<Collapsible>
  <CollapsibleTrigger aria-expanded={isOpen}>
    Show more
  </CollapsibleTrigger>
  <CollapsibleContent>
    Content
  </CollapsibleContent>
</Collapsible>
```

### 3. Focus Management

```tsx
import { useRef, useEffect } from "react"

function Dialog({ isOpen }) {
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [isOpen])

  return (
    <DialogContent>
      <Input ref={firstInputRef} placeholder="First input" />
    </DialogContent>
  )
}
```

## Performance Patterns

### 1. Virtual Scrolling

For long lists:
```tsx
import { useVirtualizer } from "@tanstack/react-virtual"

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div key={virtualItem.key} style={{ height: virtualItem.size }}>
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. Debounced Search

```tsx
import { useDebouncedValue } from "@/hooks/use-debounced-value"

function SearchInput() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    // Only triggers 300ms after user stops typing
    fetchResults(debouncedSearch)
  }, [debouncedSearch])

  return (
    <Input
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  )
}
```

## Testing UX

### Checklist for Every Feature

- [ ] Works with keyboard only
- [ ] Screen reader announces changes
- [ ] Visible focus indicators
- [ ] Sufficient color contrast (4.5:1)
- [ ] Works in mobile viewport
- [ ] Works in dark mode
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Success feedback is provided
- [ ] Works with slow connection

### Tools

- **Accessibility**: axe DevTools, WAVE
- **Contrast**: Stark, Contrast Checker
- **Performance**: Lighthouse, WebPageTest
- **Mobile**: BrowserStack, Device Farm

## Resources

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design](https://m3.material.io)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [A11y Project](https://www.a11yproject.com)

## Next Steps

- [Component Examples](./04-Common-Components.md)
- [Building Forms](./07-Building-Forms.md)
- [Accessibility Guide](./09-Accessibility.md)
