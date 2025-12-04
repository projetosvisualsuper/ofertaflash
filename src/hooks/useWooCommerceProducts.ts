import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';
import { WooProduct } from '../../types';

export function useWooCommerceProducts() {
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true); // Referência para rastrear se o componente está montado

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!isMounted.current) return; // Proteção extra
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('woocommerce-proxy', {
        method: 'GET',
      });

      if (!isMounted.current) return;

      if (invokeError) {
        throw new Error(invokeError.message);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setProducts(data.products || []);

    } catch (err) {
      if (!isMounted.current) return;
      
      const errorMessage = (err as Error).message;
      console.error('WooCommerce Fetch Error:', errorMessage);
      
      let userMessage = 'Falha ao carregar produtos do WooCommerce.';
      if (errorMessage.includes('not configured')) {
          userMessage = 'Erro: Chaves de API do WooCommerce não configuradas no Supabase Secrets.';
      } else if (errorMessage.includes('WooCommerce API failed')) {
          userMessage = 'Erro de comunicação com a API do WooCommerce. Verifique a URL e as chaves.';
      }
      
      setError(userMessage);
      setProducts([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, fetchProducts };
}