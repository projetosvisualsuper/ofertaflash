import React from 'react';
import { Lock, ArrowUpCircle } from 'lucide-react';
import { PLAN_NAMES } from '../config/constants';
import { useAuth } from '../context/AuthContext';
import PlanUpgradeModal from './PlanUpgradeModal';

interface UpgradeOverlayProps {
  requiredPermission: string;
}

const UpgradeOverlay: React.FC<UpgradeOverlayProps> = ({ requiredPermission }) => {
  const { profile, refreshProfile } = useAuth();
  
  if (!profile) return null;

  const requiredPlan = requiredPermission === 'manage_users' || requiredPermission === 'access_settings' 
    ? PLAN_NAMES.pro 
    : PLAN_NAMES.premium;
    
  const upgradeText = requiredPermission === 'manage_users' || requiredPermission === 'access_settings' 
    ? `Disponível apenas no ${PLAN_NAMES.pro}.`
    : `Disponível nos planos ${PLAN_NAMES.premium} e ${PLAN_NAMES.pro}.`;

  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-2xl border-4 border-red-100">
        <Lock size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Recurso Bloqueado</h3>
        <p className="text-gray-600 mb-6">{upgradeText}</p>
        
        <PlanUpgradeModal 
          profile={profile} 
          onPlanUpdated={refreshProfile}
          trigger={
            <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold py-3 px-6 rounded-lg shadow-lg transition-colors">
              <ArrowUpCircle size={20} /> Ver Planos e Fazer Upgrade
            </button>
          }
        />
      </div>
    </div>
  );
};

export default UpgradeOverlay;