import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    put: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  setUnauthorizedHandler: vi.fn<(handler: (() => void) | null) => void>(),
  resolveApiUrl: vi.fn<(path: string) => string>((path: string) => `/api${path}`),
  uploadFileToPresignedUrl: vi.fn<(...args: unknown[]) => Promise<void>>(),
}))

import { apiClient } from '@/api/client'
import {
  ConfirmDialog,
  Drawer,
  ListItem,
  Modal,
  NavList,
  ProfileCard,
  Sidebar,
  toast,
} from '@/components/ui'
import { _resetAuthForTesting, useAuthState } from '@/stores/authState'
import { _resetWorkspaceForTesting, useWorkspaceState } from '@/stores/workspaceState'
import {
  AppShell,
  ChatThreadsPanel,
  CreateProjectModal,
  ProfileSettingsModal,
  ProjectInfoModal,
} from '../index'

const DummyRouteView = { template: '<div />' }

const MOCK_USER_DTO = {
  id: 1,
  username: 'Ana Paula',
  email: 'ana@prismon.ai',
  created_at: '2026-01-10T10:00:00Z',
  updated_at: '2026-01-10T10:00:00Z',
}

const MOCK_PROJECTS_DTO = [
  {
    id: 1,
    name: 'Prismon Core',
    owner_id: 1,
    created_at: '2026-01-11T10:00:00Z',
    updated_at: '2026-01-11T10:00:00Z',
  },
  {
    id: 2,
    name: 'Jurídico IA',
    owner_id: 2,
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z',
  },
]

const MOCK_CHATS_PROJECT_1 = [
  {
    id: 101,
    title: 'Revisão de Prompt',
    project_id: 1,
    owner: 1,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 102,
    title: 'Análise RAG',
    project_id: 1,
    owner: 1,
    created_at: '2026-02-02T10:00:00Z',
    updated_at: '2026-02-02T10:00:00Z',
  },
]

const MOCK_CHATS_PROJECT_2 = [
  {
    id: 201,
    title: 'Contrato NDA',
    project_id: 2,
    owner: 2,
    created_at: '2026-02-03T10:00:00Z',
    updated_at: '2026-02-03T10:00:00Z',
  },
]

function seedAuthenticatedUser() {
  const { currentUser, sessionChecked } = useAuthState()
  currentUser.value = {
    id: MOCK_USER_DTO.id,
    username: MOCK_USER_DTO.username,
    email: MOCK_USER_DTO.email,
    createdAt: MOCK_USER_DTO.created_at,
    updatedAt: MOCK_USER_DTO.updated_at,
    createdAtLabel: '10/01/2026',
  }
  sessionChecked.value = true
}

