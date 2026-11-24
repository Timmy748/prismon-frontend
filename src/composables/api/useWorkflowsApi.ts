import { apiClient } from '@/api/client'
import { parseApiError } from '@/api/errors'
import { mapWorkflowConfigFromApi, mapWorkflowFromApi } from '@/api/mappers/workflowMapper'
import {
  mapPageFromApi,
  type CursorPaginationParams,
  type PageSchema,
  type PaginatedResult,
} from '@/api/types/common'
import type { WorkflowConfigSchema, WorkflowSchema } from '@/api/types/workflows'
import type { WorkflowConfigNode, WorkflowItem } from '@/types/workflows'

/**
 * Contract returned by the {@link useWorkflowsApi} composable.
 */
export interface UseWorkflowsApi {
  listWorkflows: (params?: CursorPaginationParams) => Promise<PaginatedResult<WorkflowItem>>
  getWorkflowConfig: (name: string) => Promise<WorkflowConfigNode[]>
}

/**
 * Fetches a cursor-paginated list of available workflows.
 */
export async function listWorkflows(
  params?: CursorPaginationParams,
): Promise<PaginatedResult<WorkflowItem>> {
  try {
    const response = await apiClient.get<PageSchema<WorkflowSchema>>(
      '/workflows/',
      params ? { params } : undefined,
    )
    return mapPageFromApi(response.data, mapWorkflowFromApi)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Fetches the dynamic configuration schema for a workflow by name.
 */
export async function getWorkflowConfig(name: string): Promise<WorkflowConfigNode[]> {
  try {
    const response = await apiClient.get<WorkflowConfigSchema>(
      `/workflows/${encodeURIComponent(name)}/config`,
    )
    return mapWorkflowConfigFromApi(response.data)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Composable providing workflow API operations.
 */
export function useWorkflowsApi(): UseWorkflowsApi {
  return {
    listWorkflows,
    getWorkflowConfig,
  }
}
