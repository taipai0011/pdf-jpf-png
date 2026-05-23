import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The base path is configurable via env (set by the GitHub Actions workflow)
// so the same build can serve from either GitHub Pages (e.g. /pdf-jpf-png/)
// or the root (e.g. Vercel, Netlify, or local preview).
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdf-lib'],
          'pdfjs': ['pdfjs-dist'],
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
});
