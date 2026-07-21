import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import compression from 'vite-plugin-compression'
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

function copyPublicAssetsWithoutOriginals() {
  const publicDir = 'public'
  const distDir = 'dist'
  const excludedEntries = new Set(['projects'])

  return {
    name: 'copy-public-assets-without-originals',
    apply: 'build',
    closeBundle() {
      mkdirSync(distDir, { recursive: true })

      for (const entry of readdirSync(publicDir)) {
        if (excludedEntries.has(entry)) continue

        const from = join(publicDir, entry)
        const to = join(distDir, entry)
        rmSync(to, { recursive: true, force: true })
        cpSync(from, to, { recursive: true })
      }
    },
  }
}

export default defineConfig(({ command }) => ({
  base: '/',
  publicDir: command === 'build' ? false : 'public',
  plugins: [
    vue(),
    copyPublicAssetsWithoutOriginals(),
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
}))
