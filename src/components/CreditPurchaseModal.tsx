import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from './ui/dialog';
import { Zap, DollarSign, Loader2, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showLoading, updateToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { useCreditPackages, CreditPackage } from '../hooks/useCreditPackages'; // Importando o hook dinâmico

interface CreditPurchaseModalProps {
  trigger: React.ReactNode;
}

const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({ trigger }) => {
  const { session } = useAuth();
  const { packages, loading: loadingPackages } = useCreditPackages(false); // Busca apenas pacotes ativos
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Define o primeiro pacote como selecionado por padrão ao carregar
  useEffect(() => {
    if (isOpen && packages.length > 0 && !selectedPackage) {
        setSelectedPackage(packages[0]);
    }
  }, [isOpen, packages, selectedPackage]);

  const handleCheckout = async () => {
    if (!selectedPackage || !session?.user?.id) {
        showError("Selecione um pacote e faça login.");
        return;
    }
    
    setIsLoading(true);
    const loadingToast = showLoading(`Iniciando checkout para ${selectedPackage.name}...`);

    try {
        // 1. Chamar a Edge Function para criar a preferência de pagamento
        const { data, error } = await supabase.functions.invoke('mercadopago-credit-checkout', {
            method: 'POST',
            body: { 
                amount: selectedPackage.amount,
                price: selectedPackage.price,
                userId: session.user.id,
            },
            headers: {
                'Authorization': 'Bearer ' + session.access_token, 
            }
        });

        if (error) {
            const edgeFunctionError = (error as any).context?.body?.error || error.message;
            throw new Error(edgeFunctionError);
        }
        
        if (data.error) throw new Error(data.error);
        
        const checkoutLink = data.checkoutLink;
        if (!checkoutLink) throw new Error("A Edge Function não retornou o link de checkout.");

        // 2. Redirecionar o usuário para o link de checkout
        window.location.href = checkoutLink;
        
        updateToast(loadingToast, "Redirecionando para o Mercado Pago...", 'success');

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error("Credit Checkout Error:", errorMessage);
        
        let userMessage = "Falha ao iniciar o checkout. Verifique as chaves de API no Supabase Secrets.";
        
        if (errorMessage.includes('Mercado Pago API failed')) {
            userMessage = errorMessage;
        } else if (errorMessage.includes('not configured in Supabase Secrets')) {
            userMessage = 'Erro: MERCADOPAGO_ACCESS_TOKEN não configurado no Supabase Secrets.';
        } else if (errorMessage.includes('401 (Unauthorized)')) {
            userMessage = 'Erro de Autorização (401). Tente fazer logout e login novamente para renovar sua sessão.';
        } else {
            userMessage = errorMessage;
        }
        
        updateToast(loadingToast, userMessage, 'error');
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] bg-white rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center text-green-600 flex items-center justify-center gap-2">
            <DollarSign size={32} />
            Comprar Créditos de IA
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Adicione créditos avulsos para continuar usando os assistentes de IA.
          </DialogDescription>
        </DialogHeader>
        
        {loadingPackages ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                <p className="ml-3 text-gray-600">Carregando pacotes de crédito...</p>
            </div>
        ) : packages.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed">
                <AlertTriangle size={24} className="text-yellow-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-gray-700">Nenhum pacote de crédito disponível.</p>
                <p className="text-sm text-gray-500">O administrador precisa configurar os pacotes.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <div 
                    key={pkg.id} 
                    className={`p-5 rounded-xl shadow-lg border-4 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-green-400 bg-white'
                    } flex flex-col`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <div className="flex justify-between items-start">
                        <h4 className="text-xl font-bold mb-1" style={{ color: isSelected ? '#16a34a' : '#1f2937' }}>{pkg.name}</h4>
                        {isSelected && <Check size={20} className="text-green-600 shrink-0" />}
                    </div>
                    <p className="text-3xl font-black mb-4 text-gray-800">R$ {pkg.price.toFixed(2).replace('.', ',')}</p>
                    
                    <div className="flex-1 space-y-2 mb-4">
                        <p className="text-sm text-gray-700 flex items-center gap-2">
                            <Zap size={16} className="text-yellow-500 shrink-0" />
                            <span className="font-bold">{pkg.amount.toLocaleString('pt-BR')}</span> Créditos de IA
                        </p>
                        <p className="text-xs text-gray-500">{pkg.description}</p>
                    </div>
                    
                    <button
                      disabled={isLoading}
                      className={`w-full py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm ${
                        isSelected
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                );
              })}
            </div>
        )}
        
        <DialogFooter className="mt-4 flex justify-end">
            <button
              onClick={handleCheckout}
              disabled={isLoading || !selectedPackage || loadingPackages}
              className="py-3 px-6 rounded-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2 text-base bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowRight size={20} />
              )}
              {isLoading ? 'Processando Pagamento...' : `Pagar R$ ${selectedPackage?.price.toFixed(2).replace('.', ',') || '0,00'}`}
            </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreditPurchaseModal;