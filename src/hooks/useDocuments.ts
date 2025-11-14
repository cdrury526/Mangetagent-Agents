import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Document } from '../types/database';

export function useDocuments(transactionId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setLoading(false);
      return;
    }

    fetchDocuments();

    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `transaction_id=eq.${transactionId}`,
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId]);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('transaction_id', transactionId)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createDocument(data: Omit<Document, 'id' | 'created_at' | 'updated_at'>) {
    const { data: created, error: createError } = await supabase
      .from('documents')
      .insert([data])
      .select()
      .single();

    if (createError) throw createError;
    return created;
  }

  async function updateDocument(id: string, updates: Partial<Document>) {
    const { data: updated, error: updateError } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  async function deleteDocument(id: string) {
    const { error: deleteError } = await supabase.from('documents').delete().eq('id', id);

    if (deleteError) throw deleteError;
  }

  async function archiveDocument(id: string) {
    return updateDocument(id, { archived: true });
  }

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    archiveDocument,
    refetch: fetchDocuments,
  };
}
