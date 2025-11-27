import React from 'react';
import { PosterTheme, PosterFormat } from '../../types';
import { Download, LayoutTemplate } from 'lucide-react';

interface SocialMediaSidebarProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  formats: PosterFormat[];
  handleDownload: () => void;
  handleFormatChange: (newFormat: PosterFormat) => void; // New prop for format change
}

const SocialMediaSidebar: React.FC<SocialMediaSidebarProps> = ({ theme, setTheme, formats, handleDownload, handleFormatChange }) => {

  return (
    <div className="w-full md:w-[300px] h-full bg-white border-r flex flex-col shadow-xl z-20 relative flex-shrink-0">
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
          <span className="bg-indigo-600 text-white p-1 rounded">SM</span>
          Artes para Redes Sociais
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
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

      </div>
      
      <div className="p-4 border-t bg-gray-50 flex-shrink-0">
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-bold shadow-lg transition-all"
        >
          <Download size={20} />
          Baixar {theme.format.name}
        </button>
      </div>
    </div>
  );
};

export default SocialMediaSidebar;