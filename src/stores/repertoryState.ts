import { reactive } from 'vue'
import { getApiErrorMessage } from '@/api/errors'
import type { PaginatedResult } from '@/api/types/common'
import { useRepertoryApi } from '@/composables/api/useRepertoryApi'
import type {
  RepertoryAsset,
  RepertoryDocument,
  RepertoryHistoryEntry,
  RepertoryItemTagRef,
  RepertoryTag,
} from '@/types/repertory'

export const REPERTORY_PAGE_SIZE = 24

export type RepertoryItemKind = 'document' | 'asset'
export type CachedPreviewKind = 'image' | 'pdf' | 'text' | 'fallback'

export interface CachedRepertoryPreview {
  kind: CachedPreviewKind
  url?: string
  text?: string
  note?: string
  isObjectUrl?: boolean
}

export interface RepertoryPagedSlice<T> {
  items: T[]
  loaded: boolean
  nextCursor: string | null
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
}

export interface RepertoryTagsSlice {
  items: RepertoryTag[]
  loaded: boolean
  isLoading: boolean
  error: string | null
}

export interface ProjectRepertoryCache {
  documents: RepertoryPagedSlice<RepertoryDocument>
  assets: RepertoryPagedSlice<RepertoryAsset>
  tags: RepertoryTagsSlice
}

type PagedResourceType = 'documents' | 'assets'
type ResourceRequestType = PagedResourceType | 'tags'

const repertoryApi = useRepertoryApi()

const projectCachesState = reactive(new Map<number, ProjectRepertoryCache>())
const historyByKeyState = reactive(new Map<string, RepertoryHistoryEntry[]>())
const previewByKeyState = reactive(new Map<string, CachedRepertoryPreview>())

interface InFlightRequestEntry {
  token: symbol
  promise: Promise<unknown>
}

const inFlightRequests = new Map<string, InFlightRequestEntry>()
const sliceEpochs = new Map<string, number>()
let storeGeneration = 0

function createPagedSlice<T>(): RepertoryPagedSlice<T> {
  return {
    items: [],
    loaded: false,
    nextCursor: null,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    error: null,
  }
}

function createTagsSlice(): RepertoryTagsSlice {
  return {
    items: [],
    loaded: false,
    isLoading: false,
    error: null,
  }
}

function createProjectCache(): ProjectRepertoryCache {
  return {
    documents: createPagedSlice<RepertoryDocument>(),
    assets: createPagedSlice<RepertoryAsset>(),
    tags: createTagsSlice(),
  }
}

function getOrCreateProjectCache(projectId: number): ProjectRepertoryCache {
  let cache = projectCachesState.get(projectId)
  if (!cache) {
    projectCachesState.set(projectId, createProjectCache())
    cache = projectCachesState.get(projectId)!
  }
  return cache
}

function buildItemKey(projectId: number, kind: RepertoryItemKind, itemId: number): string {
  return `${projectId}:${kind}:${itemId}`
}

function buildRequestKey(
  projectId: number,
  resourceType: ResourceRequestType,
  mode: 'load' | 'more',
): string {
  return `${projectId}:${resourceType}:${mode}`
}

function getSliceEpoch(projectId: number, resourceType: ResourceRequestType): number {
  return sliceEpochs.get(`${projectId}:${resourceType}`) ?? 0
}

function bumpSliceEpoch(projectId: number, resourceType: ResourceRequestType): number {
  const next = getSliceEpoch(projectId, resourceType) + 1
  sliceEpochs.set(`${projectId}:${resourceType}`, next)
  return next
}

function revokePreviewUrlIfNeeded(preview: CachedRepertoryPreview | undefined): void {
  if (
    preview?.isObjectUrl &&
    preview.url &&
    typeof URL !== 'undefined' &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    URL.revokeObjectURL(preview.url)
  }
}

function prependPagedItem<T extends { id: number }>(slice: RepertoryPagedSlice<T>, item: T): void {
  slice.items = [item, ...slice.items.filter((existing) => existing.id !== item.id)]
}

function upsertPagedItem<T extends { id: number }>(slice: RepertoryPagedSlice<T>, item: T): void {
  const exists = slice.items.some((existing) => existing.id === item.id)
  if (exists) {
    slice.items = slice.items.map((existing) => (existing.id === item.id ? item : existing))
    return
  }
  slice.items = [item, ...slice.items]
}

