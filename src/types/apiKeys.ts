/**
 * Supported API key provider in the domain layer.
 */
export type ApiKeyProvider = 'openrouter'

/**
 * Scope distinguishing project-wide keys from member-scoped keys.
 */
export type ApiKeyScope = 'project' | 'member'

/**
 * Masked API key domain model consumed by UI components and stores.
 */
export interface ApiKeyItem {
  id: number
  provider: ApiKeyProvider
  hint: string
  scope: ApiKeyScope
  createdAt: string
  createdAtLabel: string
}

/**
 * Input required to register a new API key.
 */
export interface CreateApiKeyInput {
  provider: ApiKeyProvider
  apiKey: string
}
