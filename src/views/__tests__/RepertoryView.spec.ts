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
  DocumentForm,
  Modal,
  RepertoryItemDetails,
  Sheet,
  TabItem,
  TagForm,
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
  it('filters documents, opens Sheet with RepertoryItemDetails document preview, and supports linking existing or creating new tags', async () => {
    const router = await createTestRouter()
    const { toasts } = useToasts()

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

    // Click first visible DocumentCard to open Sheet with RepertoryItemDetails
    await visibleCards[0]?.trigger('click')
    await flushPromises()

    const sheet = wrapper.findComponent(Sheet)
    expect(sheet.props('open')).toBe(true)
    expect(sheet.props('title')).toBe('detalhes do documento')

    const details = sheet.findComponent(RepertoryItemDetails)
    expect(details.exists()).toBe(true)
    expect(details.props('title')).toBe(visibleCards[0]?.props('title'))
    expect(details.props('editableTags')).toBe(true)

    // Preview must sit on the left stage of Sheet (#preview), not inside the right details panel
    const stage = sheet.find('.sheet__stage')
    expect(stage.exists()).toBe(true)
    expect(stage.find('.repertory-view__preview-excerpt').text().length).toBeGreaterThan(10)
    expect(details.find('.repertory-item-details__preview').exists()).toBe(false)

    // Footer download button must NOT exist; only header IconButton download exists
    expect(sheet.find('.repertory-view__sheet-actions').exists()).toBe(false)
    expect(
      sheet.find(`button[aria-label="Baixar ${visibleCards[0]?.props('title')}"]`).exists(),
    ).toBe(true)

    // Open "adicionar tag" modal from RepertoryItemDetails
    const addTagBtn = details.find('button[aria-label="Adicionar tag"]')
    expect(addTagBtn.exists()).toBe(true)
    await addTagBtn.trigger('click')
    await flushPromises()

    const addTagModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'adicionar tag')
    expect(addTagModal?.props('open')).toBe(true)
    expect(addTagModal?.props('size')).toBe('lg')

    // Tab 1: link existing tag
    const existingTagSelect = addTagModal?.find('select')
    expect(existingTagSelect?.exists()).toBe(true)
    await existingTagSelect?.setValue('governança')
    await addTagModal?.find('form').trigger('submit')
    await flushPromises()

    expect(addTagModal?.props('open')).toBe(false)
    expect(details.props('tags')).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'governança' })]),
    )
    expect(toasts.value.some((item) => item.title?.includes('governança'))).toBe(true)

    // Re-open "adicionar tag" modal and switch to "criar nova tag" tab
    await addTagBtn.trigger('click')
    await flushPromises()

    const createTab = addTagModal
      ?.findAllComponents(TabItem)
      .find((tab) => tab.props('label') === 'criar nova tag')
    expect(createTab?.exists()).toBe(true)
    await createTab?.trigger('click')
    await flushPromises()

    const tagForm = addTagModal?.findComponent(TagForm)
    expect(tagForm?.exists()).toBe(true)
    await tagForm?.find('input[type="text"]').setValue('compliance-ia')
    await tagForm?.find('textarea').setValue('Tag criada a partir do detalhe do documento.')
    await tagForm?.find('form').trigger('submit')
    await flushPromises()

    expect(addTagModal?.props('open')).toBe(false)
    expect(details.props('tags')).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'compliance-ia' })]),
    )
  })

  it('renders assets tab as DocumentCard grid, filters by format/tag, creates asset via lg modal, and opens image preview Sheet', async () => {
    const router = await createTestRouter()
    const { toasts } = useToasts()

    wrapper = mount(RepertoryView, {
      global: {
        plugins: [router],
      },
    })

    const tabs = wrapper.findAllComponents(TabItem)
    expect(tabs.map((tab) => tab.props('label'))).toEqual(['documents', 'assets', 'tags'])

    // Switch to assets tab
    await tabs[1]?.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(DataTable).exists()).toBe(false)
    expect(wrapper.find('input[aria-label="Buscar asset por título"]').exists()).toBe(true)

    const initialAssets = wrapper.findAllComponents(DocumentCard)
    expect(initialAssets.length).toBeGreaterThanOrEqual(6)
    expect(initialAssets.every((card) => Boolean(card.props('thumbnailUrl')))).toBe(true)

    // Filter assets by format
    const formatSelect = wrapper.find('select[aria-label="Filtrar asset por formato"]')
    await formatSelect.setValue('SVG')
    await flushPromises()

    const svgAssets = wrapper.findAllComponents(DocumentCard)
    expect(svgAssets.length).toBe(2)
    expect(svgAssets.every((card) => card.props('format') === 'SVG')).toBe(true)

    // Filter assets by tag as well
    const assetTagSelect = wrapper.find('select[aria-label="Filtrar asset por tag"]')
    await assetTagSelect.setValue('acessibilidade')
    await flushPromises()

    const filteredAssets = wrapper.findAllComponents(DocumentCard)
    expect(filteredAssets).toHaveLength(1)
    expect(filteredAssets[0]?.props('title')).toBe('Paleta Semântica e Contrastes WCAG')

    // Open Sheet on asset click -> RepertoryItemDetails with previewType="image" and <img>
    await filteredAssets[0]?.trigger('click')
    await flushPromises()

    const sheet = wrapper.findComponent(Sheet)
    expect(sheet.props('open')).toBe(true)
    expect(sheet.props('title')).toBe('detalhes do asset')
    expect(sheet.find('.repertory-view__sheet-actions').exists()).toBe(false)

    const details = sheet.findComponent(RepertoryItemDetails)
    expect(details.exists()).toBe(true)
    const stage = sheet.find('.sheet__stage')
    expect(stage.exists()).toBe(true)
    const previewImg = stage.find('img.repertory-view__preview-image')
    expect(previewImg.exists()).toBe(true)
    expect(previewImg.attributes('src')).toBeTruthy()

    // Close Sheet via Escape or model update
    await sheet.find('button[aria-label="Fechar painel"]').trigger('click')
    await flushPromises()

    // Clear asset filters
    const clearButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === 'limpar filtros')
    await clearButton?.trigger('click')
    await flushPromises()
    expect(wrapper.findAllComponents(DocumentCard).length).toBe(initialAssets.length)

    // Open "novo asset" modal (size="lg") and submit DocumentForm
    const newAssetBtn = wrapper.findAll('button').find((btn) => btn.text().includes('novo asset'))
    expect(newAssetBtn).toBeTruthy()
    await newAssetBtn?.trigger('click')
    await flushPromises()

    const newAssetModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'novo asset')
    expect(newAssetModal?.props('open')).toBe(true)
    expect(newAssetModal?.props('size')).toBe('lg')

    const assetForm = newAssetModal?.findComponent(DocumentForm)
    expect(assetForm?.exists()).toBe(true)
    expect(assetForm?.props('fileLabel')).toBe('Suba seu asset (PNG, JPG, WEBP, SVG)')

    await assetForm?.find('input[type="text"]').setValue('Banner Fluxo Agêntico')
    await assetForm
      ?.find('textarea')
      .setValue('Ilustração institucional para documentação de agentes.')
    await assetForm?.find('form').trigger('submit')
    await flushPromises()

    const updatedAssets = wrapper.findAllComponents(DocumentCard)
    expect(updatedAssets).toHaveLength(initialAssets.length + 1)
    expect(updatedAssets[0]?.props('title')).toBe('Banner Fluxo Agêntico')
    expect(toasts.value.some((item) => item.type === 'success')).toBe(true)
  })

  it('creates a new document in lg modal and manages tags tab with lg modal and batch ConfirmDialog deletion', async () => {
    const router = await createTestRouter()
    const { toasts } = useToasts()

    wrapper = mount(RepertoryView, {
      global: {
        plugins: [router],
      },
    })

    const initialCount = wrapper.findAllComponents(DocumentCard).length

    // Open "novo documento" modal (size="lg")
    const newDocBtn = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === 'novo documento')
    expect(newDocBtn).toBeTruthy()
    await newDocBtn?.trigger('click')
    await flushPromises()

    const newDocModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'novo documento')
    expect(newDocModal?.props('open')).toBe(true)
    expect(newDocModal?.props('size')).toBe('lg')

    const docForm = newDocModal?.findComponent(DocumentForm)
    expect(docForm?.exists()).toBe(true)

    await docForm?.find('input[type="text"]').setValue('Política de Segurança Prismon')
    await docForm?.find('textarea').setValue('Normas de retenção e proteção de dados no workspace.')
    await docForm?.find('form').trigger('submit')
    await flushPromises()

    const updatedCards = wrapper.findAllComponents(DocumentCard)
    expect(updatedCards).toHaveLength(initialCount + 1)
    expect(updatedCards[0]?.props('title')).toBe('Política de Segurança Prismon')
    expect(toasts.value.some((item) => item.type === 'success')).toBe(true)

    // Switch to tags tab
    const tagsTab = wrapper.findAllComponents(TabItem).find((tab) => tab.props('label') === 'tags')
    await tagsTab?.trigger('click')
    await flushPromises()

    const tagsTable = wrapper.findComponent(DataTable)
    expect(tagsTable.exists()).toBe(true)
    expect(tagsTable.props('title')).toBe('tags cadastradas')
    expect(tagsTable.findAllComponents(Badge).length).toBeGreaterThan(0)

    // Create a new tag via "nova tag" modal (size="lg")
    const newTagBtn = tagsTable.findAll('button').find((btn) => btn.text().trim() === 'nova tag')
    expect(newTagBtn).toBeTruthy()
    await newTagBtn?.trigger('click')
    await flushPromises()

    const newTagModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'nova tag')
    expect(newTagModal?.props('open')).toBe(true)
    expect(newTagModal?.props('size')).toBe('lg')

    const tagForm = newTagModal?.findComponent(TagForm)
    await tagForm?.find('input[type="text"]').setValue('lgpd')
    await tagForm?.find('textarea').setValue('Documentos sujeitos a conformidade de privacidade.')
    await tagForm?.find('form').trigger('submit')
    await flushPromises()

    expect(newTagModal?.props('open')).toBe(false)
    expect(tagsTable.text()).toContain('lgpd')

    // Batch selection + deletion confirmation
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
