import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { defineComponent } from 'vue'
import {
  BatchActionBar,
  ConfirmDialog,
  DataTable,
  Modal,
  Notification,
  toast,
} from '@/components/ui'
import MembersView from '../MembersView.vue'
import ApiKeysView from '../ApiKeysView.vue'

const DummyRouteView = defineComponent({
  template: '<div />',
})

async function createTestRouter(initialPath: string): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/chat', name: 'chat', component: DummyRouteView },
      { path: '/repertorio', name: 'repertory', component: DummyRouteView },
      { path: '/membros', name: 'members', component: MembersView },
      { path: '/api-keys', name: 'api-keys', component: ApiKeysView },
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
  document.body.style.overflow = ''
  vi.restoreAllMocks()
})

describe('MembersView', () => {
  it('renders members list and filters by search query and role', async () => {
    const router = await createTestRouter('/membros')

    wrapper = mount(MembersView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.app-shell__title').text()).toBe('membros')
    const initialRows = wrapper.findAll('tbody .data-table__row')
    expect(initialRows).toHaveLength(5)
    expect(wrapper.text()).toContain('Ana Paula Ribeiro')
    expect(wrapper.text()).toContain('Lucas Ferreira')

    const searchInput = wrapper.find('input[type="search"]')
    await searchInput.setValue('camila@prismon.ai')
    await flushPromises()

    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Camila Andrade')

    await searchInput.setValue('')
    const roleFilter = wrapper.find('select[aria-label="Filtrar por cargo"]')
    await roleFilter.setValue('Administrador')
    await flushPromises()

    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Ana Paula Ribeiro')

    await roleFilter.setValue('Visualizador')
    await flushPromises()
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(2)

    await searchInput.setValue('inexistente')
    await flushPromises()
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(0)
    expect(wrapper.find('.members-view__empty').exists()).toBe(true)
  })

  it('validates and invites a new member via lg modal', async () => {
    const router = await createTestRouter('/membros')

    wrapper = mount(MembersView, {
      global: {
        plugins: [router],
      },
    })

    const dataTable = wrapper.findComponent(DataTable)
    await dataTable.find('.data-table__toolbar-right button').trigger('click')
    await flushPromises()

    const inviteModal = wrapper
      .findAllComponents(Modal)
      .find((modal) => modal.props('title') === 'convidar membro')
    expect(inviteModal?.props('open')).toBe(true)
    expect(inviteModal?.props('size')).toBe('lg')

    const sendInviteButton = inviteModal!
      .findAll('button')
      .find((button) => button.text().includes('Enviar convite'))
    expect(sendInviteButton).toBeDefined()

    await sendInviteButton!.trigger('click')
    await flushPromises()

    expect(inviteModal!.findAll('.text-input__help[role="alert"]')).toHaveLength(2)
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(5)

    await inviteModal!.find('input[name="invite-name"]').setValue('Mariana Costa')
    await inviteModal!.find('input[name="invite-email"]').setValue('mariana@empresa.com')
    await inviteModal!.find('select[name="invite-role"]').setValue('Administrador')

    await sendInviteButton!.trigger('click')
    await flushPromises()

    expect(inviteModal!.props('open')).toBe(false)
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(6)
    expect(wrapper.text()).toContain('Mariana Costa')
    expect(wrapper.text()).toContain('mariana@empresa.com')
    expect(wrapper.text()).toContain('Convite pendente')
    expect(toast.getToasts().some((item) => item.type === 'success')).toBe(true)
  })

  it('updates role in batch via lg modal and removes selected members via ConfirmDialog', async () => {
    const router = await createTestRouter('/membros')

    wrapper = mount(MembersView, {
      global: {
        plugins: [router],
      },
    })

    const rows = wrapper.findAll('tbody .data-table__row')
    await rows[1]!.trigger('click')
    await rows[3]!.trigger('click')
    await flushPromises()

    const batchBar = wrapper.findComponent(BatchActionBar)
    expect(batchBar.exists()).toBe(true)
    expect(batchBar.props('selectedCount')).toBe(2)

    const changeRoleBtn = batchBar
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('alterar cargo'))
    expect(changeRoleBtn).toBeDefined()
    await changeRoleBtn!.trigger('click')
    await flushPromises()

    const roleModal = wrapper
      .findAllComponents(Modal)
      .find((modal) => modal.props('title') === 'alterar cargo')
    expect(roleModal?.props('open')).toBe(true)
    expect(roleModal?.props('size')).toBe('lg')

    await roleModal!.find('select[name="batch-role-target"]').setValue('Administrador')
    const applyBtn = roleModal!
      .findAll('button')
      .find((button) => button.text().includes('Aplicar'))
    await applyBtn!.trigger('click')
    await flushPromises()

    expect(roleModal!.props('open')).toBe(false)
    expect(wrapper.findComponent(BatchActionBar).exists()).toBe(false)
    expect(wrapper.findAll('tbody .data-table__row')[1]!.text()).toContain('Administrador')
    expect(wrapper.findAll('tbody .data-table__row')[3]!.text()).toContain('Administrador')

    await wrapper.findAll('tbody .data-table__row')[4]!.trigger('click')
    await flushPromises()

    const removeBtn = wrapper
      .findComponent(BatchActionBar)
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('remover'))
    await removeBtn!.trigger('click')
    await flushPromises()

    const confirmDialog = wrapper.findComponent(ConfirmDialog)
    expect(confirmDialog.props('open')).toBe(true)

    const confirmRemoveBtn = confirmDialog
      .findAll('button')
      .find((button) => button.text().includes('Remover'))
    await confirmRemoveBtn!.trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(false)
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(4)
    expect(wrapper.text()).not.toContain('Beatriz Mendes')
  })
})

