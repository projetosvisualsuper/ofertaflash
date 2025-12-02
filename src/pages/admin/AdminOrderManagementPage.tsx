import React, { useState, useMemo } from 'react';
import { ListOrdered, Loader2, Edit, Trash2, Plus, Search, User, Clock } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { Order } from '../../../types';
import AdminEditOrderModal from '../../components/admin/AdminEditOrderModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';

const getStatusClass = (status: Order['status']) => {
  switch (status) {
    case 'Concluído': return 'bg-green-100 text-green-800';
    case 'Em Progresso': return 'bg-blue-100 text-blue-800';
    case 'Cancelado': return 'bg-red-100 text-red-800';
    case 'Pendente':
    default: return 'bg-yellow-100 text-yellow-800';
  }
};

const getPriorityClass = (priority: Order['priority']) => {
  switch (priority) {
    case 'Alta': return 'text-red-600 font-bold';
    case 'Média': return 'text-yellow-600';
    case 'Baixa':
    default: return 'text-gray-500';
  }
};

const AdminOrderManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { orders, loading, addOrder, updateOrder, deleteOrder, fetchOrders } = useOrders(isAdmin);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (orderData: Partial<Order>, id?: string) => {
    if (id) {
      await updateOrder(id, orderData);
    } else {
      await addOrder(orderData as Omit<Order, 'id' | 'created_at' | 'updated_at' | 'creator_username' | 'assigned_username'>);
    }
  };
  
  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    
    setIsDeleting(true);
    await deleteOrder(orderToDelete.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter(order =>
      order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.creator_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.assigned_username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <ListOrdered size={32} className="text-indigo-600" />
        Gerenciamento de Pedidos
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Pedidos ({filteredOrders.length})</h3>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pedido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button 
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
            >
              <Plus size={16} />
              Novo Pedido
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="ml-4 text-gray-600">Carregando pedidos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridade</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criador / Atribuído</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega Estimada</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="text-sm font-medium text-gray-900">{order.title}</div>
                      <div className="text-xs text-gray-500">#{order.order_number || order.id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-semibold ${getPriorityClass(order.priority)}`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 flex items-center gap-1"><User size={14} className="text-gray-400" /> {order.creator_username}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} className="text-gray-400" /> Atribuído: {order.assigned_username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => handleOpenEditModal(order)} className="text-indigo-600 hover:text-indigo-900" title="Editar Pedido"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteClick(order)} className="text-red-600 hover:text-red-900" title="Excluir Pedido"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                  Nenhum pedido encontrado.
              </div>
            )}
          </div>
        )}
      </div>
      
      {isModalOpen && (
        <AdminEditOrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialOrder={selectedOrder}
          onSave={handleSaveOrder}
        />
      )}
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Exclusão de Pedido"
        description={`Tem certeza que deseja excluir o pedido "${orderToDelete?.title}"? Esta ação é irreversível.`}
        confirmText="Excluir Pedido"
        isConfirming={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default AdminOrderManagementPage;