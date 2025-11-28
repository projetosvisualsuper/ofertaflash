import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import PosterPreview, { PosterPreviewRef } from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat, HeaderElement, HeaderAndFooterElements } from '../../types';
import { INITIAL_THEME } from '../state/initialState';
import { Download } from 'lucide-react';
import { LAYOUT_PRESETS } from '../config/layoutPresets';

interface PosterBuilderPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
}

export default function PosterBuilderPage({ theme, setTheme, products, setProducts, formats }: PosterBuilderPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const posterRef = useRef<PosterPreviewRef>(null);

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
  }, []);

  const handleDownload = () => {
    if (posterRef.current) {
      posterRef.current.triggerDownload();
    }
  };

  const handleFormatChange = useCallback((newFormat: PosterFormat) => {
    setTheme(prevTheme => {
      const preset = LAYOUT_PRESETS[newFormat.id] || {};
      
      // Ensure we have a valid base to work from, falling back to initial state
      const safeHeaderElements = prevTheme.headerElements || INITIAL_THEME.headerElements;
      const targetFormatElements = safeHeaderElements[newFormat.id] || INITIAL_THEME.headerElements[newFormat.id];

      const newHeaderElementsForFormat: HeaderAndFooterElements = {
        headerTitle: {
          ...targetFormatElements.headerTitle,
          ...(preset.headerTitle || {}),
        },
        headerSubtitle: {
          ...targetFormatElements.headerSubtitle,
          ...(preset.headerSubtitle || {}),
        },
        footerText: {
          ...targetFormatElements.footerText,
          ...(preset.footerText || {}),
        },
      };

      return {
        ...prevTheme,
        format: newFormat,
        layoutCols: preset.layoutCols ?? prevTheme.layoutCols,
        headerElements: {
          ...safeHeaderElements,
          [newFormat.id]: newHeaderElementsForFormat,
        },
      };
    });
  }, [setTheme]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden font-sans">
      <Sidebar 
        theme={theme} 
        setTheme={setTheme} 
        products={products} 
        setProducts={setProducts} 
        formats={formats}
        handleFormatChange={handleFormatChange}
      />
      
      <main className="flex-1 bg-gray-100 relative h-full flex flex-col">
         {isDownloading && (
           <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm fixed">
             <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center animate-pulse">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="font-semibold text-gray-800">Gerando Imagem em Alta Resolução...</p>
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
              onClick={handleDownload}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Download size={20} />
              Baixar {theme.format.name}
            </button>
         </div>
      </main>
    </div>
  );
}