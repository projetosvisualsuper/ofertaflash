import React from 'react';
import { Settings, Key } from 'lucide-react';
import WooCommerceSettingsInstructions from '../components/WooCommerceSettingsInstructions'; // NOVO IMPORT

const SettingsPage: React.FC = () => {
  // A chave agora é um segredo do lado do servidor e não pode ser acessada aqui.
  // Apenas fornecemos instruções.

  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100 overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings size={32} className="text-indigo-600" />
        Configurações do Hub
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Integrações de IA</h3>
        
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
            </ol>
        </div>
        
        <h3 className="text-xl font-semibold mt-8 mb-4 border-b pb-2">Integrações de E-commerce</h3>
        
        {/* WooCommerce Settings */}
        <WooCommerceSettingsInstructions />

        <h3 className="text-xl font-semibold mt-8 mb-4 border-b pb-2">Outras Configurações</h3>
        <p className="text-gray-500">Em breve: Gerenciamento de usuários, faturamento e modelos personalizados.</p>
      </div>
    </div>
  );
};

export default SettingsPage;