function removePagedItem<T extends { id: number }>(
  slice: RepertoryPagedSlice<T>,
  itemId: number,
): void {
  slice.items = slice.items.filter((item) => item.id !== itemId)
}

function syncTagRefInSlice<T extends { tags: RepertoryItemTagRef[] }>(
  slice: RepertoryPagedSlice<T>,
  updatedTag: RepertoryTag,
): void {
  slice.items = slice.items.map((item) => {
    if (!item.tags.some((tag) => tag.id === updatedTag.id)) {
      return item
    }
    return {
      ...item,
      tags: item.tags.map((tag) =>
        tag.id === updatedTag.id
          ? { ...tag, label: updatedTag.label, color: updatedTag.color }
          : tag,
      ),
    }
  })
}

async function ensurePagedLoaded<T extends { id: number }>(
  projectId: number,
  resourceType: PagedResourceType,
  slice: RepertoryPagedSlice<T>,
  fetchPage: () => Promise<PaginatedResult<T>>,
  fallbackMessage: string,
  force = false,
): Promise<T[]> {
  if (!force && slice.loaded) {
    return slice.items
  }

  const key = buildRequestKey(projectId, resourceType, 'load')
  const existing = inFlightRequests.get(key)
  if (existing && !force) {
    return existing.promise as Promise<T[]>
  }

  const token = Symbol(key)
  const generation = storeGeneration
  const epoch = force
    ? bumpSliceEpoch(projectId, resourceType)
    : getSliceEpoch(projectId, resourceType)
  slice.isLoading = true
  slice.error = null

  const requestPromise = (async () => {
    try {
      const page = await fetchPage()
      if (generation !== storeGeneration || epoch !== getSliceEpoch(projectId, resourceType)) {
        return slice.items
      }
      slice.items = page.items
      slice.nextCursor = page.nextCursor
      slice.hasMore = page.hasMore
      slice.loaded = true
      slice.error = null
      return slice.items
    } catch (error) {
      if (generation === storeGeneration && epoch === getSliceEpoch(projectId, resourceType)) {
        slice.error = getApiErrorMessage(error, fallbackMessage)
      }
      throw error
    } finally {
      if (inFlightRequests.get(key)?.token === token) {
        inFlightRequests.delete(key)
        if (generation === storeGeneration) {
          slice.isLoading = false
        }
      }
    }
  })()

  inFlightRequests.set(key, { token, promise: requestPromise })
  return requestPromise
}

async function loadMorePaged<T extends { id: number }>(
  projectId: number,
  resourceType: PagedResourceType,
  slice: RepertoryPagedSlice<T>,
  fetchPage: (cursor: string) => Promise<PaginatedResult<T>>,
  fallbackMessage: string,
): Promise<T[]> {
  if (!slice.hasMore || !slice.nextCursor) {
    return slice.items
  }

  const key = buildRequestKey(projectId, resourceType, 'more')
  const existing = inFlightRequests.get(key)
  if (existing) {
    return existing.promise as Promise<T[]>
  }

  const token = Symbol(key)
  const cursorUsed = slice.nextCursor
  const generation = storeGeneration
  const epoch = getSliceEpoch(projectId, resourceType)
  slice.isLoadingMore = true
  slice.error = null

  const requestPromise = (async () => {
    try {
      const page = await fetchPage(cursorUsed)
      if (generation !== storeGeneration || epoch !== getSliceEpoch(projectId, resourceType)) {
        return slice.items
      }
      const seenIds = new Set(slice.items.map((item) => item.id))
      const appended = page.items.filter((item) => !seenIds.has(item.id))
      slice.items = [...slice.items, ...appended]
      slice.nextCursor = page.nextCursor
      slice.hasMore = page.hasMore
      slice.error = null
      return slice.items
    } catch (error) {
      if (generation === storeGeneration && epoch === getSliceEpoch(projectId, resourceType)) {
        slice.error = getApiErrorMessage(error, fallbackMessage)
      }
      throw error
    } finally {
      if (inFlightRequests.get(key)?.token === token) {
        inFlightRequests.delete(key)
        if (generation === storeGeneration) {
          slice.isLoadingMore = false
        }
      }
    }
  })()

  inFlightRequests.set(key, { token, promise: requestPromise })
  return requestPromise
}

