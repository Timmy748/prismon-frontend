import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import AuthView from '../views/AuthView.vue'
import UiKitPreview from '../views/UiKitPreview.vue'

describe('App', () => {
  it('mounts and renders the login route at /login', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: '/login' },
        { path: '/login', name: 'login', component: AuthView, props: { initialMode: 'login' } },
        { path: '/ui-kit', name: 'ui-kit-preview', component: UiKitPreview },
      ],
    })
    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Bem vindo de volta')
  })

  it('mounts and renders the UI Kit preview route at /ui-kit', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/login', name: 'login', component: AuthView, props: { initialMode: 'login' } },
        { path: '/ui-kit', name: 'ui-kit-preview', component: UiKitPreview },
      ],
    })
    await router.push('/ui-kit')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('prismon ui kit')
  })
})
