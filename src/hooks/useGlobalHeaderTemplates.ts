import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { HeaderTemplate, PosterTheme } from '../../types';

// Define a estrutura do DB
interface GlobalHeaderTemplateDB {
  id: string;
  name: string;
  thumbnail: string | null;
  theme: Partial<PosterTheme>;
}

const mapFromDB = (item: GlobalHeaderTemplateDB): HeaderTemplate => ({
  id: item.id,
  name: item.name,
  thumbnail: item.thumbnail || '',
  theme: item.theme,
});

export function useGlobalHeaderTemplates(isAdmin: boolean = false) {
  const [globalTemplates, setGlobalTemplates] = useState<HeaderTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    
    // Busca todos os templates globais (RLS garante que todos podem ler)
    const { data, error } = await supabase
      .from('global_header_templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching global header templates:', error);
      showError('Falha ao carregar templates de cabeçalho globais.');
      setGlobalTemplates([]);
    } else {
      setGlobalTemplates(data.map(mapFromDB));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const addGlobalTemplate = async (template: Omit<HeaderTemplate, 'id'>) => {
    if (!isAdmin) return null;
    
    const templateForDb = {
        name: template.name,
        thumbnail: template.thumbnail,
        theme: template.theme,
    };

    const { data, error } = await supabase
      .from('global_header_templates')
      .insert(templateForDb)
      .select()
      .single();

    if (error) {
      console.error('Error adding global header template:', error);
      showError(`Falha ao salvar o template global "${template.name}".`);
      return null;
    }
    
    const newTemplate = mapFromDB(data);
    setGlobalTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  };

  const deleteGlobalTemplate = async (id: string) => {
    if (!isAdmin) return;
    
    const { error } = await supabase
      .from('global_header_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting global header template:', error);
      showError('Falha ao excluir o template global.');
    } else {
      setGlobalTemplates(prev => prev.filter(t => t.id !== id));
      showSuccess('Template global excluído com sucesso.');
    }
  };

  return {
    globalTemplates,
    addGlobalTemplate,
    deleteGlobalTemplate,
    loading,
    fetchTemplates,
  };
}