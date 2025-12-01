# Code Patterns

## React Hook Pattern (Data Fetching + Real-time)

All data hooks in `src/hooks/` follow this pattern:

```typescript
export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. FETCH - Initial data load
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('agent_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 2. SUBSCRIBE - Real-time updates
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `agent_id=eq.${user.id}`  // CRITICAL: Always filter by agent_id
        },
        (payload) => {
          // Handle INSERT, UPDATE, DELETE
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as Transaction, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev =>
              prev.map(t => t.id === payload.new.id ? payload.new as Transaction : t)
            );
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // 3. CLEANUP - Prevent memory leaks (CRITICAL!)
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { transactions, loading, error };
}
```

## Component Pattern

```typescript
// src/components/feature/FeatureName.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';

interface FeatureNameProps {
  transactionId: string;
  onComplete?: () => void;
}

export function FeatureName({ transactionId, onComplete }: FeatureNameProps) {
  const { transactions, loading, error } = useTransactions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Action logic
      onComplete?.();
    } catch (err) {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Component JSX */}
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Loading...' : 'Submit'}
      </Button>
    </div>
  );
}
```

## Edge Function Pattern

```typescript
// supabase/functions/function-name/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // 3. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Business logic here
    const body = await req.json();
    // ... process request

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## Form Pattern (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  price: z.number().positive('Price must be positive'),
});

type FormData = z.infer<typeof formSchema>;

export function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', price: 0 },
  });

  const onSubmit = async (data: FormData) => {
    // Submit logic
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## TypeScript Type Pattern

```typescript
// src/types/database.ts - Generated from Supabase
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Custom types extend generated types
export interface TransactionWithContacts extends Transaction {
  contacts: Contact[];
}
```
