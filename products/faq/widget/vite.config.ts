import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The widget builds to a single self-contained IIFE (`widget.js`) that the faq-worker
// serves as a static asset. One classic `<script async>` tag drops it onto any site.
export default defineConfig({
  plugins: [react()],
  // Force React's production build in the bundle (smaller, no dev warnings).
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: resolve(__dirname, '../faq-worker/assets'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/loader.tsx'),
      formats: ['iife'],
      name: 'AgentsoxFaqWidget',
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      output: { inlineDynamicImports: true, assetFileNames: 'widget.[ext]' },
    },
  },
});