function setupDefaultApiMocks() {
  vi.mocked(apiClient.get).mockImplementation((url) => {
    if (url === '/projects') {
      return Promise.resolve({
        data: { items: MOCK_PROJECTS_DTO, next_cursor: null, has_more: false },
      })
    }
    if (url === '/projects/1/chats') {
      return Promise.resolve({
        data: { items: MOCK_CHATS_PROJECT_1, next_cursor: null, has_more: false },
      })
    }
    if (url === '/projects/2/chats') {
      return Promise.resolve({
        data: { items: MOCK_CHATS_PROJECT_2, next_cursor: null, has_more: false },
      })
    }
    if (url === '/projects/3/chats') {
      return Promise.resolve({
        data: { items: [], next_cursor: null, has_more: false },
      })
    }
    if (url.startsWith('/chats/') && url.endsWith('/messages')) {
      return Promise.resolve({
        data: { items: [], next_cursor: null, has_more: false },
      })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
}

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

async function createProjectScopedTestRouter(
  initialPath = '/projetos/1/repertorio',
): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: DummyRouteView },
      { path: '/projetos/:projectId/chats', name: 'chat', component: DummyRouteView },
      { path: '/projetos/:projectId/chats/:chatId', name: 'chat-thread', component: DummyRouteView },
      { path: '/projetos/:projectId/repertorio', name: 'repertory', component: DummyRouteView },
      {
        path: '/projetos/:projectId/repertorio/documentos',
        name: 'repertory-documents',
        component: DummyRouteView,
      },
      {
        path: '/projetos/:projectId/repertorio/documentos/:itemId',
        name: 'repertory-document-detail',
        component: DummyRouteView,
      },
      {
        path: '/projetos/:projectId/repertorio/assets',
        name: 'repertory-assets',
        component: DummyRouteView,
      },
      {
        path: '/projetos/:projectId/repertorio/assets/:itemId',
        name: 'repertory-asset-detail',
        component: DummyRouteView,
      },
      {
        path: '/projetos/:projectId/repertorio/tags',
        name: 'repertory-tags',
        component: DummyRouteView,
      },
      { path: '/projetos/:projectId/membros', name: 'members', component: DummyRouteView },
      { path: '/projetos/:projectId/api-keys', name: 'api-keys', component: DummyRouteView },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  return router
}

let wrapper: VueWrapper | undefined

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetWorkspaceForTesting()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  window.localStorage.clear()
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetWorkspaceForTesting()
  document.body.style.overflow = ''
  vi.restoreAllMocks()
})

