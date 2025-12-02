import React, { useRef, useLayoutEffect, useImperativeHandle, forwardRef } from 'react';
import { PosterTheme, Product } from '../types';
import ProductCard from './ProductCard';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import PosterHeader from './PosterHeader';
import PriceDisplay from './PriceDisplay';
import { INITIAL_THEME } from '../state/initialState';
import SlideContent from './SlideContent';
import SingleProductShowcase from './SingleProductShowcase';
import PosterFooter from './PosterFooter';

export interface PosterPreviewRef {
  triggerDownload: () => Promise<void>;
}

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
  description: { x: 0, y: 0, scale: 1 },
};

const PosterPreview = forwardRef<PosterPreviewRef, PosterPreviewProps>(({ theme, products, onDownloadStart, onDownloadEnd }, ref) => {
  const posterRef = useRef<HTMLDivElement>(null);

  const currentHeaderElements = theme.headerElements[theme.format.id] || INITIAL_THEME.headerElements[theme.format.id];
  const currentLayoutCols = theme.layoutCols[theme.format.id] || 2;

  const isTvFormat = theme.format.id === 'tv';
  const isSingleProductShowcase = products.length === 1 && !isTvFormat;
  const product = products[0];

  const isLandscape = theme.format.width > theme.format.height;
  const isStory = theme.format.aspectRatio === '1080 / 1920';
  const fontScale = isStory ? 1.2 : (isLandscape ? 0.9 : 1);

  const handleDownload = async () => {
    if (posterRef.current) {
      onDownloadStart();
      try {
        const element = posterRef.current;
        const targetWidth = theme.format.width;
        const targetHeight = theme.format.height;
        const scale = targetWidth / element.offsetWidth;
        const sourceHeight = element.offsetWidth * (targetHeight / targetWidth);

        const dataUrl = await toPng(element, { 
          cacheBust: true, 
          quality: 1.0,
          pixelRatio: 1,
          width: targetWidth,
          height: targetHeight,
          style: {
             transform: `scale(${scale})`,
             transformOrigin: 'top left',
             width: `${element.offsetWidth}px`,
             height: `${sourceHeight}px`,
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

  useImperativeHandle(ref, () => ({
    triggerDownload: handleDownload,
  }));
  
  const renderFrame = () => {
    if (!theme.hasFrame) return null;
    
    const baseStyle: React.CSSProperties = {
      borderStyle: 'solid',
      borderWidth: `${theme.frameThickness}vmin`,
      borderColor: theme.frameColor,
      boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)',
      pointerEvents: 'none',
      position: 'absolute',
      inset: 0,
      zIndex: 20,
    };
    
    switch (theme.frameStyleId) {
      case 'dashed':
        return <div style={{ ...baseStyle, borderStyle: 'dashed' }} />;
      case 'rounded':
        return <div style={{ ...baseStyle, borderRadius: `${theme.frameThickness * 2}vmin` }} />;
      case 'star':
        // Implementação simples de borda decorativa (pode ser complexa com CSS puro)
        return (
          <div style={baseStyle}>
            <div className="absolute inset-0" style={{ 
              borderStyle: 'solid', 
              borderWidth: `${theme.frameThickness}vmin`, 
              borderColor: theme.frameColor,
              backgroundImage: `repeating-linear-gradient(45deg, ${theme.frameColor}, ${theme.frameColor} 10px, transparent 10px, transparent 20px)`,
              opacity: 0.5,
            }} />
            <div className="absolute inset-0" style={{ ...baseStyle, borderStyle: 'solid', borderWidth: `${theme.frameThickness / 4}vmin`, boxShadow: 'none' }} />
          </div>
        );
      case 'heart':
        // Usando uma borda dupla para efeito simples
        return (
          <div style={{ ...baseStyle, borderStyle: 'double', borderWidth: `${theme.frameThickness}vmin`, borderRadius: '1vmin' }} />
        );
      case 'solid':
      case 'none':
      default:
        return <div style={baseStyle} />;
    }
  };

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
              maxWidth: '90vw',
              maxHeight: '90vh',
              fontFamily: theme.fontFamilyBody,
            }}
          >
            {renderFrame()} {/* Renderiza a borda com base no estilo */}
            {theme.backgroundImage && (<div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${theme.backgroundImage})` }}/>)}
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: (isTvFormat || isSingleProductShowcase) ? `radial-gradient(circle at center, transparent 0%, ${theme.backgroundColor} 100%)` : 'none' }}/>
            <PosterHeader 
              theme={theme} 
              headerTitle={currentHeaderElements.headerTitle}
              headerSubtitle={currentHeaderElements.headerSubtitle}
              isLandscape={isLandscape} 
              fontScale={fontScale} 
              isStory={isStory} 
            />
            <div className="flex-1 w-full min-h-0 relative z-10 flex flex-col" style={{ padding: (isTvFormat || isSingleProductShowcase) ? 0 : (isStory ? '1rem' : (isLandscape ? '1.5rem' : '2rem')) }}>
              {isTvFormat && product ? (
                <div className="w-full flex-1 relative flex p-8">
                  <SlideContent 
                    product={product} 
                    theme={theme} 
                    fontScale={fontScale} 
                    isLandscape={isLandscape} 
                  />
                </div>
              ) : isSingleProductShowcase && product ? (
                <div className="w-full flex-1 relative flex">
                  <SingleProductShowcase product={product} theme={theme} />
                </div>
              ) : (
                products.length === 0 ? (<div className="flex-1 flex items-center justify-center text-center opacity-50 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50"><div className="p-6"><p className="text-lg font-bold mb-2 text-gray-600">Seu cartaz está vazio</p><p className="text-sm text-gray-500">Adicione produtos no menu lateral</p></div></div>) : (<div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${currentLayoutCols}, minmax(0, 1fr))`, gridAutoRows: 'minmax(0, 1fr)', gap: '1rem' }}>{products.map(p => (<ProductCard key={p.id} product={p} theme={theme} layoutCols={currentLayoutCols} isStory={isStory} />))}</div>)
              )}
            </div>
            <PosterFooter 
              theme={theme}
              footerTextElement={currentHeaderElements.footerText}
              isStory={isStory}
            />
         </div>
      </div>
    </div>
  );
});

export default PosterPreview;