import type { CursorPaginationParams } from '@/api/types/common'

/**
 * Raw project payload returned by the backend Projects API.
 */
export interface ProjectSchema {
  id: number
  name: string
  owner_id: number
  created_at: string
  updated_at: string
}

/**
 * Request payload for `POST /projects`.
 */
export interface CreateProjectSchema {
  name: string
}

/**
 * Request payload for `PUT /projects/{public_id}`.
 */
export interface UpdateProjectSchema {
  name?: string | null
}

/**
 * Query parameters supported by `GET /projects`.
 */
export interface ListProjectsParams extends CursorPaginationParams {
  name?: string | null
}
