import { resolveApiUrl } from '@/api/client'
import { formatApiDate } from '@/api/mappers/formatters'
import type {
  AssetSchema,
  AssetStatusApi,
  CreateTagSchema,
  DocumentSchema,
  DocumentStatusApi,
  ReplaceAssetUploadRequest,
  ReplaceDocumentUploadRequest,
  ResourceEventSchema,
  StartAssetUploadRequest,
  StartDocumentUploadRequest,
  TagListSchema,
  TagSchema,
  UpdateAssetRequest,
  UpdateDocumentRequest,
  UpdateTagSchema,
} from '@/api/types/repertory'
import type {
  CreateAssetInput,
  CreateDocumentInput,
  CreateTagInput,
  RepertoryAsset,
  RepertoryDocument,
  RepertoryHistoryEntry,
  RepertoryItemTagRef,
  RepertoryTag,
  UpdateAssetInput,
  UpdateDocumentInput,
  UpdateTagInput,
} from '@/types/repertory'

const DOCUMENT_STATUS_LABELS: Record<DocumentStatusApi, string> = {
  uploading: 'Enviando',
  failed: 'Falhou',
  draft: 'Rascunho',
  pending: 'Pendente',
  published: 'Publicado',
  archived: 'Arquivado',
}

const ASSET_STATUS_LABELS: Record<AssetStatusApi, string> = {
  uploading: 'Enviando',
  failed: 'Falhou',
  active: 'Ativo',
  pending: 'Pendente',
  archived: 'Arquivado',
}

const MIME_FORMAT_MAP: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/markdown': 'MD',
  'text/x-markdown': 'MD',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'application/json': 'JSON',
  'image/jpeg': 'JPG',
  'image/svg+xml': 'SVG',
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'avif', 'bmp', 'ico'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'])
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'md', 'txt', 'csv', 'json'])

const RESOURCE_LABEL_MAP: Record<string, string> = {
  document: 'Documento',
  documents: 'Documento',
  asset: 'Asset',
  assets: 'Asset',
}

function extractExtensionFromPath(path: string | null | undefined): string | null {
  if (!path) return null
  const basename = path.split('/').pop()?.trim() ?? ''
  const dotIndex = basename.lastIndexOf('.')
  if (dotIndex <= 0 || dotIndex >= basename.length - 1) return null
  return basename.slice(dotIndex + 1).toLowerCase()
}

function readStringValue(data: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
    if (typeof value === 'number') {
      return String(value)
    }
  }
  return null
}

function humanizeEventType(eventType: string): string {
  const normalized = eventType.trim().replace(/[_-]+/g, ' ')
  if (!normalized) return 'Evento registrado'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

/**
 * Returns the Portuguese display label for a document status.
 */
export function getDocumentStatusLabel(status: DocumentStatusApi): string {
  return DOCUMENT_STATUS_LABELS[status] ?? status
}

/**
 * Returns the Portuguese display label for an asset status.
 */
export function getAssetStatusLabel(status: AssetStatusApi): string {
  return ASSET_STATUS_LABELS[status] ?? status
}

/**
 * Infers a concise uppercase format badge (e.g. `PDF`, `PNG`, `DOCX`) from extension, MIME type, or file path.
 */
export function inferResourceFormat(
  fileExtension?: string | null,
  contentType?: string | null,
  filePath?: string | null,
): string {
  const cleanExtension = fileExtension?.trim().replace(/^\.+/, '')
  if (cleanExtension) {
    return cleanExtension.toUpperCase()
  }

  if (contentType) {
    const normalizedMime = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
    const mapped = MIME_FORMAT_MAP[normalizedMime]
    if (mapped) {
      return mapped
    }
    const slashIndex = normalizedMime.indexOf('/')
    if (slashIndex !== -1) {
      const subtype = normalizedMime
        .slice(slashIndex + 1)
        .split('+')[0]
        ?.trim()
      if (subtype) {
        return subtype.toUpperCase()
      }
    }
  }

  const pathExtension = extractExtensionFromPath(filePath)
  if (pathExtension) {
    return pathExtension.toUpperCase()
  }

  return 'ARQUIVO'
}

/**
 * Infers an asset category type (e.g. `image`, `video`, `audio`, `document`) from a browser File.
 */
export function inferAssetTypeFromFile(file: File): string {
  const mime = file.type.toLowerCase().trim()
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime === 'application/pdf' || mime.startsWith('text/')) return 'document'

  const ext = extractExtensionFromPath(file.name)
  if (ext) {
    if (IMAGE_EXTENSIONS.has(ext)) return 'image'
    if (VIDEO_EXTENSIONS.has(ext)) return 'video'
    if (AUDIO_EXTENSIONS.has(ext)) return 'audio'
    if (DOCUMENT_EXTENSIONS.has(ext)) return 'document'
  }

  return 'other'
}

