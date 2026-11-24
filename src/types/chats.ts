/**
 * Domain representation of a chat conversation summary.
 */
export interface ChatSummary {
  id: number
  title: string
  projectId: number
  ownerId: number
  createdAt: string
  updatedAt: string
  updatedAtLabel: string
}

/**
 * Domain role of a chat message author.
 */
export type ChatMessageRole = 'human' | 'ai'

/**
 * Optional workflow execution step attached to an assistant message.
 */
export interface ChatWorkflowStep {
  id: string
  title: string
  summary: string
}

/**
 * Domain representation of a chat message.
 */
export interface ChatMessageItem {
  id: number
  chatId: number
  parentId: number | null
  role: ChatMessageRole
  content: string
  steps?: ChatWorkflowStep[]
  payload: Record<string, unknown>
  metaData: Record<string, unknown>
  createdAt: string
}

/**
 * Input required to send a new chat message.
 */
export interface SendChatMessageInput {
  chatId?: number | null
  projectId?: number | null
  apiKeyId: number
  text: string
  config?: Record<string, unknown> | null
}

/**
 * Normalized result returned after sending a chat message.
 */
export interface SendChatMessageResult {
  chatId: number | null
  chat?: ChatSummary
  messages: ChatMessageItem[]
  raw: unknown
}
