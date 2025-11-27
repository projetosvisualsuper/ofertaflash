import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import PosterPreview from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat } from '../types';
import { POSTER_FORMATS } from '../state/initialState';

interface PosterBuilderPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
}

export default function PosterBuilderPage({ theme, setTheme, products, setProducts, formats }: PosterBuilderPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden font-sans">
      <Sidebar 
        theme={theme} 
        setTheme={setTheme} 
        products={products} 
        setProducts={setProducts} 
        formats={formats}
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