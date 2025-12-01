import { useState, useEffect, useCallback } from 'react';
import { RegisteredProduct } from '../../types';
import supabase from '@/src/integrations/supabase/client';
import { showSuccess, showError } from '../utils/toast';

export function useProductDatabase() {
  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      showError('Falha ao carregar produtos do banco de dados.');
      setRegisteredProducts([]);
    } else {
      // Mapear os nomes das colunas do banco de dados para as propriedades do objeto
      const mappedData = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        defaultPrice: item.defaultPrice,
        defaultOldPrice: item.defaultOldPrice,
        defaultUnit: item.defaultUnit,
        image: item.image,
      }));
      setRegisteredProducts(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (product: Omit<RegisteredProduct, 'id'>) => {
    // Mapear para o formato do banco de dados
    const productForDb = {
      name: product.name,
      description: product.description,
      defaultPrice: product.defaultPrice,
      defaultOldPrice: product.defaultOldPrice,
      defaultUnit: product.defaultUnit,
      image: product.image,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(productForDb)
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      showError(`Falha ao cadastrar o produto "${product.name}".`);
      return null;
    }
    
    // Mapear a resposta de volta para o formato do app
    const newProduct = {
      id: data.id,
      name: data.name,
      description: data.description,
      defaultPrice: data.defaultPrice,
      defaultOldPrice: data.defaultOldPrice,
      defaultUnit: data.defaultUnit,
      image: data.image,
    };

    setRegisteredProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<RegisteredProduct>) => {
    // Mapear para o formato do banco de dados
    const updatesForDb = {
      name: updates.name,
      description: updates.description,
      defaultPrice: updates.defaultPrice,
      defaultOldPrice: updates.defaultOldPrice,
      defaultUnit: updates.defaultUnit,
      image: updates.image,
    };

    const { error } = await supabase
      .from('products')
      .update(updatesForDb)
      .eq('id', id);

    if (error) {
      console.error('Error updating product:', error);
      showError('Falha ao atualizar o produto.');
    } else {
      setRegisteredProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, ...updates } : p))
      );
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      showError('Falha ao excluir o produto.');
    } else {
      setRegisteredProducts(prev => prev.filter(p => p.id !== id));
      showSuccess('Produto excluído com sucesso.');
    }
  };

  return {
    registeredProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    loading,
  };
}