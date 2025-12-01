import React from 'react';
import { SavedImage, PosterTheme } from '../../types';
import { Trash2, Download, Image, Clock, RefreshCw, Eye } from 'lucide-react';
import { showSuccess, showError } from '../utils/toast';

interface SocialMediaGalleryProps {
  savedImages: SavedImage[];
  deleteImage: (id: string) => void;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  handleSelectImageForPreview: (image: SavedImage | null) => void;
  previewImage: SavedImage | null;
  activeFormatName: string; // Nova prop para filtro
}

const SocialMediaGallery: React.FC<SocialMediaGalleryProps> = ({ savedImages, deleteImage, setTheme, handleSelectImageForPreview, previewImage, activeFormatName }) => {

  // Removendo handleDownload daqui. O download será feito pelo botão principal da sidebar.
  
  const handleLoadTheme = (image: SavedImage) => {
    // Restaura o tema completo, incluindo o formato
    setTheme(image.theme);
    showSuccess(`Tema e formato (${image.formatName}) restaurados no preview do Builder!`);
  };
  
  const handlePreview = (image: SavedImage) => {
    if (previewImage && previewImage.id === image.id) {
      handleSelectImageForPreview(null); // Desselecionar
    } else {
      handleSelectImageForPreview(image); // Selecionar para visualização estática
    }
  };
  
  // Filtrar imagens salvas pelo nome do formato ativo
  const filteredImages = savedImages.filter(image => image.formatName === activeFormatName);

  if (filteredImages.length === 0) {
    return (
      <div className="p-6 text-center bg-white rounded-xl shadow-md border border-dashed border-gray-300">
        <Image size={32} className="text-indigo-500 mx-auto mb-4" />
        <p className="text-lg font-semibold text-gray-700">Galeria Vazia</p>
        <p className="text-gray-500 mt-2 text-sm">
          Nenhuma arte salva para o formato <span className="font-semibold">{activeFormatName}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Artes Salvas ({activeFormatName}) - {filteredImages.length}</h3>
      <div className="grid grid-cols-2 gap-4">
        {filteredImages.map((image) => {
          const isSelected = previewImage && previewImage.id === image.id;
          return (
            <div key={image.id} className={`relative group bg-white rounded-lg shadow-md overflow-hidden border ${isSelected ? 'border-4 border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-200'}`}>
              <img 
                src={image.dataUrl} 
                alt={`Arte ${image.formatName}`} 
                className="w-full h-48 object-cover bg-gray-100"
              />
              <div className="p-3 text-xs space-y-1">
                <p className="font-semibold text-gray-800">{image.formatName}</p>
                <p className="text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(image.timestamp).toLocaleDateString()} {new Date(image.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-y-2">
                <button
                  onClick={() => handlePreview(image)}
                  className={`flex items-center gap-1 p-2 rounded-full transition-colors shadow-lg text-xs font-bold ${isSelected ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}
                  title={isSelected ? "Voltar ao Editor" : "Visualizar no Preview"}
                >
                  <Eye size={14} /> {isSelected ? 'Voltar' : 'Visualizar'}
                </button>
                <div className="flex space-x-2">
                  {/* Botão de Download removido daqui */}
                  <button
                    onClick={() => deleteImage(image.id)}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                    title="Excluir Imagem"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <button
                  onClick={() => handleLoadTheme(image)}
                  className="flex items-center gap-1 p-1 px-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg text-[10px] font-bold mt-2"
                  title="Carregar Tema e Formato no Builder"
                >
                  <RefreshCw size={10} /> Carregar Tema (Builder)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SocialMediaGallery;