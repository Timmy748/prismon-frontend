<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApiErrorMessage } from '@/api/errors'
import type { DocumentStatusApi } from '@/api/types/repertory'
import DocumentCard from '@/components/repertory/DocumentCard.vue'
import { AppShell } from '@/components/shell'
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DocumentForm,
  Icon,
  IconButton,
  Modal,
  RepertoryItemDetails,
  SearchInput,
  Select,
  Sheet,
  Tabs,
  Tag,
  TagForm,
  TextArea,
  TextInput,
  toast,
  type BatchAction,
  type DataTableColumn,
  type DocumentFormPayload,
  type RepertoryItemHistoryEntry,
  type RepertoryItemTag,
  type SelectOption,
  type TabOption,
  type TagFormPayload,
} from '@/components/ui'
import { useRepertoryApi } from '@/composables/api'
import { useRepertoryState, type CachedRepertoryPreview } from '@/stores/repertoryState'
import { useWorkspaceState } from '@/stores/workspaceState'
import type {
  RepertoryAsset,
  RepertoryDocument,
  RepertoryHistoryEntry,
  RepertoryItemTagRef,
  RepertoryTag,
} from '@/types/repertory'

type RepertoryTab = 'documents' | 'assets' | 'tags'
type RepertoryItemKind = 'document' | 'asset'
type ItemTagModalTab = 'existing' | 'create'
type ConfirmTarget = 'tags' | 'document' | 'asset' | null

interface PreviewState {
  kind: 'idle' | 'loading' | CachedRepertoryPreview['kind']
  url?: string
  text?: string
  note?: string
  isObjectUrl?: boolean
}

const PAGE_SIZE = 5
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/
const IMAGE_FORMATS = new Set(['PNG', 'JPG', 'JPEG', 'WEBP', 'SVG', 'GIF', 'AVIF', 'BMP', 'ICO'])
const TEXT_FORMATS = new Set(['MD', 'MARKDOWN', 'TXT', 'CSV', 'JSON', 'XML', 'YAML', 'YML'])
const MAX_TEXT_PREVIEW_CHARS = 8000

const tabItems: TabOption[] = [
  { id: 'documents', label: 'documents' },
  { id: 'assets', label: 'assets' },
  { id: 'tags', label: 'tags' },
]

const itemTagTabOptions: TabOption[] = [
  { id: 'existing', label: 'vincular tag existente' },
  { id: 'create', label: 'criar nova tag' },
]

const statusFilterOptions: SelectOption[] = [
  { label: 'todos os status', value: 'todos' },
  { label: 'Publicado', value: 'published' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Rascunho', value: 'draft' },
  { label: 'Enviando', value: 'uploading' },
  { label: 'Falha', value: 'failed' },
  { label: 'Arquivado', value: 'archived' },
]

const tagColumns: DataTableColumn[] = [
  { key: 'label', label: 'Nome' },
  { key: 'color', label: 'Cor' },
  { key: 'description', label: 'Descrição' },
]

const route = useRoute()
const router = useRouter()
const { activeProjectId } = useWorkspaceState()
const repertoryApi = useRepertoryApi()
const repertoryState = useRepertoryState()

function parsePositiveIntParam(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

const routeProjectId = computed(() => parsePositiveIntParam(route.params.projectId))
const resolvedProjectId = computed(() => routeProjectId.value ?? activeProjectId.value)

const activeTab = ref<RepertoryTab>('documents')

const emptyDocumentsSlice = {
  items: [] as RepertoryDocument[],
  loaded: false,
  nextCursor: null as string | null,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  error: null as string | null,
}

const emptyAssetsSlice = {
  items: [] as RepertoryAsset[],
  loaded: false,
  nextCursor: null as string | null,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  error: null as string | null,
}

const emptyTagsSlice = {
  items: [] as RepertoryTag[],
  loaded: false,
  isLoading: false,
  error: null as string | null,
}

const documentsState = computed(() =>
  resolvedProjectId.value
    ? repertoryState.getDocumentsState(resolvedProjectId.value)
    : emptyDocumentsSlice,
)
const assetsState = computed(() =>
  resolvedProjectId.value
    ? repertoryState.getAssetsState(resolvedProjectId.value)
    : emptyAssetsSlice,
)
const tagsState = computed(() =>
  resolvedProjectId.value ? repertoryState.getTagsState(resolvedProjectId.value) : emptyTagsSlice,
)

const documents = computed(() => documentsState.value.items)
const assets = computed(() => assetsState.value.items)
const tagsList = computed(() => tagsState.value.items)

const isLoadingData = computed(() => {
  if (!resolvedProjectId.value) return false
  if (activeTab.value === 'documents') {
    return !documentsState.value.loaded && documentsState.value.isLoading
  }
  if (activeTab.value === 'assets') {
    return !assetsState.value.loaded && assetsState.value.isLoading
  }
  return !tagsState.value.loaded && tagsState.value.isLoading
})

const loadError = computed(() => {
  if (!resolvedProjectId.value) return null
  if (activeTab.value === 'documents') {
    return !documentsState.value.loaded ? documentsState.value.error : null
  }
  if (activeTab.value === 'assets') {
    return !assetsState.value.loaded ? assetsState.value.error : null
  }
  return !tagsState.value.loaded ? tagsState.value.error : null
})

// Documents tab filters & modal
const docSearch = ref('')
const selectedTagFilter = ref('')
const selectedStatusFilter = ref<DocumentStatusApi | 'todos' | ''>('')
const activeTagFilters = ref<string[]>([])

const isNewDocModalOpen = ref(false)
const newDocTitleError = ref('')
const newDocFileError = ref('')
const isCreatingDoc = ref(false)

// Assets tab filters & modal
const assetSearch = ref('')
const selectedAssetTagFilter = ref('')
const selectedAssetFormatFilter = ref('')
const activeAssetTagFilters = ref<string[]>([])

const isNewAssetModalOpen = ref(false)
const newAssetTitleError = ref('')
const newAssetFileError = ref('')
const isCreatingAsset = ref(false)

// Shared Details Sheet state
const isDetailsSheetOpen = ref(false)
const activeItemId = ref<number | null>(null)
const activeItemKind = ref<RepertoryItemKind>('document')
const activeItemHistory = ref<RepertoryHistoryEntry[]>([])
const isLoadingHistory = ref(false)
const previewState = ref<PreviewState>({ kind: 'idle' })

// Edit Metadata Modal state (document or asset)
const isEditItemModalOpen = ref(false)
const editItemTitle = ref('')
const editItemDescription = ref('')
const editItemType = ref('')
const editItemTitleError = ref('')
const isUpdatingItem = ref(false)

// Item Tag Modal state
const isItemTagModalOpen = ref(false)
const itemTagModalTab = ref<ItemTagModalTab>('existing')
const selectedExistingTagId = ref('')
const existingTagSelectError = ref('')
const itemTagNameError = ref('')
const itemTagColorError = ref('')
const isSubmittingItemTag = ref(false)

// Tags tab state
const tagPage = ref(1)
const selectedTagKeys = ref<Array<string | number>>([])
const isNewTagModalOpen = ref(false)
const newTagNameError = ref('')
const newTagColorError = ref('')
const isCreatingTag = ref(false)

const isEditTagModalOpen = ref(false)
const editingTag = ref<RepertoryTag | null>(null)
const editTagNameError = ref('')
const editTagColorError = ref('')
const isUpdatingTag = ref(false)

// Shared confirm dialog state
const isDeleting = ref(false)
const confirmState = ref<{
  open: boolean
  target: ConfirmTarget
  title: string
  description: string
  confirmLabel: string
}>({
  open: false,
  target: null,
  title: '',
  description: '',
  confirmLabel: 'Remover',
})

let projectLoadSeq = 0
let sheetLoadSeq = 0
let detailRouteSeq = 0
let isUnmounted = false

function createObjectUrl(blob: Blob): string | null {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null
  }
  try {
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

async function readBlobAsText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') {
    return blob.text()
  }
  if (typeof Response !== 'undefined') {
    return new Response(blob).text()
  }
  return ''
}

function getFileBasename(filePath: string | null | undefined): string {
  if (!filePath) return 'Arquivo sem nome'
  return filePath.split('/').pop()?.trim() || filePath
}

function isImageAsset(asset: RepertoryAsset): boolean {
  if (asset.type.toLowerCase() === 'image') return true
  if (asset.contentType?.toLowerCase().startsWith('image/')) return true
  return IMAGE_FORMATS.has(asset.format.toUpperCase())
}

function toUiTags(tags: RepertoryItemTagRef[]): RepertoryItemTag[] {
  return tags.map((tag) => ({
    id: String(tag.id),
    label: tag.label,
    color: tag.color,
  }))
}

function getTagColorByLabel(label: string): string | undefined {
  const normalized = label.trim().toLowerCase()
  const projectTag = tagsList.value.find((tag) => tag.label.toLowerCase() === normalized)
  if (projectTag?.color) {
    return projectTag.color
  }
  for (const doc of documents.value) {
    const match = doc.tags.find((tag) => tag.label.toLowerCase() === normalized)
    if (match?.color) {
      return match.color
    }
  }
  for (const asset of assets.value) {
    const match = asset.tags.find((tag) => tag.label.toLowerCase() === normalized)
    if (match?.color) {
      return match.color
    }
  }
  return undefined
}

function toUiHistory(entries: RepertoryHistoryEntry[]): RepertoryItemHistoryEntry[] {
  return entries.map((entry) => ({
    id: String(entry.id),
    title: entry.title,
    summary: entry.summary,
    author: entry.author,
    date: entry.date,
  }))
}

function collectUniqueTagOptions(items: Array<{ tags: RepertoryItemTagRef[] }>): SelectOption[] {
  const uniqueLabels = new Set<string>()
  for (const tag of tagsList.value) {
    uniqueLabels.add(tag.label)
  }
  for (const item of items) {
    for (const tag of item.tags) {
      uniqueLabels.add(tag.label)
    }
  }
  return Array.from(uniqueLabels)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((label) => ({ label, value: label }))
}

const tagFilterOptions = computed<SelectOption[]>(() => collectUniqueTagOptions(documents.value))

const assetTagFilterOptions = computed<SelectOption[]>(() => collectUniqueTagOptions(assets.value))

const assetFormatFilterOptions = computed<SelectOption[]>(() => {
  const uniqueValues = new Set<string>()
  for (const asset of assets.value) {
    if (asset.format && asset.format !== 'ARQUIVO') {
      uniqueValues.add(asset.format)
    }
    if (asset.type && asset.type !== 'other') {
      uniqueValues.add(asset.type)
    }
  }
  const sorted = Array.from(uniqueValues).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return [
    { label: 'todos os formatos', value: 'todos' },
    ...sorted.map((item) => ({ label: item, value: item })),
  ]
})

const hasActiveDocFilters = computed(
  () =>
    docSearch.value.trim().length > 0 ||
    activeTagFilters.value.length > 0 ||
    (selectedStatusFilter.value !== '' && selectedStatusFilter.value !== 'todos'),
)

const hasActiveAssetFilters = computed(
  () =>
    assetSearch.value.trim().length > 0 ||
    activeAssetTagFilters.value.length > 0 ||
    (selectedAssetFormatFilter.value !== '' && selectedAssetFormatFilter.value !== 'todos'),
)

const filteredDocuments = computed(() => {
  const query = docSearch.value.trim().toLowerCase()
  const status = selectedStatusFilter.value

  return documents.value.filter((doc) => {
    if (query.length > 0) {
      const matchesTitle = doc.title.toLowerCase().includes(query)
      const matchesDescription = doc.description.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription) {
        return false
      }
    }

    if (status && status !== 'todos' && doc.status !== status) {
      return false
    }

    if (activeTagFilters.value.length > 0) {
      const docTagLabels = new Set(doc.tags.map((t) => t.label.toLowerCase()))
      const matchesAllTags = activeTagFilters.value.every((filterTag) =>
        docTagLabels.has(filterTag.toLowerCase()),
      )
      if (!matchesAllTags) {
        return false
      }
    }

    return true
  })
})

