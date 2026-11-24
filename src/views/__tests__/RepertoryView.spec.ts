import { AxiosHeaders } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { apiClient, uploadFileToPresignedUrl } from '@/api/client'
import type {
  AssetSchema,
  AssetUploadSchema,
  DocumentSchema,
  DocumentUploadSchema,
  ResourceEventSchema,
  TagSchema,
} from '@/api/types/repertory'
import DocumentCard from '@/components/repertory/DocumentCard.vue'
import {
  ConfirmDialog,
  DataTable,
  DocumentForm,
  Modal,
  RepertoryItemDetails,
  Sheet,
  TabItem,
  Tag,
  TagForm,
  toast,
  useToasts,
} from '@/components/ui'
import { _resetAuthForTesting } from '@/stores/authState'
import { _resetRepertoryForTesting } from '@/stores/repertoryState'
import { _resetWorkspaceForTesting, useWorkspaceState } from '@/stores/workspaceState'
import RepertoryView from '../RepertoryView.vue'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    put: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  uploadFileToPresignedUrl: vi.fn<(...args: unknown[]) => Promise<void>>(),
  resolveApiUrl: vi.fn<(path: string) => string>(
    (path: string) => `/api${path.startsWith('/') ? path : `/${path}`}`,
  ),
  setUnauthorizedHandler: vi.fn<(...args: unknown[]) => void>(),
}))

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPut = vi.mocked(apiClient.put)
const mockedDelete = vi.mocked(apiClient.delete)
const mockedUpload = vi.mocked(uploadFileToPresignedUrl)

const DummyRouteView = defineComponent({
  template: '<div />',
})

const PROJECT_ID = 12

function makeTag(overrides: Partial<TagSchema> = {}): TagSchema {
  return {
    id: 1,
    project_id: PROJECT_ID,
    label: 'tokens',
    description: 'Variáveis semânticas do sistema.',
    color: '#F33FF0',
    ...overrides,
  }
}

function makeDoc(overrides: Partial<DocumentSchema> = {}): DocumentSchema {
  return {
    id: 44,
    project_id: PROJECT_ID,
    file: 'projects/12/documents/44/tokens-spec.md',
    file_extension: 'md',
    content_type: 'text/markdown',
    created_by_member_id: 3,
    name: 'Especificação de Tokens',
    description: 'Mapeamento semântico completo.',
    status: 'published',
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-21T10:00:00Z',
    tags: [makeTag()],
    ...overrides,
  }
}

function makeAsset(overrides: Partial<AssetSchema> = {}): AssetSchema {
  return {
    id: 8,
    project_id: PROJECT_ID,
    created_by_member_id: 5,
    file: 'projects/12/assets/8/diagrama.svg',
    name: 'Diagrama Multiagente',
    file_extension: 'svg',
    content_type: 'image/svg+xml',
    type: 'image',
    description: 'Fluxo visual entre agentes.',
    status: 'active',
    created_at: '2026-11-20T09:00:00Z',
    updated_at: '2026-11-21T10:00:00Z',
    tags: [makeTag({ id: 2, label: 'Marca', color: '#22C55E' })],
    ...overrides,
  }
}

function makeEvent(overrides: Partial<ResourceEventSchema> = {}): ResourceEventSchema {
  return {
    id: 100,
    project_id: PROJECT_ID,
    resource_type: 'document',
    resource_id: 44,
    author_member_id: 3,
    event_type: 'document_created',
    data: { original_filename: 'tokens-spec.md' },
    created_at: '2026-11-20T10:00:00Z',
    ...overrides,
  }
}

interface MockServerState {
  docs: DocumentSchema[]
  assets: AssetSchema[]
  tags: TagSchema[]
  docEvents: Record<number, ResourceEventSchema[]>
  assetEvents: Record<number, ResourceEventSchema[]>
  docBlobs: Record<number, Blob>
  assetBlobs: Record<number, Blob>
  docPages?: Record<
    string,
    { items: DocumentSchema[]; limit: number; more: boolean; cursor: string | null }
  >
  assetPages?: Record<
    string,
    { items: AssetSchema[]; limit: number; more: boolean; cursor: string | null }
  >
}

function createInitialServerState(): MockServerState {
  const tagTokens = makeTag({ id: 1, label: 'tokens', color: '#F33FF0' })
  const tagMarca = makeTag({
    id: 2,
    label: 'Marca',
    description: 'Identidade visual Prismon.',
    color: '#22C55E',
  })
  const tagGov = makeTag({
    id: 3,
    label: 'governança',
    description: 'Regras e conformidade.',
    color: '#3B82F6',
  })

  return {
    tags: [tagTokens, tagMarca, tagGov],
    docs: [
      makeDoc({
        id: 44,
        name: 'Especificação de Tokens',
        description: 'Mapeamento semântico completo.',
        status: 'published',
        tags: [tagTokens],
      }),
      makeDoc({
        id: 45,
        name: 'Playbook de Workflows IA',
        description: 'Orquestração multiagente.',
        status: 'draft',
        file: 'projects/12/documents/45/playbook.pdf',
        file_extension: 'pdf',
        content_type: 'application/pdf',
        tags: [],
      }),
    ],
    assets: [
      makeAsset({
        id: 8,
        name: 'Diagrama Multiagente',
        file_extension: 'svg',
        content_type: 'image/svg+xml',
        type: 'image',
        tags: [tagMarca],
      }),
      makeAsset({
        id: 9,
        file: 'projects/12/assets/9/hero.png',
        name: 'Hero Robô Prismon',
        file_extension: 'png',
        content_type: 'image/png',
        type: 'image',
        tags: [tagTokens],
      }),
    ],
    docEvents: {
      44: [makeEvent({ id: 101, resource_id: 44 })],
      45: [makeEvent({ id: 102, resource_id: 45 })],
    },
    assetEvents: {
      8: [
        makeEvent({ id: 201, resource_type: 'asset', resource_id: 8, event_type: 'asset_created' }),
      ],
      9: [
        makeEvent({ id: 202, resource_type: 'asset', resource_id: 9, event_type: 'asset_created' }),
      ],
    },
    docBlobs: {
      44: new Blob(['# Tokens\nSemântica pura para superfícies e bordas.'], {
        type: 'text/markdown',
      }),
      45: new Blob(['%PDF-1.4 mock'], { type: 'application/pdf' }),
    },
    assetBlobs: {
      8: new Blob(['<svg></svg>'], { type: 'image/svg+xml' }),
      9: new Blob(['png-bytes'], { type: 'image/png' }),
    },
  }
}

