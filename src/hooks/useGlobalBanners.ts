import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';

export interface GlobalBanner {
  id: string;
  name: string;
  content: string;
  background_color: string;
  text_color: string;
  is_active: boolean;
  order_index: number;
  image_url: string | null; // NOVO CAMPO
}

export function useGlobalBanners(isAdmin: boolean = false) {
  const [banners, setBanners] = useState<GlobalBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    
    // Se for admin, busca todos, senão, busca apenas os ativos
    const query = supabase
      .from('global_banners')
      .select('*')
      .order('order_index', { ascending: true })
      .order('updated_at', { ascending: false });
      
    if (!isAdmin) {
        query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching global banners:', error);
      if (isAdmin) {
        showError('Falha ao carregar banners globais.');
      }
      setBanners([]);
    } else {
      setBanners(data as GlobalBanner[]);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);
  
  const updateBanner = async (id: string, updates: Partial<GlobalBanner>) => {
    if (!isAdmin) {
      showError("Apenas administradores podem atualizar banners.");
      return;
    }
    
    const { error } = await supabase
      .from('global_banners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating banner:', error);
      showError(`Falha ao atualizar o banner.`);
      throw new Error(`Falha ao atualizar o banner.`);
    } else {
      showSuccess(`Banner "${updates.name || id}" atualizado com sucesso!`);
      await fetchBanners(); 
    }
  };
  
  const addBanner = async (newBanner: Omit<GlobalBanner, 'id'>) => {
    if (!isAdmin) {
      showError("Apenas administradores podem adicionar banners.");
      return;
    }
    
    const { error } = await supabase
      .from('global_banners')
      .insert(newBanner);

    if (error) {
      console.error('Error adding banner:', error);
      showError(`Falha ao adicionar o banner.`);
      throw new Error(`Falha ao adicionar o banner.`);
    } else {
      showSuccess(`Banner "${newBanner.name}" adicionado com sucesso!`);
      await fetchBanners(); 
    }
  };
  
  const deleteBanner = async (id: string) => {
    if (!isAdmin) {
      showError("Apenas administradores podem excluir banners.");
      return;
    }
    
    const { error } = await supabase
      .from('global_banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting banner:', error);
      showError('Falha ao excluir o banner.');
      throw new Error('Falha ao excluir o banner.');
    } else {
      showSuccess('Banner excluído com sucesso.');
      await fetchBanners();
    }
  };

  return {
    banners,
    loading,
    updateBanner,
    addBanner,
    deleteBanner,
    fetchBanners,
  };
}