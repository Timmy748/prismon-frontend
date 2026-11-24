import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockClient, mockSetUnauthorizedHandler, unauthorizedCallbacks } = vi.hoisted(() => {
  const callbacks: Array<(() => void) | null> = []
  type HttpMethodMock = (
    url: string,
    data?: unknown,
    config?: unknown,
  ) => Promise<{ data: unknown }>
  return {
    mockClient: {
      get: vi.fn<HttpMethodMock>(),
      post: vi.fn<HttpMethodMock>(),
      put: vi.fn<HttpMethodMock>(),
      patch: vi.fn<HttpMethodMock>(),
      delete: vi.fn<HttpMethodMock>(),
    },
    unauthorizedCallbacks: callbacks,
    mockSetUnauthorizedHandler: vi.fn<(handler: (() => void) | null) => void>(
      (handler: (() => void) | null) => {
        callbacks.push(handler)
      },
    ),
  }
})

vi.mock('@/api/client', () => ({
  apiClient: mockClient,
  setUnauthorizedHandler: mockSetUnauthorizedHandler,
  setAuthRefreshEnabled: vi.fn<(enabled: boolean) => void>(),
  runWithoutAuthRefresh: <T>(operation: () => Promise<T>) => operation(),
}))

import { ApiRequestError } from '@/api/errors'
import {
  mapChangePasswordToApi,
  mapLoginToApi,
  mapRegisterToApi,
  mapUpdateUserToApi,
  mapUserFromApi,
} from '@/api/mappers/authMapper'
import type { UserSchema } from '@/api/types/auth'
import { useAuthApi } from '@/composables/api/useAuthApi'
import { _resetAuthForTesting, useAuthState } from '@/stores/authState'

function makeUserDto(overrides: Partial<UserSchema> = {}): UserSchema {
  return {
    id: 42,
    username: 'ana.ribeiro',
    email: 'ana@prismon.dev',
    created_at: '2026-11-22T15:30:00Z',
    updated_at: '2026-11-22T16:00:00Z',
    ...overrides,
  }
}

function makeAxiosError(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders()
  const response: AxiosResponse = {
    data,
    status,
    statusText: String(status),
    headers,
    config: { headers },
  }
  return new AxiosError(
    `Request failed with status ${status}`,
    'ERR_BAD_REQUEST',
    { headers },
    undefined,
    response,
  )
}

function makeNetworkError(): AxiosError {
  const headers = new AxiosHeaders()
  return new AxiosError('Network Error', 'ERR_NETWORK', { headers })
}

describe('authMapper', () => {
  it('maps UserSchema DTO to AuthUser domain model', () => {
    const dto = makeUserDto()
    const mapped = mapUserFromApi(dto)

    expect(mapped.id).toBe(42)
    expect(mapped.username).toBe('ana.ribeiro')
    expect(mapped.email).toBe('ana@prismon.dev')
    expect(mapped.createdAt).toBe('2026-11-22T15:30:00Z')
    expect(mapped.updatedAt).toBe('2026-11-22T16:00:00Z')
    expect(mapped.createdAtLabel).toBeTruthy()
    expect(mapped.createdAtLabel).not.toBe('—')
  })

  it('maps LoginInput to LoginSchema', () => {
    expect(mapLoginToApi({ email: 'ana@prismon.dev', password: 'secret' })).toEqual({
      email: 'ana@prismon.dev',
      password: 'secret',
    })
  })

  it('maps RegisterInput password to password_hash in CreateUserSchema', () => {
    expect(
      mapRegisterToApi({
        username: 'ana.ribeiro',
        email: 'ana@prismon.dev',
        password: 'plain-password',
      }),
    ).toEqual({
      username: 'ana.ribeiro',
      email: 'ana@prismon.dev',
      password_hash: 'plain-password',
    })
  })

  it('maps UpdateProfileInput omitting undefined fields and keeping nullable fields', () => {
    expect(mapUpdateUserToApi({ username: 'ana.nova' })).toEqual({
      username: 'ana.nova',
    })
    expect(mapUpdateUserToApi({ username: null, email: 'novo@prismon.dev' })).toEqual({
      username: null,
      email: 'novo@prismon.dev',
    })
  })

  it('maps ChangePasswordInput to UpdateUserPasswordSchema', () => {
    expect(
      mapChangePasswordToApi({
        oldPassword: 'old-secret',
        newPassword: 'new-secret',
      }),
    ).toEqual({
      old_password: 'old-secret',
      new_password: 'new-secret',
    })
  })
})

