import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    // Gzip precompression
    compression({
      algorithm: 'gzip',
      threshold: 1024,
    }),
    // Brotli precompression
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
    },
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue'],
          gsap: ['gsap'],
          ogl: ['ogl'],
        },
      },
    },
    // Inline small assets
    assetsInlineLimit: 4096,
    // Generate sourcemaps for production debugging
    sourcemap: 'hidden',
  },
})
