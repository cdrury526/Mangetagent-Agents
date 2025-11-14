# MagnetAgent Component Library Documentation

This document provides comprehensive documentation for all reusable components in the MagnetAgent application.

**Version:** 1.0.0
**Last Updated:** 2025-11-14

---

## Table of Contents

1. [Button Component](#button-component)
2. [Input Component](#input-component)
3. [Card Component](#card-component)
4. [Alert Component](#alert-component)
5. [ProgressBar Component](#progressbar-component)

---

# Button Component

### Overview

**Brief Description:** A versatile button component that supports multiple visual variants, sizes, and loading states. Use this component for all interactive actions throughout the application.

**Component Type:** UI Element / Form Control

**File Location:** `src/components/ui/Button.tsx`

**Dependencies:** None (pure React component)

---

### Props / Parameters

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline'` | No | `'primary'` | Visual style variant of the button |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Size of the button |
| `loading` | `boolean` | No | `false` | Shows loading spinner and disables interaction |
| `disabled` | `boolean` | No | `false` | Disables the button |
| `className` | `string` | No | `''` | Additional CSS classes to apply |
| `children` | `React.ReactNode` | Yes | - | Button content (text, icons, etc.) |

**Extended Props:**
Extends `React.ButtonHTMLAttributes<HTMLButtonElement>`, so all standard button props are available: `onClick`, `type`, `form`, `aria-*`, etc.

---

### Variants / Options

#### Primary Variant

**When to Use:** Main call-to-action buttons, primary actions

**Visual Appearance:** Blue background with white text, darker blue on hover

**Example:**
```tsx
<Button variant="primary">Save Transaction</Button>
```

#### Secondary Variant

**When to Use:** Secondary actions, less prominent buttons

**Visual Appearance:** Gray background with white text, darker gray on hover

**Example:**
```tsx
<Button variant="secondary">Cancel</Button>
```

#### Outline Variant

**When to Use:** Tertiary actions, alternative to filled buttons

**Visual Appearance:** White background with gray border and text, light gray background on hover

**Example:**
```tsx
<Button variant="outline">View Details</Button>
```

---

### Usage Examples

#### Basic Usage

```tsx
import { Button } from '@/components/ui/Button';

function Example() {
  return (
    <Button onClick={() => console.log('Clicked')}>
      Click Me
    </Button>
  );
}
```

#### With Loading State

```tsx
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

function SaveButton() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await saveData();
    setIsSaving(false);
  };

  return (
    <Button loading={isSaving} onClick={handleSave}>
      Save Changes
    </Button>
  );
}
```

#### Different Sizes

```tsx
import { Button } from '@/components/ui/Button';

function SizeExamples() {
  return (
    <div className="space-x-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}
```

#### With Icons

```tsx
import { Button } from '@/components/ui/Button';
import { Plus, Save, Trash2 } from 'lucide-react';

function IconButtons() {
  return (
    <div className="space-x-2">
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Add Transaction
      </Button>

      <Button variant="secondary">
        <Save className="w-4 h-4 mr-2" />
        Save
      </Button>

      <Button variant="outline">
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  );
}
```

#### Form Submission

```tsx
import { Button } from '@/components/ui/Button';

function Form() {
  return (
    <form onSubmit={(e) => { e.preventDefault(); }}>
      <input type="text" />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

### Accessibility

#### ARIA Attributes

The Button component automatically handles most ARIA requirements, but you can add:
- `aria-label`: For buttons with only icons
- `aria-describedby`: To reference additional description elements
- `aria-pressed`: For toggle buttons

```tsx
<Button aria-label="Add new transaction">
  <Plus className="w-4 h-4" />
</Button>
```

#### Keyboard Navigation

- **Enter/Space:** Activates the button
- **Tab:** Moves focus to the button
- **Shift+Tab:** Moves focus away from the button

#### Screen Reader Support

- Announces button text or `aria-label` content
- Loading state is announced via the loading spinner presence
- Disabled state is properly announced
- Focus ring is visible for keyboard navigation

#### Focus Management

- Clear focus ring using Tailwind's `focus:ring-2 focus:ring-offset-2`
- Focus ring color matches button variant
- Focus is retained during loading state (button is disabled but focusable)

#### Color Contrast

- **Primary:** Blue (#2563eb) on white text passes WCAG AA
- **Secondary:** Gray (#4b5563) on white text passes WCAG AA
- **Outline:** Gray text (#374151) on white background passes WCAG AA
- **Disabled State:** Reduced opacity meets accessibility standards

---

### Edge Cases & Considerations

#### Loading State

When loading is true:
- Button is automatically disabled
- Spinning icon appears before button text
- Click events are prevented
- Button remains focusable but not clickable

```tsx
<Button loading={true}>Saving...</Button>
```

**Visual:** Shows animated spinner with "Saving..." text

#### Disabled State

```tsx
<Button disabled>Cannot Click</Button>
```

**Behavior:**
- Button is grayed out
- Cursor changes to not-allowed
- onClick events are prevented
- Screen readers announce as disabled

#### Long Text

The button automatically wraps text or you can control width:

```tsx
<Button className="max-w-xs truncate">
  This is a very long button text that will be truncated
</Button>
```

#### Multiple Buttons in a Row

Use Flexbox or Grid for proper spacing:

```tsx
<div className="flex space-x-2">
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</div>
```

#### Loading + Disabled

If both loading and disabled are true, disabled takes precedence visually but loading spinner still shows:

```tsx
<Button loading={true} disabled={true}>Processing</Button>
```

---

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Full width buttons are common: `className="w-full"` |
| Tablet (640-1024px) | Standard button sizing works well |
| Desktop (>1024px) | Standard button sizing, consider button groups |

**Mobile-Friendly Pattern:**

```tsx
<div className="flex flex-col sm:flex-row gap-2">
  <Button className="w-full sm:w-auto">Primary Action</Button>
  <Button variant="outline" className="w-full sm:w-auto">Secondary</Button>
</div>
```

---

### Performance Considerations

- **Re-render Optimization:** Component is lightweight and doesn't require memoization
- **Bundle Size Impact:** ~2KB minified (includes spinning animation SVG)
- **Animation Performance:** CSS animations are GPU-accelerated

---

### Browser Compatibility

- **Chrome:** Fully supported
- **Firefox:** Fully supported
- **Safari:** Fully supported
- **Edge:** Fully supported
- **Mobile Safari:** Fully supported (iOS 12+)
- **Chrome Mobile:** Fully supported

---

### Testing

#### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-600');
  });

  it('prevents click when disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    fireEvent.click(screen.getByText('Disabled'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

---

### Common Pitfalls

1. **Forgetting to handle loading state:** Always disable user actions while async operations are in progress
   ```tsx
   // Bad
   <Button onClick={saveData}>Save</Button>

   // Good
   <Button loading={isSaving} onClick={saveData}>Save</Button>
   ```

2. **Not providing accessible labels for icon-only buttons:** Always include aria-label
   ```tsx
   // Bad
   <Button><Plus /></Button>

   // Good
   <Button aria-label="Add transaction"><Plus /></Button>
   ```

3. **Nesting buttons inside buttons:** Never nest interactive elements
   ```tsx
   // Bad
   <Button><button>Click</button></Button>

   // Good
   <Button onClick={handleClick}>Click</Button>
   ```

---

### Related Components

- `Input`: Often used together in forms
- `Alert`: Can be used to show feedback after button actions
- `Card`: Buttons are frequently placed in card footers

---

### Styling & Customization

#### Class Name Overrides

```tsx
<Button className="rounded-full shadow-lg hover:shadow-xl">
  Custom Styled
</Button>
```

Common customizations:
- `w-full`: Full width button
- `rounded-full`: Fully rounded corners
- `shadow-lg`: Add shadow
- `text-lg`: Larger text

#### Tailwind Classes Used

Base styles use the following Tailwind utilities:
- `inline-flex`, `items-center`, `justify-center`
- `font-medium`, `rounded-lg`
- `transition-colors`
- `focus:outline-none`, `focus:ring-2`, `focus:ring-offset-2`

---

### Quick Reference

```tsx
// Basic button
<Button>Click Me</Button>

// Primary action
<Button variant="primary" size="lg" onClick={handleClick}>
  Save Transaction
</Button>

// Loading state
<Button loading={isLoading} disabled={isDisabled}>
  Processing
</Button>

// Icon button
<Button aria-label="Add">
  <Plus className="w-4 h-4" />
</Button>

// Form submit
<Button type="submit">Submit</Button>
```

---

# Input Component

### Overview

**Brief Description:** A flexible form input component that supports labels, error messages, and all standard HTML input attributes. Use this for all text input fields in forms.

**Component Type:** Form Control

**File Location:** `src/components/ui/Input.tsx`

**Dependencies:** None (pure React component)

---

### Props / Parameters

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `label` | `string` | No | `undefined` | Label text displayed above the input |
| `error` | `string` | No | `undefined` | Error message displayed below the input |
| `className` | `string` | No | `''` | Additional CSS classes for the input element |

**Extended Props:**
Extends `React.InputHTMLAttributes<HTMLInputElement>`, so all standard input props are available: `type`, `placeholder`, `value`, `onChange`, `required`, `disabled`, etc.

---

### Usage Examples

#### Basic Usage

```tsx
import { Input } from '@/components/ui/Input';

function Example() {
  return (
    <Input
      label="Email Address"
      type="email"
      placeholder="Enter your email"
    />
  );
}
```

#### With State Management

```tsx
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

function FormExample() {
  const [email, setEmail] = useState('');

  return (
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="you@example.com"
    />
  );
}
```

#### With Error State

```tsx
import { Input } from '@/components/ui/Input';
import { useState } from 'react';

function ValidatedInput() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    if (!value.includes('@')) {
      setError('Please enter a valid email address');
    } else {
      setError('');
    }
  };

  return (
    <Input
      label="Email Address"
      type="email"
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        validateEmail(e.target.value);
      }}
      error={error}
    />
  );
}
```

#### Different Input Types

```tsx
import { Input } from '@/components/ui/Input';

function InputTypes() {
  return (
    <div className="space-y-4">
      <Input label="Text" type="text" />
      <Input label="Email" type="email" />
      <Input label="Password" type="password" />
      <Input label="Number" type="number" />
      <Input label="Date" type="date" />
      <Input label="URL" type="url" />
      <Input label="Phone" type="tel" />
    </div>
  );
}
```

#### Required Fields

```tsx
import { Input } from '@/components/ui/Input';

function RequiredFields() {
  return (
    <form>
      <Input
        label="Property Address *"
        type="text"
        required
        placeholder="123 Main St"
      />
    </form>
  );
}
```

---

### Accessibility

#### ARIA Attributes

- The label is automatically associated with the input via implicit relationship
- Error messages should use `aria-describedby` for screen reader support (future enhancement)
- Required fields should use `required` attribute

```tsx
<Input
  label="Email"
  type="email"
  required
  aria-describedby="email-help"
/>
```

#### Keyboard Navigation

- **Tab:** Moves focus to the input
- **Shift+Tab:** Moves focus away
- **Standard text editing shortcuts work:** Ctrl+A, Ctrl+C, Ctrl+V, etc.

#### Screen Reader Support

- Label is announced when focusing the input
- Error messages are announced (via red text and visual indicator)
- Placeholder text is announced as a hint
- Required status is announced

#### Focus Management

- Clear blue focus ring using `focus:ring-blue-500` and `focus:border-blue-500`
- Error state has red focus ring using `focus:ring-red-500` and `focus:border-red-500`
- Focus ring is visible and meets contrast requirements

#### Color Contrast

- **Label:** Gray-700 (#374151) on white passes WCAG AA
- **Input Text:** Black on white passes WCAG AAA
- **Placeholder:** Gray-400 (#9ca3af) passes WCAG AA for non-essential text
- **Error Text:** Red-600 (#dc2626) on white passes WCAG AA

---

### Edge Cases & Considerations

#### Error State

When error prop is provided:
- Border changes to red
- Focus ring changes to red
- Error message appears below input in red text

```tsx
<Input
  label="Email"
  value="invalid"
  error="Please enter a valid email address"
/>
```

#### Disabled State

```tsx
<Input
  label="Readonly Field"
  value="Cannot edit"
  disabled
/>
```

**Behavior:**
- Input is grayed out
- Cursor changes to not-allowed
- Value cannot be changed
- Tab still focuses the input

#### Long Error Messages

Error messages wrap to multiple lines:

```tsx
<Input
  error="This is a very long error message that explains in detail what went wrong with the validation and how to fix it."
/>
```

#### No Label

Input can be used without a label:

```tsx
<Input
  placeholder="Search..."
  aria-label="Search transactions"
/>
```

**Note:** Always provide `aria-label` if label is omitted.

---

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Full width by default, text size remains readable |
| Tablet (640-1024px) | Standard sizing works well |
| Desktop (>1024px) | Consider max-width for very wide forms |

**Responsive Form Pattern:**

```tsx
<div className="max-w-md">
  <Input label="Property Address" />
</div>
```

---

### Testing

#### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies error styling', () => {
    render(<Input error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
  });
});
```

---

### Common Pitfalls

1. **Uncontrolled inputs without proper state management:** Always use controlled components with React state
   ```tsx
   // Bad
   <Input />

   // Good
   <Input value={value} onChange={(e) => setValue(e.target.value)} />
   ```

2. **Missing labels for accessibility:** Always provide either a visible label or aria-label
   ```tsx
   // Bad
   <Input />

   // Good
   <Input label="Email" />
   // or
   <Input aria-label="Email" />
   ```

---

### Related Components

- `Button`: Used together in forms for submission
- `FormTextarea`: Similar component for multi-line text
- `FormSelect`: Similar component for select dropdowns

---

### Quick Reference

```tsx
// Basic input
<Input label="Email" type="email" />

// With error
<Input
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
/>

// Required field
<Input label="Name *" required />

// Disabled
<Input label="Locked" value="Cannot edit" disabled />
```

---

# Card Component

### Overview

**Brief Description:** A flexible container component that provides a consistent card layout with shadow and rounded corners. Use for grouping related content and creating visual hierarchy.

**Component Type:** Layout Container

**File Location:** `src/components/ui/Card.tsx`

**Dependencies:** None (pure React component)

---

### Props / Parameters

#### Card

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Content to render inside the card |
| `className` | `string` | No | `''` | Additional CSS classes |

#### CardHeader

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Header content (typically title) |
| `className` | `string` | No | `''` | Additional CSS classes |

#### CardContent

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Main content of the card |
| `className` | `string` | No | `''` | Additional CSS classes |

---

### Usage Examples

#### Basic Card

```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

function Example() {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Transaction Details</h2>
      </CardHeader>
      <CardContent>
        <p>Content goes here</p>
      </CardContent>
    </Card>
  );
}
```

#### Card with Actions

```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function ActionCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Property Info</h2>
          <Button size="sm" variant="outline">Edit</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>Address: 123 Main St</p>
          <p>Price: $450,000</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Simple Card (No Header)

```tsx
import { Card, CardContent } from '@/components/ui/Card';

function SimpleCard() {
  return (
    <Card>
      <CardContent>
        <p>Simple card with just content</p>
      </CardContent>
    </Card>
  );
}
```

#### Grid of Cards

```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

function CardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>Card 1</CardHeader>
        <CardContent>Content</CardContent>
      </Card>
      <Card>
        <CardHeader>Card 2</CardHeader>
        <CardContent>Content</CardContent>
      </Card>
      <Card>
        <CardHeader>Card 3</CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    </div>
  );
}
```

---

### Accessibility

#### ARIA Attributes

Cards are semantic containers and don't require specific ARIA attributes unless used as interactive elements:

```tsx
// Interactive card
<Card
  className="cursor-pointer hover:shadow-lg transition-shadow"
  onClick={handleClick}
  role="button"
  tabIndex={0}
