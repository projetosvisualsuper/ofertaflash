import React, { useState } from 'react';
import { UserCircle, Mail, Key, Zap, Save, Loader2, ArrowDownCircle, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError } from '../utils/toast';
import { PLAN_NAMES, DEFAULT_PERMISSIONS_BY_ROLE, Permission } from '../config/constants';
import PlanUpgradeModal from '../components/PlanUpgradeModal';
import ConfirmationModal from '../components/ConfirmationModal';
import SocialMediaIntegration from '../components/SocialMediaIntegration';
import { useUserCredits } from '../hooks/useUserCredits'; // NOVO IMPORT

const ProfilePage: React.FC = () => {
  const { profile, session, refreshProfile } = useAuth();
  const { credits, loading: loadingCredits, fetchCredits } = useUserCredits(session?.user?.id); // Usando o hook de créditos
  
  const [username, setUsername] = useState(profile?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isCancellingPlan, setIsCancellingPlan] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  if (!profile || !session) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
        <p className="text-gray-500">Carregando perfil...</p>
      </div>
    );
  }
  
  const currentPlan = profile.role;
  const planName = PLAN_NAMES[currentPlan] || 'Desconhecido';

  // --- Handlers de Ação ---

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showError("O nome de usuário não pode ser vazio.");
      return;
    }

    setIsSavingProfile(true);
    
    // 1. Atualizar o username no auth.users (metadata)
    const { error: authError } = await supabase.auth.updateUser({
        data: { username: username.trim() }
    });
    
    // 2. Atualizar o username na tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('id', profile.id);

    setIsSavingProfile(false);

    if (authError || profileError) {
      console.error('Error updating profile:', authError || profileError);
      showError('Falha ao atualizar o perfil.');
    } else {
      showSuccess('Perfil atualizado com sucesso!');
      refreshProfile();
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      console.error('Error updating password:', error);
      showError('Falha ao atualizar a senha. Tente novamente.');
    } else {
      showSuccess('Senha atualizada com sucesso!');
      setNewPassword('');
    }
  };
  
  const handleCancelPlan = async () => {
    setIsCancelModalOpen(false); // Fecha o modal
    setIsCancellingPlan(true);
    
    const newRole = 'free';
    const newPermissions = DEFAULT_PERMISSIONS_BY_ROLE[newRole] || DEFAULT_PERMISSIONS_BY_ROLE.free;
    
    // 1. Atualizar o perfil para 'free'
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole, 
        permissions: newPermissions as Permission[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setIsCancellingPlan(false);

    if (error) {
      console.error('Error cancelling plan:', error);
      showError('Falha ao cancelar o plano. Tente novamente.');
    } else {
      showSuccess('Plano cancelado. Você está de volta ao Plano Grátis.');
      refreshProfile(); // Atualiza o estado global
    }
  };
  
  const handleBuyCredits = () => {
      showSuccess("Funcionalidade de compra de créditos em desenvolvimento. No futuro, você será redirecionado para o checkout.");
      // Aqui seria a lógica para iniciar o checkout de créditos avulsos
  };

  // --- Componentes de Seção ---

  const PlanSection = () => (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
        <Zap size={20} className="text-yellow-500" /> Gerenciamento de Plano
      </h3>
      
      <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
        <p className="text-sm font-medium text-indigo-800">Plano Atual:</p>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${currentPlan === 'free' ? 'bg-gray-300 text-gray-800' : 'bg-yellow-500 text-gray-900'}`}>
          {planName}
        </span>
      </div>
      
      <PlanUpgradeModal 
        profile={profile} 
        onPlanUpdated={refreshProfile}
        trigger={
          <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded-lg transition-colors">
            Ver Detalhes e Fazer Upgrade
          </button>
        }
      />
      
      {currentPlan !== 'free' && (
        <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertTriangle size={20} />
                <p className="text-sm font-medium">Cancelar Plano (Downgrade)</p>
            </div>
            <button
              onClick={() => setIsCancelModalOpen(true)} // Abre o modal
              disabled={isCancellingPlan}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {isCancellingPlan ? <Loader2 className="animate-spin" size={16} /> : <ArrowDownCircle size={16} />}
              {isCancellingPlan ? 'Cancelando...' : `Cancelar ${planName} (Voltar para Grátis)`}
            </button>
        </div>
      )}
    </div>
  );
  
  const CreditsSection = () => (
    <div className="p-6 bg-white rounded-xl shadow-md space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
        <DollarSign size={20} className="text-green-600" /> Créditos de IA
      </h3>
      
      {loadingCredits ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800">Saldo Atual:</p>
            <span className="text-2xl font-black text-green-600">
              {credits.balance.toLocaleString('pt-BR')}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} className="text-gray-500 shrink-0" />
            <span className="font-medium">Última Recarga:</span> 
            <span>{new Date(credits.lastRefillAt).toLocaleDateString()}</span>
          </div>
          
          <div className="border-t pt-4">
            <button
              onClick={handleBuyCredits}
              className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> Comprar Créditos Adicionais
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <UserCircle size={32} className="text-indigo-600" />
        Meu Perfil e Conta
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl w-full mx-auto">
        <div className="lg:col-span-1 space-y-6">
            <PlanSection />
            <CreditsSection />
        </div>
        <div className="lg:col-span-2 space-y-6">
            {/* NOVO CARD COMBINADO: Detalhes do Perfil e Senha */}
            <div className="p-6 bg-white rounded-xl shadow-md space-y-6">
                
                {/* Detalhes do Perfil */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <UserCircle size={20} className="text-indigo-600" /> Detalhes do Perfil
                    </h3>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Mail size={16} className="text-gray-500 shrink-0" />
                        <span className="font-medium">Email:</span> <span className="truncate">{session.user.email}</span>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-3">
                        <div>
                            <label htmlFor="username" className="text-sm font-medium text-gray-700 block mb-1">Nome de Usuário</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Seu nome de usuário"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSavingProfile || username === profile.username}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSavingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Salvar Nome de Usuário
                        </button>
                    </form>
                </div>
                
                {/* Alterar Senha */}
                <div className="space-y-4 border-t pt-6">
                    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Key size={20} className="text-indigo-600" /> Alterar Senha
                    </h3>
                    
                    <form onSubmit={handleUpdatePassword} className="space-y-3">
                        <div>
                            <label htmlFor="new-password" className="text-sm font-medium text-gray-700 block mb-1">Nova Senha</label>
                            <input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isUpdatingPassword || newPassword.length < 6}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isUpdatingPassword ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Atualizar Senha
                        </button>
                    </form>
                </div>
            </div>
            
            <SocialMediaIntegration />
        </div>
      </div>
      
      {/* Modal de Confirmação de Cancelamento de Plano */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelPlan}
        title="Confirmar Cancelamento de Plano"
        description="Tem certeza que deseja cancelar seu plano e voltar para o Plano Grátis? Você perderá o acesso aos recursos Premium/Pro."
        confirmText="Sim, Cancelar Plano"
        isConfirming={isCancellingPlan}
        variant="danger"
      />
    </div>
  );
};

export default ProfilePage;