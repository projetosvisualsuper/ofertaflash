import React from 'react';
import { PosterTheme, Product } from '../types';
import PosterHeader from './PosterHeader';
import { POSTER_FORMATS } from '../state/initialState';
import { INITIAL_THEME } from '../state/initialState';
import SlideContent from './SlideContent';
import { SLIDE_TRANSITION_PRESETS } from '../config/slideTransitions';

interface SlidePreviewProps {
  product: Product;
  theme: PosterTheme;
}

const SlidePreview = React.forwardRef<HTMLDivElement, SlidePreviewProps>(({ product, theme }, ref) => {
  const tvFormat = POSTER_FORMATS.find(f => f.id === 'tv') || POSTER_FORMATS[0];
  const slideTheme = { ...theme, format: tvFormat };
  const isLandscape = true;
  const fontScale = 1;

  // Defensively get header elements for the 'tv' format
  const tvHeaderElements = (theme.headerElements && theme.headerElements['tv']) 
    ? theme.headerElements['tv'] 
    : INITIAL_THEME.headerElements['tv'];
    
  // Encontrar a classe de transição
  const transitionPreset = SLIDE_TRANSITION_PRESETS.find(p => p.id === theme.slideTransitionId);
  const transitionClass = transitionPreset ? transitionPreset.className : 'animate-slide-in';
  
  // Se for uma transição escalonada, aplicamos a classe de ativação ao contêiner principal.
  const isStaggered = theme.slideTransitionId === 'stagger-fade';
  const containerClass = isStaggered ? transitionClass : '';
  
  // Se NÃO for escalonada, a classe de animação vai para o SlideContent.
  const contentClass = isStaggered ? '' : transitionClass;


  return (
    <div 
      ref={ref}
      className={`relative flex flex-col bg-white overflow-hidden shadow-2xl w-full h-full ${containerClass}`}
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
      
      {/* Main Content Area */}
      <div className="flex-1 w-full min-h-0 relative z-10 flex p-8">
        <div 
          // Aplicando a classe de transição aqui, se não for escalonada
          className={`w-full flex-1 flex transition-all duration-700 ease-out ${contentClass}`}
          key={product.id} // Mantendo a chave para forçar a re-renderização e a animação
        >
          <SlideContent 
            product={product} 
            theme={slideTheme} 
            fontScale={fontScale} 
            isLandscape={isLandscape} 
            isStaggered={isStaggered} // Passando a flag para o filho
          />
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