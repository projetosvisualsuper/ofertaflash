import React from 'react';
import { LayoutTemplate, Monitor, Clapperboard, Image, Settings, Zap, Database, Building, LogOut, Users, Lock, UserCircle, Shield, BarChart3 } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { Permission } from '../../types';
import { PLAN_NAMES } from '../config/constants';
import PlanStatus from './PlanStatus';

interface SidebarNavProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

const MODULES: { id: string; name: string; icon: React.ElementType; description: string; permission: Permission }[] = [
  { id: 'profile', name: 'Meu Perfil', icon: UserCircle, description: 'Gerencie sua conta e plano.', permission: 'access_builder' },
  { id: 'poster', name: 'OfertaFlash Builder', icon: LayoutTemplate, description: 'Crie cartazes e flyers de ofertas.', permission: 'access_builder' },
  { id: 'product-db', name: 'Banco de Produtos', icon: Database, description: 'Cadastre produtos e imagens para reutilizar.', permission: 'manage_products' },
  { id: 'company', name: 'Dados da Empresa', icon: Building, description: 'Gerencie as informações do seu negócio.', permission: 'access_builder' },
  { id: 'signage', name: 'TV Digital (Slides)', icon: Monitor, description: 'Gere slides e vídeos para telas de TV.', permission: 'access_signage' },
  { id: 'social', name: 'Artes para Redes Sociais', icon: Image, description: 'Crie posts e stories otimizados.', permission: 'access_social_media' },
  { id: 'ads', name: 'Anúncios Áudio/Vídeo', icon: Clapperboard, description: 'Crie anúncios curtos com narração IA.', permission: 'access_ads' },
  { id: 'reports', name: 'Relatórios', icon: BarChart3, description: 'Visualize métricas de uso e desempenho.', permission: 'view_reports' },
  // Os módulos 'users' e 'settings' foram removidos daqui e são acessíveis apenas via Painel Admin.
];

const SidebarNav: React.FC<SidebarNavProps> = ({ activeModule, setActiveModule }) => {
  const { profile, hasPermission, refreshProfile } = useAuth();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout Error:', error);
      showError('Falha ao sair. Tente novamente.');
    } else {
      showSuccess('Sessão encerrada com sucesso.');
    }
  };
  
  return (
    <div className="w-64 h-full bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2">
        <Zap size={24} className="text-yellow-400" />
        <h1 className="text-xl font-bold tracking-wider">AI Marketing Hub</h1>
      </div>
      
      {profile && (
        <div className="p-4 border-b border-gray-700 text-xs text-gray-400">
          <p className="font-semibold text-white">Olá, {profile.username || 'Usuário'}</p>
        </div>
      )}
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {MODULES.map((module) => {
          const isAllowed = hasPermission(module.permission);
          const Icon = module.icon;
          
          const handleClick = () => {
            setActiveModule(module.id);
          };

          return (
            <button
              key={module.id}
              onClick={handleClick}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                activeModule === module.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : isAllowed
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-800'
              }`}
            >
              <Icon size={20} />
              <div className="flex-1">
                <span className="block text-sm font-semibold leading-tight">{module.name}</span>
                <span className="block text-xs text-gray-400 leading-tight">{module.description}</span>
              </div>
              {!isAllowed && <Lock size={16} className="text-red-500 shrink-0" />}
            </button>
          );
        })}
      </nav>
      
      {profile && <PlanStatus profile={profile} onPlanUpdated={refreshProfile} />}

      <div className="p-4 border-t border-gray-700 flex flex-col space-y-2 flex-shrink-0">
        {hasPermission('access_admin_panel') && (
          <button
            onClick={() => setActiveModule('admin')}
            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
              activeModule === 'admin'
                ? 'bg-red-700 text-white'
                : 'text-yellow-400 hover:bg-gray-700 hover:text-yellow-300'
            }`}
          >
            <Shield size={20} />
            <span className="text-sm font-semibold">Painel Admin</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 text-red-400 hover:bg-red-700 hover:text-white"
        >
          <LogOut size={20} />
          <span className="text-sm font-semibold">Sair (Logout)</span>
        </button>
        <p className="text-xs text-gray-500">Powered by Gemini AI</p>
      </div>
    </div>
  );
};

export default SidebarNav;