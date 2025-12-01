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
        }
      },
      optimizeDeps: {
        include: [
          '@supabase/auth-ui-react',
          '@supabase/auth-ui-shared'
        ],
        // Mantendo apenas React/React-DOM na exclusão, que são carregados via importmap
        exclude: [
          'react',
          'react-dom',
        ],
      },
      build: {
        rollupOptions: {
          // Mantendo apenas React/React-DOM na exclusão, que são carregados via importmap
          external: [
            'react', 
            'react-dom', 
            'react/jsx-runtime', 
          ],
        },
      },
    };
});