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

  it('validates and invites a new member via modal', async () => {
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

  it('updates role in batch and removes selected members via ConfirmDialog', async () => {
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
  it('renders local demo notice, api keys table, and filters by search and scope', async () => {
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

    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(4)
    expect(wrapper.text()).toContain('pk_live_84f1••••')

    await wrapper.find('input[type="search"]').setValue('3c9a')
    await flushPromises()
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Automação Workflows Jurídicos')

    await wrapper.find('input[type="search"]').setValue('')
    await wrapper.find('select[aria-label="Filtrar por escopo"]').setValue('Administração')
    await flushPromises()
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Sincronização Workspace')
  })

  it('creates a new simulated API key, displays one-time notification, and allows copying and closing it', async () => {
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

    const dataTable = wrapper.findComponent(DataTable)
    await dataTable.find('.data-table__toolbar-right button').trigger('click')
    await flushPromises()

    const createModal = wrapper.findComponent(Modal)
    expect(createModal.props('open')).toBe(true)

    const generateBtn = createModal
      .findAll('button')
      .find((button) => button.text().includes('Gerar chave'))
    await generateBtn!.trigger('click')
    await flushPromises()

    expect(createModal.find('.text-input__help[role="alert"]').text()).toBe(
      'Informe um nome para a chave.',
    )

    await createModal.find('input[name="api-key-name"]').setValue('Pipeline Produção')
    await createModal.find('select[name="api-key-scope"]').setValue('Leitura e escrita')
    await generateBtn!.trigger('click')
    await flushPromises()

    expect(createModal.props('open')).toBe(false)
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(5)
    expect(wrapper.text()).toContain('Pipeline Produção')

    const createdBanner = wrapper.find('.api-keys-view__created-banner')
    expect(createdBanner.exists()).toBe(true)
    expect(createdBanner.text()).toContain('Nova chave gerada')
    expect(createdBanner.text()).toContain('pk_live_sim_')

    const copyButton = createdBanner
      .findAll('button')
      .find((button) => button.text().includes('Copiar chave'))
    await copyButton!.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText.mock.calls[0]?.[0]).toMatch(/^pk_live_sim_/)

    await createdBanner.find('button[aria-label="Fechar aviso de nova chave"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('.api-keys-view__created-banner').exists()).toBe(false)
  })

  it('revokes single and batch keys via ConfirmDialog', async () => {
    const router = await createTestRouter('/api-keys')

    wrapper = mount(ApiKeysView, {
      global: {
        plugins: [router],
      },
    })

    const singleDeleteBtn = wrapper.find('button[aria-label="Revogar Integração Repertório CI"]')
    await singleDeleteBtn.trigger('click')
    await flushPromises()

    const confirmDialog = wrapper.findComponent(ConfirmDialog)
    expect(confirmDialog.props('open')).toBe(true)
    expect(confirmDialog.props('description')).toContain('1 chave(s)')
    expect(wrapper.findComponent(BatchActionBar).exists()).toBe(false)

    const confirmRevokeBtn = confirmDialog
      .findAll('button')
      .find((button) => button.text().includes('Revogar'))
    await confirmRevokeBtn!.trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(false)
    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(3)
    expect(wrapper.text()).not.toContain('Integração Repertório CI')

    const rows = wrapper.findAll('tbody .data-table__row')
    await rows[0]!.trigger('click')
    await rows[1]!.trigger('click')
    await flushPromises()

    const batchRevokeBtn = wrapper
      .findComponent(BatchActionBar)
      .findAll('button.batch-action-bar__button')
      .find((button) => button.text().includes('revogar'))
    await batchRevokeBtn!.trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(true)
    expect(confirmDialog.props('description')).toContain('2 chave(s)')

    await confirmDialog
      .findAll('button')
      .find((button) => button.text().includes('Revogar'))!
      .trigger('click')
    await flushPromises()

    expect(wrapper.findAll('tbody .data-table__row')).toHaveLength(1)
    expect(wrapper.text()).toContain('Conector Busca Semântica')
  })
})
