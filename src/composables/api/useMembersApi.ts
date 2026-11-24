import { apiClient } from '@/api/client'
import { parseApiError } from '@/api/errors'
import {
  mapChangeMemberRoleToApi,
  mapInviteMemberToApi,
  mapMemberFromApi,
} from '@/api/mappers/memberMapper'
import {
  mapPageFromApi,
  type CursorPaginationParams,
  type PageSchema,
  type PaginatedResult,
} from '@/api/types/common'
import type { MemberSchema } from '@/api/types/members'
import type { ChangeMemberRoleInput, InviteMemberInput, ProjectMember } from '@/types/members'

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
 * Fetches a cursor-paginated list of members belonging to a project.
 */
export async function listMembers(
  projectId: number,
  params?: CursorPaginationParams,
): Promise<PaginatedResult<ProjectMember>> {
  try {
    const query = buildCursorQuery(params)
    const { data } = await apiClient.get<PageSchema<MemberSchema>>(
      `/projects/${projectId}/members`,
      query ? { params: query } : undefined,
    )
    return mapPageFromApi(data, mapMemberFromApi)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Invites a user to join the specified project.
 */
export async function inviteMember(
  projectId: number,
  input: InviteMemberInput,
): Promise<ProjectMember> {
  try {
    const payload = mapInviteMemberToApi(input)
    const { data } = await apiClient.post<MemberSchema>(`/projects/${projectId}/members`, payload)
    return mapMemberFromApi(data)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Accepts the authenticated user's pending invitation to a project.
 */
export async function acceptProjectInvite(projectId: number): Promise<ProjectMember> {
  try {
    const { data } = await apiClient.patch<MemberSchema>(`/projects/${projectId}/members/accept`)
    return mapMemberFromApi(data)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Refuses the authenticated user's pending invitation to a project.
 */
export async function refuseProjectInvite(projectId: number): Promise<ProjectMember> {
  try {
    const { data } = await apiClient.patch<MemberSchema>(`/projects/${projectId}/members/refuse`)
    return mapMemberFromApi(data)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Changes the role of an existing project member.
 */
export async function changeMemberRole(
  projectId: number,
  memberId: number,
  input: ChangeMemberRoleInput,
): Promise<ProjectMember> {
  try {
    const payload = mapChangeMemberRoleToApi(input)
    const { data } = await apiClient.patch<MemberSchema>(
      `/projects/${projectId}/members/${memberId}`,
      payload,
    )
    return mapMemberFromApi(data)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Removes a member from the specified project.
 */
export async function removeMember(projectId: number, memberId: number): Promise<void> {
  try {
    await apiClient.delete(`/projects/${projectId}/members/${memberId}`)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Members API composable exposing invitation, role management, and listing operations.
 */
export function useMembersApi() {
  return {
    listMembers,
    inviteMember,
    acceptProjectInvite,
    refuseProjectInvite,
    changeMemberRole,
    removeMember,
  }
}