>
  <CardContent>Clickable content</CardContent>
</Card>
```

#### Keyboard Navigation

- Not focusable by default unless made interactive
- If interactive, add `tabIndex={0}` and handle Enter/Space key presses

#### Screen Reader Support

- Card structure provides semantic grouping
- Use proper heading levels in CardHeader for navigation
- Content is read in DOM order

---

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Full width, reduced padding acceptable |
| Tablet (640-1024px) | Works well in 2-column grids |
| Desktop (>1024px) | Works well in 3+ column grids |

---

### Common Pitfalls

1. **Inconsistent heading levels:** Use proper heading hierarchy in CardHeader
2. **Too much nesting:** Keep card content structure simple
3. **Missing spacing:** Remember to add spacing between cards in grids

---

### Quick Reference

```tsx
// Standard card
<Card>
  <CardHeader>
    <h2>Title</h2>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Simple card
<Card>
  <CardContent>Just content</CardContent>
</Card>

// Custom styling
<Card className="hover:shadow-lg transition-shadow">
  <CardContent>Hover effect</CardContent>
</Card>
```

---

# Alert Component

### Overview

**Brief Description:** A notification component that displays important messages to users with different severity levels. Use for success messages, errors, warnings, and informational content.

**Component Type:** UI Element / Notification

**File Location:** `src/components/ui/Alert.tsx`

**Dependencies:** `lucide-react` (for icons)

---

### Props / Parameters

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `'success' \| 'error' \| 'info' \| 'warning'` | No | `'info'` | Alert severity type |
| `title` | `string` | No | `undefined` | Optional alert title |
| `children` | `React.ReactNode` | Yes | - | Alert message content |
| `onClose` | `() => void` | No | `undefined` | Close handler (shows X button if provided) |

---

### Variants / Options

#### Success Alert

**When to Use:** Confirm successful actions (save, create, update)

**Visual Appearance:** Green background with checkmark icon

```tsx
<Alert type="success" title="Success!">
  Transaction saved successfully
