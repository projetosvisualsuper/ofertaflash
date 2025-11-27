import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import PosterPreview, { PosterPreviewRef } from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat, HeaderElement } from '../../types';
import { POSTER_FORMATS } from '../state/initialState';
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

  const handleFormatChange = (newFormat: PosterFormat) => {
    const preset = LAYOUT_PRESETS[newFormat.id] || {};
    setTheme(prevTheme => {
      // Preserve existing text when applying presets
      const updatedPreset = { ...preset };
      
      // Helper to merge preset elements while preserving user's text
      const mergeElement = (
        prevElement: HeaderElement, 
        presetElement: Partial<HeaderElement> | undefined
      ): HeaderElement => ({
        ...prevElement,
        ...presetElement,
        text: prevElement.text, // Always keep user's text
      });

      return {
        ...prevTheme,
        ...updatedPreset,
        format: newFormat,
        headerTitle: mergeElement(prevTheme.headerTitle, updatedPreset.headerTitle),
        headerSubtitle: mergeElement(prevTheme.headerSubtitle, updatedPreset.headerSubtitle),
        footerText: mergeElement(prevTheme.footerText, updatedPreset.footerText),
      };
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden font-sans">
      <Sidebar 
        theme={theme} 
        setTheme={setTheme} 
        products={products} 
        setProducts={setProducts} 
        formats={formats}
        handleFormatChange={handleFormatChange} // Pass the new function
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