function setupApiMocks(state: MockServerState): void {
  let nextId = 500

  mockedGet.mockImplementation(async (url: unknown, config?: unknown) => {
    const path = String(url)
    const params = (config as { params?: { cursor?: string } } | undefined)?.params

    if (path === `/projects/${PROJECT_ID}/documents`) {
      if (state.docPages) {
        const pageKey = params?.cursor ?? 'initial'
        const page = state.docPages[pageKey] ?? {
          items: [],
          limit: 24,
          more: false,
          cursor: null,
        }
        return { data: page }
      }
      return { data: { items: state.docs, limit: 24, more: false, cursor: null } }
    }
    if (path === `/projects/${PROJECT_ID}/assets`) {
      if (state.assetPages) {
        const pageKey = params?.cursor ?? 'initial'
        const page = state.assetPages[pageKey] ?? {
          items: [],
          limit: 24,
          more: false,
          cursor: null,
        }
        return { data: page }
      }
      return { data: { items: state.assets, limit: 24, more: false, cursor: null } }
    }
    if (path === `/projects/${PROJECT_ID}/tags`) {
      return { data: { items: state.tags } }
    }

    const docEventsMatch = /^\/projects\/\d+\/documents\/(\d+)\/history$/.exec(path)
    if (docEventsMatch) {
      const docId = Number(docEventsMatch[1])
      return { data: { items: state.docEvents[docId] ?? [], next_cursor: null } }
    }

    const assetEventsMatch = /^\/projects\/\d+\/assets\/(\d+)\/history$/.exec(path)
    if (assetEventsMatch) {
      const assetId = Number(assetEventsMatch[1])
      return { data: { items: state.assetEvents[assetId] ?? [], next_cursor: null } }
    }

    const docTagsMatch = /^\/projects\/\d+\/documents\/(\d+)\/tags$/.exec(path)
    if (docTagsMatch) {
      const docId = Number(docTagsMatch[1])
      const doc = state.docs.find((d) => d.id === docId)
      return { data: { items: doc?.tags ?? [] } }
    }

    const assetTagsMatch = /^\/projects\/\d+\/assets\/(\d+)\/tags$/.exec(path)
    if (assetTagsMatch) {
      const assetId = Number(assetTagsMatch[1])
      const asset = state.assets.find((a) => a.id === assetId)
      return { data: { items: asset?.tags ?? [] } }
    }

    const docFileMatch = /^\/projects\/\d+\/documents\/(\d+)\/(?:file|download)$/.exec(path)
    if (docFileMatch) {
      const docId = Number(docFileMatch[1])
      const doc = state.docs.find((d) => d.id === docId)
      return {
        data: state.docBlobs[docId] ?? new Blob([''], { type: 'application/octet-stream' }),
        headers: new AxiosHeaders({
          'content-disposition': `attachment; filename="${doc?.file?.split('/').pop() ?? `doc-${docId}`}"`,
        }),
      }
    }

    const assetFileMatch = /^\/projects\/\d+\/assets\/(\d+)\/(?:file|download)$/.exec(path)
    if (assetFileMatch) {
      const assetId = Number(assetFileMatch[1])
      const asset = state.assets.find((a) => a.id === assetId)
      return {
        data: state.assetBlobs[assetId] ?? new Blob([''], { type: 'image/png' }),
        headers: new AxiosHeaders({
          'content-disposition': `attachment; filename="${asset?.file?.split('/').pop() ?? `asset-${assetId}`}"`,
        }),
      }
    }

    throw new Error(`Unhandled GET ${path}`)
  })

  mockedPost.mockImplementation(async (url: unknown, body: unknown) => {
    const path = String(url)

    if (path === `/projects/${PROJECT_ID}/documents`) {
      const payload = body as {
        name: string
        original_filename: string
        description?: string | null
        content_type?: string | null
      }
      const created: DocumentUploadSchema = {
        id: ++nextId,
        project_id: PROJECT_ID,
        file: `projects/${PROJECT_ID}/documents/${nextId}/${payload.original_filename}`,
        file_extension: payload.original_filename.split('.').pop() ?? null,
        content_type: payload.content_type ?? 'application/pdf',
        created_by_member_id: 1,
        name: payload.name,
        description: payload.description ?? null,
        status: 'pending',
        created_at: '2026-11-22T12:00:00Z',
        updated_at: '2026-11-22T12:00:00Z',
        tags: [],
        upload_url: 'https://storage.example.com/upload-doc',
        method: 'PUT',
        required_headers: {},
        expires_at: '2026-11-22T13:00:00Z',
      }
      state.docs = [created, ...state.docs]
      return { data: created }
    }

    if (path === `/projects/${PROJECT_ID}/assets`) {
      const payload = body as {
        name: string
        type: string
        original_filename: string
        description?: string | null
        content_type?: string | null
      }
      const created: AssetUploadSchema = {
        id: ++nextId,
        project_id: PROJECT_ID,
        created_by_member_id: 1,
        file: `projects/${PROJECT_ID}/assets/${nextId}/${payload.original_filename}`,
        name: payload.name,
        file_extension: payload.original_filename.split('.').pop() ?? null,
        content_type: payload.content_type ?? 'image/png',
        type: payload.type,
        description: payload.description ?? null,
        status: 'active',
        created_at: '2026-11-22T12:00:00Z',
        updated_at: '2026-11-22T12:00:00Z',
        tags: [],
        upload_url: 'https://storage.example.com/upload-asset',
        method: 'PUT',
        required_headers: {},
        expires_at: '2026-11-22T13:00:00Z',
      }
      state.assets = [created, ...state.assets]
      state.assetBlobs[created.id] = new Blob(['png-bytes'], {
        type: payload.content_type ?? 'image/png',
      })
      return { data: created }
    }

    if (path === `/projects/${PROJECT_ID}/tags`) {
      const payload = body as { label: string; description: string; color: string }
      const created: TagSchema = {
        id: ++nextId,
        project_id: PROJECT_ID,
        label: payload.label,
        description: payload.description,
        color: payload.color,
      }
      state.tags = [created, ...state.tags]
      return { data: created }
    }

    throw new Error(`Unhandled POST ${path}`)
  })

  mockedPut.mockImplementation(async (url: unknown, body: unknown) => {
    const path = String(url)

    const attachDocTagMatch = /^\/projects\/\d+\/documents\/(\d+)\/tags\/(\d+)$/.exec(path)
    if (attachDocTagMatch) {
      const docId = Number(attachDocTagMatch[1])
      const tagId = Number(attachDocTagMatch[2])
      const doc = state.docs.find((d) => d.id === docId)
      const tag = state.tags.find((t) => t.id === tagId)
      if (doc && tag && !(doc.tags ?? []).some((t) => t.id === tagId)) {
        doc.tags = [...(doc.tags ?? []), tag]
        state.docEvents[docId] = [
          makeEvent({
            id: ++nextId,
            resource_id: docId,
            event_type: 'tag_attached',
            data: { tag_label: tag.label },
          }),
          ...(state.docEvents[docId] ?? []),
        ]
      }
      return { data: null }
    }

    const attachAssetTagMatch = /^\/projects\/\d+\/assets\/(\d+)\/tags\/(\d+)$/.exec(path)
    if (attachAssetTagMatch) {
      const assetId = Number(attachAssetTagMatch[1])
      const tagId = Number(attachAssetTagMatch[2])
      const asset = state.assets.find((a) => a.id === assetId)
      const tag = state.tags.find((t) => t.id === tagId)
      if (asset && tag && !(asset.tags ?? []).some((t) => t.id === tagId)) {
        asset.tags = [...(asset.tags ?? []), tag]
      }
      return { data: null }
    }

    const docMatch = /^\/projects\/\d+\/documents\/(\d+)$/.exec(path)
    if (docMatch) {
      const docId = Number(docMatch[1])
      const payload = body as { name?: string | null; description?: string | null }
      const doc = state.docs.find((d) => d.id === docId)!
      const updated: DocumentSchema = {
        ...doc,
        name: payload.name ?? doc.name,
        description: payload.description !== undefined ? payload.description : doc.description,
      }
      state.docs = state.docs.map((d) => (d.id === docId ? updated : d))
      return { data: updated }
    }

    const assetMatch = /^\/projects\/\d+\/assets\/(\d+)$/.exec(path)
    if (assetMatch) {
      const assetId = Number(assetMatch[1])
      const payload = body as {
        name?: string | null
        description?: string | null
        type?: string | null
      }
      const asset = state.assets.find((a) => a.id === assetId)!
      const updated: AssetSchema = {
        ...asset,
        name: payload.name ?? asset.name,
        description: payload.description !== undefined ? payload.description : asset.description,
        type: payload.type ?? asset.type,
      }
      state.assets = state.assets.map((a) => (a.id === assetId ? updated : a))
      return { data: updated }
    }

    const tagMatch = /^\/projects\/\d+\/tags\/(\d+)$/.exec(path)
    if (tagMatch) {
      const tagId = Number(tagMatch[1])
      const payload = body as {
        label?: string | null
        description?: string | null
        color?: string | null
      }
      const tag = state.tags.find((t) => t.id === tagId)!
      const updated: TagSchema = {
        ...tag,
        label: payload.label ?? tag.label,
        description: payload.description ?? tag.description,
        color: payload.color ?? tag.color,
      }
      state.tags = state.tags.map((t) => (t.id === tagId ? updated : t))
      return { data: updated }
    }

    throw new Error(`Unhandled PUT ${path}`)
  })

  mockedDelete.mockImplementation(async (url: unknown) => {
    const path = String(url)

    const detachDocTagMatch = /^\/projects\/\d+\/documents\/(\d+)\/tags\/(\d+)$/.exec(path)
    if (detachDocTagMatch) {
      const docId = Number(detachDocTagMatch[1])
      const tagId = Number(detachDocTagMatch[2])
      const doc = state.docs.find((d) => d.id === docId)
      if (doc) {
        doc.tags = (doc.tags ?? []).filter((t) => t.id !== tagId)
      }
      return { data: null }
    }

    const detachAssetTagMatch = /^\/projects\/\d+\/assets\/(\d+)\/tags\/(\d+)$/.exec(path)
    if (detachAssetTagMatch) {
      const assetId = Number(detachAssetTagMatch[1])
      const tagId = Number(detachAssetTagMatch[2])
      const asset = state.assets.find((a) => a.id === assetId)
      if (asset) {
        asset.tags = (asset.tags ?? []).filter((t) => t.id !== tagId)
      }
      return { data: null }
    }

    const docMatch = /^\/projects\/\d+\/documents\/(\d+)$/.exec(path)
    if (docMatch) {
      const docId = Number(docMatch[1])
      state.docs = state.docs.filter((d) => d.id !== docId)
      return { data: null }
    }

    const assetMatch = /^\/projects\/\d+\/assets\/(\d+)$/.exec(path)
    if (assetMatch) {
      const assetId = Number(assetMatch[1])
      state.assets = state.assets.filter((a) => a.id !== assetId)
      return { data: null }
    }

    const tagMatch = /^\/projects\/\d+\/tags\/(\d+)$/.exec(path)
    if (tagMatch) {
      const tagId = Number(tagMatch[1])
      state.tags = state.tags.filter((t) => t.id !== tagId)
      return { data: null }
    }

    throw new Error(`Unhandled DELETE ${path}`)
  })

  mockedUpload.mockResolvedValue(undefined)
}

