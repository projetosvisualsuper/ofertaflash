import React from 'react';
import { Lock, ArrowUpCircle } from 'lucide-react';
import { PLAN_NAMES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import PlanUpgradeModal from './PlanUpgradeModal';

interface ContentUpgradeOverlayProps {
  children: React.ReactNode;
  requiredPlan: 'premium' | 'pro';
}

const ContentUpgradeOverlay: React.FC<ContentUpgradeOverlayProps> = ({ children, requiredPlan }) => {
  const { profile, refreshProfile } = useAuth();
  
  if (!profile) return <>{children}</>; // Não bloqueia se não houver perfil (deve ser tratado pelo App.tsx)

  const requiredPlanName = PLAN_NAMES[requiredPlan];
  const upgradeText = `Disponível nos planos ${PLAN_NAMES.premium} e ${PLAN_NAMES.pro}.`;

  return (
    <div className="relative">
      {/* Conteúdo com blur */}
      <div className="pointer-events-none" style={{ filter: 'blur(3px)', opacity: 0.5 }}>
        {children}
      </div>
      
      {/* Overlay de Bloqueio */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center p-6 bg-white rounded-xl shadow-2xl border-4 border-red-100">
          <Lock size={32} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Recurso Premium</h3>
          <p className="text-sm text-gray-600 mb-4">{upgradeText}</p>
          
          <PlanUpgradeModal 
            profile={profile} 
            onPlanUpdated={refreshProfile}
            trigger={
              <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-md transition-colors">
                <ArrowUpCircle size={14} /> Ver Planos
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ContentUpgradeOverlay;