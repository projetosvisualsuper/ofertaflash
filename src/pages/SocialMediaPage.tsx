import React, { useState, useEffect, useRef, useCallback } from 'react';
import SocialMediaSidebar from '../components/SocialMediaSidebar';
import PosterPreview, { PosterPreviewRef } from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat, HeaderElement } from '../../types';
import { Image } from 'lucide-react';
import { LAYOUT_PRESETS } from '../config/layoutPresets';

interface SocialMediaPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[]; // Full list from App.tsx
}

export default function SocialMediaPage({ theme, setTheme, products, setProducts, formats }: SocialMediaPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const posterRef = useRef<PosterPreviewRef>(null);
  
  // Filter formats locally to ensure only social media formats are used
  const socialFormats = formats.filter(f => f.id === 'story' || f.id === 'feed');

  const applyFormatPreset = useCallback((newFormat: PosterFormat) => {
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
        // Apply layout presets while preserving user text
        headerTitle: mergeElement(prevTheme.headerTitle, updatedPreset.headerTitle),
        headerSubtitle: mergeElement(prevTheme.headerSubtitle, updatedPreset.headerSubtitle),
        footerText: mergeElement(prevTheme.footerText, updatedPreset.footerText),
      };
    });
  }, [setTheme]); // setTheme is stable, so this function is stable

  // Effect to ensure a social media format is selected and preset applied when entering this module
  useEffect(() => {
    const isSocialFormat = socialFormats.some(f => f.id === theme.format.id);
    
    if (!isSocialFormat) {
      // Default to 'feed' (square) if the current format is not social media compatible
      const defaultFormat = socialFormats.find(f => f.id === 'feed');
      if (defaultFormat) {
        applyFormatPreset(defaultFormat);
      }
    }
  }, [theme.format.id, socialFormats, applyFormatPreset]);

  const handleDownload = () => {
    if (posterRef.current) {
      posterRef.current.triggerDownload();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden font-sans">
      <SocialMediaSidebar 
        theme={theme} 
        setTheme={setTheme} 
        formats={socialFormats} // Pass the filtered list
        handleDownload={handleDownload}
        handleFormatChange={applyFormatPreset} // Pass the stable function
      />
      
      <main className="flex-1 bg-gray-100 relative h-full flex flex-col">
         {isDownloading && (
           <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm fixed">
             <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center animate-pulse">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="font-semibold text-gray-800">Gerando Imagem para Redes Sociais...</p>
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
      </main>
    </div>
  );
}