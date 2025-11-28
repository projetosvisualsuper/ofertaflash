import React from 'react';
import { PosterTheme, HeaderElement } from '../types';

interface PosterHeaderProps {
  theme: Omit<PosterTheme, 'headerElements' | 'format'>; // Pass most of the theme
  headerTitle: HeaderElement;
  headerSubtitle: HeaderElement;
  isLandscape: boolean;
  fontScale: number;
  isStory: boolean;
}

const PosterHeader: React.FC<PosterHeaderProps> = ({ theme, headerTitle, headerSubtitle, isLandscape, fontScale, isStory }) => {
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
          transform: `translateX(${headerTitle.x}px) translateY(${headerTitle.y}px) scale(${headerTitle.scale})`,
          transformOrigin: effectiveHeaderLayout === 'logo-left' ? 'left center' : effectiveHeaderLayout === 'logo-right' ? 'right center' : 'center',
        }}
      >
        {headerTitle.text}
      </h1>
      <div 
        className={`inline-block px-8 py-1.5 font-bold uppercase tracking-widest rounded-full shadow-lg border-2 border-white/20 relative z-20 whitespace-nowrap`}
        style={{ 
          backgroundColor: theme.secondaryColor, 
          color: theme.primaryColor,
          fontSize: 1.25 * fontScale * (theme.logo && effectiveHeaderLayout !== 'logo-top' ? 0.9 : 1) + 'rem',
          transform: `translateX(${headerSubtitle.x}px) translateY(${headerSubtitle.y}px) scale(${headerSubtitle.scale}) rotate(-1deg)`,
          transformOrigin: effectiveHeaderLayout === 'logo-left' ? 'left center' : effectiveHeaderLayout === 'logo-right' ? 'right center' : 'center',
        }}
      >
        {headerSubtitle.text}
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
    if (isHeroImageMode) return null; 

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

  const renderGeometricArt = () => {
    if (theme.headerImage) {
      return null;
    }
    
    const contentWrapperClass = "flex items-center justify-center h-full p-8";

    switch (theme.headerArtStyleId) {
      case 'slash':
        return (
          <div className="absolute inset-0" style={{ backgroundColor: theme.primaryColor, clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)' }}>
            <div className={contentWrapperClass} style={{ paddingBottom: '2rem' }}>
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
            <div className={contentWrapperClass} style={{ paddingBottom: '4rem' }}>
              <HeaderContent />
            </div>
          </div>
        );
      case 'arc':
        return (
          <div className="absolute inset-0">
            <div className="absolute inset-0 w-full h-full">
              <svg viewBox="0 0 500 100" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,0 L500,0 L500,60 Q250,120 0,60 Z" style={{ stroke: 'none', fill: theme.primaryColor }}></path>
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-8 pb-12">
              <HeaderContent />
            </div>
          </div>
        );
      case 'steps':
        return (
          <div className="absolute inset-0" style={{ backgroundColor: theme.primaryColor, clipPath: 'polygon(0% 0%, 100% 0%, 100% 65%, 75% 65%, 75% 80%, 50% 80%, 50% 95%, 25% 95%, 25% 100%, 0% 100%)' }}>
            <div className="absolute w-1/4 h-1/5 bottom-0 right-0 opacity-20" style={{ backgroundColor: theme.secondaryColor, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 100%)' }}></div>
            <div className={contentWrapperClass} style={{ paddingBottom: '4rem' }}>
              <HeaderContent />
            </div>
          </div>
        );
      case 'brush':
        return (
          <div className="absolute inset-0" style={{ backgroundColor: theme.primaryColor, maskImage: `url('data:image/svg+xml;utf8,<svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0,0 H500 V100 C 450,120 400,80 350,110 C 300,140 250,90 200,120 C 150,150 100,100 50,130 C 0,160 -50,110 0,80 Z" fill="black" /></svg>')`, maskSize: '100% 100%', maskRepeat: 'no-repeat' }}>
            <div className={contentWrapperClass} style={{ paddingBottom: '2rem' }}>
              <HeaderContent />
            </div>
          </div>
        );
      case 'circles':
        return (
          <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: theme.primaryColor }}>
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-20" style={{ backgroundColor: theme.secondaryColor }}></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-20" style={{ backgroundColor: theme.secondaryColor }}></div>
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <HeaderContent />
            </div>
          </div>
        );
      case 'block':
      default:
        return (
          <div className="absolute inset-0" style={{ backgroundColor: theme.primaryColor }}>
            <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: theme.secondaryColor }}></div>
            <div className={contentWrapperClass}>
              <HeaderContent />
            </div>
          </div>
        );
    }
  };

  const renderHeaderImage = () => {
    if (!theme.headerImage) return null;

    const opacity = theme.headerImageMode === 'background' ? theme.headerImageOpacity : 1;
    const zIndex = theme.headerImageMode === 'background' ? 10 : 20;

    return (
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${theme.headerImage})`,
          opacity: opacity,
          zIndex: zIndex,
        }}
      >
        {isHeroImageMode && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <HeaderContent />
          </div>
        )}
      </div>
    );
  };

  const renderPrimaryColorOverlay = () => {
    if (!isBackgroundMode) return null;
    const overlayOpacity = 0.5; 

    return (
      <div 
        className="absolute inset-0 z-20"
        style={{
          backgroundColor: theme.primaryColor,
          opacity: overlayOpacity,
        }}
      />
    );
  };

  return (
    <header 
      className="relative z-10 w-full flex-shrink-0"
      style={{ 
        minHeight: isLandscape ? '25%' : '20%',
        backgroundColor: theme.headerImage ? 'transparent' : theme.primaryColor,
      }}
    >
      {renderGeometricArt()}
      {renderHeaderImage()}
      {renderPrimaryColorOverlay()}
      {theme.headerImage && !isHeroImageMode && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-8">
          <HeaderContent />
        </div>
      )}
    </header>
  );
};

export default PosterHeader;