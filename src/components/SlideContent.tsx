import React from 'react';
import { PosterTheme, Product } from '../types';
import PriceDisplay from './PriceDisplay';
import { INITIAL_THEME } from '../state/initialState';

interface SlideContentProps {
  product: Product;
  theme: PosterTheme;
  fontScale: number;
  isLandscape: boolean;
}

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const SlideContent: React.FC<SlideContentProps> = ({ product, theme, fontScale, isLandscape }) => {
  const layout = product.layouts?.[theme.format.id] || defaultLayout;

  // Estilos específicos para o modo TV/Slide (replicando o visual da imagem 1)
  const slideThemeOverride: PosterTheme = {
    ...theme,
    // Força o estilo do preço para o visual de alto contraste (preto/amarelo)
    priceCardStyle: 'default',
    priceCardBackgroundColor: '#000000',
    priceCardTextColor: '#facc15', // Amarelo forte
    textColor: '#1a1a1a', // Texto do corpo
  };

  return (
    <div 
      className="w-full flex-1 flex"
    >
      {/* Coluna da Imagem */}
      <div className="w-1/2 h-full relative flex items-center justify-center">
        <div className="w-full h-full transition-transform duration-100 p-4" style={{ transform: `translateX(${layout.image.x}px) translateY(${layout.image.y}px) scale(${layout.image.scale})` }}>
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
      </div>
      
      {/* Coluna dos Detalhes */}
      <div className="w-1/2 h-full relative flex flex-col items-center justify-center text-center p-4">
        
        {/* Nome do Produto */}
        <div className="w-full transition-transform duration-100 mb-4" style={{ transform: `translateX(${layout.name.x}px) translateY(${layout.name.y}px) scale(${layout.name.scale})` }}>
          <h2 
            className="font-bold leading-tight uppercase tracking-tight line-clamp-3 drop-shadow-lg px-2 bg-white/80 backdrop-blur-sm rounded-lg inline-block shadow-sm" 
            style={{ 
              fontFamily: slideThemeOverride.fontFamilyDisplay, 
              color: slideThemeOverride.textColor, 
              fontSize: 2 * fontScale + 'rem', 
              padding: '0.25rem 1rem',
              // Estilo de contorno de texto (simulado com text-shadow)
              textShadow: '2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000',
              color: '#ffffff', // Cor do texto branco
            }}
          >
            {product.name}
          </h2>
        </div>
        
        {/* Descrição */}
        {product.description && (
          <div className="w-full px-4 transition-transform duration-100 mb-8" style={{ transform: `translateX(${layout.description?.x || 0}px) translateY(${layout.description?.y || 0}px) scale(${layout.description?.scale || 1})` }}>
            <p className="leading-tight drop-shadow-sm line-clamp-3" style={{ color: slideThemeOverride.textColor, opacity: 0.8, fontSize: 1 * fontScale + 'rem' }}>
              {product.description}
            </p>
          </div>
        )}
        
        {/* Preço */}
        <div className="transition-transform duration-100 mt-8" style={{ transform: `translateX(${layout.price.x}px) translateY(${layout.price.y}px) scale(${layout.price.scale})` }}>
          <PriceDisplay 
            price={product.price} 
            oldPrice={product.oldPrice} 
            unit={product.unit} 
            theme={slideThemeOverride} // Usando o tema com override
            isCompact={false} 
            isHero={true} 
            fontScale={fontScale * 1.0} 
            isLandscape={isLandscape}
          />
        </div>
      </div>
    </div>
  );
};

export default SlideContent;