function seedActiveWorkspace(activeId: number | null = PROJECT_ID): void {
  const workspace = useWorkspaceState()
  workspace.projects.value = [
    {
      id: PROJECT_ID,
      name: 'Prismon Core',
      ownerId: 1,
      createdAt: '2026-11-20T00:00:00Z',
      updatedAt: '2026-11-20T00:00:00Z',
      createdAtLabel: '20 nov 2026',
      icon: 'folder',
    },
  ]
  workspace.activeProjectId.value = activeId
}

async function createTestRouter(
  initialPath = `/projetos/${PROJECT_ID}/repertorio/documentos`,
): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/repertorio', name: 'legacy-repertory', component: RepertoryView },
      {
        path: '/projetos/:projectId/repertorio',
        name: 'repertory',
        component: RepertoryView,
      },
      {
        path: '/projetos/:projectId/repertorio/documentos',
        name: 'repertory-documents',
        component: RepertoryView,
      },
      {
        path: '/projetos/:projectId/repertorio/documentos/:itemId',
        name: 'repertory-document-detail',
        component: RepertoryView,
      },
      {
        path: '/projetos/:projectId/repertorio/assets',
        name: 'repertory-assets',
        component: RepertoryView,
      },
      {
        path: '/projetos/:projectId/repertorio/assets/:itemId',
        name: 'repertory-asset-detail',
        component: RepertoryView,
      },
      {
        path: '/projetos/:projectId/repertorio/tags',
        name: 'repertory-tags',
        component: RepertoryView,
      },
      { path: '/chat', name: 'chat', component: DummyRouteView },
      { path: '/membros', name: 'members', component: DummyRouteView },
      { path: '/api-keys', name: 'api-keys', component: DummyRouteView },
    ],
  })

  await router.push(initialPath)
  await router.isReady()
  return router
}

async function chooseSelectOption(
  container: VueWrapper,
  comboboxSelector: string,
  optionLabel: string,
): Promise<void> {
  const combobox = container.find(comboboxSelector)
  expect(combobox.exists()).toBe(true)
  await combobox.trigger('click')
  await flushPromises()

  const options = container.findAll('[role="option"]')
  const match = options.find((opt) => opt.text().trim() === optionLabel)
  expect(match?.exists()).toBe(true)
  await match!.trigger('click')
  await flushPromises()
}

async function attachFileToForm(formWrapper: VueWrapper, file: File): Promise<void> {
  const input = formWrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', {
    value: [file],
    configurable: true,
  })
  await input.trigger('change')
  await flushPromises()
}

let wrapper: VueWrapper | undefined
let objectUrlCounter = 0
let createObjectUrlSpy: ReturnType<typeof vi.spyOn>
let revokeObjectUrlSpy: ReturnType<typeof vi.spyOn>
let anchorClickSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.clearAllMocks()
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetRepertoryForTesting()
  _resetWorkspaceForTesting()
  objectUrlCounter = 0

  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', {
      value: () => '',
      configurable: true,
      writable: true,
    })
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: () => undefined,
      configurable: true,
      writable: true,
    })
  }

  createObjectUrlSpy = vi
    .spyOn(URL, 'createObjectURL')
    .mockImplementation(() => `blob:mock-${++objectUrlCounter}`)
  revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  anchorClickSpy = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => undefined)
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetRepertoryForTesting()
  _resetWorkspaceForTesting()
  document.body.style.overflow = ''
  vi.restoreAllMocks()
})

