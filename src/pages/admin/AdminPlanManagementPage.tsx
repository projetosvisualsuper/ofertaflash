import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, CheckCircle, Edit, Loader2, DollarSign } from 'lucide-react';
import { usePlanConfigurations, PlanConfiguration } from '../../hooks/usePlanConfigurations';
import AdminEditPlanModal from '../../components/admin/AdminEditPlanModal';
import AdminCreditPackagesPage from './AdminCreditPackagesPage'; // Importando a nova página

const AdminPlanManagementPage: React.FC = () => {
  const { plans, loading, updatePlan, fetchPlans } = usePlanConfigurations(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanConfiguration | null>(null);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'credits'>('subscriptions');

  const handleEditClick = (plan: PlanConfiguration) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleSavePlan = async (role: string, updates: Partial<PlanConfiguration>) => {
    await updatePlan(role, updates);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="ml-4 text-gray-600">Carregando configurações de planos...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Zap size={24} /> Gerenciamento de Planos e Créditos
      </h2>
      
      {/* Tabs de Navegação */}
      <div className="flex border-b mb-6">
        <button 
          onClick={() => setActiveTab('subscriptions')}
          className={`py-3 px-6 text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'subscriptions' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap size={16} /> Planos de Assinatura
        </button>
        <button 
          onClick={() => setActiveTab('credits')}
          className={`py-3 px-6 text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'credits' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <DollarSign size={16} /> Pacotes de Crédito Avulso
        </button>
      </div>

      {activeTab === 'subscriptions' && (
        <>
          <p className="text-sm text-gray-600 mb-6">
            Visualize e edite as permissões e detalhes de cada plano (Role) do sistema.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.role} className="bg-white p-6 rounded-lg shadow-md border-t-4 border-indigo-500 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-indigo-600">{plan.name}</h3>
                    <button 
                      onClick={() => handleEditClick(plan)}
                      className="p-1 text-gray-500 hover:text-indigo-600 rounded-full transition-colors"
                      title="Editar Plano"
                    >
                      <Edit size={18} />
                    </button>
                  </div>
                  <p className="text-2xl font-black mb-4 text-gray-800">{plan.price}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">Permissões Incluídas:</h4>
                    <ul className="space-y-1 max-h-40 overflow-y-auto text-xs p-2 bg-gray-50 rounded-md">
                      {plan.permissions.length > 0 ? (
                        plan.permissions.map(permission => (
                          <li key={permission} className="flex items-center gap-2 text-gray-600">
                            <CheckCircle size={14} className="text-green-500 shrink-0" />
                            {permission}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 italic">Nenhuma permissão definida.</li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">Créditos de IA: {plan.ai_credits}</div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {activeTab === 'credits' && (
        <AdminCreditPackagesPage />
      )}
      
      {selectedPlan && (
        <AdminEditPlanModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          plan={selectedPlan}
          onSave={handleSavePlan}
        />
      )}
    </div>
  );
};

export default AdminPlanManagementPage;