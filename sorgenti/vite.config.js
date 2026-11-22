import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 4000,
    reportCompressedSize: true
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true }
});
