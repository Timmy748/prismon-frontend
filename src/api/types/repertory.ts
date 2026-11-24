import type { CursorPaginationParams } from '@/api/types/common'

/**
 * Tag DTO returned by the Repertory API.
 */
export interface TagSchema {
  id: number
  project_id: number
  label: string
  description: string
  color: string
}

/**
 * Non-paginated list wrapper for project or resource tags.
 */
export interface TagListSchema {
  items: TagSchema[]
}

/**
 * Request payload to create a new project tag.
 */
export interface CreateTagSchema {
  label: string
  description: string
  color: string
}

/**
 * Request payload to partially update an existing project tag.
 */
export interface UpdateTagSchema {
  label?: string | null
  description?: string | null
  color?: string | null
}

/**
 * Document lifecycle status values returned by the API.
 */
export type DocumentStatusApi =
  'uploading' | 'failed' | 'draft' | 'pending' | 'published' | 'archived'

/**
 * Document DTO returned by the Repertory API.
 */
export interface DocumentSchema {
  id: number
  project_id: number
  file: string | null
  file_extension?: string | null
  content_type?: string | null
  created_by_member_id: number
  name: string
  description: string | null
  status: DocumentStatusApi
  created_at: string
  updated_at: string
  tags?: TagSchema[]
}

/**
 * Document creation/replacement response including presigned upload target details.
 */
export interface DocumentUploadSchema extends DocumentSchema {
  upload_url: string
  method?: string
  required_headers: Record<string, string>
  expires_at: string
}

/**
 * Request payload to initiate a presigned document upload.
 */
export interface StartDocumentUploadRequest {
  name: string
  original_filename: string
  description?: string | null
  content_type?: string | null
}

/**
 * Request payload to initiate replacing an existing document's binary file.
 */
export interface ReplaceDocumentUploadRequest {
  original_filename: string
  content_type?: string
  name?: string | null
  description?: string | null
}

/**
 * Request payload to update document metadata.
 */
export interface UpdateDocumentRequest {
  name?: string | null
  description?: string | null
}

/**
 * Asset lifecycle status values returned by the API.
 */
export type AssetStatusApi = 'uploading' | 'failed' | 'active' | 'pending' | 'archived'

/**
 * Asset DTO returned by the Repertory API.
 */
export interface AssetSchema {
  id: number
  project_id: number
  created_by_member_id: number
  file: string | null
  name: string
  file_extension?: string | null
  content_type?: string | null
  type: string
  description: string | null
  status: AssetStatusApi
  created_at: string
  updated_at: string
  tags?: TagSchema[]
}

/**
 * Asset creation/replacement response including presigned upload target details.
 */
export interface AssetUploadSchema extends AssetSchema {
  upload_url: string
  method?: string
  required_headers: Record<string, string>
  expires_at: string
}

/**
 * Request payload to initiate a presigned asset upload.
 */
export interface StartAssetUploadRequest {
  name: string
  type: string
  original_filename: string
  description?: string | null
  content_type?: string | null
}

/**
 * Request payload to initiate replacing an existing asset's binary file.
 */
export interface ReplaceAssetUploadRequest {
  original_filename: string
  content_type?: string
}

/**
 * Request payload to update asset metadata.
 */
export interface UpdateAssetRequest {
  name?: string | null
  type?: string | null
  description?: string | null
}

/**
 * Audit/history event DTO returned for a repertory document or asset.
 */
export interface ResourceEventSchema {
  id: number
  project_id: number
  resource_type: string
  resource_id: number
  author_member_id: number
  event_type: string
  data: Record<string, unknown>
  created_at: string
}

/**
 * Query parameters for listing documents with cursor pagination and filters.
 */
export interface ListDocumentsParams extends CursorPaginationParams {
  name?: string | null
  status?: DocumentStatusApi | null
}

/**
 * Query parameters for listing assets with cursor pagination and filters.
 */
export interface ListAssetsParams extends CursorPaginationParams {
  type?: string | null
  status?: AssetStatusApi | null
}
