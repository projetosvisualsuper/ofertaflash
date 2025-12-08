import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { Permission } from '../../types';

export interface PlanConfiguration {
  role: string;
  name: string;
  price: string;
  permissions: Permission[];
  ai_credits: number; // NOVO CAMPO
}

export function usePlanConfigurations(isAdmin: boolean = false) {
  const [plans, setPlans] = useState<PlanConfiguration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    
    // Busca todos os planos (RLS permite leitura pública)
    const { data, error } = await supabase
      .from('plan_configurations')
      .select('*')
      .order('role', { ascending: true }); // Ordena para consistência

    if (error) {
      console.error('Error fetching plan configurations:', error);
      // Não mostra erro para o usuário final se não for admin, apenas usa lista vazia
      if (isAdmin) {
        showError('Falha ao carregar configurações de planos.');
      }
      setPlans([]);
    } else {
      setPlans(data as PlanConfiguration[]);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);
  
  const updatePlan = async (role: string, updates: Partial<PlanConfiguration>) => {
    if (!isAdmin) {
      showError("Apenas administradores podem atualizar configurações de planos.");
      return;
    }
    
    const { error } = await supabase
      .from('plan_configurations')
      .update(updates)
      .eq('role', role);

    if (error) {
      console.error('Error updating plan configuration:', error);
      showError(`Falha ao atualizar o plano ${role}.`);
      throw new Error(`Falha ao atualizar o plano ${role}.`); // Lança erro para o modal capturar
    } else {
      showSuccess(`Plano ${updates.name || role} atualizado com sucesso!`);
      await fetchPlans(); 
    }
  };

  return {
    plans,
    loading,
    updatePlan,
    fetchPlans,
  };
}