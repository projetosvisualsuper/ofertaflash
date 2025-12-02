import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';
import { ThemePreset } from '../config/themePresets';
import { PosterTheme } from '../../types';

// Define a estrutura do DB
interface CustomThemeDB {
  id: string;
  user_id: string;
  name: string;
  theme: Partial<PosterTheme>;
}

const mapFromDB = (item: CustomThemeDB): ThemePreset => ({
  id: item.id,
  name: item.name,
  theme: item.theme,
});

export function useCustomThemes(userId: string | undefined) {
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThemes = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_themes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom themes:', error);
      showError('Falha ao carregar temas personalizados.');
      setCustomThemes([]);
    } else {
      setCustomThemes(data.map(mapFromDB));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const addCustomTheme = async (themePreset: Omit<ThemePreset, 'id'>) => {
    if (!userId) return null;
    
    const themeForDb = {
        user_id: userId,
        name: themePreset.name,
        theme: themePreset.theme,
    };

    const { data, error } = await supabase
      .from('custom_themes')
      .insert(themeForDb)
      .select()
      .single();

    if (error) {
      console.error('Error adding custom theme:', error);
      showError(`Falha ao salvar o tema "${themePreset.name}".`);
      return null;
    }
    
    const newTheme = mapFromDB(data);
    setCustomThemes(prev => [newTheme, ...prev]);
    return newTheme;
  };

  const deleteCustomTheme = async (id: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('custom_themes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting custom theme:', error);
      showError('Falha ao excluir o tema.');
    } else {
      setCustomThemes(prev => prev.filter(t => t.id !== id));
    }
  };

  return {
    customThemes,
    addCustomTheme,
    deleteCustomTheme,
    loading,
  };
}