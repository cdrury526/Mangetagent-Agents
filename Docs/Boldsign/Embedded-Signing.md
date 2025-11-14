# BoldSign Embedded Signing Guide

Guide for embedding BoldSign signing interface directly in MagnetAgent.

## Overview

Embedded signing allows users to sign documents without leaving your application. BoldSign provides two approaches:

1. **Embedded Signing Link** - Generate a signing URL and embed in iframe
2. **Embedded Signing Widget** - Use BoldSign SDK for more control

---

## Approach 1: Embedded Signing Link

### Generate Signing Link

**API Endpoint:** `POST /api/v1/document/{documentId}/signingLink`

**Request:**
```json
{
  "signerEmail": "signer@example.com",
  "redirectUrl": "https://magnetagent.com/signing-complete",
  "expiresIn": 3600
}
```

**Response:**
```json
{
  "signingLink": "https://app.boldsign.com/sign?token=xyz123&embedded=true",
  "expiresAt": "2025-11-01T13:00:00Z"
}
```

### Embed in iFrame

**React Component:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { generateSigningLink } from '@/app/actions/boldsign';

interface EmbeddedSigningProps {
  documentId: string;
  signerEmail: string;
  onComplete?: (documentId: string) => void;
  onError?: (error: Error) => void;
}

