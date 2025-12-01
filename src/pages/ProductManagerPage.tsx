import React, { useState } from 'react';
import { Database, Plus, Trash2, Image as ImageIcon, Save, Loader2, XCircle, Edit } from 'lucide-react';
import { useProductDatabase } from '../hooks/useProductDatabase';
import { RegisteredProduct } from '../../types';
import { showSuccess, showError } from '../utils/toast';
import ProductFormModal from '../components/ProductFormModal';

const ProductManagerPage: React.FC = () => {
  const { registeredProducts, addProduct, updateProduct, deleteProduct, loading } = useProductDatabase();
  
  const handleSave = async (product: Omit<RegisteredProduct, 'id'>, id?: string) => {
    if (id) {
      // Edição
      await updateProduct(id, product);
      return { ...product, id } as RegisteredProduct;
    } else {
      // Criação
      return await addProduct(product);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Database size={32} className="text-green-600" />
        Banco de Produtos
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Produtos Cadastrados ({registeredProducts.length})</h3>
          
          <ProductFormModal
            trigger={
              <button 
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
              >
                <Plus size={16} />
                Novo Produto
              </button>
            }
            onSave={handleSave}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="ml-4 text-gray-600">Carregando produtos...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {registeredProducts.map(product => (
              <div key={product.id} className="flex items-center bg-gray-50 border rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-white border border-dashed border-gray-300 rounded flex items-center justify-center shrink-0 overflow-hidden mr-4">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon size={20} className="text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-800 truncate">{product.name}</p>
                  <p className="text-sm text-green-600 font-bold">R$ {product.defaultPrice} / {product.defaultUnit}</p>
                  {product.defaultOldPrice && <p className="text-xs text-gray-500 line-through">De R$ {product.defaultOldPrice}</p>}
                </div>
                
                <ProductFormModal
                  trigger={
                    <button 
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors"
                      title="Editar Produto"
                    >
                      <Edit size={18} />
                    </button>
                  }
                  initialProduct={product}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              </div>
            ))}
            {registeredProducts.length === 0 && (
              <div className="p-8 text-center text-gray-500 border-dashed border-2 rounded-lg">
                  Nenhum produto cadastrado. Use o botão "Novo Produto" para começar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagerPage;