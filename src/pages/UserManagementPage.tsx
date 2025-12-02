import React, { useState, useEffect, useCallback } from 'react';
import { Users, Loader2, User, Edit } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { Profile } from '../../types';
import { showError } from '../utils/toast';
import { PLAN_NAMES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import AdminEditUserModal from '../components/admin/AdminEditUserModal';

const UserManagementPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const { hasPermission } = useAuth();

  const canManageUsers = hasPermission('manage_users');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: true });

    if (error) {
      console.error('Error fetching profiles:', error);
      showError('Falha ao carregar la lista de usuários.');
      setProfiles([]);
    } else {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleEditClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProfile(null);
  };

  const handleUserUpdated = () => {
    fetchProfiles(); // Recarrega a lista de usuários após a atualização
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Users size={32} className="text-indigo-600" />
        Gerenciamento de Usuários
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-4">Perfis Cadastrados ({profiles.length})</h3>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="ml-4 text-gray-600">Carregando perfis...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map(profile => (
              <div key={profile.id} className="flex items-center bg-gray-50 border rounded-lg shadow-sm p-4">
                <User size={24} className="text-gray-500 mr-4 shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-800 truncate">{profile.username || 'N/A'}</p>
                  <p className="text-sm text-gray-500">ID: {profile.id.substring(0, 8)}...</p>
                </div>
                
                <div className="flex flex-col items-end shrink-0 ml-4">
                  <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
                    {PLAN_NAMES[profile.role] || profile.role}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{profile.permissions.length} Permissões</p>
                </div>
                
                {canManageUsers && (
                  <button 
                    onClick={() => handleEditClick(profile)}
                    className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full transition-colors ml-4"
                    title="Editar Perfil"
                  >
                    <Edit size={18} />
                  </button>
                )}
              </div>
            ))}
            {profiles.length === 0 && (
              <div className="p-8 text-center text-gray-500 border-dashed border-2 rounded-lg">
                  Nenhum perfil encontrado.
              </div>
            )}
          </div>
        )}
      </div>
      
      {selectedProfile && (
        <AdminEditUserModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          profile={selectedProfile}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default UserManagementPage;