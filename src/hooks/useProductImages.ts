import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';

export interface ProductImage {
  name: string;
  url: string;
  path: string;
  lastModified: Date;
  isShared: boolean; // Novo campo para identificar se é compartilhada
}

// Diretório compartilhado para todas as imagens de produto
const SHARED_DIR = 'shared';

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
      const limit = 100;
      const sortBy = { column: 'updated_at', order: 'desc' } as const;
      
      // 1. Buscar imagens do diretório do usuário (privado)
      const { data: userFiles, error: userListError } = await supabase.storage
        .from('product_images')
        .list(userId, { limit, sortBy });

      if (userListError) throw userListError;
      
      // 2. Buscar imagens do diretório compartilhado (público)
      const { data: sharedFiles, error: sharedListError } = await supabase.storage
        .from('product_images')
        .list(SHARED_DIR, { limit, sortBy });
        
      if (sharedListError) throw sharedListError;

      const allFiles = [...userFiles, ...sharedFiles];
      const uniqueFiles = new Map<string, any>();
      
      // Filtra duplicatas e placeholders
      allFiles.forEach(file => {
        if (file.name !== '.emptyFolderPlaceholder') {
          // Usa o nome do arquivo como chave para garantir unicidade (embora o path seja mais seguro)
          const path = file.id ? file.id : file.name; 
          uniqueFiles.set(path, file);
        }
      });
      
      const imageList: ProductImage[] = Array.from(uniqueFiles.values()).map(file => {
          const isShared = file.name.includes(SHARED_DIR) || file.name.includes('shared'); // Heurística simples
          const filePath = file.id ? file.id : `${file.name.includes('/') ? '' : userId + '/'}${file.name}`; // Tenta reconstruir o path se o ID não estiver presente
          
          // Se o arquivo veio do sharedFiles, ajustamos o path para garantir que o getPublicUrl funcione
          const finalPath = sharedFiles.includes(file) ? `${SHARED_DIR}/${file.name}` : `${userId}/${file.name}`;

          const { data: urlData } = supabase.storage
            .from('product_images')
            .getPublicUrl(finalPath);
            
          return {
            name: file.name,
            url: urlData.publicUrl,
            path: finalPath,
            lastModified: new Date(file.updated_at),
            isShared: finalPath.startsWith(SHARED_DIR),
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
      
      // Remove do estado local para feedback imediato
      setImages(prev => prev.filter(img => img.path !== path));
      showSuccess("Imagem removida do banco de imagens.");
      
      // Força a recarga da lista do Storage para garantir que o cache seja ignorado
      await fetchImages(); 
      
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