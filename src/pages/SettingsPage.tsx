import React, { useState, useEffect } from 'react';
import { Settings, Key, Facebook, Instagram, Twitter, Linkedin, ExternalLink, Zap, LogOut, Check } from 'lucide-react';
import WooCommerceSettingsInstructions from '../components/WooCommerceSettingsInstructions';
import { useAuth } from '../context/AuthContext';
import { useSocialMediaAccounts } from '../hooks/useSocialMediaAccounts';
import { supabase } from '@/src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast'; // Importando showSuccess

const SettingsPage: React.FC = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { accounts, loading, deleteAccount, fetchAccounts } = useSocialMediaAccounts(userId);
  
  const isMetaConnected = accounts.some(a => a.platform === 'meta');
  const metaAccount = accounts.find(a => a.platform === 'meta');
  
  // Estado para exibir erros de callback (se houver)
  const [callbackError, setCallbackError] = useState<string | null>(null);

  // Efeito para verificar erros de callback na URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const errorParam = url.searchParams.get('error');
    if (errorParam) {
      setCallbackError(decodeURIComponent(errorParam));
      showError(`Erro de Conexão: ${decodeURIComponent(errorParam)}`);
      // Limpa o parâmetro de erro da URL
      url.searchParams.delete('error');
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
    
    // Se a URL tiver 'code' e 'state', significa que o callback foi bem-sucedido,
    // mas a Edge Function falhou em redirecionar ou salvar. Forçamos a busca.
    if (url.searchParams.has('code') && url.searchParams.has('state')) {
        // Se o usuário for redirecionado para cá com code/state, a Edge Function falhou.
        showError("A Edge Function de callback falhou. Verifique os logs do Supabase.");
        // Limpa os parâmetros para evitar loops
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
    
  }, [fetchAccounts]);

  // Função para iniciar o fluxo de autenticação do Meta (Facebook/Instagram)
  const handleConnectMeta = async () => {
    if (!userId) {
        showError("Usuário não autenticado.");
        return;
    }
    
    // NOTA: O App ID e o Redirect URI devem ser configurados no painel do Meta Developers.
    // O App ID deve ser configurado no Supabase Secrets e na Edge Function.
    
    const META_APP_ID = 'YOUR_META_APP_ID'; // Placeholder para instrução
    const REDIRECT_URI = `https://cdktwczejznbqfzmizpu.supabase.co/functions/v1/meta-oauth-callback`;
    
    // Se o usuário não configurou o App ID, mostramos um erro amigável
    const { data: secretsData, error: secretsError } = await supabase.functions.invoke('get-secrets-status', { method: 'GET' });
    
    if (secretsError || !secretsData || !secretsData.META_APP_ID) {
        showError("Erro: O segredo META_APP_ID não está configurado no Supabase Secrets.");
        return;
    }
    
    const scopes = [
        'pages_show_list', 
        'instagram_basic', 
        'instagram_manage_comments', 
        'instagram_manage_insights', 
        'pages_read_engagement', 
        'pages_manage_posts'
    ].join(',');

    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${secretsData.META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&state=${userId}`;
    
    // Redireciona o usuário para o Meta para iniciar o login
    window.location.href = authUrl;
  };
  
  const handleDisconnectMeta = () => {
    if (metaAccount) {
        deleteAccount(metaAccount.id, 'Meta/Facebook');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings size={32} className="text-indigo-600" />
        Configurações do Hub
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        
        {/* Integrações de Redes Sociais */}
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Integrações de Redes Sociais</h3>
        
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
            
            {isMetaConnected && metaAccount ? (
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
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                    disabled={loading}
                >
                    <Facebook size={16} /> Conectar Conta Meta
                </button>
            )}
            
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 pl-2 pt-2 border-t">
                <li>Crie um aplicativo no <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800">Meta Developers</a>.</li>
                <li>No Supabase, adicione os seguintes segredos em <strong>Project Settings</strong> &gt; <strong>Edge Functions</strong>:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><code className="font-mono bg-indigo-100 p-0.5 rounded">META_APP_ID</code>: Seu App ID.</li>
                        <li><code className="font-mono bg-indigo-100 p-0.5 rounded">META_APP_SECRET</code>: Seu App Secret.</li>
                    </ul>
                </li>
                <li>No painel do Meta, configure a <strong>URL de Redirecionamento OAuth Válida</strong> para:
                    <code className="font-mono bg-indigo-100 p-0.5 rounded block mt-2 text-xs break-all">
                        https://cdktwczejznbqfzmizpu.supabase.co/functions/v1/meta-oauth-callback
                    </code>
                </li>
            </ol>
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
        
        <h3 className="text-xl font-semibold mt-8 mb-4 border-b pb-2">Integrações de Pagamento</h3>
        
        {/* Mercado Pago Webhook Settings */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
                <Key size={24} className="text-blue-600" />
                <div>
                    <p className="font-semibold text-blue-800">Integração Mercado Pago (Webhooks e Assinaturas)</p>
                    <p className="text-sm text-gray-700">
                        Configure o Mercado Pago para notificar o sistema sobre pagamentos e gerenciar o status do plano.
                    </p>
                </div>
            </div>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 pl-2">
                <li>Obtenha seu <strong>Access Token</strong> e defina um <strong>Token Secreto de Webhook</strong> no painel do Mercado Pago.</li>
                <li>No Supabase, adicione os seguintes segredos em <strong>Project Settings</strong> &gt; <strong>Edge Functions</strong>:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><code className="font-mono bg-blue-100 p-0.5 rounded">MERCADOPAGO_ACCESS_TOKEN</code>: Seu token de acesso para chamadas de API. <span className="font-bold text-red-600">(Verifique se é um token de Produção/Teste válido e com permissão de Assinaturas)</span>.</li>
                        <li><code className="font-mono bg-blue-100 p-0.5 rounded">MERCADOPAGO_WEBHOOK_SECRET</code>: O token secreto para autenticar webhooks.</li>
                    </ul>
                </li>
                <li>Configure o Webhook no Mercado Pago para enviar notificações de pagamento para o endpoint da sua Edge Function:
                    <code className="font-mono bg-blue-100 p-0.5 rounded block mt-2 text-xs break-all">
                        https://cdktwczejznbqfzmizpu.supabase.co/functions/v1/mercadopago-webhook-handler
                    </code>
                </li>
                <li>Certifique-se de que o ID do usuário do Supabase (`auth.uid()`) seja enviado como `external_reference` ao criar a preferência de pagamento.</li>
            </ol>
        </div>
        
        <h3 className="xl font-semibold mt-8 mb-4 border-b pb-2">Integrações de IA</h3>
        
        {/* Gemini API Key */}
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
                <Key size={24} className="text-indigo-600" />
                <div>
                    <p className="font-semibold text-indigo-800">Chave da API Gemini (Texto e Imagem)</p>
                    <p className="text-sm text-gray-700">
                        Sua chave é usada de forma segura no backend para todas as funcionalidades de IA (texto, roteiro, imagem).
                    </p>
                </div>
            </div>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 pl-2">
                <li>Obtenha sua chave no <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800">Google AI Studio</a>.</li>
                <li>Acesse o painel do seu projeto no <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800">Supabase</a>.</li>
                <li>Navegue até: <strong>Project Settings</strong> &gt; <strong>Edge Functions</strong>.</li>
                <li>Clique em <strong>Add new secret</strong>.</li>
                <li>Nome do segredo: <code className="font-mono bg-indigo-100 p-0.5 rounded">GEMINI_API_KEY</code></li>
                <li>Cole sua chave no campo de valor e salve.</li>
            </ol>
        </div>

        {/* ElevenLabs TTS API Key */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
                <Key size={24} className="text-purple-600" />
                <div>
                    <p className="font-semibold text-purple-800">Chave da API ElevenLabs (Locução)</p>
                    <p className="text-sm text-gray-700">
                        Necessária para a funcionalidade de geração de áudio de alta qualidade.
                    </p>
                </div>
            </div>
             <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 pl-2">
                <li>Obtenha sua chave de API no painel de desenvolvedor da <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline hover:text-purple-800">ElevenLabs</a>.</li>
                <li>No Supabase, adicione um novo segredo com o nome <code className="font-mono bg-purple-100 p-0.5 rounded">ELEVENLABS_API_KEY</code> e cole sua chave.</li>
                <li><span className="font-bold text-red-600">IMPORTANTE:</span> Como suas vozes padrão são em Inglês, você precisa de uma voz que suporte Português (pt-BR) e o modelo `eleven_multilingual_v2`. Adicione um segundo segredo:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><code className="font-mono bg-purple-100 p-0.5 rounded">ELEVENLABS_VOICE_ID</code>: Cole a ID da voz que você deseja usar para a locução em Português.</li>
                    </ul>
                </li>
            </ol>
        </div>
        
        <h3 className="xl font-semibold mt-8 mb-4 border-b pb-2">Integrações de E-commerce</h3>
        
        {/* WooCommerce Settings */}
        <WooCommerceSettingsInstructions />

        <h3 className="xl font-semibold mt-8 mb-4 border-b pb-2">Outras Configurações</h3>
        <p className="text-gray-500">Em breve: Gerenciamento de usuários, faturamento e modelos personalizados.</p>
      </div>
    </div>
  );
};

export default SettingsPage;