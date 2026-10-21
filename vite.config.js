import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isAccountSite = repository?.endsWith('.github.io');

export default defineConfig({
  plugins: [react()],
  base: repository ? (isAccountSite ? '/' : `/${repository}/`) : '/linuxlab/',
});