</Alert>
```

#### Error Alert

**When to Use:** Display error messages and failures

**Visual Appearance:** Red background with alert circle icon

```tsx
<Alert type="error" title="Error">
  Failed to save transaction. Please try again.
</Alert>
```

#### Warning Alert

**When to Use:** Important information requiring attention

**Visual Appearance:** Yellow background with alert circle icon

```tsx
<Alert type="warning" title="Warning">
  This action cannot be undone
</Alert>
```

#### Info Alert

**When to Use:** General information and tips

**Visual Appearance:** Blue background with info icon

```tsx
<Alert type="info" title="Tip">
  You can edit transaction details anytime
</Alert>
```

---

### Usage Examples

#### Basic Alert

```tsx
import { Alert } from '@/components/ui/Alert';

function Example() {
  return (
    <Alert type="success">
      Your changes have been saved
    </Alert>
  );
}
```

#### Alert with Title

```tsx
import { Alert } from '@/components/ui/Alert';

function TitledAlert() {
  return (
    <Alert type="error" title="Validation Error">
      Please fill in all required fields before submitting
    </Alert>
  );
}
```

#### Dismissible Alert

```tsx
import { Alert } from '@/components/ui/Alert';
import { useState } from 'react';

function DismissibleAlert() {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <Alert
      type="info"
      title="New Feature"
      onClose={() => setShow(false)}
    >
      Check out our new transaction timeline feature!
    </Alert>
  );
}
```

#### Alert with Complex Content

```tsx
import { Alert } from '@/components/ui/Alert';

