import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import PosterPreview, { PosterPreviewRef } from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat, SavedImage } from '../../types';
import { INITIAL_THEME } from '../state/initialState';
import { Download, Save } from 'lucide-react';
import { toPng } from 'html-to-image';
import { showSuccess, showError } from '../utils/toast';

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
        const response = await fetch('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Inter:wght@400;700;900&family=Oswald:wght@700&family=Roboto+Condensed:wght@700&display=swap');
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
    try {
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

      // --- Limpeza do Tema antes de salvar ---
      const themeToSave = { ...theme };
      
      // 1. Remover a imagem de fundo (Base64) se existir
      if (themeToSave.backgroundImage && themeToSave.backgroundImage.startsWith('data:')) {
        themeToSave.backgroundImage = undefined;
      }
      
      // 2. Remover o src do logo (Base64) se existir, mantendo o path do storage
      if (themeToSave.logo && themeToSave.logo.src.startsWith('data:')) {
        themeToSave.logo.src = ''; // Limpa o src, mas mantém o path se for do storage
      }
      // ---------------------------------------

      const newImage: Omit<SavedImage, 'id' | 'timestamp'> = {
        dataUrl: dataUrl,
        formatName: theme.format.name,
        theme: themeToSave, // SALVANDO O TEMA LIMPO
      };
      
      await addSavedImage(newImage);

    } catch (err) {
      console.error("Failed to save poster to gallery", err);
      showError("Erro ao salvar a arte na galeria. (Tente remover imagens de fundo ou logo grandes)");
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
      
      <main className="flex-1 bg-gray-100 relative h-full flex flex-col">
         {(isDownloading || isSaving) && (
           <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm fixed">
             <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center animate-pulse">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="font-semibold text-gray-800">{isSaving ? 'Salvando Arte na Galeria...' : 'Gerando Imagem em Alta Resolução...'}</p>
             </div>
           </div>
         )}
         <div className="flex-1 relative overflow-hidden bg-gray-200/80">
            <PosterPreview 
              ref={posterRef}
              theme={theme} 
              products={products} 
              onDownloadStart={() => setIsDownloading(true)}
              onDownloadEnd={() => setIsDownloading(false)}
            />
         </div>
         
         <div className="mt-8 flex gap-4 justify-center p-4 flex-shrink-0">
            <button
              onClick={handleSaveToGallery}
              disabled={isSaving || isDownloading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? 'Salvando...' : `Salvar Arte (${theme.format.name})`}
            </button>
            <button
              onClick={handleDownload}
              disabled={isSaving || isDownloading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Download size={20} />
              Baixar {theme.format.name}
            </button>
         </div>
      </main>
    </div>
  );
}