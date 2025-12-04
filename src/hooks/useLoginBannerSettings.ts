import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';

export interface LoginBannerSettings {
  title: string;
  subtitle: string;
  features: string[];
}

const defaultSettings: LoginBannerSettings = {
  title: 'OfertaFlash Builder',
  subtitle: 'Entre para criar suas campanhas de marketing com IA.',
  features: ['Criação Rápida', 'Templates Profissionais', 'Exportação para Redes Sociais'],
};

export function useLoginBannerSettings() {
  const [settings, setSettings] = useState<LoginBannerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    
    // Busca o primeiro (e único) registro
    const { data, error } = await supabase
      .from('login_banner_settings')
      .select('title, subtitle, features')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Error fetching login banner settings:', error);
      // Em caso de erro, usamos os valores padrão
    }

    if (data) {
      setSettings({
        title: data.title || defaultSettings.title,
        subtitle: data.subtitle || defaultSettings.subtitle,
        // Garante que features seja um array de strings
        features: Array.isArray(data.features) ? data.features.filter(f => typeof f === 'string') : defaultSettings.features,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading };
}