/**
 * Maps an API Tag DTO into the domain `RepertoryTag` model.
 */
export function mapTagFromApi(dto: TagSchema): RepertoryTag {
  return {
    id: dto.id,
    projectId: dto.project_id,
    label: dto.label,
    description: dto.description,
    color: dto.color,
  }
}

/**
 * Maps an API Tag DTO into a compact `RepertoryItemTagRef` reference.
 */
export function mapTagRefFromApi(dto: TagSchema): RepertoryItemTagRef {
  return {
    id: dto.id,
    label: dto.label,
    color: dto.color,
  }
}

/**
 * Maps a `TagListSchema` payload into an array of domain `RepertoryTag` items.
 */
export function mapTagListFromApi(dto: TagListSchema): RepertoryTag[] {
  return dto.items.map(mapTagFromApi)
}

/**
 * Maps a domain `CreateTagInput` into an API `CreateTagSchema` payload.
 */
export function mapCreateTagToApi(input: CreateTagInput): CreateTagSchema {
  return {
    label: input.label,
    description: input.description,
    color: input.color,
  }
}

/**
 * Maps a domain `UpdateTagInput` into a partial API `UpdateTagSchema` payload.
 */
export function mapUpdateTagToApi(input: UpdateTagInput): UpdateTagSchema {
  const payload: UpdateTagSchema = {}
  if (input.label !== undefined) payload.label = input.label
  if (input.description !== undefined) payload.description = input.description
  if (input.color !== undefined) payload.color = input.color
  return payload
}

/**
 * Maps an API `DocumentSchema` into the domain `RepertoryDocument` model.
 */
export function mapDocumentFromApi(dto: DocumentSchema): RepertoryDocument {
  return {
    id: dto.id,
    projectId: dto.project_id,
    title: dto.name,
    description: dto.description ?? '',
    status: dto.status,
    statusLabel: getDocumentStatusLabel(dto.status),
    format: inferResourceFormat(dto.file_extension, dto.content_type, dto.file),
    contentType: dto.content_type ?? null,
    filePath: dto.file,
    fileExtension: dto.file_extension ?? null,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    createdAtLabel: formatApiDate(dto.created_at),
    tags: (dto.tags ?? []).map(mapTagRefFromApi),
  }
}

/**
 * Maps a domain `CreateDocumentInput` into an API `StartDocumentUploadRequest` payload.
 */
export function mapStartDocumentUploadToApi(
  input: CreateDocumentInput,
): StartDocumentUploadRequest {
  return {
    name: input.name,
    original_filename: input.file.name,
    description: input.description ?? null,
    content_type: input.file.type || null,
  }
}

/**
 * Maps a replacement `File` and optional metadata into an API `ReplaceDocumentUploadRequest`.
 */
export function mapReplaceDocumentUploadToApi(
  file: File,
  metadata?: UpdateDocumentInput,
): ReplaceDocumentUploadRequest {
  const payload: ReplaceDocumentUploadRequest = {
    original_filename: file.name,
  }
  if (file.type) {
    payload.content_type = file.type
  }
  if (metadata?.name !== undefined) {
    payload.name = metadata.name
  }
  if (metadata?.description !== undefined) {
    payload.description = metadata.description
  }
  return payload
}

/**
 * Maps a domain `UpdateDocumentInput` into an API `UpdateDocumentRequest` payload.
 */
export function mapUpdateDocumentToApi(input: UpdateDocumentInput): UpdateDocumentRequest {
  const payload: UpdateDocumentRequest = {}
  if (input.name !== undefined) payload.name = input.name
  if (input.description !== undefined) payload.description = input.description
  return payload
}

/**
 * Maps an API `AssetSchema` into the domain `RepertoryAsset` model.
 */
export function mapAssetFromApi(dto: AssetSchema): RepertoryAsset {
  return {
    id: dto.id,
    projectId: dto.project_id,
    title: dto.name,
    description: dto.description ?? '',
    type: dto.type,
    status: dto.status,
    statusLabel: getAssetStatusLabel(dto.status),
    format: inferResourceFormat(dto.file_extension, dto.content_type, dto.file),
    contentType: dto.content_type ?? null,
    filePath: dto.file,
    fileExtension: dto.file_extension ?? null,
    fileUrl: resolveApiUrl(`/projects/${dto.project_id}/assets/${dto.id}/file`),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    createdAtLabel: formatApiDate(dto.created_at),
    tags: (dto.tags ?? []).map(mapTagRefFromApi),
  }
}

