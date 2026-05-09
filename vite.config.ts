import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  return {
    plugins: [react(), tailwindcss()],
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
