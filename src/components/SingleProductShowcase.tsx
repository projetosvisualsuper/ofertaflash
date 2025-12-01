import React from 'react';
import { Product, PosterTheme } from '../types';
import PriceDisplay from './PriceDisplay';

interface SingleProductShowcaseProps {
  product: Product;
  theme: PosterTheme;
}

const SingleProductShowcase: React.FC<SingleProductShowcaseProps> = ({ product, theme }) => {
  const isLandscape = theme.format.width > theme.format.height;
  const fontScale = isLandscape ? 0.8 : 1;

  return (
    <div className="flex flex-col h-full w-full items-center justify-around p-4">
      {/* Image Section */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0 max-h-[55%]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.25))' }}
          />
        ) : (
          <div className="w-full h-full text-gray-300 opacity-50 border-4 border-dashed rounded-3xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
        )}
      </div>

      {/* Text Section */}
      <div className="flex-shrink-0 flex flex-col items-center text-center mt-4 md:mt-8">
        <h2
          className="font-bold leading-tight tracking-tight line-clamp-3"
          style={{
            fontFamily: theme.fontFamilyDisplay,
            color: theme.textColor,
            fontSize: 3 * fontScale + 'rem',
          }}
        >
          {product.name}
        </h2>

        {product.description && (
          <p
            className="leading-tight drop-shadow-sm line-clamp-3 max-w-prose mt-2"
            style={{ color: theme.textColor, opacity: 0.8, fontSize: 1.2 * fontScale + 'rem' }}
          >
            {product.description}
          </p>
        )}

        <div className="mt-4 md:mt-8">
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