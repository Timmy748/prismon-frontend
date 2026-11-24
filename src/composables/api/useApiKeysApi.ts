import { apiClient } from '@/api/client'
import { parseApiError } from '@/api/errors'
import { mapApiKeyFromApi, mapCreateApiKeyToApi } from '@/api/mappers/apiKeyMapper'
import type { ApiKeyHintSchema } from '@/api/types/apiKeys'
import {
  mapPageFromApi,
  type CursorPaginationParams,
  type PageSchema,
  type PaginatedResult,
} from '@/api/types/common'
import type { ApiKeyItem, CreateApiKeyInput } from '@/types/apiKeys'

function buildCursorQuery(
  params?: CursorPaginationParams,
): Record<string, string | number> | undefined {
  if (!params) return undefined

  const query: Record<string, string | number> = {}
  if (params.limit !== undefined) {
    query.limit = params.limit
  }
  if (params.cursor !== undefined && params.cursor !== null && params.cursor !== '') {
    query.cursor = params.cursor
  }

  return Object.keys(query).length > 0 ? query : undefined
}

/**
 * Fetches a cursor-paginated list of API keys scoped to the project.
 */
export async function listProjectApiKeys(
  projectId: number,
  params?: CursorPaginationParams,
): Promise<PaginatedResult<ApiKeyItem>> {
  try {
    const query = buildCursorQuery(params)
    const { data } = await apiClient.get<PageSchema<ApiKeyHintSchema>>(
      `/projects/${projectId}/api-keys`,
      query ? { params: query } : undefined,
    )
    return mapPageFromApi(data, (item) => mapApiKeyFromApi(item, 'project'))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Registers a new API key scoped to the project.
 */
export async function createProjectApiKey(
  projectId: number,
  input: CreateApiKeyInput,
): Promise<ApiKeyItem> {
  try {
    const payload = mapCreateApiKeyToApi(input)
    const { data } = await apiClient.post<ApiKeyHintSchema>(
      `/projects/${projectId}/api-keys`,
      payload,
    )
    return mapApiKeyFromApi(data, 'project')
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Fetches a cursor-paginated list of API keys scoped to the logged-in project member.
 */
export async function listMemberApiKeys(
  projectId: number,
  params?: CursorPaginationParams,
): Promise<PaginatedResult<ApiKeyItem>> {
  try {
    const query = buildCursorQuery(params)
    const { data } = await apiClient.get<PageSchema<ApiKeyHintSchema>>(
      `/projects/${projectId}/members/me/api-keys`,
      query ? { params: query } : undefined,
    )
    return mapPageFromApi(data, (item) => mapApiKeyFromApi(item, 'member'))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Registers a new API key scoped to the logged-in project member.
 */
export async function createMemberApiKey(
  projectId: number,
  input: CreateApiKeyInput,
): Promise<ApiKeyItem> {
  try {
    const payload = mapCreateApiKeyToApi(input)
    const { data } = await apiClient.post<ApiKeyHintSchema>(
      `/projects/${projectId}/members/me/api-keys`,
      payload,
    )
    return mapApiKeyFromApi(data, 'member')
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Revokes and deletes a project API key by ID.
 */
export async function deleteProjectApiKey(projectId: number, apiKeyId: number): Promise<void> {
  try {
    await apiClient.delete(`/projects/${projectId}/api-keys/${apiKeyId}`)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * API Keys composable exposing project-scoped and member-scoped key operations.
 */
export function useApiKeysApi() {
  return {
    listProjectApiKeys,
    createProjectApiKey,
    listMemberApiKeys,
    createMemberApiKey,
    deleteProjectApiKey,
  }
}
