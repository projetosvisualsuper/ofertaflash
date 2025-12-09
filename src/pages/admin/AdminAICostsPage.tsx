import React, { useState, useEffect } from 'react';
import { Zap, Save, Loader2, DollarSign } from 'lucide-react';
import { useAICosts, AICost } from '../../hooks/useAICosts';
import { useAuth } from '../../context/AuthContext';
import { showError } from '../../utils/toast';

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

export default AdminAICostsPage;