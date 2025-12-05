import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';

export interface UserCredits {
  balance: number;
  lastRefillAt: string;
}

const initialCredits: UserCredits = {
  balance: 0,
  lastRefillAt: new Date().toISOString(),
};

export function useUserCredits(userId: string | undefined) {
  const [credits, setCredits] = useState<UserCredits>(initialCredits);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance, last_refill_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Error fetching user credits:', error);
      showError('Falha ao carregar saldo de créditos.');
      setCredits(initialCredits);
    } else if (data) {
      setCredits({
        balance: data.balance,
        lastRefillAt: data.last_refill_at,
      });
    } else {
        // Se não houver registro, assume 0 e espera que o trigger de perfil crie um.
        setCredits(initialCredits);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  /**
   * Função para consumir créditos. Deve ser chamada APENAS no frontend
   * para recursos que não são Edge Functions (ex: para simulação ou UI).
   * Para Edge Functions, use a função de consumo no backend.
   * @param amount Quantidade de créditos a consumir (deve ser positivo).
   */
  const consumeCredits = useCallback(async (amount: number) => {
    if (!userId) return false;
    if (amount <= 0) return true; // Nada para consumir

    // Chamamos uma função RPC para garantir a atomicidade da transação no DB
    const { data, error } = await supabase.rpc('consume_ai_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_description: 'Consumo via Frontend (Ajuste Manual)',
    });

    if (error) {
        console.error('Error consuming credits via RPC:', error);
        showError('Falha ao consumir créditos. Saldo insuficiente ou erro de servidor.');
        return false;
    }
    
    // Atualiza o estado local com o novo saldo retornado pela RPC
    setCredits(prev => ({ ...prev, balance: data as number }));
    return true;
  }, [userId]);

  return {
    credits,
    loading,
    fetchCredits,
    consumeCredits,
    setCredits, // Exporta para permitir atualizações diretas (ex: após compra)
  };
}