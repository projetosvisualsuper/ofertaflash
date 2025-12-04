import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/src/integrations/supabase/client';
import { Zap, Check, Loader2 } from 'lucide-react';
import { useLoginBannerSettings } from '../hooks/useLoginBannerSettings';

// Cor do banner: #007bff
const BANNER_COLOR = '#007bff';

const customTheme = {
  default: {
    colors: {
      // Cores primárias da aplicação (usando a cor do banner)
      brand: BANNER_COLOR, 
      brandAccent: '#0056b3', // Um tom mais escuro para hover/foco
      
      // Botões
      defaultButtonBackground: BANNER_COLOR, 
      defaultButtonBackgroundHover: '#0056b3',
      defaultButtonText: 'white',
      
      // Links e Foco
      anchorTextColor: BANNER_COLOR,
      inputFocusBorder: BANNER_COLOR,
    },
  },
};

const LoginPage: React.FC = () => {
  const { settings, loading } = useLoginBannerSettings();

  const BannerContent = () => (
    <div className="p-10 text-white h-full flex flex-col justify-center" style={{ backgroundColor: BANNER_COLOR }}>
      <h2 className="text-4xl font-black mb-4 leading-tight">
        {settings.title.split(' ').map((word, index) => (
          <span key={index} className={index === 0 ? 'text-white' : 'text-green-300'}>
            {word}{' '}
          </span>
        ))}
      </h2>
      <p className="text-lg text-gray-200 mb-8">{settings.subtitle}</p>
      
      <ul className="space-y-3">
        {settings.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-lg">
            <Check size={20} className="text-green-300 mt-1 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        
        {/* Coluna Esquerda: Formulário de Login */}
        <div className="w-full lg:w-1/2 p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mt-2">Criar Ofertas</h1>
            <p className="text-gray-600">Entre com suas credenciais para acessar o sistema</p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: customTheme,
            }}
            providers={[]}
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                  link_text: 'Já tem uma conta? Entre aqui',
                  email_input_placeholder: 'seu@email.com',
                  password_input_placeholder: 'Digite sua senha',
                },
                sign_up: {
                  email_label: 'E-mail',
                  password_label: 'Crie uma senha',
                  button_label: 'Cadastrar',
                  link_text: 'Não tem uma conta? Cadastre-se',
                  email_input_placeholder: 'seu@email.com',
                  password_input_placeholder: 'Crie uma senha segura',
                },
                forgotten_password: {
                  email_label: 'E-mail',
                  button_label: 'Enviar instruções',
                  link_text: 'Esqueceu sua senha?',
                  email_input_placeholder: 'seu@email.com',
                }
              },
            }}
          />
        </div>
        
        {/* Coluna Direita: Banner de Destaque */}
        <div className="hidden lg:block lg:w-1/2 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center" style={{ backgroundColor: BANNER_COLOR }}>
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : (
            <BannerContent />
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;