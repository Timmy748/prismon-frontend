import { formatApiDate } from '@/api/mappers/formatters'
import type {
  ChatSchema,
  CreateMessageSchema,
  MessageSchema,
  SenderTypeApi,
} from '@/api/types/chats'
import type {
  ChatMessageItem,
  ChatMessageRole,
  ChatSummary,
  ChatWorkflowStep,
  SendChatMessageInput,
  SendChatMessageResult,
} from '@/types/chats'

const SENDER_ROLE_MAP: Record<SenderTypeApi, ChatMessageRole> = {
  user: 'human',
  assistant: 'ai',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSenderType(value: unknown): value is SenderTypeApi {
  return value === 'user' || value === 'assistant'
}

function parseStepsFromCandidate(candidate: unknown): ChatWorkflowStep[] {
  if (!Array.isArray(candidate)) return []

  const steps: ChatWorkflowStep[] = []
  for (const [index, item] of candidate.entries()) {
    if (!isRecord(item)) continue
    if (typeof item.title !== 'string' || typeof item.summary !== 'string') continue

    let id = `step-${index + 1}`
    if (typeof item.id === 'string' && item.id.trim().length > 0) {
      id = item.id
    } else if (typeof item.id === 'number') {
      id = String(item.id)
    }

    steps.push({
      id,
      title: item.title,
      summary: item.summary,
    })
  }

  return steps
}

function extractWorkflowSteps(
  payload: Record<string, unknown>,
  metaData: Record<string, unknown>,
): ChatWorkflowStep[] | undefined {
  const payloadSteps = parseStepsFromCandidate(payload.steps)
  if (payloadSteps.length > 0) {
    return payloadSteps
  }

  const metaSteps = parseStepsFromCandidate(metaData.steps)
  if (metaSteps.length > 0) {
    return metaSteps
  }

  return undefined
}

function normalizeMessageSchema(
  value: unknown,
  inheritedChatId: number | null,
): { schema: MessageSchema; explicitChatId: number | null } | null {
  if (!isRecord(value)) return null
  if (
    typeof value.id !== 'number' ||
    typeof value.text !== 'string' ||
    !isSenderType(value.sender_type)
  ) {
    return null
  }

  const explicitChatId = typeof value.chat_id === 'number' ? value.chat_id : null
  const resolvedChatId = explicitChatId ?? inheritedChatId ?? 0

  return {
    explicitChatId,
    schema: {
      id: value.id,
      chat_id: resolvedChatId,
      parent_id: typeof value.parent_id === 'number' ? value.parent_id : null,
      sender_type: value.sender_type,
      text: value.text,
      payload: isRecord(value.payload) ? value.payload : {},
      meta_data: isRecord(value.meta_data) ? value.meta_data : {},
      created_at: typeof value.created_at === 'string' ? value.created_at : '',
      updated_at: typeof value.updated_at === 'string' ? value.updated_at : '',
    },
  }
}

/**
 * Translates a ChatSchema API DTO into a ChatSummary domain model.
 */
export function mapChatFromApi(dto: ChatSchema): ChatSummary {
  return {
    id: dto.id,
    title: dto.title,
    projectId: dto.project_id,
    ownerId: dto.owner,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    updatedAtLabel: formatApiDate(dto.updated_at),
  }
}

/**
 * Translates a MessageSchema API DTO into a ChatMessageItem domain model.
 */
export function mapMessageFromApi(dto: MessageSchema): ChatMessageItem {
  const payload = isRecord(dto.payload) ? dto.payload : {}
  const metaData = isRecord(dto.meta_data) ? dto.meta_data : {}
  const steps = extractWorkflowSteps(payload, metaData)

  return {
    id: dto.id,
    chatId: dto.chat_id,
    parentId: dto.parent_id,
    role: SENDER_ROLE_MAP[dto.sender_type],
    content: dto.text,
    ...(steps ? { steps } : {}),
    payload,
    metaData,
    createdAt: dto.created_at,
  }
}

/**
 * Translates a SendChatMessageInput domain payload into a CreateMessageSchema API payload.
 */
export function mapCreateMessageToApi(input: SendChatMessageInput): CreateMessageSchema {
  return {
    ...(input.chatId !== undefined ? { chat_id: input.chatId } : {}),
    ...(input.projectId !== undefined ? { project_id: input.projectId } : {}),
    api_key_id: input.apiKeyId,
    text: input.text,
    ...(input.config !== undefined ? { config: input.config } : {}),
  }
}

export interface ParseSendMessageOptions {
  partial?: boolean
}

function normalizeChatSchema(value: unknown, eventName = ''): ChatSummary | null {
  if (!isRecord(value)) return null
  if (isSenderType(value.sender_type)) return null
  if (typeof value.id !== 'number' || typeof value.title !== 'string') return null
  if (
    eventName !== 'chat' &&
    typeof value.project_id !== 'number' &&
    typeof value.owner !== 'number'
  ) {
    return null
  }

  return mapChatFromApi({
    id: value.id,
    title: value.title,
    project_id: typeof value.project_id === 'number' ? value.project_id : 0,
    owner: typeof value.owner === 'number' ? value.owner : 0,
    created_at: typeof value.created_at === 'string' ? value.created_at : '',
    updated_at: typeof value.updated_at === 'string' ? value.updated_at : '',
  })
}

function getCompleteSseSlice(rawText: string, isPartialStream: boolean): string {
  if (!isPartialStream) {
    return rawText
  }
  if (rawText.endsWith('\n') || rawText.endsWith('\r')) {
    return rawText
  }
  const hasSseMarkers =
    rawText.includes('event:') || rawText.includes('data:') || rawText.includes('\n')
  if (!hasSseMarkers) {
    return rawText
  }
  const lastNewline = rawText.lastIndexOf('\n')
  return lastNewline >= 0 ? rawText.slice(0, lastNewline + 1) : ''
}

function extractChatIdFromCandidate(record: Record<string, unknown>): number | null {
  if (typeof record.chat_id === 'number') {
    return record.chat_id
  }
  if (isRecord(record.chat) && typeof record.chat.id === 'number') {
    return record.chat.id
  }
  if (isRecord(record.data)) {
    return extractChatIdFromCandidate(record.data)
  }
  return null
}

function extractTextTokenFromChunk(record: Record<string, unknown>, eventName = ''): string {
  for (const key of ['delta', 'token', 'chunk']) {
    if (typeof record[key] === 'string') {
      return record[key]
    }
  }
  if (isRecord(record.delta)) {
    if (typeof record.delta.content === 'string') {
      return record.delta.content
    }
    if (typeof record.delta.text === 'string') {
      return record.delta.text
    }
  }
  if (Array.isArray(record.choices) && record.choices.length > 0) {
    const firstChoice = record.choices[0]
    if (isRecord(firstChoice)) {
      if (isRecord(firstChoice.delta) && typeof firstChoice.delta.content === 'string') {
        return firstChoice.delta.content
      }
      if (isRecord(firstChoice.message) && typeof firstChoice.message.content === 'string') {
        return firstChoice.message.content
      }
    }
  }
  if (isRecord(record.data)) {
    const nestedToken = extractTextTokenFromChunk(record.data, eventName)
    if (nestedToken) {
      return nestedToken
    }
  }

  const isExplicitTokenEvent = /token|delta|chunk/i.test(eventName)
  if (
    (!isSenderType(record.sender_type) && typeof record.id !== 'number') ||
    isExplicitTokenEvent
  ) {
    if (typeof record.content === 'string') {
      return record.content
    }
    if (typeof record.text === 'string') {
      return record.text
    }
  }
  return ''
}

function parseStreamedTextResponse(
  rawText: string,
  fallbackChatId: number | null,
  options?: ParseSendMessageOptions,
): SendChatMessageResult {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return {
      chatId: fallbackChatId,
      messages: [],
      raw: rawText,
    }
  }

  // Try plain JSON string first (when full payload is a single JSON object/array)
  if (!options?.partial && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
    try {
      const parsedJson = JSON.parse(trimmed) as unknown
      return mapSendMessageResponseFromApi(parsedJson, fallbackChatId)
    } catch {
      // Fall through to line-by-line SSE / NDJSON parsing
    }
  }

  const processableText = getCompleteSseSlice(rawText, Boolean(options?.partial))
  if (!processableText.trim()) {
    return {
      chatId: fallbackChatId,
      messages: [],
      raw: rawText,
    }
  }

  let resolvedChatId: number | null = null
  let resolvedChat: ChatSummary | null = null
  const messages: ChatMessageItem[] = []
  const seenIds = new Set<number>()
  let accumulatedTokens = ''
  let plainTokens = ''
  let currentEvent = ''

  for (const rawLine of processableText.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim()
    if (!trimmedLine) {
      currentEvent = ''
      continue
    }
    if (trimmedLine.startsWith(':') || trimmedLine.startsWith('id:')) {
      continue
    }
    if (trimmedLine.startsWith('event:')) {
      currentEvent = trimmedLine.slice(6).trim()
      continue
    }

    const payloadText = trimmedLine.startsWith('data:')
      ? rawLine.slice(rawLine.indexOf('data:') + 5).replace(/^ /, '')
      : trimmedLine
    const payloadTrimmed = payloadText.trim()
    if (!payloadTrimmed || payloadTrimmed === '[DONE]') {
      continue
    }

    if (currentEvent === 'error') {
      try {
        const parsedError = JSON.parse(payloadTrimmed) as Record<string, unknown>
        const errMsg =
          typeof parsedError.detail === 'string'
            ? parsedError.detail
            : typeof parsedError.message === 'string'
              ? parsedError.message
              : typeof parsedError.error === 'string'
                ? parsedError.error
                : payloadTrimmed
        throw new Error(errMsg)
      } catch (err) {
        if (err instanceof Error && !(err instanceof SyntaxError)) {
          throw err
        }
        throw new Error(payloadTrimmed)
      }
    }

    try {
      const parsed = JSON.parse(payloadTrimmed) as unknown
      if (isRecord(parsed)) {
        if (typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
          throw new Error(parsed.error)
        }

        const eventChat = normalizeChatSchema(parsed, currentEvent)
        if (eventChat) {
          resolvedChat = eventChat
          if (resolvedChatId === null) {
            resolvedChatId = eventChat.id
          }
          continue
        }

        const candidateChatId = extractChatIdFromCandidate(parsed)
        if (resolvedChatId === null && candidateChatId !== null) {
          resolvedChatId = candidateChatId
        }

        const isExplicitTokenEvent = /token|delta|chunk/i.test(currentEvent)
        if (!isExplicitTokenEvent) {
          const nested = mapSendMessageResponseFromApi(parsed, resolvedChatId ?? fallbackChatId)
          if (resolvedChatId === null && nested.chatId !== null) {
            resolvedChatId = nested.chatId
          }
          for (const msg of nested.messages) {
            if (msg.id > 0 && seenIds.has(msg.id)) continue
            if (msg.id > 0) seenIds.add(msg.id)
            messages.push(msg)
          }
        }

        const token = extractTextTokenFromChunk(parsed, currentEvent)
        if (token) {
          accumulatedTokens += token
        }
      } else if (typeof parsed === 'string') {
        accumulatedTokens += parsed
      }
    } catch (err) {
      if (err instanceof Error && !(err instanceof SyntaxError)) {
        throw err
      }
      plainTokens += payloadText
    }
  }

  const finalChatId = resolvedChatId ?? fallbackChatId
  const hasAssistantMessage = messages.some((msg) => msg.role === 'ai')
  if (!hasAssistantMessage) {
    const fallbackContent = accumulatedTokens || plainTokens
    if (fallbackContent.length > 0) {
      messages.push({
        id: -1,
        chatId: finalChatId ?? 0,
        parentId: null,
        role: 'ai',
        content: fallbackContent,
        payload: {},
        metaData: {},
        createdAt: new Date().toISOString(),
      })
    }
  }

  return {
    chatId: finalChatId,
    ...(resolvedChat ? { chat: resolvedChat } : {}),
    messages,
    raw: rawText,
  }
}

