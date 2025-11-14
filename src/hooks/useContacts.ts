import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Contact } from '../types/database';

export function useContacts(agentId: string | undefined) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    fetchContacts();

    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          fetchContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  async function fetchContacts() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setContacts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createContact(data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
    const { data: created, error: createError } = await supabase
      .from('contacts')
      .insert([data])
      .select()
      .single();

    if (createError) throw createError;
    return created;
  }

  async function updateContact(id: string, updates: Partial<Contact>) {
    const { data: updated, error: updateError } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  }

  async function deleteContact(id: string) {
    const { error: deleteError } = await supabase.from('contacts').delete().eq('id', id);

    if (deleteError) throw deleteError;
  }

  async function toggleFavorite(id: string, currentValue: boolean) {
    return updateContact(id, { favorite: !currentValue });
  }

  return {
    contacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
    toggleFavorite,
    refetch: fetchContacts,
  };
}
