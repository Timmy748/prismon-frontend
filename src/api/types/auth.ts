/**
 * Raw user payload returned by the backend Auth & Users API.
 */
export interface UserSchema {
  id: number
  username: string
  email: string
  created_at: string
  updated_at: string
}

/**
 * Request payload for `POST /login`.
 */
export interface LoginSchema {
  email: string
  password: string
}

/**
 * Request payload for `POST /users`.
 */
export interface CreateUserSchema {
  username: string
  email: string
  password_hash: string
}

/**
 * Request payload for `PUT /me`.
 */
export interface UpdateUserSchema {
  username?: string | null
  email?: string | null
}

/**
 * Request payload for `PATCH /me/change-password`.
 */
export interface UpdateUserPasswordSchema {
  old_password: string
  new_password: string
}
