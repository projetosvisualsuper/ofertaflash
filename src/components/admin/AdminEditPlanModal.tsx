import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { PlanConfiguration } from '../../hooks/usePlanConfigurations';
import { PERMISSIONS, PLAN_NAMES } from '../../config/constants';
import { Loader2, Save, Check, X, DollarSign } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

interface AdminEditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanConfiguration | null;
  onSave: (role: string, updates: Partial<PlanConfiguration>) => Promise<void>;
}

const AdminEditPlanModal: React.FC<AdminEditPlanModalProps> = ({ isOpen, onClose, plan, onSave }) => {
  const [localPlan, setLocalPlan] = useState<PlanConfiguration | null>(plan);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalPlan(plan);
  }, [plan]);

  if (!localPlan) return null;
  
  const allPermissions = PERMISSIONS;

  const handlePermissionToggle = (permission: string) => {
    setLocalPlan(prev => {
      if (!prev) return null;
      const currentPermissions = prev.permissions;
      const newPermissions = currentPermissions.includes(permission as any)
        ? currentPermissions.filter(p => p !== permission)
        : [...currentPermissions, permission as any];
      
      return { ...prev, permissions: newPermissions };
    });
  };
  
  const handleSave = async () => {
    console.log("Attempting to save plan:", localPlan); // Log de execução
    
    if (!localPlan.name.trim() || !localPlan.price.trim()) {
      showError("Nome e Preço são obrigatórios.");
      return;
    }
    
    const aiCredits = parseInt(localPlan.ai_credits as any, 10);
    if (isNaN(aiCredits) || aiCredits < 0) {
        showError("Créditos de IA devem ser um número positivo.");
        return;
    }
    
    setIsLoading(true);
    
    try {
        await onSave(localPlan.role, {
          name: localPlan.name,
          price: localPlan.price,
          permissions: localPlan.permissions,
          ai_credits: aiCredits, // Salvando créditos
        });
        // Se onSave for bem-sucedido (o hook usePlanConfigurations deve mostrar o toast de sucesso)
        onClose();
    } catch (error) {
        // O erro já deve ser tratado e exibido pelo hook usePlanConfigurations
        console.error("Error during plan save process:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle>Editar Plano: {PLAN_NAMES[localPlan.role] || localPlan.name}</DialogTitle>
          <DialogDescription>
            Ajuste o nome, preço, créditos de IA e as permissões concedidas por este plano.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Detalhes Básicos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nome do Plano</label>
              <input
                type="text"
                value={localPlan.name}
                onChange={(e) => setLocalPlan(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Preço (Ex: R$ 99 / mês)</label>
              <input
                type="text"
                value={localPlan.price}
                onChange={(e) => setLocalPlan(prev => prev ? { ...prev, price: e.target.value } : null)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          
          {/* Créditos de IA */}
          <div className="space-y-2 border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" /> Créditos de IA (Recarga Mensal)
            </h4>
            <p className="text-sm text-gray-600">
                Defina o saldo de créditos que o usuário receberá ao entrar ou fazer upgrade para este plano.
            </p>
            <div className="relative">
                <input
                    type="number"
                    min="0"
                    value={localPlan.ai_credits}
                    onChange={(e) => setLocalPlan(prev => prev ? { ...prev, ai_credits: parseInt(e.target.value, 10) } : null)}
                    className="w-full border rounded-lg px-3 py-2 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                />
                <Zap size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500" />
            </div>
          </div>

          {/* Permissões */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-800">Permissões do Plano</h4>
            <p className="text-sm text-gray-600">Selecione os recursos que este plano deve incluir.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2 border rounded-lg bg-gray-50">
              {allPermissions.map(permission => {
                const isChecked = localPlan.permissions.includes(permission);
                
                // Bloqueia a edição de permissões do Admin (deve ter todas)
                const isDisabled = localPlan.role === 'admin';

                return (
                  <div 
                    key={permission} 
                    className={`flex items-center p-2 rounded-md border transition-colors ${
                      isChecked ? 'bg-green-100 border-green-500' : 'bg-white hover:bg-gray-100'
                    } ${isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !isDisabled && handlePermissionToggle(permission)}
                  >
                    {isChecked ? <Check size={16} className="text-green-600 mr-2" /> : <X size={16} className="text-gray-400 mr-2" />}
                    <span className="text-xs font-medium text-gray-700 flex-1">{permission}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Salvar Configuração
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditPlanModal;