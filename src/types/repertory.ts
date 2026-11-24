import type { AssetStatusApi, DocumentStatusApi } from '@/api/types/repertory'

/**
 * Domain representation of a project repertory tag.
 */
export interface RepertoryTag {
  id: number
  projectId: number
  label: string
  description: string
  color: string
}

/**
 * Compact tag reference embedded on a repertory document or asset.
 */
export interface RepertoryItemTagRef {
  id: number
  label: string
  color?: string
}

/**
 * Domain representation of a repertory resource history/audit entry.
 */
export interface RepertoryHistoryEntry {
  id: number
  title: string
  summary: string
  author: string
  date: string
}

/**
 * Domain representation of a repertory document.
 */
export interface RepertoryDocument {
  id: number
  projectId: number
  title: string
  description: string
  status: DocumentStatusApi
  statusLabel: string
  format: string
  contentType: string | null
  filePath: string | null
  fileExtension: string | null
  createdAt: string
  updatedAt: string
  createdAtLabel: string
  tags: RepertoryItemTagRef[]
}

/**
 * Domain representation of a repertory asset.
 */
export interface RepertoryAsset {
  id: number
  projectId: number
  title: string
  description: string
  type: string
  status: AssetStatusApi
  statusLabel: string
  format: string
  contentType: string | null
  filePath: string | null
  fileExtension: string | null
  fileUrl: string
  createdAt: string
  updatedAt: string
  createdAtLabel: string
  tags: RepertoryItemTagRef[]
}

/**
 * Input required to create and upload a new repertory document.
 */
export interface CreateDocumentInput {
  name: string
  description?: string | null
  file: File
}

/**
 * Input required to create and upload a new repertory asset.
 */
export interface CreateAssetInput {
  name: string
  assetType?: string
  description?: string | null
  file: File
}

/**
 * Input to update metadata of an existing repertory document.
 */
export interface UpdateDocumentInput {
  name?: string | null
  description?: string | null
}

/**
 * Input to update metadata of an existing repertory asset.
 */
export interface UpdateAssetInput {
  name?: string | null
  type?: string | null
  description?: string | null
}

/**
 * Input to create a new project tag.
 */
export interface CreateTagInput {
  label: string
  description: string
  color: string
}

/**
 * Input to update an existing project tag.
 */
export interface UpdateTagInput {
  label?: string | null
  description?: string | null
  color?: string | null
}
