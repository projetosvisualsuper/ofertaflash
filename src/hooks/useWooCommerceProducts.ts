import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';
import { WooProduct } from '../../types';

export function useWooCommerceProducts() {
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('woocommerce-proxy', {
        method: 'GET',
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setProducts(data.products || []);

    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('WooCommerce Fetch Error:', errorMessage);
      
      let userMessage = 'Falha ao carregar produtos do WooCommerce.';
      if (errorMessage.includes('not configured')) {
          userMessage = 'Erro: Chaves de API do WooCommerce não configuradas no Supabase Secrets.';
      } else if (errorMessage.includes('WooCommerce API failed')) {
          userMessage = 'Erro de comunicação com a API do WooCommerce. Verifique a URL e as chaves.';
      }
      
      setError(userMessage);
      // Removendo showError daqui para evitar a repetição de toasts
      // O componente WooCommerceBanner já exibe o erro usando o estado 'error'
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, fetchProducts };
}