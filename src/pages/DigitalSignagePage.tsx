import React, { useState, useEffect } from 'react';
import { Monitor, ChevronLeft, ChevronRight, Play, Pause, Loader2 } from 'lucide-react';
import { PosterTheme, Product, PosterFormat } from '../types';
import SlidePreview from '../components/SlidePreview';
import { POSTER_FORMATS } from '../state/initialState';

interface DigitalSignagePageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
}

const SLIDE_INTERVAL_MS = 5000; // 5 seconds per slide

const DigitalSignagePage: React.FC<DigitalSignagePageProps> = ({ theme, products }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const tvFormat = POSTER_FORMATS.find(f => f.id === 'tv');
  // Only show products that have a price and name defined
  const productsForSlides = products.filter(p => p.price && p.name);

  // Auto-advance logic
  useEffect(() => {
    if (isPlaying && productsForSlides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlideIndex(prevIndex => (prevIndex + 1) % productsForSlides.length);
      }, SLIDE_INTERVAL_MS);
      return () => clearInterval(timer);
    }
  }, [isPlaying, productsForSlides.length]);

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentSlideIndex(prevIndex => (prevIndex + 1) % productsForSlides.length);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentSlideIndex(prevIndex => (prevIndex - 1 + productsForSlides.length) % productsForSlides.length);
  };

  const currentProduct = productsForSlides[currentSlideIndex];

  if (!tvFormat) {
    return (
      <div className="flex-1 flex flex-col p-8 bg-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Monitor size={32} className="text-indigo-600" />
          TV Digital (Slides)
        </h2>
        <div className="flex-1 border-4 border-dashed border-red-300 rounded-xl flex items-center justify-center text-center bg-white/50">
          <p className="text-xl font-semibold text-red-600">Erro: Formato TV (16:9) não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Monitor size={32} className="text-indigo-600" />
        TV Digital (Slides)
      </h2>
      
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {productsForSlides.length === 0 ? (
          <div className="w-full max-w-4xl aspect-[16/9] border-4 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-center bg-white/50">
            <div className="p-8">
              <Loader2 size={48} className="text-indigo-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-600">Adicione produtos para criar slides.</p>
              <p className="text-gray-500 mt-2">Use a aba "Produtos" no OfertaFlash Builder.</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl aspect-[16/9] shadow-2xl rounded-xl overflow-hidden relative">
            <SlidePreview product={currentProduct} theme={theme} />
          </div>
        )}
      </div>

      {productsForSlides.length > 0 && (
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button 
            onClick={handlePrev} 
            className="p-3 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={productsForSlides.length <= 1}
          >
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={productsForSlides.length <= 1}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <button 
            onClick={handleNext} 
            className="p-3 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            disabled={productsForSlides.length <= 1}
          >
            <ChevronRight size={24} />
          </button>
          
          <span className="text-sm text-gray-600 ml-4">
            Slide {currentSlideIndex + 1} de {productsForSlides.length}
          </span>
        </div>
      )}
    </div>
  );
};

export default DigitalSignagePage;