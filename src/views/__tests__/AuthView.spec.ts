import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { defineComponent } from 'vue'
import AuthView from '../AuthView.vue'
import { toast } from '@/components/ui'

const DummyRouteView = defineComponent({
  template: '<div data-testid="dummy-route" />',
})

async function createTestRouter(initialPath = '/cadastro'): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/cadastro', name: 'register', component: AuthView },
      { path: '/login', name: 'login', component: AuthView },
      { path: '/chat', name: 'chat', component: DummyRouteView },
      { path: '/ui-kit', name: 'ui-kit', component: DummyRouteView },
    ],
  })

  await router.push(initialPath)
  await router.isReady()
  return router
}

let wrapper: VueWrapper | undefined

beforeEach(() => {
  toast._resetForTesting()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
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
        { path: '/ui-kit', component: DummyRouteView },
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

    await wrapper.find('input[name="username"]').setValue('Ada Lovelace')
    await wrapper.find('input[name="email"]').setValue('ada-sem-arroba')
    await wrapper.find('input[name="password"]').setValue('123')
    await wrapper.find('form.auth-view__form').trigger('submit')

    const updatedAlerts = wrapper.findAll('.text-input__help[role="alert"]')
    expect(updatedAlerts).toHaveLength(2)
    expect(updatedAlerts[0]?.text()).toBe('Informe um email válido contendo @.')
    expect(updatedAlerts[1]?.text()).toBe('A senha deve ter no mínimo 6 caracteres.')
    expect(pushSpy).not.toHaveBeenCalled()
  })

  it('submits valid register form with success toast and navigates to /chat', async () => {
    const router = await createTestRouter('/cadastro')

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.find('input[name="username"]').setValue('Linus Torvalds')
    await wrapper.find('input[name="email"]').setValue('linus@prismon.ai')
    await wrapper.find('input[name="password"]').setValue('segredo123')
    await wrapper.find('form.auth-view__form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('.text-input__help[role="alert"]')).toHaveLength(0)
    expect(toast.getToasts().some((item) => item.type === 'success')).toBe(true)
    expect(router.currentRoute.value.path).toBe('/chat')
  })

  it('submits valid login form with success toast and navigates to /chat', async () => {
    const router = await createTestRouter('/login')

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.find('input[name="email"]').setValue('maria@prismon.ai')
    await wrapper.find('input[name="password"]').setValue('123456')
    await wrapper.find('form.auth-view__form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('.text-input__help[role="alert"]')).toHaveLength(0)
    expect(toast.getToasts().some((item) => item.type === 'success')).toBe(true)
    expect(router.currentRoute.value.path).toBe('/chat')
  })

  it('opens forgot password modal in login mode and simulates recovery email toast', async () => {
    const router = await createTestRouter('/login')

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    await wrapper.find('.auth-view__forgot-link').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.find('.modal__title').text()).toBe('recuperar senha')

    await wrapper.find('input[name="recovery-email"]').setValue('recuperar@prismon.ai')
    await wrapper.find('#auth-forgot-form').trigger('submit')

    expect(toast.getToasts().some((item) => item.type === 'info')).toBe(true)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('navigates to /ui-kit when clicking Explorar UI Kit', async () => {
    const router = await createTestRouter('/login')

    wrapper = mount(AuthView, {
      global: {
        plugins: [router],
      },
    })

    const exploreButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Explorar UI Kit'))
    expect(exploreButton).toBeDefined()

    await exploreButton!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/ui-kit')
  })
})