async function ensureItemById<T extends { id: number }>(
  itemId: number,
  getSlice: () => RepertoryPagedSlice<T>,
  ensureLoaded: () => Promise<T[]>,
  loadMore: () => Promise<T[]>,
): Promise<T | null> {
  const findInSlice = () => getSlice().items.find((item) => item.id === itemId) ?? null

  const cached = findInSlice()
  if (cached) {
    return cached
  }

  if (!getSlice().loaded) {
    await ensureLoaded()
    const afterFirstPage = findInSlice()
    if (afterFirstPage) {
      return afterFirstPage
    }
  }

  while (getSlice().hasMore && getSlice().nextCursor) {
    const previousCursor = getSlice().nextCursor
    await loadMore()
    const found = findInSlice()
    if (found) {
      return found
    }
    if (getSlice().nextCursor === previousCursor) {
      break
    }
  }

  return null
}

/**
 * Clears cached repertory data, revoking any tracked preview object URLs.
 * When `projectId` is provided, only that project's cache is cleared.
 */
export function resetRepertory(projectId?: number): void {
  if (projectId !== undefined) {
    const prefix = `${projectId}:`
    projectCachesState.delete(projectId)

    for (const key of Array.from(inFlightRequests.keys())) {
      if (key.startsWith(prefix)) {
        inFlightRequests.delete(key)
      }
    }

    for (const resourceType of ['documents', 'assets', 'tags'] as const) {
      bumpSliceEpoch(projectId, resourceType)
    }

    for (const key of Array.from(historyByKeyState.keys())) {
      if (key.startsWith(prefix)) {
        historyByKeyState.delete(key)
      }
    }

    for (const [key, preview] of Array.from(previewByKeyState.entries())) {
      if (key.startsWith(prefix)) {
        revokePreviewUrlIfNeeded(preview)
        previewByKeyState.delete(key)
      }
    }
    return
  }

  storeGeneration += 1
  projectCachesState.clear()
  inFlightRequests.clear()
  sliceEpochs.clear()
  historyByKeyState.clear()

  for (const preview of previewByKeyState.values()) {
    revokePreviewUrlIfNeeded(preview)
  }
  previewByKeyState.clear()
}

/**
 * Resets singleton repertory cache state for isolated unit tests.
 */
export function _resetRepertoryForTesting(): void {
  resetRepertory()
}

/**
 * Exposes shared reactive repertory cache state, deduplicated loaders, and CRUD cache helpers.
 */
export function useRepertoryState() {
  function getProjectState(projectId: number): ProjectRepertoryCache {
    return getOrCreateProjectCache(projectId)
  }

  function getDocumentsState(projectId: number): RepertoryPagedSlice<RepertoryDocument> {
    return getOrCreateProjectCache(projectId).documents
  }

  function getAssetsState(projectId: number): RepertoryPagedSlice<RepertoryAsset> {
    return getOrCreateProjectCache(projectId).assets
  }

  function getTagsState(projectId: number): RepertoryTagsSlice {
    return getOrCreateProjectCache(projectId).tags
  }

  async function ensureDocumentsLoaded(
    projectId: number,
    force = false,
  ): Promise<RepertoryDocument[]> {
    const slice = getOrCreateProjectCache(projectId).documents
    return ensurePagedLoaded(
      projectId,
      'documents',
      slice,
      () => repertoryApi.listDocuments(projectId, { limit: REPERTORY_PAGE_SIZE }),
      'Não foi possível carregar os documentos do projeto.',
      force,
    )
  }

  async function loadMoreDocuments(projectId: number): Promise<RepertoryDocument[]> {
    const slice = getOrCreateProjectCache(projectId).documents
    return loadMorePaged(
      projectId,
      'documents',
      slice,
      (cursor) => repertoryApi.listDocuments(projectId, { limit: REPERTORY_PAGE_SIZE, cursor }),
      'Não foi possível carregar mais documentos do projeto.',
    )
  }

  async function ensureAssetsLoaded(projectId: number, force = false): Promise<RepertoryAsset[]> {
    const slice = getOrCreateProjectCache(projectId).assets
    return ensurePagedLoaded(
      projectId,
      'assets',
      slice,
      () => repertoryApi.listAssets(projectId, { limit: REPERTORY_PAGE_SIZE }),
      'Não foi possível carregar os assets do projeto.',
      force,
    )
  }

  async function loadMoreAssets(projectId: number): Promise<RepertoryAsset[]> {
    const slice = getOrCreateProjectCache(projectId).assets
    return loadMorePaged(
      projectId,
      'assets',
      slice,
      (cursor) => repertoryApi.listAssets(projectId, { limit: REPERTORY_PAGE_SIZE, cursor }),
      'Não foi possível carregar mais assets do projeto.',
    )
  }

  async function ensureTagsLoaded(projectId: number, force = false): Promise<RepertoryTag[]> {
    const slice = getOrCreateProjectCache(projectId).tags
    if (!force && slice.loaded) {
      return slice.items
    }

    const key = buildRequestKey(projectId, 'tags', 'load')
    const existing = inFlightRequests.get(key)
    if (existing && !force) {
      return existing.promise as Promise<RepertoryTag[]>
    }

    const token = Symbol(key)
    const generation = storeGeneration
    const epoch = force ? bumpSliceEpoch(projectId, 'tags') : getSliceEpoch(projectId, 'tags')
    slice.isLoading = true
    slice.error = null

    const requestPromise = (async () => {
      try {
        const items = await repertoryApi.listProjectTags(projectId)
        if (generation !== storeGeneration || epoch !== getSliceEpoch(projectId, 'tags')) {
          return slice.items
        }
        slice.items = items
        slice.loaded = true
        slice.error = null
        return slice.items
      } catch (error) {
        if (generation === storeGeneration && epoch === getSliceEpoch(projectId, 'tags')) {
          slice.error = getApiErrorMessage(error, 'Não foi possível carregar as tags do projeto.')
        }
        throw error
      } finally {
        if (inFlightRequests.get(key)?.token === token) {
          inFlightRequests.delete(key)
          if (generation === storeGeneration) {
            slice.isLoading = false
          }
        }
      }
    })()

    inFlightRequests.set(key, { token, promise: requestPromise })
    return requestPromise
  }

  async function ensureDocumentById(
    projectId: number,
    documentId: number,
  ): Promise<RepertoryDocument | null> {
    return ensureItemById(
      documentId,
      () => getOrCreateProjectCache(projectId).documents,
      () => ensureDocumentsLoaded(projectId),
      () => loadMoreDocuments(projectId),
    )
  }

  async function ensureAssetById(
    projectId: number,
    assetId: number,
  ): Promise<RepertoryAsset | null> {
    return ensureItemById(
      assetId,
      () => getOrCreateProjectCache(projectId).assets,
      () => ensureAssetsLoaded(projectId),
      () => loadMoreAssets(projectId),
    )
  }

  function getCachedPreview(
    projectId: number,
    kind: RepertoryItemKind,
    itemId: number,
  ): CachedRepertoryPreview | null {
    return previewByKeyState.get(buildItemKey(projectId, kind, itemId)) ?? null
  }

  function setCachedPreview(
    projectId: number,
    kind: RepertoryItemKind,
    itemId: number,
    preview: CachedRepertoryPreview,
  ): CachedRepertoryPreview {
    const key = buildItemKey(projectId, kind, itemId)
    const previous = previewByKeyState.get(key)
    if (previous && previous.url !== preview.url) {
      revokePreviewUrlIfNeeded(previous)
    }
    previewByKeyState.set(key, preview)
    return previewByKeyState.get(key)!
  }

  function invalidatePreview(projectId: number, kind: RepertoryItemKind, itemId: number): void {
    const key = buildItemKey(projectId, kind, itemId)
    const existing = previewByKeyState.get(key)
    revokePreviewUrlIfNeeded(existing)
    previewByKeyState.delete(key)
  }

  function getCachedHistory(
    projectId: number,
    kind: RepertoryItemKind,
    itemId: number,
  ): RepertoryHistoryEntry[] | null {
    return historyByKeyState.get(buildItemKey(projectId, kind, itemId)) ?? null
  }

  function setCachedHistory(
    projectId: number,
    kind: RepertoryItemKind,
    itemId: number,
    entries: RepertoryHistoryEntry[],
  ): RepertoryHistoryEntry[] {
    const key = buildItemKey(projectId, kind, itemId)
    historyByKeyState.set(key, [...entries])
    return historyByKeyState.get(key)!
  }

  function invalidateHistory(projectId: number, kind: RepertoryItemKind, itemId: number): void {
    historyByKeyState.delete(buildItemKey(projectId, kind, itemId))
  }

  function prependDocument(projectId: number, document: RepertoryDocument): void {
    prependPagedItem(getOrCreateProjectCache(projectId).documents, document)
  }

  function upsertDocument(projectId: number, document: RepertoryDocument): void {
    upsertPagedItem(getOrCreateProjectCache(projectId).documents, document)
  }

  function removeDocument(projectId: number, documentId: number): void {
    removePagedItem(getOrCreateProjectCache(projectId).documents, documentId)
    invalidatePreview(projectId, 'document', documentId)
    invalidateHistory(projectId, 'document', documentId)
  }

  function prependAsset(projectId: number, asset: RepertoryAsset): void {
    prependPagedItem(getOrCreateProjectCache(projectId).assets, asset)
  }

  function upsertAsset(projectId: number, asset: RepertoryAsset): void {
    upsertPagedItem(getOrCreateProjectCache(projectId).assets, asset)
  }

  function removeAsset(projectId: number, assetId: number): void {
    removePagedItem(getOrCreateProjectCache(projectId).assets, assetId)
    invalidatePreview(projectId, 'asset', assetId)
    invalidateHistory(projectId, 'asset', assetId)
  }

  function prependTag(projectId: number, tag: RepertoryTag): void {
    const slice = getOrCreateProjectCache(projectId).tags
    slice.items = [tag, ...slice.items.filter((existing) => existing.id !== tag.id)]
  }

  function upsertTag(projectId: number, tag: RepertoryTag): void {
    const cache = getOrCreateProjectCache(projectId)
    const exists = cache.tags.items.some((existing) => existing.id === tag.id)
    if (exists) {
      cache.tags.items = cache.tags.items.map((existing) =>
        existing.id === tag.id ? tag : existing,
      )
    } else {
      cache.tags.items = [tag, ...cache.tags.items]
    }
    syncTagRefInSlice(cache.documents, tag)
    syncTagRefInSlice(cache.assets, tag)
  }

  function removeTags(projectId: number, tagIds: number[]): void {
    if (tagIds.length === 0) {
      return
    }
    const idSet = new Set(tagIds)
    const cache = getOrCreateProjectCache(projectId)
    cache.tags.items = cache.tags.items.filter((tag) => !idSet.has(tag.id))
    cache.documents.items = cache.documents.items.map((doc) =>
      doc.tags.some((tag) => idSet.has(tag.id))
        ? { ...doc, tags: doc.tags.filter((tag) => !idSet.has(tag.id)) }
        : doc,
    )
    cache.assets.items = cache.assets.items.map((asset) =>
      asset.tags.some((tag) => idSet.has(tag.id))
        ? { ...asset, tags: asset.tags.filter((tag) => !idSet.has(tag.id)) }
        : asset,
    )
  }

  function updateItemTags(
    projectId: number,
    kind: RepertoryItemKind,
    itemId: number,
    tags: RepertoryItemTagRef[],
  ): void {
    const cache = getOrCreateProjectCache(projectId)
    const nextTags = tags.map((tag) => ({ ...tag }))
    if (kind === 'document') {
      cache.documents.items = cache.documents.items.map((doc) =>
        doc.id === itemId ? { ...doc, tags: nextTags } : doc,
      )
      return
    }
    cache.assets.items = cache.assets.items.map((asset) =>
      asset.id === itemId ? { ...asset, tags: nextTags } : asset,
    )
  }

  return {
    historyByKey: historyByKeyState,
    previewByKey: previewByKeyState,
    getProjectState,
    getDocumentsState,
    getAssetsState,
    getTagsState,
    ensureDocumentsLoaded,
    loadMoreDocuments,
    ensureAssetsLoaded,
    loadMoreAssets,
    ensureTagsLoaded,
    ensureDocumentById,
    ensureAssetById,
    getCachedPreview,
    setCachedPreview,
    invalidatePreview,
    getCachedHistory,
    setCachedHistory,
    invalidateHistory,
    prependDocument,
    upsertDocument,
    removeDocument,
    prependAsset,
    upsertAsset,
    removeAsset,
    prependTag,
    upsertTag,
    removeTags,
    updateItemTags,
    resetRepertory,
  }
}
