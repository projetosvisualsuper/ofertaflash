import React from 'react';
import { Product, PosterTheme, ProductLayout } from '../../types';
import PriceDisplay from './PriceDisplay';

interface SingleProductShowcaseProps {
  product: Product;
  theme: PosterTheme;
}

const defaultLayout: ProductLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const SingleProductShowcase: React.FC<SingleProductShowcaseProps> = ({ product, theme }) => {
  const isLandscape = theme.format.width > theme.format.height;
  const fontScale = isLandscape ? 0.8 : 1;
  const layout = product.layouts?.[theme.format.id] || defaultLayout;

  return (
    <div className="flex flex-col h-full w-full items-center p-4 md:p-8">
      {/* Image Section - Takes up available space */}
      <div
        className="relative w-full flex-1 min-h-0 flex items-center justify-center"
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.25))',
              transform: `translateX(${layout.image.x}px) translateY(${layout.image.y}px) scale(${layout.image.scale})`
            }}
          />
        ) : (
          <div className="w-full h-full text-gray-300 opacity-50 border-4 border-dashed rounded-3xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
        )}
      </div>

      {/* Text & Price Section - Sits at the bottom */}
      <div className="relative flex-shrink-0 flex flex-col items-center text-center w-full pt-2">
        <div style={{ transform: `translateX(${layout.name.x}px) translateY(${layout.name.y}px) scale(${layout.name.scale})` }}>
          <h2
            className="font-bold leading-tight tracking-tight line-clamp-3"
            style={{
              fontFamily: theme.fontFamilyDisplay,
              color: theme.textColor,
              fontSize: 3 * fontScale + 'rem',
            }}
          >
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              padding: '0.1em 0.4em',
              borderRadius: '0.25rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}>
              {product.name}
            </span>
          </h2>
        </div>

        {product.description && (
          <div
            className="mt-1"
            style={{ transform: `translateX(${layout.description?.x || 0}px) translateY(${layout.description?.y || 0}px) scale(${layout.description?.scale || 1})` }}
          >
            <p
              className="leading-tight drop-shadow-sm line-clamp-3 max-w-prose"
              style={{ color: theme.textColor, opacity: 0.8, fontSize: 1.2 * fontScale + 'rem' }}
            >
              {product.description}
            </p>
          </div>
        )}

        <div
          className="mt-4"
          style={{ transform: `translateX(${layout.price.x}px) translateY(${layout.price.y}px) scale(${layout.price.scale})` }}
        >
          <PriceDisplay
            price={product.price}
            oldPrice={product.oldPrice}
            unit={product.unit}
            theme={theme}
            isCompact={false}
            isHero={true}
            fontScale={fontScale * 1.2}
            isLandscape={isLandscape}
          />
        </div>
      </div>
    </div>
  );
};

export default SingleProductShowcase;