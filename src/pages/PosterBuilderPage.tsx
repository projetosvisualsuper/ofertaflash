import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import PosterPreview, { PosterPreviewRef } from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat, SavedImage } from '../../types';
import { INITIAL_THEME, POSTER_FORMATS } from '../state/initialState';
import { Download, Save } from 'lucide-react';
import { toPng } from 'html-to-image';
import { showSuccess, showError } from '../utils/toast';
import { dataURLtoBlob } from '../utils/cn'; // Importando a função auxiliar
import { supabase } from '@/src/integrations/supabase/client';
import WooCommerceBanner from '../components/WooCommerceBanner';
import WooCommerceCarousel from '../components/WooCommerceCarousel';

interface PosterBuilderPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
  addSavedImage: (image: Omit<SavedImage, 'id' | 'timestamp'>) => Promise<void>;
}

// Encontra os formatos de redes sociais
const SOCIAL_MEDIA_FORMATS = POSTER_FORMATS.filter(f => f.id === 'story' || f.id === 'feed');

export default function PosterBuilderPage({ theme, setTheme, products, setProducts, formats, addSavedImage }: PosterBuilderPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const posterRef = useRef<PosterPreviewRef>(null);
  const tempPosterRef = useRef<HTMLDivElement>(null); // Novo ref para renderização temporária

  // Filtra o formato 'tv' para que ele não apareça no Poster Builder
  const builderFormats = formats.filter(f => f.id !== 'tv');
  const defaultFormat = builderFormats.find(f => f.id === 'a4') || builderFormats[0];

  useEffect(() => {
    const loadFonts = async () => {
      try {
        const response = await fetch('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Inter:wght@400;700;900&family=Oswald:wght@700&family=Pacifico&family=Lobster&family=Roboto+Condensed:wght@700&display=swap');
        const css = await response.text();
        const style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
      } catch (error) {
        console.error("Failed to load fonts manually:", error);
      }
    };
    loadFonts();
    
    // Se o formato atual for 'tv', mude para um formato padrão do builder
    if (theme.format.id === 'tv' && defaultFormat) {
        setTheme(prevTheme => ({
            ...prevTheme,
            format: defaultFormat,
        }));
    }
  }, [theme.format.id, setTheme, defaultFormat]);

  const handleDownload = () => {
    if (posterRef.current) {
      posterRef.current.triggerDownload();
    }
  };
  
  // Função auxiliar para gerar e salvar uma imagem para um formato específico
  const generateAndSaveImage = useCallback(async (format: PosterFormat, currentTheme: PosterTheme, currentProducts: Product[], userId: string) => {
    // 1. Criar um tema temporário com o formato desejado
    const tempTheme: PosterTheme = {
        ...currentTheme,
        format: format,
    };
    
    // 2. Renderizar o PosterPreview com o tema temporário no ref temporário
    // Nota: O PosterPreview precisa ser renderizado no DOM para que o toPng funcione.
    // O componente PosterPreview já está sendo renderizado no DOM principal,
    // mas precisamos garantir que ele use o formato correto para a exportação.
    
    // Para evitar a complexidade de renderizar um componente invisível,
    // vamos usar o ref principal (posterRef.current) e forçar a renderização
    // do formato desejado, mas isso exigiria alterar o estado global (theme),
    // o que causaria piscar na tela.
    
    // SOLUÇÃO: Usar o ref principal, mas salvar o formato original e restaurá-lo.
    const originalFormat = currentTheme.format;
    
    // Temporariamente muda o formato do tema global (isso fará o preview piscar)
    setTheme(tempTheme);
    
    // Espera o DOM atualizar
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const posterElement = document.getElementById('poster-canvas');
    if (!posterElement) throw new Error("Poster canvas element not found.");

    try {
      // 3. Gerar a imagem PNG em Base64
      const targetWidth = format.width;
      const targetHeight = format.height;
      const scale = targetWidth / posterElement.offsetWidth;
      const sourceHeight = posterElement.offsetWidth * (targetHeight / targetWidth);

      const dataUrl = await toPng(posterElement, { 
        cacheBust: true, 
        quality: 1.0,
        pixelRatio: 1,
        width: targetWidth,
        height: targetHeight,
        style: {
           transform: `scale(${scale})`,
           transformOrigin: 'top left',
           width: `${posterElement.offsetWidth}px`,
           height: `${sourceHeight}px`,
           maxWidth: 'none',
           maxHeight: 'none',
           margin: '0',
           boxShadow: 'none',
        }
      });
      
      // 4. Converter Base64 para Blob e Upload para o Supabase Storage
      const imageBlob = dataURLtoBlob(dataUrl);
      const fileName = `art-${format.id}-${crypto.randomUUID()}.png`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('saved_arts')
        .upload(filePath, imageBlob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw new Error(`Falha no upload (${format.name}): ${uploadError.message}`);

      // 5. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('saved_arts')
        .getPublicUrl(filePath);
        
      if (!urlData.publicUrl) throw new Error(`Falha ao obter URL pública (${format.name}).`);

      // 6. Limpeza do Tema antes de salvar no DB (remove Base64)
      const themeToSave = { ...tempTheme };
      if (themeToSave.backgroundImage && themeToSave.backgroundImage.startsWith('data:')) {
        themeToSave.backgroundImage = undefined;
      }
      if (themeToSave.logo && themeToSave.logo.src.startsWith('data:')) {
        themeToSave.logo.src = '';
      }

      // 7. Salvar o registro no DB
      const newImage: Omit<SavedImage, 'id' | 'timestamp'> = {
        imageUrl: urlData.publicUrl,
        storagePath: filePath,
        formatName: format.name,
        theme: themeToSave, 
      };
      
      await addSavedImage(newImage);
      return true;

    } catch (err) {
      console.error(`Failed to save poster for ${format.name}`, err);
      showError(`Erro ao salvar ${format.name}: ${(err as Error).message}`);
      return false;
    } finally {
      // 8. Restaurar o formato original do tema
      setTheme(prevTheme => ({
          ...prevTheme,
          format: originalFormat,
      }));
      // Espera o DOM restaurar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, [addSavedImage, setTheme]);


  const handleSaveToGallery = async () => {
    setIsSaving(true);
    const userResponse = await supabase.auth.getUser();
    const userId = userResponse.data.user?.id;
    
    if (!userId) {
        showError("Usuário não autenticado. Por favor, faça login novamente.");
        setIsSaving(false);
        return;
    }

    let successCount = 0;
    let errorCount = 0;
    
    // Salva o formato ativo primeiro (se não for um dos sociais)
    if (!SOCIAL_MEDIA_FORMATS.some(f => f.id === theme.format.id)) {
        const success = await generateAndSaveImage(theme.format, theme, products, userId);
        if (success) successCount++; else errorCount++;
    }
    
    // Salva os formatos de redes sociais (Story e Feed)
    for (const format of SOCIAL_MEDIA_FORMATS) {
        const success = await generateAndSaveImage(format, theme, products, userId);
        if (success) successCount++; else errorCount++;
    }

    setIsSaving(false);
    
    if (successCount > 0) {
        showSuccess(`${successCount} artes salvas na galeria de Redes Sociais!`);
    }
    if (errorCount > 0) {
        showError(`${errorCount} artes falharam ao salvar. Verifique o console.`);
    }
  };

  const handleFormatChange = useCallback((newFormat: PosterFormat) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      format: newFormat,
    }));
  }, [setTheme]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden font-sans">
      <Sidebar 
        theme={theme} 
        setTheme={setTheme} 
        products={products} 
        setProducts={setProducts} 
        formats={builderFormats} // Usando a lista filtrada
        handleFormatChange={handleFormatChange}
      />
      
      <main className="flex-1 bg-gray-100 relative h-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
         {(isDownloading || isSaving) && (
           <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm fixed">
             <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center animate-pulse">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="font-semibold text-gray-800">{isSaving ? 'Salvando Artes na Galeria...' : 'Gerando Imagem em Alta Resolução...'}</p>
             </div>
           </div>
         )}
         
         <div className="flex h-full w-full max-w-7xl items-center justify-center gap-6">
            {/* Área de Preview */}
            <div className="flex-1 relative h-full flex items-center justify-center">
                {/* O PosterPreview principal agora é o elemento que será capturado */}
                <PosterPreview 
                  ref={posterRef}
                  theme={theme} 
                  products={products} 
                  onDownloadStart={() => setIsDownloading(true)}
                  onDownloadEnd={() => setIsDownloading(false)}
                />
            </div>
            
            {/* Botões de Ação Lateral e Banner */}
            <div className="flex flex-col flex-shrink-0 w-48 h-full"> {/* Adicionado h-full para ocupar a altura total */}
                
                {/* Área Vermelha: Botões de Ação */}
                <div className="flex flex-col gap-4 flex-shrink-0 mb-4">
                    <button
                      onClick={handleSaveToGallery}
                      disabled={isSaving || isDownloading}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 w-full"
                    >
                      <Save size={20} />
                      {isSaving ? 'Salvando...' : `Salvar Artes (SM)`}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={isSaving || isDownloading}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 w-full"
                    >
                      <Download size={20} />
                      Baixar {theme.format.label}
                    </button>
                </div>
                
                {/* Área Amarela: Banner do WooCommerce (flex-shrink-0 para não crescer) */}
                <div className="flex-shrink-0 mb-4">
                    <WooCommerceBanner />
                </div>
                
                {/* NOVO: Carrossel de Destaques (flex-1 para ocupar o restante) */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                    <WooCommerceCarousel />
                </div>
            </div>
         </div>
      </main>
    </div>
  );
}