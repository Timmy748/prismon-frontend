import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { defineComponent } from 'vue'
import { apiClient } from '@/api/client'
import type { ApiKeyHintSchema } from '@/api/types/apiKeys'
import type { MemberSchema } from '@/api/types/members'
import type { ProjectSchema } from '@/api/types/projects'
import {
  BatchActionBar,
  ConfirmDialog,
  DataTable,
  Modal,
  Notification,
  Select,
  toast,
} from '@/components/ui'
import { _resetAuthForTesting, useAuthState } from '@/stores/authState'
import { _resetWorkspaceForTesting, useWorkspaceState } from '@/stores/workspaceState'
import MembersView from '../MembersView.vue'
import ApiKeysView from '../ApiKeysView.vue'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
    post: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
    put: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
    patch: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
    delete: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
  },
  setUnauthorizedHandler: vi.fn<(handler: (() => void) | null) => void>(),
  setAuthRefreshEnabled: vi.fn<(enabled: boolean) => void>(),
  runWithoutAuthRefresh: <T>(operation: () => Promise<T>) => operation(),
  resolveApiUrl: (path: string) => path,
}))

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPatch = vi.mocked(apiClient.patch)
const mockedDelete = vi.mocked(apiClient.delete)

const DummyRouteView = defineComponent({
  template: '<div />',
})

function createAxiosError(status: number, detail: string): AxiosError {
  const headers = new AxiosHeaders()
  const response: AxiosResponse = {
    data: { detail },
    status,
    statusText: 'Error',
    headers,
    config: { headers },
  }
  return new AxiosError(
    `Request failed with status ${status}`,
    'ERR_BAD_REQUEST',
    response.config,
    undefined,
    response,
  )
}

const DEFAULT_PROJECT: ProjectSchema = {
  id: 1,
  name: 'Prismon Core',
  owner_id: 10,
  created_at: '2026-01-10T10:00:00Z',
  updated_at: '2026-01-10T10:00:00Z',
}

async function selectComboboxOption(selectWrapper: VueWrapper, optionLabel: string): Promise<void> {
  await selectWrapper.find('[role="combobox"]').trigger('click')
  await flushPromises()
  const option = selectWrapper
    .findAll('[role="option"]')
    .find((btn) => btn.text().trim() === optionLabel)
  expect(option).toBeDefined()
  await option!.trigger('click')
  await flushPromises()
}

async function createTestRouter(initialPath: string): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/chat', name: 'chat', component: DummyRouteView },
      { path: '/projetos/:projectId/chat', name: 'project-chat', component: DummyRouteView },
      { path: '/repertorio', name: 'repertory', component: DummyRouteView },
      {
        path: '/projetos/:projectId/repertorio',
        name: 'project-repertory',
        component: DummyRouteView,
      },
      { path: '/membros', name: 'members', component: MembersView },
      { path: '/projetos/:projectId/membros', name: 'project-members', component: MembersView },
      { path: '/api-keys', name: 'api-keys', component: ApiKeysView },
      { path: '/projetos/:projectId/api-keys', name: 'project-api-keys', component: ApiKeysView },
    ],
  })

  await router.push(initialPath)
  await router.isReady()
  return router
}

