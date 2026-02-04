import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Ensure the build finds the root main.tsx
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});