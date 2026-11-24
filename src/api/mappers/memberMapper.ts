import { formatApiDate } from '@/api/mappers/formatters'
import type { ChangeMemberRoleSchema, InviteMemberSchema, MemberSchema } from '@/api/types/members'
import type {
  ChangeMemberRoleInput,
  InviteMemberInput,
  MemberRole,
  MemberStatus,
  ProjectMember,
} from '@/types/members'

const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Proprietário',
  director: 'Diretor',
  member: 'Membro',
  collaborator: 'Colaborador',
}

const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  pending: 'Pendente',
  active: 'Ativo',
  removed: 'Removido',
}

/**
 * Translates a domain `MemberRole` into a human-readable pt-BR label.
 */
export function getMemberRoleLabel(role: MemberRole): string {
  return MEMBER_ROLE_LABELS[role] ?? role
}

/**
 * Translates a domain `MemberStatus` into a human-readable pt-BR label.
 */
export function getMemberStatusLabel(status: MemberStatus): string {
  return MEMBER_STATUS_LABELS[status] ?? status
}

/**
 * Converts a backend `MemberSchema` DTO into a domain `ProjectMember` model.
 */
export function mapMemberFromApi(dto: MemberSchema): ProjectMember {
  return {
    id: dto.id,
    projectId: dto.project_id,
    userId: dto.user_id,
    userLabel: `Usuário #${dto.user_id}`,
    role: dto.role,
    roleLabel: getMemberRoleLabel(dto.role),
    status: dto.status,
    statusLabel: getMemberStatusLabel(dto.status),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    createdAtLabel: formatApiDate(dto.created_at, 'compact'),
  }
}

/**
 * Converts a domain `InviteMemberInput` into a backend `InviteMemberSchema` payload.
 */
export function mapInviteMemberToApi(input: InviteMemberInput): InviteMemberSchema {
  return {
    user_id: input.userId,
  }
}

/**
 * Converts a domain `ChangeMemberRoleInput` into a backend `ChangeMemberRoleSchema` payload.
 */
export function mapChangeMemberRoleToApi(input: ChangeMemberRoleInput): ChangeMemberRoleSchema {
  return {
    new_role: input.role,
  }
}
