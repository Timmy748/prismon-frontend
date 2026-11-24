/**
 * Supported LLM provider identifiers for API keys.
 */
export type ApiKeyProviderApi = 'openrouter'

/**
 * Masked API key summary returned by the backend API Keys endpoints.
 */
export interface ApiKeyHintSchema {
  id: number
  provider: ApiKeyProviderApi
  api_hint: string
  created_at: string
}

/**
 * Request payload for creating a project or member API key.
 */
export interface CreateApiKeySchema {
  provider: ApiKeyProviderApi
  api_key: string
}
