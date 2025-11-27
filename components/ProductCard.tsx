import React, { useRef, useLayoutEffect } from 'react';
import { Product, PosterTheme } from '../types';
import PriceDisplay from './PriceDisplay';

interface ProductCardProps {
  product: Product;
  theme: PosterTheme;
  layoutCols: number;
  isStory?: boolean;
}

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const ProductCard: React.FC<ProductCardProps> = ({ product, theme, layoutCols, isStory }) => {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const priceContainerRef = useRef<HTMLDivElement>(null);

  const layout = product.layout || defaultLayout;
  const isCompact = layoutCols >= 3;

  const baseNameSize = isCompact ? 0.8 : 1; // in rem

  useLayoutEffect(() => {
    const nameEl = nameRef.current;
    const priceEl = priceContainerRef.current;

    // Auto-fit product name
    if (nameEl) {
      nameEl.style.fontSize = `${baseNameSize}rem`;
      let currentFontSize = baseNameSize;
      // Reduce font size until it fits within the clamped height
      while (nameEl.scrollHeight > nameEl.clientHeight && currentFontSize > 0.5) {
        currentFontSize -= 0.05;
        nameEl.style.fontSize = `${currentFontSize}rem`;
      }
    }

    // Auto-fit price block by scaling
    if (priceEl && priceEl.parentElement) {
      priceEl.style.transform = 'scale(1)';
      const parentWidth = priceEl.parentElement.clientWidth;
      const selfWidth = priceEl.scrollWidth;
      // Scale down if overflowing, with a small buffer
      if (selfWidth > parentWidth) {
        const scale = (parentWidth / selfWidth) * 0.95; // 5% buffer
        priceEl.style.transform = `scale(${scale})`;
      }
    }
  }, [product.name, product.price, product.oldPrice, layoutCols, baseNameSize, theme.priceCardStyle, isStory]);

  return (
    <div 
      className="relative rounded-xl shadow-sm border overflow-hidden h-full bg-white/95 backdrop-blur-sm flex flex-col"
      style={{ 
        borderColor: theme.secondaryColor,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Discount Tag - Now independent of the image */}
      {product.oldPrice && (
         <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-bl-lg shadow-sm z-10">
           -{Math.round(((parseFloat(product.oldPrice) - parseFloat(product.price)) / parseFloat(product.oldPrice)) * 100)}%
         </div>
      )}

      {/* Image Container */}
      <div className="relative flex-1 w-full min-h-0">
        <div 
          className="absolute inset-0 flex items-center justify-center p-2 transition-transform duration-100"
          style={{ transform: `translateX(${layout.image.x}px) translateY(${layout.image.y}px) scale(${layout.image.scale})` }}
        >
          <div className="w-full h-full bg-white rounded-lg overflow-hidden relative">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                 <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 20 0 0-2.828 0L6 21"/></svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Text Content Container */}
      <div className="flex-shrink-0 w-full flex flex-col justify-between p-3" style={{ height: isStory ? '42%' : '45%' }}>
        {/* Top part: Title & Description */}
        <div className="text-center">
          {/* Name Container */}
          <div
            className="w-full"
            style={{ transform: `translateX(${layout.name.x}px) translateY(${layout.name.y}px) scale(${layout.name.scale})` }}
          >
            <h3 ref={nameRef} className="font-bold leading-tight text-gray-800 line-clamp-2" style={{ color: theme.textColor, fontSize: `${baseNameSize}rem` }}>
              {product.name}
            </h3>
          </div>
          
          {/* Description Container */}
          {product.description && (
            <div
              className="w-full"
              style={{ transform: `translateX(${layout.description?.x || 0}px) translateY(${layout.description?.y || 0}px) scale(${layout.description?.scale || 1})` }}
            >
              <p className="text-xs text-gray-600 mt-2 line-clamp-2" style={{ color: theme.textColor, opacity: 0.8 }}>
                {product.description}
              </p>
            </div>
          )}
        </div>
        
        {/* Bottom part: Price Block */}
        <div 
          className="w-full flex items-start justify-center"
          style={{ transform: `translateX(${layout.price.x}px) translateY(${layout.price.y}px) scale(${layout.price.scale})` }}
        >
          <div ref={priceContainerRef} className="flex items-end justify-center gap-1 origin-center">
            <PriceDisplay
              price={product.price}
              oldPrice={product.oldPrice}
              unit={product.unit}
              theme={theme}
              isCompact={isCompact}
              isHero={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;