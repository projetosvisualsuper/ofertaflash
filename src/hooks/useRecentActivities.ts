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
      // 1. Buscar os 5 usuários mais recentes (Signups)
      const { data: usersData, error: usersError } = await supabase
        .from('admin_users_view')
        .select('id, email, username, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (usersError) throw usersError;

      const signupActivities: Activity[] = usersData.map(user => ({
        id: user.id,
        type: 'signup',
        description: `Novo cliente cadastrado: ${user.username || user.email}`,
        timestamp: user.created_at,
        user_id: user.id,
        details: user.email || undefined,
      }));

      // 2. Buscar as 5 artes salvas mais recentes
      const { data: artsData, error: artsError } = await supabase
        .from('saved_images')
        .select('id, created_at, format_name, user_id, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (artsError) throw artsError;

      const savedArtActivities: Activity[] = artsData.map(art => ({
        id: art.id,
        type: 'saved_art',
        description: `Arte salva (${art.format_name}) por ${art.profiles?.username || 'Usuário'}`,
        timestamp: art.created_at,
        user_id: art.user_id,
        details: art.format_name,
      }));

      // 3. Combinar e ordenar por timestamp
      const combinedActivities = [...signupActivities, ...savedArtActivities]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5); // Limita aos 5 mais recentes

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