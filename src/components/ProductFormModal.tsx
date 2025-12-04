import React, { useState, useEffect } from 'react';
import { RegisteredProduct } from '../../types';
import { Plus, Save, Loader2, XCircle, Image as ImageIcon, Trash2, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from './ui/dialog';
import { showSuccess, showError } from '../utils/toast';
import ImageSelectorModal from './ImageSelectorModal';
import { supabase } from '@/src/integrations/supabase/client'; // Importando supabase para upload

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

// Constantes de Limite
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Diretório compartilhado para imagens de produto
const SHARED_IMAGE_DIR = 'shared';

// Função auxiliar para sanitizar o nome do arquivo
const sanitizeFileName = (fileName: string) => {
    const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
    const safeName = nameWithoutExt.trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase();
    const fileExtension = fileName.split('.').pop();
    return `${safeName}.${fileExtension}`;
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({ trigger, initialProduct, onSave, onDelete }) => {
  const isEditing = !!initialProduct;
  const [product, setProduct] = useState<Omit<RegisteredProduct, 'id'>>(initialProduct || defaultNewProduct);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProduct({
        ...defaultNewProduct,
        ...initialProduct,
        wholesaleUnit: initialProduct?.wholesaleUnit || 'un',
      });
    }
  }, [isOpen, initialProduct]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!file || !userId) {
      showError("Erro: Usuário não autenticado ou arquivo não selecionado.");
      return;
    }
    
    if (file.size > MAX_FILE_SIZE_BYTES) {
        showError(`O arquivo é muito grande. O limite é de ${MAX_FILE_SIZE_MB}MB.`);
        return;
    }
    
    // 1. Criar um nome de arquivo seguro baseado no nome original do arquivo
    const safeFileName = sanitizeFileName(file.name);
    // O caminho agora é determinístico: shared/nome-do-arquivo-original.ext
    const filePath = `${SHARED_IMAGE_DIR}/${safeFileName}`;

    setIsLoading(true);

    try {
      // 2. Upload para o Storage (no diretório 'shared')
      // Usamos upsert: true para sobrescrever se o arquivo com o mesmo nome já existir.
      // Isso garante que o mesmo arquivo de imagem não seja duplicado no Storage.
      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, 
        });

      if (uploadError) throw uploadError;

      // 3. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);
        
      if (!urlData.publicUrl) throw new Error("Falha ao obter URL pública.");

      // 4. Atualizar o estado do produto com o URL público
      setProduct(prev => ({ ...prev, image: urlData.publicUrl }));
      showSuccess(`Imagem enviada e adicionada ao banco de imagens!`);

    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      showError("Falha ao enviar a imagem. Verifique as permissões do Storage.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveImage = () => {
    setProduct(prev => ({ ...prev, image: undefined }));
  };
  
  const handleSelectImage = (url: string) => {
    setProduct(prev => ({ ...prev, image: url }));
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
            {/* Image Preview */}
            <div className="w-24 h-24 bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0 overflow-hidden relative hover:border-indigo-400 transition-colors">
              {isLoading ? (
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
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nome do Produto (Obrigatório)</label>
              <input 
                className="w-full border rounded px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={product.name} 
                onChange={(e) => setProduct(prev => ({ ...prev, name: e.target.value }))} 
                placeholder="Nome do Produto"
                disabled={isLoading}
              />
              
              <label className="text-xs font-semibold text-gray-700 block pt-1">Descrição (Opcional)</label>
              <textarea 
                className="w-full border rounded px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                value={product.description || ''} 
                onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))} 
                placeholder="Descrição detalhada" 
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <input type="file" id="product-image-upload" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isLoading} />
            <label htmlFor="product-image-upload" className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 px-3 border rounded cursor-pointer transition-colors ${isLoading ? 'bg-gray-200 text-gray-500' : 'bg-white hover:bg-gray-50'}`}>
                <ImageIcon size={14} /> {isLoading ? 'Enviando...' : product.image ? 'Trocar Imagem (Upload)' : 'Fazer Upload'}
            </label>
            
            <ImageSelectorModal 
              onSelectImage={handleSelectImage}
              trigger={
                <button 
                  type="button"
                  className="flex-1 flex items-center justify-center gap-1 text-xs py-2 px-3 rounded font-bold transition-colors disabled:opacity-50 bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                  disabled={isLoading}
                >
                  <Database size={14} />
                  Banco de Imagens
                </button>
              }
            />
            
            {product.image && (
              <button onClick={handleRemoveImage} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded border transition-colors" disabled={isLoading}>
                  <Trash2 size={12} /> Remover
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">Limite de arquivo: {MAX_FILE_SIZE_MB}MB. Recomendamos imagens com alta resolução (mínimo 2000px) para impressão.</p>

          {/* Seção de Preços de Varejo */}
          <div className="flex gap-2 pt-2 border-t">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Preço Varejo (Padrão)</label>
              <input 
                className="w-full border rounded px-2 py-1 text-sm outline-none" 
                value={product.defaultPrice} 
                onChange={(e) => setProduct(prev => ({ ...prev, defaultPrice: e.target.value }))} 
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Preço Antigo (Varejo)</label>
              <input 
                className="w-full border rounded px-2 py-1 text-sm outline-none" 
                value={product.defaultOldPrice || ''} 
                onChange={(e) => setProduct(prev => ({ ...prev, defaultOldPrice: e.target.value }))} 
                placeholder="0.00 (opcional)"
                disabled={isLoading}
              />
            </div>
            <div className="w-16">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Unid. Varejo</label>
              <select 
                className="w-full border rounded px-1 py-1 text-sm outline-none bg-white" 
                value={product.defaultUnit} 
                onChange={(e) => setProduct(prev => ({ ...prev, defaultUnit: e.target.value }))}
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Unid. Atacado (Ex: 3un)</label>
              <input 
                className="w-full border rounded px-2 py-1 text-sm outline-none" 
                value={product.wholesaleUnit || ''} 
                onChange={(e) => setProduct(prev => ({ ...prev, wholesaleUnit: e.target.value }))} 
                placeholder="3un, cx, fardo"
                disabled={isLoading}
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
            disabled={isLoading || !product.name.trim() || !product.defaultPrice.trim()}
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