import { apiClient } from '@/api/client'
import { parseApiError } from '@/api/errors'
import {
  mapCreateProjectToApi,
  mapProjectFromApi,
  mapUpdateProjectToApi,
} from '@/api/mappers/projectMapper'
import { mapPageFromApi, type PageSchema, type PaginatedResult } from '@/api/types/common'
import type { ListProjectsParams, ProjectSchema } from '@/api/types/projects'
import type { CreateProjectInput, Project, UpdateProjectInput } from '@/types/projects'

function buildProjectsQuery(
  params?: ListProjectsParams,
): Record<string, string | number> | undefined {
  if (!params) return undefined

  const query: Record<string, string | number> = {}
  if (params.name !== undefined && params.name !== null && params.name.trim() !== '') {
    query.name = params.name.trim()
  }
  if (params.limit !== undefined) {
    query.limit = params.limit
  }
  if (params.cursor !== undefined && params.cursor !== null && params.cursor !== '') {
    query.cursor = params.cursor
  }

  return Object.keys(query).length > 0 ? query : undefined
}

/**
 * Fetches a cursor-paginated list of projects accessible to the authenticated user.
 */
export async function listProjects(params?: ListProjectsParams): Promise<PaginatedResult<Project>> {
  try {
    const query = buildProjectsQuery(params)
    const { data } = await apiClient.get<PageSchema<ProjectSchema>>(
      '/projects',
      query ? { params: query } : undefined,
    )
    return mapPageFromApi(data, mapProjectFromApi)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Creates a new project owned by the authenticated user.
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  try {
    const payload = mapCreateProjectToApi(input)
    const { data } = await apiClient.post<ProjectSchema>('/projects', payload)
    return mapProjectFromApi(data)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Updates an existing project's attributes.
 */
export async function updateProject(
  projectId: number,
  input: UpdateProjectInput,
): Promise<Project> {
  try {
    const payload = mapUpdateProjectToApi(input)
    const { data } = await apiClient.put<ProjectSchema>(`/projects/${projectId}`, payload)
    return mapProjectFromApi(data)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Deletes an existing project by ID.
 */
export async function deleteProject(projectId: number): Promise<void> {
  try {
    await apiClient.delete(`/projects/${projectId}`)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Projects API composable exposing CRUD and cursor-paginated listing operations.
 */
export function useProjectsApi() {
  return {
    listProjects,
    createProject,
    updateProject,
    deleteProject,
  }
}
