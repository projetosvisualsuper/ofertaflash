import { useState, useEffect, useCallback } from 'react';
import { RegisteredProduct } from '../../types';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError } from '../utils/toast';

// Define a interface para o formato do banco de dados (que usa camelCase para estas colunas)
interface ProductDB {
  id: string;
  name: string;
  description?: string;
  defaultPrice: string;
  defaultOldPrice?: string;
  defaultUnit: string;
  image?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Função auxiliar para mapear do DB para o App
const mapFromDB = (item: ProductDB): RegisteredProduct => ({
  id: item.id,
  name: item.name,
  description: item.description,
  defaultPrice: item.defaultPrice,
  defaultOldPrice: item.defaultOldPrice,
  defaultUnit: item.defaultUnit,
  image: item.image,
});

// Função auxiliar para mapear do App para o DB (para INSERT/UPDATE)
const mapToDB = (product: Partial<Omit<RegisteredProduct, 'id'>>): Partial<ProductDB> => ({
  name: product.name,
  description: product.description,
  defaultPrice: product.defaultPrice,
  defaultOldPrice: product.defaultOldPrice,
  defaultUnit: product.defaultUnit,
  image: product.image,
});


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
      setRegisteredProducts(data.map(mapFromDB));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (product: Omit<RegisteredProduct, 'id'>) => {
    const productForDb = mapToDB(product);

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
    
    const newProduct = mapFromDB(data);

    setRegisteredProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<RegisteredProduct>) => {
    const updatesForDb = mapToDB(updates);

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