function ComplexAlert() {
  return (
    <Alert type="warning" title="Incomplete Information">
      <ul className="list-disc list-inside space-y-1">
        <li>Missing buyer contact information</li>
        <li>Property address not verified</li>
        <li>Closing date not set</li>
      </ul>
    </Alert>
  );
}
```

---

### Accessibility

#### ARIA Attributes

Alerts should use proper ARIA roles:

```tsx
<Alert role="alert" aria-live="polite">
  Message here
</Alert>
```

For urgent alerts:
```tsx
<Alert type="error" role="alert" aria-live="assertive">
  Critical error message
</Alert>
```

#### Keyboard Navigation

- **Tab:** Focus on close button (if present)
- **Enter/Space:** Dismiss alert (when close button is focused)
- **Escape:** Consider adding dismiss on Escape key

#### Screen Reader Support

- Alert content is announced automatically with `role="alert"`
- Icon is decorative and hidden from screen readers
- Title and content are both announced

#### Color Contrast

- **Success:** Green-800 text on green-50 background passes WCAG AA
- **Error:** Red-800 text on red-50 background passes WCAG AA
- **Warning:** Yellow-800 text on yellow-50 background passes WCAG AA
- **Info:** Blue-800 text on blue-50 background passes WCAG AA

---

### Common Pitfalls

1. **Too many alerts on one page:** Limit to 1-2 visible alerts to avoid overwhelming users
2. **Missing context:** Always provide clear, actionable messages
3. **Wrong alert type:** Use the appropriate type for the message severity

---

### Quick Reference

```tsx
// Success message
<Alert type="success" title="Saved!">
  Transaction saved successfully