function setupGetRouter(handlers: {
  userId?: number
  projects?: ProjectSchema[]
  members?: () => MemberSchema[]
  projectKeys?: () => ApiKeyHintSchema[]
  memberKeys?: () => ApiKeyHintSchema[]
}) {
  const userId = handlers.userId ?? 10
  const projects = handlers.projects ?? [DEFAULT_PROJECT]

  mockedGet.mockImplementation(async (url: unknown) => {
    const path = String(url)
    if (path === '/me') {
      return {
        data: {
          id: userId,
          username: 'ana',
          email: 'ana@prismon.ai',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      }
    }
    if (path === '/projects') {
      return {
        data: {
          items: projects,
          limit: 100,
          more: false,
          cursor: null,
        },
      }
    }
    if (/^\/projects\/\d+\/chats$/.test(path)) {
      return {
        data: {
          items: [],
          limit: 100,
          more: false,
          cursor: null,
        },
      }
    }
    if (/^\/projects\/\d+\/members$/.test(path)) {
      return {
        data: {
          items: handlers.members ? handlers.members() : [],
          limit: 100,
          more: false,
          cursor: null,
        },
      }
    }
    if (/^\/projects\/\d+\/api-keys$/.test(path)) {
      return {
        data: {
          items: handlers.projectKeys ? handlers.projectKeys() : [],
          limit: 100,
          more: false,
          cursor: null,
        },
      }
    }
    if (/^\/projects\/\d+\/members\/me\/api-keys$/.test(path)) {
      return {
        data: {
          items: handlers.memberKeys ? handlers.memberKeys() : [],
          limit: 100,
          more: false,
          cursor: null,
        },
      }
    }
    throw new Error(`Unexpected GET ${path}`)
  })
}

async function seedSessionAndWorkspace() {
  await useAuthState().loadSession()
  await useWorkspaceState().loadProjects()
}

let wrapper: VueWrapper | undefined

beforeEach(() => {
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetWorkspaceForTesting()
  vi.clearAllMocks()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  _resetAuthForTesting()
  _resetWorkspaceForTesting()
  document.body.style.overflow = ''
  vi.restoreAllMocks()
})

describe('MembersView', () => {
  const initialMembers: MemberSchema[] = [
    {
      id: 101,
      project_id: 1,
      user_id: 10,
      role: 'owner',
      status: 'active',
      created_at: '2026-01-12T10:00:00Z',
      updated_at: '2026-01-12T10:00:00Z',
    },
    {
      id: 102,
      project_id: 1,
      user_id: 22,
      role: 'director',
      status: 'active',
      created_at: '2026-02-03T10:00:00Z',
      updated_at: '2026-02-03T10:00:00Z',
    },
    {
      id: 103,
      project_id: 1,
      user_id: 33,
      role: 'member',
      status: 'active',
      created_at: '2026-02-19T10:00:00Z',
      updated_at: '2026-02-19T10:00:00Z',
    },
    {
      id: 104,
      project_id: 1,
      user_id: 44,
      role: 'collaborator',
      status: 'pending',
      created_at: '2026-03-04T10:00:00Z',
      updated_at: '2026-03-04T10:00:00Z',
    },
  ]

  it('loads members from API, renders real columns, filters by query/role, and supports manual refresh', async () => {
    const currentMembers = [...initialMembers]
    setupGetRouter({ members: () => currentMembers })
    await seedSessionAndWorkspace()

    const router = await createTestRouter('/membros')
    wrapper = mount(MembersView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.find('.app-shell__title').text()).toBe('membros')
    expect(mockedGet).toHaveBeenCalledWith('/projects/1/members', { params: { limit: 100 } })

    const headers = wrapper.findAll('thead th').map((th) => th.text())
    expect(headers).toEqual(['usuário', 'cargo', 'status', 'entrada'])

    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(4)
    expect(wrapper.text()).toContain('Usuário #10')
    expect(wrapper.text()).toContain('Proprietário')
    expect(wrapper.text()).toContain('Diretor')
    expect(wrapper.text()).toContain('Pendente')

    const searchInput = wrapper.find('.members-view input[type="search"]')
    await searchInput.setValue('22')
    await flushPromises()
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Usuário #22')

    await searchInput.setValue('Diretor')
    await flushPromises()
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Usuário #22')

    await searchInput.setValue('')
    const roleFilter = wrapper
      .findAllComponents(Select)
      .find((select) => select.props('ariaLabel') === 'Filtrar por cargo')!
    expect(roleFilter).toBeDefined()
    await selectComboboxOption(roleFilter, 'Proprietário')
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Usuário #10')

    await selectComboboxOption(roleFilter, 'Colaborador')
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Usuário #44')

    await searchInput.setValue('inexistente')
    await flushPromises()
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(0)
    expect(wrapper.find('.members-view__empty').exists()).toBe(true)

    const refreshBtn = wrapper
      .findAll('.members-view__filters button')
      .find((btn) => btn.text().includes('Atualizar'))
    expect(refreshBtn).toBeDefined()
    const callsBeforeRefresh = mockedGet.mock.calls.filter(
      ([url]) => url === '/projects/1/members',
    ).length
    await refreshBtn!.trigger('click')
    await flushPromises()
    const callsAfterRefresh = mockedGet.mock.calls.filter(
      ([url]) => url === '/projects/1/members',
    ).length
    expect(callsAfterRefresh).toBe(callsBeforeRefresh + 1)
  })

  it('shows pending invite banner for logged-in user and accepts or refuses invite via API', async () => {
    let membersList: MemberSchema[] = [
      ...initialMembers.slice(0, 3),
      {
        id: 104,
        project_id: 1,
        user_id: 44,
        role: 'collaborator',
        status: 'pending',
        created_at: '2026-03-04T10:00:00Z',
        updated_at: '2026-03-04T10:00:00Z',
      },
    ]

    setupGetRouter({
      userId: 44,
      members: () => membersList,
    })

    mockedPatch.mockImplementation(async (url: unknown) => {
      if (url === '/projects/1/members/accept') {
        const updated: MemberSchema = {
          ...membersList[3]!,
          status: 'active',
        }
        membersList = [...membersList.slice(0, 3), updated]
        return { data: updated }
      }
      if (url === '/projects/1/members/refuse') {
        const updated: MemberSchema = {
          ...membersList[3]!,
          status: 'removed',
        }
        membersList = [...membersList.slice(0, 3), updated]
        return { data: updated }
      }
      throw new Error(`Unexpected PATCH ${String(url)}`)
    })

    await seedSessionAndWorkspace()
    const router = await createTestRouter('/membros')
    wrapper = mount(MembersView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const inviteBanner = wrapper.find('.members-view__invite-banner')
    expect(inviteBanner.exists()).toBe(true)
    expect(inviteBanner.findComponent(Notification).props('title')).toBe(
      'Convite pendente para este projeto',
    )

    const acceptBtn = inviteBanner.findAll('button').find((btn) => btn.text().includes('Aceitar'))
    await acceptBtn!.trigger('click')
    await flushPromises()

    expect(mockedPatch).toHaveBeenCalledWith('/projects/1/members/accept')
    expect(wrapper.find('.members-view__invite-banner').exists()).toBe(false)
    expect(toast.getToasts().some((item) => item.type === 'success')).toBe(true)

    // Test refuse flow as well
    membersList = [
      ...initialMembers.slice(0, 3),
      {
        id: 104,
        project_id: 1,
        user_id: 44,
        role: 'collaborator',
        status: 'pending',
        created_at: '2026-03-04T10:00:00Z',
        updated_at: '2026-03-04T10:00:00Z',
      },
    ]
    const refreshBtn = wrapper
      .findAll('.members-view__filters button')
      .find((btn) => btn.text().includes('Atualizar'))
    await refreshBtn!.trigger('click')
    await flushPromises()

    const refuseBtn = wrapper
      .find('.members-view__invite-banner')
      .findAll('button')
      .find((btn) => btn.text().includes('Recusar'))
    await refuseBtn!.trigger('click')
    await flushPromises()

    expect(mockedPatch).toHaveBeenCalledWith('/projects/1/members/refuse')
    expect(wrapper.find('.members-view__invite-banner').exists()).toBe(false)
  })

  it('validates user_id and invites a member via POST /projects/{id}/members', async () => {
    const currentMembers = [...initialMembers]
    setupGetRouter({ members: () => currentMembers })

    mockedPost.mockImplementation(async (url: unknown, payload: unknown) => {
      if (url === '/projects/1/members') {
        const body = payload as { user_id: number }
        const created: MemberSchema = {
          id: 105,
          project_id: 1,
          user_id: body.user_id,
          role: 'member',
          status: 'pending',
          created_at: '2026-03-20T10:00:00Z',
          updated_at: '2026-03-20T10:00:00Z',
        }
        currentMembers.push(created)
        return { data: created }
      }
      throw new Error(`Unexpected POST ${String(url)}`)
    })

    await seedSessionAndWorkspace()
    const router = await createTestRouter('/membros')
    wrapper = mount(MembersView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const dataTable = wrapper.findComponent(DataTable)
    await dataTable.find('.data-table__toolbar-right button').trigger('click')
    await flushPromises()

    const inviteModal = wrapper
      .findAllComponents(Modal)
      .find((modal) => modal.props('title') === 'convidar membro')!
    expect(inviteModal.props('open')).toBe(true)
    expect(inviteModal.props('size')).toBe('md')

    const sendInviteButton = inviteModal
      .findAll('button')
      .find((button) => button.text().includes('Enviar convite'))!

    // Invalid empty & negative input
    await sendInviteButton.trigger('click')
    await flushPromises()
    expect(inviteModal.find('.text-input__help[role="alert"]').exists()).toBe(true)
    expect(mockedPost).not.toHaveBeenCalled()

    await inviteModal.find('input[name="invite-user-id"]').setValue('-5')
    await sendInviteButton.trigger('click')
    await flushPromises()
    expect(mockedPost).not.toHaveBeenCalled()

    await inviteModal.find('input[name="invite-user-id"]').setValue('55')
    await sendInviteButton.trigger('click')
    await flushPromises()

    expect(mockedPost).toHaveBeenCalledWith('/projects/1/members', { user_id: 55 })
    expect(inviteModal.props('open')).toBe(false)
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(5)
    expect(wrapper.text()).toContain('Usuário #55')
    expect(toast.getToasts().some((item) => item.type === 'success')).toBe(true)
  })

  it('updates roles in batch via PATCH and removes selected members via DELETE', async () => {
    let currentMembers = [...initialMembers]
    setupGetRouter({ members: () => currentMembers })

    mockedPatch.mockImplementation(async (url: unknown, payload: unknown) => {
      const match = /^\/projects\/1\/members\/(\d+)$/.exec(String(url))
      if (!match) throw new Error(`Unexpected PATCH ${String(url)}`)
      const memberId = Number(match[1])
      const body = payload as { new_role: MemberSchema['role'] }
      currentMembers = currentMembers.map((m) =>
        m.id === memberId ? { ...m, role: body.new_role } : m,
      )
      return { data: currentMembers.find((m) => m.id === memberId) }
    })

    mockedDelete.mockImplementation(async (url: unknown) => {
      const match = /^\/projects\/1\/members\/(\d+)$/.exec(String(url))
      if (!match) throw new Error(`Unexpected DELETE ${String(url)}`)
      const memberId = Number(match[1])
      currentMembers = currentMembers.filter((m) => m.id !== memberId)
      return { data: undefined }
    })

    await seedSessionAndWorkspace()
    const router = await createTestRouter('/membros')
    wrapper = mount(MembersView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const rows = wrapper.findAll('tbody .data-table__row')
    await rows[1]!.trigger('click')
    await rows[2]!.trigger('click')
    await flushPromises()

    const batchBar = wrapper.findComponent(BatchActionBar)
    expect(batchBar.exists()).toBe(true)
    expect(batchBar.props('selectedCount')).toBe(2)

    const changeRoleBtn = batchBar
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('alterar cargo'))!
    await changeRoleBtn.trigger('click')
    await flushPromises()

    const roleModal = wrapper
      .findAllComponents(Modal)
      .find((modal) => modal.props('title') === 'alterar cargo')!
    expect(roleModal.props('open')).toBe(true)
    expect(roleModal.props('size')).toBe('md')

    const batchRoleSelect = roleModal
      .findAllComponents(Select)
      .find((select) => select.props('name') === 'batch-role-target')!
    expect(batchRoleSelect).toBeDefined()
    await selectComboboxOption(batchRoleSelect, 'Colaborador')
    const applyBtn = roleModal
      .findAll('button')
      .find((button) => button.text().includes('Aplicar'))!
    await applyBtn.trigger('click')
    await flushPromises()

    expect(mockedPatch).toHaveBeenCalledWith('/projects/1/members/102', {
      new_role: 'collaborator',
    })
    expect(mockedPatch).toHaveBeenCalledWith('/projects/1/members/103', {
      new_role: 'collaborator',
    })
    expect(roleModal.props('open')).toBe(false)
    expect(wrapper.findComponent(BatchActionBar).exists()).toBe(false)
    expect(wrapper.findAll('tbody .data-table__row')[1]!.text()).toContain('Colaborador')
    expect(wrapper.findAll('tbody .data-table__row')[2]!.text()).toContain('Colaborador')

    // Remove member 104
    await wrapper.findAll('tbody .data-table__row')[3]!.trigger('click')
    await flushPromises()

    const removeBtn = wrapper
      .findComponent(BatchActionBar)
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('remover'))!
    await removeBtn.trigger('click')
    await flushPromises()

    const confirmDialog = wrapper
      .findAllComponents(ConfirmDialog)
      .find((dialog) => dialog.props('title') === 'remover membros')!
    expect(confirmDialog.props('open')).toBe(true)

    const confirmRemoveBtn = confirmDialog
      .findAll('button')
      .find((button) => button.text().includes('Remover'))!
    await confirmRemoveBtn.trigger('click')
    await flushPromises()

    expect(mockedDelete).toHaveBeenCalledWith('/projects/1/members/104')
    expect(confirmDialog.props('open')).toBe(false)
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(3)
    expect(wrapper.text()).not.toContain('Usuário #44')
  })
})

describe('ApiKeysView', () => {
  const initialProjectKeys: ApiKeyHintSchema[] = [
    {
      id: 11,
      provider: 'openrouter',
      api_hint: 'sk-or-••••4a9f',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 12,
      provider: 'openrouter',
      api_hint: 'sk-or-••••3c9a',
      created_at: '2026-01-28T10:00:00Z',
    },
  ]

  const initialMemberKeys: ApiKeyHintSchema[] = [
    {
      id: 21,
      provider: 'openrouter',
      api_hint: 'sk-or-••••8c21',
      created_at: '2026-03-02T10:00:00Z',
    },
  ]

  it('loads project and member API keys without demo banner and uses strict real columns', async () => {
    setupGetRouter({
      projectKeys: () => initialProjectKeys,
      memberKeys: () => initialMemberKeys,
    })
    await seedSessionAndWorkspace()

    const router = await createTestRouter('/api-keys')
    wrapper = mount(ApiKeysView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.find('.app-shell__title').text()).toBe('chaves de api')
    expect(wrapper.findAllComponents(Notification)).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Ambiente de demonstração local')

    expect(mockedGet).toHaveBeenCalledWith('/projects/1/api-keys', { params: { limit: 100 } })
    expect(mockedGet).toHaveBeenCalledWith('/projects/1/members/me/api-keys', {
      params: { limit: 100 },
    })

    const tables = wrapper.findAllComponents(DataTable)
    expect(tables).toHaveLength(2)

    const [projectTable, memberTable] = tables
    const expectedColumns = [
      { key: 'id', label: 'id' },
      { key: 'provider', label: 'provedor' },
      { key: 'hint', label: 'hint' },
      { key: 'createdAtLabel', label: 'criada em' },
    ]
    expect(projectTable!.props('columns')).toEqual(expectedColumns)
    expect(memberTable!.props('columns')).toEqual(expectedColumns)

    expect(projectTable!.findAll('tbody .data-table__row')).toHaveLength(2)
    expect(memberTable!.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(projectTable!.text()).toContain('sk-or-••••4a9f')
    expect(memberTable!.text()).toContain('sk-or-••••8c21')
  })

  it('validates and creates project and member API keys via modal and reloads lists', async () => {
    const projectKeys = [...initialProjectKeys]
    const memberKeys = [...initialMemberKeys]

    setupGetRouter({
      projectKeys: () => projectKeys,
      memberKeys: () => memberKeys,
    })

    mockedPost.mockImplementation(async (url: unknown, payload: unknown) => {
      const body = payload as { provider: 'openrouter'; api_key: string }
      if (url === '/projects/1/api-keys') {
        const created: ApiKeyHintSchema = {
          id: 13,
          provider: body.provider,
          api_hint: 'sk-or-••••9999',
          created_at: '2026-03-20T10:00:00Z',
        }
        projectKeys.unshift(created)
        return { data: created }
      }
      if (url === '/projects/1/members/me/api-keys') {
        const created: ApiKeyHintSchema = {
          id: 22,
          provider: body.provider,
          api_hint: 'sk-or-••••7777',
          created_at: '2026-03-20T10:00:00Z',
        }
        memberKeys.unshift(created)
        return { data: created }
      }
      throw new Error(`Unexpected POST ${String(url)}`)
    })

    await seedSessionAndWorkspace()
    const router = await createTestRouter('/api-keys')
    wrapper = mount(ApiKeysView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const [projectTable, memberTable] = wrapper.findAllComponents(DataTable)

    await projectTable!.find('.data-table__toolbar-right button').trigger('click')
    await flushPromises()

    const createModal = wrapper
      .findAllComponents(Modal)
      .find((modal) => modal.props('title') === 'nova chave de api')!
    expect(createModal.props('open')).toBe(true)
    expect(createModal.props('size')).toBe('md')

    const secretInput = createModal.find('input[name="api-key-secret"]')
    expect(secretInput.attributes('type')).toBe('password')

    const saveBtn = createModal
      .findAll('button')
      .find((button) => button.text().includes('Salvar chave'))!

    await saveBtn.trigger('click')
    await flushPromises()
    expect(createModal.find('.text-input__help[role="alert"]').text()).toBe(
      'Informe a chave de API.',
    )
    expect(mockedPost).not.toHaveBeenCalled()

    const providerSelect = createModal
      .findAllComponents(Select)
      .find((select) => select.props('name') === 'api-key-provider')!
    expect(providerSelect).toBeDefined()
    await selectComboboxOption(providerSelect, 'OpenRouter')
    await secretInput.setValue('sk-or-v1-secret-proj-9999')
    await saveBtn.trigger('click')
    await flushPromises()

    expect(mockedPost).toHaveBeenCalledWith('/projects/1/api-keys', {
      provider: 'openrouter',
      api_key: 'sk-or-v1-secret-proj-9999',
    })
    expect(createModal.props('open')).toBe(false)
    expect(projectTable!.findAll('tbody .data-table__row')).toHaveLength(3)
    expect(projectTable!.text()).toContain('sk-or-••••9999')

    await memberTable!.find('.data-table__toolbar-right button').trigger('click')
    await flushPromises()
    const keyTypeSelect = createModal
      .findAllComponents(Select)
      .find((select) => select.props('name') === 'api-key-type')!
    expect(keyTypeSelect).toBeDefined()
    expect(keyTypeSelect.props('modelValue')).toBe('membro')
    expect((keyTypeSelect.find('input[name="api-key-type"]').element as HTMLInputElement).value).toBe(
      'membro',
    )
    expect(keyTypeSelect.find('[role="combobox"]').text()).toContain('Membro logado')

    await createModal.find('input[name="api-key-secret"]').setValue('sk-or-v1-secret-user-7777')
    await createModal
      .findAll('button')
      .find((button) => button.text().includes('Salvar chave'))!
      .trigger('click')
    await flushPromises()

    expect(mockedPost).toHaveBeenCalledWith('/projects/1/members/me/api-keys', {
      provider: 'openrouter',
      api_key: 'sk-or-v1-secret-user-7777',
    })
    expect(memberTable!.findAll('tbody .data-table__row')).toHaveLength(2)
    expect(memberTable!.text()).toContain('sk-or-••••7777')
  })

  it('revokes project keys via DELETE and surfaces API error on member key revoke without faking deletion', async () => {
    let projectKeys = [...initialProjectKeys]
    const memberKeys = [...initialMemberKeys]

    setupGetRouter({
      projectKeys: () => projectKeys,
      memberKeys: () => memberKeys,
    })

    mockedDelete.mockImplementation(async (url: unknown) => {
      if (url === '/projects/1/api-keys/11') {
        projectKeys = projectKeys.filter((item) => item.id !== 11)
        return { data: undefined }
      }
      if (url === '/projects/1/api-keys/21') {
        throw createAxiosError(
          403,
          'Sem permissão para revogar chave pessoal via endpoint de projeto.',
        )
      }
      throw new Error(`Unexpected DELETE ${String(url)}`)
    })

    await seedSessionAndWorkspace()
    const router = await createTestRouter('/api-keys')
    wrapper = mount(ApiKeysView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const [projectTable, memberTable] = wrapper.findAllComponents(DataTable)
    const confirmDialog = wrapper
      .findAllComponents(ConfirmDialog)
      .find((dialog) => dialog.props('title') === 'revogar chaves selecionadas')!

    // Revoke project key 11
    await projectTable!.findAll('tbody .data-table__row')[0]!.trigger('click')
    await flushPromises()

    await projectTable!
      .findComponent(BatchActionBar)
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('revogar'))!
      .trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(true)
    await confirmDialog
      .findAll('button')
      .find((button) => button.text().includes('Revogar'))!
      .trigger('click')
    await flushPromises()

    expect(mockedDelete).toHaveBeenCalledWith('/projects/1/api-keys/11')
    expect(confirmDialog.props('open')).toBe(false)
    expect(projectTable!.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(projectTable!.text()).not.toContain('sk-or-••••4a9f')

    // Attempt revoke on member key 21 -> API rejects with 403 -> list must remain unchanged and error toast shown
    await memberTable!.findAll('tbody .data-table__row')[0]!.trigger('click')
    await flushPromises()

    await memberTable!
      .findComponent(BatchActionBar)
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('revogar'))!
      .trigger('click')
    await flushPromises()

    await confirmDialog
      .findAll('button')
      .find((button) => button.text().includes('Revogar'))!
      .trigger('click')
    await flushPromises()

    expect(mockedDelete).toHaveBeenCalledWith('/projects/1/api-keys/21')
    expect(memberTable!.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(memberTable!.text()).toContain('sk-or-••••8c21')
    expect(
      toast
        .getToasts()
        .some(
          (item) =>
            item.type === 'error' &&
            Boolean(item.title?.includes('Sem permissão para revogar chave pessoal')),
        ),
    ).toBe(true)
  })
})
