import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';
import { WooProduct } from '../../types';

export function useWooCommerceProducts() {
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    let data: any = null;
    let invokeError: any = null;

    try {
      // 1. Chamada da Edge Function
      const result = await supabase.functions.invoke('woocommerce-proxy', {
          method: 'GET',
      });
      
      data = result.data;
      invokeError = result.error;

      if (!isMounted.current) return;

      if (invokeError) {
        // Se o SDK retornou um erro de invocação (rede, CORS, etc.)
        // Se for o erro genérico, tentamos extrair a mensagem de erro da Edge Function
        const edgeFunctionError = data?.error || invokeError.message;
        throw new Error(edgeFunctionError); 
      }
      
      if (data.error) {
        // Se a Edge Function retornou um erro (ex: chaves não configuradas)
        throw new Error(data.error);
      }
      
      setProducts(data.products || []);

    } catch (err) {
      if (!isMounted.current) return;
      
      const errorMessage = (err as Error).message;
      console.error('WooCommerce Fetch Error:', errorMessage);
      
      let userMessage = 'Falha ao carregar produtos do WooCommerce.';
      
      // Tratamento de erros específicos
      if (errorMessage.includes('not configured in Supabase Secrets')) {
          userMessage = 'Erro: Chaves de API do WooCommerce não configuradas no Supabase Secrets.';
      } else if (errorMessage.includes('WooCommerce API returned status 401')) {
          userMessage = 'Erro 401: Chaves de API inválidas ou sem permissão de Leitura.';
      } else if (errorMessage.includes('WooCommerce API returned status 404')) {
          userMessage = 'Erro 404: URL do WooCommerce incorreta ou endpoint da API não encontrado.';
      } else if (errorMessage.includes('WooCommerce API returned status')) {
          // Captura qualquer outro erro de status retornado pela Edge Function
          userMessage = `Erro de API do WooCommerce: ${errorMessage}`;
      } else if (errorMessage.includes('Failed to fetch')) {
          userMessage = 'Erro de rede ao tentar conectar com o WooCommerce. Verifique a URL.';
      } else if (errorMessage.includes('Edge Function returned a non-2xx status code')) {
          // Se ainda for o erro genérico, mantemos a mensagem de erro de conexão
          userMessage = 'Erro de conexão com o servidor. Verifique a URL e as chaves no Supabase Secrets.';
      } else {
          userMessage = errorMessage;
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