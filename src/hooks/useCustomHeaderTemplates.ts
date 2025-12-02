import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';
import { HeaderTemplate, PosterTheme } from '../../types';

// Define a estrutura do DB
interface CustomHeaderTemplateDB {
  id: string;
  user_id: string;
  name: string;
  thumbnail: string | null;
  theme: Partial<PosterTheme>;
}

const mapFromDB = (item: CustomHeaderTemplateDB): HeaderTemplate => ({
  id: item.id,
  name: item.name,
  thumbnail: item.thumbnail || '',
  theme: item.theme,
});

export function useCustomHeaderTemplates(userId: string | undefined) {
  const [customTemplates, setCustomTemplates] = useState<HeaderTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_header_templates')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom header templates:', error);
      showError('Falha ao carregar templates de cabeçalho personalizados.');
      setCustomTemplates([]);
    } else {
      setCustomTemplates(data.map(mapFromDB));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addCustomTemplate = async (template: Omit<HeaderTemplate, 'id'>) => {
    if (!userId) return null;
    
    const templateForDb = {
        user_id: userId,
        name: template.name,
        thumbnail: template.thumbnail,
        theme: template.theme,
    };

    const { data, error } = await supabase
      .from('custom_header_templates')
      .insert(templateForDb)
      .select()
      .single();

    if (error) {
      console.error('Error adding custom header template:', error);
      showError(`Falha ao salvar o template "${template.name}".`);
      return null;
    }
    
    const newTemplate = mapFromDB(data);
    setCustomTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  };

  const deleteCustomTemplate = async (id: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('custom_header_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting custom header template:', error);
      showError('Falha ao excluir o template.');
    } else {
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return {
    customTemplates,
    addCustomTemplate,
    deleteCustomTemplate,
    loading,
  };
}