export function EmbeddedSigning({
  documentId,
  signerEmail,
  onComplete,
  onError
}: EmbeddedSigningProps) {
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSigningLink() {
      try {
        const result = await generateSigningLink(documentId, signerEmail);
        if (result.error) {
          throw new Error(result.error);
        }
        setSigningLink(result.data?.signingLink || null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load signing link');
        setError(error.message);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    }

    loadSigningLink();
  }, [documentId, signerEmail, onError]);

  // Listen for postMessage from iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Verify origin
      if (event.origin !== 'https://app.boldsign.com') {
        return;
      }

      if (event.data.type === 'BoldSign.SigningComplete') {
        onComplete?.(documentId);
      } else if (event.data.type === 'BoldSign.SigningError') {
        const error = new Error(event.data.message);
        setError(error.message);
        onError?.(error);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [documentId, onComplete, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (!signingLink) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p>No signing link available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[800px] border rounded-lg overflow-hidden">
      <iframe
        src={signingLink}
        className="w-full h-full"
        frameBorder="0"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        title="Document Signing"
      />
    </div>
  );
}
```

### Server Action

```typescript
'use server';

export async function generateSigningLink(
  documentId: string,
  signerEmail: string
): Promise<{ data?: { signingLink: string }; error?: string }> {
  try {
    // Call Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/boldsign-api`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'generateSigningLink',
          documentId,
          signerEmail,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/signing-complete`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate signing link');
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
```

---

## Approach 2: BoldSign SDK (Advanced)

### Install SDK

```bash
npm install @boldsign/sdk
```

### Initialize SDK

```typescript
import BoldSign from '@boldsign/sdk';

BoldSign.init({
  apiKey: process.env.NEXT_PUBLIC_BOLDSIGN_API_KEY,
  environment: 'production', // or 'sandbox'
});
```

### Embedded Signing Component

```typescript
'use client';

import { useEffect, useRef } from 'react';
import BoldSign from '@boldsign/sdk';

interface EmbeddedSigningSDKProps {
  documentId: string;
  signerEmail: string;
  onComplete?: (documentId: string) => void;
}

export function EmbeddedSigningSDK({
  documentId,
  signerEmail,
  onComplete
}: EmbeddedSigningSDKProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize embedded signing
    BoldSign.embedSigning({
      container: containerRef.current,
      documentId,
      signerEmail,
      onComplete: (result) => {
        console.log('Signing completed:', result);
        onComplete?.(documentId);
      },
      onError: (error) => {
        console.error('Signing error:', error);
      },
      options: {
        theme: 'light', // or 'dark'
        showToolbar: true,
        showNavigation: true,
      }
    });

    // Cleanup
    return () => {
      BoldSign.destroy(containerRef.current!);
    };
  }, [documentId, signerEmail, onComplete]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[800px] border rounded-lg"
    />
  );
}
```

---

## Security Considerations

### Content Security Policy (CSP)

Add BoldSign domains to your CSP headers:

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      frame-src 'self' https://app.boldsign.com;
      script-src 'self' https://cdn.boldsign.com;
      style-src 'self' 'unsafe-inline' https://app.boldsign.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

### iFrame Sandbox Attributes

Use appropriate sandbox attributes:
```html
<iframe
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
  ...
/>
```

### Token Expiration

- Signing links expire after set time (default: 1 hour)
- Regenerate if expired
- Don't store signing links long-term

---

## PostMessage Communication

BoldSign iframe can communicate via postMessage:

### Listening for Events

```typescript
useEffect(() => {
  function handleMessage(event: MessageEvent) {
    // Verify origin
    if (event.origin !== 'https://app.boldsign.com') {
      return;
    }

    switch (event.data.type) {
      case 'BoldSign.SigningStarted':
        console.log('Signing started');
        break;
      case 'BoldSign.SigningComplete':
        console.log('Signing completed:', event.data.documentId);
        onComplete?.(event.data.documentId);
        break;
      case 'BoldSign.SigningError':
        console.error('Signing error:', event.data.error);
        break;
      case 'BoldSign.ViewerReady':
        console.log('Viewer ready');
        break;
    }
  }

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [onComplete]);
```

### Sending Commands to iFrame

```typescript
const iframeRef = useRef<HTMLIFrameElement>(null);

function scrollToPage(page: number) {
  iframeRef.current?.contentWindow?.postMessage({
    type: 'BoldSign.ScrollToPage',
    page
  }, 'https://app.boldsign.com');
}
```

---

## Customization

### Styling

BoldSign iframe can be styled via URL parameters:

```typescript
const signingLink = `${baseLink}&theme=light&hideToolbar=false&hideNavigation=false`;
```

### Custom Branding

Configure branding in BoldSign Dashboard:
- Logo
- Colors
- Email templates

---

## Error Handling

### Common Errors

1. **Token Expired**
   - Regenerate signing link
   - Show user-friendly message

2. **Document Not Found**
   - Verify document ID
   - Check document status

3. **Signer Mismatch**
   - Verify signer email matches
   - Check authentication

4. **CSP Blocking**
   - Update CSP headers
   - Test in different browsers

### Error Component

```typescript
export function SigningError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
      <h3 className="font-semibold text-destructive mb-2">Signing Error</h3>
      <p className="text-sm mb-4">{error.message}</p>
      <Button onClick={onRetry}>Try Again</Button>
    </div>
  );
}
```

---

## Testing

### Test Signing Flow

1. Generate test document
2. Create signing link
3. Embed in iframe
4. Complete signing
5. Verify webhook received
6. Check document status updated

### Test Scenarios

- [ ] Signing link expires
- [ ] Multiple signers
- [ ] Document declined
- [ ] Network errors
- [ ] CSP blocking
- [ ] Mobile devices

---

## Best Practices

1. **Always verify origin** - Check postMessage origin
2. **Handle errors gracefully** - Show user-friendly messages
3. **Monitor completion** - Use webhooks as primary source
4. **Cache signing links** - But respect expiration
5. **Test on mobile** - Ensure responsive design
6. **Monitor performance** - Track load times
7. **Accessibility** - Ensure keyboard navigation works

---

## Example: Complete Component

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { generateSigningLink } from '@/app/actions/boldsign';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmbeddedSigningProps {
  documentId: string;
  signerEmail: string;
  onComplete?: (documentId: string) => void;
}

export function EmbeddedSigning({
  documentId,
  signerEmail,
  onComplete
}: EmbeddedSigningProps) {
  const [signingLink, setSigningLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const loadSigningLink = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateSigningLink(documentId, signerEmail);
      if (result.error) {
        throw new Error(result.error);
      }
      setSigningLink(result.data?.signingLink || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signing interface');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSigningLink();
  }, [documentId, signerEmail]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== 'https://app.boldsign.com') return;

      if (event.data.type === 'BoldSign.SigningComplete') {
        onComplete?.(documentId);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [documentId, onComplete]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading signing interface...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadSigningLink}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!signingLink) {
    return (
      <Alert>
        <AlertDescription>Unable to load signing interface. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <iframe
        ref={iframeRef}
        src={signingLink}
        className="w-full h-[800px]"
        frameBorder="0"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        title="Document Signing"
      />
    </div>
  );
}
```

---

## Resources

- [BoldSign Embedded Signing Docs](https://boldsign.com/help/embedded-signing)
- [BoldSign SDK Documentation](https://boldsign.com/help/sdk)
- [PostMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

