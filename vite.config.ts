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
          '@supabase/auth-ui-react': '@supabase/auth-ui-react',
          '@supabase/auth-ui-shared': '@supabase/auth-ui-shared',
        }
      },
      optimizeDeps: {
        // Exclui pacotes externos para que o Vite não tente resolvê-los ou pré-empacotá-los no modo dev.
        exclude: [
          '@supabase/auth-ui-react', 
          '@supabase/auth-ui-shared',
          'react',
          'react-dom',
        ],
      },
      build: {
        rollupOptions: {
          // Explicitamente marca React, React-DOM e os pacotes Supabase UI como externos
          external: [
            'react', 
            'react-dom', 
            'react/jsx-runtime', 
            '@supabase/auth-ui-react', 
            '@supabase/auth-ui-shared'
          ],
        },
      },
    };
});