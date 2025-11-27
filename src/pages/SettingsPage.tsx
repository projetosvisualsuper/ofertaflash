import React from 'react';
import { Settings, Zap } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-8 bg-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <Settings size={32} className="text-indigo-600" />
        Configurações do Hub
      </h2>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4">Integrações de IA</h3>
        <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
                <Zap size={24} className="text-yellow-600" />
                <div>
                    <p className="font-medium text-gray-800">Chave Gemini API</p>
                    <p className="text-sm text-gray-600">Chave de acesso para serviços de geração de conteúdo e imagens.</p>
                </div>
            </div>
            <span className="text-sm font-mono text-green-600">****** (Configurada)</span>
        </div>
        
        <h3 className="text-xl font-semibold mt-8 mb-4">Outras Configurações</h3>
        <p className="text-gray-500">Em breve: Gerenciamento de usuários, faturamento e modelos personalizados.</p>
      </div>
    </div>
  );
};

export default SettingsPage;