import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'mobile' ? [basicSsl({ name: 'pocketpay-mobile', domains: ['localhost', '127.0.0.1', '172.26.41.25'] })] : [])],
  server: { host: '0.0.0.0', port: 5173, ...(mode === 'mobile' ? { https: {} } : {}), proxy: { '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true } } }
}));
