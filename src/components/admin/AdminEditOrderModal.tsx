import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Order, Profile } from '../../../types';
import { Loader2, Save, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';
import { showError } from '../../utils/toast';

interface AdminEditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder: Order | null;
  onSave: (order: Partial<Order>, id?: string) => Promise<void>;
}

const STATUS_OPTIONS = ['Pendente', 'Em Progresso', 'Concluído', 'Cancelado'];
const PRIORITY_OPTIONS = ['Baixa', 'Média', 'Alta'];

const AdminEditOrderModal: React.FC<AdminEditOrderModalProps> = ({ isOpen, onClose, initialOrder, onSave }) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const isEditing = !!initialOrder;

  const [title, setTitle] = useState(initialOrder?.title || '');
  const [description, setDescription] = useState(initialOrder?.description || '');
  const [status, setStatus] = useState(initialOrder?.status || 'Pendente');
  const [priority, setPriority] = useState(initialOrder?.priority || 'Média');
  const [assignedTo, setAssignedTo] = useState(initialOrder?.assigned_to || '');
  const [orderNumber, setOrderNumber] = useState(initialOrder?.order_number || '');
  const [entryDate, setEntryDate] = useState(initialOrder?.entry_date || '');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(initialOrder?.estimated_delivery_date || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  // Fetch all users for assignment dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role');
        
      if (error) {
        console.error('Error fetching users for assignment:', error);
        showError('Falha ao carregar lista de usuários para atribuição.');
      } else {
        setAllUsers(data as Profile[]);
      }
    };
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialOrder) {
      setTitle(initialOrder.title);
      setDescription(initialOrder.description || '');
      setStatus(initialOrder.status);
      setPriority(initialOrder.priority);
      setAssignedTo(initialOrder.assigned_to || '');
      setOrderNumber(initialOrder.order_number || '');
      setEntryDate(initialOrder.entry_date || '');
      setEstimatedDeliveryDate(initialOrder.estimated_delivery_date || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('Pendente');
      setPriority('Média');
      setAssignedTo('');
      setOrderNumber('');
      setEntryDate('');
      setEstimatedDeliveryDate('');
    }
  }, [initialOrder, isOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      showError("O título do pedido é obrigatório.");
      return;
    }
    if (!userId) {
        showError("Usuário não autenticado.");
        return;
    }

    setIsLoading(true);
    
    const orderData: Partial<Order> = {
      title: title.trim(),
      description: description.trim() || null,
      status: status as Order['status'],
      priority: priority as Order['priority'],
      assigned_to: assignedTo || null,
      order_number: orderNumber.trim() || null,
      entry_date: entryDate || null,
      estimated_delivery_date: estimatedDeliveryDate || null,
      // user_id só é necessário na criação
      ...(isEditing ? {} : { user_id: userId }),
    };

    await onSave(orderData, initialOrder?.id);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Pedido' : 'Criar Novo Pedido'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Atualizando pedido #${initialOrder?.order_number || initialOrder?.id}` : 'Preencha os detalhes do novo pedido.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Título e Descrição */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Título do Pedido *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Criação de 5 artes para Black Friday"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows={3}
              placeholder="Detalhes e requisitos do pedido"
            />
          </div>

          {/* Status, Prioridade e Atribuição */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Atribuído a</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="">Não Atribuído</option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.email} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Datas e Número do Pedido */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nº do Pedido</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Data de Entrada</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Entrega Estimada</label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isLoading || !title.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? <Save size={16} /> : <Plus size={16} />)}
            {isLoading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Pedido')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditOrderModal;