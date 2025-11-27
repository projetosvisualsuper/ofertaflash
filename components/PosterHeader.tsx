import React from 'react';
import { PosterTheme } from '../types';

interface PosterHeaderProps {
  theme: PosterTheme;
  isLandscape: boolean;
  fontScale: number;
  isStory: boolean;
}

const PosterHeader: React.FC<PosterHeaderProps> = ({ theme, isLandscape, fontScale, isStory }) => {
  const effectiveHeaderLayout = (theme.logo || theme.headerLayoutId === 'text-only') 
    ? theme.headerLayoutId 
    : 'text-only';

  const isHeroImageMode = theme.headerImage && theme.headerImageMode === 'hero';
  const isBackgroundMode = theme.headerImage && theme.headerImageMode === 'background';

  const HeaderText = () => (
    <div className={`flex flex-col ${
      effectiveHeaderLayout === 'logo-left' ? 'items-start' : 
      effectiveHeaderLayout === 'logo-right' ? 'items-end' : 
      'items-center'
    }`}>
      <h1 
        className={`font-black tracking-wide drop-shadow-lg mb-2 leading-none whitespace-nowrap ${
          effectiveHeaderLayout === 'logo-left' ? 'text-left' : 
          effectiveHeaderLayout === 'logo-right' ? 'text-right' : 
          'text-center'
        } ${theme.headerTitleCase === 'capitalize' ? 'capitalize' : 'uppercase'}`}
        style={{ 
          fontFamily: theme.fontFamilyDisplay,
          color: theme.headerTextColor,
          textShadow: '4px 4px 0px rgba(0,0,0,0.2)',
          fontSize: (isLandscape ? 4 : 3.5) * fontScale * (theme.logo && effectiveHeaderLayout !== 'logo-top' ? 0.8 : 1) + 'rem',
          transform: `translateX(${theme.headerTitle.x}px) translateY(${theme.headerTitle.y}px) scale(${theme.headerTitle.scale})`,
          transformOrigin: effectiveHeaderLayout === 'logo-left' ? 'left center' : effectiveHeaderLayout === 'logo-right' ? 'right center' : 'center',
        }}
      >
        {theme.headerTitle.text}
      </h1>
      <div 
        className={`inline-block px-8 py-1.5 font-bold uppercase tracking-widest rounded-full shadow-lg border-2 border-white/20 relative z-20 whitespace-nowrap`}
        style={{ 
          backgroundColor: theme.secondaryColor, 
          color: theme.primaryColor,
          fontSize: 1.25 * fontScale * (theme.logo && effectiveHeaderLayout !== 'logo-top' ? 0.9 : 1) + 'rem',
          transform: `translateX(${theme.headerSubtitle.x}px) translateY(${theme.headerSubtitle.y}px) scale(${theme.headerSubtitle.scale}) rotate(-1deg)`,
          transformOrigin: effectiveHeaderLayout === 'logo-left' ? 'left center' : effectiveHeaderLayout === 'logo-right' ? 'right center' : 'center',
        }}
      >
        {theme.headerSubtitle.text}
      </div>
    </div>
  );

  const HeaderLogo = () => (
    theme.logo ? (
      <div 
        style={{
          transform: `scale(${theme.logo.scale})`,
          transformOrigin: effectiveHeaderLayout === 'logo-left' ? 'left center' : effectiveHeaderLayout === 'logo-right' ? 'right center' : 'center'
        }}
      >
        <img src={theme.logo.src} className="max-w-full max-h-16 object-contain drop-shadow-lg" />
      </div>
    ) : null
  );

  const HeaderContent = () => {
    if (isHeroImageMode) return null; // Oculta conteúdo se for modo Hero Image

    switch (effectiveHeaderLayout) {
      case 'logo-left':
        return <div className="flex flex-row items-center w-full h-full"><div className="w-1/4"><HeaderLogo /></div><div className="w-3/4"><HeaderText /></div></div>;
      case 'logo-right':
        return <div className="flex flex-row items-center w-full h-full"><div className="w-3/4"><HeaderText /></div><div className="w-1/4 flex justify-end"><HeaderLogo /></div></div>;
      case 'logo-top':
        return <div className="flex flex-col items-center justify-center h-full"><div className="mb-4"><HeaderLogo /></div><div><HeaderText /></div></div>;
      case 'text-only':
      default:
        return <div className="w-full flex items-center justify-center"><HeaderText /></div>;
    }
  };

  const renderHeaderArt = () => {
    // Se estiver no modo Background, a arte é renderizada por cima da imagem de fundo
    if (isBackgroundMode) {
      return (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Renderiza a arte do cabeçalho (formas geométricas) */}
          {renderGeometricArt()}
        </div>
      );
    }
    
    // Se não houver imagem de fundo, renderiza a arte geométrica como fundo principal
    if (!theme.headerImage) {
      return renderGeometricArt();
    }

    return null; // Se for modo Hero, não renderiza arte geométrica
  };

  const renderGeometricArt = () => {
    switch (theme.headerArtStyleId) {
      case 'slash':
        return (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -bottom-1/4 -left-8 -right-8" style={{ transform: 'rotate(-15deg)' }}>
              <div className="w-full h-full" style={{ backgroundColor: theme.primaryColor }}></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <HeaderContent />
            </div>
          </div>
        );
      case 'wave':
        return (
          <div className="absolute inset-0">
            <div className="absolute inset-0 w-full h-full opacity-50">
              <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,60 C150,130 350,-30 500,60 L500,0 L0,0 Z" style={{ stroke: 'none', fill: theme.secondaryColor }}></path>
              </svg>
            </div>
            <div className="absolute inset-0 w-full h-full">
              <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,50 C150,120 350,-20 500,50 L500,0 L0,0 Z" style={{ stroke: 'none', fill: theme.primaryColor }}></path>
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-8 pt-0">
              <HeaderContent />
            </div>
          </div>
        );
      case 'peak':
        return (
          <div className="absolute inset-0" style={{ backgroundColor: theme.primaryColor, clipPath: 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)' }}>
             <div className="absolute inset-0 opacity-20" style={{ backgroundColor: theme.secondaryColor, clipPath: 'polygon(100% 0, 100% 75%, 50% 100%, 75% 50%)' }}></div>
            <div className="flex items-center justify-center h-full p-8 pb-16">
              <HeaderContent />
            </div>
          </div>
        );
      case 'block':
      default:
        return (
          <div className="absolute inset-0" style={{ backgroundColor: theme.primaryColor }}>
            <div className="absolute bottom-0 left-0 w-full h-1" style={{backgroundColor: theme.secondaryColor}}></div>
            <div className="flex items-center justify-center h-full p-8">
              <HeaderContent />
            </div>
          </div>
        );
    }
  };

  const renderHeaderImage = () => {
    if (!theme.headerImage) return null;

    const opacity = theme.headerImageMode === 'background' ? theme.headerImageOpacity : 1;
    const zIndex = theme.headerImageMode === 'background' ? 0 : 10;

    return (
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${theme.headerImage})`,
          opacity: opacity,
          zIndex: zIndex,
        }}
      >
        {/* Se for modo Hero, o conteúdo do cabeçalho é renderizado por cima da imagem */}
        {isHeroImageMode && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <HeaderContent />
          </div>
        )}
      </div>
    );
  };

  return (
    <header 
      className="relative z-10 w-full flex-shrink-0"
      style={{ 
        minHeight: isLandscape ? '25%' : '20%',
        // Define a cor primária como fallback se não houver imagem de fundo
        backgroundColor: theme.headerImage ? 'transparent' : theme.primaryColor,
      }}
    >
      {renderHeaderImage()}
      {renderHeaderArt()}
      
      {/* Se for modo Background, o conteúdo do cabeçalho é renderizado por cima da arte geométrica */}
      {isBackgroundMode && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
          <HeaderContent />
        </div>
      )}
      
      {/* Se não houver imagem, o conteúdo é renderizado dentro da arte geométrica (já tratado em renderGeometricArt) */}
      {!theme.headerImage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-8">
          <HeaderContent />
        </div>
      )}
    </header>
  );
};

export default PosterHeader;