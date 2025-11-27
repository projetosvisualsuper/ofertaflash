import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import PosterPreview from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat } from '../../types';
import { Image } from 'lucide-react';

interface SocialMediaPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[]; // Full list from App.tsx
}

export default function SocialMediaPage({ theme, setTheme, products, setProducts, formats }: SocialMediaPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Filter formats locally to ensure only social media formats are used
  const socialFormats = formats.filter(f => f.id === 'story' || f.id === 'feed');

  // Effect to ensure a social media format is selected when entering this module
  useEffect(() => {
    const isSocialFormat = socialFormats.some(f => f.id === theme.format.id);
    
    if (!isSocialFormat) {
      // Default to 'feed' (square) if the current format is not social media compatible
      const defaultFormat = socialFormats.find(f => f.id === 'feed');
      if (defaultFormat) {
        // This relies on the Sidebar's handleFormatChange logic to apply presets
        setTheme(prev => ({ ...prev, format: defaultFormat }));
      }
    }
  }, [theme.format.id, socialFormats, setTheme]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden font-sans">
      <Sidebar 
        theme={theme} 
        setTheme={setTheme} 
        products={products} 
        setProducts={setProducts} 
        formats={socialFormats} // Pass the filtered list
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