import React from 'react';
import { PosterTheme, Product } from '../../types';
import PriceDisplay from './PriceDisplay';
import { INITIAL_THEME } from '../state/initialState';

interface SlideContentProps {
  product: Product;
  theme: PosterTheme;
  fontScale: number;
  isLandscape: boolean;
  isStaggered?: boolean; // Nova prop
}

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const SlideContent: React.FC<SlideContentProps> = ({ product, theme, fontScale, isLandscape, isStaggered = false }) => {
  const layout = product.layouts?.[theme.format.id] || defaultLayout;

  // Função auxiliar para aplicar classes de escalonamento
  const getStaggerClass = (delay: number) => 
    isStaggered ? `stagger-item stagger-delay-${delay}` : '';

  // Estilo de transformação para o wrapper interno
  const getTransformStyle = (elementLayout: typeof defaultLayout.image) => ({
    transform: `translateX(${elementLayout.x}px) translateY(${elementLayout.y}px) scale(${elementLayout.scale})`,
    transition: 'transform 0.3s ease-out', // Adiciona transição suave para o ajuste de layout
  });

  return (
    <div 
      className="w-full flex-1 flex"
    >
      {/* Coluna da Imagem */}
      <div className="w-1/2 h-full relative flex items-center justify-center">
        <div 
          className={`w-full h-full p-4 ${getStaggerClass(1)}`} 
        >
          <div 
            className="w-full h-full transition-transform duration-100"
            style={getTransformStyle(layout.image)}
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
        </div>
      </div>
      
      {/* Coluna dos Detalhes */}
      <div className="w-1/2 h-full relative flex flex-col items-center justify-center text-center p-4">
        
        {/* Nome do Produto */}
        <div 
          className={`w-full mb-4 ${getStaggerClass(2)}`} 
        >
          <div 
            className="transition-transform duration-100"
            style={getTransformStyle(layout.name)}
          >
            <h2 
              className="font-bold leading-tight tracking-tight line-clamp-3 px-2 inline-block" 
              style={{ 
                fontFamily: theme.fontFamilyDisplay, 
                color: theme.textColor, 
                fontSize: 2 * fontScale + 'rem', 
                padding: '0', 
                textShadow: 'none', 
                textTransform: 'none', 
              }}
            >
              <span 
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  boxDecorationBreak: 'clone',
                  WebkitBoxDecorationBreak: 'clone',
                  padding: '0.1em 0.4em',
                  borderRadius: '0.25rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                }}
              >
                {product.name}
              </span>
            </h2>
          </div>
        </div>
        
        {/* Descrição */}
        {product.description && (
          <div 
            className={`w-full px-4 mb-8 ${getStaggerClass(3)}`} 
          >
            <div 
              className="transition-transform duration-100"
              style={getTransformStyle(layout.description)}
            >
              <p className="leading-tight drop-shadow-sm line-clamp-3" style={{ color: theme.textColor, opacity: 0.8, fontSize: 1 * fontScale + 'rem' }}>
                {product.description}
              </p>
            </div>
          </div>
        )}
        
        {/* Preço */}
        <div 
          className={`mt-8 ${getStaggerClass(4)}`} 
        >
          <div 
            className="transition-transform duration-100"
            style={getTransformStyle(layout.price)}
          >
            <PriceDisplay 
              price={product.price} 
              oldPrice={product.oldPrice} 
              unit={product.unit} 
              wholesalePrice={product.wholesalePrice}
              wholesaleUnit={product.wholesaleUnit}
              theme={theme} 
              isCompact={false} 
              isHero={true} 
              fontScale={fontScale * 1.0} 
              isLandscape={isLandscape}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideContent;