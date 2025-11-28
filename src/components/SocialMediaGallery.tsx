import React from 'react';
import { SavedImage, PosterTheme } from '../../types';
import { Trash2, Download, Image, Clock, RefreshCw } from 'lucide-react';

interface SocialMediaGalleryProps {
  savedImages: SavedImage[];
  deleteImage: (id: string) => void;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>; // Nova prop
}

const SocialMediaGallery: React.FC<SocialMediaGalleryProps> = ({ savedImages, deleteImage, setTheme }) => {

  const handleDownload = (image: SavedImage) => {
    const link = document.createElement('a');
    link.download = `ofertaflash-${image.formatName.replace(/\s+/g, '-').toLowerCase()}-${image.id}.png`;
    link.href = image.dataUrl;
    link.click();
  };
  
  const handleLoadTheme = (image: SavedImage) => {
    // Restaura o tema completo, incluindo o formato
    setTheme(image.theme);
    alert(`Tema e formato (${image.formatName}) restaurados no preview!`);
  };

  if (savedImages.length === 0) {
    return (
      <div className="p-6 text-center bg-white rounded-xl shadow-md border border-dashed border-gray-300">
        <Image size={32} className="text-indigo-500 mx-auto mb-4" />
        <p className="text-lg font-semibold text-gray-700">Galeria Vazia</p>
        <p className="text-gray-500 mt-2 text-sm">
          Suas artes salvas aparecerão aqui. Crie e salve artes na aba "OfertaFlash Builder".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Minhas Artes Salvas ({savedImages.length})</h3>
      <div className="grid grid-cols-2 gap-4">
        {savedImages.map((image) => (
          <div key={image.id} className="relative group bg-white rounded-lg shadow-md overflow-hidden border">
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
                onClick={() => handleLoadTheme(image)}
                className="flex items-center gap-1 p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors shadow-lg text-xs font-bold"
                title="Carregar Tema e Formato"
              >
                <RefreshCw size={14} /> Carregar Tema
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(image)}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
                  title="Baixar Imagem"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => deleteImage(image.id)}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                  title="Excluir Imagem"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialMediaGallery;