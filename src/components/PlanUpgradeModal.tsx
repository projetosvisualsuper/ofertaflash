import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from './ui/dialog';
import { Zap, Check, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { PLAN_NAMES, DEFAULT_PERMISSIONS_BY_ROLE, Permission } from '../config/constants';
import { Profile } from '../../types';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError, showLoading, updateToast } from '../utils/toast';
import { usePlanConfigurations } from '../hooks/usePlanConfigurations';
import { useAuth } from '../context/AuthContext'; // Importando useAuth

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
    'Suporte Prioritário': 'Suporte Prioritário',
    'Dados da Empresa': 'Dados da Empresa',
};

const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({ profile, trigger, onPlanUpdated }) => {
  const { session } = useAuth(); // Obtendo a sessão aqui
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const currentPlan = profile.role;
  
  // Busca as configurações de planos dinamicamente
  const { plans, loading: loadingPlans } = usePlanConfigurations(false); 

  // Função de simulação de upgrade (mantida APENAS para o Plano Grátis)
  const handleSimulateUpgrade = async (newRole: string) => {
    if (newRole === currentPlan) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    
    const planConfig = plans.find(p => p.role === newRole);
    const newPermissions = planConfig?.permissions || DEFAULT_PERMISSIONS_BY_ROLE[newRole] || DEFAULT_PERMISSIONS_BY_ROLE.free;
    
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
      onPlanUpdated(newRole);
      setIsOpen(false);
    }
  };
  
  // Função para iniciar o checkout real
  const handleCheckout = async (planRole: string) => {
    if (planRole === 'free') {
        // O Plano Grátis usa a simulação para garantir que o perfil seja atualizado para 'free'
        handleSimulateUpgrade(planRole);
        return;
    }
    
    setIsLoading(true);
    const loadingToast = showLoading(`Iniciando checkout para o plano ${PLAN_NAMES[planRole]}...`);

    try {
        // 1. Chamar a Edge Function para criar a preferência de pagamento
        const { data, error } = await supabase.functions.invoke('mercadopago-checkout', {
            method: 'POST',
            body: { 
                planRole: planRole,
                userId: profile.id,
                userEmail: session?.user?.email, // <-- ENVIANDO O EMAIL DO USUÁRIO
            },
            // Adicionando o access_token da sessão
            headers: {
                'Authorization': 'Bearer ' + session?.access_token, 
            }
        });

        if (error) {
            // Se o SDK retornar um erro de invocação (non-2xx status code)
            // Tentamos extrair a mensagem de erro do corpo da resposta da Edge Function, se disponível.
            const edgeFunctionError = (error as any).context?.body?.error || error.message;
            throw new Error(edgeFunctionError);
        }
        
        if (data.error) throw new Error(data.error);
        
        const checkoutLink = data.checkoutLink;
        if (!checkoutLink) throw new Error("A Edge Function não retornou o link de checkout.");

        // 2. Redirecionar o usuário para o link de checkout real
        window.location.href = checkoutLink;
        
        updateToast(loadingToast, "Redirecionando para o Mercado Pago...", 'success');

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Checkout Error:", errorMessage);
        
        let userMessage = "Falha ao iniciar o checkout. Verifique as chaves de API no Supabase Secrets.";
        
        if (errorMessage.includes('Mercado Pago API failed')) {
            // Se a Edge Function retornou um erro detalhado do MP, usamos ele.
            userMessage = errorMessage;
        } else if (errorMessage.includes('not configured in Supabase Secrets')) {
            userMessage = 'Erro: MERCADOPAGO_ACCESS_TOKEN não configurado no Supabase Secrets.';
        } else if (errorMessage.includes('Plan configuration not found')) {
            userMessage = 'Erro: Configuração do plano não encontrada no banco de dados.';
        } else if (errorMessage.includes('401 (Unauthorized)')) {
            userMessage = 'Erro de Autorização (401). Tente fazer logout e login novamente para renovar sua sessão.';
        } else {
            userMessage = errorMessage;
        }
        
        updateToast(loadingToast, userMessage, 'error');
        setIsLoading(false);
    }
  };
  
  // Mapeia as configurações dinâmicas para o formato de exibição
  const displayPlans = plans.map(plan => {
      const features = plan.permissions.map(p => PERMISSION_TRANSLATIONS[p] || p);
      
      if (plan.role === 'pro') {
          features.push(PERMISSION_TRANSLATIONS['Suporte Prioritário']);
      }
      
      return {
          id: plan.role,
          name: plan.name,
          price: plan.price,
          features: features,
          role: plan.role,
      };
  }).sort((a, b) => {
      const order = { 'free': 1, 'premium': 2, 'pro': 3, 'admin': 4 };
      return (order[a.role as keyof typeof order] || 5) - (order[b.role as keyof typeof order] || 5);
  }).filter(plan => plan.role !== 'admin');

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
                
                {/* Botão de Simulação removido */}
                {isDowngrade && <p className="text-xs text-center text-red-500 mt-2">Atenção: Isso simula um downgrade.</p>}
              </div>
            );
          })}
        </div>
        
        {/* Mensagem de demonstração removida */}
      </DialogContent>
    </Dialog>
  );
};

export default PlanUpgradeModal;