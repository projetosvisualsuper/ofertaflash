import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, ChevronLeft, ChevronRight, Play, Pause, Loader2, Download, Zap, Image as ImageIcon, Trash2, Save, XCircle, Layout } from 'lucide-react';
import { PosterTheme, Product, PosterFormat, ProductLayout } from '../types';
import SlidePreview from '../components/SlidePreview';
import SlideLayoutControls from '../components/SlideLayoutControls';
import { POSTER_FORMATS } from '../state/initialState';
import { SLIDE_TRANSITION_PRESETS, SlideTransitionId } from '../config/slideTransitions';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useGlobalBanners } from '../hooks/useGlobalBanners';
import { dataURLtoBlob } from '../utils/cn';

interface DigitalSignagePageProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
}

const SLIDE_INTERVAL_MS = 5000; // 5 seconds per slide
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const DigitalSignagePage: React.FC<DigitalSignagePageProps> = ({ theme, setTheme, products, setProducts }) => {
  const { session } = useAuth();
  const { banners, loading: loadingBanners } = useGlobalBanners(false);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUploadingHeaderImage, setIsUploadingHeaderImage] = useState(false);
  
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
  
  const handleTransitionChange = (transitionId: SlideTransitionId) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      slideTransitionId: transitionId,
    }));
  };
  
  // --- Lógica de Imagem de Cabeçalho Específica para TV ---
  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userId = session?.user?.id;

    if (!file || !userId) {
      showError("Erro: Usuário não autenticado ou arquivo não selecionado.");
      return;
    }
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
        showError(`O arquivo é muito grande. O limite é de ${MAX_FILE_SIZE_MB}MB.`);
        return;
    }

    setIsUploadingHeaderImage(true);
    // Usamos um path específico para o cabeçalho da TV
    const filePath = `${userId}/tv-header-${crypto.randomUUID()}.${file.name.split('.').pop()}`;

    try {
      // 1. Upload para o Storage
      const { error: uploadError } = await supabase.storage
        .from('theme_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('theme_images')
        .getPublicUrl(filePath);
        
      if (!urlData.publicUrl) throw new Error("Falha ao obter URL pública.");

      // 3. Atualizar o tema APENAS para o formato 'tv'
      setTheme(prev => {
        const newHeaderElements = { ...prev.headerElements };
        // Adiciona a imagem de cabeçalho e define o modo 'hero' para o formato 'tv'
        newHeaderElements['tv'] = {
            ...newHeaderElements['tv'],
            headerImage: urlData.publicUrl,
            headerImageMode: 'hero',
        };
        
        return {
            ...prev,
            headerElements: newHeaderElements,
        };
      });
      
      showSuccess("Imagem de cabeçalho da TV enviada com sucesso!");

    } catch (error) {
      console.error("Erro no upload da imagem de cabeçalho da TV:", error);
      showError("Falha ao enviar a imagem. Verifique as permissões do Storage.");
    } finally {
      setIsUploadingHeaderImage(false);
    }
  };
  
  const handleRemoveHeaderImage = () => {
    setTheme(prev => {
        const newHeaderElements = { ...prev.headerElements };
        // Remove a imagem de cabeçalho e define o modo 'none' para o formato 'tv'
        newHeaderElements['tv'] = {
            ...newHeaderElements['tv'],
            headerImage: undefined,
            headerImageMode: 'none',
        };
        
        return {
            ...prev,
            headerElements: newHeaderElements,
        };
    });
  };
  
  // Obtém a imagem de cabeçalho específica para o formato 'tv'
  const tvHeaderImage = theme.headerElements['tv']?.headerImage;
  // --- Fim Lógica de Imagem de Cabeçalho Específica para TV ---


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
      link.download = `criar-ofertas-slides-${Date.now()}.zip`;
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
        </h2>
      </div>
      
      {/* Layout Principal: Preview (2/3) + Controles (1/3) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8 items-start min-h-0">
        
        {/* Coluna do Preview (Ocupa 2/3 e se ajusta) */}
        <div className="w-full lg:w-2/3 flex flex-col items-center justify-center relative flex-shrink-0">
          {productsForSlides.length === 0 ? (
            <div className="w-full max-w-4xl aspect-[16/9] border-4 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-center bg-white/50">
              <div className="p-8">
                <Loader2 size={48} className="text-indigo-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-600">Adicione produtos para criar slides.</p>
                <p className="text-gray-500 mt-2">Use a aba "Produtos" no Criar Ofertas Builder.</p>
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
          
          {/* Banners de Anúncio Abaixo da TV */}
          <div className="w-full max-w-4xl mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingBanners ? (
                <div className="md:col-span-3 flex items-center justify-center p-4 bg-white rounded-xl shadow-md">
                    <Loader2 size={20} className="animate-spin text-indigo-600 mr-2" />
                    <p className="text-sm text-gray-600">Carregando banners...</p>
                </div>
            ) : banners.length > 0 ? (
                banners.slice(0, 3).map((banner) => (
                    <div 
                        key={banner.id} 
                        className="p-4 rounded-xl shadow-md flex items-center justify-center text-center h-24 overflow-hidden"
                        style={{ backgroundColor: banner.background_color, color: banner.text_color }}
                    >
                        {banner.image_url ? (
                            <img src={banner.image_url} alt={banner.name} className="w-full h-full object-contain" />
                        ) : (
                            <p className="text-sm font-bold">{banner.content}</p>
                        )}
                    </div>
                ))
            ) : (
                <div className="md:col-span-3 p-4 bg-gray-200 rounded-xl shadow-inner text-center">
                    <p className="text-sm text-gray-600">Nenhum banner de anúncio ativo. Adicione no Painel Admin &gt; Banners.</p>
                </div>
            )}
          </div>
        </div>

        {/* Coluna de Controles (Ocupa 1/3 e tem rolagem) */}
        <div className="w-full lg:w-1/3 flex flex-col h-full lg:max-h-[calc(100vh-150px)] overflow-y-auto">
          
          {/* Controle de Imagem de Cabeçalho Específica para TV */}
          <div className="p-4 bg-white rounded-xl shadow-sm space-y-4 flex-shrink-0 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 border-b pb-2">
                <ImageIcon size={16}/> Imagem de Cabeçalho (TV)
            </h3>
            <p className="text-xs text-gray-500">Esta imagem substitui o título/arte geométrica APENAS neste módulo.</p>
            <div className="flex items-center gap-2">
                <input type="file" id="tv-header-img-upload" accept="image/*" className="hidden" onChange={handleHeaderImageUpload} disabled={isUploadingHeaderImage} />
                <label htmlFor="tv-header-img-upload" className={`flex-1 text-center text-xs py-2 px-3 border rounded cursor-pointer transition-colors ${isUploadingHeaderImage ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}>
                    {isUploadingHeaderImage ? 'Enviando...' : tvHeaderImage ? 'Trocar Imagem' : 'Enviar Imagem'}
                </label>
                {tvHeaderImage && (
                    <button onClick={handleRemoveHeaderImage} className="p-2 text-red-500 hover:bg-red-100 rounded-full" disabled={isUploadingHeaderImage}>
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            {tvHeaderImage && (
                <div className="mt-2 relative w-full h-24 rounded-md overflow-hidden border flex items-center justify-center bg-gray-100">
                    <img src={tvHeaderImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                </div>
            )}
          </div>
          
          {currentProduct && (
            <>
              <div className="flex items-center justify-center space-x-4 bg-white p-4 rounded-xl shadow-sm flex-shrink-0 mb-4">
                <button onClick={handlePrev} className="p-3 bg-gray-100 rounded-full shadow-sm hover:bg-gray-200 transition-colors disabled:opacity-50" disabled={productsForSlides.length <= 1}><ChevronLeft size={24} /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50" disabled={productsForSlides.length <= 1}>{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
                <button onClick={handleNext} className="p-3 bg-gray-100 rounded-full shadow-sm hover:bg-gray-200 transition-colors disabled:opacity-50" disabled={productsForSlides.length <= 1}><ChevronRight size={24} /></button>
                <span className="text-sm text-gray-600 ml-4">Slide {currentSlideIndex + 1} de {productsForSlides.length}</span>
              </div>
              
              <div className="p-4 bg-white rounded-xl shadow-sm space-y-4 flex-shrink-0 mb-4">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Zap size={16}/> Transição de Slide</label>
                <div className="grid grid-cols-2 gap-2">
                  {SLIDE_TRANSITION_PRESETS.map(preset => {
                    const Icon = preset.icon;
                    return (
                      <button 
                        key={preset.id} 
                        onClick={() => handleTransitionChange(preset.id)}
                        className={`flex items-center justify-center p-2 border rounded-lg text-xs transition-all ${theme.slideTransitionId === preset.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white text-gray-600 hover:border-gray-400'}`}
                      >
                        <Icon size={16} className="mr-1" />
                        <span className="font-semibold">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-shrink-0 mb-4">
                <button 
                  onClick={handleDownloadAllSlides}
                  disabled={isDownloading || productsForSlides.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold shadow-lg transition-all disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                  {isDownloading ? `Compactando ${downloadProgress}/${productsForSlides.length}...` : 'Baixar Todos (ZIP)'}
                </button>
              </div>
              
              {/* Controles de Layout com Rolagem */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <SlideLayoutControls 
                  product={currentProduct} 
                  onLayoutChange={handleLayoutChange} 
                  theme={theme}
                  setTheme={setTheme}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalSignagePage;