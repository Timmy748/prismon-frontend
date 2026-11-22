import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { ListItem, ProfileCard, toast } from '@/components/ui'
import { AppShell, ProfileSettingsDrawer } from '../index'

const DummyRouteView = { template: '<div />' }

async function createTestRouter(initialPath = '/repertorio'): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/chat', name: 'chat', component: DummyRouteView },
      { path: '/repertorio', name: 'repertory', component: DummyRouteView },
      { path: '/membros', name: 'members', component: DummyRouteView },
      { path: '/api-keys', name: 'api-keys', component: DummyRouteView },
      { path: '/ui-kit', name: 'ui-kit', component: DummyRouteView },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  return router
}

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  toast._resetForTesting()
  document.body.style.overflow = ''
})

describe('AppShell', () => {
  it('renders navigation links, marks current route item active, and renders main content', async () => {
    const router = await createTestRouter('/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      slots: {
        default: '<section data-testid="page-body">Conteúdo principal</section>',
      },
      global: {
        plugins: [router],
      },
    })

    const labels = wrapper.findAllComponents(ListItem).map((item) => item.props('label'))
    expect(labels).toEqual([
      'chatbot',
      'repertório',
      'membros',
      'chaves de api',
      'ui kit preview',
      'sair',
    ])

    const repertoryItem = wrapper
      .findAllComponents(ListItem)
      .find((item) => item.props('label') === 'repertório')
    expect(repertoryItem?.props('active')).toBe(true)
    expect(repertoryItem?.find('.list-item__trigger').attributes('aria-current')).toBe('page')

    expect(wrapper.find('.app-shell__title').text()).toBe('repertório')
    expect(wrapper.find('main.app-shell__main [data-testid="page-body"]').text()).toBe(
      'Conteúdo principal',
    )
  })

  it('navigates to selected route when clicking a ListItem', async () => {
    const router = await createTestRouter('/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })

    const membersItem = wrapper
      .findAllComponents(ListItem)
      .find((item) => item.props('label') === 'membros')
    expect(membersItem).toBeDefined()

    await membersItem!.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/membros')
    expect(membersItem!.props('active')).toBe(true)
  })

  it('opens ProfileSettingsDrawer from ProfileCard settings button and saves changes locally with toast', async () => {
    const router = await createTestRouter('/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })

    const settingsDrawer = wrapper.findComponent(ProfileSettingsDrawer)
    expect(settingsDrawer.props('open')).toBe(false)

    const profileCard = wrapper.findComponent(ProfileCard)
    await profileCard.find('button[aria-label="Configurações do perfil"]').trigger('click')

    expect(settingsDrawer.props('open')).toBe(true)
    expect(
      wrapper.find('[role="dialog"][aria-label="Configurações de conta e workspace"]').exists(),
    ).toBe(true)

    const inputs = wrapper.findAll('.profile-drawer__form input')
    expect(inputs).toHaveLength(2)
    await inputs[0]!.setValue('Marina Silva')
    await inputs[1]!.setValue('marina@prismon.ai')

    const workspaceSelect = wrapper.find('.profile-drawer__form select')
    await workspaceSelect.setValue('Pesquisa Jurídica')

    const saveButton = wrapper
      .findAll('.profile-drawer__actions button')
      .find((button) => button.text().includes('Salvar alterações'))
    expect(saveButton).toBeDefined()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(settingsDrawer.props('open')).toBe(false)
    expect(wrapper.findComponent(ProfileCard).props('username')).toBe('Marina Silva')

    const toasts = toast.getToasts()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]?.type).toBe('success')
    expect(toasts[0]?.title).toBe('Preferências atualizadas localmente.')
  })

  it('collapses primary sidebar by default when secondary-sidebar slot is provided and supports topbar/subheader slots', async () => {
    const router = await createTestRouter('/chat')

    wrapper = mount(AppShell, {
      props: {
        title: 'chatbot',
      },
      slots: {
        'secondary-sidebar': '<div data-testid="conv-list">Conversas</div>',
        subheader: '<div data-testid="shell-subheader">Abas</div>',
        'topbar-right': '<button data-testid="topbar-action" type="button">Ação</button>',
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.app-shell__sidebar').classes()).toContain('app-shell__sidebar--collapsed')
    expect(wrapper.find('.app-shell__secondary-sidebar [data-testid="conv-list"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('.app-shell__subheader [data-testid="shell-subheader"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('.app-shell__topbar-right [data-testid="topbar-action"]').exists()).toBe(
      true,
    )

    await wrapper
      .find('.app-shell__collapsed-footer button[aria-label="Configurações do perfil"]')
      .trigger('click')
    expect(wrapper.findComponent(ProfileSettingsDrawer).props('open')).toBe(true)
  })
})