</Alert>

// Error message
<Alert type="error" title="Error">
  Something went wrong
</Alert>

// Dismissible
<Alert type="info" onClose={() => setShow(false)}>
  This is a tip
</Alert>

// Warning
<Alert type="warning" title="Caution">
  This cannot be undone
</Alert>
```

---

# ProgressBar Component

### Overview

**Brief Description:** Visual indicator components that display completion percentage. Includes both full-featured ProgressBar and compact SectionProgress variants with dynamic color coding based on completion level.

**Component Type:** UI Element / Data Visualization

**File Location:** `src/components/ui/ProgressBar.tsx`

**Dependencies:** None (pure React component)

---

### Props / Parameters

#### ProgressBar

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `percentage` | `number` | Yes | - | Completion percentage (0-100, clamped automatically) |
| `showLabel` | `boolean` | No | `true` | Whether to show "Completion" label and percentage text |
| `size` | `'sm' \| 'md' \| 'lg'` | No | `'md'` | Size of the progress bar |
| `className` | `string` | No | `''` | Additional CSS classes for container |

#### SectionProgress

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `percentage` | `number` | Yes | - | Completion percentage (0-100, clamped automatically) |
| `className` | `string` | No | `''` | Additional CSS classes |

---

### Color Coding

Both components use the same color logic:

| Percentage Range | Color | Meaning |
|-----------------|-------|---------|
| 0-29% | Red | Just started / critical |
| 30-59% | Yellow | In progress / needs attention |
| 60-89% | Blue | Good progress |
| 90-100% | Green | Nearly complete / complete |

---

### Usage Examples

#### Basic ProgressBar

```tsx
import { ProgressBar } from '@/components/ui/ProgressBar';

