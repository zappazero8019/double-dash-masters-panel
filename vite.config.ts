import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração Vite do painel Double Dash Masters.
// Sem proxies, sem variáveis de ambiente privadas: a API pública é chamada
// diretamente pelo navegador (CORS liberado pelo backend).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