describe('useAuthApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls POST /login with mapped credentials', async () => {
    mockClient.post.mockResolvedValueOnce({ data: undefined })
    const api = useAuthApi()

    await api.login({ email: 'ana@prismon.dev', password: 'secret' })

    expect(mockClient.post).toHaveBeenCalledWith('/login', {
      email: 'ana@prismon.dev',
      password: 'secret',
    })
  })

  it('calls POST /users with password_hash and returns mapped AuthUser', async () => {
    const dto = makeUserDto()
    mockClient.post.mockResolvedValueOnce({ data: dto })
    const api = useAuthApi()

    const user = await api.register({
      username: 'ana.ribeiro',
      email: 'ana@prismon.dev',
      password: 'secret',
    })

    expect(mockClient.post).toHaveBeenCalledWith('/users', {
      username: 'ana.ribeiro',
      email: 'ana@prismon.dev',
      password_hash: 'secret',
    })
    expect(user).toEqual(mapUserFromApi(dto))
  })

  it('calls POST /refresh-token and POST /logout', async () => {
    mockClient.post.mockResolvedValue({ data: undefined })
    const api = useAuthApi()

    await api.refreshSession()
    await api.logout()

    expect(mockClient.post).toHaveBeenNthCalledWith(1, '/refresh-token')
    expect(mockClient.post).toHaveBeenNthCalledWith(2, '/logout')
  })

  it('calls GET /me and returns mapped AuthUser', async () => {
    const dto = makeUserDto()
    mockClient.get.mockResolvedValueOnce({ data: dto })
    const api = useAuthApi()

    const user = await api.fetchCurrentUser()

    expect(mockClient.get).toHaveBeenCalledWith('/me')
    expect(user).toEqual(mapUserFromApi(dto))
  })

  it('calls PUT /me with profile payload and returns mapped AuthUser', async () => {
    const dto = makeUserDto({ username: 'ana.atualizada' })
    mockClient.put.mockResolvedValueOnce({ data: dto })
    const api = useAuthApi()

    const user = await api.updateCurrentUser({ username: 'ana.atualizada' })

    expect(mockClient.put).toHaveBeenCalledWith('/me', { username: 'ana.atualizada' })
    expect(user.username).toBe('ana.atualizada')
  })

  it('calls PATCH /me/change-password with snake_case payload and returns mapped AuthUser', async () => {
    const dto = makeUserDto()
    mockClient.patch.mockResolvedValueOnce({ data: dto })
    const api = useAuthApi()

    const user = await api.changePassword({
      oldPassword: 'old-password',
      newPassword: 'new-password',
    })

    expect(mockClient.patch).toHaveBeenCalledWith('/me/change-password', {
      old_password: 'old-password',
      new_password: 'new-password',
    })
    expect(user).toEqual(mapUserFromApi(dto))
  })

  it('parses 422 HTTPValidationError into structured ApiRequestError', async () => {
    mockClient.post.mockRejectedValueOnce(
      makeAxiosError(422, {
        detail: [
          {
            loc: ['body', 'email'],
            msg: 'value is not a valid email address',
            type: 'value_error.email',
          },
        ],
      }),
    )
    const api = useAuthApi()

    let captured: unknown
    try {
      await api.register({
        username: 'ana',
        email: 'invalid-email',
        password: 'secret',
      })
    } catch (error) {
      captured = error
    }

    expect(captured).toBeInstanceOf(ApiRequestError)
    const apiError = captured as ApiRequestError
    expect(apiError.status).toBe(422)
    expect(apiError.fieldErrors).toEqual({
      email: 'value is not a valid email address',
    })
    expect(apiError.message).toContain('email: value is not a valid email address')
  })
})

