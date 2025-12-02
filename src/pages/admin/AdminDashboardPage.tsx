import React from 'react';
import { Home, Users, DollarSign, Clock, Loader2, UserPlus, Image, Zap, BarChart3 } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdminStats';
import { useRecentActivities, Activity } from '../../hooks/useRecentActivities';

interface AdminDashboardPageProps {
  setActiveHubModule: (module: string) => void;
}

// Componente auxiliar para formatar a data
const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} segundos atrás`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas atrás`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} dias atrás`;
  
  return past.toLocaleDateString();
};

const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
  let Icon;
  let colorClass;

  switch (activity.type) {
    case 'signup':
      Icon = UserPlus;
      colorClass = 'text-blue-600 bg-blue-100';
      break;
    case 'saved_art':
      Icon = Image;
      colorClass = 'text-purple-600 bg-purple-100';
      break;
    default:
      Icon = Zap;
      colorClass = 'text-gray-600 bg-gray-100';
  }

  return (
    <li className="flex items-start space-x-3 p-3 hover:bg-gray-50 transition-colors rounded-lg">
      <div className={`flex-shrink-0 p-2 rounded-full ${colorClass}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{activity.description}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatTimeAgo(activity.timestamp)}
        </p>
      </div>
    </li>
  );
};

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ setActiveHubModule }) => {
  const { stats, loading: loadingStats } = useAdminStats();
  const { activities, loading: loadingActivities } = useRecentActivities();

  if (loadingStats) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="ml-4 text-gray-600">Carregando dados do sistema...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard do Administrador</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full"><Users className="text-blue-600" size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Total de Clientes</p>
            <p className="text-2xl font-bold">{stats.total_users}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full"><DollarSign className="text-green-600" size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Assinaturas Pagas</p>
            <p className="text-2xl font-bold">{stats.paid_subscriptions}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-full"><Clock className="text-yellow-600" size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Usuários Ativos</p>
            <p className="text-2xl font-bold">{stats.active_users}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-full"><Home className="text-indigo-600" size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Novos Cadastros (7d)</p>
            <p className="text-2xl font-bold">{stats.recent_signups_7d}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Atividades Recentes */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h3 className="font-semibold mb-4 border-b pb-2">Atividades Recentes</h3>
          
          {loadingActivities ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className="ml-3 text-gray-600 text-sm">Buscando atividades...</p>
            </div>
          ) : activities.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm p-4 text-center">Nenhuma atividade recente encontrada.</p>
          )}
        </div>
        
        {/* Link para Relatórios */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
            <h3 className="font-semibold text-lg mb-4">Relatórios Detalhados</h3>
            <p className="text-sm text-gray-600 mb-4">
                Acesse o módulo de Relatórios para visualizar métricas de engajamento, formatos mais populares e uso de produtos.
            </p>
            <button 
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                onClick={() => setActiveHubModule('reports')}
            >
                <BarChart3 size={16} /> Ver Relatórios
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;