describe('AppShell', () => {
  it('initializes workspace on mount and renders two sidebars with persistent chat list', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
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
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/projects', { params: { limit: 100 } })
    expect(apiClient.get).toHaveBeenCalledWith('/projects/1/chats', { params: { limit: 100 } })

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
    expect(projectLabels).toEqual(['Prismon Core', 'Jurídico IA'])

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

    const chatsPanel = navSidebar.findComponent(ChatThreadsPanel)
    expect(chatsPanel.exists()).toBe(true)
    expect(chatsPanel.find('.chat-threads__group-title').text()).toBe('Meus chats')
    const chatListItems = chatsPanel.findAllComponents(ListItem)
    expect(chatListItems).toHaveLength(2)
    expect(chatListItems.every((item) => item.props('icon') === undefined)).toBe(true)

    const profileCard = wrapper.findComponent(ProfileCard)
    expect(profileCard.props('username')).toBe('Ana Paula')
    expect(profileCard.props('role')).toBe('ana@prismon.ai')

    expect(wrapper.find('.app-shell__title').text()).toBe('repertório')
    expect(wrapper.find('main.app-shell__main [data-testid="page-body"]').text()).toBe(
      'Conteúdo principal',
    )
  })

  it('handles 0 projects cleanly with "sem projeto" fallback and "criar projeto" button', async () => {
    seedAuthenticatedUser()
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { items: [], next_cursor: null, has_more: false },
    })

    const router = await createTestRouter('/chat')
    wrapper = mount(AppShell, {
      props: {
        title: 'chatbot',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const navSidebar = wrapper.findAllComponents(Sidebar)[1]!
    expect(navSidebar.props('title')).toBe('sem projeto')
    expect(navSidebar.find('.app-shell__no-project').text()).toContain('sem projeto')
    expect(navSidebar.find('.app-shell__no-project button').text()).toContain('criar projeto')
    expect(wrapper.findComponent(ChatThreadsPanel).text()).toContain('nenhuma conversa encontrada')
  })

  it('switches project, renames and deletes via ProjectInfoModal, and creates project with { name }', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
    vi.mocked(apiClient.put).mockResolvedValue({
      data: {
        id: 2,
        name: 'Jurídico Pro',
        owner_id: 2,
        created_at: '2026-01-12T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
    })
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        id: 3,
        name: 'Financeiro IA',
        owner_id: 1,
        created_at: '2026-02-10T10:00:00Z',
        updated_at: '2026-02-10T10:00:00Z',
      },
    })

    const router = await createTestRouter('/repertorio')
    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const projectsSidebar = wrapper.findAllComponents(Sidebar)[0]!
    const projectsWrapper = wrapper.find('.app-shell__projects-sidebar')
    expect(projectsWrapper.classes()).toContain('app-shell__sidebar--collapsed')

    await projectsWrapper.find('button[aria-label="Alternar lista de projetos"]').trigger('click')
    expect(projectsWrapper.classes()).not.toContain('app-shell__sidebar--collapsed')

    const juridicoItem = projectsSidebar
      .findAllComponents(ListItem)
      .find((item) => item.props('label') === 'Jurídico IA')
    expect(juridicoItem).toBeDefined()

    await juridicoItem!
      .find('button[aria-label="Informações do projeto Jurídico IA"]')
      .trigger('click')
    await flushPromises()

    const infoModal = wrapper.findComponent(ProjectInfoModal)
    expect(infoModal.props('open')).toBe(true)
    expect(infoModal.findComponent(Modal).props('size')).toBe('md')
    expect(infoModal.text()).toContain('Jurídico IA')
    expect(infoModal.text()).toContain('ID #2')
    expect(infoModal.text()).toContain('Proprietário ID #2')
    expect(infoModal.text()).toContain('Criado em')

    await infoModal
      .findAll('button')
      .find((btn) => btn.text().includes('Selecionar projeto'))!
      .trigger('click')
    await flushPromises()

    expect(infoModal.props('open')).toBe(false)
    expect(apiClient.get).toHaveBeenCalledWith('/projects/2/chats', { params: { limit: 100 } })
    expect(wrapper.findAllComponents(Sidebar)[1]!.props('title')).toBe('Jurídico IA')
    expect(wrapper.emitted('project-change')?.[0]?.[0]).toEqual(
      expect.objectContaining({ id: 2, name: 'Jurídico IA' }),
    )

    // Reopen info modal to rename and delete
    await projectsSidebar
      .findAllComponents(ListItem)
      .find((item) => item.props('label') === 'Jurídico IA')!
      .find('button[aria-label="Informações do projeto Jurídico IA"]')
      .trigger('click')
    await flushPromises()

    await infoModal.find('button[aria-label="Renomear projeto"]').trigger('click')
    await infoModal.find('input[name="project-rename"]').setValue('Jurídico Pro')
    await infoModal.find('form.project-info__rename-form').trigger('submit')
    await flushPromises()

    expect(apiClient.put).toHaveBeenCalledWith('/projects/2', { name: 'Jurídico Pro' })
    expect(wrapper.findAllComponents(Sidebar)[1]!.props('title')).toBe('Jurídico Pro')

    // Delete project via ConfirmDialog
    await infoModal
      .findAll('button')
      .find((btn) => btn.text().includes('Excluir projeto'))!
      .trigger('click')
    await flushPromises()

    const confirmDialog = infoModal.findComponent(ConfirmDialog)
    expect(confirmDialog.props('open')).toBe(true)
    await confirmDialog
      .findAll('button')
      .find((btn) => btn.text().includes('Excluir projeto'))!
      .trigger('click')
    await flushPromises()

    expect(apiClient.delete).toHaveBeenCalledWith('/projects/2')
    expect(infoModal.props('open')).toBe(false)
    expect(wrapper.findAllComponents(Sidebar)[1]!.props('title')).toBe('Prismon Core')

    // Create a new project via CreateProjectModal (only { name })
    const createProjectBtn = projectsSidebar
      .findAll('button')
      .find((btn) => btn.text().includes('criar projeto'))
    await createProjectBtn!.trigger('click')
    await flushPromises()

    const createModal = wrapper.findComponent(CreateProjectModal)
    expect(createModal.props('open')).toBe(true)
    expect(createModal.findComponent(Modal).props('size')).toBe('md')
    expect(createModal.find('textarea').exists()).toBe(false)
    expect(createModal.find('select').exists()).toBe(false)

    await createModal.find('input[name="project-name"]').setValue('Financeiro IA')
    await createModal.find('form').trigger('submit')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith('/projects', { name: 'Financeiro IA' })
    expect(createModal.props('open')).toBe(false)
    expect(wrapper.findAllComponents(Sidebar)[1]!.props('title')).toBe('Financeiro IA')
    expect(toast.getToasts().some((item) => item.title?.includes('Financeiro IA'))).toBe(true)
  })

  it('selects, renames, and deletes chat threads via API in ChatThreadsPanel', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        id: 101,
        title: 'Prompt Otimizado',
        project_id: 1,
        owner: 1,
        created_at: '2026-02-01T10:00:00Z',
        updated_at: '2026-02-05T10:00:00Z',
      },
    })
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })

    const router = await createTestRouter('/repertorio')
    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const chatsPanel = wrapper.findAllComponents(Sidebar)[1]!.findComponent(ChatThreadsPanel)
    expect(chatsPanel.findComponent(Modal).props('size')).toBe('md')
    const firstThread = chatsPanel.findAllComponents(ListItem)[0]!

    await firstThread.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith('/chats/101/messages', { params: { limit: 100 } })
    expect(useWorkspaceState().activeThreadId.value).toBe(101)
    expect(router.currentRoute.value.path).toBe('/chat')

    // Rename thread
    await firstThread
      .find('button[aria-label="Opções da conversa Revisão de Prompt"]')
      .trigger('click')
    await flushPromises()
    const renameOption = chatsPanel
      .findAll('[role="menuitem"]')
      .find((item) => item.text().includes('Editar nome'))
    await renameOption!.trigger('click')
    await flushPromises()

    await chatsPanel.find('input[name="thread-title"]').setValue('Prompt Otimizado')
    await chatsPanel.find('#rename-thread-form').trigger('submit')
    await flushPromises()

    expect(apiClient.patch).toHaveBeenCalledWith('/chats/101', { title: 'Prompt Otimizado' })
    expect(chatsPanel.findAllComponents(ListItem)[0]!.props('label')).toBe('Prompt Otimizado')

    // Delete thread
    await chatsPanel
      .findAllComponents(ListItem)[0]!
      .find('button[aria-label="Opções da conversa Prompt Otimizado"]')
      .trigger('click')
    await flushPromises()
    const deleteOption = chatsPanel
      .findAll('[role="menuitem"]')
      .find((item) => item.text().includes('Deletar'))
    await deleteOption!.trigger('click')
    await flushPromises()

    const confirmDialog = chatsPanel.findComponent(ConfirmDialog)
    await confirmDialog
      .findAll('button')
      .find((btn) => btn.text().includes('Remover'))!
      .trigger('click')
    await flushPromises()

    expect(apiClient.delete).toHaveBeenCalledWith('/chats/101')
    expect(chatsPanel.findAllComponents(ListItem)).toHaveLength(1)
  })

  it('clicks chatbot nav to open Novo Chat screen and supports custom sidebar-extra slot', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
    const router = await createTestRouter('/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const { selectThread, activeThreadId } = useWorkspaceState()
    await selectThread(101)
    expect(activeThreadId.value).toBe(101)

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
            <div data-testid="conv-list" :data-collapsed="String(collapsed)" :data-project="String(activeProject?.id)">
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
    await flushPromises()

    const navSidebarEl = wrapper.find('.app-shell__nav-sidebar')
    const convList = navSidebarEl.find('[data-testid="conv-list"]')
    expect(convList.exists()).toBe(true)
    expect(convList.attributes('data-collapsed')).toBe('false')
    expect(convList.attributes('data-project')).toBe('1')

    expect(wrapper.find('.app-shell__subheader [data-testid="shell-subheader"]').exists()).toBe(
      true,
    )
    expect(wrapper.find('.app-shell__topbar-right [data-testid="topbar-action"]').exists()).toBe(
      true,
    )
  })

  it('opens mobile Drawer with horizontal nav + vertical chats + profile and switches body to vertical projects list on back button', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
    const router = await createTestRouter('/chat')

    wrapper = mount(AppShell, {
      props: {
        title: 'chatbot',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    await wrapper
      .find('.app-shell__mobile-bar button[aria-label="Abrir navegação"]')
      .trigger('click')
    await flushPromises()

    const mobileDrawer = wrapper.findComponent(Drawer)
    expect(mobileDrawer.props('open')).toBe(true)
    expect(mobileDrawer.props('direction')).toBe('bottom')

    const horizontalNav = mobileDrawer
      .find('.app-shell__mobile-horizontal-nav')
      .findComponent(NavList)
    expect(horizontalNav.props('orientation')).toBe('horizontal')
    expect(mobileDrawer.findComponent(ChatThreadsPanel).exists()).toBe(true)
    expect(mobileDrawer.findComponent(ProfileCard).exists()).toBe(true)

    const backBtn = mobileDrawer.find('button[aria-label="Voltar para lista de projetos"]')
    expect(backBtn.exists()).toBe(true)
    await backBtn.trigger('click')
    await flushPromises()

    expect(mobileDrawer.props('open')).toBe(true)
    const projectsBody = mobileDrawer.find('.app-shell__mobile-projects-body')
    expect(projectsBody.exists()).toBe(true)
    expect(projectsBody.findComponent(NavList).props('orientation')).toBe('vertical')
    expect(projectsBody.findAllComponents(ListItem)).toHaveLength(2)
    expect(mobileDrawer.find('.app-shell__mobile-projects-footer button').text()).toContain(
      'criar projeto',
    )

    const juridicoProject = projectsBody
      .findAllComponents(ListItem)
      .find((item: VueWrapper) => (item.props() as { label?: string }).label === 'Jurídico IA')
    await juridicoProject!.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(mobileDrawer.props('open')).toBe(true)
    expect(mobileDrawer.find('.app-shell__mobile-horizontal-nav').exists()).toBe(true)
    expect(mobileDrawer.find('.app-shell__brand').text()).toBe('Jurídico IA')
  })

  it('opens ProfileSettingsModal without plano studio tag, updates profile via PUT /me, sets default project, and changes password via PATCH /me/change-password', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
    vi.mocked(apiClient.put).mockResolvedValue({
      data: {
        id: 1,
        username: 'Marina Silva',
        email: 'marina@prismon.ai',
        created_at: '2026-01-10T10:00:00Z',
        updated_at: '2026-02-20T10:00:00Z',
      },
    })
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: {
        id: 1,
        username: 'Marina Silva',
        email: 'marina@prismon.ai',
        created_at: '2026-01-10T10:00:00Z',
        updated_at: '2026-02-21T10:00:00Z',
      },
    })

    const router = await createTestRouter('/repertorio')
    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const settingsModal = wrapper.findComponent(ProfileSettingsModal)
    expect(settingsModal.exists()).toBe(true)
    expect(settingsModal.props('open')).toBe(false)
    expect(settingsModal.findComponent(Modal).props('size')).toBe('md')
    expect(wrapper.findComponent(Drawer).props('open')).toBe(false)

    const profileCard = wrapper.findComponent(ProfileCard)
    await profileCard.find('button[aria-label="Configurações do perfil"]').trigger('click')

    expect(settingsModal.props('open')).toBe(true)
    const dialog = wrapper.find('[role="dialog"][aria-modal="true"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('configurações da conta')
    expect(dialog.text()).toContain('ana@prismon.ai')
    expect(dialog.text()).not.toContain('plano studio')

    await wrapper.find('input[name="profile-username"]').setValue('Marina Silva')
    await wrapper.find('input[name="profile-email"]').setValue('marina@prismon.ai')
    await wrapper.find('.profile-modal [role="combobox"]').trigger('click')
    await flushPromises()
    const projectOption = wrapper
      .findAll('[role="option"]')
      .find((option) => option.text().includes('Jurídico IA'))
    expect(projectOption).toBeDefined()
    await projectOption!.trigger('click')
    await flushPromises()

    const saveButton = wrapper
      .findAll('.profile-modal__actions button')
      .find((button) => button.text().includes('Salvar alterações'))
    expect(saveButton).toBeDefined()
    await saveButton!.trigger('click')
    await flushPromises()

    expect(apiClient.put).toHaveBeenCalledWith('/me', {
      username: 'Marina Silva',
      email: 'marina@prismon.ai',
    })
    expect(useWorkspaceState().defaultProjectId.value).toBe(2)
    expect(settingsModal.props('open')).toBe(false)
    expect(wrapper.findComponent(ProfileCard).props('username')).toBe('Marina Silva')
    expect(wrapper.findComponent(ProfileCard).props('role')).toBe('marina@prismon.ai')

    // Reopen and switch to "Alterar senha" tab
    await profileCard.find('button[aria-label="Configurações do perfil"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('input[name="old-password"]').exists()).toBe(false)

    const passwordTab = wrapper
      .findAll('.profile-modal [role="tab"]')
      .find((tab) => tab.text().includes('Alterar senha'))
    expect(passwordTab).toBeDefined()
    await passwordTab!.trigger('click')
    await flushPromises()

    await wrapper.find('input[name="old-password"]').setValue('senha-antiga')
    await wrapper.find('input[name="new-password"]').setValue('nova-senha-123')
    await wrapper.find('input[name="confirm-password"]').setValue('nova-senha-123')

    const updatePasswordButton = wrapper
      .findAll('.profile-modal__actions button')
      .find((button) => button.text().includes('Atualizar senha'))
    expect(updatePasswordButton).toBeDefined()
    expect(
      wrapper
        .findAll('.profile-modal__actions button')
        .some((button) => button.text().includes('Salvar alterações')),
    ).toBe(false)

    await updatePasswordButton!.trigger('click')
    await flushPromises()

    expect(apiClient.patch).toHaveBeenCalledWith('/me/change-password', {
      old_password: 'senha-antiga',
      new_password: 'nova-senha-123',
    })
    expect(
      toast
        .getToasts()
        .some((item) => item.type === 'success' && item.title === 'Senha alterada com sucesso.'),
    ).toBe(true)
  })

  it('supports collapsed nav footer settings button and logout via POST /logout', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
    vi.mocked(apiClient.post).mockResolvedValue({ data: {} })

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
    await flushPromises()

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

    expect(apiClient.post).toHaveBeenCalledWith('/logout')
    expect(useAuthState().isAuthenticated.value).toBe(false)
    expect(useWorkspaceState().projects.value).toEqual([])
    expect(settingsModal.props('open')).toBe(false)
    expect(wrapper.emitted('logout')).toHaveLength(1)
    expect(router.currentRoute.value.path).toBe('/login')
    expect(toast.getToasts().some((item) => item.type === 'info')).toBe(true)
  })

  it('hides chat threads panel completely when nav sidebar is collapsed and keeps collapsed state across route changes', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
    const router = await createProjectScopedTestRouter('/projetos/1/repertorio')

    wrapper = mount(AppShell, {
      props: {
        title: 'repertório',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const navSidebarEl = wrapper.find('.app-shell__nav-sidebar')
    expect(navSidebarEl.classes()).not.toContain('app-shell__sidebar--collapsed')
    expect(navSidebarEl.find('.chat-threads').exists()).toBe(true)

    await navSidebarEl.find('button[aria-label="Alternar menu do projeto"]').trigger('click')
    await flushPromises()

    expect(useWorkspaceState().isNavCollapsed.value).toBe(true)
    expect(navSidebarEl.classes()).toContain('app-shell__sidebar--collapsed')
    expect(navSidebarEl.find('.chat-threads').exists()).toBe(false)
    expect(navSidebarEl.find('.chat-threads__divider').exists()).toBe(false)
    expect(navSidebarEl.find('button[aria-label="Nova conversa"]').exists()).toBe(false)
    expect(navSidebarEl.text()).not.toContain('conversas')

    const membersItem = navSidebarEl
      .find('.app-shell__primary-nav')
      .findAllComponents(ListItem)
      .find((item: VueWrapper) => (item.props() as { label?: string }).label === 'membros')
    await membersItem!.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/projetos/1/membros')
    expect(useWorkspaceState().isNavCollapsed.value).toBe(true)
    expect(navSidebarEl.classes()).toContain('app-shell__sidebar--collapsed')
    expect(navSidebarEl.find('.chat-threads').exists()).toBe(false)

    // Remount on another route without defaultCollapsed: collapsed state persists
    wrapper.unmount()
    wrapper = mount(AppShell, {
      props: {
        title: 'chaves de api',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    expect(wrapper.find('.app-shell__nav-sidebar').classes()).toContain(
      'app-shell__sidebar--collapsed',
    )
    expect(wrapper.find('.app-shell__nav-sidebar .chat-threads').exists()).toBe(false)
  })

  it('persists route :projectId and :chatId on reload and updates project-scoped URLs on thread/project actions', async () => {
    seedAuthenticatedUser()
    setupDefaultApiMocks()
    vi.mocked(apiClient.delete).mockResolvedValue({ data: {} })
    const router = await createProjectScopedTestRouter('/projetos/2/chats/201')

    wrapper = mount(AppShell, {
      props: {
        title: 'chatbot',
      },
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    expect(useWorkspaceState().activeProjectId.value).toBe(2)
    expect(useWorkspaceState().activeThreadId.value).toBe(201)
    expect(apiClient.get).toHaveBeenCalledWith('/projects/2/chats', { params: { limit: 100 } })
    expect(apiClient.get).toHaveBeenCalledWith('/chats/201/messages', { params: { limit: 100 } })

    const navSidebar = wrapper.findAllComponents(Sidebar)[1]!
    expect(navSidebar.props('title')).toBe('Jurídico IA')

    const repertoryItem = navSidebar
      .find('.app-shell__primary-nav')
      .findAllComponents(ListItem)
      .find((item: VueWrapper) => (item.props() as { label?: string }).label === 'repertório')
    expect(repertoryItem!.find('a.list-item__trigger').attributes('href')).toBe(
      '/projetos/2/repertorio',
    )
    await repertoryItem!.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/projetos/2/repertorio')
    expect(repertoryItem?.props('active')).toBe(true)

    // Clicking thread navigates to /projetos/2/chats/201
    const chatsPanel = navSidebar.findComponent(ChatThreadsPanel)
    expect(
      chatsPanel.findAllComponents(ListItem)[0]!.find('a.list-item__trigger').attributes('href'),
    ).toBe('/projetos/2/chats/201')
    await chatsPanel.findAllComponents(ListItem)[0]!.find('.list-item__trigger').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/projetos/2/chats/201')

    // Deleting active thread navigates back to /projetos/2/chats
    await chatsPanel
      .findAllComponents(ListItem)[0]!
      .find('button[aria-label="Opções da conversa Contrato NDA"]')
      .trigger('click')
    await flushPromises()
    const deleteOption = chatsPanel
      .findAll('[role="menuitem"]')
      .find((item) => item.text().includes('Deletar'))
    await deleteOption!.trigger('click')
    await flushPromises()
    const confirmDialog = chatsPanel.findComponent(ConfirmDialog)
    await confirmDialog
      .findAll('button')
      .find((btn) => btn.text().includes('Remover'))!
      .trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/projetos/2/chats')
    expect(useWorkspaceState().activeThreadId.value).toBeNull()
  })
})
