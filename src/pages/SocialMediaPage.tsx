import React from 'react';
import { Image, Loader2 } from 'lucide-react';

const SocialMediaPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Image size={32} className="text-indigo-600" />
        Artes para Redes Sociais
      </h2>
      <div className="flex-1 border-4 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-center bg-white/50">
        <div className="p-8">
          <Loader2 size={48} className="text-indigo-400 mx-auto animate-spin mb-4" />
          <p className="text-xl font-semibold text-gray-600">Módulo em Desenvolvimento</p>
          <p className="text-gray-500 mt-2">Crie posts e stories com formatos e copies otimizados para Instagram, Facebook e TikTok.</p>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaPage;