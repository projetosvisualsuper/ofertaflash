import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { SocialMediaAccount } from '../../types';

// Mapeamento do DB para o App
const mapFromDB = (item: any): SocialMediaAccount => ({
  id: item.id,
  platform: item.platform,
  accessToken: item.access_token,
  expiresAt: item.expires_at,
  accountId: item.account_id,
  accountName: item.account_name,
});

export function useSocialMediaAccounts(userId: string | undefined) {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching social media accounts:', error);
      showError('Falha ao carregar contas de redes sociais.');
      setAccounts([]);
    } else {
      setAccounts(data.map(mapFromDB));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const deleteAccount = async (id: string, platformName: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from('social_media_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting social account:', error);
      showError(`Falha ao desconectar a conta ${platformName}.`);
    } else {
      setAccounts(prev => prev.filter(a => a.id !== id));
      showSuccess(`Conta ${platformName} desconectada com sucesso.`);
    }
  };

  return {
    accounts,
    loading,
    fetchAccounts,
    deleteAccount,
  };
}