import type { WorkflowSchema } from '@/api/types/workflows'
import type {
  WorkflowConfigField,
  WorkflowConfigFieldValue,
  WorkflowConfigNode,
  WorkflowConfigOption,
  WorkflowConfigValues,
  WorkflowItem,
} from '@/types/workflows'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFieldPrimitive(value: unknown): value is WorkflowConfigFieldValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function formatReadableName(rawName: string): string {
  return rawName
    .replace(/[_-]+/g, ' ')
    .trim()
}

function mapConfigOptions(rawOptions: unknown): WorkflowConfigOption[] {
  if (!Array.isArray(rawOptions)) {
    return []
  }

  const options: WorkflowConfigOption[] = []
  for (const item of rawOptions) {
    if (!isRecord(item)) continue
    const rawValue = item.value
    const value =
      typeof rawValue === 'string'
        ? rawValue
        : typeof rawValue === 'number' || typeof rawValue === 'boolean'
          ? String(rawValue)
          : null
    if (value === null) continue

    const label =
      typeof item.label === 'string' && item.label.trim().length > 0 ? item.label : value
    options.push({ label, value })
  }

  return options
}

function mapConfigField(rawField: unknown): WorkflowConfigField | null {
  if (!isRecord(rawField) || typeof rawField.name !== 'string' || !rawField.name.trim()) {
    return null
  }

  const name = rawField.name.trim()
  const rawType = typeof rawField.type === 'string' ? rawField.type.trim().toLowerCase() : 'text'
  const type = rawType || 'text'
  const label =
    typeof rawField.label === 'string' && rawField.label.trim().length > 0
      ? rawField.label.trim()
      : formatReadableName(name)
  const description = typeof rawField.description === 'string' ? rawField.description.trim() : ''
  const placeholder =
    typeof rawField.placeholder === 'string' && rawField.placeholder.trim().length > 0
      ? rawField.placeholder.trim()
      : undefined
  const defaultValue = isFieldPrimitive(rawField.default) ? rawField.default : undefined
  const options = mapConfigOptions(rawField.options)
  const required = typeof rawField.required === 'boolean' ? rawField.required : undefined

  return {
    name,
    label,
    type,
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    options,
    description,
    ...(placeholder !== undefined ? { placeholder } : {}),
    ...(required !== undefined ? { required } : {}),
  }
}

/**
 * Translates an API workflow config dictionary (`{ [nodeKey]: FieldSchema[] }`) into ordered UI nodes.
 */
export function mapWorkflowConfigFromApi(rawConfig: unknown): WorkflowConfigNode[] {
  if (!isRecord(rawConfig)) {
    return []
  }

  const nodes: WorkflowConfigNode[] = []
  for (const [nodeId, rawFields] of Object.entries(rawConfig)) {
    if (!Array.isArray(rawFields)) continue
    const fields = rawFields
      .map(mapConfigField)
      .filter((field): field is WorkflowConfigField => field !== null)

    nodes.push({
      id: nodeId,
      label: formatReadableName(nodeId),
      fields,
    })
  }

  return nodes
}

/**
 * Builds an editable form value map seeded with field defaults and optional prior values.
 */
export function buildWorkflowConfigValues(
  nodes: WorkflowConfigNode[],
  existingValues?: WorkflowConfigValues | null,
): WorkflowConfigValues {
  const result: WorkflowConfigValues = {}

  for (const node of nodes) {
    const nodeValues: Record<string, WorkflowConfigFieldValue> = {}
    const existingNodeValues = existingValues?.[node.id]

    for (const field of node.fields) {
      const existingVal = existingNodeValues?.[field.name]
      if (isFieldPrimitive(existingVal)) {
        nodeValues[field.name] = existingVal
        continue
      }

      if (field.defaultValue !== undefined) {
        nodeValues[field.name] = field.defaultValue
        continue
      }

      if (field.type === 'select' && field.options.length > 0) {
        nodeValues[field.name] = field.options[0]!.value
      } else if (field.type === 'boolean' || field.type === 'checkbox' || field.type === 'toggle') {
        nodeValues[field.name] = false
      } else {
        nodeValues[field.name] = ''
      }
    }

    result[node.id] = nodeValues
  }

  return result
}

/**
 * Serializes form config values for `POST /chats/messages`, omitting unset empty optional values.
 */
export function serializeWorkflowConfigPayload(
  values: WorkflowConfigValues | null | undefined,
): Record<string, Record<string, WorkflowConfigFieldValue>> | undefined {
  if (!values) {
    return undefined
  }

  const serialized: Record<string, Record<string, WorkflowConfigFieldValue>> = {}
  for (const [nodeId, nodeFields] of Object.entries(values)) {
    if (!isRecord(nodeFields)) continue

    const cleanFields: Record<string, WorkflowConfigFieldValue> = {}
    for (const [fieldName, fieldValue] of Object.entries(nodeFields)) {
      if (typeof fieldValue === 'string') {
        const trimmed = fieldValue.trim()
        if (trimmed.length > 0) {
          cleanFields[fieldName] = trimmed
        }
      } else if (typeof fieldValue === 'number' || typeof fieldValue === 'boolean') {
        cleanFields[fieldName] = fieldValue
      }
    }

    if (Object.keys(cleanFields).length > 0) {
      serialized[nodeId] = cleanFields
    }
  }

  return Object.keys(serialized).length > 0 ? serialized : undefined
}

/**
 * Translates a WorkflowSchema API DTO into a WorkflowItem domain model.
 */
export function mapWorkflowFromApi(dto: WorkflowSchema): WorkflowItem {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    version: dto.version,
    versionLabel: `Versão: ${dto.version}`,
    configNodes: mapWorkflowConfigFromApi(dto.config),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}
