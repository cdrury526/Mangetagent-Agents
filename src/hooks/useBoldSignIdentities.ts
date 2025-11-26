import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../utils/errorHandler';

export interface BoldSignIdentity {
  id: string;
  agent_id: string;
  bold_sign_identity_id: string;
  name: string;
  email: string;
  company_name: string | null;
  title: string | null;
  logo_url: string | null;
  is_default: boolean;
  approval_status: string;
  approval_token: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useBoldSignIdentities() {
  const [identities, setIdentities] = useState<BoldSignIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIdentities();
  }, []);

  const fetchIdentities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('bold_sign_identities')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false});

      if (fetchError) throw fetchError;

      setIdentities(data || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createIdentity = async (identity: Partial<BoldSignIdentity>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('bold_sign_identities')
        .insert({
          ...identity,
          agent_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchIdentities();
      return data;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const updateIdentity = async (id: string, updates: Partial<BoldSignIdentity>) => {
    try {
      const { error: updateError } = await supabase
        .from('bold_sign_identities')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchIdentities();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const deleteIdentity = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('bold_sign_identities')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchIdentities();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const setDefaultIdentity = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('bold_sign_identities')
        .update({ is_default: false })
        .eq('agent_id', user.id);

      await supabase
        .from('bold_sign_identities')
        .update({ is_default: true })
        .eq('id', id);

      await fetchIdentities();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  return {
    identities,
    loading,
    error,
    refresh: fetchIdentities,
    createIdentity,
    updateIdentity,
    deleteIdentity,
    setDefaultIdentity,
  };
}
