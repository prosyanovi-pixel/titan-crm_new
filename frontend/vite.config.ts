import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';
    
    // Динамическое определение target для proxy
    // Если задана переменная окружения VITE_API_BACKEND_URL, используем её
    // Иначе используем localhost, но для запросов с других устройств подменяем на IP сервера
    const getProxyTarget = () => {
      if (env.VITE_API_BACKEND_URL) {
        return env.VITE_API_BACKEND_URL;
      }
      // По умолчанию localhost
      return 'http://localhost:5001';
    };

    const proxyTarget = getProxyTarget();
    
    return {
      server: {
        port: 3001,
        strictPort: true,
        host: '0.0.0.0',
        hmr: {
          host: 'localhost',
          port: 3001,
          protocol: 'ws'
        },
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            ws: true,
            rewrite: (path) => path,
          },
          '/ws': {
            target: proxyTarget.replace('http', 'ws'),
            ws: true,
            changeOrigin: true,
          },
          '/uploads': {
            target: proxyTarget.replace('/api', ''),
            changeOrigin: true,
          }
        },
        watch: {
          ignored: ['**/node_modules', '**/.git']
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'TITAN CRM',
            short_name: 'TITAN',
            description: 'Advanced CRM System',
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
        }),
        // Only include lovable-tagger in development
        ...(isDev ? [] : [])
      ].filter(Boolean),
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        sourcemap: true,
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router-dom'],
              query: ['@tanstack/react-query'],
              charts: ['recharts'],
              icons: ['lucide-react'],
              forms: ['react-hook-form', 'zod'],
              radix: [
                '@radix-ui/react-accordion',
                '@radix-ui/react-alert-dialog',
                '@radix-ui/react-aspect-ratio',
                '@radix-ui/react-avatar',
                '@radix-ui/react-checkbox',
                '@radix-ui/react-collapsible',
                '@radix-ui/react-context-menu',
                '@radix-ui/react-dialog',
                '@radix-ui/react-dropdown-menu',
                '@radix-ui/react-hover-card',
                '@radix-ui/react-label',
                '@radix-ui/react-menubar',
                '@radix-ui/react-navigation-menu',
                '@radix-ui/react-popover',
                '@radix-ui/react-progress',
                '@radix-ui/react-radio-group',
                '@radix-ui/react-scroll-area',
                '@radix-ui/react-select',
                '@radix-ui/react-separator',
                '@radix-ui/react-slider',
                '@radix-ui/react-slot',
                '@radix-ui/react-switch',
                '@radix-ui/react-tabs',
                '@radix-ui/react-toast',
                '@radix-ui/react-toggle',
                '@radix-ui/react-toggle-group',
                '@radix-ui/react-tooltip',
              ],
            }
          }
        }
      }
    };
});
