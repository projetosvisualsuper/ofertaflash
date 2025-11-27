import React, { useState } from 'react';
import { PosterTheme, Product, PosterFormat, HeaderElement } from '../types';
import { Plus, Trash2, Wand2, Loader2, List, Settings, Palette, Image as ImageIcon, LayoutTemplate, SlidersHorizontal, Tag, Type } from 'lucide-react';
import { generateMarketingCopy, parseProductsFromText, generateBackgroundImage } from '../services/geminiService';
import { LAYOUT_PRESETS } from '../src/config/layoutPresets';
import { THEME_PRESETS } from '../src/config/themePresets';
import { HEADER_LAYOUT_PRESETS } from '../src/config/headerLayoutPresets';
import { FONT_PRESETS } from '../src/config/fontPresets';

interface SidebarProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
}

const defaultLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const Sidebar: React.FC<SidebarProps> = ({ theme, setTheme, products, setProducts, formats }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'design' | 'ai'>('products');
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bgPrompt, setBgPrompt] = useState("");

  const handleProductChange = (id: string, field: keyof Product, value: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const addProduct = () => {
    setProducts(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: 'Novo Produto', description: '', price: '0.00', unit: 'un', layout: defaultLayout }
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTheme(prev => ({
          ...prev,
          logo: {
            src: reader.result as string,
            scale: 1,
          },
          // Automatically switch to a layout that uses the logo
          headerLayoutId: 'logo-left',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormatChange = (newFormat: PosterFormat) => {
    const preset = LAYOUT_PRESETS[newFormat.id] || {};
    setTheme(prevTheme => {
      // Preserve existing text when applying presets
      const updatedPreset = { ...preset };
      if (updatedPreset.headerTitle) updatedPreset.headerTitle.text = prevTheme.headerTitle.text;
      if (updatedPreset.headerSubtitle) updatedPreset.headerSubtitle.text = prevTheme.headerSubtitle.text;
      if (updatedPreset.footerText) updatedPreset.footerText.text = prevTheme.footerText.text;

      return {
        ...prevTheme,
        ...updatedPreset,
        format: newFormat,
      };
    });
  };

  const handleThemePresetChange = (presetTheme: Partial<PosterTheme>) => {
    setTheme(prev => {
      // A helper to merge preset elements while preserving user's text and layout
      const mergeElement = (
        prevElement: HeaderElement, 
        presetElement: Partial<HeaderElement> | undefined
      ): HeaderElement => ({
        ...prevElement,
        ...presetElement,
        text: prevElement.text, // Always keep user's text
      });

      return {
        ...prev,
        ...presetTheme,
        // Crucially, preserve user-specific content and settings
        format: prev.format,
        logo: prev.logo,
        backgroundImage: prev.backgroundImage,
        headerLayoutId: prev.headerLayoutId,
        headerTitle: mergeElement(prev.headerTitle, presetTheme.headerTitle),
        headerSubtitle: mergeElement(prev.headerSubtitle, presetTheme.headerSubtitle),
        footerText: mergeElement(prev.footerText, presetTheme.footerText),
      };
    });
  };

  const handleGenerateHeadline = async () => {
    setIsGenerating(true);
    const headline = await generateMarketingCopy(theme.headerSubtitle.text || "ofertas");
    setTheme(prev => ({ ...prev, headerTitle: { ...prev.headerTitle, text: headline } }));
    setIsGenerating(false);
  };

  const handleBulkParse = async () => {
    if (!bulkText.trim()) return;
    setIsGenerating(true);
    const newProducts = await parseProductsFromText(bulkText);
    const productsWithLayout = newProducts.map(p => ({...p, layout: defaultLayout}));
    setProducts(prev => [...prev, ...productsWithLayout]);
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
        
        {activeTab === 'products' && (
          <div className="space-y-4">
            {products.map((product) => (
              <details key={product.id} className="bg-gray-50 border rounded-lg shadow-sm hover:shadow-md transition-shadow group" open>
                <summary className="p-3 flex gap-3 items-start cursor-pointer">
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
                        placeholder="Título do Produto"
                      />
                      <textarea
                        className="w-full border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        value={product.description || ''}
                        onChange={(e) => handleProductChange(product.id, 'description', e.target.value)}
                        placeholder="Descrição (opcional)"
                        rows={2}
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
                            <option value="un">un</option><option value="kg">kg</option><option value="g">g</option><option value="lt">lt</option><option value="ml">ml</option><option value="cx">cx</option>
                          </select>
                        </div>
                      </div>
                   </div>
                   <button 
                      onClick={() => removeProduct(product.id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                </summary>
                <div className="border-t bg-white p-3 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><SlidersHorizontal size={14}/> Layout Individual</h4>
                  
                  {/* Image Controls */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Imagem Tamanho</label><span className="font-mono text-gray-500">{(product.layout?.image.scale || 1).toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={product.layout?.image.scale || 1} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), image: {...(product.layout?.image || defaultLayout.image), scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{product.layout?.image.x || 0}px</span></div><input type="range" min="-200" max="200" value={product.layout?.image.x || 0} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), image: {...(product.layout?.image || defaultLayout.image), x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{product.layout?.image.y || 0}px</span></div><input type="range" min="-200" max="200" value={product.layout?.image.y || 0} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), image: {...(product.layout?.image || defaultLayout.image), y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                  </div>

                  {/* Name Controls */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-2">
                    <div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Nome Tamanho</label><span className="font-mono text-gray-500">{(product.layout?.name.scale || 1).toFixed(1)}x</span></div><input type="range" min="0.8" max="2" step="0.1" value={product.layout?.name.scale || 1} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), name: {...(product.layout?.name || defaultLayout.name), scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{product.layout?.name.x || 0}px</span></div><input type="range" min="-200" max="200" value={product.layout?.name.x || 0} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), name: {...(product.layout?.name || defaultLayout.name), x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{product.layout?.name.y || 0}px</span></div><input type="range" min="-200" max="200" value={product.layout?.name.y || 0} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), name: {...(product.layout?.name || defaultLayout.name), y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                  </div>

                  {/* Description Controls */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-2">
                    <div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Descrição Tamanho</label><span className="font-mono text-gray-500">{(product.layout?.description?.scale || 1).toFixed(1)}x</span></div><input type="range" min="0.8" max="2" step="0.1" value={product.layout?.description?.scale || 1} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), description: {...(product.layout?.description || defaultLayout.description), scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{product.layout?.description?.x || 0}px</span></div><input type="range" min="-200" max="200" value={product.layout?.description?.x || 0} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), description: {...(product.layout?.description || defaultLayout.description), x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{product.layout?.description?.y || 0}px</span></div><input type="range" min="-200" max="200" value={product.layout?.description?.y || 0} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), description: {...(product.layout?.description || defaultLayout.description), y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                  </div>

                  {/* Price Controls */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-2">
                    <div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Preço Tamanho</label><span className="font-mono text-gray-500">{(product.layout?.price.scale || 1).toFixed(1)}x</span></div><input type="range" min="0.7" max="2" step="0.1" value={product.layout?.price.scale || 1} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), price: {...(product.layout?.price || defaultLayout.price), scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{product.layout?.price.x || 0}px</span></div><input type="range" min="-200" max="200" value={product.layout?.price.x || 0} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), price: {...(product.layout?.price || defaultLayout.price), x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{product.layout?.price.y || 0}px</span></div><input type="range" min="-200" max="200" value={product.layout?.price.y || 0} onChange={(e) => handleProductChange(product.id, 'layout', {...(product.layout || defaultLayout), price: {...(product.layout?.price || defaultLayout.price), y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                  </div>
                </div>
              </details>
            ))}
            <button onClick={addProduct} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 flex items-center justify-center gap-2 font-medium transition-colors">
              <Plus size={18} /> Adicionar Produto
            </button>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><LayoutTemplate size={16}/> Formato do Cartaz</label>
               <div className="grid grid-cols-2 gap-2">
                  {formats.map(fmt => (
                    <button key={fmt.id} onClick={() => handleFormatChange(fmt)} className={`flex flex-col items-center justify-center p-2 border rounded-lg text-xs transition-all ${theme.format.id === fmt.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white text-gray-600 hover:border-gray-400'}`}>
                      <span className="text-xl mb-1">{fmt.icon}</span><span className="font-semibold">{fmt.name}</span><span className="text-[10px] opacity-70">{fmt.label}</span>
                    </button>
                  ))}
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Temas Rápidos</label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map(preset => (
                  <button key={preset.id} onClick={() => handleThemePresetChange(preset.theme)} className="p-2 border rounded-lg text-left bg-white hover:border-indigo-500 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <span className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: preset.theme.primaryColor }}></span>
                        <span className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: preset.theme.secondaryColor }}></span>
                      </div>
                      <span className="text-xs font-semibold">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Type size={16}/> Fonte do Título</label>
              <div className="grid grid-cols-3 gap-2">
                {FONT_PRESETS.map(preset => (
                  <button 
                    key={preset.id} 
                    onClick={() => setTheme(prev => ({ ...prev, fontFamilyDisplay: preset.fontFamily }))}
                    className={`py-2 border rounded text-sm font-medium transition-colors ${theme.fontFamilyDisplay === preset.fontFamily ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    style={{ fontFamily: preset.fontFamily }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Layout do Cabeçalho</label>
              <div className="grid grid-cols-4 gap-2">
                {HEADER_LAYOUT_PRESETS.map(preset => (
                  <button 
                    key={preset.id} 
                    onClick={() => setTheme(prev => ({ ...prev, headerLayoutId: preset.id }))}
                    className={`flex flex-col items-center justify-center p-2 border rounded-lg text-xs transition-all ${theme.headerLayoutId === preset.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white text-gray-600 hover:border-gray-400'}`}
                    title={preset.name}
                  >
                    <preset.icon size={20} className="mb-1" />
                    <span className="text-[10px] leading-tight text-center">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
              <label className="text-sm font-semibold text-gray-700">Cabeçalho e Rodapé</label>
              <input className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={theme.headerTitle.text} onChange={(e) => setTheme({ ...theme, headerTitle: {...theme.headerTitle, text: e.target.value} })} placeholder="Título Principal"/>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                <div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Tamanho Título</label><span className="font-mono text-gray-500">{(theme.headerTitle.scale).toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={theme.headerTitle.scale} onChange={(e) => setTheme({...theme, headerTitle: {...theme.headerTitle, scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{theme.headerTitle.x}px</span></div><input type="range" min="-200" max="200" value={theme.headerTitle.x} onChange={(e) => setTheme({...theme, headerTitle: {...theme.headerTitle, x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{theme.headerTitle.y}px</span></div><input type="range" min="-200" max="200" value={theme.headerTitle.y} onChange={(e) => setTheme({...theme, headerTitle: {...theme.headerTitle, y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
              </div>
              <hr className="my-3"/>
              <input className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={theme.headerSubtitle.text} onChange={(e) => setTheme({ ...theme, headerSubtitle: {...theme.headerSubtitle, text: e.target.value} })} placeholder="Subtítulo"/>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                <div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Tamanho Subtítulo</label><span className="font-mono text-gray-500">{(theme.headerSubtitle.scale).toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={theme.headerSubtitle.scale} onChange={(e) => setTheme({...theme, headerSubtitle: {...theme.headerSubtitle, scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{theme.headerSubtitle.x}px</span></div><input type="range" min="-200" max="200" value={theme.headerSubtitle.x} onChange={(e) => setTheme({...theme, headerSubtitle: {...theme.headerSubtitle, x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{theme.headerSubtitle.y}px</span></div><input type="range" min="-200" max="200" value={theme.headerSubtitle.y} onChange={(e) => setTheme({...theme, headerSubtitle: {...theme.headerSubtitle, y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
              </div>
              <hr className="my-3"/>
              <input className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={theme.footerText.text} onChange={(e) => setTheme({ ...theme, footerText: {...theme.footerText, text: e.target.value} })} placeholder="Texto do Rodapé"/>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                <div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Tamanho Rodapé</label><span className="font-mono text-gray-500">{(theme.footerText.scale).toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={theme.footerText.scale} onChange={(e) => setTheme({...theme, footerText: {...theme.footerText, scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{theme.footerText.x}px</span></div><input type="range" min="-200" max="200" value={theme.footerText.x} onChange={(e) => setTheme({...theme, footerText: {...theme.footerText, x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{theme.footerText.y}px</span></div><input type="range" min="-200" max="200" value={theme.footerText.y} onChange={(e) => setTheme({...theme, footerText: {...theme.footerText, y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Logotipo</label>
              {!theme.logo ? (
                <div className="relative border-2 border-dashed rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-center">
                   <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload}/>
                   <span className="text-xs text-gray-500 flex items-center justify-center gap-2"><ImageIcon size={14}/> Enviar Logo</span>
                </div>
              ) : (
                <div className="bg-gray-50 p-2 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2">
                    <img src={theme.logo.src} className="w-12 h-12 object-contain rounded bg-white border p-1" />
                    <button onClick={() => setTheme({...theme, logo: undefined, headerLayoutId: 'text-only'})} className="ml-auto text-xs text-red-500 hover:underline">Remover</button>
                  </div>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2">
                    <div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Tamanho</label><span className="font-mono text-gray-500">{(theme.logo.scale).toFixed(1)}x</span></div><input type="range" min="0.2" max="3" step="0.1" value={theme.logo.scale} onChange={(e) => setTheme({...theme, logo: {...theme.logo!, scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Cores</label>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 mb-1 block">Primária</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.primaryColor} onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.primaryColor}</span></div></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Secundária</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.secondaryColor} onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.secondaryColor}</span></div></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Fundo</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.backgroundColor} onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.backgroundColor}</span></div></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Cor Texto</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.textColor} onChange={(e) => setTheme({ ...theme, textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.textColor}</span></div></div>
              </div>
            </div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Tag size={16}/> Estilo do Preço</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setTheme({ ...theme, priceCardStyle: 'default' })} className={`py-2 border rounded text-xs font-medium transition-colors ${theme.priceCardStyle === 'default' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Caixa</button>
                <button onClick={() => setTheme({ ...theme, priceCardStyle: 'pill' })} className={`py-2 border rounded text-xs font-medium transition-colors ${theme.priceCardStyle === 'pill' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Pílula</button>
                <button onClick={() => setTheme({ ...theme, priceCardStyle: 'minimal' })} className={`py-2 border rounded text-xs font-medium transition-colors ${theme.priceCardStyle === 'minimal' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Mínimo</button>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div><label className="text-xs text-gray-500 mb-1 block">Fundo Preço</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.priceCardBackgroundColor} onChange={(e) => setTheme({ ...theme, priceCardBackgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.priceCardBackgroundColor}</span></div></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Cor Preço</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.priceCardTextColor} onChange={(e) => setTheme({ ...theme, priceCardTextColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.priceCardTextColor}</span></div></div>
              </div>
            </div>
            {products.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Layout da Grade</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map(cols => (
                    <button key={cols} onClick={() => setTheme({ ...theme, layoutCols: cols })} className={`flex-1 py-2 border rounded text-sm font-medium transition-colors ${theme.layoutCols === cols ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{cols} Col</button>
                  ))}
                </div>
              </div>
            )}
             <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Imagem de Fundo</label>
              <div className="relative border rounded-lg p-2 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-center">
                 <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onloadend = () => setTheme({...theme, backgroundImage: reader.result as string}); reader.readAsDataURL(file); } }}/>
                 <span className="text-xs text-gray-500 flex items-center justify-center gap-2"><ImageIcon size={14}/> Enviar Imagem</span>
              </div>
               {theme.backgroundImage && (<button onClick={() => setTheme({...theme, backgroundImage: undefined})} className="text-xs text-red-500 hover:underline w-full text-center mt-1">Remover Fundo</button>)}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-4">
               <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2"><Wand2 size={16}/> Importação Inteligente</h3>
               <p className="text-xs text-purple-700">Cole uma lista de produtos e a IA irá criar os cards automaticamente.</p>
               <textarea className="w-full h-24 p-2 text-sm border rounded focus:ring-2 focus:ring-purple-400 outline-none" placeholder="Cole sua lista aqui..." value={bulkText} onChange={(e) => setBulkText(e.target.value)}/>
               <button onClick={handleBulkParse} disabled={isGenerating || !bulkText} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>} Importar Produtos</button>
            </div>
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4">
               <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2"><Settings size={16}/> Gerador de Títulos</h3>
               <p className="text-xs text-blue-700">Crie títulos chamativos para sua oferta baseados no tema.</p>
               <button onClick={handleGenerateHeadline} disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} Gerar Título</button>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-4">
               <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><ImageIcon size={16}/> Gerador de Fundo</h3>
               <p className="text-xs text-indigo-700">Descreva um cenário e a IA criará uma imagem de fundo.</p>
               <input className="w-full border rounded px-3 py-2 text-sm outline-none" placeholder="Ex: Verão, frutas, texturas" value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)}/>
               <button onClick={handleGenerateBg} disabled={isGenerating || !bgPrompt} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} Gerar Fundo</button>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 text-center flex-shrink-0">Powered by Google Gemini 2.5</div>
    </div>
  );
};

export default Sidebar;