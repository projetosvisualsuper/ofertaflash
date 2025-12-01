import { useState, useEffect, useCallback } from 'react';
import { PosterTheme } from '../../types';
import { supabase } from '@/src/integrations/supabase/client';
import { INITIAL_THEME } from '../state/initialState';
import { showError } from '../utils/toast';

interface UserSettingsDB {
  id: string;
  user_id: string;
  theme: PosterTheme;
  updated_at: string;
}

export function useUserSettings(userId: string | undefined) {
  const [theme, setThemeState] = useState<PosterTheme>(INITIAL_THEME);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial settings
  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('theme')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found (expected for new users)
      console.error('Error fetching user settings:', error);
      showError('Falha ao carregar configurações do usuário.');
    }

    if (data) {
      // Merge fetched theme with initial theme to ensure all fields exist (for migrations)
      setThemeState(prev => ({ ...INITIAL_THEME, ...data.theme }));
    } else {
      // If no settings found, save the initial theme immediately
      await saveSettings(INITIAL_THEME);
    }
    setLoading(false);
  }, [userId]);

  // 2. Save settings function
  const saveSettings = useCallback(async (newTheme: PosterTheme) => {
    if (!userId) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, theme: newTheme }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving user settings:', error);
      showError('Falha ao salvar configurações.');
    }
  }, [userId]);

  // 3. Effect to fetch on mount/userId change
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 4. Function to update state and trigger save
  const setTheme = useCallback((newTheme: PosterTheme | ((prev: PosterTheme) => PosterTheme)) => {
    setThemeState(prev => {
      const updatedTheme = typeof newTheme === 'function' ? newTheme(prev) : newTheme;
      saveSettings(updatedTheme);
      return updatedTheme;
    });
  }, [saveSettings]);

  return { theme, setTheme, loading };
}