import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawBaseUrl = env.API_BASE_URL?.trim() || '/api'
  const proxyPrefix =
    rawBaseUrl.startsWith('/') && rawBaseUrl !== '/' ? rawBaseUrl.replace(/\/+$/, '') : '/api'
  const proxyTarget = env.API_PROXY_TARGET?.trim() || 'http://localhost:8000'

  const apiProxy = {
    [proxyPrefix]: {
      target: proxyTarget,
      changeOrigin: true,
      rewrite: (path: string) =>
        path.startsWith(proxyPrefix) ? path.slice(proxyPrefix.length) || '/' : path,
    },
  }

  return {
    envPrefix: ['VITE_', 'API_BASE_URL'],
    plugins: [vue(), vueDevTools()],
    server: {
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
