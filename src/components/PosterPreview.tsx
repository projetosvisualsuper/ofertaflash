import React, { useRef, useLayoutEffect, useImperativeHandle, forwardRef } from 'react';
import { PosterTheme, Product } from '../types';
import ProductCard from './ProductCard';
import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import PosterHeader from './PosterHeader';
import PriceDisplay from './PriceDisplay';
import { INITIAL_THEME } from '../state/initialState';

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
  const footerRef = useRef<HTMLParagraphElement>(null);

  const currentHeaderElements = theme.headerElements[theme.format.id] || INITIAL_THEME.headerElements[theme.format.id];
  const currentLayoutCols = theme.layoutCols[theme.format.id] || 2;

  // Lógica atualizada: Modo Herói/Slide é ativado se for formato 'tv' OU se houver apenas 1 produto.
  const isHeroMode = theme.format.id === 'tv' || products.length === 1;
  const product = products[0];
  const layout = product?.layouts?.[theme.format.id] || defaultLayout;

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
  }, [currentHeaderElements.footerText, theme.format, isStory]);

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
            {theme.hasFrame && (<div className="absolute inset-0 z-20 pointer-events-none" style={{ borderStyle: 'solid', borderWidth: `${theme.frameThickness}vmin`, borderColor: theme.frameColor, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)' }}/>)}
            {theme.backgroundImage && (<div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${theme.backgroundImage})` }}/>)}
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: isHeroMode ? `radial-gradient(circle at center, transparent 0%, ${theme.backgroundColor} 100%)` : 'none' }}/>
            <PosterHeader 
              theme={theme} 
              headerTitle={currentHeaderElements.headerTitle}
              headerSubtitle={currentHeaderElements.headerSubtitle}
              isLandscape={isLandscape} 
              fontScale={fontScale} 
              isStory={isStory} 
            />
            <div className="flex-1 w-full min-h-0 relative z-10 flex flex-col" style={{ padding: isHeroMode ? 0 : (isStory ? '1rem' : (isLandscape ? '1.5rem' : '2rem')) }}>
              {isHeroMode && product ? (
                // Novo layout de duas colunas para o modo Hero/Slide
                <div className="w-full flex-1 relative flex p-8">
                  <div className="w-1/2 h-full relative flex items-center justify-center">
                    <div className="w-full h-full transition-transform duration-100 p-4" style={{ transform: `translateX(${layout.image.x}px) translateY(${layout.image.y}px) scale(${layout.image.scale})` }}>
                      {product.image ? (<img src={product.image} alt={product.name} className="w-full h-full object-contain drop-shadow-2xl" style={{ filter: 'drop-shadow(0 25px 25px rgba(0,0,0,0.3))' }}/>) : (<div className="w-full h-full text-gray-300 opacity-50 border-4 border-dashed rounded-3xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>)}
                    </div>
                  </div>
                  <div className="w-1/2 h-full relative flex flex-col items-center justify-center text-center p-4">
                    <div className="w-full transition-transform duration-100 mb-4" style={{ transform: `translateX(${layout.name.x}px) translateY(${layout.name.y}px) scale(${layout.name.scale})` }}>
                      <h2 className="font-bold leading-tight uppercase tracking-tight line-clamp-3 drop-shadow-lg px-2 bg-white/80 backdrop-blur-sm rounded-lg inline-block shadow-sm" style={{ fontFamily: theme.fontFamilyDisplay, color: theme.textColor, fontSize: 2 * fontScale + 'rem', padding: '0.25rem 1rem' }}>{product.name}</h2>
                    </div>
                    {product.description && (<div className="w-full px-4 transition-transform duration-100 mb-8" style={{ transform: `translateX(${layout.description?.x || 0}px) translateY(${layout.description?.y || 0}px) scale(${layout.description?.scale || 1})` }}><p className="leading-tight drop-shadow-sm line-clamp-3" style={{ color: theme.textColor, opacity: 0.8, fontSize: 1 * fontScale + 'rem' }}>{product.description}</p></div>)}
                    <div className="transition-transform duration-100 mt-8" style={{ transform: `translateX(${layout.price.x}px) translateY(${layout.price.y}px) scale(${layout.price.scale})` }}>
                      <PriceDisplay price={product.price} oldPrice={product.oldPrice} unit={product.unit} theme={theme} isCompact={false} isHero={true} fontScale={fontScale * 1.0} isLandscape={isLandscape}/>
                    </div>
                  </div>
                </div>
              ) : (
                products.length === 0 ? (<div className="flex-1 flex items-center justify-center text-center opacity-50 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50"><div className="p-6"><p className="text-lg font-bold mb-2 text-gray-600">Seu cartaz está vazio</p><p className="text-sm text-gray-500">Adicione produtos no menu lateral</p></div></div>) : (<div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${currentLayoutCols}, minmax(0, 1fr))`, gridAutoRows: 'minmax(0, 1fr)', gap: '1rem' }}>{products.map(p => (<ProductCard key={p.id} product={p} theme={theme} layoutCols={currentLayoutCols} isStory={isStory} />))}</div>)
              )}
            </div>
            <footer className="relative z-10 w-full flex-shrink-0 text-center" style={{ backgroundColor: theme.primaryColor, padding: isStory ? '1rem' : '1rem 1.5rem' }}>
              <div className="absolute top-0 left-0 w-full h-1 bg-black/10"></div>
              <p ref={footerRef} className="font-bold uppercase tracking-wider opacity-95" style={{ color: theme.headerTextColor, fontSize: isStory ? '1.1rem' : '1rem', transform: `translateX(${currentHeaderElements.footerText.x}px) translateY(${currentHeaderElements.footerText.y}px) scale(${currentHeaderElements.footerText.scale})` }}>{currentHeaderElements.footerText.text}</p>
            </footer>
         </div>
      </div>
    </div>
  );
});

export default PosterPreview;