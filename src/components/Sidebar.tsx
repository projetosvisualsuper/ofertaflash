import React, { useState } from 'react';
import { PosterTheme, Product, PosterFormat, HeaderElement, HeaderImageMode, ProductLayout } from '../types';
import { Plus, Trash2, Wand2, Loader2, List, Settings, Palette, Image as ImageIcon, LayoutTemplate, SlidersHorizontal, Tag, Type, Brush, Frame, CaseUpper, CaseLower, Save, XCircle } from 'lucide-react';
import { generateMarketingCopy, parseProductsFromText, generateBackgroundImage } from '../../services/geminiService';
import { THEME_PRESETS, ThemePreset } from '../config/themePresets';
import { HEADER_LAYOUT_PRESETS } from '../config/headerLayoutPresets';
import { FONT_PRESETS } from '../config/fontPresets';
import { HEADER_ART_PRESETS } from '../config/headerArtPresets';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

interface SidebarProps {
  theme: PosterTheme;
  setTheme: React.Dispatch<React.SetStateAction<PosterTheme>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  formats: PosterFormat[];
  handleFormatChange: (newFormat: PosterFormat) => void;
}

const defaultLayout: ProductLayout = {
  image: { x: 0, y: 0, scale: 1 },
  name: { x: 0, y: 0, scale: 1 },
  price: { x: 0, y: 0, scale: 1 },
  description: { x: 0, y: 0, scale: 1 },
};

