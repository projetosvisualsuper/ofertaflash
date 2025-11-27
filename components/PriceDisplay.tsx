import React from 'react';
import { PosterTheme } from '../types';

interface PriceDisplayProps {
  price: string;
  oldPrice?: string | null;
  unit: string;
  theme: PosterTheme;
  isCompact: boolean;
  isHero: boolean;
  fontScale?: number;
  isLandscape?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, oldPrice, unit, theme, isCompact, isHero, fontScale, isLandscape }) => {
  const priceFormatted = parseFloat(price).toFixed(2);
  const [priceInt, priceDec] = priceFormatted.split('.');
  const oldPriceFormatted = oldPrice ? parseFloat(oldPrice).toFixed(2).replace('.', ',') : null;

  const scale = fontScale || 1;
  const landscape = isLandscape || false;

  // Dynamic styles based on context
  const oldPriceStyle = { fontSize: isHero ? '1.875rem' : (isCompact ? '0.9rem' : '1.125rem') };
  const rsStyle = { fontSize: isHero ? (landscape ? 2.5 : 2) * scale + 'rem' : (isCompact ? '0.8rem' : '1rem') };
  const priceIntStyle = { fontSize: isHero ? (landscape ? 9 : 7) * scale + 'rem' : (isCompact ? '2rem' : '2.5rem') };
  const priceDecStyle = { fontSize: isHero ? (landscape ? 4.5 : 3.5) * scale + 'rem' : (isCompact ? '1rem' : '1.25rem') };
  const unitStyle = { fontSize: isHero ? '1.25rem' : (isCompact ? '0.65rem' : '0.75rem') };

  const priceContent = (
    <div className="flex items-start justify-center leading-none select-none" style={{ color: theme.priceCardTextColor || theme.primaryColor }}>
      {oldPriceFormatted && (
        <div className={`pb-1 text-gray-500 text-center ${isHero ? 'mr-4' : 'mr-1'}`}>
          <span className={`block leading-none font-semibold ${isHero ? 'text-lg' : 'text-xs'}`}>DE</span>
          <span className="font-bold line-through decoration-red-500 whitespace-nowrap" style={oldPriceStyle}>
            R${oldPriceFormatted}
          </span>
        </div>
      )}
      <span className="font-bold mt-[0.2em] mr-1 opacity-80" style={rsStyle}>R$</span>
      <span className="font-display font-black tracking-tighter mx-0 drop-shadow-sm leading-[0.85]" style={priceIntStyle}>
        {priceInt}
      </span>
      <div className="flex flex-col items-start mt-[0.3em] ml-2">
        <span className="font-black tracking-tighter leading-[0.8]" style={priceDecStyle}>,{priceDec}</span>
        <span className="font-bold text-gray-400 uppercase mt-1 tracking-wider" style={unitStyle}>{unit}</span>
      </div>
    </div>
  );

  const basePadding = isHero ? 'py-4 px-8' : 'py-1 px-2';

  switch (theme.priceCardStyle) {
    case 'pill':
      return (
        <div 
          className={`relative rounded-3xl shadow-lg border-2 border-gray-100 flex flex-col items-center justify-center overflow-hidden ${basePadding}`}
          style={{ 
            backgroundColor: theme.priceCardBackgroundColor,
          }}
        >
          {priceContent}
        </div>
      );
    case 'minimal':
      return <div className={basePadding}>{priceContent}</div>;
    case 'default':
    default:
      return (
        <div 
          className={`relative rounded-xl shadow-lg border-2 border-gray-100 flex flex-col items-center justify-center overflow-hidden ${basePadding}`}
          style={{ 
            background: `linear-gradient(135deg, ${theme.priceCardBackgroundColor} 0%, ${theme.priceCardBackgroundColor}E6 100%)`,
          }}
        >
          {priceContent}
        </div>
      );
  }
};

export default PriceDisplay;