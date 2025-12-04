import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from './ui/dialog';
import { Zap, Check, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { PLAN_NAMES, DEFAULT_PERMISSIONS_BY_ROLE, Permission } from '../config/constants';
import { Profile } from '../../types';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError } from '../utils/toast';
import { usePlanConfigurations } from '../hooks/usePlanConfigurations'; // NOVO IMPORT

interface PlanUpgradeModalProps {
  profile: Profile;
  trigger: React.ReactNode;
  onPlanUpdated: (newRole: string) => void;
}

// Mapeamento de Permissões para Português (BR)
const PERMISSION_TRANSLATIONS: Record<Permission | string, string> = {
    'access_builder': 'Acesso a Criar Ofertas',
    'manage_products': 'Gerenciamento de Produtos',
    'manage_company_info': 'Gerenciamento de Info da Empresa',
    'access_signage': 'Acesso a TV Digital (Slides)',
    'access_social_media': 'Acesso a Redes Sociais',
    'access_ads': 'Acesso a Anúncios Áudio/Vídeo',
    'access_settings': 'Acesso a Configurações',
    'view_reports': 'Visualização de Relatórios',
    'manage_users': 'Gerenciamento de Clientes',
    // Features adicionais que não são chaves de permissão
    'Suporte Prioritário': 'Suporte Prioritário',
    'Dados da Empresa': 'Dados da Empresa',
};

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({ profile, trigger, onPlanUpdated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentPlan = profile.role;
  
  // Busca as configurações de planos dinamicamente
  const { plans, loading: loadingPlans } = usePlanConfigurations(false); 

  // Função de simulação de upgrade (mantida para o Plano Grátis)
  const handleSimulateUpgrade = async (newRole: string) => {
    if (newRole === currentPlan) return;

    setIsLoading(true);
    
    // 1. Obter as novas permissões (usando o DEFAULT_PERMISSIONS_BY_ROLE como fallback, 
    // mas idealmente, as permissões viriam do objeto 'plans' se o role for encontrado)
    const planConfig = plans.find(p => p.role === newRole);
    const newPermissions = planConfig?.permissions || DEFAULT_PERMISSIONS_BY_ROLE[newRole] || DEFAULT_PERMISSIONS_BY_ROLE.free;
    
    // 2. Atualizar o perfil no Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole, 
        permissions: newPermissions as Permission[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    setIsLoading(false);

    if (error) {
      console.error('Error updating plan:', error);
      showError('Falha ao atualizar o plano. Tente novamente.');
    } else {
      showSuccess(`Parabéns! Seu plano foi atualizado para ${PLAN_NAMES[newRole]}.`);
      onPlanUpdated(newRole); // Notifica o App para recarregar o perfil
      setIsOpen(false);
    }
  };
  
  // Função para simular o redirecionamento para o Mercado Pago
  const handleCheckout = (planRole: string) => {
    if (planRole === 'free') {
        // Permite o downgrade/seleção do plano grátis via simulação
        handleSimulateUpgrade(planRole);
        return;
    }
    
    // Em uma aplicação real, você chamaria uma Edge Function aqui para:
    // 1. Criar uma preferência de pagamento no Mercado Pago
    // 2. Retornar o link de checkout e redirecionar o usuário.
    
    const checkoutLink = `https://mercadopago.com.br/checkout/simulado?plan=${planRole}&user=${profile.id}`;
    
    alert(`Simulação de Checkout Mercado Pago para o plano ${PLAN_NAMES[planRole]}.\n\nEm uma aplicação real, você seria redirecionado para:\n${checkoutLink}\n\nApós o pagamento, o Mercado Pago Webhook atualizaria seu plano automaticamente.`);
    
    // Simula o redirecionamento (apenas para demonstração)
    window.open(checkoutLink, '_blank');
  };
  
  // Mapeia as configurações dinâmicas para o formato de exibição
  const displayPlans = plans.map(plan => {
      // Mapeia as permissões para nomes amigáveis usando o objeto de tradução
      const features = plan.permissions.map(p => PERMISSION_TRANSLATIONS[p] || p);
      
      // Adiciona features básicas que não são permissões (ex: suporte)
      if (plan.role === 'pro') {
          features.push(PERMISSION_TRANSLATIONS['Suporte Prioritário']);
      }
      // A permissão 'manage_company_info' já cobre 'Dados da Empresa', mas se quisermos adicionar um item extra:
      // if (plan.role === 'premium') {
      //     features.push(PERMISSION_TRANSLATIONS['Dados da Empresa']);
      // }
      
      return {
          id: plan.role,
          name: plan.name,
          price: plan.price,
          features: features,
          role: plan.role,
      };
  }).sort((a, b) => {
      // Ordena para garantir que Free, Premium, Pro apareçam na ordem correta
      const order = { 'free': 1, 'premium': 2, 'pro': 3, 'admin': 4 };
      return (order[a.role as keyof typeof order] || 5) - (order[b.role as keyof typeof order] || 5);
  }).filter(plan => plan.role !== 'admin'); // Admins não precisam de upgrade

  if (loadingPlans) {
      return (
          <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
      );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] bg-white rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-indigo-600 flex items-center justify-center gap-2">
            <Zap size={32} />
            Escolha o Plano Ideal
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Seu plano atual é: <span className="font-bold text-indigo-600">{PLAN_NAMES[currentPlan]}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {displayPlans.map((plan) => {
            const isCurrent = plan.role === currentPlan;
            const isUpgrade = !isCurrent && (plan.role === 'premium' || plan.role === 'pro');
            const isDowngrade = !isCurrent && plan.role === 'free' && currentPlan !== 'free';

            return (
              <div 
                key={plan.id} 
                className={`p-6 rounded-xl shadow-lg border-4 transition-all ${
                  isCurrent 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : isUpgrade
                      ? 'border-gray-200 hover:border-indigo-400' 
                      : 'border-gray-200 bg-gray-50'
                } flex flex-col`}
              >
                <h4 className="text-2xl font-bold mb-2" style={{ color: isCurrent ? '#4f46e5' : '#1f2937' }}>{plan.name}</h4>
                {/* Ajuste de tamanho da fonte para caber em uma linha */}
                <p className="text-3xl font-black mb-4">{plan.price}</p>
                
                <div className="flex-1 space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <p key={index} className="flex items-start text-sm text-gray-700">
                      <Check size={16} className="text-green-500 mr-2 mt-1 shrink-0" />
                      {feature}
                    </p>
                  ))}
                </div>
                
                <button
                  onClick={() => handleCheckout(plan.role)}
                  disabled={isCurrent || isLoading}
                  className={`w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white cursor-default opacity-80'
                      : isUpgrade
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-800 shadow-md'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : isCurrent ? (
                    'Plano Atual'
                  ) : isUpgrade ? (
                    <>
                      Fazer Upgrade <ExternalLink size={16} />
                    </>
                  ) : (
                    'Selecionar Plano'
                  )}
                </button>
                {isDowngrade && <p className="text-xs text-center text-red-500 mt-2">Atenção: Isso simula um downgrade.</p>}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
            * Este é um ambiente de demonstração. O upgrade simula a alteração do seu plano no banco de dados ou redireciona para um checkout simulado.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanUpgradeModal;