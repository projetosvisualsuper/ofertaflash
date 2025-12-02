import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { Order } from '../../types';

// Tipagem para o formato de dados do DB (snake_case)
interface OrderDB {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  order_number: string | null;
  entry_date: string | null;
  estimated_delivery_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Campos de junção (se houver)
  profiles?: { username: string | null } | null;
  assigned_profile?: { username: string | null } | null;
}

// Mapeamento do DB (snake_case) para o App (camelCase)
const mapFromDB = (item: OrderDB): Order => ({
  id: item.id,
  user_id: item.user_id,
  title: item.title,
  description: item.description,
  status: item.status as Order['status'],
  priority: item.priority as Order['priority'],
  assigned_to: item.assigned_to,
  order_number: item.order_number,
  entry_date: item.entry_date,
  estimated_delivery_date: item.estimated_delivery_date,
  created_at: item.created_at,
  updated_at: item.updated_at,
  // Adiciona nomes de usuário para exibição
  creator_username: item.profiles?.username || 'N/A',
  assigned_username: item.assigned_profile?.username || 'Não Atribuído',
});

// Mapeamento do App (camelCase) para o DB (snake_case)
const mapToDB = (order: Partial<Omit<Order, 'id' | 'created_at' | 'updated_at' | 'creator_username' | 'assigned_username'>>): Partial<OrderDB> => ({
  user_id: order.user_id,
  title: order.title,
  description: order.description,
  status: order.status,
  priority: order.priority,
  assigned_to: order.assigned_to,
  order_number: order.order_number,
  entry_date: order.entry_date,
  estimated_delivery_date: order.estimated_delivery_date,
});


export function useOrders(isAdmin: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    
    // Para administradores, buscamos todos os pedidos e fazemos junção para obter nomes de usuário
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles:user_id ( username ),
        assigned_profile:assigned_to ( username )
      `)
      .order('created_at', { ascending: false });
      
    // Se não for admin, o RLS já filtra para mostrar apenas os pedidos relevantes (próprios ou atribuídos)
    // Mas a junção ainda é útil para obter o nome do criador/atribuído.

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      showError('Falha ao carregar pedidos.');
      setOrders([]);
    } else {
      // O mapeamento precisa lidar com a estrutura de junção (profiles:user_id)
      const mappedData = data.map(item => {
        const dbItem = item as OrderDB;
        return mapFromDB({
          ...dbItem,
          profiles: dbItem.profiles,
          assigned_profile: dbItem.assigned_profile,
        });
      });
      setOrders(mappedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'creator_username' | 'assigned_username'>) => {
    const orderForDb = mapToDB(order);

    const { data, error } = await supabase
      .from('orders')
      .insert(orderForDb)
      .select()
      .single();

    if (error) {
      console.error('Error adding order:', error);
      showError(`Falha ao criar o pedido "${order.title}".`);
      return null;
    }
    
    // Recarrega para obter os nomes de usuário corretamente
    await fetchOrders();
    showSuccess(`Pedido "${order.title}" criado com sucesso!`);
    return data;
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const updatesForDb = mapToDB(updates);

    const { error } = await supabase
      .from('orders')
      .update(updatesForDb)
      .eq('id', id);

    if (error) {
      console.error('Error updating order:', error);
      showError('Falha ao atualizar o pedido.');
    } else {
      // Recarrega para garantir que os dados de junção (usernames) estejam atualizados
      await fetchOrders();
      showSuccess('Pedido atualizado com sucesso!');
    }
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .delete()
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
    loading,
    addOrder,
    updateOrder,
    deleteOrder,
    fetchOrders,
  };
}