/**
 * Option definition for a select field inside a workflow node configuration.
 */
export interface WorkflowConfigOptionSchema {
  label: string
  value: string
}

/**
 * Dynamic field definition returned inside workflow node configuration maps.
 */
export interface WorkflowConfigFieldSchema {
  name: string
  type: string
  default?: string | number | boolean | null
  options?: WorkflowConfigOptionSchema[]
  description?: string | null
  label?: string | null
  placeholder?: string | null
  required?: boolean
}

/**
 * Map of workflow node/graph keys to their configurable field schemas.
 */
export type WorkflowConfigSchema = Record<string, WorkflowConfigFieldSchema[]>

/**
 * Workflow entity schema returned by the backend API.
 */
export interface WorkflowSchema {
  id: number
  name: string
  description: string
  version: string
  config?: WorkflowConfigSchema | Record<string, unknown>
  created_at: string
  updated_at: string
}
