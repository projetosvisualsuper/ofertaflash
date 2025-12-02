import React, { useState, useMemo } from 'react';
import { ListOrdered, Plus, Loader2, Edit, Trash2, Search, User, Clock, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { Order, Profile } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../components/ui/dialog';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../utils/toast';

// --- Componente Modal de Formulário ---

interface OrderFormModalProps {
  trigger: React.ReactNode;
  initialOrder?: Order;
  onSave: (order: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>, id?: string) => Promise<Order | null | void>;
  onDelete?: (id: string, title: string) => void;
  isCreator: boolean;
  isAdmin: boolean;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({ trigger, initialOrder, onSave, onDelete, isCreator, isAdmin }) => {
  const isEditing = !!initialOrder;
  const defaultOrder: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
    title: '',
    description: null,
    status: 'Pendente',
    priority: 'Média',
    assigned_to: null,
    order_number: null,
    entry_date: new Date().toISOString().split('T')[0],
    estimated_delivery_date: null,
  };
  
  const [order, setOrder] = useState<Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>>(initialOrder || defaultOrder);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);

  const isEditable = isCreator || isAdmin;
  const isStatusEditable = isAdmin; // Apenas admin pode mudar o status

  // Busca a lista de usuários para atribuição (apenas para Admin)
  const fetchUsers = async () => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role')
      .is('deleted_at', null)
      .order('username', { ascending: true });
      
    if (error) {
      console.error("Error fetching users for assignment:", error);
      showError("Falha ao carregar lista de usuários para atribuição.");
    } else {
      setAvailableUsers(data as Profile[]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setOrder(initialOrder || defaultOrder);
      fetchUsers();
    }
  }, [isOpen, initialOrder, isAdmin]);

  const handleSave = async () => {
    if (!order.title.trim()) {
      showError("O título do pedido é obrigatório.");
      return;
    }
    
    setIsLoading(true);
    const result = await onSave(order, initialOrder?.id);
    setIsLoading(false);

    if (result) {
      setIsOpen(false);
    }
  };
  
  const handleDelete = () => {
    if (initialOrder && onDelete) {
      onDelete(initialOrder.id, initialOrder.title);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Editar Pedido: ${initialOrder?.title}` : 'Criar Novo Pedido'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os detalhes do pedido.' : 'Preencha os detalhes para solicitar uma nova arte ou tarefa.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Título e Descrição */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Título do Pedido</label>
            <input 
              className="w-full border rounded px-3 py-2 text-base font-semibold focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100" 
              value={order.title} 
              onChange={(e) => setOrder(prev => ({ ...prev, title: e.target.value }))} 
              placeholder="Ex: Cartaz de Ofertas da Semana"
              disabled={!isEditable}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Descrição / Detalhes</label>
            <textarea 
              className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none disabled:bg-gray-100" 
              value={order.description || ''} 
              onChange={(e) => setOrder(prev => ({ ...prev, description: e.target.value }))} 
              placeholder="Detalhes do que precisa ser feito, produtos envolvidos, etc." 
              rows={3}
              disabled={!isEditable}
            />
          </div>
          
          {/* Status, Prioridade, Número */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Status</label>
              <select
                value={order.status}
                onChange={(e) => setOrder(prev => ({ ...prev, status: e.target.value as Order['status'] }))}
                className="w-full border rounded px-3 py-2 text-sm bg-white disabled:bg-gray-100"
                disabled={!isStatusEditable}
              >
                {['Pendente', 'Em Progresso', 'Concluído', 'Cancelado'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Prioridade</label>
              <select
                value={order.priority}
                onChange={(e) => setOrder(prev => ({ ...prev, priority: e.target.value as Order['priority'] }))}
                className="w-full border rounded px-3 py-2 text-sm bg-white disabled:bg-gray-100"
                disabled={!isEditable}
              >
                {['Baixa', 'Média', 'Alta'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Nº Pedido (Opcional)</label>
              <input 
                className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100" 
                value={order.order_number || ''} 
                onChange={(e) => setOrder(prev => ({ ...prev, order_number: e.target.value }))} 
                placeholder="001"
                disabled={!isEditable}
              />
            </div>
          </div>
          
          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Data de Entrada</label>
              <input 
                type="date"
                className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100" 
                value={order.entry_date || new Date().toISOString().split('T')[0]} 
                onChange={(e) => setOrder(prev => ({ ...prev, entry_date: e.target.value }))} 
                disabled={!isEditable}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Entrega Estimada</label>
              <input 
                type="date"
                className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100" 
                value={order.estimated_delivery_date || ''} 
                onChange={(e) => setOrder(prev => ({ ...prev, estimated_delivery_date: e.target.value }))} 
                disabled={!isEditable}
              />
            </div>
          </div>
          
          {/* Atribuição (Apenas Admin) */}
          {isAdmin && (
            <div className="border-t pt-4">
              <label className="text-sm font-semibold text-gray-700 block mb-1">Atribuir a</label>
              <select
                value={order.assigned_to || ''}
                onChange={(e) => setOrder(prev => ({ ...prev, assigned_to: e.target.value || null }))}
                className="w-full border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">-- Não Atribuído --</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          {isEditing && isCreator && onDelete ? (
            <button 
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              Excluir Pedido
            </button>
          ) : <div />}
          
          <button 
            onClick={handleSave}
            disabled={isLoading || !order.title.trim() || !isEditable}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            {isEditing ? 'Salvar Alterações' : 'Criar Pedido'}
          </button>
        </div>
        {!isEditable && isEditing && <p className="text-xs text-red-500 mt-2">Você só pode editar pedidos que criou ou que foram atribuídos a você (exceto status).</p>}
      </DialogContent>
    </Dialog>
  );
};

// --- Componente Principal da Página ---

const OrderManagerPage: React.FC = () => {
  const { profile, session, hasPermission } = useAuth();
  const userId = session?.user?.id;
  const isAdmin = profile?.role === 'admin';
  
  const { orders, addOrder, updateOrder, deleteOrder, loading, fetchOrders } = useOrders(userId, isAdmin);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');

  const handleSave = async (orderData: Omit<Order, 'id' | 'user_id' | 'created_at' | 'updated_at'>, id?: string) => {
    if (id) {
      await updateOrder(id, orderData);
    } else {
      await addOrder(orderData);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o pedido "${title}"?`)) {
      deleteOrder(id);
    }
  };

  const getStatusClasses = (status: Order['status']) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Em Progresso': return 'bg-blue-100 text-blue-800';
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityClasses = (priority: Order['priority']) => {
    switch (priority) {
      case 'Alta': return 'text-red-600';
      case 'Média': return 'text-yellow-600';
      case 'Baixa': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <ListOrdered size={32} className="text-purple-600" />
        Gerenciamento de Pedidos
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Pedidos Ativos ({filteredOrders.length})</h3>
          
          <OrderFormModal
            trigger={
              <button 
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
              >
                <Plus size={16} />
                Novo Pedido
              </button>
            }
            onSave={handleSave}
            isCreator={true}
            isAdmin={isAdmin}
          />
        </div>
        
        {/* Filtros e Busca */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descrição ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | Order['status'])}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Progresso">Em Progresso</option>
            <option value="Concluído">Concluído</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <p className="ml-4 text-gray-600">Carregando pedidos...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const isCreator = order.user_id === userId;
              const isAssigned = order.assigned_to === userId;
              const canEdit = isCreator || isAssigned || isAdmin;
              
              return (
                <div key={order.id} className="flex items-center bg-gray-50 border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusClasses(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-base font-bold text-gray-800 truncate">{order.title}</p>
                      {order.order_number && <span className="text-xs text-gray-500">#{order.order_number}</span>}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{order.description || 'Sem descrição.'}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className={`font-semibold flex items-center gap-1 ${getPriorityClasses(order.priority)}`}>
                        <AlertTriangle size={12} /> Prioridade: {order.priority}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} /> Criador: {order.creator_username || 'Desconhecido'}
                      </span>
                      {order.assigned_to && (
                        <span className="flex items-center gap-1">
                          <CheckCircle size={12} /> Atribuído: {order.assigned_username || 'Desconhecido'}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Entrada: {order.entry_date ? new Date(order.entry_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {canEdit && (
                    <OrderFormModal
                      trigger={
                        <button 
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors ml-4"
                          title="Editar Pedido"
                        >
                          <Edit size={18} />
                        </button>
                      }
                      initialOrder={order}
                      onSave={handleSave}
                      onDelete={handleDelete}
                      isCreator={isCreator}
                      isAdmin={isAdmin}
                    />
                  )}
                </div>
              );
            })}
            {filteredOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500 border-dashed border-2 rounded-lg">
                  Nenhum pedido encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagerPage;