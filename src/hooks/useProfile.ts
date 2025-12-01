import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { useSession } from '../components/SessionProvider';
import { showSuccess, showError } from '../utils/toast';

// Define a interface para o perfil (baseado no schema profiles)
interface Profile {
  id: string;
  username: string | null;
  role: string;
  permissions: any; // JSONB
  updated_at: string;
}

export function useProfile() {
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found (profile not created yet)
      console.error('Error fetching profile:', error);
      showError('Falha ao carregar perfil do usuário.');
      setProfile(null);
    } else if (data) {
      setProfile(data as Profile);
    } else {
      // If profile doesn't exist (PGRST116), the trigger might be slow, or we need to handle it.
      // For now, we rely on the trigger, but set a minimal profile based on session data.
      setProfile({
        id: session.user.id,
        username: session.user.email,
        role: 'operator', // Default role if profile is missing
        permissions: [],
        updated_at: new Date().toISOString(),
      });
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'updated_at'>>) => {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating profile:', error);
      showError('Falha ao atualizar o perfil.');
    } else {
      setProfile(prev => (prev ? { ...prev, ...updates } : null));
      showSuccess('Perfil atualizado com sucesso!');
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    user: session?.user,
  };
}