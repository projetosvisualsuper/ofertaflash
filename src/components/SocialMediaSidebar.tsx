import React, { useState } from 'react';
import { PosterTheme, PosterFormat, SavedImage } from '../../types';
import { Download, LayoutTemplate, Image as ImageIcon, Trash2 } from 'lucide-react';
import SocialMediaGallery from './SocialMediaGallery';

interface SocialMediaSidebarProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  formats: PosterFormat[];
  handleDownload: () => void;
  handleFormatChange: (newFormat: PosterFormat) => void;
  savedImages: SavedImage[];
  deleteImage: (id: string) => void;
  handleSelectImageForPreview: (image: SavedImage | null) => void;
  previewImage: SavedImage | null;
}

const SocialMediaSidebar: React.FC<SocialMediaSidebarProps> = ({ theme, setTheme, formats, handleDownload, handleFormatChange, savedImages, deleteImage, handleSelectImageForPreview, previewImage }) => {
  const [activeTab, setActiveTab] = useState<'formats' | 'gallery'>('formats');

  const handleTabChange = (tab: 'formats' | 'gallery') => {
    setActiveTab(tab);
    // Se mudar para a aba 'formats', desmarque qualquer imagem estática selecionada.
    if (tab === 'formats') {
      handleSelectImageForPreview(null);
    }
  };

  return (
    <div className="w-full md:w-[300px] h-full bg-white border-r flex flex-col shadow-xl z-20 relative flex-shrink-0">
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
          <span className="bg-indigo-600 text-white p-1 rounded">SM</span>
          Artes para Redes Sociais
        </h1>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b flex-shrink-0">
        <button onClick={() => handleTabChange('formats')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'formats' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}><LayoutTemplate size={16} /> Formato</button>
        <button onClick={() => handleTabChange('gallery')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'gallery' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}><ImageIcon size={16} /> Imagens</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {activeTab === 'formats' && (
          <>
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><LayoutTemplate size={16}/> Escolha o Formato</label>
              <p className="text-xs text-gray-500">Selecione o formato ideal para sua publicação. A arte será ajustada automaticamente.</p>
              <div className="grid grid-cols-2 gap-2">
                  {formats.map(fmt => (
                    <button 
                      key={fmt.id} 
                      onClick={() => handleFormatChange(fmt)}
                      className={`flex flex-col items-center justify-center p-3 border rounded-lg text-xs transition-all ${theme.format.id === fmt.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white text-gray-600 hover:border-gray-400'}`}
                    >
                      <span className="text-2xl mb-1">{fmt.icon}</span>
                      <span className="font-semibold">{fmt.name}</span>
                      <span className="text-[10px] opacity-70">{fmt.label}</span>
                    </button>
                  ))}
              </div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-medium text-green-800 mb-2">
                    Para editar cores, textos ou produtos, volte para o módulo "OfertaFlash Builder".
                </p>
            </div>
          </>
        )}
        
        {activeTab === 'gallery' && (
          <>
            {previewImage && (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-800">Visualizando: {previewImage.formatName}</p>
                <button 
                  onClick={() => handleSelectImageForPreview(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Voltar ao Editor
                </button>
              </div>
            )}
            <SocialMediaGallery 
              savedImages={savedImages} 
              deleteImage={deleteImage} 
              setTheme={setTheme} 
              handleSelectImageForPreview={handleSelectImageForPreview}
              previewImage={previewImage}
            />
          </>
        )}

      </div>
      
      {/* O botão de download deve funcionar para o que estiver no preview, seja o editável ou o estático */}
      <div className="p-4 border-t bg-gray-50 flex-shrink-0">
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-bold shadow-lg transition-all"
        >
          <Download size={20} />
          Baixar {previewImage ? previewImage.formatName : theme.format.name}
        </button>
      </div>
    </div>
  );
};

export default SocialMediaSidebar;