import { useState, useEffect, useCallback } from 'react';
import { SavedImage } from '../../types';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';

interface SavedImageDB {
  id: string;
  user_id: string;
  data_url: string;
  format_name: string;
  theme: any; // JSONB
  created_at: string;
}

const mapFromDB = (item: SavedImageDB): SavedImage => ({
  id: item.id,
  dataUrl: item.data_url,
  formatName: item.format_name,
  timestamp: new Date(item.created_at).getTime(),
  theme: item.theme,
});

export function useSavedImages(userId: string | undefined) {
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved images:', error);
      showError('Falha ao carregar galeria de imagens.');
      setSavedImages([]);
    } else {
      setSavedImages(data.map(mapFromDB));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const addSavedImage = async (image: Omit<SavedImage, 'id' | 'timestamp'>) => {
    if (!userId) return;
    
    const imageForDb = {
        user_id: userId,
        data_url: image.dataUrl,
        format_name: image.formatName,
        theme: image.theme,
    };

    const { data, error } = await supabase
      .from('saved_images')
      .insert(imageForDb)
      .select()
      .single();

    if (error) {
      console.error('Error adding saved image:', error);
      showError('Falha ao salvar a arte na galeria.');
      return;
    }
    
    const newImage = mapFromDB(data);
    setSavedImages(prev => [newImage, ...prev]);
    showSuccess(`Arte salva na galeria de Redes Sociais! (${newImage.formatName})`);
  };

  const deleteImage = async (id: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('saved_images')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting saved image:', error);
      showError('Falha ao excluir a imagem.');
    } else {
      setSavedImages(prev => prev.filter(p => p.id !== id));
      showSuccess('Imagem excluída com sucesso.');
    }
  };

  return {
    savedImages,
    addSavedImage,
    deleteImage,
    loading,
  };
}