// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración básica para React + Vercel
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});