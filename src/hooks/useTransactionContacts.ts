import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Contact, TransactionContact } from '../types/database';

interface TransactionContactWithDetails extends TransactionContact {
  contact: Contact;
}

export function useTransactionContacts(transactionId: string | undefined) {
  const [transactionContacts, setTransactionContacts] = useState<TransactionContactWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setLoading(false);
      return;
    }

    fetchTransactionContacts();

    const channel = supabase
      .channel('transaction-contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transaction_contacts',
          filter: `transaction_id=eq.${transactionId}`,
        },
        () => {
          fetchTransactionContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId]);

  async function fetchTransactionContacts() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('transaction_contacts')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('transaction_id', transactionId);

      if (fetchError) throw fetchError;
      setTransactionContacts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addContactToTransaction(contactId: string, contactType: string) {
    const { data: created, error: createError } = await supabase
      .from('transaction_contacts')
      .insert([
        {
          transaction_id: transactionId,
          contact_id: contactId,
          contact_type: contactType,
        },
      ])
      .select()
      .single();

    if (createError) throw createError;
    return created;
  }

  async function removeContactFromTransaction(id: string) {
    const { error: deleteError } = await supabase.from('transaction_contacts').delete().eq('id', id);

    if (deleteError) throw deleteError;
  }

  async function updateTransactionContact(id: string, contactType: string) {
    const { data: updated, error: updateError } = await supabase
      .from('transaction_contacts')
      .update({ contact_type: contactType })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  return {
    transactionContacts,
    loading,
    error,
    addContactToTransaction,
    removeContactFromTransaction,
    updateTransactionContact,
    refetch: fetchTransactionContacts,
  };
}
