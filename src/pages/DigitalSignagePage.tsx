import React, { useState, useEffect, useRef } from 'react';
import { Monitor, ChevronLeft, ChevronRight, Play, Pause, Loader2, Download } from 'lucide-react';
import { PosterTheme, Product, PosterFormat, ProductLayout } from '../types';
import SlidePreview from '../components/SlidePreview';
import SlideLayoutControls from '../components/SlideLayoutControls';
import { POSTER_FORMATS } from '../state/initialState';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';

interface DigitalSignagePageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
}

const SLIDE_INTERVAL_MS = 5000; // 5 seconds per slide

const DigitalSignagePage: React.FC<DigitalSignagePageProps> = ({ theme, setTheme, products, setProducts }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  
  const tvFormat = POSTER_FORMATS.find(f => f.id === 'tv');
  const productsForSlides = products.filter(p => p.price && p.name);

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

  const handleLayoutChange = (productId: string, newLayout: ProductLayout) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === productId) {
          const newLayouts = { ...p.layouts, 'tv': newLayout };
          return { ...p, layouts: newLayouts };
        }
        return p;
      })
    );
  };

  const handleDownloadAllSlides = async () => {
    if (!slideRef.current || !tvFormat || productsForSlides.length === 0) return;

    setIsDownloading(true);
    setDownloadProgress(0);
    const originalSlideIndex = currentSlideIndex;
    const zip = new JSZip();

    try {
      for (let i = 0; i < productsForSlides.length; i++) {
        const product = productsForSlides[i];
        setDownloadProgress(i + 1);
        setCurrentSlideIndex(i);

        // Wait for the DOM to update with the new slide
        await new Promise(resolve => setTimeout(resolve, 200));

        const element = slideRef.current;
        const targetWidth = tvFormat.width;
        const targetHeight = tvFormat.height;
        const scale = targetWidth / element.offsetWidth;
        const sourceHeight = element.offsetWidth * (targetHeight / targetWidth);

        const dataUrl = await toPng(element, {
          cacheBust: true,
          quality: 1.0,
          pixelRatio: 1,
          width: targetWidth,
          height: targetHeight,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${element.offsetWidth}px`,
            height: `${sourceHeight}px`,
            maxWidth: 'none',
            maxHeight: 'none',
            margin: '0',
            boxShadow: 'none',
          }
        });

        // Extract base64 data (remove 'data:image/png;base64,')
        const base64Data = dataUrl.split(',')[1];
        const fileName = `slide-${String(i + 1).padStart(2, '0')}-${product.name.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()}.png`;
        
        zip.file(fileName, base64Data, { base64: true });
      }

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `ofertaflash-slides-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Failed to generate or download ZIP file", err);
      alert("Erro ao gerar o arquivo ZIP. Tente novamente.");
    } finally {
      // Restore original state
      setCurrentSlideIndex(originalSlideIndex);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
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
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto relative">
      {isDownloading && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-lg font-semibold text-gray-800">Gerando e Compactando Slides...</p>
            <p className="text-gray-600 mt-2">
              Progresso: {downloadProgress} de {productsForSlides.length}
            </p>
            <p className="text-xs text-gray-500 mt-4">A tela irá piscar durante o processo. Por favor, aguarde.</p>
          </div>
        </div>
      )}
      <div className="flex-shrink-0">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Monitor size={32} className="text-indigo-600" />
          TV Digital (Slides)
        </h2 >
      </div>
      
      <div className="flex-1 flex flex-col lg:flex-row gap-8 items-start min-h-0">
        <div className="w-full lg:w-2/3 flex flex-col items-center justify-center relative">
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
              <SlidePreview 
                key={currentProduct.id} // Key forces re-render, triggering CSS animation
                ref={slideRef} 
                product={currentProduct} 
                theme={theme} 
              />
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/3">
          {currentProduct && (
            <>
              <div className="flex items-center justify-center space-x-4 bg-white p-4 rounded-xl shadow-sm">
                <button onClick={handlePrev} className="p-3 bg-gray-100 rounded-full shadow-sm hover:bg-gray-200 transition-colors disabled:opacity-50" disabled={productsForSlides.length <= 1}><ChevronLeft size={24} /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50" disabled={productsForSlides.length <= 1}>{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
                <button onClick={handleNext} className="p-3 bg-gray-100 rounded-full shadow-sm hover:bg-gray-200 transition-colors disabled:opacity-50" disabled={productsForSlides.length <= 1}><ChevronRight size={24} /></button>
                <span className="text-sm text-gray-600 ml-4">Slide {currentSlideIndex + 1} de {productsForSlides.length}</span>
              </div>
              <div className="mt-4">
                <button 
                  onClick={handleDownloadAllSlides}
                  disabled={isDownloading || productsForSlides.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold shadow-lg transition-all disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                  {isDownloading ? `Compactando ${downloadProgress}/${productsForSlides.length}...` : 'Baixar Todos (ZIP)'}
                </button>
              </div>
              <SlideLayoutControls 
                product={currentProduct} 
                onLayoutChange={handleLayoutChange} 
                theme={theme}
                setTheme={setTheme}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalSignagePage;