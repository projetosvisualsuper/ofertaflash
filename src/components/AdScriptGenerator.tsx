import React, { useState, useMemo } from 'react';
import { Product, PosterTheme, AdScript } from '../../types';
import { Wand2, Loader2, Zap, Clipboard, Check, Download, Music, Mic, Volume2, VolumeX } from 'lucide-react';
import { generateAdScript } from '../../services/openAiService';
import { showSuccess, showError, showLoading, updateToast } from '../utils/toast';
import { supabase } from '@/src/integrations/supabase/client';

interface AdScriptGeneratorProps {
  products: Product[];
  theme: PosterTheme;
}

// Hardcoded URL for the Edge Function (replace with your project ID)
const TTS_FUNCTION_URL = "https://cdktwczejznbqfzmizpu.supabase.co/functions/v1/elevenlabs-tts"; 

const AdScriptGenerator: React.FC<AdScriptGeneratorProps> = ({ products }) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(products.length > 0 ? [products[0].id] : []);
  const [adScript, setAdScript] = useState<AdScript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const selectedProducts = useMemo(() => 
    products.filter(p => selectedProductIds.includes(p.id)), 
    [products, selectedProductIds]
  );

  const handleProductSelection = (productId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedProductIds(prev => [...prev, productId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const handleGenerateScript = async () => {
    if (selectedProducts.length === 0) {
      showError("Selecione pelo menos um produto.");
      return;
    }

    setIsLoading(true);
    setAdScript(null);
    setAudioUrl(null); // Limpa o áudio anterior
    
    const loadingToast = showLoading("Gerando roteiro com IA...");
    
    try {
      const generatedScript = await generateAdScript(selectedProducts);
      setAdScript(generatedScript);
      updateToast(loadingToast, "Roteiro gerado com sucesso!", 'success');
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("Detailed Script Generation Error:", errorMessage); 
      
      // Exibe a mensagem de erro exata no toast
      updateToast(loadingToast, `Erro ao gerar roteiro: ${errorMessage}`, 'error');
      
      // Define um script de erro para exibição na tela
      setAdScript({ 
        headline: "Erro de Geração", 
        script: `Não foi possível gerar o roteiro devido a um erro: ${errorMessage}. Verifique a chave API e o console.`, 
        suggestions: { music: "Nenhuma", voice: "Nenhuma" } 
      });
      
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateAudio = async () => {
    if (!adScript || !adScript.script) {
      showError("Gere o roteiro de texto primeiro.");
      return;
    }
    
    setIsGeneratingAudio(true);
    setAudioUrl(null);
    const loadingToast = showLoading("Gerando áudio com ElevenLabs...");

    try {
      // Chamada direta à Edge Function da ElevenLabs
      const response = await fetch(TTS_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: adScript.script,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        // Se houver erro, data.details deve conter a mensagem de erro
        const errorDetail = data.details 
          ? (typeof data.details === 'string' ? data.details : JSON.stringify(data.details)) 
          : data.error || "Erro desconhecido na Edge Function.";
        throw new Error(errorDetail);
      }

      const audioBase64 = data.audioContent;
      
      // O ElevenLabs retorna Base64 puro, que precisa ser decodificado para Blob
      const audioBlob = new Blob([Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))], { type: 'audio/mp3' });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      updateToast(loadingToast, "Áudio gerado com sucesso!", 'success');

    } catch (error) {
      console.error("TTS Generation Error:", error);
      
      // Tratamento de erro seguro para evitar recursão
      let errorMessage = "Erro desconhecido ao processar áudio.";
      if (error instanceof Error) {
          errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
          // Tenta extrair a mensagem de objetos que se parecem com Error
          errorMessage = String((error as any).message);
      } else {
          // Se for um objeto complexo, tenta stringify de forma segura
          try {
              errorMessage = JSON.stringify(error);
          } catch (e) {
              errorMessage = "Erro de serialização. Verifique o console.";
          }
      }
      
      // Mensagem de erro atualizada para refletir a nova Voice ID padrão (Adam)
      const userFriendlyError = errorMessage.includes('Voice ID') 
        ? `Falha ao gerar áudio. Verifique a chave ELEVENLABS_API_KEY e se a Voice ID configurada está disponível. Detalhe: ${errorMessage}`
        : `Falha ao gerar áudio. Verifique a chave ELEVENLABS_API_KEY e se o serviço está ativo. Detalhe: ${errorMessage}`;
        
      updateToast(loadingToast, userFriendlyError, 'error');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const scriptText = adScript?.script || '';

  const handleCopy = () => {
    if (scriptText) {
      navigator.clipboard.writeText(scriptText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleDownloadText = () => {
    if (scriptText) {
      const element = document.createElement("a");
      const fileNameBase = selectedProducts.length === 1 
        ? selectedProducts[0].name.replace(/\s+/g, '-').toLowerCase()
        : 'anuncio-multi-produtos';
        
      const file = new Blob([scriptText], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `roteiro-${fileNameBase}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };
  
  const handleDownloadAudio = () => {
    if (audioUrl) {
      const element = document.createElement("a");
      const fileNameBase = selectedProducts.length === 1 
        ? selectedProducts[0].name.replace(/\s+/g, '-').toLowerCase()
        : 'anuncio-multi-produtos';
        
      element.href = audioUrl;
      element.download = `locucao-${fileNameBase}.mp3`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };
  
  const handlePlayAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  if (products.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-md">
        <Zap size={32} className="text-yellow-500 mx-auto mb-4" />
        <p className="text-xl font-semibold text-gray-700">Nenhum Produto Encontrado</p>
        <p className="text-gray-500 mt-2">Adicione produtos na aba "OfertaFlash Builder" para gerar roteiros de anúncios.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      
      {/* Controls Panel */}
      <div className="lg:w-1/3 w-full flex-shrink-0 bg-white p-6 rounded-xl shadow-md space-y-6 h-fit lg:h-full overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Wand2 size={20} className="text-indigo-600" />
          Gerador de Roteiro IA
        </h3>
        
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 block">Produtos para Anunciar ({selectedProducts.length} selecionados)</label>
          <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1 bg-gray-50">
            {products.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
                <label className="flex items-center space-x-2 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={(e) => handleProductSelection(p.id, e.target.checked)}
                    className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out rounded"
                  />
                  <span className="text-sm text-gray-700 truncate">{p.name} (R$ {p.price})</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGenerateScript}
          disabled={isLoading || selectedProducts.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Zap size={20} />
          )}
          {isLoading ? 'Gerando Roteiro...' : 'Gerar Roteiro de Anúncio'}
        </button>
        
        {adScript && (
          <>
            <div className="p-3 bg-gray-50 rounded-lg border text-sm space-y-3">
              <p className="font-bold text-gray-800 border-b pb-1">Sugestões de Produção:</p>
              <div className="flex items-center gap-2 text-gray-700">
                <Music size={16} className="text-indigo-500 shrink-0" />
                <span className="font-semibold">Música:</span> {adScript.suggestions.music}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mic size={16} className="text-indigo-500 shrink-0" />
                <span className="font-semibold">Voz:</span> {adScript.suggestions.voice}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <button 
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGeneratingAudio ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
                {isGeneratingAudio ? 'Gerando Áudio...' : 'Gerar Locução (MP3)'}
              </button>
              
              {audioUrl && (
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={handlePlayAudio}
                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold transition-colors"
                  >
                    <Volume2 size={16} /> Ouvir Áudio
                  </button>
                  <button 
                    onClick={handleDownloadAudio}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white py-2 rounded-lg font-bold transition-colors"
                  >
                    <Download size={16} /> Baixar MP3
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Script Display */}
      <div className="lg:w-2/3 w-full flex flex-col bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold text-gray-800">Roteiro Gerado</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadText}
              disabled={!scriptText}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors disabled:opacity-50 bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              <Download size={16} />
              Baixar Texto
            </button>
            <button 
              onClick={handleCopy}
              disabled={!scriptText}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors disabled:opacity-50"
              style={{ backgroundColor: isCopied ? '#10b981' : '#e0e7ff', color: isCopied ? 'white' : '#4f46e5' }}
            >
              {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
              {isCopied ? 'Copiado!' : 'Copiar Texto'}
            </button>
          </div>
        </div>
        
        {adScript?.headline && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-lg font-black text-yellow-800">{adScript.headline}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded border">
          {scriptText || (
            <p className="text-gray-400 italic">
              {isLoading ? 'Aguarde enquanto a IA cria seu roteiro...' : 'Selecione os produtos e clique em "Gerar Roteiro de Anúncio" para começar.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdScriptGenerator;