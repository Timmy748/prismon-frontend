import { createRouter, createWebHistory } from 'vue-router'
import { setUnauthorizedHandler } from '@/api/client'
import { useAuthState } from '@/stores/authState'
import { useWorkspaceState } from '@/stores/workspaceState'
import ApiKeysView from '@/views/ApiKeysView.vue'
import AuthView from '@/views/AuthView.vue'
import ChatView from '@/views/ChatView.vue'
import MembersView from '@/views/MembersView.vue'
import RepertoryView from '@/views/RepertoryView.vue'

const LEGACY_TO_TARGET_ROUTE: Record<string, string> = {
  'legacy-chat': 'chat',
  'legacy-repertory': 'repertory',
  'legacy-members': 'members',
  'legacy-api-keys': 'api-keys',
}

const PROJECT_ROUTE_TO_LEGACY: Record<string, string> = {
  chat: 'legacy-chat',
  'chat-thread': 'legacy-chat',
  repertory: 'legacy-repertory',
  'repertory-documents': 'legacy-repertory',
  'repertory-document-detail': 'legacy-repertory',
  'repertory-assets': 'legacy-repertory',
  'repertory-asset-detail': 'legacy-repertory',
  'repertory-tags': 'legacy-repertory',
  members: 'legacy-members',
  'api-keys': 'legacy-api-keys',
}

function parsePositiveIntParam(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: AuthView,
      props: { initialMode: 'login' },
      meta: { guestOnly: true },
    },
    {
      path: '/cadastro',
      name: 'register',
      component: AuthView,
      props: { initialMode: 'register' },
      meta: { guestOnly: true },
    },
    {
      path: '/projetos/:projectId/chats',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/chats/:chatId',
      name: 'chat-thread',
      component: ChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/repertorio',
      name: 'repertory',
      component: RepertoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/repertorio/documentos',
      name: 'repertory-documents',
      component: RepertoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/repertorio/documentos/:itemId',
      name: 'repertory-document-detail',
      component: RepertoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/repertorio/assets',
      name: 'repertory-assets',
      component: RepertoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/repertorio/assets/:itemId',
      name: 'repertory-asset-detail',
      component: RepertoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/repertorio/tags',
      name: 'repertory-tags',
      component: RepertoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/membros',
      name: 'members',
      component: MembersView,
      meta: { requiresAuth: true },
    },
    {
      path: '/projetos/:projectId/api-keys',
      name: 'api-keys',
      component: ApiKeysView,
      meta: { requiresAuth: true },
    },
    {
      path: '/chat',
      name: 'legacy-chat',
      component: ChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/repertorio',
      name: 'legacy-repertory',
      component: RepertoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/membros',
      name: 'legacy-members',
      component: MembersView,
      meta: { requiresAuth: true },
    },
    {
      path: '/api-keys',
      name: 'legacy-api-keys',
      component: ApiKeysView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

router.beforeEach(async (to) => {
  const { isAuthenticated, sessionChecked, loadSession, clearSession } = useAuthState()

  if (!sessionChecked.value && (to.meta.requiresAuth || to.meta.guestOnly || to.path === '/')) {
    try {
      await loadSession()
    } catch {
      clearSession()
    }
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login' }
  }

  if (!isAuthenticated.value) {
    return true
  }

  const { projects, activeProjectId, ensureWorkspaceInitialized, syncFromRoute } =
    useWorkspaceState()
  const routeName = typeof to.name === 'string' ? to.name : ''
  const legacyTarget = LEGACY_TO_TARGET_ROUTE[routeName]

  if (to.meta.guestOnly || to.path === '/' || legacyTarget) {
    try {
      await ensureWorkspaceInitialized()
    } catch {
      // Allow target view to surface API errors when projects fail to load
    }

    const targetSectionName = legacyTarget ?? 'chat'
    if (activeProjectId.value !== null) {
      return {
        name: targetSectionName,
        params: { projectId: String(activeProjectId.value) },
      }
    }

    if (to.meta.guestOnly || to.path === '/') {
      return { name: 'legacy-chat' }
    }

    return true
  }

  if (to.params.projectId !== undefined) {
    const routeProjectId = parsePositiveIntParam(to.params.projectId)
    const rawChatId = to.params.chatId
    const routeChatId = rawChatId !== undefined ? parsePositiveIntParam(rawChatId) : undefined

    try {
      await ensureWorkspaceInitialized(routeProjectId)
    } catch {
      return true
    }

    if (projects.value.length === 0) {
      const fallbackLegacy = PROJECT_ROUTE_TO_LEGACY[routeName] ?? 'legacy-chat'
      return { name: fallbackLegacy }
    }

    const projectExists =
      routeProjectId !== null && projects.value.some((project) => project.id === routeProjectId)

    if (!projectExists) {
      const fallbackProjectId = activeProjectId.value ?? projects.value[0]?.id
      if (fallbackProjectId !== undefined) {
        const targetName =
          routeName === 'chat-thread'
            ? 'chat'
            : routeName === 'repertory-document-detail'
              ? 'repertory-documents'
              : routeName === 'repertory-asset-detail'
                ? 'repertory-assets'
                : routeName || 'chat'

        return {
          name: targetName,
          params: { projectId: String(fallbackProjectId) },
          query: to.query,
          hash: to.hash,
        }
      }
    }

    if (routeName === 'chat-thread' && routeChatId === null) {
      return {
        name: 'chat',
        params: { projectId: String(routeProjectId) },
      }
    }

    await syncFromRoute({
      projectId: routeProjectId,
      chatId: routeName === 'chat' ? null : routeChatId,
    })
  }

  return true
})

setUnauthorizedHandler(() => {
  const { clearSession } = useAuthState()
  const { resetWorkspace } = useWorkspaceState()
  clearSession()
  resetWorkspace()
  if (router.currentRoute.value.meta.requiresAuth) {
    void router.push({ name: 'login' })
  }
})

export default router
