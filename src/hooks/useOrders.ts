import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { Order } from '../../types';

// Mapeamento de colunas do DB para o Front (snake_case para camelCase)
const mapFromDB = (item: any): Order => ({
  id: item.id,
  user_id: item.user_id,
  title: item.title,
  description: item.description,
  status: item.status,
  priority: item.priority,
  assigned_to: item.assigned_to,
  order_number: item.order_number,
  entry_date: item.entry_date,
  estimated_delivery_date: item.estimated_delivery_date,
  created_at: item.created_at,
  updated_at: item.updated_at,
  creator_username: item.profiles?.username, // Assumindo que a query faz join com profiles
  assigned_username: item.assigned_profiles?.username, // Assumindo que a query faz join com assigned_profiles
});

export function useOrders(userId: string | undefined, isAdmin: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // A query usa a RLS para filtrar, mas para obter os nomes de usuário,
    // precisamos de uma junção (join) com a tabela profiles.
    // Usaremos a sintaxe de junção do PostgREST: select('*, profiles(username)')
    
    // Para obter o nome do criador (user_id) e do atribuído (assigned_to), precisamos de duas junções.
    // O PostgREST permite renomear a junção usando aliases.
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey(username),
        assigned_profiles:profiles!orders_assigned_to_fkey(username)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      showError('Falha ao carregar pedidos.');
      setOrders([]);
    } else {
      setOrders(data.map(mapFromDB));
    }
    setLoading(false);
  }, [userId, isAdmin]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (order: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return null;
    
    const orderForDb = {
        user_id: userId,
        title: order.title,
        description: order.description,
        status: order.status,
        priority: order.priority,
        assigned_to: order.assigned_to,
        order_number: order.order_number,
        entry_date: order.entry_date,
        estimated_delivery_date: order.estimated_delivery_date,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderForDb)
      .select(`
        *,
        profiles!orders_user_id_fkey(username),
        assigned_profiles:profiles!orders_assigned_to_fkey(username)
      `)
      .single();

    if (error) {
      console.error('Error adding order:', error);
      showError(`Falha ao criar o pedido "${order.title}".`);
      return null;
    }
    
    const newOrder = mapFromDB(data);
    setOrders(prev => [newOrder, ...prev]);
    showSuccess(`Pedido "${newOrder.title}" criado com sucesso!`);
    return newOrder;
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    if (!userId) return;
    
    // Mapeia de volta para snake_case para o DB
    const updatesForDb: any = {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        assigned_to: updates.assigned_to,
        order_number: updates.order_number,
        entry_date: updates.entry_date,
        estimated_delivery_date: updates.estimated_delivery_date,
    };

    const { error } = await supabase
      .from('orders')
      .update(updatesForDb)
      .eq('id', id); // RLS garante que apenas o dono/atribuído/admin pode atualizar

    if (error) {
      console.error('Error updating order:', error);
      showError('Falha ao atualizar o pedido.');
    } else {
      showSuccess('Pedido atualizado com sucesso.');
      // Força o refresh para obter os nomes de usuário atualizados
      fetchOrders(); 
    }
  };

  const deleteOrder = async (id: string) => {
    if (!userId) return;
    
    // Usamos soft delete (deleted_at)
    const { error } = await supabase
      .from('orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      showError('Falha ao excluir o pedido.');
    } else {
      setOrders(prev => prev.filter(o => o.id !== id));
      showSuccess('Pedido excluído com sucesso.');
    }
  };

  return {
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    loading,
    fetchOrders,
  };
}