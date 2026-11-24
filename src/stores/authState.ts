import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { setUnauthorizedHandler } from '@/api/client'
import { parseApiError } from '@/api/errors'
import { useAuthApi } from '@/composables/api/useAuthApi'
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/types/auth'

/**
 * Reactive auth state and session actions returned by `useAuthState()`.
 */
export interface AuthState {
  currentUser: Ref<AuthUser | null>
  isAuthenticated: ComputedRef<boolean>
  sessionChecked: Ref<boolean>
  isAuthenticating: Ref<boolean>
  loadSession(): Promise<AuthUser | null>
  login(input: LoginInput): Promise<AuthUser>
  register(input: RegisterInput): Promise<AuthUser>
  updateProfile(input: UpdateProfileInput): Promise<AuthUser>
  changePassword(input: ChangePasswordInput): Promise<AuthUser>
  logout(): Promise<void>
  clearSession(): void
}

const currentUserState = ref<AuthUser | null>(null)
const isAuthenticatedState = computed(() => currentUserState.value !== null)
const sessionCheckedState = ref(false)
const isAuthenticatingState = ref(false)

let pendingSessionPromise: Promise<AuthUser | null> | null = null

const authApi = useAuthApi()

/**
 * Clears the local authenticated user while marking the session as checked.
 */
export function clearSession(): void {
  currentUserState.value = null
  sessionCheckedState.value = true
}

setUnauthorizedHandler(() => {
  clearSession()
})

/**
 * Loads the current session from `/me`, deduplicating concurrent calls and treating 401 as unauthenticated.
 */
export async function loadSession(): Promise<AuthUser | null> {
  if (pendingSessionPromise) {
    return pendingSessionPromise
  }

  pendingSessionPromise = (async () => {
    try {
      const user = await authApi.fetchCurrentUser()
      currentUserState.value = user
      sessionCheckedState.value = true
      return user
    } catch (error) {
      const parsed = parseApiError(error)
      sessionCheckedState.value = true
      if (parsed.status === 401) {
        currentUserState.value = null
        return null
      }
      throw parsed
    }
  })().finally(() => {
    pendingSessionPromise = null
  })

  return pendingSessionPromise
}

/**
 * Authenticates a user via `/login` and hydrates `currentUser` from `/me`.
 */
export async function login(input: LoginInput): Promise<AuthUser> {
  isAuthenticatingState.value = true
  try {
    await authApi.login(input)
    const user = await authApi.fetchCurrentUser()
    currentUserState.value = user
    sessionCheckedState.value = true
    return user
  } finally {
    isAuthenticatingState.value = false
  }
}

/**
 * Registers a new user via `/users`, automatically signs in, and stores `currentUser`.
 */
export async function register(input: RegisterInput): Promise<AuthUser> {
  isAuthenticatingState.value = true
  try {
    const user = await authApi.register(input)
    await authApi.login({ email: input.email, password: input.password })
    currentUserState.value = user
    sessionCheckedState.value = true
    return user
  } finally {
    isAuthenticatingState.value = false
  }
}

/**
 * Updates the current user's profile and synchronizes `currentUser`.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  const updated = await authApi.updateCurrentUser(input)
  currentUserState.value = updated
  return updated
}

/**
 * Changes the current user's password and synchronizes `currentUser`.
 */
export async function changePassword(input: ChangePasswordInput): Promise<AuthUser> {
  const updated = await authApi.changePassword(input)
  currentUserState.value = updated
  return updated
}

/**
 * Signs out the current user, ignoring 401 and network failures cleanly while clearing local state.
 */
export async function logout(): Promise<void> {
  try {
    await authApi.logout()
  } catch (error) {
    const parsed = parseApiError(error)
    if (parsed.status !== undefined && parsed.status !== 401) {
      throw parsed
    }
  } finally {
    currentUserState.value = null
    sessionCheckedState.value = true
  }
}

/**
 * Resets singleton auth state for isolated unit tests.
 */
export function _resetAuthForTesting(): void {
  currentUserState.value = null
  sessionCheckedState.value = false
  isAuthenticatingState.value = false
  pendingSessionPromise = null
}

/**
 * Exposes shared reactive authentication state and session lifecycle actions.
 */
export function useAuthState(): AuthState {
  return {
    currentUser: currentUserState,
    isAuthenticated: isAuthenticatedState,
    sessionChecked: sessionCheckedState,
    isAuthenticating: isAuthenticatingState,
    loadSession,
    login,
    register,
    updateProfile,
    changePassword,
    logout,
    clearSession,
  }
}
