import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@modules': path.resolve(__dirname, './src/modules'),
      'types': path.resolve(__dirname, './src/types'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    port: 5173,
    proxy: {
      // Use trailing slashes to avoid accidentally proxying frontend routes like /stores
      '/store/': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
      },
      '/auth/': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy backendnext API routes
      '/api/public/': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy OPTIONS requests for CORS preflight
      '/api/': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/modules/**/*.{ts,tsx}'],
      exclude: ['src/tests/**'],
    },
  },
})