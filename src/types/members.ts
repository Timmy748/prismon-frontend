/**
 * Domain representation of a member's role within a project.
 */
export type MemberRole = 'owner' | 'director' | 'member' | 'collaborator'

/**
 * Domain representation of a project membership status.
 */
export type MemberStatus = 'pending' | 'active' | 'removed'

/**
 * Project member domain model consumed by UI components and stores.
 */
export interface ProjectMember {
  id: number
  projectId: number
  userId: number
  userLabel: string
  role: MemberRole
  roleLabel: string
  status: MemberStatus
  statusLabel: string
  createdAt: string
  updatedAt: string
  createdAtLabel: string
}

/**
 * Input required to invite a user to a project.
 */
export interface InviteMemberInput {
  userId: number
}

/**
 * Input required to update a project member's role.
 */
export interface ChangeMemberRoleInput {
  role: MemberRole
}
