import React, { useState, useEffect } from 'react';
import { Settings, Zap, CheckCircle, AlertTriangle, Eye, EyeOff, User, LogOut, Loader2 } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '@/src/integrations/supabase/client';
import { showSuccess, showError } from '../utils/toast';

const SettingsPage: React.FC = () => {
  const { profile, user, loading: isProfileLoading } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // A chave real é carregada via vite.config.ts para process.env.GEMINI_API_KEY
  const initialApiKey = process.env.GEMINI_API_KEY || '';
  
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [isKeyConfigured, setIsKeyConfigured] = useState(!!initialApiKey);
  const [showKey, setShowKey] = useState(false);

  // Função para formatar a chave (mostrar apenas os primeiros e últimos caracteres)
  const formatKey = (key: string) => {
    if (!key) return 'NÃO CONFIGURADA';
    if (key.length < 10) return 'Configurada (Curta)';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const statusIcon = isKeyConfigured ? (
    <CheckCircle size={24} className="text-green-600" />
  ) : (
    <AlertTriangle size={24} className="text-red-600" />
  );

  const statusText = isKeyConfigured ? (
    <span className="text-sm font-mono text-green-600">
      {formatKey(apiKey)}
    </span>
  ) : (
    <span className="text-sm font-semibold text-red-600">
      Chave Ausente
    </span>
  );
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      showError("Falha ao sair. Tente novamente.");
    } else {
      showSuccess("Sessão encerrada com sucesso.");
    }
    setIsLoggingOut(false);
  };

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings size={32} className="text-indigo-600" />
        Configurações do Hub
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        
        {/* Gerenciamento de Usuários */}
        <h3 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center gap-2">
            <User size={20} className="text-indigo-600" />
            Gerenciamento de Usuários
        </h3>
        
        {isProfileLoading ? (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <p className="text-sm text-gray-600">Carregando perfil...</p>
            </div>
        ) : (
            <div className="p-4 border rounded-lg bg-indigo-50 space-y-2">
                <p className="font-medium text-gray-800">Usuário Logado:</p>
                <p className="text-sm text-gray-600">Email: <span className="font-mono">{user?.email}</span></p>
                <p className="text-sm text-gray-600">Função: <span className="font-semibold text-indigo-700">{profile?.role || 'Não Definida'}</span></p>
                <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="mt-3 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                    {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    Sair
                </button>
            </div>
        )}

        {/* Integrações de IA */}
        <h3 className="text-xl font-semibold mt-8 mb-4 border-b pb-2 flex items-center gap-2">
            <Zap size={20} className="text-indigo-600" />
            Integrações de IA
        </h3>
        
        {/* Status Atual da Chave */}
        <div className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: isKeyConfigured ? '#d1fae5' : '#fee2e2', backgroundColor: isKeyConfigured ? '#f0fdf4' : '#fef2f2' }}>
            <div className="flex items-center gap-3">
                {statusIcon}
                <div>
                    <p className="font-medium text-gray-800">Chave Gemini API</p>
                    <p className="text-sm text-gray-600">Chave de acesso para serviços de geração de conteúdo e imagens.</p>
                </div>
            </div>
            {statusText}
        </div>
        
        {/* Instruções de Configuração */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
            <p className="font-semibold text-yellow-800">Como configurar a Chave API:</p>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>Obtenha sua chave no Google AI Studio.</li>
                <li>Crie ou edite o arquivo <code className="font-mono bg-yellow-100 p-0.5 rounded">.env.local</code> na raiz do projeto.</li>
                <li>Adicione a linha: <code className="font-mono bg-yellow-100 p-0.5 rounded">GEMINI_API_KEY="SUA_CHAVE_AQUI"</code></li>
                <li><span className="font-bold">Reinicie o aplicativo</span> para que a nova chave seja carregada.</li>
            </ol>
        </div>

        {/* Campo de visualização (apenas para referência, não salva no ambiente) */}
        <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 block">Chave Carregada (Somente Leitura)</label>
            <div className="relative">
                <input 
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    readOnly
                    placeholder="Chave não carregada do ambiente..."
                    className="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-700 pr-10"
                />
                <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    title={showKey ? 'Ocultar Chave' : 'Mostrar Chave'}
                >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </div>
        
        <h3 className="text-xl font-semibold mt-8 mb-4 border-b pb-2">Outras Configurações</h3>
        <p className="text-gray-500">Em breve: Faturamento e modelos personalizados.</p>
      </div>
    </div>
  );
};

export default SettingsPage;