import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { Drawer, ListItem, Modal, NavList, ProfileCard, Sidebar, toast } from '@/components/ui'
import {
  AppShell,
  ChatThreadsPanel,
  CreateProjectModal,
  MEMBER_PROJECTS,
  ProfileSettingsModal,
  ProjectInfoModal,
} from '../index'
import { _resetWorkspaceForTesting, useWorkspaceState } from '@/stores/workspaceState'

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

beforeEach(() => {
  toast._resetForTesting()
  _resetWorkspaceForTesting()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  toast._resetForTesting()
  _resetWorkspaceForTesting()
  document.body.style.overflow = ''
  vi.restoreAllMocks()
})

describe('AppShell', () => {
  it('renders two sidebars on desktop with persistent chat list and no sistema section', async () => {
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

    const primaryNavLabels = navSidebar
      .find('.app-shell__primary-nav')
      .findAllComponents(ListItem)
      .map((item: VueWrapper) => (item.props() as { label?: string }).label)
    expect(primaryNavLabels).toEqual(['chatbot', 'repertório', 'membros', 'chaves de api'])
    expect(primaryNavLabels).not.toContain('ui kit preview')
    expect(primaryNavLabels).not.toContain('sair')

    const repertoryItem = navSidebar
      .find('.app-shell__primary-nav')
      .findAllComponents(ListItem)
      .find((item: VueWrapper) => (item.props() as { label?: string }).label === 'repertório')
    expect(repertoryItem?.props('active')).toBe(true)
    expect(repertoryItem?.find('.list-item__trigger').attributes('aria-current')).toBe('page')

    // Persistent chats list renders inside sidebar on non-chat views too, without left icons
    const chatsPanel = navSidebar.findComponent(ChatThreadsPanel)
    expect(chatsPanel.exists()).toBe(true)
    const chatListItems = chatsPanel.findAllComponents(ListItem)
    expect(chatListItems.length).toBeGreaterThan(0)
    expect(chatListItems.every((item) => item.props('icon') === undefined)).toBe(true)

    expect(wrapper.find('.app-shell__title').text()).toBe('repertório')
    expect(wrapper.find('main.app-shell__main [data-testid="page-body"]').text()).toBe(
      'Conteúdo principal',
    )
  })

  it('expands projects sidebar, switches active project, creates a project, and opens project info modal', async () => {
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

    // Open project info modal via trailing exclamation icon on project item
    const infoBtn = juridicoItem!.find('button[aria-label="Informações do projeto Jurídico IA"]')
    expect(infoBtn.exists()).toBe(true)
    await infoBtn.trigger('click')
    await flushPromises()

    const infoModal = wrapper.findComponent(ProjectInfoModal)
    expect(infoModal.props('open')).toBe(true)
    expect(infoModal.text()).toContain('Jurídico IA')
    expect(infoModal.text()).toContain('Lucas Ferreira')

    await infoModal
      .findAll('button')
      .find((btn) => btn.text().includes('Selecionar projeto'))!
      .trigger('click')
    await flushPromises()

    expect(infoModal.props('open')).toBe(false)
    expect(juridicoItem!.props('active')).toBe(true)
    const navSidebar = wrapper.findAllComponents(Sidebar)[1]!
    expect(navSidebar.props('title')).toBe('Jurídico IA')
    expect(wrapper.findComponent(ProfileCard).props('role')).toBe('Editora')
    expect(wrapper.emitted('project-change')?.[0]?.[0]).toEqual(
      expect.objectContaining(MEMBER_PROJECTS.find((project) => project.id === 'juridico-ia')!),
    )

    // Create a new project via CreateProjectModal
    const createProjectBtn = projectsSidebar
      .findAll('button')
      .find((btn) => btn.text().includes('criar projeto'))
    expect(createProjectBtn).toBeDefined()
    await createProjectBtn!.trigger('click')
    await flushPromises()

    const createModal = wrapper.findComponent(CreateProjectModal)
    expect(createModal.props('open')).toBe(true)

    await createModal.find('input[name="project-name"]').setValue('Financeiro IA')
    await createModal.find('textarea[name="project-description"]').setValue('Automação fiscal.')
    await createModal.find('form').trigger('submit')
    await flushPromises()

    expect(createModal.props('open')).toBe(false)
    expect(wrapper.findAllComponents(Sidebar)[1]!.props('title')).toBe('Financeiro IA')
    expect(toast.getToasts().some((item) => item.title?.includes('Financeiro IA'))).toBe(true)
  })

  it('clicks chatbot nav to open Novo Chat screen and supports custom sidebar-extra slot', async () => {
    const router = await createTestRouter('/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })

    const { activeThreadId } = useWorkspaceState()
    expect(activeThreadId.value).toBe('thread-1')

    const navSidebar = wrapper.findAllComponents(Sidebar)[1]!
    const chatbotItem = navSidebar
      .find('.app-shell__primary-nav')
      .findAllComponents(ListItem)
      .find((item: VueWrapper) => (item.props() as { label?: string }).label === 'chatbot')
    await chatbotItem!.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/chat')
    expect(activeThreadId.value).toBeNull()

    wrapper.unmount()

    const chatRouter = await createTestRouter('/chat')
    wrapper = mount(AppShell, {
      props: {
        title: 'chatbot',
      },
      slots: {
        'sidebar-extra': `
          <template #sidebar-extra="{ collapsed, activeProject }">
            <div data-testid="conv-list" :data-collapsed="String(collapsed)" :data-project="activeProject.id">
              Conversas customizadas
            </div>
          </template>
        `,
        subheader: '<div data-testid="shell-subheader">Abas</div>',
        'topbar-right': '<button data-testid="topbar-action" type="button">Ação</button>',
      },
      global: {
        plugins: [chatRouter],
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
  })

  it('opens mobile Drawer with horizontal nav + vertical chats + profile and switches body to vertical projects list on back button', async () => {
    const router = await createTestRouter('/chat')

    wrapper = mount(AppShell, {
      props: {
        title: 'chatbot',
      },
      global: {
        plugins: [router],
      },
    })

    await wrapper
      .find('.app-shell__mobile-bar button[aria-label="Abrir navegação"]')
      .trigger('click')
    await flushPromises()

    const mobileDrawer = wrapper.findComponent(Drawer)
    expect(mobileDrawer.props('open')).toBe(true)
    expect(mobileDrawer.props('direction')).toBe('bottom')

    // Project view: horizontal NavList + vertical ChatThreadsPanel + ProfileCard
    const horizontalNav = mobileDrawer
      .find('.app-shell__mobile-horizontal-nav')
      .findComponent(NavList)
    expect(horizontalNav.props('orientation')).toBe('horizontal')
    expect(mobileDrawer.findComponent(ChatThreadsPanel).exists()).toBe(true)
    expect(mobileDrawer.findComponent(ProfileCard).exists()).toBe(true)

    // Back button inside drawer switches drawer body to vertical Projects list + Criar projeto
    const backBtn = mobileDrawer.find('button[aria-label="Voltar para lista de projetos"]')
    expect(backBtn.exists()).toBe(true)
    await backBtn.trigger('click')
    await flushPromises()

    expect(mobileDrawer.props('open')).toBe(true)
    const projectsBody = mobileDrawer.find('.app-shell__mobile-projects-body')
    expect(projectsBody.exists()).toBe(true)
    expect(projectsBody.findComponent(NavList).props('orientation')).toBe('vertical')
    expect(projectsBody.findAllComponents(ListItem)).toHaveLength(MEMBER_PROJECTS.length)
    expect(mobileDrawer.find('.app-shell__mobile-projects-footer button').text()).toContain(
      'criar projeto',
    )

    // Selecting another project switches back to the project view inside the open drawer
    const juridicoProject = projectsBody
      .findAllComponents(ListItem)
      .find((item: VueWrapper) => (item.props() as { label?: string }).label === 'Jurídico IA')
    await juridicoProject!.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(mobileDrawer.props('open')).toBe(true)
    expect(mobileDrawer.find('.app-shell__mobile-horizontal-nav').exists()).toBe(true)
    expect(mobileDrawer.find('.app-shell__brand').text()).toBe('Jurídico IA')
  })

  it('opens ProfileSettingsModal (lg Modal) from ProfileCard and saves changes locally with toast', async () => {
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