const filteredAssets = computed(() => {
  const query = assetSearch.value.trim().toLowerCase()
  const formatOrType = selectedAssetFormatFilter.value

  return assets.value.filter((asset) => {
    if (query.length > 0) {
      const matchesTitle = asset.title.toLowerCase().includes(query)
      const matchesDescription = asset.description.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription) {
        return false
      }
    }

    if (
      formatOrType &&
      formatOrType !== 'todos' &&
      asset.format !== formatOrType &&
      asset.type !== formatOrType
    ) {
      return false
    }

    if (activeAssetTagFilters.value.length > 0) {
      const assetTagLabels = new Set(asset.tags.map((t) => t.label.toLowerCase()))
      const matchesAllTags = activeAssetTagFilters.value.every((filterTag) =>
        assetTagLabels.has(filterTag.toLowerCase()),
      )
      if (!matchesAllTags) {
        return false
      }
    }

    return true
  })
})

const activeDocument = computed(() =>
  activeItemKind.value === 'document'
    ? (documents.value.find((doc) => doc.id === activeItemId.value) ?? null)
    : null,
)

const activeAsset = computed(() =>
  activeItemKind.value === 'asset'
    ? (assets.value.find((asset) => asset.id === activeItemId.value) ?? null)
    : null,
)

const activeItem = computed(() => activeAsset.value ?? activeDocument.value)

const availableTagOptionsForActiveItem = computed<SelectOption[]>(() => {
  const item = activeItem.value
  const linkedIds = new Set((item?.tags ?? []).map((t) => t.id))

  return tagsList.value
    .filter((tag) => !linkedIds.has(tag.id))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
    .map((tag) => ({ label: tag.label, value: String(tag.id) }))
})

const tagBatchActions = computed<BatchAction[]>(() => {
  if (selectedTagKeys.value.length === 1) {
    return [
      { id: 'edit', label: 'editar', icon: 'edit' },
      { id: 'delete', label: 'remover', icon: 'delete' },
    ]
  }
  return [{ id: 'delete', label: 'remover', icon: 'delete' }]
})

const totalTagPages = computed(() => Math.max(1, Math.ceil(tagsList.value.length / PAGE_SIZE)))

const paginatedTagRows = computed(() => {
  const start = (tagPage.value - 1) * PAGE_SIZE
  return tagsList.value.slice(start, start + PAGE_SIZE) as unknown as Record<string, unknown>[]
})

function getTabFromRouteName(routeName: unknown): RepertoryTab {
  if (routeName === 'repertory-assets' || routeName === 'repertory-asset-detail') {
    return 'assets'
  }
  if (routeName === 'repertory-tags') {
    return 'tags'
  }
  return 'documents'
}

function getTargetRouteNameForTab(tab: RepertoryTab): string {
  if (tab === 'assets') return 'repertory-assets'
  if (tab === 'tags') return 'repertory-tags'
  return 'repertory-documents'
}

function isRouteAlreadyOnTab(tab: RepertoryTab): boolean {
  const currentName = route.name
  const hasItemId = parsePositiveIntParam(route.params.itemId) !== null
  if (tab === 'documents') {
    return (
      currentName === 'repertory-documents' ||
      (currentName === 'repertory-document-detail' && hasItemId)
    )
  }
  if (tab === 'assets') {
    return (
      currentName === 'repertory-assets' || (currentName === 'repertory-asset-detail' && hasItemId)
    )
  }
  return currentName === 'repertory-tags'
}

watch(totalTagPages, (maxPage) => {
  if (tagPage.value > maxPage) {
    tagPage.value = maxPage
  }
})

watch(
  () => route.name,
  (routeName) => {
    if (
      routeName === 'repertory-documents' ||
      routeName === 'repertory-document-detail' ||
      routeName === 'repertory-assets' ||
      routeName === 'repertory-asset-detail' ||
      routeName === 'repertory-tags' ||
      routeName === 'repertory' ||
      routeName === 'legacy-repertory'
    ) {
      activeTab.value = getTabFromRouteName(routeName)
    }
  },
  { immediate: true },
)

watch(activeTab, (tab) => {
  const projectId = resolvedProjectId.value
  const targetName = getTargetRouteNameForTab(tab)
  if (projectId && router.hasRoute(targetName) && !isRouteAlreadyOnTab(tab)) {
    void router.push({
      name: targetName,
      params: { projectId: String(projectId) },
    })
  }
})

watch(isDetailsSheetOpen, (isOpen) => {
  if (!isOpen) {
    sheetLoadSeq += 1
    previewState.value = { kind: 'idle' }
    activeItemHistory.value = []
    isLoadingHistory.value = false

    const projectId = resolvedProjectId.value
    if (
      projectId &&
      (route.name === 'repertory-document-detail' || route.name === 'repertory-asset-detail')
    ) {
      const targetName =
        route.name === 'repertory-asset-detail' ? 'repertory-assets' : 'repertory-documents'
      if (router.hasRoute(targetName)) {
        void router.push({
          name: targetName,
          params: { projectId: String(projectId) },
        })
      }
    }
  }
})

onBeforeUnmount(() => {
  isUnmounted = true
  sheetLoadSeq += 1
  detailRouteSeq += 1
})

async function loadActiveTabRepertory(
  projectId: number | null,
  tab: RepertoryTab,
  force = false,
): Promise<void> {
  if (!projectId) {
    return
  }

  const seq = ++projectLoadSeq
  try {
    if (tab === 'documents') {
      await Promise.all([
        repertoryState.ensureDocumentsLoaded(projectId, force),
        repertoryState.ensureTagsLoaded(projectId, force),
      ])
    } else if (tab === 'assets') {
      await Promise.all([
        repertoryState.ensureAssetsLoaded(projectId, force),
        repertoryState.ensureTagsLoaded(projectId, force),
      ])
    } else {
      await repertoryState.ensureTagsLoaded(projectId, force)
    }
  } catch (error) {
    if (seq !== projectLoadSeq) {
      return
    }
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o repertório do projeto.'))
  }
}

watch(
  [resolvedProjectId, activeTab],
  ([projectId, tab], previous) => {
    const prevProjectId = previous?.[0]
    if (projectId !== prevProjectId) {
      sheetLoadSeq += 1
      detailRouteSeq += 1
      selectedTagKeys.value = []
      tagPage.value = 1

      if (
        route.name !== 'repertory-document-detail' &&
        route.name !== 'repertory-asset-detail'
      ) {
        isDetailsSheetOpen.value = false
        activeItemId.value = null
        activeItemHistory.value = []
        previewState.value = { kind: 'idle' }
      }
    }

    void loadActiveTabRepertory(projectId, tab)
  },
  { immediate: true },
)

watch(
  [() => route.name, () => route.params.itemId, resolvedProjectId],
  async ([routeName, rawItemId, projectId]) => {
    if (routeName !== 'repertory-document-detail' && routeName !== 'repertory-asset-detail') {
      detailRouteSeq += 1
      if (isDetailsSheetOpen.value && router.hasRoute('repertory-documents')) {
        isDetailsSheetOpen.value = false
        activeItemId.value = null
      }
      return
    }

    if (!projectId) {
      return
    }

    const kind: RepertoryItemKind =
      routeName === 'repertory-asset-detail' ? 'asset' : 'document'
    const fallbackRouteName = kind === 'asset' ? 'repertory-assets' : 'repertory-documents'
    const itemId = parsePositiveIntParam(rawItemId)

    if (itemId === null) {
      toast.error(kind === 'asset' ? 'Asset não encontrado.' : 'Documento não encontrado.')
      if (router.hasRoute(fallbackRouteName)) {
        void router.replace({
          name: fallbackRouteName,
          params: { projectId: String(projectId) },
        })
      }
      return
    }

    if (
      isDetailsSheetOpen.value &&
      activeItemKind.value === kind &&
      activeItemId.value === itemId
    ) {
      return
    }

    const seq = ++detailRouteSeq
    try {
      const item =
        kind === 'asset'
          ? await repertoryState.ensureAssetById(projectId, itemId)
          : await repertoryState.ensureDocumentById(projectId, itemId)

      if (
        isUnmounted ||
        seq !== detailRouteSeq ||
        resolvedProjectId.value !== projectId ||
        route.name !== routeName ||
        parsePositiveIntParam(route.params.itemId) !== itemId
      ) {
        return
      }

      if (!item) {
        toast.error(kind === 'asset' ? 'Asset não encontrado.' : 'Documento não encontrado.')
        if (router.hasRoute(fallbackRouteName)) {
          void router.replace({
            name: fallbackRouteName,
            params: { projectId: String(projectId) },
          })
        }
        return
      }

      await openItemDetails(kind, item.id)
    } catch (error) {
      if (isUnmounted || seq !== detailRouteSeq) {
        return
      }
      toast.error(
        getApiErrorMessage(
          error,
          kind === 'asset'
            ? 'Não foi possível carregar o asset.'
            : 'Não foi possível carregar o documento.',
        ),
      )
    }
  },
  { immediate: true },
)

async function handleLoadMoreDocuments(): Promise<void> {
  const projectId = resolvedProjectId.value
  if (!projectId) return
  try {
    await repertoryState.loadMoreDocuments(projectId)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar mais documentos.'))
  }
}

async function handleLoadMoreAssets(): Promise<void> {
  const projectId = resolvedProjectId.value
  if (!projectId) return
  try {
    await repertoryState.loadMoreAssets(projectId)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar mais assets.'))
  }
}

function addTagFilter(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return
  }
  if (!activeTagFilters.value.includes(trimmed)) {
    activeTagFilters.value = [...activeTagFilters.value, trimmed]
  }
  selectedTagFilter.value = ''
}

function removeTagFilter(tagLabel: string) {
  activeTagFilters.value = activeTagFilters.value.filter((item) => item !== tagLabel)
}

function clearDocFilters() {
  docSearch.value = ''
  selectedTagFilter.value = ''
  selectedStatusFilter.value = ''
  activeTagFilters.value = []
}

function addAssetTagFilter(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return
  }
  if (!activeAssetTagFilters.value.includes(trimmed)) {
    activeAssetTagFilters.value = [...activeAssetTagFilters.value, trimmed]
  }
  selectedAssetTagFilter.value = ''
}

function removeAssetTagFilter(tagLabel: string) {
  activeAssetTagFilters.value = activeAssetTagFilters.value.filter((item) => item !== tagLabel)
}

function clearAssetFilters() {
  assetSearch.value = ''
  selectedAssetTagFilter.value = ''
  selectedAssetFormatFilter.value = ''
  activeAssetTagFilters.value = []
}

async function loadActiveItemHistory(
  projectId: number,
  kind: RepertoryItemKind,
  itemId: number,
  seq?: number,
  force = false,
): Promise<void> {
  if (!force) {
    const cached = repertoryState.getCachedHistory(projectId, kind, itemId)
    if (cached) {
      activeItemHistory.value = cached
      isLoadingHistory.value = false
      return
    }
  }

  activeItemHistory.value = []
  isLoadingHistory.value = true
  try {
    const historyPage =
      kind === 'asset'
        ? await repertoryApi.listAssetHistory(projectId, itemId)
        : await repertoryApi.listDocumentHistory(projectId, itemId)

    if (seq !== undefined && (seq !== sheetLoadSeq || !isDetailsSheetOpen.value)) {
      return
    }
    activeItemHistory.value = repertoryState.setCachedHistory(
      projectId,
      kind,
      itemId,
      historyPage.items,
    )
  } catch (error) {
    if (seq !== undefined && (seq !== sheetLoadSeq || !isDetailsSheetOpen.value)) {
      return
    }
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o histórico do item.'))
  } finally {
    if (seq === undefined || seq === sheetLoadSeq) {
      isLoadingHistory.value = false
    }
  }
}

async function loadActiveItemPreview(
  projectId: number,
  kind: RepertoryItemKind,
  item: RepertoryDocument | RepertoryAsset,
  seq: number,
): Promise<void> {
  const cached = repertoryState.getCachedPreview(projectId, kind, item.id)
  if (cached) {
    previewState.value = cached
    return
  }

  previewState.value = { kind: 'loading' }

  try {
    const blob =
      kind === 'asset'
        ? await repertoryApi.fetchAssetFileBlob(projectId, item.id)
        : await repertoryApi.fetchDocumentFileBlob(projectId, item.id)

    if (seq !== sheetLoadSeq || !isDetailsSheetOpen.value) {
      return
    }

    if (!blob || blob.size === 0) {
      if (kind === 'asset' && isImageAsset(item as RepertoryAsset)) {
        previewState.value = repertoryState.setCachedPreview(projectId, kind, item.id, {
          kind: 'image',
          url: (item as RepertoryAsset).fileUrl,
        })
        return
      }
      previewState.value = repertoryState.setCachedPreview(projectId, kind, item.id, {
        kind: 'fallback',
        note: 'Arquivo vazio ou sem conteúdo disponível para pré-visualização.',
      })
      return
    }

    const mime = (blob.type || item.contentType || '').split(';')[0]?.trim().toLowerCase() ?? ''
    const formatUpper = item.format.toUpperCase()

    if (mime.startsWith('image/') || IMAGE_FORMATS.has(formatUpper)) {
      const objectUrl = createObjectUrl(blob)
      if (objectUrl) {
        previewState.value = repertoryState.setCachedPreview(projectId, kind, item.id, {
          kind: 'image',
          url: objectUrl,
          isObjectUrl: true,
        })
        return
      }
      if (kind === 'asset') {
        previewState.value = repertoryState.setCachedPreview(projectId, kind, item.id, {
          kind: 'image',
          url: (item as RepertoryAsset).fileUrl,
        })
        return
      }
    }

    if (mime === 'application/pdf' || formatUpper === 'PDF') {
      const objectUrl = createObjectUrl(blob)
      if (objectUrl) {
        previewState.value = repertoryState.setCachedPreview(projectId, kind, item.id, {
          kind: 'pdf',
          url: objectUrl,
          isObjectUrl: true,
        })
        return
      }
    }

    if (
      mime.startsWith('text/') ||
      mime.includes('json') ||
      mime.includes('markdown') ||
      mime.includes('xml') ||
      TEXT_FORMATS.has(formatUpper)
    ) {
      const rawText = await readBlobAsText(blob)
      if (seq !== sheetLoadSeq || !isDetailsSheetOpen.value) {
        return
      }
      const trimmed = rawText.trim()
      if (trimmed.length > 0) {
        const snippet =
          trimmed.length > MAX_TEXT_PREVIEW_CHARS
            ? `${trimmed.slice(0, MAX_TEXT_PREVIEW_CHARS)}\n...`
            : trimmed
        previewState.value = repertoryState.setCachedPreview(projectId, kind, item.id, {
          kind: 'text',
          text: snippet,
        })
        return
      }
    }

    previewState.value = repertoryState.setCachedPreview(projectId, kind, item.id, {
      kind: 'fallback',
      note: 'Pré-visualização em navegador indisponível para este formato binário. Use o botão de download para abrir o arquivo.',
    })
  } catch {
    if (seq !== sheetLoadSeq || !isDetailsSheetOpen.value) {
      return
    }
    if (kind === 'asset' && isImageAsset(item as RepertoryAsset)) {
      previewState.value = { kind: 'image', url: (item as RepertoryAsset).fileUrl }
      return
    }
    previewState.value = {
      kind: 'fallback',
      note: 'Não foi possível carregar a pré-visualização do arquivo.',
    }
  }
}

async function openItemDetails(kind: RepertoryItemKind, itemId: number): Promise<void> {
  const projectId = resolvedProjectId.value
  const item =
    kind === 'asset'
      ? assets.value.find((asset) => asset.id === itemId)
      : documents.value.find((doc) => doc.id === itemId)

  if (!projectId || !item) {
    return
  }

  activeItemKind.value = kind
  activeItemId.value = itemId
  isDetailsSheetOpen.value = true

  const seq = ++sheetLoadSeq
  await Promise.all([
    loadActiveItemHistory(projectId, kind, itemId, seq),
    loadActiveItemPreview(projectId, kind, item, seq),
  ])
}

function openDocumentDetails(docId: number) {
  const projectId = resolvedProjectId.value
  if (
    projectId &&
    router.hasRoute('repertory-document-detail') &&
    !(route.name === 'repertory-document-detail' && parsePositiveIntParam(route.params.itemId) === docId)
  ) {
    void router.push({
      name: 'repertory-document-detail',
      params: { projectId: String(projectId), itemId: String(docId) },
    })
    return
  }
  void openItemDetails('document', docId)
}

function openAssetDetails(assetId: number) {
  const projectId = resolvedProjectId.value
  if (
    projectId &&
    router.hasRoute('repertory-asset-detail') &&
    !(route.name === 'repertory-asset-detail' && parsePositiveIntParam(route.params.itemId) === assetId)
  ) {
    void router.push({
      name: 'repertory-asset-detail',
      params: { projectId: String(projectId), itemId: String(assetId) },
    })
    return
  }
  void openItemDetails('asset', assetId)
}

async function handleDownloadDocument(docId: number) {
  const projectId = resolvedProjectId.value
  if (!projectId) return
  try {
    await repertoryApi.downloadDocumentFile(projectId, docId)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível baixar o arquivo do documento.'))
  }
}

async function handleDownloadAsset(assetId: number) {
  const projectId = resolvedProjectId.value
  if (!projectId) return
  try {
    await repertoryApi.downloadAssetFile(projectId, assetId)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível baixar o arquivo do asset.'))
  }
}

function handleDownloadActiveItem() {
  if (!activeItem.value) {
    return
  }
  if (activeItemKind.value === 'asset') {
    void handleDownloadAsset(activeItem.value.id)
    return
  }
  void handleDownloadDocument(activeItem.value.id)
}

function openNewDocModal() {
  newDocTitleError.value = ''
  newDocFileError.value = ''
  isNewDocModalOpen.value = true
}