const Sidebar: React.FC<SidebarProps> = ({ theme, setTheme, products, setProducts, formats, handleFormatChange }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'design' | 'ai'>('products');
  const [isGenerating, setIsGenerating] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bgPrompt, setBgPrompt] = useState("");
  const [customThemes, setCustomThemes] = useLocalStorageState<ThemePreset[]>('ofertaflash_custom_themes', []);
  const [newThemeName, setNewThemeName] = useState('');

  const handleProductChange = (id: string, field: keyof Product, value: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleLayoutPropertyChange = (productId: string, newLayout: ProductLayout) => {
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === productId) {
          // Safeguard: Ensure layouts object exists before updating
          const baseLayouts = p.layouts || {
            'a4': JSON.parse(JSON.stringify(defaultLayout)),
            'story': JSON.parse(JSON.stringify(defaultLayout)),
            'feed': JSON.parse(JSON.stringify(defaultLayout)),
            'tv': JSON.parse(JSON.stringify(defaultLayout)),
          };
          const newLayouts = {
            ...baseLayouts,
            [theme.format.id]: newLayout,
          };
          return { ...p, layouts: newLayouts };
        }
        return p;
      })
    );
  };

  const createNewProduct = (index: number): Product => ({
    id: crypto.randomUUID(), 
    name: `Produto ${index + 1}`, 
    description: '', 
    price: '0.00', 
    unit: 'un', 
    layouts: {
      'a4': JSON.parse(JSON.stringify(defaultLayout)),
      'story': JSON.parse(JSON.stringify(defaultLayout)),
      'feed': JSON.parse(JSON.stringify(defaultLayout)),
      'tv': JSON.parse(JSON.stringify(defaultLayout)),
    }
  });

  const addProduct = () => {
    setProducts(prev => [
      ...prev,
      createNewProduct(prev.length)
    ]);
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleProductCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value, 10);
    if (isNaN(newCount) || newCount < 0) return;

    setProducts(prevProducts => {
      const currentCount = prevProducts.length;
      if (newCount > currentCount) {
        const productsToAdd = Array.from({ length: newCount - currentCount }, (_, i) => 
          createNewProduct(currentCount + i)
        );
        return [...prevProducts, ...productsToAdd];
      } else if (newCount < currentCount) {
        return prevProducts.slice(0, newCount);
      }
      return prevProducts;
    });
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
          headerLayoutId: 'logo-left',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTheme(prev => ({
          ...prev,
          headerImage: reader.result as string,
          headerImageMode: 'background',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemePresetChange = (presetTheme: Partial<PosterTheme>) => {
    setTheme(prev => {
      const mergeElement = (
        prevElement: HeaderElement, 
        presetElement: Partial<HeaderElement> | undefined
      ): HeaderElement => ({
        ...prevElement,
        ...presetElement,
        text: prevElement.text,
      });

      return {
        ...prev,
        ...presetTheme,
        format: prev.format,
        logo: prev.logo,
        backgroundImage: prev.backgroundImage,
        headerLayoutId: prev.headerLayoutId,
        headerImage: prev.headerImage,
        headerImageMode: prev.headerImageMode,
        headerImageOpacity: prev.headerImageOpacity,
        headerTitle: mergeElement(prev.headerTitle, presetTheme.headerTitle),
        headerSubtitle: mergeElement(prev.headerSubtitle, presetTheme.headerSubtitle),
        footerText: mergeElement(prev.footerText, presetTheme.footerText),
      };
    });
  };

  const handleSaveCustomTheme = () => {
    if (!newThemeName.trim()) return;
    const themeToSave: Partial<PosterTheme> = {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      headerTextColor: theme.headerTextColor,
      priceCardStyle: theme.priceCardStyle,
      priceCardBackgroundColor: theme.priceCardBackgroundColor,
      priceCardTextColor: theme.priceCardTextColor,
      fontFamilyDisplay: theme.fontFamilyDisplay,
      fontFamilyBody: theme.fontFamilyBody,
      headerLayoutId: theme.headerLayoutId,
      headerArtStyleId: theme.headerArtStyleId,
      headerTitleCase: theme.headerTitleCase,
      hasFrame: theme.hasFrame,
      frameColor: theme.frameColor,
      frameThickness: theme.frameThickness,
      unitBottomEm: theme.unitBottomEm,
      unitRightEm: theme.unitRightEm,
      headerImage: theme.headerImage,
      headerImageMode: theme.headerImageMode,
      headerImageOpacity: theme.headerImageOpacity,
      headerTitle: { text: theme.headerTitle.text, scale: theme.headerTitle.scale, x: 0, y: 0 },
      headerSubtitle: { text: theme.headerSubtitle.text, scale: theme.headerSubtitle.scale, x: 0, y: 0 },
      footerText: { text: theme.footerText.text, scale: theme.footerText.scale, x: 0, y: 0 },
      logo: theme.logo,
      backgroundImage: theme.backgroundImage,
      layoutCols: theme.layoutCols,
    };
    const newPreset: ThemePreset = {
      id: crypto.randomUUID(),
      name: newThemeName.trim(),
      theme: themeToSave,
    };
    setCustomThemes(prev => [...prev, newPreset]);
    setNewThemeName('');
  };

  const handleDeleteCustomTheme = (id: string) => {
    setCustomThemes(prev => prev.filter(t => t.id !== id));
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
    const productsWithLayout = newProducts.map(p => ({...p, layouts: createNewProduct(0).layouts}));
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
        <button onClick={() => setActiveTab('products')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}><List size={16} /> Produtos</button>
        <button onClick={() => setActiveTab('design')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'design' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}><Palette size={16} /> Design</button>
        <button onClick={() => setActiveTab('ai')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:text-gray-700'}`}><Wand2 size={16} /> IA</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg border">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-700 block mb-1">Quantidade de Produtos</label>
                <input type="number" min="0" value={products.length} onChange={handleProductCountChange} className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
              </div>
              <button onClick={addProduct} className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium flex items-center justify-center gap-1 transition-colors"><Plus size={16} /> Adicionar 1</button>
            </div>

            {products.map((product) => {
              // FIX: Safeguard against missing layouts property from older localStorage state
              const currentLayout = (product.layouts && product.layouts[theme.format.id]) || defaultLayout;
              
              const updateElementLayout = (element: keyof ProductLayout, prop: keyof ProductLayout[keyof ProductLayout], value: number) => {
                const newElementLayout = { ...currentLayout[element], [prop]: value };
                const newLayout = { ...currentLayout, [element]: newElementLayout };
                handleLayoutPropertyChange(product.id, newLayout);
              };

              return (
              <details key={product.id} className="bg-gray-50 border rounded-lg shadow-sm hover:shadow-md transition-shadow group" open>
                <summary className="p-3 flex gap-3 items-start cursor-pointer">
                   <div className="w-20 h-20 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0 overflow-hidden cursor-pointer relative hover:border-indigo-400 transition-colors">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleImageUpload(product.id, e)}/>
                      {product.image ? (<img src={product.image} className="w-full h-full object-contain" />) : (<div className="text-center"><ImageIcon size={20} className="text-gray-400 mx-auto" /><span className="text-[9px] text-gray-400 block mt-1">Foto</span></div>)}
                   </div>
                   <div className="flex-1 space-y-2">
                     <input className="w-full border rounded px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" value={product.name} onChange={(e) => handleProductChange(product.id, 'name', e.target.value)} placeholder="Título do Produto"/>
                      <textarea className="w-full border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={product.description || ''} onChange={(e) => handleProductChange(product.id, 'description', e.target.value)} placeholder="Descrição (opcional)" rows={2}/>
                      <div className="flex gap-2">
                        <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold">Preço</label><input className="w-full border rounded px-2 py-1 text-sm outline-none" value={product.price} onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}/></div>
                        <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold">Preço Antigo</label><input className="w-full border rounded px-2 py-1 text-sm outline-none" value={product.oldPrice || ''} onChange={(e) => handleProductChange(product.id, 'oldPrice', e.target.value)}/></div>
                        <div className="w-16"><label className="text-[10px] text-gray-500 uppercase font-bold">Unid.</label><select className="w-full border rounded px-1 py-1 text-sm outline-none bg-white" value={product.unit} onChange={(e) => handleProductChange(product.id, 'unit', e.target.value)}><option value="un">un</option><option value="kg">kg</option><option value="g">g</option><option value="lt">lt</option><option value="ml">ml</option><option value="cx">cx</option></select></div>
                      </div>
                   </div>
                   <button onClick={() => removeProduct(product.id)} className="text-gray-400 hover:text-red-500" title="Remover"><Trash2 size={16} /></button>
                </summary>
                <div className="border-t bg-white p-3 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><SlidersHorizontal size={14}/> Layout Individual ({theme.format.name})</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2"><div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Imagem Tamanho</label><span className="font-mono text-gray-500">{currentLayout.image.scale.toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={currentLayout.image.scale} onChange={(e) => updateElementLayout('image', 'scale', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{currentLayout.image.x}px</span></div><input type="range" min="-200" max="200" value={currentLayout.image.x} onChange={(e) => updateElementLayout('image', 'x', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{currentLayout.image.y}px</span></div><input type="range" min="-200" max="200" value={currentLayout.image.y} onChange={(e) => updateElementLayout('image', 'y', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-2"><div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Nome Tamanho</label><span className="font-mono text-gray-500">{currentLayout.name.scale.toFixed(1)}x</span></div><input type="range" min="0.8" max="2" step="0.1" value={currentLayout.name.scale} onChange={(e) => updateElementLayout('name', 'scale', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{currentLayout.name.x}px</span></div><input type="range" min="-200" max="200" value={currentLayout.name.x} onChange={(e) => updateElementLayout('name', 'x', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{currentLayout.name.y}px</span></div><input type="range" min="-200" max="200" value={currentLayout.name.y} onChange={(e) => updateElementLayout('name', 'y', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-2"><div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Descrição Tamanho</label><span className="font-mono text-gray-500">{currentLayout.description.scale.toFixed(1)}x</span></div><input type="range" min="0.8" max="2" step="0.1" value={currentLayout.description.scale} onChange={(e) => updateElementLayout('description', 'scale', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{currentLayout.description.x}px</span></div><input type="range" min="-200" max="200" value={currentLayout.description.x} onChange={(e) => updateElementLayout('description', 'x', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{currentLayout.description.y}px</span></div><input type="range" min="-200" max="200" value={currentLayout.description.y} onChange={(e) => updateElementLayout('description', 'y', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t pt-2"><div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Preço Tamanho</label><span className="font-mono text-gray-500">{currentLayout.price.scale.toFixed(1)}x</span></div><input type="range" min="0.7" max="2" step="0.1" value={currentLayout.price.scale} onChange={(e) => updateElementLayout('price', 'scale', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{currentLayout.price.x}px</span></div><input type="range" min="-200" max="200" value={currentLayout.price.x} onChange={(e) => updateElementLayout('price', 'x', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{currentLayout.price.y}px</span></div><input type="range" min="-200" max="200" value={currentLayout.price.y} onChange={(e) => updateElementLayout('price', 'y', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div>
                </div>
              </details>
            )})}
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><LayoutTemplate size={16}/> Formato do Cartaz</label>
               <div className="grid grid-cols-2 gap-2">
                  {formats.map(fmt => (<button key={fmt.id} onClick={() => handleFormatChange(fmt)} className={`flex flex-col items-center justify-center p-2 border rounded-lg text-xs transition-all ${theme.format.id === fmt.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white text-gray-600 hover:border-gray-400'}`}><span className="text-xl mb-1">{fmt.icon}</span><span className="font-semibold">{fmt.name}</span><span className="text-[10px] opacity-70">{fmt.label}</span></button>))}
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Temas Rápidos</label>
              <div className="grid grid-cols-2 gap-2">
                {THEME_PRESETS.map(preset => (<button key={preset.id} onClick={() => handleThemePresetChange(preset.theme)} className="p-2 border rounded-lg text-left bg-white hover:border-indigo-500 transition-colors"><div className="flex items-center gap-2"><div className="flex -space-x-1"><span className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: preset.theme.primaryColor }}></span><span className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: preset.theme.secondaryColor }}></span></div><span className="text-xs font-semibold">{preset.name}</span></div></button>))}
              </div>
            </div>
            <div className="space-y-2 border-t pt-4">
              <label className="text-sm font-semibold text-gray-700">Meus Temas Salvos ({customThemes.length})</label>
              <div className="grid grid-cols-2 gap-2">
                {customThemes.map(preset => (<div key={preset.id} className="relative group"><button onClick={() => handleThemePresetChange(preset.theme)} className="w-full p-2 border rounded-lg text-left bg-white hover:border-indigo-500 transition-colors flex items-center gap-2"><div className="flex -space-x-1"><span className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: preset.theme.primaryColor }}></span><span className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: preset.theme.secondaryColor }}></span></div><span className="text-xs font-semibold truncate">{preset.name}</span></button><button onClick={() => handleDeleteCustomTheme(preset.id)} className="absolute top-0 right-0 p-1 text-red-500 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mt-2 -mr-2 shadow-md" title="Excluir Tema"><XCircle size={14} /></button></div>))}
              </div>
              <div className="flex gap-2 pt-2">
                <input type="text" placeholder="Nome do novo tema" value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"/>
                <button onClick={handleSaveCustomTheme} disabled={!newThemeName.trim()} className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50"><Save size={16} /> Salvar</button>
              </div>
            </div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><ImageIcon size={16}/> Imagem do Cabeçalho</label>
              {!theme.headerImage ? (<div className="relative border-2 border-dashed rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-center"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleHeaderImageUpload}/><span className="text-xs text-gray-500 flex items-center justify-center gap-2"><ImageIcon size={14}/> Enviar Imagem</span></div>) : (<div className="space-y-3"><div className="flex items-center justify-between"><img src={theme.headerImage} className="w-16 h-10 object-cover rounded border" alt="Header Preview" /><button onClick={() => setTheme({...theme, headerImage: undefined, headerImageMode: 'none'})} className="ml-auto text-xs text-red-500 hover:underline">Remover Imagem</button></div><label className="text-xs font-semibold text-gray-700 block">Modo de Exibição</label><div className="grid grid-cols-2 gap-2"><button onClick={() => setTheme(prev => ({ ...prev, headerImageMode: 'background' as HeaderImageMode }))} className={`py-2 border rounded text-xs font-medium transition-colors ${theme.headerImageMode === 'background' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Fundo (Com Texto)</button><button onClick={() => setTheme(prev => ({ ...prev, headerImageMode: 'hero' as HeaderImageMode }))} className={`py-2 border rounded text-xs font-medium transition-colors ${theme.headerImageMode === 'hero' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Principal (Sem Texto)</button></div>{theme.headerImageMode === 'background' && (<div className="space-y-1 pt-2 border-t"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Opacidade</label><span className="font-mono text-gray-500">{(theme.headerImageOpacity * 100).toFixed(0)}%</span></div><input type="range" min="0.1" max="1" step="0.05" value={theme.headerImageOpacity} onChange={(e) => setTheme({ ...theme, headerImageOpacity: Number(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div>)}</div>)}
            </div>
            <div className="space-y-2"><label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Brush size={16}/> Estilo da Arte do Cabeçalho</label><div className="grid grid-cols-4 gap-2">{HEADER_ART_PRESETS.map(preset => (<button key={preset.id} onClick={() => setTheme(prev => ({ ...prev, headerArtStyleId: preset.id }))} className={`flex flex-col items-center justify-center p-2 border rounded-lg text-xs transition-all ${theme.headerArtStyleId === preset.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white text-gray-600 hover:border-gray-400'}`} title={preset.name}><preset.icon size={20} className="mb-1" /><span className="text-[10px] leading-tight text-center">{preset.name}</span></button>))}</div></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Type size={16}/> Fonte do Título</label><div className="grid grid-cols-3 gap-2">{FONT_PRESETS.map(preset => (<button key={preset.id} onClick={() => setTheme(prev => ({ ...prev, fontFamilyDisplay: preset.fontFamily }))} className={`py-2 border rounded text-sm font-medium transition-colors ${theme.fontFamilyDisplay === preset.fontFamily ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`} style={{ fontFamily: preset.fontFamily }}>{preset.name}</button>))}</div></div>
            <div className="space-y-2"><label className="text-sm font-semibold text-gray-700">Layout do Cabeçalho</label><div className="grid grid-cols-4 gap-2">{HEADER_LAYOUT_PRESETS.map(preset => (<button key={preset.id} onClick={() => setTheme(prev => ({ ...prev, headerLayoutId: preset.id }))} className={`flex flex-col items-center justify-center p-2 border rounded-lg text-xs transition-all ${theme.headerLayoutId === preset.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600' : 'bg-white text-gray-600 hover:border-gray-400'}`} title={preset.name}><preset.icon size={20} className="mb-1" /><span className="text-[10px] leading-tight text-center">{preset.name}</span></button>))}</div></div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center"><label className="text-sm font-semibold text-gray-700">Cabeçalho e Rodapé</label><div className="flex border rounded-md overflow-hidden"><button onClick={() => setTheme({...theme, headerTitleCase: 'uppercase'})} className={`p-1 ${theme.headerTitleCase === 'uppercase' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100'}`} title="Caixa Alta"><CaseUpper size={16}/></button><button onClick={() => setTheme({...theme, headerTitleCase: 'capitalize'})} className={`p-1 ${theme.headerTitleCase === 'capitalize' ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100'}`} title="Capitalizado"><CaseLower size={16}/></button></div></div>
              <input className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mt-2" value={theme.headerTitle.text} onChange={(e) => setTheme({ ...theme, headerTitle: {...theme.headerTitle, text: e.target.value} })} placeholder="Título Principal"/>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2"><div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Tamanho Título</label><span className="font-mono text-gray-500">{(theme.headerTitle.scale).toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={theme.headerTitle.scale} onChange={(e) => setTheme({...theme, headerTitle: {...theme.headerTitle, scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{theme.headerTitle.x}px</span></div><input type="range" min="-200" max="200" value={theme.headerTitle.x} onChange={(e) => setTheme({...theme, headerTitle: {...theme.headerTitle, x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{theme.headerTitle.y}px</span></div><input type="range" min="-200" max="200" value={theme.headerTitle.y} onChange={(e) => setTheme({...theme, headerTitle: {...theme.headerTitle, y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div>
              <hr className="my-3"/>
              <input className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={theme.headerSubtitle.text} onChange={(e) => setTheme({ ...theme, headerSubtitle: {...theme.headerSubtitle, text: e.target.value} })} placeholder="Subtítulo"/>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2"><div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Tamanho Subtítulo</label><span className="font-mono text-gray-500">{(theme.headerSubtitle.scale).toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={theme.headerSubtitle.scale} onChange={(e) => setTheme({...theme, headerSubtitle: {...theme.headerSubtitle, scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{theme.headerSubtitle.x}px</span></div><input type="range" min="-200" max="200" value={theme.headerSubtitle.x} onChange={(e) => setTheme({...theme, headerSubtitle: {...theme.headerSubtitle, x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{theme.headerSubtitle.y}px</span></div><input type="range" min="-200" max="200" value={theme.headerSubtitle.y} onChange={(e) => setTheme({...theme, headerSubtitle: {...theme.headerSubtitle, y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div>
              <hr className="my-3"/>
              <input className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={theme.footerText.text} onChange={(e) => setTheme({ ...theme, footerText: {...theme.footerText, text: e.target.value} })} placeholder="Texto do Rodapé"/>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2"><div className="space-y-1 col-span-2"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Tamanho Rodapé</label><span className="font-mono text-gray-500">{(theme.footerText.scale).toFixed(1)}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={theme.footerText.scale} onChange={(e) => setTheme({...theme, footerText: {...theme.footerText, scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição X</label><span className="font-mono text-gray-500">{theme.footerText.x}px</span></div><input type="range" min="-200" max="200" value={theme.footerText.x} onChange={(e) => setTheme({...theme, footerText: {...theme.footerText, x: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Posição Y</label><span className="font-mono text-gray-500">{theme.footerText.y}px</span></div><input type="range" min="-200" max="200" value={theme.footerText.y} onChange={(e) => setTheme({...theme, footerText: {...theme.footerText, y: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-semibold text-gray-700">Logotipo</label>{!theme.logo ? (<div className="relative border-2 border-dashed rounded-lg p-4 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-center"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload}/><span className="text-xs text-gray-500 flex items-center justify-center gap-2"><ImageIcon size={14}/> Enviar Logo</span></div>) : (<div className="bg-gray-50 p-2 rounded-lg border space-y-2"><div className="flex items-center gap-2"><img src={theme.logo.src} className="w-12 h-12 object-contain rounded bg-white border p-1" /><button onClick={() => setTheme({...theme, logo: undefined, headerLayoutId: 'text-only'})} className="ml-auto text-xs text-red-500 hover:underline">Remover</button></div><div className="grid grid-cols-1 gap-x-4 gap-y-2"><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Tamanho</label><span className="font-mono text-gray-500">{(theme.logo.scale).toFixed(1)}x</span></div><input type="range" min="0.2" max="3" step="0.1" value={theme.logo.scale} onChange={(e) => setTheme({...theme, logo: {...theme.logo!, scale: Number(e.target.value)}})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div></div>)}</div>
            <div className="space-y-2"><label className="text-sm font-semibold text-gray-700">Cores</label><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-gray-500 mb-1 block">Primária</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.primaryColor} onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.primaryColor}</span></div></div><div><label className="text-xs text-gray-500 mb-1 block">Secundária</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.secondaryColor} onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.secondaryColor}</span></div></div><div><label className="text-xs text-gray-500 mb-1 block">Fundo</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.backgroundColor} onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.backgroundColor}</span></div></div><div><label className="text-xs text-gray-500 mb-1 block">Cor Texto</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.textColor} onChange={(e) => setTheme({ ...theme, textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.textColor}</span></div></div></div></div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border"><label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Tag size={16}/> Estilo do Preço</label><div className="grid grid-cols-3 gap-2"><button onClick={() => setTheme({ ...theme, priceCardStyle: 'default' })} className={`py-2 border rounded text-xs font-medium transition-colors ${theme.priceCardStyle === 'default' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Caixa</button><button onClick={() => setTheme({ ...theme, priceCardStyle: 'pill' })} className={`py-2 border rounded text-xs font-medium transition-colors ${theme.priceCardStyle === 'pill' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Pílula</button><button onClick={() => setTheme({ ...theme, priceCardStyle: 'minimal' })} className={`py-2 border rounded text-xs font-medium transition-colors ${theme.priceCardStyle === 'minimal' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Mínimo</button></div><div className="grid grid-cols-2 gap-4 pt-2"><div><label className="text-xs text-gray-500 mb-1 block">Fundo Preço</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.priceCardBackgroundColor} onChange={(e) => setTheme({ ...theme, priceCardBackgroundColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.priceCardBackgroundColor}</span></div></div><div><label className="text-xs text-gray-500 mb-1 block">Cor Preço</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.priceCardTextColor} onChange={(e) => setTheme({ ...theme, priceCardTextColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.priceCardTextColor}</span></div></div></div><div className="space-y-2 pt-4 border-t mt-4"><label className="text-xs font-semibold text-gray-700 block">Posição da Unidade (Modo Hero)</label><div className="grid grid-cols-2 gap-4"><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Vertical (Bottom)</label><span className="font-mono text-gray-500">{theme.unitBottomEm.toFixed(1)}em</span></div><input type="range" min="-3" max="3" step="0.1" value={theme.unitBottomEm} onChange={(e) => setTheme({ ...theme, unitBottomEm: Number(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Horizontal (Right)</label><span className="font-mono text-gray-500">{theme.unitRightEm.toFixed(1)}em</span></div><input type="range" min="-3" max="3" step="0.1" value={theme.unitRightEm} onChange={(e) => setTheme({ ...theme, unitRightEm: Number(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div></div></div>
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg border"><label className="text-sm font-semibold text-gray-700">Opções de Layout</label><div className="space-y-3"><button onClick={() => setTheme({ ...theme, hasFrame: !theme.hasFrame })} className={`w-full py-2 border rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${theme.hasFrame ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}><Frame size={16}/> {theme.hasFrame ? 'Remover Moldura' : 'Adicionar Moldura'}</button>{theme.hasFrame && (<div className="grid grid-cols-2 gap-4 pt-2"><div><label className="text-xs text-gray-500 mb-1 block">Cor da Moldura</label><div className="flex items-center gap-2 border rounded p-1"><input type="color" value={theme.frameColor} onChange={(e) => setTheme({ ...theme, frameColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none"/><span className="text-xs font-mono">{theme.frameColor}</span></div></div><div className="space-y-1"><div className="flex justify-between text-xs"><label className="font-medium text-gray-600">Espessura</label><span className="font-mono text-gray-500">{theme.frameThickness.toFixed(1)}vmin</span></div><input type="range" min="0.5" max="5" step="0.1" value={theme.frameThickness} onChange={(e) => setTheme({ ...theme, frameThickness: Number(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/></div></div>)}</div></div>
            {products.length > 1 && (<div className="space-y-2"><label className="text-sm font-semibold text-gray-700">Layout da Grade</label><div className="flex gap-2">{[1, 2, 3, 4, 5].map(cols => (<button key={cols} onClick={() => setTheme({ ...theme, layoutCols: cols })} className={`flex-1 py-2 border rounded text-xs font-medium transition-colors ${theme.layoutCols === cols ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{cols} Col</button>))}</div></div>)}
            <div className="space-y-2"><label className="text-sm font-semibold text-gray-700">Imagem de Fundo</label><div className="relative border rounded-lg p-2 bg-gray-50 hover:bg-white transition-colors cursor-pointer text-center"><input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onloadend = () => setTheme({...theme, backgroundImage: reader.result as string}); reader.readAsDataURL(file); } }}/><span className="text-xs text-gray-500 flex items-center justify-center gap-2"><ImageIcon size={14}/> Enviar Imagem</span></div>{theme.backgroundImage && (<button onClick={() => setTheme({...theme, backgroundImage: undefined})} className="text-xs text-red-500 hover:underline w-full text-center mt-1">Remover Fundo</button>)}</div>
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-4"><h3 className="text-sm font-bold text-purple-800 flex items-center gap-2"><Wand2 size={16}/> Importação Inteligente</h3><p className="text-xs text-purple-700">Cole uma lista de produtos e a IA irá criar os cards automaticamente.</p><textarea className="w-full h-24 p-2 text-sm border rounded focus:ring-2 focus:ring-purple-400 outline-none" placeholder="Cole sua lista aqui..." value={bulkText} onChange={(e) => setBulkText(e.target.value)}/><button onClick={handleBulkParse} disabled={isGenerating || !bulkText} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16}/>} Importar Produtos</button></div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-4"><h3 className="text-sm font-bold text-blue-800 flex items-center gap-2"><Settings size={16}/> Gerador de Títulos</h3><p className="text-xs text-blue-700">Crie títulos chamativos para sua oferta baseados no tema.</p><button onClick={handleGenerateHeadline} disabled={isGenerating} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} Gerar Título</button></div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 space-y-4"><h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><ImageIcon size={16}/> Gerador de Fundo</h3><p className="text-xs text-indigo-700">Descreva um cenário e a IA criará uma imagem de fundo.</p><input className="w-full border rounded px-3 py-2 text-sm outline-none" placeholder="Ex: Verão, frutas, texturas" value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)}/><button onClick={handleGenerateBg} disabled={isGenerating || !bgPrompt} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} Gerar Fundo</button></div>
          </div>
        )}
      </div>
      <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 text-center flex-shrink-0">Powered by Google Gemini 2.5</div>
    </div>
  );
};

export default Sidebar;