function Example() {
  return <ProgressBar percentage={75} />;
}
```

#### ProgressBar with Dynamic Value

```tsx
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useState, useEffect } from 'react';

function DynamicProgress() {
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(10);

  const percentage = (completed / total) * 100;

  return (
    <div>
      <ProgressBar percentage={percentage} />
      <button onClick={() => setCompleted(completed + 1)}>
        Complete Task
      </button>
    </div>
  );
}
```

#### Different Sizes

```tsx
import { ProgressBar } from '@/components/ui/ProgressBar';

function Sizes() {
  return (
    <div className="space-y-4">
      <ProgressBar percentage={50} size="sm" />
      <ProgressBar percentage={75} size="md" />
      <ProgressBar percentage={90} size="lg" />
    </div>
  );
}
```

#### Without Label

```tsx
import { ProgressBar } from '@/components/ui/ProgressBar';

function CompactProgress() {
  return <ProgressBar percentage={65} showLabel={false} />;
}
```

#### SectionProgress (Compact Variant)

```tsx
import { SectionProgress } from '@/components/ui/ProgressBar';

function TransactionSections() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span>Property Details</span>
        <SectionProgress percentage={100} />
      </div>
      <div className="flex items-center justify-between">
        <span>Financial Info</span>
        <SectionProgress percentage={60} />
      </div>
      <div className="flex items-center justify-between">
        <span>Documents</span>
        <SectionProgress percentage={25} />
      </div>
    </div>
  );
}
```

---

### Accessibility

#### ARIA Attributes

Add proper ARIA attributes for screen readers:

```tsx
<ProgressBar
  percentage={75}
  aria-label="Transaction completion"
  aria-valuenow={75}
  aria-valuemin={0}
  aria-valuemax={100}
