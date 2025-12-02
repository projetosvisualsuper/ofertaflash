import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';

export interface GlobalAnnouncement {
  id: string;
  message: string | string[]; // Pode ser string ou array de strings
  is_active: boolean;
  created_at: string;
}

export function useGlobalAnnouncement() {
  const [announcement, setAnnouncement] = useState<GlobalAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncement = useCallback(async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('global_announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Error fetching global announcement:', error);
      setAnnouncement(null);
    } else if (data) {
      let rawMessage = data.message;
      let messageArray: string[] = [];

      if (Array.isArray(rawMessage)) {
        // Caso ideal: já é um array
        messageArray = rawMessage;
      } else if (typeof rawMessage === 'string') {
        // Tenta analisar se é uma string JSON (o que acontece se o PostgREST não analisar o JSONB)
        try {
          const parsed = JSON.parse(rawMessage);
          if (Array.isArray(parsed)) {
            messageArray = parsed;
          } else {
            // Se a análise falhar ou não for um array, trata como uma única linha de texto
            messageArray = [rawMessage];
          }
        } catch (e) {
          // Se a análise JSON falhar, trata como uma única linha de texto
          messageArray = [rawMessage];
        }
      }
      
      // Filtra linhas vazias e garante que todas as mensagens sejam strings
      const finalMessages = messageArray
        .map(line => String(line).trim())
        .filter(line => line.length > 0);
        
      setAnnouncement({ ...data, message: finalMessages } as GlobalAnnouncement);
    } else {
      setAnnouncement(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  return {
    announcement,
    loading,
    fetchAnnouncement,
  };
}