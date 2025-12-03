import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import PosterPreview, { PosterPreviewRef } from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat, SavedImage } from '../../types';
import { INITIAL_THEME } from '../state/initialState';
import { Download, Save } from 'lucide-react';
import { toPng } from 'html-to-image';
import { showSuccess, showError } from '../utils/toast';
import { dataURLtoBlob } from '../utils/cn'; // Importando a função auxiliar
import { supabase } from '@/src/integrations/supabase/client';
import WooCommerceBanner from '../components/WooCommerceBanner';
import WooCommerceCarousel from '../components/WooCommerceCarousel'; // NOVO IMPORT

interface PosterBuilderPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
  addSavedImage: (image: Omit<SavedImage, 'id' | 'timestamp'>) => Promise<void>;
}

export default function PosterBuilderPage({ theme, setTheme, products, setProducts, formats, addSavedImage }: PosterBuilderPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const posterRef = useRef<PosterPreviewRef>(null);
  const posterCanvasRef = useRef<HTMLDivElement>(null); // Ref para o elemento DOM do PosterPreview

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
  
  const handleSaveToGallery = async () => {
    const posterElement = document.getElementById('poster-canvas');
    if (!posterElement) return;

    setIsSaving(true);
    const userResponse = await supabase.auth.getUser();
    const userId = userResponse.data.user?.id;
    
    if (!userId) {
        showError("Usuário não autenticado. Por favor, faça login novamente.");
        setIsSaving(false);
        return;
    }

    try {
      // 1. Gerar a imagem PNG em Base64
      const targetWidth = theme.format.width;
      const targetHeight = theme.format.height;
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
      
      // 2. Converter Base64 para Blob
      const imageBlob = dataURLtoBlob(dataUrl);
      const fileName = `art-${theme.format.id}-${crypto.randomUUID()}.png`;
      const filePath = `${userId}/${fileName}`; // Caminho: [UID]/[nome-do-arquivo].png

      // 3. Upload para o Supabase Storage (Bucket 'saved_arts')
      const { error: uploadError } = await supabase.storage
        .from('saved_arts')
        .upload(filePath, imageBlob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // Loga o erro detalhado do Storage
        console.error("Storage Upload Error:", uploadError);
        throw new Error(`Falha no upload: ${uploadError.message}`);
      }

      // 4. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('saved_arts')
        .getPublicUrl(filePath);
        
      if (!urlData.publicUrl) throw new Error("Falha ao obter URL pública do Storage.");

      // 5. Limpeza do Tema antes de salvar no DB
      const themeToSave = { ...theme };
      
      // Garantir que Base64 não seja salvo no tema (embora já tenhamos feito isso no Sidebar, é uma boa prática)
      if (themeToSave.backgroundImage && themeToSave.backgroundImage.startsWith('data:')) {
        themeToSave.backgroundImage = undefined;
      }
      if (themeToSave.logo && themeToSave.logo.src.startsWith('data:')) {
        themeToSave.logo.src = '';
      }
      // ---------------------------------------

      // 6. Salvar o registro no DB com o URL e o path
      const newImage: Omit<SavedImage, 'id' | 'timestamp'> = {
        imageUrl: urlData.publicUrl,
        storagePath: filePath,
        formatName: theme.format.name,
        theme: themeToSave, 
      };
      
      await addSavedImage(newImage);

    } catch (err) {
      console.error("Failed to save poster to gallery", err);
      // Mostra a mensagem de erro detalhada para o usuário
      showError(`Erro ao salvar a arte na galeria. Detalhe: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
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
               <p className="font-semibold text-gray-800">{isSaving ? 'Salvando Arte na Galeria...' : 'Gerando Imagem em Alta Resolução...'}</p>
             </div>
           </div>
         )}
         
         <div className="flex h-full w-full max-w-7xl items-center justify-center gap-6">
            {/* Área de Preview */}
            <div className="flex-1 relative h-full flex items-center justify-center">
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
                      {isSaving ? 'Salvando...' : `Salvar Arte`}
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