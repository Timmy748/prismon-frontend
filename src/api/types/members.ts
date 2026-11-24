/**
 * Member role values accepted and returned by the backend Members API.
 */
export type MemberRoleApi = 'owner' | 'director' | 'member' | 'collaborator'

/**
 * Member status values returned by the backend Members API.
 */
export type MemberStatusApi = 'pending' | 'active' | 'removed'

/**
 * Raw project member payload returned by the backend Members API.
 */
export interface MemberSchema {
  id: number
  project_id: number
  user_id: number
  role: MemberRoleApi
  status: MemberStatusApi
  created_at: string
  updated_at: string
}

/**
 * Request payload for `POST /projects/{project_id}/members`.
 */
export interface InviteMemberSchema {
  user_id: number
}

/**
 * Request payload for `PATCH /projects/{project_id}/members/{member_id}`.
 */
export interface ChangeMemberRoleSchema {
  new_role: MemberRoleApi | string
}
