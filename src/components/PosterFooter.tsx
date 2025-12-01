import React, { useRef, useLayoutEffect } from 'react';
import { PosterTheme, HeaderElement } from '../../types';
import { Phone, MessageCircle, Instagram, Facebook, Globe, MapPin, CreditCard } from 'lucide-react';

interface PosterFooterProps {
  theme: PosterTheme;
  footerTextElement: HeaderElement;
  isStory: boolean;
}

const PosterFooter: React.FC<PosterFooterProps> = ({ theme, footerTextElement, isStory }) => {
  const footerRef = useRef<HTMLParagraphElement>(null);
  const companyInfo = theme.companyInfo || {};

  useLayoutEffect(() => {
    const footerElement = footerRef.current;
    if (footerElement && footerElement.parentElement) {
      footerElement.style.fontSize = isStory ? '1.1rem' : '1rem';
      footerElement.style.whiteSpace = 'nowrap';
      const parentElement = footerElement.parentElement;
      const parentStyle = window.getComputedStyle(parentElement);
      const parentPaddingX = parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight);
      const availableWidth = parentElement.clientWidth - parentPaddingX;
      const currentScrollWidth = footerElement.scrollWidth;
      if (currentScrollWidth > availableWidth) {
        const scaleFactor = availableWidth / currentScrollWidth;
        const currentFontSize = parseFloat(window.getComputedStyle(footerElement).fontSize);
        const newFontSize = Math.max(8, currentFontSize * scaleFactor * 0.98);
        footerElement.style.fontSize = `${newFontSize}px`;
      }
    }
  }, [footerTextElement, theme.format, isStory]);

  const hasCompanyInfo = Object.entries(companyInfo).some(([key, value]) => key.startsWith('show') && value);

  const iconSize = isStory ? 16 : 14;
  const textSize = isStory ? 'text-sm' : 'text-xs';

  return (
    <footer className="relative z-10 w-full flex-shrink-0 text-center" style={{ backgroundColor: theme.primaryColor, color: theme.headerTextColor }}>
      <div className="absolute top-0 left-0 w-full h-1 bg-black/10"></div>
      
      {hasCompanyInfo && (
        <div className={`grid grid-flow-col auto-cols-max justify-center items-center gap-x-4 gap-y-1 p-2 ${textSize}`}>
          {companyInfo.showPhone && companyInfo.phone && <div className="flex items-center gap-1"><Phone size={iconSize} /><span>{companyInfo.phone}</span></div>}
          {companyInfo.showWhatsapp && companyInfo.whatsapp && <div className="flex items-center gap-1"><MessageCircle size={iconSize} /><span>{companyInfo.whatsapp}</span></div>}
          {companyInfo.showInstagram && companyInfo.instagram && <div className="flex items-center gap-1"><Instagram size={iconSize} /><span>{companyInfo.instagram}</span></div>}
          {companyInfo.showFacebook && companyInfo.facebook && <div className="flex items-center gap-1"><Facebook size={iconSize} /><span>{companyInfo.facebook}</span></div>}
          {companyInfo.showWebsite && companyInfo.website && <div className="flex items-center gap-1"><Globe size={iconSize} /><span>{companyInfo.website}</span></div>}
          {companyInfo.showAddress && companyInfo.address && <div className="flex items-center gap-1"><MapPin size={iconSize} /><span>{companyInfo.address}</span></div>}
          {companyInfo.showPaymentMethods && companyInfo.paymentMethods && <div className="flex items-center gap-1"><CreditCard size={iconSize} /><span>{companyInfo.paymentMethods}</span></div>}
        </div>
      )}

      <div style={{ padding: isStory ? '0.5rem' : '0.5rem 1.5rem', borderTop: hasCompanyInfo ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
        <p
          ref={footerRef}
          className="font-bold uppercase tracking-wider opacity-95"
          style={{
            fontSize: isStory ? '1.1rem' : '1rem',
            transform: `translateX(${footerTextElement.x}px) translateY(${footerTextElement.y}px) scale(${footerTextElement.scale})`,
          }}
        >
          {footerTextElement.text}
        </p>
      </div>
    </footer>
  );
};

export default PosterFooter;