describe('useAuthState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _resetAuthForTesting()
  })

  it('registers an unauthorized handler that clears the session', async () => {
    const dto = makeUserDto()
    mockClient.get.mockResolvedValueOnce({ data: dto })
    const auth = useAuthState()

    await auth.loadSession()
    expect(auth.isAuthenticated.value).toBe(true)

    const registeredHandler = unauthorizedCallbacks[0]
    expect(typeof registeredHandler).toBe('function')
    registeredHandler?.()

    expect(auth.currentUser.value).toBeNull()
    expect(auth.isAuthenticated.value).toBe(false)
    expect(auth.sessionChecked.value).toBe(true)
  })

  it('loads session, deduplicates concurrent calls, and handles 401 cleanly', async () => {
    const dto = makeUserDto()
    let resolveGet: ((value: { data: UserSchema }) => void) | undefined
    mockClient.get.mockImplementationOnce(
      () =>
        new Promise<{ data: UserSchema }>((resolve) => {
          resolveGet = resolve
        }),
    )

    const auth = useAuthState()
    const firstCall = auth.loadSession()
    const secondCall = auth.loadSession()

    expect(mockClient.get).toHaveBeenCalledTimes(1)
    resolveGet?.({ data: dto })

    const [firstUser, secondUser] = await Promise.all([firstCall, secondCall])
    expect(firstUser).toEqual(mapUserFromApi(dto))
    expect(secondUser).toEqual(mapUserFromApi(dto))
    expect(auth.isAuthenticated.value).toBe(true)
    expect(auth.sessionChecked.value).toBe(true)

    mockClient.get.mockRejectedValueOnce(makeAxiosError(401, { detail: 'Unauthorized' }))
    const unauthUser = await auth.loadSession()

    expect(unauthUser).toBeNull()
    expect(auth.currentUser.value).toBeNull()
    expect(auth.isAuthenticated.value).toBe(false)
    expect(auth.sessionChecked.value).toBe(true)
  })

  it('propagates non-401 errors from loadSession while marking sessionChecked', async () => {
    mockClient.get.mockRejectedValueOnce(makeAxiosError(500, { detail: 'Internal error' }))
    const auth = useAuthState()

    await expect(auth.loadSession()).rejects.toBeInstanceOf(ApiRequestError)
    expect(auth.sessionChecked.value).toBe(true)
  })

  it('logs in by calling POST /login then GET /me and storing currentUser', async () => {
    const dto = makeUserDto()
    mockClient.post.mockResolvedValueOnce({ data: undefined })
    mockClient.get.mockResolvedValueOnce({ data: dto })
    const auth = useAuthState()

    const user = await auth.login({ email: 'ana@prismon.dev', password: 'secret' })

    expect(mockClient.post).toHaveBeenCalledWith('/login', {
      email: 'ana@prismon.dev',
      password: 'secret',
    })
    expect(mockClient.get).toHaveBeenCalledWith('/me')
    expect(user).toEqual(mapUserFromApi(dto))
    expect(auth.currentUser.value).toEqual(user)
    expect(auth.isAuthenticated.value).toBe(true)
    expect(auth.isAuthenticating.value).toBe(false)
    expect(auth.sessionChecked.value).toBe(true)
  })

  it('registers by calling POST /users then automatically logging in via POST /login', async () => {
    const dto = makeUserDto()
    mockClient.post.mockResolvedValueOnce({ data: dto }).mockResolvedValueOnce({ data: undefined })
    const auth = useAuthState()

    const user = await auth.register({
      username: 'ana.ribeiro',
      email: 'ana@prismon.dev',
      password: 'secret',
    })

    expect(mockClient.post).toHaveBeenNthCalledWith(1, '/users', {
      username: 'ana.ribeiro',
      email: 'ana@prismon.dev',
      password_hash: 'secret',
    })
    expect(mockClient.post).toHaveBeenNthCalledWith(2, '/login', {
      email: 'ana@prismon.dev',
      password: 'secret',
    })
    expect(user).toEqual(mapUserFromApi(dto))
    expect(auth.currentUser.value).toEqual(user)
    expect(auth.isAuthenticated.value).toBe(true)
    expect(auth.isAuthenticating.value).toBe(false)
  })

  it('updates profile and password in reactive state', async () => {
    const updatedDto = makeUserDto({ username: 'ana.silva' })
    mockClient.put.mockResolvedValueOnce({ data: updatedDto })
    mockClient.patch.mockResolvedValueOnce({ data: updatedDto })
    const auth = useAuthState()

    await auth.updateProfile({ username: 'ana.silva' })
    expect(auth.currentUser.value?.username).toBe('ana.silva')

    await auth.changePassword({ oldPassword: 'old', newPassword: 'new' })
    expect(auth.currentUser.value?.username).toBe('ana.silva')
  })

  it('logs out cleanly even on 401 or network error and resets with _resetAuthForTesting', async () => {
    const dto = makeUserDto()
    mockClient.get.mockResolvedValueOnce({ data: dto })
    const auth = useAuthState()
    await auth.loadSession()

    mockClient.post.mockRejectedValueOnce(makeAxiosError(401, { detail: 'Expired' }))
    await auth.logout()
    expect(auth.currentUser.value).toBeNull()
    expect(auth.sessionChecked.value).toBe(true)

    mockClient.get.mockResolvedValueOnce({ data: dto })
    await auth.loadSession()
    expect(auth.isAuthenticated.value).toBe(true)

    mockClient.post.mockRejectedValueOnce(makeNetworkError())
    await auth.logout()
    expect(auth.currentUser.value).toBeNull()
    expect(auth.sessionChecked.value).toBe(true)

    mockClient.get.mockResolvedValueOnce({ data: dto })
    await auth.loadSession()
    _resetAuthForTesting()

    expect(auth.currentUser.value).toBeNull()
    expect(auth.isAuthenticated.value).toBe(false)
    expect(auth.sessionChecked.value).toBe(false)
    expect(auth.isAuthenticating.value).toBe(false)
  })
})
