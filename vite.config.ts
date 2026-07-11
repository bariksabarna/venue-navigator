import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico'],
      manifest: {
        name: 'Setu — FIFA World Cup 2026 Concierge',
        short_name: 'Setu',
        description: 'AI-powered multilingual stadium concierge for FIFA World Cup 2026',
        theme_color: '#0a1628',
        background_color: '#0a1628',
        display: 'standalone',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
      exclude: [
        'node_modules/',
        'dist/**',
        'src/test-setup.ts',
        'src/main.tsx',
        'src/App.tsx',
        'src/lib/gemini.ts',
        'eslint.config.js',
        'vite.config.ts',
        '**/*.d.ts',
        'src/vite-env.d.ts'
      ]
    }
  }
});
