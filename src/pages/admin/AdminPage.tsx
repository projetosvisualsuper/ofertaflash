import React, { useState, useEffect } from 'react';
import { Home, Users, Zap, Settings, ArrowLeft, BarChart3, Image, LayoutTemplate, LogIn, DollarSign, Save, Loader2 } from 'lucide-react';
import AdminDashboardPage from './AdminDashboardPage';
import AdminUserManagementPage from './AdminUserManagementPage';
import AdminPlanManagementPage from './AdminPlanManagementPage';
import AdminSettingsPage from './AdminSettingsPage';
import AdminReportsPage from './AdminReportsPage';
import AdminImageUploadPage from './AdminImageUploadPage';
import AdminGlobalTemplatesPage from './AdminGlobalTemplatesPage';
import AdminLoginBannerSettingsPage from './AdminLoginBannerSettingsPage';
// import AdminAICostsPage from './AdminAICostsPage'; // REMOVIDO

import { useAICosts, AICost } from '../../hooks/useAICosts';
import { useAuth } from '../../context/AuthContext';
import { showError } from '../../utils/toast';

// Componente de Custos de IA (Conteúdo movido de AdminAICostsPage.tsx)
const AdminAICostsPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { costs, loading, updateCost } = useAICosts(true);
  
  const [localCosts, setLocalCosts] = useState<AICost[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Inicializa o estado local com os custos carregados
    setLocalCosts(costs);
  }, [costs]);

  const handleCostChange = (serviceKey: string, field: 'cost' | 'description', value: string | number) => {
    setLocalCosts(prev => prev.map(cost => 
      cost.service_key === serviceKey 
        ? { ...cost, [field]: value } 
        : cost
    ));
  };

  const handleSave = async (cost: AICost) => {
    if (!isAdmin) {
      showError("Apenas administradores podem salvar estas configurações.");
      return;
    }
    
    const newCost = typeof cost.cost === 'string' ? parseInt(cost.cost, 10) : cost.cost;
    if (isNaN(newCost) || newCost < 0) {
        showError("O custo deve ser um número positivo.");
        return;
    }
    
    setIsSaving(true);
    try {
        await updateCost(cost.service_key, newCost, cost.description);
        // Atualiza o estado local após o sucesso para refletir a mudança
        setLocalCosts(prev => prev.map(c => c.service_key === cost.service_key ? { ...c, cost: newCost, description: cost.description } : c));
    } catch (e) {
        // Erro já tratado no hook
    } finally {
        setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-500">Acesso negado.</div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Zap size={32} className="text-purple-600" />
        Configuração de Custos de IA
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6 max-w-3xl">
        <p className="text-sm text-gray-600">
            Defina quantos créditos de IA cada serviço consome. Estes custos são aplicados a todos os usuários, exceto administradores.
        </p>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="ml-4 text-gray-600">Carregando custos...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {localCosts.map(cost => (
              <div key={cost.service_key} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-800">{cost.service_key.replace(/_/g, ' ').toUpperCase()}</h4>
                    <button
                        onClick={() => handleSave(cost)}
                        disabled={isSaving}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                        Salvar
                    </button>
                </div>
                
                <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Descrição do Serviço</label>
                    <input
                        type="text"
                        value={cost.description}
                        onChange={(e) => handleCostChange(cost.service_key, 'description', e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        disabled={isSaving}
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Custo em Créditos</label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                value={cost.cost}
                                onChange={(e) => handleCostChange(cost.service_key, 'cost', parseInt(e.target.value, 10))}
                                className="w-full border rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                                disabled={isSaving}
                            />
                            <DollarSign size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
// Fim do componente de Custos de IA

type AdminModule = 'dashboard' | 'users' | 'plans' | 'reports' | 'settings' | 'images' | 'global-templates' | 'login-banner' | 'ai-costs';

interface AdminPageProps {
  setActiveHubModule: (module: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ setActiveHubModule }) => {
  const [activeAdminModule, setActiveAdminModule] = useState<AdminModule>('dashboard');

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'users', name: 'Clientes', icon: Users },
    { id: 'plans', name: 'Planos', icon: Zap },
    { id: 'ai-costs', name: 'Custos de IA', icon: DollarSign },
    { id: 'images', name: 'Banco de Imagens', icon: Image },
    { id: 'global-templates', name: 'Templates Globais', icon: LayoutTemplate },
    { id: 'reports', name: 'Relatórios SaaS', icon: BarChart3 },
    { id: 'settings', name: 'Configurações', icon: Settings },
    { id: 'login-banner', name: 'Banner de Login', icon: LogIn },
  ];

  const renderContent = () => {
    switch (activeAdminModule) {
      case 'dashboard': return <AdminDashboardPage setActiveAdminModule={setActiveAdminModule} />;
      case 'users': return <AdminUserManagementPage />;
      case 'plans': return <AdminPlanManagementPage />;
      case 'ai-costs': return <AdminAICostsPage />;
      case 'images': return <AdminImageUploadPage />;
      case 'global-templates': return <AdminGlobalTemplatesPage />;
      case 'reports': return <AdminReportsPage />;
      case 'settings': return <AdminSettingsPage />;
      case 'login-banner': return <AdminLoginBannerSettingsPage />;
      default: return <AdminDashboardPage setActiveAdminModule={setActiveAdminModule} />;
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-100">
      <div className="w-56 bg-white border-r flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Painel Admin</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {modules.map(module => (
            <button
              key={module.id}
              onClick={() => setActiveAdminModule(module.id as AdminModule)}
              className={`w-full text-left p-2 rounded-md text-sm font-medium transition-colors ${
                activeAdminModule === module.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <module.icon size={18} />
              {module.name}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t">
            <button
              onClick={() => setActiveHubModule('poster')}
              className="w-full flex items-center gap-3 p-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <ArrowLeft size={18} />
              Voltar ao Hub
            </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminPage;