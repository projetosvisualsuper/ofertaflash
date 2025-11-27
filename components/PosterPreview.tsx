import React, { useRef, useLayoutEffect } from 'react';
import { PosterTheme, Product } from '../types';
import ProductCard from './ProductCard';
import PriceDisplay from './PriceDisplay';
import PosterHeader from './PosterHeader';
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
  const footerRef = useRef<HTMLParagraphElement>(null);

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

  const isLandscape = theme.format.width > theme.format.height;
  const isStory = theme.format.aspectRatio === '1080 / 1920';
  const fontScale = isStory ? 1.2 : (isLandscape ? 0.9 : 1);
  const totalRows = Math.max(1, Math.ceil(products.length / theme.layoutCols));

  useLayoutEffect(() => {
    const footerElement = footerRef.current;
    if (footerElement && footerElement.parentElement) {
        footerElement.style.fontSize = isStory ? '1.1rem' : '1rem';
        footerElement.style.whiteSpace = 'nowrap';
        const parentElement = footerElement.parentElement;
        const parentStyle = window.getComputedStyle(parentElement);
        const parentPaddingX = parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight);
        const availableWidth = parentElement.clientWidth - parentPaddingX;
        const currentScrollWidth = footerElement.scrollWidth;
        if (currentScrollWidth > availableWidth) {
            const scaleFactor = availableWidth / currentScrollWidth;
            const currentFontSize = parseFloat(window.getComputedStyle(footerElement).fontSize);
            const newFontSize = Math.max(8, currentFontSize * scaleFactor * 0.98); 
            footerElement.style.fontSize = `${newFontSize}px`;
        }
    }
  }, [theme.footerText, theme.format, isStory]);

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
              maxHeight: '90vh',
              fontFamily: theme.fontFamilyBody,
            }}
          >
            {theme.hasFrame && (
              <div 
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  borderStyle: 'solid',
                  borderWidth: isStory ? '2.5vmin' : '1.5vmin',
                  borderColor: theme.secondaryColor,
                  boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)',
                }}
              />
            )}
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

            <PosterHeader theme={theme} isLandscape={isLandscape} fontScale={fontScale} />

            <div className="flex-1 w-full min-h-0 relative z-10 flex flex-col">
              {isHeroMode && product ? (
                <div className="w-full h-full relative">
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
                   <div 
                     className="absolute top-1/2 left-1/2 w-full text-center px-4 transition-transform duration-100"
                     style={{
                       transform: `translateX(calc(-50% + ${layout.name.x}px)) translateY(${layout.name.y}px) scale(${layout.name.scale})`
                     }}
                   >
                      <h2 
                        className="font-bold leading-tight uppercase tracking-tight line-clamp-2 drop-shadow-lg px-2 bg-white/80 backdrop-blur-sm rounded-lg inline-block shadow-sm" 
                        style={{ 
                          fontFamily: theme.fontFamilyDisplay,
                          color: theme.textColor,
                          fontSize: (isLandscape ? 2.5 : 2) * fontScale + 'rem',
                          padding: '0.25rem 1rem'
                        }}
                      >
                        {product.name}
                      </h2>
                   </div>
                   {product.description && (
                      <div
                          className="absolute top-1/2 left-1/2 w-4/5 text-center px-4 transition-transform duration-100"
                          style={{
                              transform: `translateX(calc(-50% + ${product.layout?.description?.x || 0}px)) translateY(calc(25% + ${product.layout?.description?.y || 0}px)) scale(${product.layout?.description?.scale || 1})`
                          }}
                      >
                          <p
                              className="leading-tight drop-shadow-sm line-clamp-3"
                              style={{
                                  color: theme.textColor,
                                  opacity: 0.8,
                                  fontSize: (isLandscape ? 1.2 : 1) * fontScale + 'rem',
                              }}
                          >
                              {product.description}
                          </p>
                      </div>
                   )}
                   <div 
                     className="absolute top-1/2 left-1/2 transition-transform duration-100"
                     style={{
                       transform: `translateX(calc(-50% + ${layout.price.x}px)) translateY(calc(75% + ${layout.price.y}px)) scale(${layout.price.scale})`
                     }}
                   >
                      <PriceDisplay
                        price={product.price}
                        oldPrice={product.oldPrice}
                        unit={product.unit}
                        theme={theme}
                        isCompact={false}
                        isHero={true}
                        fontScale={fontScale}
                        isLandscape={isLandscape}
                      />
                   </div>
                </div>
              ) : (
                <div 
                  className="flex-1"
                  style={{ 
                    padding: isStory ? '1rem' : (isLandscape ? '1.5rem' : '2rem'),
                  }}
                >
                  {products.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center opacity-50 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                        <div className="p-6">
                            <p className="text-lg font-bold mb-2 text-gray-600">Seu cartaz está vazio</p>
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
                        <ProductCard key={p.id} product={p} theme={theme} layoutCols={theme.layoutCols} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer 
              className="relative z-10 w-full flex-shrink-0 text-center"
              style={{ 
                backgroundColor: theme.primaryColor,
                padding: isStory ? '1.5rem 1rem' : '1rem 1.5rem'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-black/10"></div>
              <p 
                 ref={footerRef}
                 className="font-bold uppercase tracking-wider opacity-95"
                 style={{ 
                   color: theme.headerTextColor,
                   fontSize: isStory ? '1.1rem' : '1rem',
                   transform: `translateX(${theme.footerText.x}px) translateY(${theme.footerText.y}px) scale(${theme.footerText.scale})`
                 }}
              >
                {theme.footerText.text}
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