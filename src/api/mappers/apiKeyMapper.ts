import { formatApiDate } from '@/api/mappers/formatters'
import type { ApiKeyHintSchema, CreateApiKeySchema } from '@/api/types/apiKeys'
import type { ApiKeyItem, ApiKeyScope, CreateApiKeyInput } from '@/types/apiKeys'

/**
 * Converts a backend `ApiKeyHintSchema` DTO into a domain `ApiKeyItem` model.
 */
export function mapApiKeyFromApi(dto: ApiKeyHintSchema, scope: ApiKeyScope): ApiKeyItem {
  return {
    id: dto.id,
    provider: dto.provider,
    hint: dto.api_hint,
    scope,
    createdAt: dto.created_at,
    createdAtLabel: formatApiDate(dto.created_at, 'compact'),
  }
}

/**
 * Converts a domain `CreateApiKeyInput` into a backend `CreateApiKeySchema` payload.
 */
export function mapCreateApiKeyToApi(input: CreateApiKeyInput): CreateApiKeySchema {
  return {
    provider: input.provider,
    api_key: input.apiKey.trim(),
  }
}
