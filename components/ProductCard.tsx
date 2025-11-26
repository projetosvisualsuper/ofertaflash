import React from 'react';
import { Product, PosterTheme } from '../types';

interface ProductCardProps {
  product: Product;
  theme: PosterTheme;
}

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
};

const ProductCard: React.FC<ProductCardProps> = ({ product, theme }) => {
  
  const priceFormatted = parseFloat(product.price).toFixed(2);
  const [priceInt, priceDec] = priceFormatted.split('.');
  const oldPriceFormatted = product.oldPrice ? parseFloat(product.oldPrice).toFixed(2).replace('.', ',') : null;

  const layout = product.layout || defaultLayout;

  return (
    <div 
      className="relative p-3 rounded-xl shadow-sm border overflow-hidden h-full bg-white/95 backdrop-blur-sm"
      style={{ 
        borderColor: theme.secondaryColor,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Product Image */}
      <div 
        className="absolute top-0 left-0 right-0 h-[60%] flex items-center justify-center p-2 transition-transform duration-100"
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
          {product.oldPrice && (
             <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-bl-lg shadow-sm z-10">
               -{Math.round(((parseFloat(product.oldPrice) - parseFloat(product.price)) / parseFloat(product.oldPrice)) * 100)}%
             </div>
          )}
        </div>
      </div>

      {/* Product Name */}
      <div 
        className="absolute bottom-[30%] left-0 right-0 text-center px-2 transition-transform duration-100"
        style={{ transform: `translateX(${layout.name.x}px) translateY(${layout.name.y}px) scale(${layout.name.scale})` }}
      >
        <h3 className="font-bold leading-tight text-gray-800 line-clamp-2" style={{ color: theme.textColor, fontSize: '1rem' }}>
          {product.name}
        </h3>
      </div>
      
      {/* Price Block */}
      <div 
        className="absolute bottom-[5%] left-0 right-0 flex justify-center transition-transform duration-100"
        style={{ transform: `translateX(${layout.price.x}px) translateY(${layout.price.y}px) scale(${layout.price.scale})` }}
      >
        <div className="flex items-end justify-center gap-2">
          {/* Old Price (Left) */}
          {oldPriceFormatted && (
            <div className="pb-1 text-gray-500 text-center">
              <span className="text-xs block leading-none font-semibold">DE</span>
              <span className="text-lg font-bold line-through decoration-red-500">
                R${oldPriceFormatted}
              </span>
            </div>
          )}

          {/* New Price (Right) */}
          <div 
            className="relative rounded-xl shadow-lg border-2 border-gray-100 flex flex-col items-center justify-center overflow-hidden py-0.5 px-1"
            style={{ background: `linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)` }}
          >
            <div className="flex items-start justify-center leading-none select-none" style={{ color: theme.primaryColor }}>
               <span className="font-bold mt-[0.2em] mr-1 opacity-80 text-base">R$</span>
               <span className="font-display font-black tracking-tighter mx-0 drop-shadow-sm leading-[0.85]" style={{ fontSize: '2.5rem' }}>
                 {priceInt}
               </span>
               <div className="flex flex-col items-start mt-[0.3em]">
                  <span className="font-black tracking-tighter leading-[0.8]" style={{ fontSize: '1.25rem' }}>,{priceDec}</span>
                  <span className="font-bold text-gray-400 uppercase mt-1 ml-0.5 tracking-wider text-xs">{product.unit}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;