describe('RepertoryView', () => {
  it('shows empty project state when activeProjectId is missing', async () => {
    seedActiveWorkspace(null)
    const router = await createTestRouter('/repertorio')

    wrapper = mount(RepertoryView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('nenhum projeto selecionado')
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('loads real documents, filters by status/tag/search, previews blob + history in Sheet, links/unlinks tags, edits, downloads, and deletes', async () => {
    const state = createInitialServerState()
    setupApiMocks(state)
    seedActiveWorkspace(PROJECT_ID)

    const router = await createTestRouter()
    const { toasts } = useToasts()

    wrapper = mount(RepertoryView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(mockedGet).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/documents`, {
      params: { limit: 24 },
    })
    expect(mockedGet).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/tags`)
    expect(mockedGet).not.toHaveBeenCalledWith(
      `/projects/${PROJECT_ID}/assets`,
      expect.anything(),
    )

    const initialCards = wrapper.findAllComponents(DocumentCard)
    expect(initialCards).toHaveLength(2)
    expect(initialCards[0]?.props('tags')).toEqual([
      expect.objectContaining({ id: '1', label: 'tokens', color: '#F33FF0' }),
    ])

    // Filter by DocumentStatusApi ('draft') via custom Select
    await chooseSelectOption(wrapper, '[role="combobox"][aria-label="Filtrar por status"]', 'Rascunho')

    let visibleCards = wrapper.findAllComponents(DocumentCard)
    expect(visibleCards).toHaveLength(1)
    expect(visibleCards[0]?.props('title')).toBe('Playbook de Workflows IA')

    // Clear filters
    const clearButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === 'limpar filtros')
    await clearButton?.trigger('click')
    await flushPromises()
    expect(wrapper.findAllComponents(DocumentCard)).toHaveLength(2)

    // Filter by tag via custom Select
    await chooseSelectOption(wrapper, '[role="combobox"][aria-label="Filtrar por tag"]', 'tokens')
    visibleCards = wrapper.findAllComponents(DocumentCard)
    expect(visibleCards).toHaveLength(1)
    expect(visibleCards[0]?.props('title')).toBe('Especificação de Tokens')

    const filterTag = wrapper.find('.repertory-view__active-filters').findComponent(Tag)
    expect(filterTag.props('label')).toBe('tokens')
    expect(filterTag.props('color')).toBe('#F33FF0')

    // Open Sheet on card click -> navigates to detail sub-route & loads history + file blob preview
    await visibleCards[0]?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('repertory-document-detail')
    expect(router.currentRoute.value.params.itemId).toBe('44')
    expect(mockedGet).toHaveBeenCalledWith(
      `/projects/${PROJECT_ID}/documents/44/history`,
      undefined,
    )
    expect(mockedGet).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/documents/44/file`, {
      responseType: 'blob',
    })

    const sheet = wrapper.findComponent(Sheet)
    expect(sheet.props('open')).toBe(true)
    expect(sheet.find('.sheet__stage .repertory-view__preview-excerpt').text()).toContain(
      'Semântica pura para superfícies e bordas.',
    )

    const details = sheet.findComponent(RepertoryItemDetails)
    expect(details.props('history')).toHaveLength(1)
    expect(details.props('tags')).toEqual([
      expect.objectContaining({ id: '1', label: 'tokens', color: '#F33FF0' }),
    ])

    // Download via header action
    await details.find('button[aria-label="Baixar Especificação de Tokens"]').trigger('click')
    await flushPromises()
    expect(anchorClickSpy).toHaveBeenCalled()

    // Open "adicionar tag" modal and link existing tag by numeric id
    await details.find('button[aria-label="Adicionar tag"]').trigger('click')
    await flushPromises()

    const addTagModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'adicionar tag')!
    expect(addTagModal.props('open')).toBe(true)
    expect(addTagModal.props('size')).toBe('md')

    await chooseSelectOption(addTagModal, '[role="combobox"]', 'governança')
    await addTagModal.find('form').trigger('submit')
    await flushPromises()

    expect(mockedPut).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/documents/44/tags/3`)
    expect(details.props('tags')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '3', label: 'governança', color: '#3B82F6' }),
      ]),
    )
    expect(details.props('history')).toHaveLength(2)

    // Re-open and create new tag with #RRGGBB color validation
    await details.find('button[aria-label="Adicionar tag"]').trigger('click')
    await flushPromises()

    const createTab = addTagModal
      .findAllComponents(TabItem)
      .find((tab) => tab.props('label') === 'criar nova tag')
    await createTab?.trigger('click')
    await flushPromises()

    const itemTagForm = addTagModal.findComponent(TagForm)
    expect(itemTagForm.props('showColor')).toBe(true)

    await itemTagForm.find('input[type="text"]').setValue('compliance-ia')
    await itemTagForm.find('textarea').setValue('Regra de auditoria.')
    await itemTagForm.find('input[placeholder="#f33ff0"]').setValue('#10B981')
    await itemTagForm.find('form').trigger('submit')
    await flushPromises()

    expect(mockedPost).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/tags`, {
      label: 'compliance-ia',
      description: 'Regra de auditoria.',
      color: '#10B981',
    })
    expect(details.props('tags')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'compliance-ia', color: '#10B981' }),
      ]),
    )

    // Unlink tag from RepertoryItemDetails
    const govTag = details.findAllComponents(Tag).find((t) => t.props('label') === 'governança')!
    await govTag.find('.tag__dismiss').trigger('click')
    await flushPromises()
    expect(mockedDelete).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/documents/44/tags/3`)

    // Edit metadata modal
    await details.find('button[aria-label="Editar Especificação de Tokens"]').trigger('click')
    await flushPromises()

    const editModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'editar documento')!
    expect(editModal.props('open')).toBe(true)
    expect(editModal.props('size')).toBe('md')
    await editModal.find('input[type="text"]').setValue('Especificação de Tokens v2')
    await editModal.find('form').trigger('submit')
    await flushPromises()

    expect(mockedPut).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/documents/44`, {
      name: 'Especificação de Tokens v2',
      description: 'Mapeamento semântico completo.',
    })
    expect(details.props('title')).toBe('Especificação de Tokens v2')

    // Delete document via ConfirmDialog
    await details.find('button[aria-label="Excluir Especificação de Tokens v2"]').trigger('click')
    await flushPromises()

    const confirmDialog = wrapper
      .findAllComponents(ConfirmDialog)
      .find((d) => d.props('title') === 'excluir documento')!
    expect(confirmDialog.props('open')).toBe(true)
    const confirmBtn = confirmDialog
      .findAll('button')
      .find((btn) => btn.text().includes('Excluir documento'))
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(mockedDelete).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/documents/44`)
    expect(sheet.props('open')).toBe(false)
    expect(router.currentRoute.value.name).toBe('repertory-documents')
    expect(toasts.value.some((item) => item.type === 'success')).toBe(true)
  })

  it('requires file when creating a document and executes presigned upload', async () => {
    const state = createInitialServerState()
    setupApiMocks(state)
    seedActiveWorkspace(PROJECT_ID)

    const router = await createTestRouter()
    wrapper = mount(RepertoryView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const newDocBtn = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === 'novo documento')
    await newDocBtn?.trigger('click')
    await flushPromises()

    const newDocModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'novo documento')!
    expect(newDocModal.props('size')).toBe('md')
    const docForm = newDocModal.findComponent(DocumentForm)

    // Submit without file -> blocked by fileError
    await docForm.find('input[type="text"]').setValue('Política LGPD')
    await docForm.find('form').trigger('submit')
    await flushPromises()

    expect(docForm.props('fileError')).toBeTruthy()
    expect(mockedPost).not.toHaveBeenCalled()

    // Attach file and submit -> 2-step presigned upload
    const pdfFile = new File(['pdf-content'], 'lgpd.pdf', { type: 'application/pdf' })
    await attachFileToForm(docForm, pdfFile)
    await docForm.find('textarea').setValue('Diretrizes de privacidade.')
    await docForm.find('form').trigger('submit')
    await flushPromises()

    expect(mockedPost).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/documents`, {
      name: 'Política LGPD',
      original_filename: 'lgpd.pdf',
      description: 'Diretrizes de privacidade.',
      content_type: 'application/pdf',
    })
    expect(mockedUpload).toHaveBeenCalledWith(
      'https://storage.example.com/upload-doc',
      pdfFile,
      'PUT',
      {},
    )
    expect(newDocModal.props('open')).toBe(false)
    expect(wrapper.findAllComponents(DocumentCard)[0]?.props('title')).toBe('Política LGPD')
  })

  it('renders assets tab, caches image blob preview across close/reopen, uploads asset with file required, edits and deletes', async () => {
    const state = createInitialServerState()
    setupApiMocks(state)
    seedActiveWorkspace(PROJECT_ID)

    const router = await createTestRouter()
    wrapper = mount(RepertoryView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const assetsTab = wrapper.findAllComponents(TabItem).find((t) => t.props('label') === 'assets')
    await assetsTab?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('repertory-assets')
    expect(mockedGet).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/assets`, {
      params: { limit: 24 },
    })

    const cards = wrapper.findAllComponents(DocumentCard)
    expect(cards).toHaveLength(2)
    expect(cards[0]?.props('thumbnailUrl')).toBe(`/api/projects/${PROJECT_ID}/assets/8/file`)
    expect(cards[0]?.props('tags')).toEqual([
      expect.objectContaining({ id: '2', label: 'Marca', color: '#22C55E' }),
    ])

    // Filter by format via custom Select
    await chooseSelectOption(
      wrapper,
      '[role="combobox"][aria-label="Filtrar asset por formato"]',
      'SVG',
    )
    expect(wrapper.findAllComponents(DocumentCard)).toHaveLength(1)

    // Open asset Sheet -> fetches blob preview + history
    await wrapper.findAllComponents(DocumentCard)[0]?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('repertory-asset-detail')
    expect(mockedGet).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/assets/8/history`, undefined)
    expect(mockedGet).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/assets/8/file`, {
      responseType: 'blob',
    })
    expect(createObjectUrlSpy).toHaveBeenCalled()

    const sheet = wrapper.findComponent(Sheet)
    expect(sheet.find('img.repertory-view__preview-image').attributes('src')).toContain(
      'blob:mock-',
    )

    // Close Sheet -> keeps cached ObjectURL alive (no immediate revokeObjectURL) and returns to assets route
    await sheet.find('button[aria-label="Fechar painel"]').trigger('click')
    await flushPromises()
    expect(revokeObjectUrlSpy).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('repertory-assets')

    // Reopen asset 8 -> preview & history hit cache (no extra GET calls)
    const getCountBeforeReopen = mockedGet.mock.calls.length
    await wrapper.findAllComponents(DocumentCard)[0]?.trigger('click')
    await flushPromises()
    expect(mockedGet.mock.calls.length).toBe(getCountBeforeReopen)
    expect(sheet.find('img.repertory-view__preview-image').attributes('src')).toContain(
      'blob:mock-1',
    )

    await sheet.find('button[aria-label="Fechar painel"]').trigger('click')
    await flushPromises()

    // Clear format filter so all assets (including new PNG upload) are visible
    await chooseSelectOption(
      wrapper,
      '[role="combobox"][aria-label="Filtrar asset por formato"]',
      'todos os formatos',
    )

    // Upload new asset requiring file
    const newAssetBtn = wrapper.findAll('button').find((b) => b.text().includes('novo asset'))
    await newAssetBtn?.trigger('click')
    await flushPromises()

    const newAssetModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'novo asset')!
    expect(newAssetModal.props('size')).toBe('md')
    const assetForm = newAssetModal.findComponent(DocumentForm)

    await assetForm.find('input[type="text"]').setValue('Banner Agentes')
    await assetForm.find('form').trigger('submit')
    await flushPromises()
    expect(assetForm.props('fileError')).toBeTruthy()

    const pngFile = new File(['png-data'], 'banner.png', { type: 'image/png' })
    await attachFileToForm(assetForm, pngFile)
    await assetForm.find('form').trigger('submit')
    await flushPromises()

    expect(mockedPost).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/assets`, {
      name: 'Banner Agentes',
      type: 'image',
      original_filename: 'banner.png',
      description: null,
      content_type: 'image/png',
    })
    expect(mockedUpload).toHaveBeenCalledWith(
      'https://storage.example.com/upload-asset',
      pngFile,
      'PUT',
      {},
    )
    expect(newAssetModal.props('open')).toBe(false)
    expect(wrapper.findAllComponents(DocumentCard)[0]?.props('title')).toBe('Banner Agentes')

    // Open newly uploaded asset Sheet -> edit metadata & delete asset (revokes its cached ObjectURL)
    await wrapper.findAllComponents(DocumentCard)[0]?.trigger('click')
    await flushPromises()

    const details = sheet.findComponent(RepertoryItemDetails)
    await details.find('button[aria-label="Editar Banner Agentes"]').trigger('click')
    await flushPromises()

    const editAssetModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'editar asset')!
    expect(editAssetModal.props('size')).toBe('md')
    await editAssetModal.find('input[type="text"]').setValue('Banner Agentes v2')
    await editAssetModal.find('form').trigger('submit')
    await flushPromises()

    expect(mockedPut).toHaveBeenCalledWith(
      `/projects/${PROJECT_ID}/assets/501`,
      expect.objectContaining({ name: 'Banner Agentes v2' }),
    )

    await details.find('button[aria-label="Excluir Banner Agentes v2"]').trigger('click')
    await flushPromises()

    const confirmDialog = wrapper
      .findAllComponents(ConfirmDialog)
      .find((d) => d.props('title') === 'excluir asset')!
    const confirmBtn = confirmDialog
      .findAll('button')
      .find((btn) => btn.text().includes('Excluir asset'))
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(mockedDelete).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/assets/501`)
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:mock-2')
    expect(sheet.props('open')).toBe(false)
    expect(router.currentRoute.value.name).toBe('repertory-assets')
  })

  it('renders tags table without Ações column, renders colored Tag, edits via BatchActionBar, and batch deletes', async () => {
    const state = createInitialServerState()
    setupApiMocks(state)
    seedActiveWorkspace(PROJECT_ID)

    const router = await createTestRouter()
    wrapper = mount(RepertoryView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const tagsTab = wrapper.findAllComponents(TabItem).find((t) => t.props('label') === 'tags')
    await tagsTab?.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('repertory-tags')

    const tagsTable = wrapper.findComponent(DataTable)
    const columnLabels = tagsTable.props('columns').map((c: { label: string }) => c.label)
    expect(columnLabels).toEqual(['Nome', 'Cor', 'Descrição'])

    const swatch = tagsTable.find('.repertory-view__tag-color-swatch')
    expect(swatch.exists()).toBe(true)
    expect(tagsTable.text()).toContain('#F33FF0')

    const firstRowTag = tagsTable.findComponent(Tag)
    expect(firstRowTag.props('label')).toBe('tokens')
    expect(firstRowTag.props('color')).toBe('#F33FF0')

    // Open "nova tag" modal -> validate hex color regex before API call
    const newTagBtn = tagsTable.findAll('button').find((b) => b.text().trim() === 'nova tag')
    await newTagBtn?.trigger('click')
    await flushPromises()

    const newTagModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'nova tag')!
    expect(newTagModal.props('size')).toBe('md')
    const tagForm = newTagModal.findComponent(TagForm)
    expect(tagForm.props('showColor')).toBe(true)

    await tagForm.find('input[type="text"]').setValue('lgpd')
    await tagForm.find('input[placeholder="#f33ff0"]').setValue('invalido')
    await tagForm.find('form').trigger('submit')
    await flushPromises()

    expect(tagForm.props('colorError')).toBeTruthy()
    expect(mockedPost).not.toHaveBeenCalled()

    await tagForm.find('input[placeholder="#f33ff0"]').setValue('#A855F7')
    await tagForm.find('textarea').setValue('Privacidade e proteção de dados.')
    await tagForm.find('form').trigger('submit')
    await flushPromises()

    expect(mockedPost).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/tags`, {
      label: 'lgpd',
      description: 'Privacidade e proteção de dados.',
      color: '#A855F7',
    })
    expect(newTagModal.props('open')).toBe(false)
    expect(tagsTable.text()).toContain('lgpd')

    // Select 1 row -> BatchActionBar exposes "editar" and "remover"
    let rows = tagsTable.findAll('tbody .data-table__row')
    await rows[0]?.trigger('click')
    await flushPromises()

    const editBatchBtn = tagsTable
      .find('.batch-action-bar')
      .findAll('button')
      .find((b) => b.text().includes('editar'))
    expect(editBatchBtn?.exists()).toBe(true)
    await editBatchBtn?.trigger('click')
    await flushPromises()

    const editTagModal = wrapper
      .findAllComponents(Modal)
      .find((m) => m.props('title') === 'editar tag')!
    expect(editTagModal.props('open')).toBe(true)
    expect(editTagModal.props('size')).toBe('md')
    const editTagForm = editTagModal.findComponent(TagForm)
    await editTagForm.find('input[type="text"]').setValue('lgpd-v2')
    await editTagForm.find('form').trigger('submit')
    await flushPromises()

    expect(mockedPut).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/tags/501`, {
      label: 'lgpd-v2',
      description: 'Privacidade e proteção de dados.',
      color: '#A855F7',
    })
    expect(tagsTable.text()).toContain('lgpd-v2')

    // Select a second row -> "editar" disappears, only "remover" remains
    rows = tagsTable.findAll('tbody .data-table__row')
    await rows[1]?.trigger('click')
    await flushPromises()

    const batchBar = tagsTable.find('.batch-action-bar')
    expect(batchBar.findAll('button').some((b) => b.text().includes('editar'))).toBe(false)

    const deleteBatchBtn = batchBar
      .findAll('button')
      .find((b) => b.text().includes('remover'))
    await deleteBatchBtn?.trigger('click')
    await flushPromises()

    const confirmDialog = wrapper
      .findAllComponents(ConfirmDialog)
      .find((d) => d.props('title') === 'remover tags selecionadas')!
    const confirmBtn = confirmDialog
      .findAll('button')
      .find((b) => b.text().includes('Remover tags'))
    await confirmBtn?.trigger('click')
    await flushPromises()

    expect(mockedDelete).toHaveBeenCalledTimes(2)
    expect(tagsTable.props('selectedRowKeys')).toHaveLength(0)
  })

  it('reuses cached repertory state and Sheet preview on remount without extra GETs', async () => {
    const state = createInitialServerState()
    setupApiMocks(state)
    seedActiveWorkspace(PROJECT_ID)

    const router = await createTestRouter()
    wrapper = mount(RepertoryView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    // Open doc 44 once to populate preview & history cache
    await wrapper.findAllComponents(DocumentCard)[0]?.trigger('click')
    await flushPromises()
    await wrapper.findComponent(Sheet).find('button[aria-label="Fechar painel"]').trigger('click')
    await flushPromises()

    const totalGetsAfterFirstVisit = mockedGet.mock.calls.length
    expect(totalGetsAfterFirstVisit).toBe(4) // documents, tags, doc 44 history, doc 44 file

    wrapper.unmount()

    // Remount view -> immediate render from cache with zero blocking spinner or GETs
    const router2 = await createTestRouter()
    wrapper = mount(RepertoryView, {
      global: { plugins: [router2] },
    })
    await flushPromises()

    expect(mockedGet).toHaveBeenCalledTimes(totalGetsAfterFirstVisit)
    expect(wrapper.text()).not.toContain('carregando repertório...')
    expect(wrapper.findAllComponents(DocumentCard)).toHaveLength(2)

    // Reopen doc 44 -> preview & history come from cache with zero GETs
    await wrapper.findAllComponents(DocumentCard)[0]?.trigger('click')
    await flushPromises()

    expect(mockedGet).toHaveBeenCalledTimes(totalGetsAfterFirstVisit)
    const sheet = wrapper.findComponent(Sheet)
    expect(sheet.props('open')).toBe(true)
    expect(sheet.find('.repertory-view__preview-excerpt').text()).toContain(
      'Semântica pura para superfícies e bordas.',
    )
    expect(sheet.findComponent(RepertoryItemDetails).props('history')).toHaveLength(1)
  })

  it('loads additional document pages via "carregar mais" button when hasMore is true', async () => {
    const state = createInitialServerState()
    state.docPages = {
      initial: { items: [state.docs[0]!], limit: 24, more: true, cursor: 'cursor-page-2' },
      'cursor-page-2': { items: [state.docs[1]!], limit: 24, more: false, cursor: null },
    }
    setupApiMocks(state)
    seedActiveWorkspace(PROJECT_ID)

    const router = await createTestRouter()
    wrapper = mount(RepertoryView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    expect(wrapper.findAllComponents(DocumentCard)).toHaveLength(1)
    const loadMoreBtn = wrapper
      .findAll('button')
      .find((b) => b.text().trim() === 'carregar mais')
    expect(loadMoreBtn?.exists()).toBe(true)

    await loadMoreBtn!.trigger('click')
    await flushPromises()

    expect(mockedGet).toHaveBeenCalledWith(`/projects/${PROJECT_ID}/documents`, {
      params: { limit: 24, cursor: 'cursor-page-2' },
    })
    expect(wrapper.findAllComponents(DocumentCard)).toHaveLength(2)
    expect(
      wrapper.findAll('button').some((b) => b.text().trim() === 'carregar mais'),
    ).toBe(false)
  })

  it('supports deep-linking to /projetos/:projectId/repertorio/documentos/:itemId and redirects when missing', async () => {
    const state = createInitialServerState()
    setupApiMocks(state)
    seedActiveWorkspace(PROJECT_ID)

    const router = await createTestRouter(`/projetos/${PROJECT_ID}/repertorio/documentos/44`)
    wrapper = mount(RepertoryView, {
      global: { plugins: [router] },
    })
    await flushPromises()

    const sheet = wrapper.findComponent(Sheet)
    expect(sheet.props('open')).toBe(true)
    expect(sheet.findComponent(RepertoryItemDetails).props('title')).toBe(
      'Especificação de Tokens',
    )
    expect(sheet.find('.repertory-view__preview-excerpt').text()).toContain(
      'Semântica pura para superfícies e bordas.',
    )

    // Closing Sheet returns to list sub-route
    await sheet.find('button[aria-label="Fechar painel"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('repertory-documents')

    // Missing item deep-link shows error toast and redirects to list sub-route
    const { toasts } = useToasts()
    await router.push(`/projetos/${PROJECT_ID}/repertorio/documentos/999`)
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('repertory-documents')
    expect(
      toasts.value.some(
        (t) => t.type === 'error' && (t.title ?? '').includes('Documento não encontrado.'),
      ),
    ).toBe(true)
  })
})