/**
 * Defensively normalizes the untyped POST /chats/messages response (JSON, envelope, or SSE/NDJSON text)
 * into a SendChatMessageResult.
 */
export function mapSendMessageResponseFromApi(
  data: unknown,
  fallbackChatId?: number | null,
  options?: ParseSendMessageOptions,
): SendChatMessageResult {
  const defaultChatId = fallbackChatId ?? null

  if (typeof data === 'string') {
    return parseStreamedTextResponse(data, defaultChatId, options)
  }

  if (Array.isArray(data)) {
    const messages: ChatMessageItem[] = []
    let firstExplicitChatId: number | null = null

    for (const entry of data) {
      const normalized = normalizeMessageSchema(entry, defaultChatId)
      if (!normalized) continue
      if (firstExplicitChatId === null && normalized.explicitChatId !== null) {
        firstExplicitChatId = normalized.explicitChatId
      }
      messages.push(mapMessageFromApi(normalized.schema))
    }

    return {
      chatId: firstExplicitChatId ?? defaultChatId,
      messages,
      raw: data,
    }
  }

  if (isRecord(data)) {
    const directMessage = normalizeMessageSchema(data, defaultChatId)
    if (directMessage) {
      return {
        chatId: directMessage.explicitChatId ?? defaultChatId,
        messages: [mapMessageFromApi(directMessage.schema)],
        raw: data,
      }
    }

    const envelopeChatId = extractChatIdFromCandidate(data)
    const inheritedChatId = envelopeChatId ?? defaultChatId

    const nestedData = isRecord(data.data) ? data.data : null
    const candidates: unknown[] = [
      data.user_message,
      data.message,
      ...(Array.isArray(data.messages) ? data.messages : []),
      data.assistant_message,
      data.reply,
      data.response,
      data.answer,
      ...(nestedData
        ? [
            nestedData.user_message,
            nestedData.message,
            ...(Array.isArray(nestedData.messages) ? nestedData.messages : []),
            nestedData.assistant_message,
            nestedData.reply,
          ]
        : []),
    ]

    const messages: ChatMessageItem[] = []
    const seenIds = new Set<number>()
    let firstExplicitChatId: number | null = null

    for (const candidate of candidates) {
      const normalized = normalizeMessageSchema(candidate, inheritedChatId)
      if (!normalized) continue
      if (seenIds.has(normalized.schema.id)) continue

      seenIds.add(normalized.schema.id)
      if (firstExplicitChatId === null && normalized.explicitChatId !== null) {
        firstExplicitChatId = normalized.explicitChatId
      }
      messages.push(mapMessageFromApi(normalized.schema))
    }

    const resolvedChatId = envelopeChatId ?? firstExplicitChatId ?? defaultChatId
    if (messages.length === 0) {
      const fallbackText =
        typeof data.reply === 'string'
          ? data.reply
          : typeof data.answer === 'string'
            ? data.answer
            : typeof data.content === 'string'
              ? data.content
              : typeof data.text === 'string'
                ? data.text
                : ''
      if (fallbackText.trim().length > 0) {
        messages.push({
          id: -1,
          chatId: resolvedChatId ?? 0,
          parentId: null,
          role: 'ai',
          content: fallbackText,
          payload: {},
          metaData: {},
          createdAt: new Date().toISOString(),
        })
      }
    }

    return {
      chatId: resolvedChatId,
      messages,
      raw: data,
    }
  }

  return {
    chatId: defaultChatId,
    messages: [],
    raw: data,
  }
}
