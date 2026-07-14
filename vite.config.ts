import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * CRM Progress Board — Demo 版
 * - 纯 SPA，无内部依赖
 * - 数据全部走 localStorage
 * - 部署到 GitHub Pages：/crm-progress-board/
 *   本地开发：base 用 '/'
 */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/crm-progress-board/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
}))
