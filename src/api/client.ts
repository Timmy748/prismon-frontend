import axios, { type AxiosRequestConfig } from 'axios'

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

/**
 * Normalizes the configured API base URL from `API_BASE_URL`,
 * defaulting to `/api` when unset or blank.
 */
export function normalizeApiBaseUrl(rawUrl?: string): string {
  const trimmed = rawUrl?.trim()
  if (!trimmed) {
    return '/api'
  }
  if (trimmed === '/') {
    return ''
  }
  return trimmed.replace(/\/+$/, '')
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.API_BASE_URL)

const AUTH_BYPASS_PATHS = ['/login', '/refresh-token', '/logout', '/users']

let refreshPromise: Promise<void> | null = null
let unauthorizedHandler: (() => void) | null = null

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
})

/**
 * Registers a callback invoked when token refresh fails on a 401 response.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false
  return AUTH_BYPASS_PATHS.some((path) => url === path || url.startsWith(`${path}?`))
}

async function runTokenRefresh(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/refresh-token')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableRequestConfig
    const status = error.response?.status

    if (status !== 401 || originalRequest._retry || shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      await runTokenRefresh()
      return apiClient.request(originalRequest)
    } catch (refreshError) {
      unauthorizedHandler?.()
      return Promise.reject(refreshError)
    }
  },
)

/**
 * Resolves a relative API endpoint into a usable URL (respecting Vite proxy / API_BASE_URL).
 */
export function resolveApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

/**
 * Uploads a binary file directly to a presigned storage URL returned by the API.
 */
export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  method = 'PUT',
  requiredHeaders: Record<string, string> = {},
): Promise<void> {
  const headers: Record<string, string> = { ...requiredHeaders }
  const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')
  if (!hasContentType && file.type) {
    headers['Content-Type'] = file.type
  }

  await axios.request({
    url: uploadUrl,
    method: method.toUpperCase(),
    data: file,
    headers,
    withCredentials: false,
  })
}
