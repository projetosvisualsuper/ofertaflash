import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';

export interface ProductImage {
  name: string;
  url: string;
  path: string;
  lastModified: Date;
}

export function useProductImages(userId: string | undefined) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Listar arquivos no bucket 'product_images' sob o diretório do usuário
      const { data: files, error: listError } = await supabase.storage
        .from('product_images')
        .list(userId, {
          limit: 100, // Limite razoável para imagens de produto
          sortBy: { column: 'updated_at', order: 'desc' },
        });

      if (listError) throw listError;
      
      // 2. Obter URLs públicas para cada arquivo
      const imageList: ProductImage[] = files
        .filter(file => file.name !== '.emptyFolderPlaceholder') // Ignora placeholder
        .map(file => {
          const { data: urlData } = supabase.storage
            .from('product_images')
            .getPublicUrl(`${userId}/${file.name}`);
            
          return {
            name: file.name,
            url: urlData.publicUrl,
            path: `${userId}/${file.name}`,
            lastModified: new Date(file.updated_at),
          };
        });

      setImages(imageList);
    } catch (error) {
      console.error('Error fetching product images from storage:', error);
      showError('Falha ao carregar imagens salvas.');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);
  
  const deleteImage = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from('product_images')
        .remove([path]);
        
      if (error) throw error;
      
      setImages(prev => prev.filter(img => img.path !== path));
      showSuccess("Imagem removida do banco de imagens.");
    } catch (error) {
      console.error("Error deleting image:", error);
      showError("Falha ao remover a imagem.");
    }
  };

  return {
    productImages: images,
    loadingImages: loading,
    fetchImages,
    deleteImage,
  };
}