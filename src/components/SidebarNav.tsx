import React from 'react';
import { LayoutTemplate, Monitor, Clapperboard, Image, Settings, Zap, Database, Building, LogOut } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { Permission } from '../../types';

interface SidebarNavProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

// Mapeamento de módulos para a permissão necessária
const MODULES: { id: string; name: string; icon: React.ElementType; description: string; permission: Permission }[] = [
  { id: 'poster', name: 'OfertaFlash Builder', icon: LayoutTemplate, description: 'Crie cartazes e flyers de ofertas.', permission: 'access_builder' },
  { id: 'product-db', name: 'Banco de Produtos', icon: Database, description: 'Cadastre produtos e imagens para reutilizar.', permission: 'manage_products' },
  { id: 'company', name: 'Dados da Empresa', icon: Building, description: 'Gerencie as informações do seu negócio.', permission: 'manage_company_info' },
  { id: 'signage', name: 'TV Digital (Slides)', icon: Monitor, description: 'Gere slides e vídeos para telas de TV.', permission: 'access_signage' },
  { id: 'social', name: 'Artes para Redes Sociais', icon: Image, description: 'Crie posts e stories otimizados.', permission: 'access_social_media' },
  { id: 'ads', name: 'Anúncios Áudio/Vídeo', icon: Clapperboard, description: 'Crie anúncios curtos com narração IA.', permission: 'access_ads' },
  { id: 'settings', name: 'Configurações', icon: Settings, description: 'Gerencie integrações e chaves.', permission: 'access_settings' },
];

const SidebarNav: React.FC<SidebarNavProps> = ({ activeModule, setActiveModule }) => {
  const { profile, hasPermission } = useAuth();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout Error:', error);
      showError('Falha ao sair. Tente novamente.');
    } else {
      showSuccess('Sessão encerrada com sucesso.');
    }
  };
  
  const filteredModules = MODULES.filter(module => hasPermission(module.permission));

  return (
    <div className="w-64 h-full bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2">
        <Zap size={24} className="text-yellow-400" />
        <h1 className="text-xl font-bold tracking-wider">AI Marketing Hub</h1>
      </div>
      
      {profile && (
        <div className="p-4 border-b border-gray-700 text-xs text-gray-400">
          <p className="font-semibold text-white">Olá, {profile.username || 'Usuário'}</p>
          <p>Função: {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</p>
        </div>
      )}
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredModules.map((module) => (
          <button
            key={module.id}
            onClick={() => setActiveModule(module.id)}
            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
              activeModule === module.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <module.icon size={20} />
            <div>
              <span className="block text-sm font-semibold leading-tight">{module.name}</span>
              <span className="block text-xs text-gray-400 leading-tight">{module.description}</span>
            </div>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-700 flex flex-col space-y-2 flex-shrink-0">
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