/**
 * Project domain model consumed by UI components and stores.
 */
export interface Project {
  id: number
  name: string
  ownerId: number
  createdAt: string
  updatedAt: string
  createdAtLabel: string
}

/**
 * Input required to create a new project.
 */
export interface CreateProjectInput {
  name: string
}

/**
 * Input for updating an existing project.
 */
export interface UpdateProjectInput {
  name?: string | null
}
