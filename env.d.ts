/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_BASE_URL?: string
  readonly API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
