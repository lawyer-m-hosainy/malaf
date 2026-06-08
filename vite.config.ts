import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';

const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  injectRegister: 'script',
  workbox: {
    navigateFallbackDenylist: [/^\/sw-push\.js$/],
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] }
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'gstatic-fonts-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] }
        }
      }
    ]
  },
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'Malaf Legal Platform',
    short_name: 'Malaf',
    description: 'منصة ملف لإدارة المكاتب القانونية',
    theme_color: '#ffffff',
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  }
};

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA(pwaOptions),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo: any) => {
            if (assetInfo.name?.endsWith('.css')) return 'assets/index.css';
            return 'assets/[name]-[hash][extname]';
          },
          manualChunks(id) {
            // React لازم يكون أول حاجة
            if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/')) {
              return 'react-core';
            }
            if (id.includes('node_modules/react-router')) return 'router';
            if (id.includes('node_modules/@supabase')) return 'supabase';
            if (id.includes('node_modules/zustand') ||
              id.includes('node_modules/@tanstack')) return 'state';
            // charts بعد react مش قبله
            if (id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3')) return 'charts';
            if (id.includes('node_modules/framer-motion') ||
              id.includes('node_modules/motion')) return 'animations';
            if (id.includes('node_modules/@radix-ui')) return 'ui-components';
          }
        },
      },
      minify: 'esbuild' as const,
      target: 'es2020',
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        '@supabase/supabase-js',
      ],
    },
  };
}); 