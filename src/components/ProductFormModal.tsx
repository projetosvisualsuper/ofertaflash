import React, { useState, useEffect } from 'react';
import { RegisteredProduct } from '../../types';
import { Plus, Save, Loader2, XCircle, Image as ImageIcon, Trash2, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from './ui/dialog';
import { showSuccess, showError } from '../utils/toast';
import { generateProductImageAndUpload } from '../../services/geminiService'; // NOVO IMPORT

interface ProductFormModalProps {
  trigger: React.ReactNode;
  initialProduct?: RegisteredProduct;
  onSave: (product: Omit<RegisteredProduct, 'id'>, id?: string) => Promise<RegisteredProduct | null>;
  onDelete?: (id: string, name: string) => void;
}

const defaultNewProduct: Omit<RegisteredProduct, 'id'> = {
  name: '',
  defaultPrice: '0.00',
  defaultUnit: 'un',
  description: '',
  image: undefined,
  wholesalePrice: undefined,
  wholesaleUnit: 'un',
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({ trigger, initialProduct, onSave, onDelete }) => {
  const isEditing = !!initialProduct;
  const [product, setProduct] = useState<Omit<RegisteredProduct, 'id'>>(initialProduct || defaultNewProduct);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // Novo estado

  useEffect(() => {
    if (isOpen) {
      // Garante que os campos de atacado sejam inicializados corretamente
      setProduct({
        ...defaultNewProduct,
        ...initialProduct,
        wholesaleUnit: initialProduct?.wholesaleUnit || 'un',
      });
    }
  }, [isOpen, initialProduct]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setProduct(prev => ({ ...prev, image: undefined }));
  };

  const handleGenerateImage = async () => {
    if (!product.name.trim()) {
      showError("Por favor, insira o nome do produto antes de gerar a imagem.");
      return;
    }
    
    setIsGeneratingImage(true);
    const loadingToast = showSuccess(`Gerando imagem para "${product.name}"...`);
    
    try {
      const imageUrl = await generateProductImageAndUpload(product.name);
      setProduct(prev => ({ ...prev, image: imageUrl }));
      showSuccess("Imagem gerada e salva com sucesso!");
    } catch (error) {
      console.error("AI Image Generation Error:", error);
      showError(`Falha ao gerar imagem: ${(error as Error).message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    if (!product.name.trim() || !product.defaultPrice.trim()) {
      showError("Nome e Preço são obrigatórios.");
      return;
    }
    
    setIsLoading(true);
    const result = await onSave(product, initialProduct?.id);
    setIsLoading(false);

    if (result) {
      showSuccess(`Produto "${result.name}" ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
      setIsOpen(false);
    }
  };
  
  const handleDelete = () => {
    if (initialProduct && onDelete) {
      onDelete(initialProduct.id, initialProduct.name);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar Produto: ${initialProduct?.name}` : 'Cadastrar Novo Produto'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os detalhes do produto no seu banco de dados.' : 'Preencha os campos para adicionar um novo produto ao seu catálogo.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex gap-4 items-start">
            {/* Image Upload / Generation */}
            <div className="w-24 h-24 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0 overflow-hidden relative hover:border-indigo-400 transition-colors">
              {isGeneratingImage ? (
                <Loader2 size={32} className="text-indigo-500 animate-spin" />
              ) : product.image ? (
                <img src={product.image} className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <ImageIcon size={20} className="text-gray-400 mx-auto" />
                  <span className="text-[9px] text-gray-400 block mt-1">Foto</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Nome do Produto (Obrigatório)</label>
              <input 
                className="w-full border rounded px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={product.name} 
                onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="Nome do Produto"
              />
              
              <label className="text-xs font-semibold text-gray-700 block pt-1">Descrição (Opcional)</label>
              <textarea 
                className="w-full border rounded px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                value={product.description || ''} 
                onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="Descrição detalhada" 
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <input type="file" id="product-image-upload" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isGeneratingImage} />
            <label htmlFor="product-image-upload" className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 px-3 border rounded cursor-pointer transition-colors ${isGeneratingImage ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-gray-50'}`}>
                <ImageIcon size={14} /> {product.image ? 'Trocar Imagem' : 'Fazer Upload'}
            </label>
            
            <button 
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !product.name.trim()}
              className="flex-1 flex items-center justify-center gap-1 text-xs py-2 px-3 rounded font-bold transition-colors disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGeneratingImage ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              {isGeneratingImage ? 'Gerando...' : 'Gerar Imagem IA'}
            </button>
            
            {product.image && (
              <button onClick={handleRemoveImage} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded border transition-colors">
                  <Trash2 size={12} /> Remover
              </button>
            )}
          </div>

          {/* Seção de Preços de Varejo */}
          <div className="flex gap-2 pt-2 border-t">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Preço Varejo (Padrão)</label>
              <input 
                className="w-full border rounded px-2 py-1 text-sm outline-none" 
                value={product.defaultPrice} 
                onChange={(e) => setProduct(prev => ({ ...prev, defaultPrice: e.target.value }))} 
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Preço Antigo (Varejo)</label>
              <input 
                className="w-full border rounded px-2 py-1 text-sm outline-none" 
                value={product.defaultOldPrice || ''} 
                onChange={(e) => setProduct(prev => ({ ...prev, defaultOldPrice: e.target.value }))} 
                placeholder="0.00 (opcional)"
              />
            </div>
            <div className="w-16">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Unid. Varejo</label>
              <select 
                className="w-full border rounded px-1 py-1 text-sm outline-none bg-white" 
                value={product.defaultUnit} 
                onChange={(e) => setProduct(prev => ({ ...prev, defaultUnit: e.target.value }))}
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
          
          {/* Seção de Preços de Atacado */}
          <div className="flex gap-2 pt-2 border-t border-dashed">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Preço Atacado (Opcional)</label>
              <input 
                className="w-full border rounded px-2 py-1 text-sm outline-none" 
                value={product.wholesalePrice || ''} 
                onChange={(e) => setProduct(prev => ({ ...prev, wholesalePrice: e.target.value }))} 
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Unid. Atacado (Ex: 3un)</label>
              <input 
                className="w-full border rounded px-2 py-1 text-sm outline-none" 
                value={product.wholesaleUnit || ''} 
                onChange={(e) => setProduct(prev => ({ ...prev, wholesaleUnit: e.target.value }))} 
                placeholder="3un, cx, fardo"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          {isEditing && onDelete ? (
            <button 
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              Excluir Produto
            </button>
          ) : <div />}
          
          <button 
            onClick={handleSave}
            disabled={isLoading || isGeneratingImage || !product.name.trim() || !product.defaultPrice.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormModal;