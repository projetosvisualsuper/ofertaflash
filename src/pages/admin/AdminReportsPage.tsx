import React from 'react';
import { BarChart3, Users, DollarSign, Image, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdminStats';

const AdminReportsPage: React.FC = () => {
  const { stats, loading } = useAdminStats();
  
  // Dados de engajamento mockados para o Admin
  const engagementStats = {
    totalArtsSaved: 1280,
    mostUsedFormat: 'Story / TikTok',
    monthlyGrowth: 15,
    averageProductsPerArt: 3.5,
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BarChart3 size={24} /> Relatórios Gerais do SaaS
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Métricas de alto nível sobre a saúde e o uso da plataforma por todos os clientes.
      </p>
      
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Métricas de Negócio */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <div className="p-3 bg-yellow-100 rounded-full"><TrendingUp className="text-yellow-600" size={24} /></div>
              <div>
                <p className="text-sm text-gray-500">Crescimento Mensal</p>
                <p className="text-2xl font-bold">+{engagementStats.monthlyGrowth}%</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full"><Image className="text-purple-600" size={24} /></div>
              <div>
                <p className="text-sm text-gray-500">Total de Artes Salvas</p>
                <p className="text-2xl font-bold">{engagementStats.totalArtsSaved}</p>
              </div>
            </div>
          </div>

          {/* Gráficos de Engajamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold mb-4 text-lg">Uso de Formatos</h3>
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed">
                <div className="text-center text-gray-400">
                  <Zap size={48} className="mx-auto" />
                  <p className="mt-2 text-sm">Gráfico de formatos mais usados em desenvolvimento.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold mb-4 text-lg">Criação de Artes por Plano</h3>
              <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed">
                <div className="text-center text-gray-400">
                  <BarChart3 size={48} className="mx-auto" />
                  <p className="mt-2 text-sm">Gráfico de engajamento por plano em desenvolvimento.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;