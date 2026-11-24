import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { defineComponent } from 'vue'
import { AxiosError, AxiosHeaders } from 'axios'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    put: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  setUnauthorizedHandler: vi.fn<(handler: (() => void) | null) => void>(),
  setAuthRefreshEnabled: vi.fn<(enabled: boolean) => void>(),
  runWithoutAuthRefresh: <T>(operation: () => Promise<T>) => operation(),
  resolveApiUrl: vi.fn<(path: string) => string>((path: string) => `/api${path}`),
  uploadFileToPresignedUrl: vi.fn<(...args: unknown[]) => Promise<void>>(),
}))

import AuthView from '../AuthView.vue'
import { apiClient } from '@/api/client'
import { toast } from '@/components/ui'
import { _resetAuthForTesting, useAuthState } from '@/stores/authState'
import { _resetWorkspaceForTesting } from '@/stores/workspaceState'

const DummyRouteView = defineComponent({
  template: '<div data-testid="dummy-route" />',
})

function makeAxiosError(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders()
  return new AxiosError(
    `Request failed with status ${status}`,
    AxiosError.ERR_BAD_REQUEST,
    { headers },
    undefined,
    {
      status,
      statusText: 'Error',
      headers,
      config: { headers },
      data,
    },
  )
}

async function createTestRouter(initialPath = '/cadastro'): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/cadastro', name: 'register', component: AuthView },
      { path: '/login', name: 'login', component: AuthView },
      { path: '/chat', name: 'chat', component: DummyRouteView },
    ],
  })

  await router.push(initialPath)
  await router.isReady()
  return router
}

let wrapper: VueWrapper | undefined

beforeEach(() => {
  vi.clearAllMocks()
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetWorkspaceForTesting()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetWorkspaceForTesting()
  vi.restoreAllMocks()
})

