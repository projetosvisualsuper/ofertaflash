import React, { useRef } from 'react';
import { PosterTheme, Product } from '../types';
import ProductCard from './ProductCard';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';

interface PosterPreviewProps {
  theme: PosterTheme;
  products: Product[];
  onDownloadStart: () => void;
  onDownloadEnd: () => void;
}

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
};

const PosterPreview: React.FC<PosterPreviewProps> = ({ theme, products, onDownloadStart, onDownloadEnd }) => {
  const posterRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (posterRef.current) {
      onDownloadStart();
      try {
        const element = posterRef.current;
        const targetWidth = theme.format.width;
        const targetHeight = theme.format.height;
        const scale = targetWidth / element.offsetWidth;

        const dataUrl = await toPng(element, { 
          cacheBust: true, 
          quality: 1.0,
          pixelRatio: 1, 
          width: targetWidth,
          height: targetHeight,
          backgroundColor: theme.backgroundColor,
          style: {
             transform: `scale(${scale})`,
             transformOrigin: 'top left',
             width: `${element.offsetWidth}px`,
             height: `${element.offsetHeight}px`,
             maxWidth: 'none',
             maxHeight: 'none',
             margin: '0',
             boxShadow: 'none',
          }
        });

        const link = document.createElement('a');
        link.download = `oferta-${theme.format.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Failed to download poster", err);
        alert("Erro ao gerar a imagem. Tente novamente.");
      } finally {
        onDownloadEnd();
      }
    }
  };

  const isHeroMode = products.length === 1;
  const product = products[0];
  const layout = product?.layout || defaultLayout;

  const priceParts = product ? product.price.split('.') : ['0', '00'];
  const priceInt = priceParts[0];
  const priceDec = priceParts[1] || '00';
  const oldPrice = product?.oldPrice ? parseFloat(product.oldPrice).toFixed(2).replace('.', ',') : null;

  const isLandscape = theme.format.width > theme.format.height;
  const isStory = theme.format.aspectRatio === '1080 / 1920';
  const fontScale = isStory ? 1.2 : (isLandscape ? 0.9 : 1);
  const totalRows = Math.max(1, Math.ceil(products.length / theme.layoutCols));

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-200 p-4 md:p-8 overflow-auto">
      <div className="relative flex-shrink-0 origin-center transition-all duration-300">
         
         <div 
            ref={posterRef}
            id="poster-canvas"
            className="relative flex flex-col bg-white overflow-hidden shadow-2xl"
            style={{
              backgroundColor: theme.backgroundColor,
              color: theme.textColor,
              aspectRatio: theme.format.aspectRatio,
              width: isLandscape ? '800px' : '500px', 
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
          >
            {theme.backgroundImage && (
              <div 
                className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${theme.backgroundImage})` }}
              />
            )}
             <div 
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ 
                    background: isHeroMode 
                        ? `radial-gradient(circle at center, transparent 0%, ${theme.backgroundColor} 100%)` 
                        : 'none'
                }}
              />

            <header 
              className="relative z-10 w-full flex-shrink-0 transition-all flex flex-col items-center justify-center"
              style={{ 
                background: `linear-gradient(to bottom, ${theme.primaryColor}, ${theme.primaryColor}CC, transparent)`,
                padding: isLandscape ? '1.5rem' : '2rem 1.5rem 0.5rem',
                minHeight: isStory ? '15%' : 'auto' 
              }}
            >
               <h1 className="font-display font-black uppercase tracking-wide drop-shadow-lg mb-2 leading-none text-white text-center"
                  style={{ 
                    textShadow: '4px 4px 0px rgba(0,0,0,0.2)',
                    fontSize: (isLandscape ? 4 : 3.5) * fontScale + 'rem'
                  }}
               >
                 {theme.headerTitle}
               </h1>
               <div 
                 className="inline-block px-8 py-1.5 font-bold uppercase tracking-widest rounded-full shadow-lg transform -rotate-1 border-2 border-white/20 relative z-20"
                 style={{ 
                   backgroundColor: theme.secondaryColor, 
                   color: theme.primaryColor,
                   fontSize: 1.25 * fontScale + 'rem'
                 }}
               >
                 {theme.headerSubtitle}
               </div>
            </header>

            <div className="flex-1 w-full min-h-0 relative z-10 flex flex-col">
              {isHeroMode && product ? (
                // === HERO MODE (Single Product) - NOW WITH ABSOLUTE POSITIONING ===
                <div className="w-full h-full relative">
                   
                   {/* IMAGE CONTAINER */}
                   <div 
                     className="absolute top-1/2 left-1/2 w-3/5 h-1/2 transition-transform duration-100"
                     style={{
                       transform: `translateX(calc(-50% + ${layout.image.x}px)) translateY(calc(-75% + ${layout.image.y}px)) scale(${layout.image.scale})`
                     }}
                   >
                      {product.image ? (
                         <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-full h-full object-contain drop-shadow-2xl"
                            style={{ filter: 'drop-shadow(0 25px 25px rgba(0,0,0,0.3))' }}
                         />
                      ) : (
                        <div className="w-full h-full text-gray-300 opacity-50 border-4 border-dashed rounded-3xl flex items-center justify-center">
                           <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </div>
                      )}
                   </div>

                   {/* NAME CONTAINER */}
                   <div 
                     className="absolute top-1/2 left-1/2 w-full text-center px-4 transition-transform duration-100"
                     style={{
                       transform: `translateX(calc(-50% + ${layout.name.x}px)) translateY(${layout.name.y}px) scale(${layout.name.scale})`
                     }}
                   >
                      <h2 
                        className="font-bold text-gray-800 leading-tight uppercase tracking-tight line-clamp-2 drop-shadow-lg px-2 bg-white/80 backdrop-blur-sm rounded-lg inline-block shadow-sm" 
                        style={{ 
                          color: theme.textColor,
                          fontSize: (isLandscape ? 2.5 : 2) * fontScale + 'rem',
                          padding: '0.25rem 1rem'
                        }}
                      >
                        {product.name}
                      </h2>
                   </div>
                      
                   {/* PRICE CONTAINER */}
                   <div 
                     className="absolute top-1/2 left-1/2 transition-transform duration-100"
                     style={{
                       transform: `translateX(calc(-50% + ${layout.price.x}px)) translateY(calc(75% + ${layout.price.y}px)) scale(${layout.price.scale})`
                     }}
                   >
                      <div 
                        className="relative bg-white rounded-[2.5rem] shadow-2xl border-2 border-gray-50 flex items-center justify-center overflow-hidden transform transition-transform pointer-events-auto mx-auto"
                        style={{
                           padding: isLandscape ? '2rem 4rem' : '1rem 3rem',
                           background: `linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)`,
                        }}
                      >
                          <div className="absolute top-0 left-0 w-full h-4 opacity-30" style={{backgroundColor: theme.primaryColor}}></div>
                          <div className="flex items-start justify-center leading-none select-none" style={{ color: theme.primaryColor }}>
                             {oldPrice && (
                               <div className="pb-2 mr-4 text-gray-500 text-center">
                                 <span className="text-lg block leading-none font-semibold">DE</span>
                                 <span className="text-3xl font-bold line-through decoration-red-500">
                                   R${oldPrice}
                                 </span>
                               </div>
                             )}
                             <span className="font-bold mt-[0.2em] mr-2 opacity-80" style={{ fontSize: (isLandscape ? 2.5 : 2) * fontScale + 'rem' }}>R$</span>
                             <span className="font-display font-black tracking-tighter mx-1 drop-shadow-sm leading-[0.85]" style={{ fontSize: (isLandscape ? 9 : 7) * fontScale + 'rem' }}>
                               {priceInt}
                             </span>
                             <div className="flex flex-col items-start mt-[0.3em]">
                                <span className="font-black tracking-tighter leading-[0.8]" style={{ fontSize: (isLandscape ? 4.5 : 3.5) * fontScale + 'rem' }}>,{priceDec}</span>
                                <span className="font-bold text-gray-400 uppercase mt-2 ml-1 tracking-wider text-xl">{product.unit}</span>
                             </div>
                          </div>
                      </div>
                   </div>
                </div>
              ) : (
                // === GRID MODE (Multiple Products) ===
                <div 
                  className="w-full h-full overflow-hidden"
                  style={{ padding: isStory ? '1rem' : (isLandscape ? '1.5rem' : '2rem') }}
                >
                  {products.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center opacity-50 border-3 border-dashed border-gray-400 rounded-xl m-4 bg-gray-50/50">
                      <div className="p-6">
                        <p className="text-xl font-bold mb-2 text-gray-600">Seu carrinho está vazio</p>
                        <p className="text-sm text-gray-500">Adicione produtos no menu lateral</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="grid h-full"
                      style={{ 
                        gridTemplateColumns: `repeat(${theme.layoutCols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`,
                        gap: isStory ? '0.75rem' : '1rem'
                      }}
                    >
                      {products.map(p => (
                        <ProductCard key={p.id} product={p} theme={theme} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer 
              className="relative z-10 w-full flex-shrink-0 text-center bg-white"
              style={{ 
                backgroundColor: theme.primaryColor,
                padding: isStory ? '1.5rem 1rem' : '1rem 1.5rem'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-black/10"></div>
              <p className="text-white font-bold uppercase tracking-wider opacity-95"
                 style={{ fontSize: isStory ? '1.1rem' : '1rem' }}
              >
                {theme.footerText}
              </p>
            </footer>
         </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <Download size={20} />
          Baixar {theme.format.name}
        </button>
      </div>
    </div>
  );
};

export default PosterPreview;