import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';

export interface Activity {
  id: string;
  type: 'signup' | 'saved_art';
  description: string;
  timestamp: string;
  user_id: string;
  details?: string;
}

export function useRecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    
    try {
      // Chamada única para a Edge Function que retorna todas as estatísticas e atividades
      const { data, error } = await supabase.functions.invoke('admin-reports', {
        method: 'GET',
      });

      if (error) throw error;
      
      // A Edge Function retorna as atividades em 'recentActivities'
      const combinedActivities = data.recentActivities || [];

      setActivities(combinedActivities);

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      showError('Falha ao carregar atividades recentes.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, loading };
}