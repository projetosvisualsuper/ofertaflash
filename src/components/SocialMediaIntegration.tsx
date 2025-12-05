import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter, Linkedin, ExternalLink, LogOut, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocialMediaAccounts } from '../hooks/useSocialMediaAccounts';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';

const SocialMediaIntegration: React.FC = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { accounts, loading, deleteAccount, fetchAccounts } = useSocialMediaAccounts(userId);
  
  const isMetaConnected = accounts.some(a => a.platform === 'meta');
  const metaAccount = accounts.find(a => a.platform === 'meta');
  
  const [metaAppId, setMetaAppId] = useState<string | null>(null);
  const [metaAppIdStatus, setMetaAppIdStatus] = useState<'loading' | 'configured' | 'missing'>('loading');
  const [isCheckingCallback, setIsCheckingCallback] = useState(false); 

  // Efeito para verificar erros de callback na URL e buscar status dos segredos
  useEffect(() => {
    const checkStatusAndErrors = async () => {
        // 1. Buscar o META_APP_ID real
        try {
            const { data, error } = await supabase.functions.invoke('get-meta-app-id', { method: 'GET' });
            
            if (error || !data || data.error) {
                setMetaAppIdStatus('missing');
                setMetaAppId(null);
            } else {
                setMetaAppId(data.metaAppId);
                setMetaAppIdStatus('configured');
            }
        } catch (e) {
            console.error("Failed to check secrets status:", e);
            setMetaAppIdStatus('missing');
            setMetaAppId(null);
        }
        
        // 2. Verificar se estamos voltando de um callback
        const url = new URL(window.location.href);
        let errorParam = url.searchParams.get('error');
        const successParam = url.searchParams.get('meta_connect'); 
        
        // Tratamento de erro específico para o erro 400 (falha na troca de token)
        if (errorParam && errorParam.includes('Meta token exchange failed: 400')) {
            errorParam = "Falha na troca de token (Erro 400). Verifique se o META_APP_SECRET está correto e se a URL de redirecionamento está configurada no Meta.";
        }
        
        // Limpa os parâmetros de consulta da URL
        url.searchParams.delete('error');
        url.searchParams.delete('meta_connect');
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
        
        if (errorParam) {
          showError(`Erro de Conexão: ${decodeURIComponent(errorParam)}`);
        }
        
        if (successParam === 'success') {
            setIsCheckingCallback(true); // Ativa o carregamento
            showSuccess("Conexão Meta estabelecida! Buscando detalhes da conta...");
            
            // Força a busca de contas após um pequeno atraso para dar tempo ao DB
            setTimeout(() => {
                fetchAccounts().finally(() => {
                    setIsCheckingCallback(false);
                });
            }, 500); // Atraso de 500ms
        }
    };

    checkStatusAndErrors();
  }, [fetchAccounts]);

  // Função para iniciar o fluxo de autenticação do Meta (Facebook/Instagram)
  const handleConnectMeta = async () => {
    if (!userId) {
        showError("Usuário não autenticado.");
        return;
    }
    
    if (metaAppIdStatus !== 'configured' || !metaAppId) {
        showError("Erro: O ID do Aplicativo Meta não está configurado corretamente no Supabase Secrets.");
        return;
    }
    
    const REDIRECT_URI = `https://cdktwczejznbqfzmizpu.supabase.co/functions/v1/meta-oauth-callback`;
    
    // Força a URL de origem a ser a URL de produção configurada no Meta
    const appOrigin = 'https://criarofertas.vercel.app';
        
    const statePayload = `${userId}|${appOrigin}`;

    // AGORA USAMOS O ID REAL DO APLICATIVO
    const scopes = [
        'public_profile', 
        'pages_read_engagement', 
        'pages_manage_posts'
    ].join(',');
    
    const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&state=${encodeURIComponent(statePayload)}`;
    
    // Redireciona o usuário para o Meta para iniciar o login
    window.location.href = authUrl;
  };
  
  const handleDisconnectMeta = () => {
    if (metaAccount) {
        deleteAccount(metaAccount.id, 'Meta/Facebook');
    }
  };
  
  const metaButtonDisabled = loading || metaAppIdStatus !== 'configured';
  
  // Se estiver carregando as contas OU verificando o callback, mostre o spinner
  const isMetaLoading = loading || isCheckingCallback;

  return (
    <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
            <ExternalLink size={20} className="text-indigo-600" /> Integrações de Redes Sociais
        </h3>
        
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
                <Facebook size={24} className="text-indigo-600" />
                <div>
                    <p className="font-semibold text-indigo-800">Meta (Facebook & Instagram)</p>
                    <p className="text-sm text-gray-700">
                        Conecte sua conta para publicar artes diretamente nas suas páginas e perfis.
                    </p>
                </div>
            </div>
            
            {metaAppIdStatus === 'loading' && (
                <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg">
                    <Loader2 size={16} className="animate-spin mr-2" /> Verificando segredos...
                </div>
            )}
            
            {metaAppIdStatus === 'missing' && (
                <div className="p-3 bg-red-100 rounded-lg border border-red-400 text-sm font-medium text-red-800">
                    ERRO: Segredos META_APP_ID e META_APP_SECRET não configurados.
                    <p className="mt-1 text-xs">Consulte a página de <a href="#settings" className="font-bold underline">Configurações</a> para instruções.</p>
                </div>
            )}
            
            {isMetaLoading ? (
                <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg">
                    <Loader2 size={16} className="animate-spin mr-2" /> {isCheckingCallback ? 'Finalizando conexão...' : 'Carregando status...'}
                </div>
            ) : isMetaConnected && metaAccount ? (
                <div className="flex items-center justify-between p-3 bg-green-100 rounded-lg border border-green-400">
                    <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                        <Check size={16} /> Conectado: {metaAccount.accountName}
                    </p>
                    <button 
                        onClick={handleDisconnectMeta}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                        disabled={loading}
                    >
                        <LogOut size={12} /> Desconectar
                    </button>
                </div>
            ) : (
                <button 
                    onClick={handleConnectMeta}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                    disabled={metaButtonDisabled}
                >
                    <Facebook size={16} /> Conectar Conta Meta
                </button>
            )}
        </div>
        
        {/* Outras Integrações (Placeholder) */}
        <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 opacity-60">
                <Twitter size={24} className="text-gray-600" />
                <p className="font-semibold text-gray-800">X (Twitter) - Em Breve</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 opacity-60">
                <Linkedin size={24} className="text-gray-600" />
                <p className="font-semibold text-gray-800">LinkedIn - Em Breve</p>
            </div>
        </div>
    </div>
  );
};

export default SocialMediaIntegration;