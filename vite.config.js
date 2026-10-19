import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/linuxlab/', // Reemplaza 'linuxlab' por el nombre exacta de tu repositorio en GitHub
});
