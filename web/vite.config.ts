import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const siteFolder = process.env.WEB_BASE_PATH ?? '/';

export default defineConfig({
  base: siteFolder,
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
