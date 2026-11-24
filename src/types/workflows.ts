/**
 * Option available for a dynamic select field in workflow configuration.
 */
export interface WorkflowConfigOption {
  label: string
  value: string
}

/**
 * Primitive value stored for an individual workflow configuration field.
 */
export type WorkflowConfigFieldValue = string | number | boolean

/**
 * Domain representation of a single dynamic field inside a workflow node.
 */
export interface WorkflowConfigField {
  name: string
  label: string
  type: string
  defaultValue?: WorkflowConfigFieldValue
  options: WorkflowConfigOption[]
  description: string
  placeholder?: string
  required?: boolean
}

/**
 * Domain representation of a configurable node/subgraph within a workflow.
 */
export interface WorkflowConfigNode {
  id: string
  label: string
  fields: WorkflowConfigField[]
}

/**
 * Editable configuration values grouped by workflow node ID and field name.
 */
export type WorkflowConfigValues = Record<string, Record<string, WorkflowConfigFieldValue>>

/**
 * Domain representation of an available workflow.
 */
export interface WorkflowItem {
  id: number
  name: string
  description: string
  version: string
  versionLabel: string
  configNodes: WorkflowConfigNode[]
  createdAt: string
  updatedAt: string
}