/**
 * Maps a domain `CreateAssetInput` into an API `StartAssetUploadRequest` payload,
 * inferring `type` from the file when `assetType` is omitted.
 */
export function mapStartAssetUploadToApi(input: CreateAssetInput): StartAssetUploadRequest {
  const resolvedType = input.assetType?.trim() || inferAssetTypeFromFile(input.file)
  return {
    name: input.name,
    type: resolvedType,
    original_filename: input.file.name,
    description: input.description ?? null,
    content_type: input.file.type || null,
  }
}

/**
 * Maps a replacement `File` into an API `ReplaceAssetUploadRequest` payload.
 */
export function mapReplaceAssetUploadToApi(file: File): ReplaceAssetUploadRequest {
  const payload: ReplaceAssetUploadRequest = {
    original_filename: file.name,
  }
  if (file.type) {
    payload.content_type = file.type
  }
  return payload
}

/**
 * Maps a domain `UpdateAssetInput` into an API `UpdateAssetRequest` payload.
 */
export function mapUpdateAssetToApi(input: UpdateAssetInput): UpdateAssetRequest {
  const payload: UpdateAssetRequest = {}
  if (input.name !== undefined) payload.name = input.name
  if (input.type !== undefined) payload.type = input.type
  if (input.description !== undefined) payload.description = input.description
  return payload
}

function resolveEventTitle(eventType: string, resourceType: string): string {
  const resourceLabel = RESOURCE_LABEL_MAP[resourceType.toLowerCase()] ?? 'Item'
  const titles: Record<string, string> = {
    created: `${resourceLabel} criado`,
    document_created: 'Documento criado',
    asset_created: 'Asset criado',
    upload_started: 'Upload iniciado',
    upload_completed: 'Upload concluído',
    uploaded: 'Upload concluído',
    upload_failed: 'Falha no upload',
    updated: 'Metadados atualizados',
    metadata_updated: 'Metadados atualizados',
    file_replaced: 'Arquivo substituído',
    replaced: 'Arquivo substituído',
    status_changed: 'Status alterado',
    tag_attached: 'Tag vinculada',
    tag_added: 'Tag vinculada',
    tag_detached: 'Tag removida',
    tag_removed: 'Tag removida',
    published: 'Documento publicado',
    archived: `${resourceLabel} arquivado`,
    deleted: `${resourceLabel} removido`,
  }
  return titles[eventType] ?? humanizeEventType(eventType)
}

function resolveEventSummary(eventType: string, data: Record<string, unknown>): string {
  const explicitSummary = readStringValue(data, 'summary', 'message', 'reason')
  if (explicitSummary) {
    return explicitSummary
  }

  if (eventType === 'status_changed') {
    const fromStatus = readStringValue(data, 'from', 'old_status', 'previous_status')
    const toStatus = readStringValue(data, 'to', 'new_status', 'status')
    if (fromStatus && toStatus) {
      return `Status alterado de ${fromStatus} para ${toStatus}.`
    }
    if (toStatus) {
      return `Novo status: ${toStatus}.`
    }
  }

  if (
    eventType === 'tag_attached' ||
    eventType === 'tag_added' ||
    eventType === 'tag_detached' ||
    eventType === 'tag_removed'
  ) {
    const tagLabel = readStringValue(data, 'tag_label', 'label', 'name')
    if (tagLabel) {
      return `Tag "${tagLabel}".`
    }
    const tagId = readStringValue(data, 'tag_id')
    if (tagId) {
      return `Tag #${tagId}.`
    }
  }

  const filename = readStringValue(data, 'original_filename', 'filename', 'file')
  if (filename) {
    return `Arquivo: ${filename}.`
  }

  const name = readStringValue(data, 'name', 'title')
  if (name) {
    return `Nome: ${name}.`
  }

  const keys = Object.keys(data)
  if (keys.length > 0) {
    return `Campos afetados: ${keys.join(', ')}.`
  }

  return 'Evento registrado no histórico do recurso.'
}

/**
 * Maps an API `ResourceEventSchema` into a readable `RepertoryHistoryEntry`.
 */
export function mapResourceEventFromApi(dto: ResourceEventSchema): RepertoryHistoryEntry {
  const safeData = dto.data ?? {}
  return {
    id: dto.id,
    title: resolveEventTitle(dto.event_type, dto.resource_type),
    summary: resolveEventSummary(dto.event_type, safeData),
    author: `Membro #${dto.author_member_id}`,
    date: formatApiDate(dto.created_at),
  }
}
