import { apiClient } from '@/api/client'
import { parseApiError } from '@/api/errors'
import {
  mapChangePasswordToApi,
  mapLoginToApi,
  mapRegisterToApi,
  mapUpdateUserToApi,
  mapUserFromApi,
} from '@/api/mappers/authMapper'
import type { UserSchema } from '@/api/types/auth'
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/types/auth'

/**
 * Contract returned by `useAuthApi()`.
 */
export interface AuthApi {
  login(input: LoginInput): Promise<void>
  register(input: RegisterInput): Promise<AuthUser>
  refreshSession(): Promise<void>
  logout(): Promise<void>
  fetchCurrentUser(): Promise<AuthUser>
  updateCurrentUser(input: UpdateProfileInput): Promise<AuthUser>
  changePassword(input: ChangePasswordInput): Promise<AuthUser>
}

async function runApiCall<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Provides decoupled Auth & Users API operations backed by `apiClient`.
 */
export function useAuthApi(): AuthApi {
  async function login(input: LoginInput): Promise<void> {
    return runApiCall(async () => {
      await apiClient.post('/login', mapLoginToApi(input))
    })
  }

  async function register(input: RegisterInput): Promise<AuthUser> {
    return runApiCall(async () => {
      const { data } = await apiClient.post<UserSchema>('/users', mapRegisterToApi(input))
      return mapUserFromApi(data)
    })
  }

  async function refreshSession(): Promise<void> {
    return runApiCall(async () => {
      await apiClient.post('/refresh-token')
    })
  }

  async function logout(): Promise<void> {
    return runApiCall(async () => {
      await apiClient.post('/logout')
    })
  }

  async function fetchCurrentUser(): Promise<AuthUser> {
    return runApiCall(async () => {
      const { data } = await apiClient.get<UserSchema>('/me')
      return mapUserFromApi(data)
    })
  }

  async function updateCurrentUser(input: UpdateProfileInput): Promise<AuthUser> {
    return runApiCall(async () => {
      const { data } = await apiClient.put<UserSchema>('/me', mapUpdateUserToApi(input))
      return mapUserFromApi(data)
    })
  }

  async function changePassword(input: ChangePasswordInput): Promise<AuthUser> {
    return runApiCall(async () => {
      const { data } = await apiClient.patch<UserSchema>(
        '/me/change-password',
        mapChangePasswordToApi(input),
      )
      return mapUserFromApi(data)
    })
  }

  return {
    login,
    register,
    refreshSession,
    logout,
    fetchCurrentUser,
    updateCurrentUser,
    changePassword,
  }
}
