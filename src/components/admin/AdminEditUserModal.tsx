import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Profile } from '../../../types';
import { supabase } from '@/src/integrations/supabase/client';
import { PLAN_NAMES, DEFAULT_PERMISSIONS_BY_ROLE, Permission } from '../../config/constants';
import { showSuccess, showError } from '../../utils/toast';
import { Loader2, Save } from 'lucide-react';

interface AdminEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onUserUpdated: () => void;
}

const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({ isOpen, onClose, profile, onUserUpdated }) => {
  const [newRole, setNewRole] = useState(profile?.role || 'free');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setNewRole(profile.role);
    }
  }, [profile]);

  if (!profile) return null;

  const handleSave = async () => {
    setIsLoading(true);

    const newPermissions = DEFAULT_PERMISSIONS_BY_ROLE[newRole] as Permission[];
    if (!newPermissions) {
      showError(`Plano "${newRole}" inválido.`);
      setIsLoading(false);
      return;
    }

    // 1. Atualiza o perfil com o novo role, novas permissões e força a atualização do timestamp
    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        permissions: newPermissions,
        updated_at: new Date().toISOString(), // Força a atualização do timestamp
      })
      .eq('id', profile.id);

    setIsLoading(false);

    if (error) {
      console.error('Error updating user plan:', error);
      showError(`Falha ao atualizar o plano de ${profile.username || profile.id}. Detalhe: ${error.message}`);
    } else {
      showSuccess(`Plano de ${profile.username || profile.id} atualizado para ${PLAN_NAMES[newRole]}.`);
      onUserUpdated(); // Força o recarregamento da lista na página pai
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle>Editar Perfil de Usuário</DialogTitle>
          <DialogDescription>
            Alterando o plano de <span className="font-bold">{profile.username || profile.id}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label htmlFor="plan-select" className="text-sm font-medium text-gray-700 block mb-1">
              Plano (Role)
            </label>
            <select
              id="plan-select"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {Object.keys(PLAN_NAMES).map(roleKey => (
                <option key={roleKey} value={roleKey}>
                  {PLAN_NAMES[roleKey]}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">
            Alterar o plano irá substituir as permissões do usuário pelas permissões padrão do novo plano.
          </p>
        </div>
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isLoading || newRole === profile.role}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Salvar Alterações
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditUserModal;