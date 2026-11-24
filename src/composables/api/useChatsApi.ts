import axios from 'axios'
import { apiClient } from '@/api/client'
import { parseApiError } from '@/api/errors'
import {
  mapChatFromApi,
  mapCreateMessageToApi,
  mapMessageFromApi,
  mapSendMessageResponseFromApi,
} from '@/api/mappers/chatMapper'
import type { ChatSchema, MessageSchema, UpdateChatTitleSchema } from '@/api/types/chats'
import {
  mapPageFromApi,
  type CursorPaginationParams,
  type PageSchema,
  type PaginatedResult,
} from '@/api/types/common'
import type {
  ChatMessageItem,
  ChatSummary,
  SendChatMessageInput,
  SendChatMessageResult,
} from '@/types/chats'

export interface SendMessageOptions {
  onStreamUpdate?: (result: SendChatMessageResult) => void
  timeoutMs?: number
}

/**
 * Contract returned by the {@link useChatsApi} composable.
 */
export interface UseChatsApi {
  listProjectChats: (
    projectId: number,
    params?: CursorPaginationParams,
  ) => Promise<PaginatedResult<ChatSummary>>
  listChatMessages: (
    chatId: number,
    params?: CursorPaginationParams,
  ) => Promise<PaginatedResult<ChatMessageItem>>
  sendMessage: (
    input: SendChatMessageInput,
    options?: SendMessageOptions,
  ) => Promise<SendChatMessageResult>
  updateChatTitle: (chatId: number, title: string) => Promise<ChatSummary>
  deleteChat: (chatId: number) => Promise<void>
}

/**
 * Fetches a cursor-paginated list of chats belonging to a project.
 */
export async function listProjectChats(
  projectId: number,
  params?: CursorPaginationParams,
): Promise<PaginatedResult<ChatSummary>> {
  try {
    const response = await apiClient.get<PageSchema<ChatSchema>>(
      `/projects/${projectId}/chats`,
      params ? { params } : undefined,
    )
    return mapPageFromApi(response.data, mapChatFromApi)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Fetches a cursor-paginated list of messages within a chat.
 */
export async function listChatMessages(
  chatId: number,
  params?: CursorPaginationParams,
): Promise<PaginatedResult<ChatMessageItem>> {
  try {
    const response = await apiClient.get<PageSchema<MessageSchema>>(
      `/chats/${chatId}/messages`,
      params ? { params } : undefined,
    )
    return mapPageFromApi(response.data, mapMessageFromApi)
  } catch (error) {
    throw parseApiError(error)
  }
}

function isReadableStream(value: unknown): value is ReadableStream<Uint8Array> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getReader' in value &&
    typeof (value as ReadableStream<Uint8Array>).getReader === 'function'
  )
}

async function consumeTextStream(
  stream: ReadableStream<Uint8Array>,
  onChunkText?: (accumulatedText: string) => void,
): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')
  let accumulated = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) {
        accumulated += decoder.decode(value, { stream: true })
        onChunkText?.(accumulated)
      }
    }
    const tail = decoder.decode()
    if (tail) {
      accumulated += tail
      onChunkText?.(accumulated)
    }
    return accumulated
  } finally {
    reader.releaseLock()
  }
}

/**
 * Sends a message to an existing or newly created chat and streams SSE tokens when supported.
 */
export async function sendMessage(
  input: SendChatMessageInput,
  options?: SendMessageOptions,
): Promise<SendChatMessageResult> {
  try {
    const payload = mapCreateMessageToApi(input)
    const fallbackChatId = input.chatId ?? null

    const response = await apiClient.post<unknown>('/chats/messages', payload, {
      adapter: 'fetch',
      responseType: 'stream',
      timeout: options?.timeoutMs ?? 120000,
      headers: {
        Accept: 'text/event-stream, application/json',
      },
      onDownloadProgress: options?.onStreamUpdate
        ? (progressEvent) => {
            const target = progressEvent.event?.target as { responseText?: unknown } | null
            if (target && typeof target.responseText === 'string' && target.responseText.trim()) {
              const partial = mapSendMessageResponseFromApi(target.responseText, fallbackChatId, {
                partial: true,
              })
              options.onStreamUpdate?.(partial)
            }
          }
        : undefined,
    })

    if (isReadableStream(response.data)) {
      const fullText = await consumeTextStream(response.data, (accumulated) => {
        if (!options?.onStreamUpdate) return
        const partial = mapSendMessageResponseFromApi(accumulated, fallbackChatId, {
          partial: true,
        })
        options.onStreamUpdate(partial)
      })
      return mapSendMessageResponseFromApi(fullText, fallbackChatId, { partial: false })
    }

    return mapSendMessageResponseFromApi(response.data, fallbackChatId)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && isReadableStream(error.response.data)) {
      try {
        const errorText = await consumeTextStream(error.response.data)
        try {
          error.response.data = JSON.parse(errorText) as unknown
        } catch {
          error.response.data = { detail: errorText }
        }
      } catch {
        // Ignore stream read failure while handling AxiosError
      }
    }
    throw parseApiError(error)
  }
}

/**
 * Updates the title of an existing chat.
 */
export async function updateChatTitle(chatId: number, title: string): Promise<ChatSummary> {
  try {
    const payload: UpdateChatTitleSchema = { title }
    const response = await apiClient.patch<ChatSchema>(`/chats/${chatId}`, payload)
    return mapChatFromApi(response.data)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Deletes an existing chat by ID.
 */
export async function deleteChat(chatId: number): Promise<void> {
  try {
    await apiClient.delete(`/chats/${chatId}`)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * Composable providing chat and message API operations.
 */
export function useChatsApi(): UseChatsApi {
  return {
    listProjectChats,
    listChatMessages,
    sendMessage,
    updateChatTitle,
    deleteChat,
  }
}
