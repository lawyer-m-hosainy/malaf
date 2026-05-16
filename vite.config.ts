import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // السماح بتسجيل sw-push.js يدوياً بجانب الـ PWA SW
        injectRegister: 'auto',
        workbox: {
          // استثناء sw-push.js من الـ precache
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
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
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
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
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
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['lucide-react', 'motion/react', 'clsx', 'tailwind-merge'],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['zod', 'date-fns', '@supabase/supabase-js'],
          }
        },
        // R8-FIX: Tree-shaking optimization
        treeshake: {
          moduleSideEffects: false,      // Assume no side effects unless marked
          propertyReadSideEffects: false, // Dead property reads can be removed
        },
      },
      // R8-FIX: Production optimizations
      minify: isProd ? 'esbuild' : false,
      target: 'es2020',
      chunkSizeWarningLimit: 800,
      sourcemap: !isProd,
      // R8-FIX: CSS code splitting for better caching
      cssCodeSplit: true,
      // R8-FIX: Reduce console noise in production
      ...(isProd && {
        esbuild: {
          drop: ['debugger'],           // Remove debugger statements
          legalComments: 'none',        // Remove legal comments
        },
      }),
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
