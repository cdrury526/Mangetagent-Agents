# Component Documentation Template

Use this template to document all reusable components in the project. Consistency in documentation helps developers understand how to use components correctly and efficiently.

---

## [Component Name]

### Overview

**Brief Description:** One or two sentences describing what this component does and when to use it.

**Component Type:** [UI Element / Layout / Form / Utility / etc.]

**File Location:** `src/components/[category]/[ComponentName].tsx`

**Dependencies:** List any external dependencies (e.g., lucide-react, custom hooks)

---

### Props / Parameters

| Prop Name | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `propName` | `type` | Yes/No | `defaultValue` | Description of what this prop does |
| `propName2` | `type` | Yes/No | `defaultValue` | Description of what this prop does |

**Extended Props:**
If the component extends native HTML elements (e.g., `React.ButtonHTMLAttributes`), mention which additional props are available.

---

### Variants / Options

If the component has different visual variants or modes, document them here:

#### Variant Name

**When to Use:** Description of the use case

**Visual Appearance:** Brief description of how it looks

**Example:**
```tsx
<Component variant="variantName" />
```

---

### Usage Examples

#### Basic Usage

```tsx
import { Component } from '@/components/ui/Component';

function Example() {
  return (
    <Component prop="value">
      Content here
    </Component>
  );
}
```

#### Advanced Usage

```tsx
import { Component } from '@/components/ui/Component';

function AdvancedExample() {
  const [state, setState] = useState(false);

  return (
    <Component
      prop1="value"
      prop2={state}
      onAction={() => setState(true)}
    >
      Advanced content
    </Component>
  );
}
```

#### With Other Components

```tsx
import { Component, OtherComponent } from '@/components/ui';

function CombinedExample() {
  return (
    <Component>
      <OtherComponent />
    </Component>
  );
}
```

---

### Visual Examples

**Screenshot or Code Sandbox Link:** [Optional - Link to Storybook, CodeSandbox, or screenshot]

---

### Accessibility

#### ARIA Attributes

List any ARIA attributes used or required:
- `aria-label`: Description
- `aria-describedby`: Description
- `role`: Description

#### Keyboard Navigation

Describe keyboard interactions:
- **Enter/Space:** Action description
- **Tab:** Navigation behavior
- **Escape:** Dismissal behavior (if applicable)

#### Screen Reader Support

Describe how screen readers interact with this component:
- What gets announced
- What context is provided
- Any special considerations

#### Focus Management

Describe focus behavior:
- Where focus goes on mount
- How focus is trapped (if applicable)
- Focus restoration after dismissal

#### Color Contrast

- **Text Contrast Ratio:** Meets WCAG AA/AAA
- **Interactive Elements:** Sufficient contrast for hover/focus states

---

### Edge Cases & Considerations

#### Error States

How the component handles errors:
```tsx
<Component error="Error message" />
```

#### Loading States

How the component displays loading:
```tsx
<Component loading={true} />
```

#### Empty States

How the component handles no data:
```tsx
<Component data={[]} />
```

#### Long Content

How the component handles overflow:
- Truncation behavior
- Scroll behavior
- Responsive considerations

#### Disabled State

How the component appears when disabled:
```tsx
<Component disabled />
```

---

### Responsive Behavior

Describe how the component adapts to different screen sizes:

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Description |
| Tablet (640-1024px) | Description |
| Desktop (>1024px) | Description |

---

### Performance Considerations

- **Re-render Optimization:** Memoization, callback optimization
- **Bundle Size Impact:** Size of component and dependencies
- **Animation Performance:** If component uses animations

---

### Browser Compatibility

List any browser-specific considerations:
- **Chrome:** Fully supported
- **Firefox:** Fully supported
- **Safari:** Known issues (if any)
- **Edge:** Fully supported

---

### Testing

#### Unit Tests

Example test cases:
```tsx
describe('Component', () => {
  it('renders with default props', () => {
    // test implementation
  });

  it('handles user interaction', () => {
    // test implementation
  });

  it('displays error state', () => {
    // test implementation
  });
});
```

#### Integration Tests

Scenarios for integration testing:
- Component interaction with other components
- Form submission flows
- State management integration

---

### Common Pitfalls

1. **Pitfall Description:** Explanation and how to avoid it
2. **Pitfall Description:** Explanation and how to avoid it

---

### Related Components

- `[RelatedComponent]`: Brief description of relationship
- `[AnotherComponent]`: Brief description of relationship

---

### Styling & Customization

#### Class Name Overrides

```tsx
<Component className="custom-classes" />
```

#### CSS Variables (if applicable)

```css
--component-primary-color: #value;
--component-spacing: value;
```

#### Tailwind Classes

List of Tailwind utility classes used and customization points.

---

### Migration Guide

If this component replaces an older component or has breaking changes:

#### From v1.x to v2.x

**Breaking Changes:**
- Change description
- Migration steps

**Example:**
```tsx
// Old way (v1.x)
<OldComponent prop="value" />

// New way (v2.x)
<Component newProp="value" />
```

---

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | YYYY-MM-DD | Breaking changes description |
| 1.5.0 | YYYY-MM-DD | New features description |
| 1.0.0 | YYYY-MM-DD | Initial release |

---

### Support & Feedback

**Maintainer:** [Name or Team]
**Last Updated:** YYYY-MM-DD
**Questions:** [Contact method or discussion link]

---

## Quick Reference Card

```tsx
// Minimal example
<Component prop="value">Content</Component>

// Common pattern
<Component
  variant="primary"
  size="md"
  onClick={handleClick}
>
  Content
</Component>

// Full featured
<Component
  variant="primary"
  size="md"
  disabled={false}
  loading={false}
  error={errorMessage}
  className="custom-class"
  onClick={handleClick}
  aria-label="Descriptive label"
>
  Content
</Component>
```
