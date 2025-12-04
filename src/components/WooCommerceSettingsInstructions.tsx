import React from 'react';
import { Key, ShoppingCart, ExternalLink } from 'lucide-react';

const WooCommerceSettingsInstructions: React.FC = () => {
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
        <div className="flex items-center gap-3">
            <ShoppingCart size={24} className="text-purple-600" />
            <div>
                <p className="font-semibold text-purple-800">Integração WooCommerce</p>
                <p className="text-sm text-gray-700">
                    Conecte sua loja WooCommerce para importar produtos automaticamente.
                </p>
            </div>
        </div>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2 pl-2">
            <li>
                <span className="font-bold">Obtenha as Chaves de API:</span> No painel do WordPress, vá para 
                <span className="font-mono bg-purple-100 p-0.5 rounded mx-1">WooCommerce</span> &gt; 
                <span className="font-mono bg-purple-100 p-0.5 rounded mx-1">Configurações</span> &gt; 
                <span className="font-mono bg-purple-100 p-0.5 rounded mx-1">Avançado</span> &gt; 
                <span className="font-mono bg-purple-100 p-0.5 rounded mx-1">API REST</span>. Crie uma chave com permissão de <span className="font-bold">Leitura</span>.
            </li>
            <li>
                <span className="font-bold">Configure no Supabase:</span> Acesse o painel do seu projeto no Supabase.
            </li>
            <li>
                <span className="font-bold">Adicione os Segredos:</span> Navegue até <span className="font-mono bg-purple-100 p-0.5 rounded mx-1">Project Settings</span> &gt; <span className="font-mono bg-purple-100 p-0.5 rounded mx-1">Edge Functions</span> e adicione os seguintes segredos:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><code className="font-mono bg-purple-100 p-0.5 rounded">WOOCOMMERCE_URL</code>: URL base da sua loja (ex: https://sua-loja.com.br)</li>
                    <li><code className="font-mono bg-purple-100 p-0.5 rounded">WOOCOMMERCE_CONSUMER_KEY</code>: Sua Consumer Key</li>
                    <li><code className="font-mono bg-purple-100 p-0.5 rounded">WOOCOMMERCE_CONSUMER_SECRET</code>: Sua Consumer Secret</li>
                </ul>
            </li>
        </ol>
        <a href="https://docs.woocommerce.com/document/woocommerce-rest-api-keys/" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1">
            <ExternalLink size={12} /> Ver documentação oficial do WooCommerce
        </a>
    </div>
  );
};

export default WooCommerceSettingsInstructions;