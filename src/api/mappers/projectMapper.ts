import { formatApiDate } from '@/api/mappers/formatters'
import type { CreateProjectSchema, ProjectSchema, UpdateProjectSchema } from '@/api/types/projects'
import type { CreateProjectInput, Project, UpdateProjectInput } from '@/types/projects'

/**
 * Converts a backend `ProjectSchema` DTO into a domain `Project` model.
 */
export function mapProjectFromApi(dto: ProjectSchema): Project {
  return {
    id: dto.id,
    name: dto.name,
    ownerId: dto.owner_id,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    createdAtLabel: formatApiDate(dto.created_at),
  }
}

/**
 * Converts a domain `CreateProjectInput` into a backend `CreateProjectSchema` payload.
 */
export function mapCreateProjectToApi(input: CreateProjectInput): CreateProjectSchema {
  return {
    name: input.name.trim(),
  }
}

/**
 * Converts a domain `UpdateProjectInput` into a backend `UpdateProjectSchema` payload.
 */
export function mapUpdateProjectToApi(input: UpdateProjectInput): UpdateProjectSchema {
  if (input.name === undefined) {
    return {}
  }

  return {
    name: input.name === null ? null : input.name.trim(),
  }
}
