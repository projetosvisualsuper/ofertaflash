import { useState, useEffect, useCallback } from 'react';
import { SavedImage } from '../../types';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';

interface SavedImageDB {
  id: string;
  user_id: string;
  image_url: string; // Alterado de data_url
  storage_path: string | null; // Novo campo
  format_name: string;
  theme: any; // JSONB
  created_at: string;
}

const mapFromDB = (item: SavedImageDB): SavedImage => ({
  id: item.id,
  imageUrl: item.image_url, // Alterado
  storagePath: item.storage_path || '', // Novo
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

  // O tipo de 'image' foi atualizado para refletir que agora ele recebe o URL e o path do Storage
  const addSavedImage = async (image: Omit<SavedImage, 'id' | 'timestamp'>) => {
    if (!userId) return;
    
    const imageForDb = {
        user_id: userId,
        image_url: image.imageUrl, // Usando imageUrl
        storage_path: image.storagePath, // Usando storagePath
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
    
    // 1. Encontrar o path do Storage antes de deletar o registro do DB
    const imageToDelete = savedImages.find(img => img.id === id);
    
    // 2. Deletar o registro do DB
    const { error: dbError } = await supabase
      .from('saved_images')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (dbError) {
      console.error('Error deleting saved image:', dbError);
      showError('Falha ao excluir a imagem do registro.');
      return;
    }
    
    // 3. Deletar o arquivo do Storage (se o path existir)
    if (imageToDelete?.storagePath) {
        const { error: storageError } = await supabase.storage
            .from('saved_arts')
            .remove([imageToDelete.storagePath]);
            
        if (storageError) {
            console.warn('Warning: Failed to delete file from storage:', storageError);
            // Não mostramos erro para o usuário, pois o registro do DB já foi removido.
        }
    }

    setSavedImages(prev => prev.filter(p => p.id !== id));
    showSuccess('Imagem excluída com sucesso.');
  };

  return {
    savedImages,
    addSavedImage,
    deleteImage,
    loading,
  };
}