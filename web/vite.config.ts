import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Monorepo safeguard: web/ and shared/ must load the same copy of React, or hooks break.
    dedupe: ['react', 'react-dom'],
  },
});