async function handleCreateDocument(payload: DocumentFormPayload) {
  const projectId = resolvedProjectId.value
  if (!projectId) return

  const cleanTitle = payload.title.trim()
  const attachedFile = payload.files[0]

  newDocTitleError.value = cleanTitle ? '' : 'Informe um título para o documento.'
  newDocFileError.value = attachedFile ? '' : 'Selecione um arquivo para enviar.'

  if (!cleanTitle || !attachedFile) {
    return
  }

  isCreatingDoc.value = true
  try {
    const created = await repertoryApi.createDocument(projectId, {
      name: cleanTitle,
      description: payload.description.trim() || null,
      file: attachedFile,
    })
    repertoryState.prependDocument(projectId, created)
    isNewDocModalOpen.value = false
    newDocTitleError.value = ''
    newDocFileError.value = ''
    toast.success(`Documento "${created.title}" adicionado ao repertório.`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível enviar o documento.'))
  } finally {
    isCreatingDoc.value = false
  }
}

function openNewAssetModal() {
  newAssetTitleError.value = ''
  newAssetFileError.value = ''
  isNewAssetModalOpen.value = true
}

async function handleCreateAsset(payload: DocumentFormPayload) {
  const projectId = resolvedProjectId.value
  if (!projectId) return

  const cleanTitle = payload.title.trim()
  const attachedFile = payload.files[0]

  newAssetTitleError.value = cleanTitle ? '' : 'Informe um título para o asset.'
  newAssetFileError.value = attachedFile ? '' : 'Selecione um arquivo para enviar.'

  if (!cleanTitle || !attachedFile) {
    return
  }

  isCreatingAsset.value = true
  try {
    const created = await repertoryApi.createAsset(projectId, {
      name: cleanTitle,
      description: payload.description.trim() || null,
      file: attachedFile,
    })
    repertoryState.prependAsset(projectId, created)
    isNewAssetModalOpen.value = false
    newAssetTitleError.value = ''
    newAssetFileError.value = ''
    toast.success(`Asset "${created.title}" adicionado ao repertório.`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível enviar o asset.'))
  } finally {
    isCreatingAsset.value = false
  }
}

function openEditItemModal() {
  const item = activeItem.value
  if (!item) return
  editItemTitle.value = item.title
  editItemDescription.value = item.description
  editItemType.value = activeAsset.value?.type ?? ''
  editItemTitleError.value = ''
  isEditItemModalOpen.value = true
}

async function handleUpdateActiveItem() {
  const projectId = resolvedProjectId.value
  const item = activeItem.value
  if (!projectId || !item) return

  const cleanTitle = editItemTitle.value.trim()
  if (!cleanTitle) {
    editItemTitleError.value = 'Informe um título válido.'
    return
  }

  isUpdatingItem.value = true
  try {
    if (activeItemKind.value === 'asset') {
      const updated = await repertoryApi.updateAsset(projectId, item.id, {
        name: cleanTitle,
        description: editItemDescription.value.trim() || null,
        type: editItemType.value.trim() || undefined,
      })
      repertoryState.upsertAsset(projectId, updated)
      toast.success(`Asset "${updated.title}" atualizado.`)
    } else {
      const updated = await repertoryApi.updateDocument(projectId, item.id, {
        name: cleanTitle,
        description: editItemDescription.value.trim() || null,
      })
      repertoryState.upsertDocument(projectId, updated)
      toast.success(`Documento "${updated.title}" atualizado.`)
    }
    isEditItemModalOpen.value = false
    await loadActiveItemHistory(projectId, activeItemKind.value, item.id, undefined, true)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível atualizar os metadados.'))
  } finally {
    isUpdatingItem.value = false
  }
}

function requestDeleteActiveItem() {
  const item = activeItem.value
  if (!item) return

  if (activeItemKind.value === 'asset') {
    confirmState.value = {
      open: true,
      target: 'asset',
      title: 'excluir asset',
      description: `Deseja excluir "${item.title}"? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir asset',
    }
    return
  }

  confirmState.value = {
    open: true,
    target: 'document',
    title: 'excluir documento',
    description: `Deseja excluir "${item.title}"? Esta ação não pode ser desfeita.`,
    confirmLabel: 'Excluir documento',
  }
}

async function reloadItemTags(
  projectId: number,
  kind: RepertoryItemKind,
  itemId: number,
): Promise<void> {
  const tags =
    kind === 'asset'
      ? await repertoryApi.listAssetTags(projectId, itemId)
      : await repertoryApi.listDocumentTags(projectId, itemId)

  const mappedRefs: RepertoryItemTagRef[] = tags.map((tag) => ({
    id: tag.id,
    label: tag.label,
    color: tag.color,
  }))

  repertoryState.updateItemTags(projectId, kind, itemId, mappedRefs)
}

function openAddTagToItemModal() {
  itemTagNameError.value = ''
  itemTagColorError.value = ''
  existingTagSelectError.value = ''
  selectedExistingTagId.value = ''
  itemTagModalTab.value = availableTagOptionsForActiveItem.value.length > 0 ? 'existing' : 'create'
  isItemTagModalOpen.value = true
}

async function handleLinkExistingTagToItem() {
  const projectId = resolvedProjectId.value
  const item = activeItem.value
  if (!projectId || !item) return

  const tagId = Number(selectedExistingTagId.value)
  const chosenTag = tagsList.value.find((tag) => tag.id === tagId)
  if (!selectedExistingTagId.value || !Number.isFinite(tagId) || !chosenTag) {
    existingTagSelectError.value = 'Selecione uma tag cadastrada para vincular.'
    return
  }

  const kind = activeItemKind.value
  const kindLabel = kind === 'asset' ? 'asset' : 'documento'

  isSubmittingItemTag.value = true
  try {
    if (kind === 'asset') {
      await repertoryApi.attachTagToAsset(projectId, item.id, chosenTag.id)
    } else {
      await repertoryApi.attachTagToDocument(projectId, item.id, chosenTag.id)
    }

    await Promise.all([
      reloadItemTags(projectId, kind, item.id),
      loadActiveItemHistory(projectId, kind, item.id, undefined, true),
    ])

    isItemTagModalOpen.value = false
    existingTagSelectError.value = ''
    selectedExistingTagId.value = ''
    toast.success(`Tag "${chosenTag.label}" vinculada ao ${kindLabel}.`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, `Não foi possível vincular a tag ao ${kindLabel}.`))
  } finally {
    isSubmittingItemTag.value = false
  }
}

async function handleCreateAndLinkTagToItem(payload: TagFormPayload) {
  const projectId = resolvedProjectId.value
  const item = activeItem.value
  if (!projectId || !item) return

  const cleanName = payload.name.trim()
  const cleanColor = (payload.color ?? '').trim()

  itemTagNameError.value = cleanName ? '' : 'Informe o nome da tag.'
  itemTagColorError.value = HEX_COLOR_REGEX.test(cleanColor)
    ? ''
    : 'Informe uma cor hexadecimal válida (#RRGGBB).'

  if (!cleanName || !HEX_COLOR_REGEX.test(cleanColor)) {
    return
  }

  const kind = activeItemKind.value
  const kindLabel = kind === 'asset' ? 'asset' : 'documento'

  isSubmittingItemTag.value = true
  try {
    const createdTag = await repertoryApi.createTag(projectId, {
      label: cleanName,
      description: payload.description.trim(),
      color: cleanColor,
    })

    repertoryState.prependTag(projectId, createdTag)

    if (kind === 'asset') {
      await repertoryApi.attachTagToAsset(projectId, item.id, createdTag.id)
    } else {
      await repertoryApi.attachTagToDocument(projectId, item.id, createdTag.id)
    }

    await Promise.all([
      reloadItemTags(projectId, kind, item.id),
      loadActiveItemHistory(projectId, kind, item.id, undefined, true),
    ])

    isItemTagModalOpen.value = false
    itemTagNameError.value = ''
    itemTagColorError.value = ''
    toast.success(`Tag "${createdTag.label}" vinculada ao ${kindLabel}.`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, `Não foi possível criar e vincular a tag.`))
  } finally {
    isSubmittingItemTag.value = false
  }
}

async function handleRemoveItemTag(
  tagId: number,
  explicitKind?: RepertoryItemKind,
  explicitItemId?: number,
) {
  const projectId = resolvedProjectId.value
  const kind = explicitKind ?? activeItemKind.value
  const targetId = explicitItemId ?? activeItemId.value
  if (!projectId || !targetId) return

  const targetItem =
    kind === 'asset'
      ? assets.value.find((item) => item.id === targetId)
      : documents.value.find((item) => item.id === targetId)
  if (!targetItem) return

  const removedTag = targetItem.tags.find((tag) => tag.id === tagId)
  const kindLabel = kind === 'asset' ? 'asset' : 'documento'

  try {
    if (kind === 'asset') {
      await repertoryApi.detachTagFromAsset(projectId, targetId, tagId)
    } else {
      await repertoryApi.detachTagFromDocument(projectId, targetId, tagId)
    }

    await reloadItemTags(projectId, kind, targetId)
    if (
      isDetailsSheetOpen.value &&
      activeItemKind.value === kind &&
      activeItemId.value === targetId
    ) {
      await loadActiveItemHistory(projectId, kind, targetId, undefined, true)
    } else {
      repertoryState.invalidateHistory(projectId, kind, targetId)
    }

    toast.success(
      removedTag
        ? `Tag "${removedTag.label}" removida do ${kindLabel}.`
        : `Tag removida do ${kindLabel}.`,
    )
  } catch (error) {
    toast.error(getApiErrorMessage(error, `Não foi possível desvincular a tag do ${kindLabel}.`))
  }
}

function toggleTagSelection(rowKey: string | number) {
  selectedTagKeys.value = selectedTagKeys.value.includes(rowKey)
    ? selectedTagKeys.value.filter((item) => item !== rowKey)
    : [...selectedTagKeys.value, rowKey]
}

function openNewTagModal() {
  newTagNameError.value = ''
  newTagColorError.value = ''
  isNewTagModalOpen.value = true
}

async function handleCreateTag(payload: TagFormPayload) {
  const projectId = resolvedProjectId.value
  if (!projectId) return

  const cleanName = payload.name.trim()
  const cleanColor = (payload.color ?? '').trim()

  newTagNameError.value = cleanName ? '' : 'Informe um nome para a tag.'
  newTagColorError.value = HEX_COLOR_REGEX.test(cleanColor)
    ? ''
    : 'Informe uma cor hexadecimal válida (#RRGGBB).'

  if (!cleanName || !HEX_COLOR_REGEX.test(cleanColor)) {
    return
  }

  const duplicate = tagsList.value.some(
    (item) => item.label.toLowerCase() === cleanName.toLowerCase(),
  )
  if (duplicate) {
    newTagNameError.value = 'Já existe uma tag com este nome.'
    return
  }

  isCreatingTag.value = true
  try {
    const created = await repertoryApi.createTag(projectId, {
      label: cleanName,
      description: payload.description.trim(),
      color: cleanColor,
    })
    repertoryState.prependTag(projectId, created)
    tagPage.value = 1
    isNewTagModalOpen.value = false
    newTagNameError.value = ''
    newTagColorError.value = ''
    toast.success(`Tag "${created.label}" criada com sucesso.`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível criar a tag.'))
  } finally {
    isCreatingTag.value = false
  }
}

function openEditTagModal(tagId: number) {
  const found = tagsList.value.find((tag) => tag.id === tagId)
  if (!found) return

  editingTag.value = { ...found }
  editTagNameError.value = ''
  editTagColorError.value = ''
  isEditTagModalOpen.value = true
}

async function handleUpdateTag(payload: TagFormPayload) {
  const projectId = resolvedProjectId.value
  const target = editingTag.value
  if (!projectId || !target) return

  const cleanName = payload.name.trim()
  const cleanColor = (payload.color ?? '').trim()

  editTagNameError.value = cleanName ? '' : 'Informe um nome para a tag.'
  editTagColorError.value = HEX_COLOR_REGEX.test(cleanColor)
    ? ''
    : 'Informe uma cor hexadecimal válida (#RRGGBB).'

  if (!cleanName || !HEX_COLOR_REGEX.test(cleanColor)) {
    return
  }

  isUpdatingTag.value = true
  try {
    const updated = await repertoryApi.updateTag(projectId, target.id, {
      label: cleanName,
      description: payload.description.trim(),
      color: cleanColor,
    })

    repertoryState.upsertTag(projectId, updated)

    isEditTagModalOpen.value = false
    editingTag.value = null
    toast.success(`Tag "${updated.label}" atualizada.`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível atualizar a tag.'))
  } finally {
    isUpdatingTag.value = false
  }
}

function handleTagBatchAction(actionId: string) {
  const count = selectedTagKeys.value.length
  if (count === 0) {
    return
  }

  if (actionId === 'edit') {
    if (count !== 1) return
    const tagId = Number(selectedTagKeys.value[0])
    if (Number.isFinite(tagId)) {
      openEditTagModal(tagId)
    }
    return
  }

  if (actionId === 'delete') {
    confirmState.value = {
      open: true,
      target: 'tags',
      title: 'remover tags selecionadas',
      description: `Deseja remover ${count} tag(s) selecionada(s)? Elas deixarão de aparecer na listagem cadastrada.`,
      confirmLabel: 'Remover tags',
    }
  }
}

async function executeConfirmDeletion() {
  const projectId = resolvedProjectId.value
  if (!projectId || isDeleting.value) {
    return
  }

  const target = confirmState.value.target
  if (!target) {
    return
  }

  isDeleting.value = true
  try {
    if (target === 'tags') {
      const ids = selectedTagKeys.value
        .map((key) => Number(key))
        .filter((id) => Number.isFinite(id))
      await Promise.all(ids.map((tagId) => repertoryApi.deleteTag(projectId, tagId)))
      repertoryState.removeTags(projectId, ids)
      selectedTagKeys.value = []
      confirmState.value.open = false
      toast.success(`${ids.length} tag(s) removida(s) com sucesso.`)
      return
    }

    if (target === 'document' && activeDocument.value) {
      const removedTitle = activeDocument.value.title
      const removedId = activeDocument.value.id
      await repertoryApi.deleteDocument(projectId, removedId)
      repertoryState.removeDocument(projectId, removedId)
      confirmState.value.open = false
      isDetailsSheetOpen.value = false
      activeItemId.value = null
      toast.success(`Documento "${removedTitle}" excluído.`)
      return
    }

    if (target === 'asset' && activeAsset.value) {
      const removedTitle = activeAsset.value.title
      const removedId = activeAsset.value.id
      await repertoryApi.deleteAsset(projectId, removedId)
      repertoryState.removeAsset(projectId, removedId)
      confirmState.value.open = false
      isDetailsSheetOpen.value = false
      activeItemId.value = null
      toast.success(`Asset "${removedTitle}" excluído.`)
    }
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível concluir a remoção.'))
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <AppShell title="repertório" active-nav="repertory">
    <template #subheader>
      <div class="repertory-view__subheader">
        <Tabs v-model="activeTab" :items="tabItems" aria-label="Seções do repertório" />
      </div>
    </template>

    <div class="repertory-view">
      <!-- Estado sem projeto ativo -->
      <div v-if="!resolvedProjectId" class="repertory-view__empty" role="status">
        <Icon name="folder" size="2xl" color="helper" />
        <div class="repertory-view__empty-copy">
          <h3 class="repertory-view__empty-title">nenhum projeto selecionado</h3>
          <p class="repertory-view__empty-description">
            Selecione ou crie um projeto na barra lateral para gerenciar documentos, assets e tags.
          </p>
        </div>
      </div>

      <!-- Estado de carregamento inicial -->
      <div v-else-if="isLoadingData" class="repertory-view__empty" role="status" aria-busy="true">
        <Icon name="documents" size="2xl" color="helper" />
        <div class="repertory-view__empty-copy">
          <h3 class="repertory-view__empty-title">carregando repertório...</h3>
          <p class="repertory-view__empty-description">
            Buscando documentos, assets e tags cadastrados no projeto.
          </p>
        </div>
      </div>

      <!-- Estado de erro no carregamento -->
      <div v-else-if="loadError" class="repertory-view__empty" role="alert">
        <Icon name="exclamation" size="2xl" color="danger" />
        <div class="repertory-view__empty-copy">
          <h3 class="repertory-view__empty-title">erro ao carregar repertório</h3>
          <p class="repertory-view__empty-description">{{ loadError }}</p>
        </div>
        <Button
          variant="tertiary"
          size="md"
          @click="loadActiveTabRepertory(resolvedProjectId, activeTab, true)"
        >
          tentar novamente
        </Button>
      </div>

      <!-- Aba 1: Documents -->
      <section v-else-if="activeTab === 'documents'" class="repertory-view__section">
        <div class="repertory-view__filters-header">
          <h2 class="repertory-view__section-title">filtros</h2>
          <Button variant="primary" size="md" @click="openNewDocModal">novo documento</Button>
        </div>

        <div class="repertory-view__controls">
          <div class="repertory-view__control repertory-view__control--search">
            <SearchInput
              v-model="docSearch"
              placeholder="Título do documento"
              aria-label="Buscar documento por título"
            />
          </div>

          <div class="repertory-view__control repertory-view__control--select">
            <Select
              v-model="selectedTagFilter"
              :options="tagFilterOptions"
              placeholder="selecione as tags"
              aria-label="Filtrar por tag"
              @change="addTagFilter"
            />
          </div>

          <div class="repertory-view__control repertory-view__control--select">
            <Select
              v-model="selectedStatusFilter"
              :options="statusFilterOptions"
              placeholder="status"
              aria-label="Filtrar por status"
            />
          </div>
        </div>

        <div
          v-if="activeTagFilters.length > 0 || hasActiveDocFilters"
          class="repertory-view__active-filters"
        >
          <Tag
            v-for="tagLabel in activeTagFilters"
            :key="tagLabel"
            :label="tagLabel"
            :color="getTagColorByLabel(tagLabel)"
            :dismissible="true"
            :dismiss-label="`Remover filtro ${tagLabel}`"
            @dismiss="removeTagFilter(tagLabel)"
          />
          <Button v-if="hasActiveDocFilters" variant="ghost" size="sm" @click="clearDocFilters">
            limpar filtros
          </Button>
        </div>

        <div v-if="filteredDocuments.length > 0" class="repertory-view__grid">
          <DocumentCard
            v-for="doc in filteredDocuments"
            :id="String(doc.id)"
            :key="doc.id"
            :title="doc.title"
            :description="doc.description"
            :tags="toUiTags(doc.tags)"
            :format="doc.format"
            :status="doc.statusLabel"
            tags-aria-label="Tags do documento"
            @select="(id) => openDocumentDetails(Number(id))"
            @download="(id) => handleDownloadDocument(Number(id))"
            @remove-tag="
              (docId, tagId) => handleRemoveItemTag(Number(tagId), 'document', Number(docId))
            "
          />
        </div>

        <div v-else class="repertory-view__empty" role="status">
          <Icon name="documents" size="2xl" color="helper" />
          <div class="repertory-view__empty-copy">
            <h3 class="repertory-view__empty-title">
              {{
                hasActiveDocFilters ? 'nenhum documento encontrado' : 'nenhum documento cadastrado'
              }}
            </h3>
            <p class="repertory-view__empty-description">
              {{
                hasActiveDocFilters
                  ? 'Ajuste os termos de busca ou remova os filtros aplicados para visualizar os documentos.'
                  : 'Envie o primeiro documento deste projeto clicando em "novo documento".'
              }}
            </p>
          </div>
          <Button v-if="hasActiveDocFilters" variant="tertiary" size="md" @click="clearDocFilters">
            limpar filtros
          </Button>
          <Button v-else variant="primary" size="md" @click="openNewDocModal">
            novo documento
          </Button>
        </div>

        <div v-if="documentsState.hasMore" class="repertory-view__load-more">
          <Button
            variant="tertiary"
            size="md"
            :disabled="documentsState.isLoadingMore"
            @click="handleLoadMoreDocuments"
          >
            {{ documentsState.isLoadingMore ? 'carregando...' : 'carregar mais' }}
          </Button>
        </div>
      </section>

      <!-- Aba 2: Assets -->
      <section v-else-if="activeTab === 'assets'" class="repertory-view__section">
        <div class="repertory-view__filters-header">
          <h2 class="repertory-view__section-title">filtros</h2>
          <Button variant="primary" size="md" icon="upload" @click="openNewAssetModal">
            novo asset
          </Button>
        </div>

        <div class="repertory-view__controls">
          <div class="repertory-view__control repertory-view__control--search">
            <SearchInput
              v-model="assetSearch"
              placeholder="Título do asset"
              aria-label="Buscar asset por título"
            />
          </div>

          <div class="repertory-view__control repertory-view__control--select">
            <Select
              v-model="selectedAssetTagFilter"
              :options="assetTagFilterOptions"
              placeholder="selecione as tags"
              aria-label="Filtrar asset por tag"
              @change="addAssetTagFilter"
            />
          </div>

          <div class="repertory-view__control repertory-view__control--select">
            <Select
              v-model="selectedAssetFormatFilter"
              :options="assetFormatFilterOptions"
              placeholder="formato"
              aria-label="Filtrar asset por formato"
            />
          </div>
        </div>

        <div
          v-if="activeAssetTagFilters.length > 0 || hasActiveAssetFilters"
          class="repertory-view__active-filters"
        >
          <Tag
            v-for="tagLabel in activeAssetTagFilters"
            :key="tagLabel"
            :label="tagLabel"
            :color="getTagColorByLabel(tagLabel)"
            :dismissible="true"
            :dismiss-label="`Remover filtro ${tagLabel}`"
            @dismiss="removeAssetTagFilter(tagLabel)"
          />
          <Button v-if="hasActiveAssetFilters" variant="ghost" size="sm" @click="clearAssetFilters">
            limpar filtros
          </Button>
        </div>

        <div v-if="filteredAssets.length > 0" class="repertory-view__grid">
          <DocumentCard
            v-for="asset in filteredAssets"
            :id="String(asset.id)"
            :key="asset.id"
            :title="asset.title"
            :description="asset.description"
            :tags="toUiTags(asset.tags)"
            :thumbnail-url="isImageAsset(asset) ? asset.fileUrl : undefined"
            :format="asset.format"
            :status="asset.statusLabel"
            icon="attachment"
            tags-aria-label="Tags do asset"
            @select="(id) => openAssetDetails(Number(id))"
            @download="(id) => handleDownloadAsset(Number(id))"
            @remove-tag="
              (assetId, tagId) => handleRemoveItemTag(Number(tagId), 'asset', Number(assetId))
            "
          />
        </div>

        <div v-else class="repertory-view__empty" role="status">
          <Icon name="attachment" size="2xl" color="helper" />
          <div class="repertory-view__empty-copy">
            <h3 class="repertory-view__empty-title">
              {{ hasActiveAssetFilters ? 'nenhum asset encontrado' : 'nenhum asset cadastrado' }}
            </h3>
            <p class="repertory-view__empty-description">
              {{
                hasActiveAssetFilters
                  ? 'Ajuste os termos de busca ou remova os filtros aplicados para visualizar os assets.'
                  : 'Envie o primeiro asset visual ou multimídia clicando em "novo asset".'
              }}
            </p>
          </div>
          <Button
            v-if="hasActiveAssetFilters"
            variant="tertiary"
            size="md"
            @click="clearAssetFilters"
          >
            limpar filtros
          </Button>
          <Button v-else variant="primary" size="md" icon="upload" @click="openNewAssetModal">
            novo asset
          </Button>
        </div>

        <div v-if="assetsState.hasMore" class="repertory-view__load-more">
          <Button
            variant="tertiary"
            size="md"
            :disabled="assetsState.isLoadingMore"
            @click="handleLoadMoreAssets"
          >
            {{ assetsState.isLoadingMore ? 'carregando...' : 'carregar mais' }}
          </Button>
        </div>
      </section>

      <!-- Aba 3: Tags -->
      <section v-else class="repertory-view__section">
        <DataTable
          title="tags cadastradas"
          description="organize os rótulos usados nos documentos e workflows"
          :columns="tagColumns"
          :rows="paginatedTagRows"
          :selectable="true"
          :selected-row-keys="selectedTagKeys"
          :show-pagination="true"
          :can-previous="tagPage > 1"
          :can-next="tagPage < totalTagPages"
          action-label="nova tag"
          :batch-actions="tagBatchActions"
          @toggle-select="toggleTagSelection"
          @previous-page="tagPage--"
          @next-page="tagPage++"
          @primary-action="openNewTagModal"
          @batch-action="handleTagBatchAction"
          @clear-selection="selectedTagKeys = []"
        >
          <template #cell-label="{ row }">
            <Tag :label="String(row.label ?? '')" :color="String(row.color ?? '')" />
          </template>

          <template #cell-color="{ value }">
            <span class="repertory-view__tag-color-cell">
              <span
                class="repertory-view__tag-color-swatch"
                :style="{ backgroundColor: String(value) }"
                aria-hidden="true"
              />
              <span class="repertory-view__tag-color-hex">{{ String(value) }}</span>
            </span>
          </template>
        </DataTable>
      </section>
    </div>

    <!-- Sheet Detalhes do Item (Documento ou Asset) -->
    <Sheet
      v-model:open="isDetailsSheetOpen"
      size="md"
      :title="activeItemKind === 'asset' ? 'detalhes do asset' : 'detalhes do documento'"
    >
      <template #preview>
        <div
          v-if="activeItem"
          :class="[
            'repertory-view__preview-stage',
            activeItemKind === 'asset'
              ? 'repertory-view__preview-stage--asset'
              : 'repertory-view__preview-stage--document',
          ]"
        >
          <header class="repertory-view__preview-doc-header">
            <div class="repertory-view__preview-footer-left">
              <Icon
                :name="activeItemKind === 'asset' ? 'attachment' : 'documents'"
                size="md"
                color="helper"
              />
              <span class="repertory-view__preview-title">{{ activeItem.title }}</span>
            </div>
            <div class="repertory-view__preview-doc-badges">
              <Badge :label="activeItem.format" />
              <Badge :label="activeItem.statusLabel" />
            </div>
          </header>

          <div v-if="previewState.kind === 'loading'" class="repertory-view__preview-doc-body">
            <p class="repertory-view__preview-doc-note">Carregando pré-visualização...</p>
          </div>

          <template v-else-if="previewState.kind === 'image' && previewState.url">
            <img
              :src="previewState.url"
              :alt="`Pré-visualização de ${activeItem.title}`"
              class="repertory-view__preview-image"
            />
            <footer class="repertory-view__preview-footer">
              <span class="repertory-view__preview-meta">
                {{ getFileBasename(activeItem.filePath) }}
              </span>
              <span class="repertory-view__preview-meta">{{ activeItem.createdAtLabel }}</span>
            </footer>
          </template>

          <iframe
            v-else-if="previewState.kind === 'pdf' && previewState.url"
            :src="previewState.url"
            :title="`Pré-visualização PDF de ${activeItem.title}`"
            class="repertory-view__preview-pdf"
          />

          <div v-else-if="previewState.kind === 'text'" class="repertory-view__preview-doc-body">
            <pre class="repertory-view__preview-excerpt">{{ previewState.text }}</pre>
          </div>

          <div v-else class="repertory-view__preview-doc-body">
            <dl class="repertory-view__preview-meta-list">
              <div class="repertory-view__preview-meta-row">
                <dt class="repertory-view__preview-meta-term">Arquivo</dt>
                <dd class="repertory-view__preview-meta-value">
                  {{ getFileBasename(activeItem.filePath) }}
                </dd>
              </div>
              <div class="repertory-view__preview-meta-row">
                <dt class="repertory-view__preview-meta-term">Formato</dt>
                <dd class="repertory-view__preview-meta-value">{{ activeItem.format }}</dd>
              </div>
              <div class="repertory-view__preview-meta-row">
                <dt class="repertory-view__preview-meta-term">Content-Type</dt>
                <dd class="repertory-view__preview-meta-value">
                  {{ activeItem.contentType || 'Não informado' }}
                </dd>
              </div>
              <div class="repertory-view__preview-meta-row">
                <dt class="repertory-view__preview-meta-term">Status</dt>
                <dd class="repertory-view__preview-meta-value">{{ activeItem.statusLabel }}</dd>
              </div>
              <div class="repertory-view__preview-meta-row">
                <dt class="repertory-view__preview-meta-term">Criado em</dt>
                <dd class="repertory-view__preview-meta-value">{{ activeItem.createdAtLabel }}</dd>
              </div>
            </dl>
            <p v-if="previewState.note" class="repertory-view__preview-doc-note">
              {{ previewState.note }}
            </p>
          </div>
        </div>
      </template>

      <div v-if="activeItem" class="repertory-view__sheet-content">
        <RepertoryItemDetails
          :title="activeItem.title"
          :description="activeItem.description"
          :tags="toUiTags(activeItem.tags)"
          :history="toUiHistory(activeItemHistory)"
          :editable-tags="true"
          :show-add-tag="true"
          @add-tag="openAddTagToItemModal"
          @remove-tag="(tagId) => handleRemoveItemTag(Number(tagId))"
        >
          <template #header-actions>
            <IconButton
              variant="ghost"
              size="sm"
              icon="download"
              :ariaLabel="`Baixar ${activeItem.title}`"
              @click="handleDownloadActiveItem"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon="edit"
              :ariaLabel="`Editar ${activeItem.title}`"
              @click="openEditItemModal"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon="delete"
              :ariaLabel="`Excluir ${activeItem.title}`"
              @click="requestDeleteActiveItem"
            />
          </template>
        </RepertoryItemDetails>
        <p v-if="isLoadingHistory" class="repertory-view__preview-doc-note" role="status">
          Carregando histórico...
        </p>
      </div>
    </Sheet>

    <!-- Modal Novo Documento -->
    <Modal
      v-model:open="isNewDocModalOpen"
      size="md"
      title="novo documento"
      subtitle="Envie um arquivo para adicionar o documento ao projeto."
    >
      <DocumentForm
        v-if="isNewDocModalOpen"
        accept=".pdf,.doc,.docx,.md,.markdown,.txt,.csv,.json"
        file-label="Suba seu documento (PDF, DOCX, MD)"
        file-hint="PDF, DOCX, Markdown ou texto até 10mb"
        title-placeholder="Ex.: Manual de Governança IA"
        :title-error="newDocTitleError"
        :file-error="newDocFileError"
        :disabled="isCreatingDoc"
        :submit-label="isCreatingDoc ? 'Enviando...' : 'Salvar'"
        @update:title="newDocTitleError = ''"
        @select-files="newDocFileError = ''"
        @submit="handleCreateDocument"
        @cancel="isNewDocModalOpen = false"
      />
    </Modal>

    <!-- Modal Novo Asset -->
    <Modal
      v-model:open="isNewAssetModalOpen"
      size="md"
      title="novo asset"
      subtitle="Envie uma mídia visual ou arquivo de apoio para o projeto."
    >
      <DocumentForm
        v-if="isNewAssetModalOpen"
        accept=".png,.jpg,.jpeg,.webp,.svg,image/*"
        file-label="Suba seu asset (PNG, JPG, WEBP, SVG)"
        file-hint="PNG, JPG, WEBP ou SVG até 10mb"
        title-placeholder="Ex.: Ilustração Hero Prismon"
        description-placeholder="Descreva onde esta mídia é utilizada no ecossistema Prismon."
        :title-error="newAssetTitleError"
        :file-error="newAssetFileError"
        :disabled="isCreatingAsset"
        :submit-label="isCreatingAsset ? 'Enviando...' : 'Salvar'"
        @update:title="newAssetTitleError = ''"
        @select-files="newAssetFileError = ''"
        @submit="handleCreateAsset"
        @cancel="isNewAssetModalOpen = false"
      />
    </Modal>

    <!-- Modal Editar Metadados (Documento ou Asset) -->
    <Modal
      v-model:open="isEditItemModalOpen"
      size="md"
      :title="activeItemKind === 'asset' ? 'editar asset' : 'editar documento'"
      subtitle="Atualize o título e a descrição cadastrados."
    >
      <form
        v-if="isEditItemModalOpen"
        class="repertory-view__edit-form"
        @submit.prevent="handleUpdateActiveItem"
      >
        <TextInput
          v-model="editItemTitle"
          label="Título"
          placeholder="Informe o título"
          :error="editItemTitleError"
          :disabled="isUpdatingItem"
          @update:model-value="editItemTitleError = ''"
        />
        <TextInput
          v-if="activeItemKind === 'asset'"
          v-model="editItemType"
          label="Tipo do asset"
          placeholder="Ex.: image, video, document"
          :disabled="isUpdatingItem"
        />
        <TextArea
          v-model="editItemDescription"
          label="Descrição"
          placeholder="Descreva o conteúdo deste item"
          :disabled="isUpdatingItem"
        />
        <div class="repertory-view__tag-modal-actions">
          <Button
            variant="tertiary"
            :disabled="isUpdatingItem"
            @click="isEditItemModalOpen = false"
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" :disabled="isUpdatingItem">
            {{ isUpdatingItem ? 'Salvando...' : 'Salvar alterações' }}
          </Button>
        </div>
      </form>
    </Modal>

    <!-- Modal Adicionar Tag ao Item (Vincular existente ou Criar nova) -->
    <Modal
      v-model:open="isItemTagModalOpen"
      size="md"
      title="adicionar tag"
      subtitle="Vincule uma tag existente ou crie um novo rótulo para este item."
    >
      <div v-if="isItemTagModalOpen" class="repertory-view__tag-modal">
        <div class="repertory-view__tag-modal-tabs">
          <Tabs
            v-model="itemTagModalTab"
            :items="itemTagTabOptions"
            aria-label="Opções para adicionar tag"
          />
        </div>

        <form
          v-if="itemTagModalTab === 'existing'"
          class="repertory-view__existing-tag-form"
          @submit.prevent="handleLinkExistingTagToItem"
        >
          <template v-if="availableTagOptionsForActiveItem.length > 0">
            <Select
              v-model="selectedExistingTagId"
              label="Tag cadastrada"
              placeholder="selecione uma tag"
              :options="availableTagOptionsForActiveItem"
              :error="existingTagSelectError"
              :disabled="isSubmittingItemTag"
              aria-label="Selecionar tag existente"
              @update:model-value="existingTagSelectError = ''"
            />

            <div class="repertory-view__tag-modal-actions">
              <Button
                variant="tertiary"
                :disabled="isSubmittingItemTag"
                @click="isItemTagModalOpen = false"
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" :disabled="isSubmittingItemTag">
                {{ isSubmittingItemTag ? 'Vinculando...' : 'Vincular tag' }}
              </Button>
            </div>
          </template>

          <div v-else class="repertory-view__empty" role="status">
            <Icon name="tag" size="xl" color="helper" />
            <div class="repertory-view__empty-copy">
              <h3 class="repertory-view__empty-title">todas as tags já vinculadas</h3>
              <p class="repertory-view__empty-description">
                Todas as tags cadastradas já fazem parte deste item. Crie uma nova tag na aba ao
                lado.
              </p>
            </div>
            <Button variant="tertiary" size="md" @click="itemTagModalTab = 'create'">
              criar nova tag
            </Button>
          </div>
        </form>

        <TagForm
          v-else
          :show-color="true"
          :name-error="itemTagNameError"
          :color-error="itemTagColorError"
          :disabled="isSubmittingItemTag"
          :submit-label="isSubmittingItemTag ? 'Salvando...' : 'Salvar'"
          @update:name="itemTagNameError = ''"
          @update:color="itemTagColorError = ''"
          @submit="handleCreateAndLinkTagToItem"
          @cancel="isItemTagModalOpen = false"
        />
      </div>
    </Modal>

    <!-- Modal Nova Tag -->
    <Modal v-model:open="isNewTagModalOpen" size="md" title="nova tag">
      <TagForm
        v-if="isNewTagModalOpen"
        :show-color="true"
        :name-error="newTagNameError"
        :color-error="newTagColorError"
        :disabled="isCreatingTag"
        :submit-label="isCreatingTag ? 'Salvando...' : 'Salvar'"
        @update:name="newTagNameError = ''"
        @update:color="newTagColorError = ''"
        @submit="handleCreateTag"
        @cancel="isNewTagModalOpen = false"
      />
    </Modal>

    <!-- Modal Editar Tag -->
    <Modal v-model:open="isEditTagModalOpen" size="md" title="editar tag">
      <TagForm
        v-if="isEditTagModalOpen && editingTag"
        :show-color="true"
        :name="editingTag.label"
        :description="editingTag.description"
        :color="editingTag.color"
        :name-error="editTagNameError"
        :color-error="editTagColorError"
        :disabled="isUpdatingTag"
        :submit-label="isUpdatingTag ? 'Salvando...' : 'Salvar'"
        @update:name="editTagNameError = ''"
        @update:color="editTagColorError = ''"
        @submit="handleUpdateTag"
        @cancel="isEditTagModalOpen = false"
      />
    </Modal>

    <!-- ConfirmDialog Compartilhado -->
    <ConfirmDialog
      v-model:open="confirmState.open"
      :title="confirmState.title"
      :description="confirmState.description"
      :confirm-label="confirmState.confirmLabel"
      confirm-variant="danger"
      @confirm="executeConfirmDeletion"
    />
  </AppShell>
</template>

<style scoped>
.repertory-view__subheader {
  --repertory-view-subheader-padding-top: var(--spacing-3);
  --repertory-view-subheader-padding-x: var(--spacing-6);
  --repertory-view-subheader-padding-bottom: var(--spacing-0);
  --repertory-view-subheader-reset-spacing: var(--spacing-0);

  display: flex;
  align-items: stretch;
  width: 100%;
  min-width: var(--repertory-view-subheader-reset-spacing);
  padding: var(--repertory-view-subheader-padding-top) var(--repertory-view-subheader-padding-x)
    var(--repertory-view-subheader-padding-bottom);
  box-sizing: border-box;
}

.repertory-view {
  --repertory-view-padding-y: var(--spacing-6);
  --repertory-view-padding-x: var(--spacing-6);
  --repertory-view-mobile-padding-y: var(--spacing-5);
  --repertory-view-mobile-padding-x: var(--spacing-4);
  --repertory-view-section-gap: var(--spacing-5);
  --repertory-view-controls-gap: var(--spacing-4);
  --repertory-view-grid-gap: var(--spacing-6);
  --repertory-view-filter-tags-gap: var(--spacing-3);
  --repertory-view-search-basis: 280px;
  --repertory-view-select-basis: 210px;
  --repertory-view-empty-padding-y: var(--spacing-10);
  --repertory-view-empty-padding-x: var(--spacing-6);
  --repertory-view-empty-gap: var(--spacing-4);
  --repertory-view-empty-bg: var(--surface-elevated);
  --repertory-view-border-color: var(--border-subtle-1);
  --repertory-view-border-width: var(--border-width-thin);
  --repertory-view-radius: var(--radius-none);
  --repertory-view-title-color: var(--text-primary);
  --repertory-view-title-font-family: var(--type-heading-03-font-family);
  --repertory-view-title-font-size: var(--type-heading-03-font-size);
  --repertory-view-title-line-height: var(--type-heading-03-line-height);
  --repertory-view-title-font-weight: var(--type-heading-03-font-weight);
  --repertory-view-title-text-transform: var(--type-heading-03-text-transform);
  --repertory-view-empty-title-font-family: var(--type-heading-02-font-family);
  --repertory-view-empty-title-font-size: var(--type-heading-02-font-size);
  --repertory-view-empty-title-line-height: var(--type-heading-02-line-height);
  --repertory-view-empty-title-font-weight: var(--type-heading-02-font-weight);
  --repertory-view-empty-description-color: var(--text-helper);
  --repertory-view-empty-description-font-family: var(--type-body-01-font-family);
  --repertory-view-empty-description-font-size: var(--type-body-01-font-size);
  --repertory-view-empty-description-line-height: var(--type-body-01-line-height);
  --repertory-view-empty-description-font-weight: var(--type-body-01-font-weight);
  --repertory-view-sheet-gap: var(--spacing-6);
  --repertory-view-modal-gap: var(--spacing-5);
  --repertory-view-reset-spacing: var(--spacing-0);

  display: flex;
  flex-direction: column;
  width: 100%;
  padding: var(--repertory-view-padding-y) var(--repertory-view-padding-x);
  box-sizing: border-box;
}

.repertory-view__section {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-section-gap);
  width: 100%;
  min-width: var(--repertory-view-reset-spacing);
}

.repertory-view__filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--repertory-view-controls-gap);
  flex-wrap: wrap;
}

.repertory-view__section-title {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-view-title-color);
  font-family: var(--repertory-view-title-font-family);
  font-size: var(--repertory-view-title-font-size);
  line-height: var(--repertory-view-title-line-height);
  font-weight: var(--repertory-view-title-font-weight);
  text-transform: var(--repertory-view-title-text-transform);
}

.repertory-view__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--repertory-view-controls-gap);
}

.repertory-view__control {
  min-width: var(--repertory-view-reset-spacing);
}

.repertory-view__control--search {
  flex: 1 1 var(--repertory-view-search-basis);
}

.repertory-view__control--select {
  flex: 0 1 var(--repertory-view-select-basis);
  min-width: 180px;
}

.repertory-view__active-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--repertory-view-filter-tags-gap);
}

.repertory-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--repertory-view-grid-gap);
  width: 100%;
}

.repertory-view__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--repertory-view-empty-gap);
  padding: var(--repertory-view-empty-padding-y) var(--repertory-view-empty-padding-x);
  background-color: var(--repertory-view-empty-bg);
  border: var(--repertory-view-border-width) solid var(--repertory-view-border-color);
  border-radius: var(--repertory-view-radius);
}

.repertory-view__empty-copy {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-width: 420px;
}

.repertory-view__empty-title {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-view-title-color);
  font-family: var(--repertory-view-empty-title-font-family);
  font-size: var(--repertory-view-empty-title-font-size);
  line-height: var(--repertory-view-empty-title-line-height);
  font-weight: var(--repertory-view-empty-title-font-weight);
  text-transform: lowercase;
}

.repertory-view__empty-description {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-view-empty-description-color);
  font-family: var(--repertory-view-empty-description-font-family);
  font-size: var(--repertory-view-empty-description-font-size);
  line-height: var(--repertory-view-empty-description-line-height);
  font-weight: var(--repertory-view-empty-description-font-weight);
}

.repertory-view__tag-color-cell {
  --repertory-tag-cell-gap: var(--spacing-2);
  --repertory-tag-swatch-size: 16px;
  --repertory-tag-swatch-border-color: var(--border-subtle-2);
  --repertory-tag-swatch-border-width: var(--border-width-thin);
  --repertory-tag-hex-color: var(--text-secondary);
  --repertory-tag-hex-font-family: var(--type-label-01-font-family);
  --repertory-tag-hex-font-size: var(--type-label-01-font-size);
  --repertory-tag-hex-line-height: var(--type-label-01-line-height);
  --repertory-tag-hex-font-weight: var(--type-label-01-font-weight);

  display: inline-flex;
  align-items: center;
  gap: var(--repertory-tag-cell-gap);
}

.repertory-view__tag-color-swatch {
  display: inline-block;
  width: var(--repertory-tag-swatch-size);
  height: var(--repertory-tag-swatch-size);
  border: var(--repertory-tag-swatch-border-width) solid var(--repertory-tag-swatch-border-color);
  flex-shrink: 0;
}

.repertory-view__tag-color-hex {
  color: var(--repertory-tag-hex-color);
  font-family: var(--repertory-tag-hex-font-family);
  font-size: var(--repertory-tag-hex-font-size);
  line-height: var(--repertory-tag-hex-line-height);
  font-weight: var(--repertory-tag-hex-font-weight);
  text-transform: uppercase;
}

.repertory-view__load-more {
  display: flex;
  justify-content: center;
  padding-top: var(--spacing-2);
}

.repertory-view__sheet-content {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-sheet-gap);
}

.repertory-view__preview-stage {
  --repertory-preview-bg: var(--surface-elevated);
  --repertory-preview-doc-bg: var(--surface-subtle);
  --repertory-preview-placeholder-bg: var(--surface-placeholder);
  --repertory-preview-border-color: var(--border-subtle-1);
  --repertory-preview-border-width: var(--border-width-thin);
  --repertory-preview-padding: var(--spacing-5);
  --repertory-preview-gap: var(--spacing-4);
  --repertory-preview-title-color: var(--text-primary);
  --repertory-preview-title-font-family: var(--type-heading-02-font-family);
  --repertory-preview-title-font-size: var(--type-heading-02-font-size);
  --repertory-preview-title-line-height: var(--type-heading-02-line-height);
  --repertory-preview-title-font-weight: var(--type-heading-02-font-weight);
  --repertory-preview-meta-color: var(--text-helper);
  --repertory-preview-meta-font-family: var(--type-label-01-font-family);
  --repertory-preview-meta-font-size: var(--type-label-01-font-size);
  --repertory-preview-meta-line-height: var(--type-label-01-line-height);
  --repertory-preview-meta-font-weight: var(--type-label-01-font-weight);
  --repertory-preview-body-color: var(--text-secondary);
  --repertory-preview-body-font-family: var(--type-body-02-font-family);
  --repertory-preview-body-font-size: var(--type-body-02-font-size);
  --repertory-preview-body-line-height: var(--type-body-02-line-height);
  --repertory-preview-body-font-weight: var(--type-body-02-font-weight);

  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--repertory-preview-bg);
  border: var(--repertory-preview-border-width) solid var(--repertory-preview-border-color);
  box-sizing: border-box;
  overflow: hidden;
}

.repertory-view__preview-image {
  display: block;
  width: 100%;
  max-height: min(62dvh, 480px);
  object-fit: cover;
  background-color: var(--repertory-preview-placeholder-bg);
}

.repertory-view__preview-pdf {
  display: block;
  width: 100%;
  height: min(62dvh, 480px);
  border: none;
  background-color: var(--repertory-preview-doc-bg);
}

.repertory-view__preview-footer,
.repertory-view__preview-doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--repertory-preview-gap);
  padding: var(--spacing-4) var(--repertory-preview-padding);
  background-color: var(--repertory-preview-bg);
}

.repertory-view__preview-footer {
  border-top: var(--repertory-preview-border-width) solid var(--repertory-preview-border-color);
}

.repertory-view__preview-doc-header {
  border-bottom: var(--repertory-preview-border-width) solid var(--repertory-preview-border-color);
}

.repertory-view__preview-footer-left,
.repertory-view__preview-doc-badges {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: var(--spacing-0);
}

.repertory-view__preview-title {
  color: var(--repertory-preview-title-color);
  font-family: var(--repertory-preview-title-font-family);
  font-size: var(--repertory-preview-title-font-size);
  line-height: var(--repertory-preview-title-line-height);
  font-weight: var(--repertory-preview-title-font-weight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repertory-view__preview-meta {
  color: var(--repertory-preview-meta-color);
  font-family: var(--repertory-preview-meta-font-family);
  font-size: var(--repertory-preview-meta-font-size);
  line-height: var(--repertory-preview-meta-line-height);
  font-weight: var(--repertory-preview-meta-font-weight);
}

.repertory-view__preview-doc-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-6) var(--repertory-preview-padding);
  min-height: 220px;
  max-height: min(62dvh, 480px);
  overflow-y: auto;
  background-color: var(--repertory-preview-doc-bg);
}

.repertory-view__preview-excerpt,
.repertory-view__preview-doc-note {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-preview-body-color);
  font-family: var(--repertory-preview-body-font-family);
  font-size: var(--repertory-preview-body-font-size);
  line-height: var(--repertory-preview-body-line-height);
  font-weight: var(--repertory-preview-body-font-weight);
  white-space: pre-wrap;
  word-break: break-word;
}

.repertory-view__preview-doc-note {
  color: var(--repertory-preview-meta-color);
}

.repertory-view__preview-meta-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin: var(--repertory-view-reset-spacing);
}

.repertory-view__preview-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-4);
  padding-bottom: var(--spacing-2);
  border-bottom: var(--repertory-preview-border-width) solid var(--repertory-preview-border-color);
}

.repertory-view__preview-meta-term {
  color: var(--repertory-preview-meta-color);
  font-family: var(--repertory-preview-meta-font-family);
  font-size: var(--repertory-preview-meta-font-size);
  line-height: var(--repertory-preview-meta-line-height);
  font-weight: var(--repertory-preview-meta-font-weight);
}

.repertory-view__preview-meta-value {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-preview-title-color);
  font-family: var(--repertory-preview-body-font-family);
  font-size: var(--repertory-preview-body-font-size);
  line-height: var(--repertory-preview-body-line-height);
  font-weight: var(--repertory-preview-body-font-weight);
  text-align: right;
  word-break: break-word;
}

.repertory-view__edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-modal-gap);
  width: 100%;
}

.repertory-view__tag-modal {
  --repertory-view-tag-modal-gap: var(--spacing-5);
  --repertory-view-tag-modal-border-color: var(--border-subtle-1);
  --repertory-view-tag-modal-border-width: var(--border-width-thin);
  --repertory-view-tag-modal-actions-gap: var(--spacing-3);

  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-tag-modal-gap);
  width: 100%;
}

.repertory-view__tag-modal-tabs {
  display: flex;
  max-width: 100%;
  overflow-x: auto;
  border-bottom: var(--repertory-view-tag-modal-border-width) solid
    var(--repertory-view-tag-modal-border-color);
}

.repertory-view__existing-tag-form {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-tag-modal-gap);
}

.repertory-view__tag-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--repertory-view-tag-modal-actions-gap);
}

@media (max-width: 767px) {
  .repertory-view__subheader {
    --repertory-view-subheader-padding-top: var(--spacing-2);
    --repertory-view-subheader-padding-x: var(--spacing-4);
  }

  .repertory-view {
    padding: var(--repertory-view-mobile-padding-y) var(--repertory-view-mobile-padding-x);
  }

  .repertory-view__control--search,
  .repertory-view__control--select {
    flex: 1 1 100%;
  }

  .repertory-view__preview-image {
    max-height: 200px;
  }

  .repertory-view__preview-pdf {
    height: 220px;
  }

  .repertory-view__preview-doc-body {
    min-height: 120px;
    max-height: 190px;
    padding: var(--spacing-4);
  }

  .repertory-view__preview-footer,
  .repertory-view__preview-doc-header {
    padding: var(--spacing-3) var(--spacing-4);
  }

  .repertory-view__tag-modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>
