import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  API_BASE_URL,
  apiClient,
  normalizeApiBaseUrl,
  resolveApiUrl,
  runWithoutAuthRefresh,
  setAuthRefreshEnabled,
} from '@/api/client'

function makeAdapterError(status: number, config: InternalAxiosRequestConfig): AxiosError {
  const headers = new AxiosHeaders()
  const response: AxiosResponse = {
    data: { detail: 'Unauthorized' },
    status,
    statusText: 'Unauthorized',
    headers,
    config,
  }
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, response)
}

describe('api/client environment configuration & auth refresh', () => {
  afterEach(() => {
    setAuthRefreshEnabled(true)
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

  it('does NOT call /refresh-token when disabled (login screen) or inside runWithoutAuthRefresh', async () => {
    const calledUrls: string[] = []
    const originalAdapter = apiClient.defaults.adapter
    apiClient.defaults.adapter = async (config) => {
      calledUrls.push(config.url ?? '')
      throw makeAdapterError(401, config)
    }

    try {
      setAuthRefreshEnabled(false)
      await expect(apiClient.get('/me')).rejects.toMatchObject({ response: { status: 401 } })
      expect(calledUrls).toEqual(['/me'])

      calledUrls.length = 0
      setAuthRefreshEnabled(true)
      await expect(runWithoutAuthRefresh(() => apiClient.get('/me'))).rejects.toMatchObject({
        response: { status: 401 },
      })
      expect(calledUrls).toEqual(['/me'])

      calledUrls.length = 0
      await expect(apiClient.post('/login', {})).rejects.toMatchObject({
        response: { status: 401 },
      })
      expect(calledUrls).toEqual(['/login'])
    } finally {
      apiClient.defaults.adapter = originalAdapter
    }
  })

  it('calls /refresh-token and retries request when enabled inside the app', async () => {
    const calledUrls: string[] = []
    let projectsAttempts = 0
    const originalAdapter = apiClient.defaults.adapter

    apiClient.defaults.adapter = async (config) => {
      calledUrls.push(config.url ?? '')
      if (config.url === '/projects') {
        projectsAttempts += 1
        if (projectsAttempts === 1) {
          throw makeAdapterError(401, config)
        }
        return {
          data: { items: [] },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config,
        }
      }
      if (config.url === '/refresh-token') {
        return {
          data: { ok: true },
          status: 200,
          statusText: 'OK',
          headers: new AxiosHeaders(),
          config,
        }
      }
      throw new Error(`Unexpected url ${config.url}`)
    }

    try {
      setAuthRefreshEnabled(true)
      const response = await apiClient.get('/projects')
      expect(response.status).toBe(200)
      expect(calledUrls).toEqual(['/projects', '/refresh-token', '/projects'])
    } finally {
      apiClient.defaults.adapter = originalAdapter
    }
  })
})
