import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';

export interface AICost {
  service_key: string;
  cost: number;
  description: string;
}

const initialCosts: Record<string, number> = {
  generate_copy: 1,
  parse_products: 1,
  generate_image: 10,
  generate_ad_script: 1,
  generate_audio: 5,
};

export function useAICosts(isAdmin: boolean = false) {
  const [costs, setCosts] = useState<AICost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mapeamento rápido para uso em componentes
  const costMap = costs.reduce((acc, item) => {
    acc[item.service_key] = item.cost;
    return acc;
  }, {} as Record<string, number>);

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    
    // RLS permite que qualquer usuário leia, mas apenas admins podem escrever.
    const { data, error } = await supabase
      .from('ai_costs')
      .select('*')
      .order('service_key', { ascending: true });

    if (error) {
      console.error('Error fetching AI costs:', error);
      if (isAdmin) {
        showError('Falha ao carregar custos de IA.');
      }
      setCosts([]);
    } else {
      setCosts(data as AICost[]);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);
  
  const updateCost = async (serviceKey: string, newCost: number, description: string) => {
    if (!isAdmin) {
      showError("Apenas administradores podem alterar os custos de IA.");
      return;
    }
    
    const { error } = await supabase
      .from('ai_costs')
      .upsert({ service_key: serviceKey, cost: newCost, description: description, updated_at: new Date().toISOString() }, { onConflict: 'service_key' });

    if (error) {
      console.error('Error updating AI cost:', error);
      showError(`Falha ao atualizar o custo de ${serviceKey}.`);
      throw new Error(`Falha ao atualizar o custo de ${serviceKey}.`);
    } else {
      showSuccess(`Custo de ${serviceKey} atualizado para ${newCost} créditos.`);
      await fetchCosts();
    }
  };

  return {
    costs,
    costMap: { ...initialCosts, ...costMap }, // Garante que os valores iniciais existam como fallback
    loading,
    updateCost,
    fetchCosts,
  };
}