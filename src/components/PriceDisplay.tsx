import React from 'react';
import { PosterTheme } from '../types';

interface PriceDisplayProps {
  price: string;
  oldPrice?: string | null;
  unit: string;
  wholesalePrice?: string | null; // NOVO
  wholesaleUnit?: string | null; // NOVO
  theme: PosterTheme;
  isCompact: boolean;
  isHero: boolean;
  fontScale?: number;
  isLandscape?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, oldPrice, unit, wholesalePrice, wholesaleUnit, theme, isCompact, isHero, fontScale, isLandscape }) => {
  const priceFormatted = parseFloat(price).toFixed(2);
  const [priceInt, priceDec] = priceFormatted.split('.');
  const oldPriceFormatted = oldPrice ? parseFloat(oldPrice).toFixed(2).replace('.', ',') : null;
  
  const hasWholesale = !!wholesalePrice && !!wholesaleUnit;
  const wholesalePriceFormatted = hasWholesale ? parseFloat(wholesalePrice!).toFixed(2).replace('.', ',') : null;

  const scale = fontScale || 1;
  const landscape = isLandscape || false;

  // Dynamic styles based on context
  const oldPriceStyle = { fontSize: isHero ? '1.5rem' : (isCompact ? '0.9rem' : '1.125rem') };
  const rsStyle = { fontSize: isHero ? (landscape ? 2 : 2) * scale + 'rem' : (isCompact ? '0.8rem' : '1rem') };
  const priceIntStyle = { fontSize: isHero ? (landscape ? 6 : 7) * scale + 'rem' : (isCompact ? '2rem' : '2.5rem') };
  const priceDecStyle = { fontSize: isHero ? (landscape ? 3 : 3.5) * scale + 'rem' : (isCompact ? '1rem' : '1.25rem') };
  const unitStyle = { fontSize: isHero ? '1.25rem' : (isCompact ? '0.65rem' : '0.75rem') };
  
  // Estilos para Atacado: Usando a cor secundária como fundo e a cor do texto principal para contraste.
  const wholesaleTextStyle = { 
    fontSize: isHero ? 1.5 * scale + 'rem' : (isCompact ? '0.7rem' : '0.9rem'),
    color: theme.textColor, // Usando a cor do texto principal para garantir contraste com o fundo secundário
    fontWeight: 500,
  };

  const priceContent = (
    <div className="flex flex-col items-center justify-center leading-none select-none">
      
      {/* Preço de Varejo Principal */}
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
        
        {/* Centavos e Unidade */}
        <div className={`flex flex-col items-start ml-2 ${isHero ? 'mt-[0.5em] relative' : 'mt-[0.3em]'}`}>
          <span className="font-black tracking-tighter leading-[0.8]" style={priceDecStyle}>,{priceDec}</span>
          {isHero ? (
            <span 
              className="font-bold text-gray-400 uppercase tracking-wider absolute" 
              style={{ 
                ...unitStyle, 
                color: theme.textColor, 
                opacity: 0.8,
                // Usando as propriedades do tema para ajuste fino
                bottom: `${theme.unitBottomEm}em`, 
                right: `${theme.unitRightEm}em` 
              }}
            >
              {unit}
            </span>
          ) : (
            <span className={`font-bold text-gray-400 uppercase tracking-wider mt-1`} style={unitStyle}>{unit}</span>
          )}
        </div>
      </div>
      
      {/* Preço de Atacado (NOVO) - Com Destaque */}
      {hasWholesale && wholesalePriceFormatted && (
        <div 
          className={`mt-1 ${isHero ? 'mt-4' : 'mt-1'} w-full`}
          style={{ 
            backgroundColor: theme.secondaryColor, 
            padding: isHero ? '0.5rem 1rem' : '0.25rem 0.5rem',
            borderRadius: isHero ? '0.5rem' : '0.25rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <span className="font-bold tracking-wider" style={wholesaleTextStyle}>
            ATACADO: R$ {wholesalePriceFormatted} / {wholesaleUnit}
          </span>
        </div>
      )}
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