describe('ApiKeysView', () => {
  it('renders local demo notice and both project and logged-in member tables with strict columns', async () => {
    const router = await createTestRouter('/api-keys')

    wrapper = mount(ApiKeysView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.app-shell__title').text()).toBe('chaves de api')
    const notifications = wrapper.findAllComponents(Notification)
    expect(notifications).toHaveLength(1)
    expect(notifications[0]!.props('title')).toBe('Ambiente de demonstração local')

    const tables = wrapper.findAllComponents(DataTable)
    expect(tables).toHaveLength(2)

    const projectTable = tables[0]!
    const memberTable = tables[1]!

    expect(projectTable.props('title')).toBe('apis do projeto')
    expect(projectTable.props('actionLabel')).toBe('nova chave do projeto')
    expect(memberTable.props('title')).toBe('minhas apis (membro logado)')
    expect(memberTable.props('actionLabel')).toBe('nova chave pessoal')

    const expectedColumns = [
      { key: 'id', label: 'id' },
      { key: 'hint', label: 'hint' },
      { key: 'createdAt', label: 'criada em' },
    ]
    expect(projectTable.props('columns')).toEqual(expectedColumns)
    expect(memberTable.props('columns')).toEqual(expectedColumns)

    const projectHeaders = projectTable.findAll('thead th').map((th) => th.text())
    const memberHeaders = memberTable.findAll('thead th').map((th) => th.text())
    expect(projectHeaders).toEqual(['id', 'hint', 'criada em'])
    expect(memberHeaders).toEqual(['id', 'hint', 'criada em'])

    expect(projectTable.findAll('tbody .data-table__row')).toHaveLength(3)
    expect(memberTable.findAll('tbody .data-table__row')).toHaveLength(2)

    expect(projectTable.findAll('.api-keys-view__id')).toHaveLength(3)
    expect(projectTable.findAll('.api-keys-view__hint')).toHaveLength(3)
    expect(memberTable.findAll('.api-keys-view__id')).toHaveLength(2)
    expect(memberTable.findAll('.api-keys-view__hint')).toHaveLength(2)

    expect(projectTable.text()).toContain('pk_proj_••••4a9f')
    expect(memberTable.text()).toContain('pk_user_••••8c21')
  })

  it('creates project and member API keys via lg modal, displays banner, and copies/closes it', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    const router = await createTestRouter('/api-keys')

    wrapper = mount(ApiKeysView, {
      global: {
        plugins: [router],
      },
    })

    const [projectTable, memberTable] = wrapper.findAllComponents(DataTable)

    await projectTable!.find('.data-table__toolbar-right button').trigger('click')
    await flushPromises()

    const createModal = wrapper.findComponent(Modal)
    expect(createModal.props('open')).toBe(true)
    expect(createModal.props('size')).toBe('lg')
    expect(createModal.props('title')).toBe('nova chave de api')

    const typeSelect = createModal.find('select[name="api-key-type"]')
    expect((typeSelect.element as HTMLSelectElement).value).toBe('projeto')

    const generateBtn = createModal
      .findAll('button')
      .find((button) => button.text().includes('Gerar chave'))
    await generateBtn!.trigger('click')
    await flushPromises()

    expect(createModal.find('.text-input__help[role="alert"]').text()).toBe(
      'Informe uma identificação para a chave.',
    )

    await createModal.find('input[name="api-key-alias"]').setValue('Pipeline Produção')
    await generateBtn!.trigger('click')
    await flushPromises()

    expect(createModal.props('open')).toBe(false)
    expect(projectTable!.findAll('tbody .data-table__row')).toHaveLength(4)
    expect(memberTable!.findAll('tbody .data-table__row')).toHaveLength(2)
    expect(projectTable!.findAll('tbody .data-table__row')[0]!.text()).toContain('agora')
    expect(projectTable!.findAll('tbody .data-table__row')[0]!.text()).toContain('pk_proj_••••')

    const createdBanner = wrapper.find('.api-keys-view__created-banner')
    expect(createdBanner.exists()).toBe(true)
    expect(createdBanner.text()).toContain('Nova chave gerada')
    expect(createdBanner.text()).toContain('Pipeline Produção')
    expect(createdBanner.text()).toContain('pk_proj_sim_')

    const copyButton = createdBanner
      .findAll('button')
      .find((button) => button.text().includes('Copiar chave'))
    await copyButton!.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0]?.[0]).toMatch(/^pk_proj_sim_/)

    await createdBanner.find('button[aria-label="Fechar aviso de nova chave"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('.api-keys-view__created-banner').exists()).toBe(false)

    await memberTable!.find('.data-table__toolbar-right button').trigger('click')
    await flushPromises()

    expect(createModal.props('open')).toBe(true)
    expect(
      (createModal.find('select[name="api-key-type"]').element as HTMLSelectElement).value,
    ).toBe('membro')

    await createModal.find('input[name="api-key-alias"]').setValue('CLI Local')
    await createModal
      .findAll('button')
      .find((button) => button.text().includes('Gerar chave'))!
      .trigger('click')
    await flushPromises()

    expect(createModal.props('open')).toBe(false)
    expect(projectTable!.findAll('tbody .data-table__row')).toHaveLength(4)
    expect(memberTable!.findAll('tbody .data-table__row')).toHaveLength(3)
    expect(memberTable!.findAll('tbody .data-table__row')[0]!.text()).toContain('pk_user_••••')
    expect(wrapper.find('.api-keys-view__created-banner').text()).toContain('pk_user_sim_')
  })

  it('revokes selected keys in batch via BatchActionBar and ConfirmDialog for both tables', async () => {
    const router = await createTestRouter('/api-keys')

    wrapper = mount(ApiKeysView, {
      global: {
        plugins: [router],
      },
    })

    const [projectTable, memberTable] = wrapper.findAllComponents(DataTable)
    const confirmDialog = wrapper.findComponent(ConfirmDialog)

    const projectRows = projectTable!.findAll('tbody .data-table__row')
    await projectRows[0]!.trigger('click')
    await projectRows[1]!.trigger('click')
    await flushPromises()

    const projectBatchBar = projectTable!.findComponent(BatchActionBar)
    expect(projectBatchBar.exists()).toBe(true)
    expect(projectBatchBar.props('selectedCount')).toBe(2)

    await projectBatchBar
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('revogar'))!
      .trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(true)
    expect(confirmDialog.props('description')).toContain('2 chave(s)')

    await confirmDialog
      .findAll('button')
      .find((button) => button.text().includes('Revogar'))!
      .trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(false)
    expect(projectTable!.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(projectTable!.text()).toContain('key_proj_sync_7b20')
    expect(memberTable!.findAll('tbody .data-table__row')).toHaveLength(2)

    const memberRows = memberTable!.findAll('tbody .data-table__row')
    await memberRows[0]!.trigger('click')
    await flushPromises()

    const memberBatchBar = memberTable!.findComponent(BatchActionBar)
    expect(memberBatchBar.exists()).toBe(true)
    expect(memberBatchBar.props('selectedCount')).toBe(1)

    await memberBatchBar
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('revogar'))!
      .trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(true)
    expect(confirmDialog.props('description')).toContain('1 chave(s)')

    await confirmDialog
      .findAll('button')
      .find((button) => button.text().includes('Revogar'))!
      .trigger('click')
    await flushPromises()

    expect(memberTable!.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(memberTable!.text()).toContain('key_user_dev_19de')
  })
})
