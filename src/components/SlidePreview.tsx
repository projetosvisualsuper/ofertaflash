import React from 'react';
import { PosterTheme, Product } from '../types';
import PriceDisplay from './PriceDisplay';
import PosterHeader from './PosterHeader';
import { POSTER_FORMATS } from '../state/initialState';
import { INITIAL_THEME } from '../state/initialState';

interface SlidePreviewProps {
  product: Product;
  theme: PosterTheme;
}

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const SlidePreview = React.forwardRef<HTMLDivElement, SlidePreviewProps>(({ product, theme }, ref) => {
  const tvFormat = POSTER_FORMATS.find(f => f.id === 'tv') || POSTER_FORMATS[0];
  const slideTheme = { ...theme, format: tvFormat };
  const layout = product.layouts?.['tv'] || defaultLayout;
  const isLandscape = true;
  const fontScale = 1;

  // Defensively get header elements for the 'tv' format
  const tvHeaderElements = (theme.headerElements && theme.headerElements['tv']) 
    ? theme.headerElements['tv'] 
    : INITIAL_THEME.headerElements['tv'];

  return (
    <div 
      ref={ref}
      className="relative flex flex-col bg-white overflow-hidden shadow-2xl w-full h-full"
      style={{
        backgroundColor: slideTheme.backgroundColor,
        color: slideTheme.textColor,
        aspectRatio: slideTheme.format.aspectRatio,
        fontFamily: slideTheme.fontFamilyBody,
      }}
    >
      {slideTheme.hasFrame && (<div className="absolute inset-0 z-20 pointer-events-none" style={{ borderStyle: 'solid', borderWidth: `${slideTheme.frameThickness}vmin`, borderColor: slideTheme.frameColor, boxShadow: 'inset 0 0 15px rgba(0,0,0,0.2)' }}/>)}
      {slideTheme.backgroundImage && (<div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: `url(${slideTheme.backgroundImage})` }}/>)}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: `radial-gradient(circle at center, transparent 0%, ${slideTheme.backgroundColor} 100%)` }}/>
      <PosterHeader 
        theme={slideTheme} 
        headerTitle={tvHeaderElements.headerTitle}
        headerSubtitle={tvHeaderElements.headerSubtitle}
        isLandscape={isLandscape} 
        fontScale={fontScale} 
        isStory={false} 
      />
      
      {/* Main Content Area with Transition */}
      <div className="flex-1 w-full min-h-0 relative z-10 flex p-8">
        <div 
          className="w-full flex-1 flex transition-all duration-700 ease-out animate-slide-in"
          // Adicionando keyframe animation para transição suave
          style={{ animation: 'slideIn 0.7s ease-out forwards' }}
        >
          <div className="w-1/2 h-full relative flex items-center justify-center">
            <div className="w-full h-full transition-transform duration-100 p-4" style={{ transform: `translateX(${layout.image.x}px) translateY(${layout.image.y}px) scale(${layout.image.scale})` }}>
              {product.image ? (<img src={product.image} alt={product.name} className="w-full h-full object-contain drop-shadow-2xl" style={{ filter: 'drop-shadow(0 25px 25px rgba(0,0,0,0.3))' }}/>) : (<div className="w-full h-full text-gray-300 opacity-50 border-4 border-dashed rounded-3xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>)}
            </div>
          </div>
          <div className="w-1/2 h-full relative flex flex-col items-center justify-center text-center p-4">
            <div className="w-full transition-transform duration-100 mb-4" style={{ transform: `translateX(${layout.name.x}px) translateY(${layout.name.y}px) scale(${layout.name.scale})` }}>
              <h2 className="font-bold leading-tight uppercase tracking-tight line-clamp-3 drop-shadow-lg px-2 bg-white/80 backdrop-blur-sm rounded-lg inline-block shadow-sm" style={{ fontFamily: slideTheme.fontFamilyDisplay, color: slideTheme.textColor, fontSize: 2 * fontScale + 'rem', padding: '0.25rem 1rem' }}>{product.name}</h2>
            </div>
            {product.description && (<div className="w-full px-4 transition-transform duration-100 mb-8" style={{ transform: `translateX(${layout.description?.x || 0}px) translateY(${layout.description?.y || 0}px) scale(${layout.description?.scale || 1})` }}><p className="leading-tight drop-shadow-sm line-clamp-3" style={{ color: slideTheme.textColor, opacity: 0.8, fontSize: 1 * fontScale + 'rem' }}>{product.description}</p></div>)}
            <div className="transition-transform duration-100 mt-8" style={{ transform: `translateX(${layout.price.x}px) translateY(${layout.price.y}px) scale(${layout.price.scale})` }}>
              <PriceDisplay price={product.price} oldPrice={product.oldPrice} unit={product.unit} theme={slideTheme} isCompact={false} isHero={true} fontScale={fontScale * 1.0} isLandscape={isLandscape}/>
            </div>
          </div>
        </div>
      </div>
      <footer className="relative z-10 w-full flex-shrink-0 text-center" style={{ backgroundColor: slideTheme.primaryColor, padding: '1rem 1.5rem' }}>
        <div className="absolute top-0 left-0 w-full h-1 bg-black/10"></div>
        <p className="font-bold uppercase tracking-wider opacity-95" style={{ color: slideTheme.headerTextColor, fontSize: '1rem', transform: `translateX(${tvHeaderElements.footerText.x}px) translateY(${tvHeaderElements.footerText.y}px) scale(${tvHeaderElements.footerText.scale})` }}>{tvHeaderElements.footerText.text}</p>
      </footer>
    </div>
  );
});

export default SlidePreview;