/**
 * Chat entity schema returned by the backend API.
 */
export interface ChatSchema {
  id: number
  title: string
  project_id: number
  owner: number
  created_at: string
  updated_at: string
}

/**
 * Message sender role values accepted and returned by the API.
 */
export type SenderTypeApi = 'assistant' | 'user'

/**
 * Chat message schema returned by the backend API.
 */
export interface MessageSchema {
  id: number
  chat_id: number
  parent_id: number | null
  sender_type: SenderTypeApi
  text: string
  payload: Record<string, unknown>
  meta_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * Request payload for creating and sending a chat message.
 */
export interface CreateMessageSchema {
  chat_id?: number | null
  project_id?: number | null
  api_key_id: number
  text: string
  config?: Record<string, unknown> | null
}

/**
 * Request payload for renaming a chat.
 */
export interface UpdateChatTitleSchema {
  title: string
}
