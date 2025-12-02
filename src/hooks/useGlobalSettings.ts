import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';

export interface MaintenanceMode {
  enabled: boolean;
}

export interface GlobalSettings {
  maintenance_mode: MaintenanceMode;
}

const initialSettings: GlobalSettings = {
  maintenance_mode: { enabled: false },
};

export function useGlobalSettings(isAdmin: boolean = false) {
  const [settings, setSettings] = useState<GlobalSettings>(initialSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('global_settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching global settings:', error);
      // Em caso de erro, usamos os valores iniciais
    } else if (data) {
      const newSettings: Partial<GlobalSettings> = {};
      data.forEach(item => {
        if (item.key === 'maintenance_mode') {
          newSettings.maintenance_mode = item.value as MaintenanceMode;
        }
      });
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateMaintenanceMode = useCallback(async (enabled: boolean) => {
    if (!isAdmin) {
      showError("Apenas administradores podem alterar as configurações globais.");
      return;
    }
    
    const newValue = { enabled };
    
    const { error } = await supabase
      .from('global_settings')
      .update({ value: newValue, updated_at: new Date().toISOString() })
      .eq('key', 'maintenance_mode');

    if (error) {
      console.error('Error updating maintenance mode:', error);
      showError('Falha ao atualizar o modo manutenção.');
    } else {
      setSettings(prev => ({ ...prev, maintenance_mode: newValue }));
      showSuccess(`Modo Manutenção ${enabled ? 'ATIVADO' : 'DESATIVADO'} com sucesso!`);
    }
  }, [isAdmin]);

  return {
    settings,
    loading,
    updateMaintenanceMode,
    fetchSettings,
  };
}