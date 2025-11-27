import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import PosterPreview from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat } from '../types';

export const POSTER_FORMATS: PosterFormat[] = [
  { id: 'story', name: 'Story / TikTok', aspectRatio: '1080 / 1920', width: 1080, height: 1920, label: '9:16', icon: '📱' },
  { id: 'feed', name: 'Instagram / Quadrado', aspectRatio: '1080 / 1080', width: 1080, height: 1080, label: '1:1', icon: '🟦' },
  { id: 'a4', name: 'Folha A4 / Cartaz', aspectRatio: '2480 / 3508', width: 2480, height: 3508, label: 'A4', icon: '📄' },
  { id: 'tv', name: 'TV / Paisagem', aspectRatio: '1920 / 1080', width: 1920, height: 1080, label: '16:9', icon: '📺' },
];

const INITIAL_THEME: PosterTheme = {
  primaryColor: '#dc2626',
  secondaryColor: '#fbbf24',
  backgroundColor: '#ffffff',
  textColor: '#1a1a1a',
  headerTextColor: '#ffffff',
  headerTitle: { text: 'SUPER OFERTAS', x: 0, y: 0, scale: 1 },
  headerSubtitle: { text: 'SÓ HOJE', x: 0, y: 0, scale: 1 },
  footerText: { text: 'Ofertas válidas enquanto durarem os estoques', x: 0, y: 0, scale: 1 },
  layoutCols: 2,
  format: POSTER_FORMATS[2],
  priceCardStyle: 'default',
  priceCardBackgroundColor: '#ffffff',
  priceCardTextColor: '#dc2626',
  headerLayoutId: 'text-only',
  headerArtStyleId: 'block',
  fontFamilyDisplay: 'Oswald, sans-serif',
  fontFamilyBody: 'Inter, sans-serif',
  headerTitleCase: 'uppercase',
  hasFrame: false,
  frameColor: '#fbbf24', // Cor inicial da moldura (secundária)
  frameThickness: 1.5, // Espessura inicial em vmin
  unitBottomEm: -0.5, 
  unitRightEm: -1.5,
  // Novas propriedades
  headerImage: undefined,
  headerImageMode: 'none',
  headerImageOpacity: 0.3,
};

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Leite Integral 1L', description: 'Leite fresco e puro, ideal para toda a família.', price: '4.99', oldPrice: '6.50', unit: 'un', layout: defaultLayout },
  { id: '2', name: 'Arroz Branco 5kg', description: 'Tipo 1, grãos selecionados.', price: '22.90', unit: 'un', layout: defaultLayout },
  { id: '3', name: 'Café Tradicional 500g', description: 'Torra média, sabor intenso.', price: '14.50', oldPrice: '18.90', unit: 'un', layout: defaultLayout },
];

export default function PosterBuilderPage() {
  const [theme, setTheme] = useState<PosterTheme>(INITIAL_THEME);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
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
        formats={POSTER_FORMATS}
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