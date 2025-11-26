import React, { useState } from 'react';
import { PosterTheme, Product, PosterFormat } from '../types';
import { Plus, Trash2, Wand2, Loader2, List, Settings, Palette, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { generateMarketingCopy, parseProductsFromText, generateBackgroundImage } from '../services/geminiService';

interface SidebarProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
}

const Sidebar: React.FC<SidebarProps> = ({ theme, setTheme, products, setProducts, formats }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'design' | 'ai'>('products');
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bgPrompt, setBgPrompt] = useState("");

  const handleProductChange = (id: string, field: keyof Product, value: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addProduct = () => {
    setProducts(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: 'Novo Produto', price: '0.00', unit: 'un' }
    ]);
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleProductChange(id, 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateHeadline = async () => {
    setIsGenerating(true);
    const headline = await generateMarketingCopy(theme.headerSubtitle || "ofertas");
    setTheme(prev => ({ ...prev, headerTitle: headline }));
    setIsGenerating(false);
  };

  const handleBulkParse = async () => {
    if (!bulkText.trim()) return;
    setIsGenerating(true);
    const newProducts = await parseProductsFromText(bulkText);
    setProducts(prev => [...prev, ...newProducts]);
    setBulkText("");
    setIsGenerating(false);
  };

  const handleGenerateBg = async () => {
    if(!bgPrompt.trim()) return;
    setIsGenerating(true);
    const bgImage = await generateBackgroundImage(bgPrompt);
    if(bgImage) {
        setTheme(prev => ({ ...prev, backgroundImage: bgImage }));
    }
    setIsGenerating(false);
  }

  return (
    <div className="w-full md:w-[400px] h-full bg-white border-r flex flex-col shadow-xl z-20 relative">
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
          <span className="bg-indigo-600 text-white p-1 rounded">OF</span>
          OfertaFlash Builder
        </h1>
      </div>

      <div className="flex border-b flex-shrink-0">
        <button 
          onClick={() => setActiveTab('products')} 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <List size={16} /> Produtos
        </button>
        <button 
          onClick={() => setActiveTab('design')} 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'design' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Palette size={16} /> Design
        </button>
        <button 
          onClick={() => setActiveTab('ai')} 
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Wand2 size={16} /> IA
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="text-xs text-blue-800 bg-blue-50 p-2 rounded border border-blue-100 mb-2">
                <strong>Dica:</strong> Layout "Destaque" é ativado automaticamente quando há apenas 1 produto.
            </div>
            {products.map((product, index) => (
              <div key={product.id} className="bg-gray-50 border rounded-lg p-3 space-y-3 relative group shadow-sm hover:shadow-md transition-shadow">
                <button 
                  onClick={() => removeProduct(product.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex gap-3">
                   <div className="w-20 h-20 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0 overflow-hidden cursor-pointer relative hover:border-indigo-400 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={(e) => handleImageUpload(product.id, e)}
                      />
                      {product.image ? (
                        <img src={product.image} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-center">
                            <ImageIcon size={20} className="text-gray-400 mx-auto" />
                            <span className="text-[9px] text-gray-400 block mt-1">Foto</span>
                        </div>
                      )}
                   </div>
                   <div className="flex-1 space-y-2">
                     <input 
                        className="w-full border rounded px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={product.name}
                        onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                        placeholder="Nome do Produto"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-500 uppercase font-bold">Preço</label>
                          <input 
                            className="w-full border rounded px-2 py-1 text-sm outline-none"
                            value={product.price}
                            onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-gray-500 uppercase font-bold">Preço Antigo</label>
                          <input 
                            className="w-full border rounded px-2 py-1 text-sm outline-none"
                            value={product.oldPrice || ''}
                            onChange={(e) => handleProductChange(product.id, 'oldPrice', e.target.value)}
                          />
                        </div>
                        <div className="w-16">
                          <label className="text-[10px] text-gray-500 uppercase font-bold">Unid.</label>
                          <select 
                            className="w-full border rounded px-1 py-1 text-sm outline-none bg-white"
                            value={product.unit}
                            onChange={(e) => handleProductChange(product.id, 'unit', e.target.value)}
                          >
                            <option value="un">un</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lt">lt</option>
                            <option value="ml">ml</option>
                            <option value="cx">cx</option>
                          </select>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            ))}
            <button 
              onClick={addProduct}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <Plus size={18} /> Adicionar Produto
            </button>
          </div>
        )}

        {/* DESIGN TAB */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            
            {/* Format Selection */}
            <div className="space-y-2">
               <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                 <LayoutTemplate size={16}/> Formato do Cartaz
               </label>
               <div className="grid grid-cols-2 gap-2">
                  {formats.map(fmt => (
                    <button
                      key={fmt.id}
                      onClick={() => setTheme({...theme, format: fmt})}
                      className={`flex flex-col items-center justify-center p-2 border rounded-lg text-xs transition-all ${theme.format.id === fmt.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white text-gray-600 hover:border-gray-400'}`}
                    >
                      <span className="text-xl mb-1">{fmt.icon}</span>
                      <span className="font-semibold">{fmt.name}</span>
                      <span className="text-[10px] opacity-70">{fmt.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Cabeçalho e Rodapé</label>
              <input 
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={theme.headerTitle}
                onChange={(e) => setTheme({ ...theme, headerTitle: e.target.value })}
                placeholder="Título Principal (ex: SUPER OFERTAS)"
              />
              <input 
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={theme.headerSubtitle}
                onChange={(e) => setTheme({ ...theme, headerSubtitle: e.target.value })}
                placeholder="Subtítulo (ex: Só Amanhã)"
              />
              <input 
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={theme.footerText}
                onChange={(e) => setTheme({ ...theme, footerText: e.target.value })}
                placeholder="Texto do Rodapé (ex: Válido até durar o estoque)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Cores</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs text-gray-500 mb-1 block">Primária</label>
                   <div className="flex items-center gap-2 border rounded p-1">
                     <input 
                       type="color" 
                       value={theme.primaryColor}
                       onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                       className="w-8 h-8 rounded cursor-pointer border-none"
                     />
                     <span className="text-xs font-mono">{theme.primaryColor}</span>
                   </div>
                </div>
                <div>
                   <label className="text-xs text-gray-500 mb-1 block">Secundária</label>
                   <div className="flex items-center gap-2 border rounded p-1">
                     <input 
                       type="color" 
                       value={theme.secondaryColor}
                       onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                       className="w-8 h-8 rounded cursor-pointer border-none"
                     />
                     <span className="text-xs font-mono">{theme.secondaryColor}</span>
                   </div>
                </div>
                 <div>
                   <label className="text-xs text-gray-500 mb-1 block">Fundo</label>
                   <div className="flex items-center gap-2 border rounded p-1">
                     <input 
                       type="color" 
                       value={theme.backgroundColor}
                       onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                       className="w-8 h-8 rounded cursor-pointer border-none"
                     />
                     <span className="text-xs font-mono">{theme.backgroundColor}</span>
                   </div>
                </div>
                 <div>
                   <label className="text-xs text-gray-500 mb-1 block">Cor Texto</label>
                   <div className="flex items-center gap-2 border rounded p-1">
                     <input 
                       type="color" 
                       value={theme.textColor}
                       onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                       className="w-8 h-8 rounded cursor-pointer border-none"
                     />
                     <span className="text-xs font-mono">{theme.textColor}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Grid options - Only show if > 1 product */}
            {products.length > 1 && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Layout da Grade</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(cols => (
                      <button
                        key={cols}
                        onClick={() => setTheme({ ...theme, layoutCols: cols })}
                        className={`flex-1 py-2 border rounded text-sm font-medium transition-colors ${theme.layoutCols === cols ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        {cols} Col
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4 mt-4">
                  <label className="text-sm font-semibold text-gray-700">Ajustes Finos (Grade)</label>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label className="font-medium text-gray-600">Proporção da Imagem</label>
                      <span className="font-mono text-gray-500">{theme.imageRatio || 65}%</span>
                    </div>
                    <input 
                      type="range"
                      min="40"
                      max="80"
                      step="1"
                      value={theme.imageRatio || 65}
                      onChange={(e) => setTheme({ ...theme, imageRatio: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label className="font-medium text-gray-600">Tamanho Nome Produto</label>
                      <span className="font-mono text-gray-500">{(theme.productNameSize || 1).toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range"
                      min="0.8"
                      max="1.5"
                      step="0.1"
                      value={theme.productNameSize || 1}
                      onChange={(e) => setTheme({ ...theme, productNameSize: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label className="font-medium text-gray-600">Tamanho Card Preço</label>
                      <span className="font-mono text-gray-500">{(theme.priceCardSize || 1).toFixed(1)}x</span>
                    </div>
                    <input 
                      type="range"
                      min="0.7"
                      max="1.3"
                      step="0.1"
                      value={theme.priceCardSize || 1}
                      onChange={(e) => setTheme({ ...theme, priceCardSize: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </>
            )}

             <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Imagem de Fundo</label>
              <div className="relative border rounded-lg p-2 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-center">
                 <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                       const file = e.target.files?.[0];
                       if(file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setTheme({...theme, backgroundImage: reader.result as string});
                          reader.readAsDataURL(file);
                       }
                    }}
                 />
                 <span className="text-xs text-gray-500 flex items-center justify-center gap-2">
                   <ImageIcon size={14}/> Enviar Imagem
                 </span>
              </div>
               {theme.backgroundImage && (
                 <button onClick={() => setTheme({...theme, backgroundImage: undefined})} className="text-xs text-red-500 hover:underline w-full text-center mt-1">Remover Fundo</button>
               )}
            </div>
          </div>
        )}

        {/* AI TOOLS TAB */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-4">
               <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                 <Wand2 size={16}/> Importação Inteligente
               </h3>
               <p className="text-xs text-purple-700">
                 Cole uma lista de produtos (ex: "Leite 2,99, Pão 5,00") e a IA irá criar os cards automaticamente.
               </p>
               <textarea 
                  className="w-full h-24 p-2 text-sm border rounded focus:ring-2 focus:ring-purple-400 outline-none"
                  placeholder="Cole sua lista aqui..."
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
               />
               <button 
                 onClick={handleBulkParse}
                 disabled={isGenerating || !bulkText}
                 className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>}
                 Importar Produtos
               </button>
            </div>

             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
               <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                 <Settings size={16}/> Gerador de Títulos
               </h3>
               <p className="text-xs text-blue-700">
                 Crie títulos chamativos para sua oferta baseados no tema.
               </p>
               <button 
                 onClick={handleGenerateHeadline}
                 disabled={isGenerating}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>}
                 Gerar Título
               </button>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-4">
               <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                 <ImageIcon size={16}/> Gerador de Fundo
               </h3>
               <p className="text-xs text-indigo-700">
                 Descreva um cenário e a IA criará uma imagem de fundo.
               </p>
               <input 
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  placeholder="Ex: Verão, frutas, texturas"
                  value={bgPrompt}
                  onChange={(e) => setBgPrompt(e.target.value)}
               />
               <button 
                 onClick={handleGenerateBg}
                 disabled={isGenerating || !bgPrompt}
                 className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>}
                 Gerar Fundo
               </button>
            </div>
          </div>
        )}

      </div>
      
      <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 text-center flex-shrink-0">
        Powered by Google Gemini 2.5
      </div>
    </div>
  );
};

export default Sidebar;