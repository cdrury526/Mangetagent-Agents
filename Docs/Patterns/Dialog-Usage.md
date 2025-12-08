# Dialog Component Usage Pattern

This document describes the standard pattern for creating modal dialogs in Bolt-Magnet-Agent-2025 using shadcn/ui Dialog components.

## Overview

All modals in this project use the shadcn/ui Dialog component built on [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog). This provides:

- **Accessibility**: Focus trapping, ARIA labels, keyboard navigation (Escape to close)
- **Consistency**: Unified styling, animations, and behavior across all modals
- **Maintainability**: No duplicate backdrop/centering code

## Component Imports

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
```

## Basic Pattern

```tsx
interface MyModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ... other props
}

export function MyModal({ isOpen, onClose, ...props }: MyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Description text for accessibility (screen readers announce this)
        </DialogDescription>

        {/* Modal body content */}
        <div>
          {/* Your content here */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Width Variants

Control modal width via `DialogContent` className:

| Size | Class | Use Case |
|------|-------|----------|
| Small | `max-w-md` | Confirmations, simple forms |
| Medium | `max-w-lg` | Standard forms (default) |
| Large | `max-w-2xl` | Complex forms with multiple fields |
| Extra Large | `max-w-4xl` | Data tables, file uploads |

## Examples in Codebase

### Confirmation Modal (Simple)
`src/components/ui/ConfirmModal.tsx`

```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    <DialogDescription>{message}</DialogDescription>
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Modal (Medium Complexity)
`src/components/transaction-detail/AddContactModal.tsx`

- Uses `max-w-md` for compact form
- Form content between header and footer
- Submit button in DialogFooter

### Complex Modal with Scrolling
`src/components/boldsign/SendDocumentModal.tsx`

- Uses `max-w-3xl` for wider content
- Scrollable content area: `max-h-[60vh] overflow-y-auto`
- Multiple sections within DialogContent

## Key Patterns

### 1. Controlled Open State

Always use controlled mode with `open` and `onOpenChange`:

```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
```

This ensures:
- Parent component controls visibility
- Modal closes on Escape key
- Modal closes on backdrop click

### 2. DialogDescription for Accessibility

Always include `DialogDescription` even if visually hidden:

```tsx
// Visible description
<DialogDescription>Are you sure you want to delete this item?</DialogDescription>

// Hidden but accessible (for complex modals)
<DialogDescription className="sr-only">
  Form to add a new contact to the transaction
</DialogDescription>
```

### 3. Form Handling

For modals with forms, prevent default form submission from closing the modal:

```tsx
<form onSubmit={(e) => {
  e.preventDefault();
  handleSubmit();
}}>
  {/* form fields */}
</form>
```

### 4. Loading States

Disable interactions during async operations:

```tsx
<DialogFooter>
  <Button variant="outline" onClick={onClose} disabled={isLoading}>
    Cancel
  </Button>
  <Button onClick={handleSubmit} loading={isLoading}>
    Submit
  </Button>
</DialogFooter>
```

## Built-in Accessibility Features

The Dialog component automatically provides:

- **Focus trap**: Tab cycles through modal elements only
- **Focus restoration**: Focus returns to trigger element on close
- **Escape key**: Closes modal
- **Click outside**: Closes modal (configurable)
- **ARIA attributes**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`

## Migration from Custom Modals

When migrating a custom modal to Dialog:

1. Replace custom backdrop with `Dialog` + `DialogContent`
2. Replace custom header with `DialogHeader` + `DialogTitle`
3. Add `DialogDescription` for accessibility
4. Replace custom footer with `DialogFooter`
5. Keep existing Button components
6. Preserve existing prop interface for backwards compatibility

## Related Files

- `src/components/ui/dialog.tsx` - Dialog component source
- `src/lib/utils.ts` - `cn()` utility for className merging
- `components.json` - shadcn/ui configuration
