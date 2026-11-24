/**
 * Authenticated user domain model consumed by UI components and stores.
 */
export interface AuthUser {
  id: number
  username: string
  email: string
  createdAt: string
  updatedAt: string
  createdAtLabel: string
}

/**
 * Credentials required to sign in an existing user.
 */
export interface LoginInput {
  email: string
  password: string
}

/**
 * Input required to register a new user account.
 */
export interface RegisterInput {
  username: string
  email: string
  password: string
}

/**
 * Input for updating the authenticated user's profile fields.
 */
export interface UpdateProfileInput {
  username?: string | null
  email?: string | null
}

/**
 * Input for changing the authenticated user's password.
 */
export interface ChangePasswordInput {
  oldPassword: string
  newPassword: string
}
