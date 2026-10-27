import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    // La demo publicada corre en un visor sin service workers: ahí la PWA se desactiva.
    VitePWA({
      disable: mode === 'demo',
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'favicon.svg', 'favicon.ico'],
      manifest: {
        name: 'Consultorio · Lic. María Sol Cardacci',
        short_name: 'Consultorio',
        description: 'Historias clínicas, composición corporal, laboratorios, agenda y recordatorios.',
        lang: 'es-AR',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#2D4A3E',
        theme_color: '#34433D',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,ico}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Los datos clínicos nunca se cachean en el service worker: solo la app.
      },
    }),
  ],
}));
