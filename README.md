# prismon-frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Variáveis de Ambiente

Copie `.env.example` para `.env`:

```sh
cp .env.example .env
```

- `VITE_API_BASE_URL`: URL base usada pelo cliente HTTP (`src/api/client.ts`). Em desenvolvimento usa `/api` via proxy do Vite; em produção aponte para a URL da API (ex.: `https://api.seudominio.com`).
- `VITE_API_PROXY_TARGET`: destino do proxy `/api` no Vite em `dev` e `preview` (padrão `http://localhost:8000`).

## Deploy na Vercel

O projeto já inclui [`vercel.json`](./vercel.json) com rewrite de fallback para todas as rotas SPA (`vue-router` em history mode):

1. Importe o repositório na Vercel (branch `main`).
2. Configure **Framework Preset**: `Vite`, **Build Command**: `npm run build`, **Output Directory**: `dist`.
3. Em **Settings → Environment Variables**, adicione `VITE_API_BASE_URL` com a URL pública da sua API (sem barra no final, ex.: `https://api.seudominio.com`).
4. Garanta que o backend tenha CORS liberado (`Access-Control-Allow-Credentials: true` para o domínio da Vercel) e cookies de sessão compatíveis (`SameSite=None; Secure` se frontend e API estiverem em domínios distintos, ou utilize rewrite `/api/:path*` no `vercel.json` com `VITE_API_BASE_URL=/api`).
