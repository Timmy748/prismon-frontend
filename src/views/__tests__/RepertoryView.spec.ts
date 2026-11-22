import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { defineComponent } from 'vue'
import RepertoryView from '../RepertoryView.vue'
import DocumentCard from '@/components/repertory/DocumentCard.vue'
import {
  Badge,
  ConfirmDialog,
  DataTable,
  DocumentDetails,
  DocumentForm,
  Sheet,
  TabItem,
  toast,
  useToasts,
} from '@/components/ui'

const DummyRouteView = defineComponent({
  template: '<div />',
})

async function createTestRouter(): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/repertorio', name: 'repertory', component: RepertoryView },
      { path: '/chat', name: 'chat', component: DummyRouteView },
      { path: '/membros', name: 'members', component: DummyRouteView },
      { path: '/api-keys', name: 'api-keys', component: DummyRouteView },
      { path: '/ui-kit', name: 'ui-kit', component: DummyRouteView },
    ],
  })

  await router.push('/repertorio')
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
  toast._resetForTesting()
  document.body.style.overflow = ''
})

describe('RepertoryView', () => {
  it('filters documents by search and tag, and opens Sheet with DocumentDetails when clicking a DocumentCard', async () => {
    const router = await createTestRouter()

    wrapper = mount(RepertoryView, {
      global: {
        plugins: [router],
      },
    })

    const initialCards = wrapper.findAllComponents(DocumentCard)
    expect(initialCards.length).toBeGreaterThanOrEqual(6)

    // Filter by search text
    const searchInput = wrapper.find('input[aria-label="Buscar documento por título"]')
    await searchInput.setValue('Workflows')
    await flushPromises()

    let visibleCards = wrapper.findAllComponents(DocumentCard)
    expect(visibleCards).toHaveLength(1)
    expect(visibleCards[0]?.props('title')).toBe('Playbook de Workflows IA')

    // Clear filters via ghost button
    const clearButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === 'limpar filtros')
    expect(clearButton).toBeTruthy()
    await clearButton?.trigger('click')
    await flushPromises()

    expect(wrapper.findAllComponents(DocumentCard).length).toBeGreaterThanOrEqual(6)

    // Filter by tag via Select
    const tagSelect = wrapper.find('select[aria-label="Filtrar por tag"]')
    await tagSelect.setValue('tokens')
    await flushPromises()

    visibleCards = wrapper.findAllComponents(DocumentCard)
    expect(visibleCards).toHaveLength(2)
    expect(wrapper.find('.repertory-view__active-filters').text()).toContain('tokens')

    // Click first visible DocumentCard to open Sheet with DocumentDetails
    await visibleCards[0]?.trigger('click')
    await flushPromises()

    const sheet = wrapper.findComponent(Sheet)
    expect(sheet.props('open')).toBe(true)

    const details = sheet.findComponent(DocumentDetails)
    expect(details.exists()).toBe(true)
    expect(details.props('title')).toBe(visibleCards[0]?.props('title'))
    expect(details.props('editableTags')).toBe(true)
  })

  it('switches between documents, assets, and tags tabs', async () => {
    const router = await createTestRouter()

    wrapper = mount(RepertoryView, {
      global: {
        plugins: [router],
      },
    })

    const tabs = wrapper.findAllComponents(TabItem)
    expect(tabs.map((tab) => tab.props('label'))).toEqual(['documents', 'assets', 'tags'])
    expect(tabs[0]?.props('active')).toBe(true)

    // Switch to assets tab
    await tabs[1]?.trigger('click')
    await flushPromises()

    expect(wrapper.find('input[aria-label="Buscar asset"]').exists()).toBe(true)
    expect(wrapper.findComponent(DataTable).exists()).toBe(true)
    expect(wrapper.findComponent(DataTable).props('title')).toBe('assets vinculados')

    // Switch to tags tab
    await tabs[2]?.trigger('click')
    await flushPromises()

    const tagsTable = wrapper.findComponent(DataTable)
    expect(tagsTable.exists()).toBe(true)
    expect(tagsTable.props('title')).toBe('tags cadastradas')
    expect(tagsTable.findAllComponents(Badge).length).toBeGreaterThan(0)

    // Switch back to documents tab
    await tabs[0]?.trigger('click')
    await flushPromises()

    expect(wrapper.findAllComponents(DocumentCard).length).toBeGreaterThanOrEqual(6)
  })

  it('creates a new document via DocumentForm modal and supports batch selection in tags DataTable', async () => {
    const router = await createTestRouter()
    const { toasts } = useToasts()

    wrapper = mount(RepertoryView, {
      global: {
        plugins: [router],
      },
    })

    const initialCount = wrapper.findAllComponents(DocumentCard).length

    // Open "novo documento" modal
    const newDocBtn = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === 'novo documento')
    expect(newDocBtn).toBeTruthy()
    await newDocBtn?.trigger('click')
    await flushPromises()

    const docForm = wrapper.findComponent(DocumentForm)
    expect(docForm.exists()).toBe(true)

    await docForm.find('input[type="text"]').setValue('Política de Segurança Prismon')
    await docForm.find('textarea').setValue('Normas de retenção e proteção de dados no workspace.')
    await docForm.find('form').trigger('submit')
    await flushPromises()

    const updatedCards = wrapper.findAllComponents(DocumentCard)
    expect(updatedCards).toHaveLength(initialCount + 1)
    expect(updatedCards[0]?.props('title')).toBe('Política de Segurança Prismon')
    expect(toasts.value.some((item) => item.type === 'success')).toBe(true)

    // Switch to tags tab and test batch selection + deletion confirmation
    const tagsTab = wrapper.findAllComponents(TabItem).find((tab) => tab.props('label') === 'tags')
    await tagsTab?.trigger('click')
    await flushPromises()

    const tagsTable = wrapper.findComponent(DataTable)
    const rows = tagsTable.findAll('tbody .data-table__row')
    expect(rows.length).toBeGreaterThanOrEqual(2)

    await rows[0]?.trigger('click')
    await rows[1]?.trigger('click')
    await flushPromises()

    expect(tagsTable.props('selectedRowKeys')).toHaveLength(2)
    const batchBar = tagsTable.find('.batch-action-bar')
    expect(batchBar.exists()).toBe(true)
    expect(batchBar.text()).toContain('2 itens selecionados')

    const deleteBatchBtn = batchBar.findAll('button').find((btn) => btn.text().includes('remover'))
    expect(deleteBatchBtn).toBeTruthy()
    await deleteBatchBtn?.trigger('click')
    await flushPromises()

    const confirmDialog = wrapper.findComponent(ConfirmDialog)
    expect(confirmDialog.props('open')).toBe(true)

    const confirmBtn = confirmDialog
      .findAll('button')
      .find((btn) => btn.text().includes('Remover tags'))
    expect(confirmBtn).toBeTruthy()
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(false)
    expect(tagsTable.props('selectedRowKeys')).toHaveLength(0)
  })
})
