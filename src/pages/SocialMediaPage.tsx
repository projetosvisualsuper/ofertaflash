import React, { useState, useEffect, useRef, useCallback } from 'react';
import SocialMediaSidebar from '../components/SocialMediaSidebar';
import PosterPreview, { PosterPreviewRef } from '../components/PosterPreview';
import { Product, PosterTheme, PosterFormat, SavedImage } from '../../types';
import { Image } from 'lucide-react';
import { INITIAL_THEME } from '../state/initialState';

interface SocialMediaPageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[]; // Full list from App.tsx
  savedImages: SavedImage[];
  deleteImage: (id: string) => Promise<void>;
}

export default function SocialMediaPage({ theme, setTheme, products, setProducts, formats, savedImages, deleteImage }: SocialMediaPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewImage, setPreviewImage] = useState<SavedImage | null>(null); // Novo estado para a imagem estática
  const posterRef = useRef<PosterPreviewRef>(null);
  
  const socialFormats = formats.filter(f => f.id === 'story' || f.id === 'feed');

  const applyFormatPreset = useCallback((newFormat: PosterFormat) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      format: newFormat,
    }));
    setPreviewImage(null); // Limpa a visualização estática ao mudar o formato
  }, [setTheme]);

  useEffect(() => {
    const isSocialFormat = socialFormats.some(f => f.id === theme.format.id);
    
    if (!isSocialFormat) {
      const defaultFormat = socialFormats.find(f => f.id === 'feed');
      if (defaultFormat) {
        applyFormatPreset(defaultFormat);
      }
    }
  }, [theme.format.id, socialFormats, applyFormatPreset]);

  const handleDownload = () => {
    if (posterRef.current) {
      posterRef.current.triggerDownload();
    }
  };
  
  const handleSelectImageForPreview = (image: SavedImage | null) => {
    setPreviewImage(image);
    // Se uma imagem for selecionada, atualizamos o formato do tema para corresponder ao formato da imagem salva,
    // mas sem alterar o tema completo, apenas o formato para que o container do preview tenha o aspect ratio correto.
    if (image) {
        const savedFormat = formats.find(f => f.name === image.formatName);
        if (savedFormat) {
            setTheme(prevTheme => ({
                ...prevTheme,
                format: savedFormat,
            }));
        }
    }
  };

  const renderPreviewContent = () => {
    if (previewImage) {
      // Renderiza a imagem estática salva
      return (
        <div className="flex-1 relative overflow-hidden bg-gray-200/80 flex items-center justify-center">
          <div 
            className="relative flex-shrink-0 origin-center shadow-2xl"
            style={{
              aspectRatio: theme.format.aspectRatio,
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <img 
              src={previewImage.dataUrl} 
              alt={`Preview ${previewImage.formatName}`} 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      );
    }

    // Se não houver imagem estática selecionada, mostre uma mensagem de instrução.
    return (
      <div className="flex-1 relative overflow-hidden bg-gray-200/80 flex items-center justify-center">
        <div className="text-center p-8 bg-white/70 rounded-xl shadow-lg border border-dashed border-gray-300">
          <Image size={48} className="text-indigo-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">Visualização de Artes Salvas</h3>
          <p className="text-gray-500">
            Vá para a aba <span className="font-semibold">Imagens</span> e clique em "Visualizar" em uma arte salva para vê-la aqui.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            O preview editável está disponível no módulo "OfertaFlash Builder".
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden font-sans">
      <SocialMediaSidebar 
        theme={theme} 
        setTheme={setTheme} 
        formats={socialFormats}
        handleDownload={handleDownload}
        handleFormatChange={applyFormatPreset}
        savedImages={savedImages}
        deleteImage={deleteImage}
        handleSelectImageForPreview={handleSelectImageForPreview}
        previewImage={previewImage}
      />
      
      <main className="flex-1 bg-gray-100 relative h-full flex flex-col">
         {isDownloading && (
           <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm fixed">
             <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center animate-pulse">
               <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="font-semibold text-gray-800">Gerando Imagem para Redes Sociais...</p>
             </div>
           </div>
         )}
         {renderPreviewContent()}
      </main>
    </div>
  );
}