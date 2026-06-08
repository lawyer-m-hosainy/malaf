import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        // ... existing PWA config ...
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
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
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
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      !isProd && visualizer({ 
        filename: 'bundle-stats.html', 
        gzipSize: true, 
        brotliSize: true 
      }),
      isProd && sentryVitePlugin({
        org: "malaf-pro",
        project: "malaf-frontend",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'assets/index.css';
            }
            return 'assets/[name]-[hash][extname]';
          },
          manualChunks: (id) => {
            // Core React — يُحمَّل أولاً دائماً
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/')) return 'react-core';
            
            // React Router — يُحمَّل مع الـ core
            if (id.includes('node_modules/react-router')) return 'router';
            
            // Zustand + React Query — state management
            if (id.includes('node_modules/zustand') ||
                id.includes('node_modules/@tanstack')) return 'state';
            
            // shadcn/ui + Radix — UI components
            if (id.includes('node_modules/@radix-ui') ||
                id.includes('components/ui/')) return 'ui-components';
            
            // Framer Motion — animations (كبير، يُحمَّل lazy)
            if (id.includes('node_modules/framer-motion') ||
                id.includes('node_modules/motion')) return 'animations';
            
            // Recharts + D3 — charts (يُحمَّل فقط في صفحات المال)
            if (id.includes('node_modules/recharts') ||
                id.includes('node_modules/d3')) return 'charts';
            
            // Supabase client
            if (id.includes('node_modules/@supabase')) return 'supabase';
            
            // AI SDKs — كبيرة، تُحمَّل فقط في صفحة الـ AI
            if (id.includes('node_modules/@google/generative-ai') ||
                id.includes('node_modules/groq-sdk')) return 'ai-sdk';
            
            // باقي node_modules
            if (id.includes('node_modules/')) return 'vendor';
          }
        },
        // R8-FIX: Tree-shaking optimization
        treeshake: {
          moduleSideEffects: false,      // Assume no side effects unless marked
          propertyReadSideEffects: false, // Dead property reads can be removed
        },
      },
      // R8-FIX: Production optimizations
      minify: 'esbuild',
      target: 'es2020',
      chunkSizeWarningLimit: 500,
      assetsInlineLimit: 4096,
      // R8-FIX: CSS code splitting for better caching
      cssCodeSplit: true,
      // R8-FIX: Reduce console noise in production
      ...(isProd && {
        esbuild: {
          drop: ['debugger'],           // Remove debugger statements
          legalComments: 'none',        // Remove legal comments
        },
      }),
      sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    },
    // R8-FIX: Dependency pre-bundling optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        '@supabase/supabase-js',
        'date-fns',
        'lucide-react',
        'zod',
      ],
    },
  };
});
