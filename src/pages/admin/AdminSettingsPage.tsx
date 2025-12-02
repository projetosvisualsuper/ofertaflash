import React from 'react';
import { Settings, Key, ToggleLeft, ToggleRight, Loader2, Bell } from 'lucide-react';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';
import { useAuth } from '../../context/AuthContext';

const AdminSettingsPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { settings, loading, updateMaintenanceMode } = useGlobalSettings(isAdmin);

  const isMaintenanceEnabled = settings.maintenance_mode.enabled;

  const handleToggleMaintenance = () => {
    updateMaintenanceMode(!isMaintenanceEnabled);
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings size={32} className="text-indigo-600" />
        Configurações Gerais do Sistema
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            <p className="ml-3 text-gray-600">Carregando configurações...</p>
          </div>
        ) : (
          <>
            {/* Modo Manutenção */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Modo Manutenção</h3>
              <div className={`flex items-center justify-between p-4 rounded-md border transition-colors ${isMaintenanceEnabled ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                <p className={`text-sm font-medium ${isMaintenanceEnabled ? 'text-red-800' : 'text-green-800'}`}>
                  {isMaintenanceEnabled ? 'Modo Manutenção ATIVADO. Apenas admins podem acessar.' : 'Modo Manutenção DESATIVADO. Acesso normal.'}
                </p>
                <button 
                  onClick={handleToggleMaintenance}
                  className={`p-1 rounded-full transition-colors ${isMaintenanceEnabled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
                  title={isMaintenanceEnabled ? "Desativar Manutenção" : "Ativar Manutenção"}
                >
                  {isMaintenanceEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Ativar esta opção restringe o acesso ao aplicativo apenas para usuários com o papel 'admin'.</p>
            </div>

            {/* Anúncios Globais (Ainda em desenvolvimento) */}
            <div>
              <h3 className="font-semibold text-lg mb-2">Anúncios Globais</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border">
                <p className="text-sm text-gray-600">Enviar uma notificação para todos os usuários.</p>
                <button className="text-gray-400 cursor-not-allowed" disabled>
                  <Bell size={24} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Funcionalidade em desenvolvimento.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;