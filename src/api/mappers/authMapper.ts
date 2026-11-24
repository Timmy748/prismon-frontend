import { formatApiDate } from '@/api/mappers/formatters'
import type {
  CreateUserSchema,
  LoginSchema,
  UpdateUserPasswordSchema,
  UpdateUserSchema,
  UserSchema,
} from '@/api/types/auth'
import type {
  AuthUser,
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/types/auth'

/**
 * Maps a raw API user DTO into the camelCase AuthUser domain model.
 */
export function mapUserFromApi(dto: UserSchema): AuthUser {
  return {
    id: dto.id,
    username: dto.username,
    email: dto.email,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    createdAtLabel: formatApiDate(dto.created_at),
  }
}

/**
 * Maps domain login credentials into the `POST /login` API request payload.
 */
export function mapLoginToApi(input: LoginInput): LoginSchema {
  return {
    email: input.email,
    password: input.password,
  }
}

/**
 * Maps domain registration input into the `POST /users` API payload.
 */
export function mapRegisterToApi(input: RegisterInput): CreateUserSchema {
  return {
    username: input.username,
    email: input.email,
    password_hash: input.password,
  }
}

/**
 * Maps domain profile update input into the `PUT /me` API payload.
 */
export function mapUpdateUserToApi(input: UpdateProfileInput): UpdateUserSchema {
  const payload: UpdateUserSchema = {}
  if (input.username !== undefined) {
    payload.username = input.username
  }
  if (input.email !== undefined) {
    payload.email = input.email
  }
  return payload
}

/**
 * Maps domain password change input into the `PATCH /me/change-password` API payload.
 */
export function mapChangePasswordToApi(input: ChangePasswordInput): UpdateUserPasswordSchema {
  return {
    old_password: input.oldPassword,
    new_password: input.newPassword,
  }
}
