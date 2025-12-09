import React, { useState, useEffect } from 'react';
import { Zap, DollarSign, Save, Loader2, Edit, Check, X } from 'lucide-react';
import { useAICosts, AICost } from '../../hooks/useAICosts';
import { useAuth } from '../../context/AuthContext';
import { showError } from '../../utils/toast';

const AdminAICostsPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { costs, loading, updateCost } = useAICosts(isAdmin);
  
  const [localCosts, setLocalCosts] = useState<AICost[]>([]);
  const [isSavingCost, setIsSavingCost] = useState<string | null>(null);

  useEffect(() => {
    // Sincroniza os custos carregados com o estado local
    setLocalCosts(costs);
  }, [costs]);

  const handleCostChange = (serviceKey: string, field: 'cost' | 'description', value: string | number) => {
    setLocalCosts(prev => prev.map(cost => 
      cost.service_key === serviceKey 
        ? { ...cost, [field]: value } 
        : cost
    ));
  };

  const handleSaveCost = async (cost: AICost) => {
    if (!isAdmin) {
      showError("Apenas administradores podem salvar estas configurações.");
      return;
    }
    
    const newCost = typeof cost.cost === 'string' ? parseInt(cost.cost, 10) : cost.cost;
    if (isNaN(newCost) || newCost < 0) {
        showError("O custo deve ser um número positivo.");
        return;
    }
    
    setIsSavingCost(cost.service_key);
    try {
        await updateCost(cost.service_key, newCost, cost.description);
    } catch (e) {
        // Erro já tratado no hook
    } finally {
        setIsSavingCost(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-500">Acesso negado.</div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="ml-4 text-gray-600">Carregando custos de IA...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <DollarSign size={32} className="text-purple-600" />
        Gerenciamento de Custos de IA
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Defina quantos créditos de IA cada serviço consome. Estes custos são aplicados a todos os usuários, exceto administradores.
      </p>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-4xl">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
            <Zap size={20} className="text-purple-600" /> Serviços de IA
        </h3>
        
        <div className="space-y-4">
            {localCosts.map(cost => {
                const isSavingCurrent = isSavingCost === cost.service_key;
                return (
                <div key={cost.service_key} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-800">{cost.service_key.replace(/_/g, ' ').toUpperCase()}</h4>
                        <button
                            onClick={() => handleSaveCost(cost)}
                            disabled={isSavingCurrent}
                            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                        >
                            {isSavingCurrent ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                            {isSavingCurrent ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                    
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Descrição do Serviço</label>
                        <input
                            type="text"
                            value={cost.description}
                            onChange={(e) => handleCostChange(cost.service_key, 'description', e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            disabled={isSavingCurrent}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Custo em Créditos</label>
                            <div className="relative flex items-center">
                                <input
                                    type="number"
                                    min="0"
                                    value={String(cost.cost)} 
                                    onChange={(e) => handleCostChange(cost.service_key, 'cost', parseInt(e.target.value, 10))}
                                    className="w-full border rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                                    disabled={isSavingCurrent}
                                />
                                <DollarSign size={16} className="absolute right-3 text-gray-400" />
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
        </div>
      </div>
    </div>
  );
};

export default AdminAICostsPage;