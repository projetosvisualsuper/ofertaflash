import React, { useState, useMemo } from 'react';
import { Product, PosterTheme } from '../../types';
import { Wand2, Loader2, Zap, Clipboard, Check, Download } from 'lucide-react';
import { generateAdScript } from '../../services/geminiService';

interface AdScriptGeneratorProps {
  products: Product[];
  theme: PosterTheme;
}

const AdScriptGenerator: React.FC<AdScriptGeneratorProps> = ({ products }) => {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(products[0]?.id);
  const [script, setScript] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const selectedProduct = useMemo(() => 
    products.find(p => p.id === selectedProductId), 
    [products, selectedProductId]
  );

  const handleGenerateScript = async () => {
    if (!selectedProduct) return;

    setIsLoading(true);
    setScript('');
    
    const generatedScript = await generateAdScript(selectedProduct);
    setScript(generatedScript);
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (script) {
      navigator.clipboard.writeText(script);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleDownload = () => {
    if (script && selectedProduct) {
      const element = document.createElement("a");
      const file = new Blob([script], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `roteiro-anuncio-${selectedProduct.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
      document.body.appendChild(element); // Required for Firefox
      element.click();
      document.body.removeChild(element);
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
      <div className="lg:w-1/3 w-full flex-shrink-0 bg-white p-6 rounded-xl shadow-md space-y-6 h-fit lg:h-full">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Wand2 size={20} className="text-indigo-600" />
          Gerador de Roteiro IA
        </h3>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block">Produto para Anunciar</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (R$ {p.price})
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleGenerateScript}
          disabled={isLoading || !selectedProduct}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Zap size={20} />
          )}
          {isLoading ? 'Gerando Roteiro...' : 'Gerar Roteiro de Anúncio'}
        </button>
        
        {selectedProduct && (
          <div className="p-3 bg-gray-50 rounded-lg border text-sm">
            <p className="font-semibold text-gray-700 mb-1">Detalhes:</p>
            <p className="text-xs text-gray-600">Preço: R$ {selectedProduct.price} / {selectedProduct.unit}</p>
            {selectedProduct.oldPrice && <p className="text-xs text-gray-600">De: R$ {selectedProduct.oldPrice}</p>}
            {selectedProduct.description && <p className="text-xs text-gray-600 mt-1">Descrição: {selectedProduct.description}</p>}
          </div>
        )}
      </div>

      {/* Script Display */}
      <div className="lg:w-2/3 w-full flex flex-col bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-xl font-bold text-gray-800">Roteiro Gerado</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleDownload}
              disabled={!script}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors disabled:opacity-50 bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              <Download size={16} />
              Baixar
            </button>
            <button 
              onClick={handleCopy}
              disabled={!script}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded transition-colors disabled:opacity-50"
              style={{ backgroundColor: isCopied ? '#10b981' : '#e0e7ff', color: isCopied ? 'white' : '#4f46e5' }}
            >
              {isCopied ? <Check size={16} /> : <Clipboard size={16} />}
              {isCopied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded border">
          {script || (
            <p className="text-gray-400 italic">
              {isLoading ? 'Aguarde enquanto a IA cria seu roteiro...' : 'Clique em "Gerar Roteiro de Anúncio" para começar.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdScriptGenerator;