import { apiClient, resolveApiUrl, uploadFileToPresignedUrl } from '@/api/client'
import { parseApiError } from '@/api/errors'
import {
  mapAssetFromApi,
  mapCreateTagToApi,
  mapDocumentFromApi,
  mapReplaceAssetUploadToApi,
  mapReplaceDocumentUploadToApi,
  mapResourceEventFromApi,
  mapStartAssetUploadToApi,
  mapStartDocumentUploadToApi,
  mapTagFromApi,
  mapTagListFromApi,
  mapUpdateAssetToApi,
  mapUpdateDocumentToApi,
  mapUpdateTagToApi,
} from '@/api/mappers/repertoryMapper'
import {
  mapPageFromApi,
  type CursorPaginationParams,
  type PageSchema,
  type PaginatedResult,
} from '@/api/types/common'
import type {
  AssetSchema,
  AssetUploadSchema,
  DocumentSchema,
  DocumentUploadSchema,
  ListAssetsParams,
  ListDocumentsParams,
  ResourceEventSchema,
  TagListSchema,
  TagSchema,
} from '@/api/types/repertory'
import type {
  CreateAssetInput,
  CreateDocumentInput,
  CreateTagInput,
  RepertoryAsset,
  RepertoryDocument,
  RepertoryHistoryEntry,
  RepertoryTag,
  UpdateAssetInput,
  UpdateDocumentInput,
  UpdateTagInput,
} from '@/types/repertory'

/**
 * Public API surface returned by {@link useRepertoryApi}.
 */
export interface RepertoryApi {
  /** Lists paginated documents for a project with optional filters. */
  listDocuments: (
    projectId: number,
    params?: ListDocumentsParams,
  ) => Promise<PaginatedResult<RepertoryDocument>>
  /** Creates a document and uploads its binary file via presigned URL. */
  createDocument: (projectId: number, input: CreateDocumentInput) => Promise<RepertoryDocument>
  /** Replaces an existing document's binary file via presigned URL. */
  replaceDocumentFile: (
    projectId: number,
    documentId: number,
    file: File,
    metadata?: UpdateDocumentInput,
  ) => Promise<RepertoryDocument>
  /** Updates metadata of an existing document. */
  updateDocument: (
    projectId: number,
    documentId: number,
    input: UpdateDocumentInput,
  ) => Promise<RepertoryDocument>
  /** Deletes a document from a project. */
  deleteDocument: (projectId: number, documentId: number) => Promise<void>
  /** Lists paginated audit history entries for a document. */
  listDocumentHistory: (
    projectId: number,
    documentId: number,
    params?: CursorPaginationParams,
  ) => Promise<PaginatedResult<RepertoryHistoryEntry>>
  /** Fetches the raw binary Blob of a document file. */
  fetchDocumentFileBlob: (projectId: number, documentId: number) => Promise<Blob>
  /** Fetches a document file and triggers a browser download. */
  downloadDocumentFile: (projectId: number, documentId: number, filename?: string) => Promise<void>
  /** Resolves the direct API URL for a document's file endpoint. */
  getDocumentFileUrl: (projectId: number, documentId: number) => string

  /** Lists paginated assets for a project with optional filters. */
  listAssets: (
    projectId: number,
    params?: ListAssetsParams,
  ) => Promise<PaginatedResult<RepertoryAsset>>
  /** Creates an asset and uploads its binary file via presigned URL. */
  createAsset: (projectId: number, input: CreateAssetInput) => Promise<RepertoryAsset>
  /** Replaces an existing asset's binary file via presigned URL. */
  replaceAssetFile: (projectId: number, assetId: number, file: File) => Promise<RepertoryAsset>
  /** Updates metadata of an existing asset. */
  updateAsset: (
    projectId: number,
    assetId: number,
    input: UpdateAssetInput,
  ) => Promise<RepertoryAsset>
  /** Deletes an asset from a project. */
  deleteAsset: (projectId: number, assetId: number) => Promise<void>
  /** Lists paginated audit history entries for an asset. */
  listAssetHistory: (
    projectId: number,
    assetId: number,
    params?: CursorPaginationParams,
  ) => Promise<PaginatedResult<RepertoryHistoryEntry>>
  /** Fetches the raw binary Blob of an asset file. */
  fetchAssetFileBlob: (projectId: number, assetId: number) => Promise<Blob>
  /** Fetches an asset file and triggers a browser download. */
  downloadAssetFile: (projectId: number, assetId: number, filename?: string) => Promise<void>
  /** Resolves the direct API URL for an asset's file endpoint. */
  getAssetFileUrl: (projectId: number, assetId: number) => string

  /** Lists all tags belonging to a project. */
  listProjectTags: (projectId: number) => Promise<RepertoryTag[]>
  /** Creates a new tag in a project. */
  createTag: (projectId: number, input: CreateTagInput) => Promise<RepertoryTag>
  /** Updates an existing project tag. */
  updateTag: (projectId: number, tagId: number, input: UpdateTagInput) => Promise<RepertoryTag>
  /** Deletes a project tag. */
  deleteTag: (projectId: number, tagId: number) => Promise<void>
  /** Lists tags attached to a specific document. */
  listDocumentTags: (projectId: number, documentId: number) => Promise<RepertoryTag[]>
  /** Attaches a tag to a document. */
  attachTagToDocument: (projectId: number, documentId: number, tagId: number) => Promise<void>
  /** Detaches a tag from a document. */
  detachTagFromDocument: (projectId: number, documentId: number, tagId: number) => Promise<void>
  /** Lists tags attached to a specific asset. */
  listAssetTags: (projectId: number, assetId: number) => Promise<RepertoryTag[]>
  /** Attaches a tag to an asset. */
  attachTagToAsset: (projectId: number, assetId: number, tagId: number) => Promise<void>
  /** Detaches a tag from an asset. */
  detachTagFromAsset: (projectId: number, assetId: number, tagId: number) => Promise<void>
}

interface PresignedUploadTarget {
  upload_url: string
  method?: string
  required_headers: Record<string, string>
}

async function withApiError<T>(fallbackMessage: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (error) {
    throw parseApiError(error, fallbackMessage)
  }
}

function cleanQueryParams<T extends object>(
  params?: T,
): Record<string, string | number> | undefined {
  if (!params) return undefined
  const cleaned: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string' || typeof value === 'number') {
        cleaned[key] = value
      }
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

async function executePresignedUpload<TUpload extends PresignedUploadTarget, TDomain>(
  requestStart: () => Promise<TUpload>,
  file: File,
  mapResult: (dto: TUpload) => TDomain,
  fallbackMessage: string,
): Promise<TDomain> {
  return withApiError(fallbackMessage, async () => {
    const uploadDto = await requestStart()
    await uploadFileToPresignedUrl(
      uploadDto.upload_url,
      file,
      uploadDto.method,
      uploadDto.required_headers,
    )
    return mapResult(uploadDto)
  })
}

function readHeader(headers: unknown, name: string): string | null {
  if (!headers || typeof headers !== 'object') return null
  const maybeGetter = headers as { get?: (key: string) => unknown }
  if (typeof maybeGetter.get === 'function') {
    const value = maybeGetter.get(name)
    return typeof value === 'string' ? value : null
  }
  const record = headers as Record<string, unknown>
  const value = record[name] ?? record[name.toLowerCase()]
  return typeof value === 'string' ? value : null
}

function extractFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^["']|["']$/g, ''))
    } catch {
      return utf8Match[1].trim().replace(/^["']|["']$/g, '')
    }
  }
  const basicMatch = /filename=(?:"([^"]+)"|'([^']+)'|([^;]+))/i.exec(disposition)
  const rawName = basicMatch?.[1] ?? basicMatch?.[2] ?? basicMatch?.[3]
  return rawName ? rawName.trim() : null
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function fetchResourceFileBlob(path: string, fallbackMessage: string): Promise<Blob> {
  return withApiError(fallbackMessage, async () => {
    const { data } = await apiClient.get<Blob>(path, { responseType: 'blob' })
    return data
  })
}

async function downloadResourceFile(
  path: string,
  defaultFilename: string,
  fallbackMessage: string,
  filename?: string,
): Promise<void> {
  return withApiError(fallbackMessage, async () => {
    const response = await apiClient.get<Blob>(path, { responseType: 'blob' })
    const disposition = readHeader(response.headers, 'content-disposition')
    const resolvedFilename =
      filename?.trim() || extractFilenameFromDisposition(disposition) || defaultFilename
    triggerBrowserDownload(response.data, resolvedFilename)
  })
}

async function fetchResourceHistory(
  path: string,
  params: CursorPaginationParams | undefined,
  fallbackMessage: string,
): Promise<PaginatedResult<RepertoryHistoryEntry>> {
  return withApiError(fallbackMessage, async () => {
    const query = cleanQueryParams(params)
    const { data } = await apiClient.get<PageSchema<ResourceEventSchema>>(
      path,
      query ? { params: query } : undefined,
    )
    return mapPageFromApi(data, mapResourceEventFromApi)
  })
}

async function fetchResourceTags(path: string, fallbackMessage: string): Promise<RepertoryTag[]> {
  return withApiError(fallbackMessage, async () => {
    const { data } = await apiClient.get<TagListSchema>(path)
    return mapTagListFromApi(data)
  })
}

async function attachResourceTag(path: string, fallbackMessage: string): Promise<void> {
  return withApiError(fallbackMessage, async () => {
    await apiClient.put(path)
  })
}

async function detachResourceTag(path: string, fallbackMessage: string): Promise<void> {
  return withApiError(fallbackMessage, async () => {
    await apiClient.delete(path)
  })
}

/**
 * Composable providing decoupled API operations for Repertory documents, assets, and tags.
 */
export function useRepertoryApi(): RepertoryApi {
  function getDocumentFileUrl(projectId: number, documentId: number): string {
    return resolveApiUrl(`/projects/${projectId}/documents/${documentId}/file`)
  }

  function getAssetFileUrl(projectId: number, assetId: number): string {
    return resolveApiUrl(`/projects/${projectId}/assets/${assetId}/file`)
  }

  async function listDocuments(
    projectId: number,
    params?: ListDocumentsParams,
  ): Promise<PaginatedResult<RepertoryDocument>> {
    return withApiError('Não foi possível carregar os documentos do projeto.', async () => {
      const query = cleanQueryParams(params)
      const { data } = await apiClient.get<PageSchema<DocumentSchema>>(
        `/projects/${projectId}/documents`,
        query ? { params: query } : undefined,
      )
      return mapPageFromApi(data, mapDocumentFromApi)
    })
  }

  async function createDocument(
    projectId: number,
    input: CreateDocumentInput,
  ): Promise<RepertoryDocument> {
    return executePresignedUpload(
      async () => {
        const payload = mapStartDocumentUploadToApi(input)
        const { data } = await apiClient.post<DocumentUploadSchema>(
          `/projects/${projectId}/documents`,
          payload,
        )
        return data
      },
      input.file,
      mapDocumentFromApi,
      'Não foi possível enviar o documento.',
    )
  }

  async function replaceDocumentFile(
    projectId: number,
    documentId: number,
    file: File,
    metadata?: UpdateDocumentInput,
  ): Promise<RepertoryDocument> {
    return executePresignedUpload(
      async () => {
        const payload = mapReplaceDocumentUploadToApi(file, metadata)
        const { data } = await apiClient.post<DocumentUploadSchema>(
          `/projects/${projectId}/documents/${documentId}/uploads`,
          payload,
        )
        return data
      },
      file,
      mapDocumentFromApi,
      'Não foi possível substituir o arquivo do documento.',
    )
  }

  async function updateDocument(
    projectId: number,
    documentId: number,
    input: UpdateDocumentInput,
  ): Promise<RepertoryDocument> {
    return withApiError('Não foi possível atualizar o documento.', async () => {
      const payload = mapUpdateDocumentToApi(input)
      const { data } = await apiClient.put<DocumentSchema>(
        `/projects/${projectId}/documents/${documentId}`,
        payload,
      )
      return mapDocumentFromApi(data)
    })
  }

  async function deleteDocument(projectId: number, documentId: number): Promise<void> {
    return withApiError('Não foi possível excluir o documento.', async () => {
      await apiClient.delete(`/projects/${projectId}/documents/${documentId}`)
    })
  }

  async function listDocumentHistory(
    projectId: number,
    documentId: number,
    params?: CursorPaginationParams,
  ): Promise<PaginatedResult<RepertoryHistoryEntry>> {
    return fetchResourceHistory(
      `/projects/${projectId}/documents/${documentId}/history`,
      params,
      'Não foi possível carregar o histórico do documento.',
    )
  }

  async function fetchDocumentFileBlob(projectId: number, documentId: number): Promise<Blob> {
    return fetchResourceFileBlob(
      `/projects/${projectId}/documents/${documentId}/file`,
      'Não foi possível carregar o arquivo do documento.',
    )
  }

  async function downloadDocumentFile(
    projectId: number,
    documentId: number,
    filename?: string,
  ): Promise<void> {
    return downloadResourceFile(
      `/projects/${projectId}/documents/${documentId}/download`,
      `documento-${documentId}`,
      'Não foi possível baixar o arquivo do documento.',
      filename,
    )
  }

  async function listAssets(
    projectId: number,
    params?: ListAssetsParams,
  ): Promise<PaginatedResult<RepertoryAsset>> {
    return withApiError('Não foi possível carregar os assets do projeto.', async () => {
      const query = cleanQueryParams(params)
      const { data } = await apiClient.get<PageSchema<AssetSchema>>(
        `/projects/${projectId}/assets`,
        query ? { params: query } : undefined,
      )
      return mapPageFromApi(data, mapAssetFromApi)
    })
  }

  async function createAsset(projectId: number, input: CreateAssetInput): Promise<RepertoryAsset> {
    return executePresignedUpload(
      async () => {
        const payload = mapStartAssetUploadToApi(input)
        const { data } = await apiClient.post<AssetUploadSchema>(
          `/projects/${projectId}/assets`,
          payload,
        )
        return data
      },
      input.file,
      mapAssetFromApi,
      'Não foi possível enviar o asset.',
    )
  }

  async function replaceAssetFile(
    projectId: number,
    assetId: number,
    file: File,
  ): Promise<RepertoryAsset> {
    return executePresignedUpload(
      async () => {
        const payload = mapReplaceAssetUploadToApi(file)
        const { data } = await apiClient.post<AssetUploadSchema>(
          `/projects/${projectId}/assets/${assetId}/uploads`,
          payload,
        )
        return data
      },
      file,
      mapAssetFromApi,
      'Não foi possível substituir o arquivo do asset.',
    )
  }

  async function updateAsset(
    projectId: number,
    assetId: number,
    input: UpdateAssetInput,
  ): Promise<RepertoryAsset> {
    return withApiError('Não foi possível atualizar o asset.', async () => {
      const payload = mapUpdateAssetToApi(input)
      const { data } = await apiClient.put<AssetSchema>(
        `/projects/${projectId}/assets/${assetId}`,
        payload,
      )
      return mapAssetFromApi(data)
    })
  }

  async function deleteAsset(projectId: number, assetId: number): Promise<void> {
    return withApiError('Não foi possível excluir o asset.', async () => {
      await apiClient.delete(`/projects/${projectId}/assets/${assetId}`)
    })
  }

  async function listAssetHistory(
    projectId: number,
    assetId: number,
    params?: CursorPaginationParams,
  ): Promise<PaginatedResult<RepertoryHistoryEntry>> {
    return fetchResourceHistory(
      `/projects/${projectId}/assets/${assetId}/history`,
      params,
      'Não foi possível carregar o histórico do asset.',
    )
  }

  async function fetchAssetFileBlob(projectId: number, assetId: number): Promise<Blob> {
    return fetchResourceFileBlob(
      `/projects/${projectId}/assets/${assetId}/file`,
      'Não foi possível carregar o arquivo do asset.',
    )
  }

  async function downloadAssetFile(
    projectId: number,
    assetId: number,
    filename?: string,
  ): Promise<void> {
    return downloadResourceFile(
      `/projects/${projectId}/assets/${assetId}/download`,
      `asset-${assetId}`,
      'Não foi possível baixar o arquivo do asset.',
      filename,
    )
  }

  async function listProjectTags(projectId: number): Promise<RepertoryTag[]> {
    return fetchResourceTags(
      `/projects/${projectId}/tags`,
      'Não foi possível carregar as tags do projeto.',
    )
  }

  async function createTag(projectId: number, input: CreateTagInput): Promise<RepertoryTag> {
    return withApiError('Não foi possível criar a tag.', async () => {
      const payload = mapCreateTagToApi(input)
      const { data } = await apiClient.post<TagSchema>(`/projects/${projectId}/tags`, payload)
      return mapTagFromApi(data)
    })
  }

  async function updateTag(
    projectId: number,
    tagId: number,
    input: UpdateTagInput,
  ): Promise<RepertoryTag> {
    return withApiError('Não foi possível atualizar a tag.', async () => {
      const payload = mapUpdateTagToApi(input)
      const { data } = await apiClient.put<TagSchema>(
        `/projects/${projectId}/tags/${tagId}`,
        payload,
      )
      return mapTagFromApi(data)
    })
  }

  async function deleteTag(projectId: number, tagId: number): Promise<void> {
    return withApiError('Não foi possível excluir a tag.', async () => {
      await apiClient.delete(`/projects/${projectId}/tags/${tagId}`)
    })
  }

  async function listDocumentTags(projectId: number, documentId: number): Promise<RepertoryTag[]> {
    return fetchResourceTags(
      `/projects/${projectId}/documents/${documentId}/tags`,
      'Não foi possível carregar as tags do documento.',
    )
  }

  async function attachTagToDocument(
    projectId: number,
    documentId: number,
    tagId: number,
  ): Promise<void> {
    return attachResourceTag(
      `/projects/${projectId}/documents/${documentId}/tags/${tagId}`,
      'Não foi possível vincular a tag ao documento.',
    )
  }

  async function detachTagFromDocument(
    projectId: number,
    documentId: number,
    tagId: number,
  ): Promise<void> {
    return detachResourceTag(
      `/projects/${projectId}/documents/${documentId}/tags/${tagId}`,
      'Não foi possível desvincular a tag do documento.',
    )
  }

  async function listAssetTags(projectId: number, assetId: number): Promise<RepertoryTag[]> {
    return fetchResourceTags(
      `/projects/${projectId}/assets/${assetId}/tags`,
      'Não foi possível carregar as tags do asset.',
    )
  }

  async function attachTagToAsset(
    projectId: number,
    assetId: number,
    tagId: number,
  ): Promise<void> {
    return attachResourceTag(
      `/projects/${projectId}/assets/${assetId}/tags/${tagId}`,
      'Não foi possível vincular a tag ao asset.',
    )
  }

  async function detachTagFromAsset(
    projectId: number,
    assetId: number,
    tagId: number,
  ): Promise<void> {
    return detachResourceTag(
      `/projects/${projectId}/assets/${assetId}/tags/${tagId}`,
      'Não foi possível desvincular a tag do asset.',
    )
  }

  return {
    listDocuments,
    createDocument,
    replaceDocumentFile,
    updateDocument,
    deleteDocument,
    listDocumentHistory,
    fetchDocumentFileBlob,
    downloadDocumentFile,
    getDocumentFileUrl,
    listAssets,
    createAsset,
    replaceAssetFile,
    updateAsset,
    deleteAsset,
    listAssetHistory,
    fetchAssetFileBlob,
    downloadAssetFile,
    getAssetFileUrl,
    listProjectTags,
    createTag,
    updateTag,
    deleteTag,
    listDocumentTags,
    attachTagToDocument,
    detachTagFromDocument,
    listAssetTags,
    attachTagToAsset,
    detachTagFromAsset,
  }
}
