import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from "@sentry/vite-plugin";

const chunkRules = [
  { match: ['node_modules/react/', 'node_modules/react-dom/'], name: 'react-core' },
  { match: ['node_modules/react-router'], name: 'router' },
  { match: ['node_modules/zustand', 'node_modules/@tanstack'], name: 'state' },
  { match: ['node_modules/@radix-ui', 'components/ui/'], name: 'ui-components' },
  { match: ['node_modules/framer-motion', 'node_modules/motion'], name: 'animations' },
  { match: ['node_modules/recharts', 'node_modules/d3'], name: 'charts' },
  { match: ['node_modules/@supabase'], name: 'supabase' },
  { match: ['node_modules/@google/generative-ai', 'node_modules/groq-sdk'], name: 'ai-sdk' },
  { match: ['node_modules/'], name: 'vendor' }
];

const getManualChunks = (id: string) => {
  for (const rule of chunkRules) {
    if (rule.match.some(m => id.includes(m))) return rule.name;
  }
};

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

const getBuildOptions = (isProd: boolean) => ({
  rollupOptions: {
    output: {
      assetFileNames: (assetInfo: any) => {
        if (assetInfo.name?.endsWith('.css')) return 'assets/index.css';
        return 'assets/[name]-[hash][extname]';
      },
      manualChunks: getManualChunks
    },
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
  },
  minify: 'esbuild' as const,
  target: 'es2020',
  chunkSizeWarningLimit: 500,
  assetsInlineLimit: 4096,
  cssCodeSplit: true,
  ...(isProd && {
    esbuild: {
      drop: ['debugger'] as any,
      legalComments: 'none' as const,
    },
  }),
  sourcemap: isProd ? 'hidden' as const : true,
});
const optimizeDepsOptions = {
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
};

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA(pwaOptions),
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
    build: getBuildOptions(isProd),
    // R8-FIX: Dependency pre-bundling optimization
    optimizeDeps: optimizeDepsOptions,
  };
});
