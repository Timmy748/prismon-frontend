import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { Drawer, ListItem, Modal, ProfileCard, Sidebar, toast } from '@/components/ui'
import { AppShell, MEMBER_PROJECTS, ProfileSettingsModal } from '../index'

const DummyRouteView = { template: '<div />' }

async function createTestRouter(initialPath = '/repertorio'): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: DummyRouteView },
      { path: '/chat', name: 'chat', component: DummyRouteView },
      { path: '/repertorio', name: 'repertory', component: DummyRouteView },
      { path: '/membros', name: 'members', component: DummyRouteView },
      { path: '/api-keys', name: 'api-keys', component: DummyRouteView },
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
  it('renders two sidebars on desktop: collapsed projects rail and open project navigation without sistema section', async () => {
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

    const sidebars = wrapper.findAllComponents(Sidebar)
    expect(sidebars).toHaveLength(2)

    const projectsSidebar = sidebars[0]!
    const navSidebar = sidebars[1]!

    expect(projectsSidebar.props('collapsed')).toBe(true)
    expect(navSidebar.props('collapsed')).toBe(false)
    expect(navSidebar.props('title')).toBe('Prismon Core')

    const projectLabels = projectsSidebar
      .findAllComponents(ListItem)
      .map((item) => item.props('label'))
    expect(projectLabels).toEqual(MEMBER_PROJECTS.map((project) => project.name))

    const navLabels = navSidebar.findAllComponents(ListItem).map((item) => item.props('label'))
    expect(navLabels).toEqual(['chatbot', 'repertório', 'membros', 'chaves de api'])
    expect(navLabels).not.toContain('ui kit preview')
    expect(navLabels).not.toContain('sair')

    const repertoryItem = navSidebar
      .findAllComponents(ListItem)
      .find((item) => item.props('label') === 'repertório')
    expect(repertoryItem?.props('active')).toBe(true)
    expect(repertoryItem?.find('.list-item__trigger').attributes('aria-current')).toBe('page')

    expect(wrapper.find('.app-shell__title').text()).toBe('repertório')
    expect(wrapper.find('main.app-shell__main [data-testid="page-body"]').text()).toBe(
      'Conteúdo principal',
    )
  })

  it('expands projects sidebar and switches active project with project-change emit', async () => {
    const router = await createTestRouter('/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })

    const projectsSidebar = wrapper.findAllComponents(Sidebar)[0]!
    const projectsWrapper = wrapper.find('.app-shell__projects-sidebar')
    expect(projectsWrapper.classes()).toContain('app-shell__sidebar--collapsed')

    await projectsWrapper.find('button[aria-label="Alternar lista de projetos"]').trigger('click')
    expect(projectsWrapper.classes()).not.toContain('app-shell__sidebar--collapsed')

    const juridicoItem = projectsSidebar
      .findAllComponents(ListItem)
      .find((item) => item.props('label') === 'Jurídico IA')
    expect(juridicoItem).toBeDefined()

    await juridicoItem!.find('.list-item__trigger').trigger('click')

    expect(juridicoItem!.props('active')).toBe(true)
    const navSidebar = wrapper.findAllComponents(Sidebar)[1]!
    expect(navSidebar.props('title')).toBe('Jurídico IA')
    expect(wrapper.findComponent(ProfileCard).props('role')).toBe('Editora')
    expect(wrapper.emitted('project-change')?.[0]?.[0]).toEqual(
      MEMBER_PROJECTS.find((project) => project.id === 'juridico-ia'),
    )
  })

  it('navigates to selected route and renders sidebar-extra slot inside the navigation sidebar', async () => {
    const router = await createTestRouter('/chat')

    wrapper = mount(AppShell, {
      props: {
        title: 'chatbot',
      },
      slots: {
        'sidebar-extra': `
          <template #sidebar-extra="{ collapsed, activeProject }">
            <div data-testid="conv-list" :data-collapsed="String(collapsed)" :data-project="activeProject.id">
              Conversas recentes
            </div>
          </template>
        `,
        subheader: '<div data-testid="shell-subheader">Abas</div>',
        'topbar-right': '<button data-testid="topbar-action" type="button">Ação</button>',
      },
      global: {
        plugins: [router],
      },
    })

    const navSidebarEl = wrapper.find('.app-shell__nav-sidebar')
    const convList = navSidebarEl.find('[data-testid="conv-list"]')
    expect(convList.exists()).toBe(true)
    expect(convList.attributes('data-collapsed')).toBe('false')
    expect(convList.attributes('data-project')).toBe('prismon-core')

    expect(wrapper.find('.app-shell__subheader [data-testid="shell-subheader"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('.app-shell__topbar-right [data-testid="topbar-action"]').exists()).toBe(
      true,
    )

    await navSidebarEl.find('button[aria-label="Alternar menu do projeto"]').trigger('click')
    expect(convList.attributes('data-collapsed')).toBe('true')

    const navSidebar = wrapper.findAllComponents(Sidebar)[1]!
    const membersItem = navSidebar
      .findAllComponents(ListItem)
      .find((item) => item.props('label') === 'membros')
    await membersItem!.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/membros')
    expect(membersItem!.props('active')).toBe(true)
  })

  it('opens ProfileSettingsModal (lg Modal, not Drawer) from ProfileCard and saves changes locally with toast', async () => {
    const router = await createTestRouter('/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })

    const settingsModal = wrapper.findComponent(ProfileSettingsModal)
    expect(settingsModal.exists()).toBe(true)
    expect(settingsModal.props('open')).toBe(false)
    expect(settingsModal.findComponent(Modal).props('size')).toBe('lg')
    expect(wrapper.findComponent(Drawer).props('open')).toBe(false)

    const profileCard = wrapper.findComponent(ProfileCard)
    await profileCard.find('button[aria-label="Configurações do perfil"]').trigger('click')

    expect(settingsModal.props('open')).toBe(true)
    const dialog = wrapper.find('[role="dialog"][aria-modal="true"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('configurações da conta')
    expect(dialog.text()).toContain('plano studio')

    const inputs = wrapper.findAll('.profile-modal__form input')
    expect(inputs).toHaveLength(2)
    await inputs[0]!.setValue('Marina Silva')
    await inputs[1]!.setValue('marina@prismon.ai')

    const projectSelect = wrapper.find('.profile-modal__form select')
    await projectSelect.setValue('Jurídico IA')

    const saveButton = wrapper
      .findAll('.profile-modal__actions button')
      .find((button) => button.text().includes('Salvar alterações'))
    expect(saveButton).toBeDefined()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(settingsModal.props('open')).toBe(false)
    expect(wrapper.findComponent(ProfileCard).props('username')).toBe('Marina Silva')
    expect(wrapper.findAllComponents(Sidebar)[1]!.props('title')).toBe('Jurídico IA')

    const toasts = toast.getToasts()
    expect(toasts).toHaveLength(1)
    expect(toasts[0]?.type).toBe('success')
    expect(toasts[0]?.title).toBe('Preferências atualizadas localmente.')
  })

  it('supports collapsed nav footer settings button and logout inside ProfileSettingsModal', async () => {
    const router = await createTestRouter('/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
        defaultCollapsed: true,
      },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.app-shell__nav-sidebar').classes()).toContain(
      'app-shell__sidebar--collapsed',
    )

    await wrapper
      .find('.app-shell__collapsed-footer button[aria-label="Configurações do perfil"]')
      .trigger('click')

    const settingsModal = wrapper.findComponent(ProfileSettingsModal)
    expect(settingsModal.props('open')).toBe(true)

    const logoutButton = wrapper
      .findAll('.profile-modal__footer button')
      .find((button) => button.text().includes('Sair da conta'))
    expect(logoutButton).toBeDefined()
    await logoutButton!.trigger('click')
    await flushPromises()

    expect(settingsModal.props('open')).toBe(false)
    expect(wrapper.emitted('logout')).toHaveLength(1)
    expect(router.currentRoute.value.path).toBe('/login')
    expect(toast.getToasts()[0]?.type).toBe('info')
  })
})
