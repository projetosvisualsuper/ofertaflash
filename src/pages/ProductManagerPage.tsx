import React, { useState } from 'react';
import { Database, Plus, Trash2, Image as ImageIcon, Save, Loader2, XCircle } from 'lucide-react';
import { useProductDatabase } from '../hooks/useProductDatabase';
import { RegisteredProduct } from '../../types';
import { showSuccess, showError } from '../utils/toast';

const ProductManagerPage: React.FC = () => {
  const { registeredProducts, addProduct, updateProduct, deleteProduct } = useProductDatabase();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<RegisteredProduct, 'id'>>({
    name: '',
    defaultPrice: '0.00',
    defaultUnit: 'un',
    description: '',
    image: undefined,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, productId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        if (productId) {
          updateProduct(productId, { image: base64Image });
        } else {
          setNewProduct(prev => ({ ...prev, image: base64Image }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNewProduct = () => {
    if (!newProduct.name.trim() || !newProduct.defaultPrice.trim()) {
      showError("Nome e Preço são obrigatórios.");
      return;
    }
    addProduct(newProduct);
    showSuccess(`Produto "${newProduct.name}" cadastrado com sucesso!`);
    setNewProduct({ name: '', defaultPrice: '0.00', defaultUnit: 'un', description: '', image: undefined });
    setIsAdding(false);
  };
  
  const handleUpdateField = (id: string, field: keyof RegisteredProduct, value: string) => {
    updateProduct(id, { [field]: value });
  };

  const handleRemoveImage = (id: string) => {
    updateProduct(id, { image: undefined });
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Database size={32} className="text-green-600" />
        Banco de Produtos Local
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Produtos Cadastrados ({registeredProducts.length})</h3>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            {isAdding ? <XCircle size={16} /> : <Plus size={16} />}
            {isAdding ? 'Cancelar' : 'Novo Produto'}
          </button>
        </div>

        {/* Formulário de Adição */}
        {isAdding && (
          <div className="p-4 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50 space-y-3">
            <h4 className="font-bold text-indigo-800">Adicionar Novo Produto</h4>
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0 overflow-hidden relative hover:border-indigo-400 transition-colors">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleImageUpload(e)}/>
                {newProduct.image ? (<img src={newProduct.image} className="w-full h-full object-contain" />) : (<div className="text-center"><ImageIcon size={20} className="text-gray-400 mx-auto" /><span className="text-[9px] text-gray-400 block mt-1">Foto</span></div>)}
              </div>
              <div className="flex-1 space-y-2">
                <input className="w-full border rounded px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" value={newProduct.name} onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome do Produto (Obrigatório)"/>
                <textarea className="w-full border rounded px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={newProduct.description || ''} onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))} placeholder="Descrição (opcional)" rows={2}/>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold">Preço Padrão</label><input className="w-full border rounded px-2 py-1 text-sm outline-none" value={newProduct.defaultPrice} onChange={(e) => setNewProduct(prev => ({ ...prev, defaultPrice: e.target.value }))} placeholder="0.00"/></div>
              <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold">Preço Antigo</label><input className="w-full border rounded px-2 py-1 text-sm outline-none" value={newProduct.defaultOldPrice || ''} onChange={(e) => setNewProduct(prev => ({ ...prev, defaultOldPrice: e.target.value }))} placeholder="0.00 (opcional)"/></div>
              <div className="w-16"><label className="text-[10px] text-gray-500 uppercase font-bold">Unid.</label><select className="w-full border rounded px-1 py-1 text-sm outline-none bg-white" value={newProduct.defaultUnit} onChange={(e) => setNewProduct(prev => ({ ...prev, defaultUnit: e.target.value }))}><option value="un">un</option><option value="kg">kg</option><option value="g">g</option><option value="lt">lt</option><option value="ml">ml</option><option value="cx">cx</option></select></div>
            </div>
            <button 
              onClick={handleSaveNewProduct}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              <Save size={16} />
              Salvar Produto
            </button>
          </div>
        )}

        {/* Lista de Produtos Cadastrados */}
        <div className="space-y-4">
          {registeredProducts.map(product => (
            <details key={product.id} className="bg-gray-50 border rounded-lg shadow-sm hover:shadow-md transition-shadow group" open>
              <summary className="p-3 flex gap-3 items-start cursor-pointer">
                <div className="w-20 h-20 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0 overflow-hidden relative hover:border-indigo-400 transition-colors">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleImageUpload(e, product.id)}/>
                  {product.image ? (<img src={product.image} className="w-full h-full object-contain" />) : (<div className="text-center"><ImageIcon size={20} className="text-gray-400 mx-auto" /><span className="text-[9px] text-gray-400 block mt-1">Foto</span></div>)}
                </div>
                <div className="flex-1 space-y-1">
                  <input className="w-full border rounded px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" value={product.name} onChange={(e) => handleUpdateField(product.id, 'name', e.target.value)} placeholder="Título do Produto"/>
                  <p className="text-xs text-gray-600">R$ {product.defaultPrice} / {product.defaultUnit} {product.defaultOldPrice && `(De R$ ${product.defaultOldPrice})`}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{product.description || 'Sem descrição.'}</p>
                </div>
                <button onClick={() => deleteProduct(product.id)} className="text-gray-400 hover:text-red-500" title="Remover"><Trash2 size={16} /></button>
              </summary>
              <div className="border-t bg-white p-3 space-y-2">
                <textarea className="w-full border rounded px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={product.description || ''} onChange={(e) => handleUpdateField(product.id, 'description', e.target.value)} placeholder="Descrição (opcional)" rows={2}/>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold">Preço Padrão</label><input className="w-full border rounded px-2 py-1 text-sm outline-none" value={product.defaultPrice} onChange={(e) => handleUpdateField(product.id, 'defaultPrice', e.target.value)}/></div>
                  <div className="flex-1"><label className="text-[10px] text-gray-500 uppercase font-bold">Preço Antigo</label><input className="w-full border rounded px-2 py-1 text-sm outline-none" value={product.defaultOldPrice || ''} onChange={(e) => handleUpdateField(product.id, 'defaultOldPrice', e.target.value)}/></div>
                  <div className="w-16"><label className="text-[10px] text-gray-500 uppercase font-bold">Unid.</label><select className="w-full border rounded px-1 py-1 text-sm outline-none bg-white" value={product.defaultUnit} onChange={(e) => handleUpdateField(product.id, 'defaultUnit', e.target.value)}><option value="un">un</option><option value="kg">kg</option><option value="g">g</option><option value="lt">lt</option><option value="ml">ml</option><option value="cx">cx</option></select></div>
                </div>
                {product.image && (
                    <button onClick={() => handleRemoveImage(product.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-2">
                        <Trash2 size={12} /> Remover Imagem
                    </button>
                )}
              </div>
            </details>
          ))}
          {registeredProducts.length === 0 && (
            <div className="p-4 text-center text-gray-500 border-dashed border-2 rounded-lg">
                Nenhum produto cadastrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagerPage;