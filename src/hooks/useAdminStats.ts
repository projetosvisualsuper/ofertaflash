import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';

export interface FormatUsage {
  format_name: string;
  total_count: number;
}

export interface PlanUsage {
  role: string;
  total_arts: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  paid_subscriptions: number;
  recent_signups_7d: number;
  format_usage: FormatUsage[];
  plan_usage: PlanUsage[];
}

const initialStats: AdminStats = {
  total_users: 0,
  active_users: 0,
  paid_subscriptions: 0,
  recent_signups_7d: 0,
  format_usage: [],
  plan_usage: [],
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-reports', {
        method: 'GET',
      });

      if (error) throw error;
      
      const { mainStats, formatUsage, planUsage } = data;

      const mainData = mainStats || initialStats;

      setStats({
        total_users: parseInt(mainData.total_users as any, 10) || 0,
        active_users: parseInt(mainData.active_users as any, 10) || 0,
        paid_subscriptions: parseInt(mainData.paid_subscriptions as any, 10) || 0,
        recent_signups_7d: parseInt(mainData.recent_signups_7d as any, 10) || 0,
        format_usage: formatUsage as FormatUsage[],
        plan_usage: planUsage as PlanUsage[],
      });

    } catch (error) {
      console.error('Error fetching admin stats:', error);
      showError('Falha ao carregar estatísticas do painel de administração.');
      setStats(initialStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats };
}