import React, { useState } from 'react';
import { Home, Users, Zap, Settings, ArrowLeft, BarChart3, Image, LayoutTemplate, LogIn, DollarSign } from 'lucide-react';
import AdminDashboardPage from './AdminDashboardPage';
import AdminUserManagementPage from './AdminUserManagementPage';
import AdminPlanManagementPage from './AdminPlanManagementPage';
import AdminSettingsPage from './AdminSettingsPage';
import AdminReportsPage from './AdminReportsPage';
import AdminImageUploadPage from './AdminImageUploadPage';
import AdminGlobalTemplatesPage from './AdminGlobalTemplatesPage';
import AdminLoginBannerSettingsPage from './AdminLoginBannerSettingsPage';
// import AdminAICostsPage from './AdminAICostsPage'; // Removido

type AdminModule = 'dashboard' | 'users' | 'plans' | 'reports' | 'settings' | 'images' | 'global-templates' | 'login-banner'; // 'ai-costs' removido

interface AdminPageProps {
  setActiveHubModule: (module: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ setActiveHubModule }) => {
  const [activeAdminModule, setActiveAdminModule] = useState<AdminModule>('dashboard');

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'users', name: 'Clientes', icon: Users },
    { id: 'plans', name: 'Planos', icon: Zap },
    // { id: 'ai-costs', name: 'Custos de IA', icon: DollarSign }, // Removido
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
      // case 'ai-costs': return <AdminAICostsPage />; // Removido
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