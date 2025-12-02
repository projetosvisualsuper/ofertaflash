import { useState, useEffect, useCallback } from 'react';
import { Product } from '../../types';
import { supabase } from '@/src/integrations/supabase/client';
import { INITIAL_PRODUCTS } from '../state/initialState';
import { showError } from '../utils/toast';

// Define a estrutura do DB para a lista de produtos
interface UserProductsDB {
  id: string;
  user_id: string;
  products: Product[];
}

export function usePosterProducts(userId: string | undefined) {
  const [products, setProductsState] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [dbRowId, setDbRowId] = useState<string | null>(null);

  // 1. Fetch initial products
  const fetchProducts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_products')
      .select('id, products')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Error fetching user products:', error);
      showError('Falha ao carregar produtos do cartaz.');
    }

    if (data) {
      setProductsState(data.products);
      setDbRowId(data.id);
    } else {
      // If no settings found, save the initial theme immediately
      // Passamos o estado inicial para a função de salvar
      await saveProducts(INITIAL_PRODUCTS, null); 
    }
    setLoading(false);
  }, [userId]);

  // 2. Save products function (UPSERT)
  // Adicionamos dbRowId como parâmetro para controlar o estado de INSERT/UPDATE
  const saveProducts = useCallback(async (newProducts: Product[], currentDbRowId: string | null = dbRowId) => {
    if (!userId) return;

    const productData = {
      user_id: userId,
      products: newProducts,
    };
    
    // Se tivermos um ID de linha, usamos ele para o upsert.
    // Se não tivermos, confiamos no onConflict: 'user_id' para fazer o INSERT ou UPDATE.
    const payload = currentDbRowId ? { ...productData, id: currentDbRowId } : productData;

    const { data, error } = await supabase
      .from('user_products')
      .upsert(payload, { onConflict: 'user_id' })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving user products:', error);
      showError('Falha ao salvar produtos do cartaz.');
    } else if (data) {
      setDbRowId(data.id);
    }
  }, [userId, dbRowId]);

  // 3. Effect to fetch on mount/userId change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // 4. Function to update state and trigger save
  const setProducts = useCallback((newProducts: Product[] | ((prev: Product[]) => Product[])) => {
    setProductsState(prev => {
      const updatedProducts = typeof newProducts === 'function' ? newProducts(prev) : newProducts;
      // Chamamos saveProducts sem passar o dbRowId, usando o estado interno
      saveProducts(updatedProducts); 
      return updatedProducts;
    });
  }, [saveProducts]);

  return { products, setProducts, loading };
}