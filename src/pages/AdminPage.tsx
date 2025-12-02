import React, { useState } from 'react';
import { Home, Users, Zap, Settings, ArrowLeft, BarChart3 } from 'lucide-react';
import AdminDashboardPage from './admin/AdminDashboardPage';
import AdminUserManagementPage from './admin/AdminUserManagementPage';
import AdminPlanManagementPage from './admin/AdminPlanManagementPage';
import AdminSettingsPage from './admin/AdminSettingsPage';
import AdminReportsPage from './admin/AdminReportsPage'; // Importando o novo módulo

type AdminModule = 'dashboard' | 'users' | 'plans' | 'settings' | 'reports'; // Adicionando 'reports'

interface AdminPageProps {
  setActiveHubModule: (module: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ setActiveHubModule }) => {
  const [activeAdminModule, setActiveAdminModule] = useState<AdminModule>('dashboard');

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'users', name: 'Clientes', icon: Users },
    { id: 'plans', name: 'Planos', icon: Zap },
    { id: 'reports', name: 'Relatórios SaaS', icon: BarChart3 }, // Novo módulo
    { id: 'settings', name: 'Configurações', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeAdminModule) {
      case 'dashboard': return <AdminDashboardPage />;
      case 'users': return <AdminUserManagementPage />;
      case 'plans': return <AdminPlanManagementPage />;
      case 'reports': return <AdminReportsPage />; // Renderizando o novo módulo
      case 'settings': return <AdminSettingsPage />;
      default: return <AdminDashboardPage />;
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
              className={`w-full flex items-center gap-3 p-2 rounded-md text-sm font-medium transition-colors ${
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