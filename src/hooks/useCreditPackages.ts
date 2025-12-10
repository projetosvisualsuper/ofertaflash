import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';

export interface CreditPackage {
  id: string;
  name: string;
  amount: number;
  price: number;
  description: string;
  is_active: boolean;
}

interface CreditPackageDB {
  id: string;
  name: string;
  amount: number;
  price: string; // Vem como string do DB
  description: string;
  is_active: boolean;
}

const mapFromDB = (item: CreditPackageDB): CreditPackage => ({
  id: item.id,
  name: item.name,
  amount: item.amount,
  price: parseFloat(item.price), // Converte para número
  description: item.description,
  is_active: item.is_active,
});

export function useCreditPackages(isAdmin: boolean = false) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    
    // Se for admin, busca todos, senão, busca apenas os ativos (RLS cuida disso)
    const query = supabase
      .from('credit_packages')
      .select('*')
      .order('amount', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching credit packages:', error);
      if (isAdmin) {
        showError('Falha ao carregar pacotes de crédito.');
      }
      setPackages([]);
    } else {
      setPackages(data.map(mapFromDB));
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);
  
  const updatePackage = async (id: string, updates: Partial<Omit<CreditPackage, 'id'>>) => {
    if (!isAdmin) {
      showError("Apenas administradores podem atualizar pacotes de crédito.");
      return;
    }
    
    // Mapeia de volta para o formato do DB (price como string)
    const updatesForDb = {
        ...updates,
        price: updates.price !== undefined ? updates.price.toFixed(2) : undefined,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('credit_packages')
      .update(updatesForDb)
      .eq('id', id);

    if (error) {
      console.error('Error updating credit package:', error);
      showError(`Falha ao atualizar o pacote.`);
      throw new Error(`Falha ao atualizar o pacote.`);
    } else {
      showSuccess(`Pacote atualizado com sucesso!`);
      await fetchPackages(); 
    }
  };
  
  const addPackage = async (newPackage: Omit<CreditPackage, 'id' | 'is_active'>) => {
    if (!isAdmin) {
      showError("Apenas administradores podem adicionar pacotes de crédito.");
      return;
    }
    
    const packageForDb = {
        ...newPackage,
        price: newPackage.price.toFixed(2),
    };

    const { error } = await supabase
      .from('credit_packages')
      .insert(packageForDb);

    if (error) {
      console.error('Error adding credit package:', error);
      showError(`Falha ao adicionar o pacote.`);
      throw new Error(`Falha ao adicionar o pacote.`);
    } else {
      showSuccess(`Pacote "${newPackage.name}" adicionado com sucesso!`);
      await fetchPackages(); 
    }
  };
  
  const deletePackage = async (id: string) => {
    if (!isAdmin) {
      showError("Apenas administradores podem excluir pacotes de crédito.");
      return;
    }
    
    const { error } = await supabase
      .from('credit_packages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting credit package:', error);
      showError('Falha ao excluir o pacote.');
      throw new Error('Falha ao excluir o pacote.');
    } else {
      showSuccess('Pacote excluído com sucesso.');
      await fetchPackages();
    }
  };

  return {
    packages,
    loading,
    updatePackage,
    addPackage,
    deletePackage,
    fetchPackages,
  };
}