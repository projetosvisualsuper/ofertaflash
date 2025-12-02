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
      await saveProducts(INITIAL_PRODUCTS, null); 
    }
    setLoading(false);
  }, [userId]);

  // 2. Save products function (UPSERT)
  const saveProducts = useCallback(async (newProducts: Product[], currentDbRowId: string | null = dbRowId) => {
    if (!userId) return;

    const productData = {
      user_id: userId,
      products: newProducts,
    };
    
    // Usamos o user_id como chave de conflito. O payload deve ser o mesmo para INSERT e UPDATE.
    // O Supabase/PostgREST irá gerenciar se deve inserir ou atualizar com base no 'onConflict'.
    const { data, error } = await supabase
      .from('user_products')
      .upsert(productData, { onConflict: 'user_id' })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving user products:', error);
      // Removendo o showError aqui para evitar loop de erro no carregamento inicial,
      // mas mantendo o console.error para debug.
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
      saveProducts(updatedProducts); 
      return updatedProducts;
    });
  }, [saveProducts]);

  return { products, setProducts, loading };
}