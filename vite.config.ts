import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Served from a GitHub Pages project site, so every asset URL has to be
 * prefixed with the repository name. `base` is read from an env var so a
 * local `npm run site` still serves from the root.
 */
export default defineConfig({
  base: process.env.SITE_BASE ?? '/',
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    outDir: 'dist-site',
    target: 'es2022',
    rollupOptions: {
      output: {
        // The Player is only needed for the intro — keep it out of the
        // chunk that has to arrive before the hero can paint.
        manualChunks: { player: ['@remotion/player', 'remotion'] },
      },
    },
  },
});
