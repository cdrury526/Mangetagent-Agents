import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BoldSignDocument } from '../types/database';

export function useBoldSignDocuments(transactionId?: string) {
  const [documents, setDocuments] = useState<BoldSignDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();

    const channel = supabase
      .channel('boldsign-document-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bold_sign_documents',
          filter: transactionId ? `transaction_id=eq.${transactionId}` : undefined,
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

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('bold_sign_documents')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionId) {
        query = query.eq('transaction_id', transactionId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (document: Partial<BoldSignDocument>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('bold_sign_documents')
        .insert({
          ...document,
          agent_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchDocuments();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateDocument = async (id: string, updates: Partial<BoldSignDocument>) => {
    try {
      const { error: updateError } = await supabase
        .from('bold_sign_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
    createDocument,
    updateDocument,
  };
}
