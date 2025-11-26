import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types/database';
import { getErrorMessage } from '../utils/errorHandler';

export function useTransactions(agentId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    fetchTransactions();

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]); // fetchTransactions is intentionally excluded - it's stable and including it would cause infinite loops

  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTransactions(data || []);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function createTransaction(
    data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>,
    userPlan: string
  ) {
    if (userPlan === 'free' && transactions.length >= 5) {
      throw new Error(
        'Free plan allows up to 5 lifetime transactions. Upgrade to Pro for unlimited transactions.'
      );
    }

    const { data: created, error: createError } = await supabase
      .from('transactions')
      .insert([data])
      .select()
      .single();

    if (createError) throw createError;

    setTransactions(prev => [created, ...prev]);

    return created;
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    const { data: updated, error: updateError } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    setTransactions(prev =>
      prev.map(tx => tx.id === id ? updated : tx)
    );

    return updated;
  }

  async function deleteTransaction(id: string) {
    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id);

    if (deleteError) throw deleteError;

    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
