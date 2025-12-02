import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Loader2, Edit, Search, UserX, UserCheck, LogIn } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { Profile, AdminProfileView } from '../../types';
import { showSuccess, showError } from '../utils/toast';
import { PLAN_NAMES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import AdminEditUserModal from '../components/admin/AdminEditUserModal';

const UserManagementPage: React.FC = () => {
  const [profiles, setProfiles] = useState<AdminProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const { hasPermission } = useAuth();

  const canManageUsers = hasPermission('manage_users');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_users_view')
      .select('*');

    if (error) {
      console.error('Error fetching profiles:', error);
      showError('Falha ao carregar a lista de usuários.');
      setProfiles([]);
    } else {
      setProfiles(data as AdminProfileView[]);
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
    fetchProfiles();
  };

  const handleDeactivate = async (profile: AdminProfileView) => {
    if (window.confirm(`Tem certeza que deseja desativar o usuário ${profile.username || profile.email}?`)) {
      const { error } = await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', profile.id);
      
      if (error) {
        showError("Falha ao desativar usuário.");
      } else {
        showSuccess("Usuário desativado.");
        fetchProfiles();
      }
    }
  };

  const handleActivate = async (profile: AdminProfileView) => {
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: null })
      .eq('id', profile.id);
    
    if (error) {
      showError("Falha ao ativar usuário.");
    } else {
      showSuccess("Usuário ativado com sucesso.");
      fetchProfiles();
    }
  };

  const handleImpersonate = async (profile: AdminProfileView) => {
    if (!profile.email) {
      showError("Este usuário não possui um email para gerar o link de acesso.");
      return;
    }
    
    setImpersonatingId(profile.id);
    
    try {
      // 1. Salvar a sessão atual do admin no localStorage
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Não foi possível obter a sessão do administrador.");
      }

      try {
        // Tenta salvar a sessão do admin.
        localStorage.setItem('admin_impersonation_token', JSON.stringify(session));
      } catch (e) {
        // Se falhar por falta de espaço (QuotaExceededError)...
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
          // ...limpa a lista de produtos do cartaz, que é o maior culpado, e tenta novamente.
          console.warn("LocalStorage quota exceeded. Clearing products to make space for admin token.");
          showError("Armazenamento local cheio. Limpando produtos do cartaz para continuar.");
          localStorage.removeItem('ofertaflash_products'); 
          localStorage.setItem('admin_impersonation_token', JSON.stringify(session));
        } else {
          // Se for outro erro, lança-o.
          throw e;
        }
      }

      // 2. Chamar a Edge Function para gerar o link
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { 
          userIdToImpersonate: profile.id,
          userEmailToImpersonate: profile.email,
        },
      });

      if (error) throw error;

      // 3. Redirecionar para o link de login mágico
      window.location.href = data.signInLink;

    } catch (error) {
      console.error("Falha ao personificar usuário:", error);
      showError("Erro ao tentar acessar o painel do cliente.");
      localStorage.removeItem('admin_impersonation_token'); // Limpa em caso de erro
    } finally {
      setImpersonatingId(null);
    }
  };

  const filteredProfiles = useMemo(() => {
    if (!searchTerm) return profiles;
    return profiles.filter(p =>
      p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Users size={32} className="text-indigo-600" />
        Gerenciamento de Usuários
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800">Perfis Cadastrados ({filteredProfiles.length})</h3>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="ml-4 text-gray-600">Carregando perfis...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfiles.map(profile => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{profile.username || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{profile.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {PLAN_NAMES[profile.role] || profile.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profile.deleted_at ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inativo</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Ativo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {canManageUsers && (
                        <>
                          <button 
                            onClick={() => handleImpersonate(profile)} 
                            className="text-green-600 hover:text-green-900 disabled:opacity-50" 
                            title="Acessar Painel do Cliente"
                            disabled={impersonatingId === profile.id}
                          >
                            {impersonatingId === profile.id ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                          </button>
                          <button onClick={() => handleEditClick(profile)} className="text-indigo-600 hover:text-indigo-900" title="Editar Plano"><Edit size={18} /></button>
                          {profile.deleted_at ? (
                            <button onClick={() => handleActivate(profile)} className="text-green-600 hover:text-green-900" title="Ativar Usuário"><UserCheck size={18} /></button>
                          ) : (
                            <button onClick={() => handleDeactivate(profile)} className="text-red-600 hover:text-red-900" title="Desativar Usuário"><UserX size={18} /></button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProfiles.length === 0 && (
              <div className="p-8 text-center text-gray-500">
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