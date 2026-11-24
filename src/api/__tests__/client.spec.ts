import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_BASE_URL, apiClient, normalizeApiBaseUrl, resolveApiUrl } from '@/api/client'

describe('api/client environment configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('normalizes configured base URLs and falls back to /api when empty', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('/api')
    expect(normalizeApiBaseUrl('')).toBe('/api')
    expect(normalizeApiBaseUrl('   ')).toBe('/api')
    expect(normalizeApiBaseUrl('/')).toBe('')
    expect(normalizeApiBaseUrl('  https://api.prismon.ai///  ')).toBe('https://api.prismon.ai')
    expect(normalizeApiBaseUrl('/v1/api/')).toBe('/v1/api')
  })

  it('uses /api by default and resolves relative endpoints consistently', () => {
    expect(API_BASE_URL).toBe('/api')
    expect(apiClient.defaults.baseURL).toBe('/api')
    expect(resolveApiUrl('/projects/1/files')).toBe('/api/projects/1/files')
    expect(resolveApiUrl('projects/1/files')).toBe('/api/projects/1/files')
  })

  it('configures apiClient.defaults.baseURL and resolveApiUrl from API_BASE_URL', async () => {
    vi.stubEnv('API_BASE_URL', 'https://backend.prismon.dev/')
    vi.resetModules()

    const freshClient = await import('@/api/client')
    expect(freshClient.API_BASE_URL).toBe('https://backend.prismon.dev')
    expect(freshClient.apiClient.defaults.baseURL).toBe('https://backend.prismon.dev')
    expect(freshClient.resolveApiUrl('/workflows/')).toBe(
      'https://backend.prismon.dev/workflows/',
    )
  })
})
