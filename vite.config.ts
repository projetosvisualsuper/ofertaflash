import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Adicionando aliases para pacotes externos que são carregados via importmap
          '@supabase/auth-ui-react': '@supabase/auth-ui-react',
          '@supabase/auth-ui-shared': '@supabase/auth-ui-shared',
        }
      },
      build: {
        rollupOptions: {
          // Explicitamente marca React e React-DOM como externos para evitar o empacotamento
          // e garantir que a versão do CDN (React 19 via importmap) seja usada exclusivamente.
          external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
      },
    };
});