/>
```

#### Screen Reader Support

- Progress bars should announce current percentage
- Color alone is not used to convey information (percentage is also displayed as text)
- Smooth transitions provide visual feedback

---

### Edge Cases & Considerations

#### Values Outside Range

The component automatically clamps values to 0-100:

```tsx
<ProgressBar percentage={-10} />  // Displays as 0%
<ProgressBar percentage={150} />  // Displays as 100%
```

#### Smooth Transitions

Progress changes are animated with `transition-all duration-500`:

```tsx
// Smoothly animates from 25% to 75%
const [progress, setProgress] = useState(25);

useEffect(() => {
  setTimeout(() => setProgress(75), 1000);
}, []);

return <ProgressBar percentage={progress} />;
```

---

### Performance Considerations

- **Animation Performance:** Uses CSS transitions (GPU-accelerated)
- **Re-render Optimization:** Lightweight component, no memoization needed
- **Bundle Size:** ~1KB minified

---

### Testing

```tsx
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct percentage', () => {
    render(<ProgressBar percentage={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('clamps percentage to 0-100', () => {
    const { rerender } = render(<ProgressBar percentage={150} />);
    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(<ProgressBar percentage={-10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<ProgressBar percentage={50} showLabel={false} />);
    expect(screen.queryByText('Completion')).not.toBeInTheDocument();
  });
});
```

---

### Common Pitfalls

1. **Not clamping percentage values:** Component handles this automatically, but be aware of the behavior
2. **Using wrong variant:** Use ProgressBar for prominent progress, SectionProgress for compact inline display

---

### Quick Reference

```tsx
// Standard progress bar
<ProgressBar percentage={75} />

// Compact version
<ProgressBar percentage={75} showLabel={false} size="sm" />

// Section progress (inline)
<SectionProgress percentage={60} />

// With dynamic value
<ProgressBar percentage={(completed / total) * 100} />
```

---

## Component Library Best Practices

### General Guidelines

1. **Consistency:** Use these documented components consistently throughout the application
2. **Customization:** Extend components via className prop rather than modifying source
3. **Accessibility:** Always consider keyboard navigation and screen reader support
4. **Testing:** Write tests for custom implementations that combine these components
5. **Performance:** These components are lightweight and don't require memoization in most cases

### When to Create New Components

Create a new reusable component when:
- Pattern is used 3+ times across the application
- Component has clear, single responsibility
- Component can be reasonably abstracted
- Component would benefit from consistent behavior

### Documentation Updates

When modifying components:
1. Update this documentation
2. Add version entry to changelog
3. Update usage examples if API changes
4. Test across all existing usages
5. Consider backward compatibility

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-14 | Initial component library documentation |

---

## Support

**Questions or Issues:** Contact the development team
**Contributing:** Follow the component documentation template for new components
**Feedback:** Help improve this documentation by reporting unclear sections

---

**Last Updated:** 2025-11-14
**Maintained By:** MagnetAgent Development Team
