"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/src/integrations/supabase/client';
import { Zap } from 'lucide-react';

const LoginPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <Zap size={48} className="text-indigo-600 mb-2" />
          <h1 className="text-2xl font-bold text-gray-800">AI Marketing Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Faça login para acessar o OfertaFlash Builder.</p>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#4f46e5', // Indigo-600
                  brandAccent: '#4338ca', // Indigo-700
                },
              },
            },
          }}
          theme="light"
          view="sign_in"
        />
      </div>
    </div>
  );
};

export default LoginPage;