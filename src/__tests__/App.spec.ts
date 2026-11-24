import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { Toaster } from '@/components/ui'
import App from '../App.vue'
import AuthView from '../views/AuthView.vue'

describe('App', () => {
  it('mounts and renders the login route at /login with global Toaster', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', redirect: '/login' },
        { path: '/login', name: 'login', component: AuthView, props: { initialMode: 'login' } },
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
    expect(wrapper.findComponent(Toaster).exists()).toBe(true)
  })
})