describe('AuthView', () => {
  it('toggles between register and login modes via switch link and syncs with route', async () => {
    const router = await createTestRouter('/cadastro')

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.auth-view__title').text()).toBe('Bem vindo ao prismon')
    expect(wrapper.find('.auth-view__subtitle').text()).toBe('Crie uma conta para explorar.')
    expect(wrapper.find('input[name="username"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('criar conta')

    await wrapper.find('.auth-view__switch-link').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.find('.auth-view__title').text()).toBe('Bem vindo de volta')
    expect(wrapper.find('.auth-view__subtitle').text()).toBe('Entre na sua conta para continuar.')
    expect(wrapper.find('input[name="username"]').exists()).toBe(false)
    expect(wrapper.find('button[type="submit"]').text()).toBe('entrar')
    expect(wrapper.find('.auth-view__forgot-link').exists()).toBe(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    await wrapper.find('.auth-view__switch-link').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/cadastro')
    expect(wrapper.find('.auth-view__title').text()).toBe('Bem vindo ao prismon')
    expect(wrapper.find('input[name="username"]').exists()).toBe(true)
  })

  it('respects initialMode prop when route does not force a mode', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: DummyRouteView },
        { path: '/chat', component: DummyRouteView },
      ],
    })
    await router.push('/')
    await router.isReady()

    wrapper = mount(AuthView, {
      props: {
        initialMode: 'login',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.auth-view__title').text()).toBe('Bem vindo de volta')
    expect(wrapper.find('input[name="username"]').exists()).toBe(false)
    expect(wrapper.find('.auth-view__forgot-link').exists()).toBe(false)
  })

  it('shows field errors and error toast when submitting empty or invalid values', async () => {
    const router = await createTestRouter('/cadastro')
    const pushSpy = vi.spyOn(router, 'push')

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.find('form.auth-view__form').trigger('submit')

    const alerts = wrapper.findAll('.text-input__help[role="alert"]')
    expect(alerts).toHaveLength(3)
    expect(alerts.map((item) => item.text())).toEqual([
      'Informe seu nome de usuário.',
      'Informe seu email.',
      'Informe sua senha.',
    ])
    expect(toast.getToasts().some((item) => item.type === 'error')).toBe(true)
    expect(pushSpy).not.toHaveBeenCalled()
    expect(apiClient.post).not.toHaveBeenCalled()

    await wrapper.find('input[name="username"]').setValue('Ada Lovelace')
    await wrapper.find('input[name="email"]').setValue('ada-sem-arroba')
    await wrapper.find('input[name="password"]').setValue('123')
    await wrapper.find('form.auth-view__form').trigger('submit')

    const updatedAlerts = wrapper.findAll('.text-input__help[role="alert"]')
    expect(updatedAlerts).toHaveLength(2)
    expect(updatedAlerts[0]?.text()).toBe('Informe um email válido contendo @.')
    expect(updatedAlerts[1]?.text()).toBe('A senha deve ter no mínimo 6 caracteres.')
    expect(pushSpy).not.toHaveBeenCalled()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('submits valid register form via POST /users (password_hash) + auto-login POST /login, disables while submitting, and navigates to /chat', async () => {
    const router = await createTestRouter('/cadastro')

    let resolveRegister!: (value: { data: unknown }) => void
    const registerPromise = new Promise<{ data: unknown }>((resolve) => {
      resolveRegister = resolve
    })

    vi.mocked(apiClient.post).mockImplementation((url) => {
      if (url === '/users') {
        return registerPromise
      }
      if (url === '/login') {
        return Promise.resolve({ data: {} })
      }
      return Promise.reject(new Error(`Unexpected POST ${url}`))
    })

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.find('input[name="username"]').setValue('Linus Torvalds')
    await wrapper.find('input[name="email"]').setValue('linus@prismon.ai')
    await wrapper.find('input[name="password"]').setValue('segredo123')
    await wrapper.find('form.auth-view__form').trigger('submit')

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('input[name="email"]').attributes('disabled')).toBeDefined()

    resolveRegister({
      data: {
        id: 10,
        username: 'Linus Torvalds',
        email: 'linus@prismon.ai',
        created_at: '2026-03-01T10:00:00Z',
        updated_at: '2026-03-01T10:00:00Z',
      },
    })
    await flushPromises()

    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/users', {
      username: 'Linus Torvalds',
      email: 'linus@prismon.ai',
      password_hash: 'segredo123',
    })
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/login', {
      email: 'linus@prismon.ai',
      password: 'segredo123',
    })

    const { currentUser, isAuthenticated } = useAuthState()
    expect(isAuthenticated.value).toBe(true)
    expect(currentUser.value?.username).toBe('Linus Torvalds')
    expect(wrapper.findAll('.text-input__help[role="alert"]')).toHaveLength(0)
    expect(toast.getToasts().some((item) => item.type === 'success')).toBe(true)
    expect(router.currentRoute.value.path).toBe('/chat')
  })

  it('submits valid login form via POST /login + GET /me and navigates to /chat', async () => {
    const router = await createTestRouter('/login')

    vi.mocked(apiClient.post).mockResolvedValue({ data: {} })
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        id: 5,
        username: 'Maria Silva',
        email: 'maria@prismon.ai',
        created_at: '2026-02-01T10:00:00Z',
        updated_at: '2026-02-01T10:00:00Z',
      },
    })

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.find('input[name="email"]').setValue('maria@prismon.ai')
    await wrapper.find('input[name="password"]').setValue('123456')
    await wrapper.find('form.auth-view__form').trigger('submit')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/login', {
      email: 'maria@prismon.ai',
      password: '123456',
    })
    expect(apiClient.get).toHaveBeenCalledWith('/me')

    const { currentUser, isAuthenticated } = useAuthState()
    expect(isAuthenticated.value).toBe(true)
    expect(currentUser.value?.id).toBe(5)
    expect(wrapper.findAll('.text-input__help[role="alert"]')).toHaveLength(0)
    expect(toast.getToasts().some((item) => item.type === 'success')).toBe(true)
    expect(router.currentRoute.value.path).toBe('/chat')
  })

  it('surfaces API validation fieldErrors and HTTP error toasts on failure', async () => {
    const router = await createTestRouter('/cadastro')

    vi.mocked(apiClient.post).mockRejectedValueOnce(
      makeAxiosError(422, {
        detail: [
          {
            loc: ['body', 'email'],
            msg: 'E-mail já está em uso.',
            type: 'value_error',
          },
        ],
      }),
    )

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.find('input[name="username"]').setValue('Ada Lovelace')
    await wrapper.find('input[name="email"]').setValue('ada@prismon.ai')
    await wrapper.find('input[name="password"]').setValue('segredo123')
    await wrapper.find('form.auth-view__form').trigger('submit')
    await flushPromises()

    const alerts = wrapper.findAll('.text-input__help[role="alert"]')
    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.text()).toBe('E-mail já está em uso.')
    expect(toast.getToasts().some((item) => item.type === 'error')).toBe(true)
    expect(router.currentRoute.value.path).toBe('/cadastro')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()

    await wrapper.find('.auth-view__switch-link').trigger('click')
    await flushPromises()

    vi.mocked(apiClient.post).mockRejectedValueOnce(
      makeAxiosError(401, { detail: 'Credenciais inválidas.' }),
    )

    await wrapper.find('input[name="email"]').setValue('ada@prismon.ai')
    await wrapper.find('input[name="password"]').setValue('errada123')
    await wrapper.find('form.auth-view__form').trigger('submit')
    await flushPromises()

    expect(
      toast
        .getToasts()
        .some((item) => item.type === 'error' && item.title === 'Credenciais inválidas.'),
    ).toBe(true)
    expect(router.currentRoute.value.path).toBe('/login')
    expect(wrapper.text()).not.toContain('Explorar UI Kit')
  })
})
