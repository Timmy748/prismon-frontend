import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { ApiRequestError } from '@/api/errors'
import {
  mapChatFromApi,
  mapCreateMessageToApi,
  mapMessageFromApi,
  mapSendMessageResponseFromApi,
} from '@/api/mappers/chatMapper'
import { formatApiDate } from '@/api/mappers/formatters'
import { mapWorkflowFromApi } from '@/api/mappers/workflowMapper'
import type { ChatSchema, MessageSchema } from '@/api/types/chats'
import type { WorkflowSchema } from '@/api/types/workflows'
import { useChatsApi } from '@/composables/api/useChatsApi'
import { useWorkflowsApi } from '@/composables/api/useWorkflowsApi'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    put: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  uploadFileToPresignedUrl: vi.fn<(...args: unknown[]) => Promise<void>>(),
  resolveApiUrl: vi.fn<(path: string) => string>(
    (path: string) => `/api${path.startsWith('/') ? path : `/${path}`}`,
  ),
}))

function createAxiosError(status: number, data: unknown): AxiosError {
  const headers = new AxiosHeaders()
  return new AxiosError(
    `Request failed with status ${status}`,
    AxiosError.ERR_BAD_REQUEST,
    { headers },
    {},
    {
      status,
      statusText: 'Error',
      headers,
      config: { headers },
      data,
    },
  )
}

function makeChatDto(overrides: Partial<ChatSchema> = {}): ChatSchema {
  return {
    id: 10,
    title: 'Análise de Requisitos',
    project_id: 3,
    owner: 7,
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-22T14:30:00Z',
    ...overrides,
  }
}

function makeMessageDto(overrides: Partial<MessageSchema> = {}): MessageSchema {
  return {
    id: 101,
    chat_id: 10,
    parent_id: null,
    sender_type: 'user',
    text: 'Olá, preciso de ajuda com o projeto.',
    payload: {},
    meta_data: {},
    created_at: '2026-11-22T14:30:00Z',
    updated_at: '2026-11-22T14:30:00Z',
    ...overrides,
  }
}

function makeWorkflowDto(overrides: Partial<WorkflowSchema> = {}): WorkflowSchema {
  return {
    id: 5,
    name: 'Code Review Pipeline',
    description: 'Executa revisão automatizada de código.',
    version: '2.1.0',
    config: {
      rag: [
        {
          name: 'provider',
          type: 'select',
          default: 'ollama',
          options: [
            { label: 'Ollama', value: 'ollama' },
            { label: 'OpenRouter', value: 'openrouter' },
          ],
          description: 'Provedor do modelo de linguagem.',
        },
        {
          name: 'model',
          type: 'model',
          description: 'Modelo de linguagem usado neste grafo.',
        },
      ],
    },
    created_at: '2026-10-01T08:00:00Z',
    updated_at: '2026-11-15T12:00:00Z',
    ...overrides,
  }
}

describe('useChatsApi & useWorkflowsApi', () => {
  const chatsApi = useChatsApi()
  const workflowsApi = useWorkflowsApi()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('chat mappers', () => {
    it('maps ChatSchema to ChatSummary with formatted updatedAtLabel', () => {
      const dto = makeChatDto()
      const mapped = mapChatFromApi(dto)

      expect(mapped).toEqual({
        id: 10,
        title: 'Análise de Requisitos',
        projectId: 3,
        ownerId: 7,
        createdAt: '2026-11-20T10:00:00Z',
        updatedAt: '2026-11-22T14:30:00Z',
        updatedAtLabel: formatApiDate('2026-11-22T14:30:00Z'),
      })
    })

    it('maps user and assistant messages and extracts steps from payload or meta_data', () => {
      const userMsg = mapMessageFromApi(
        makeMessageDto({
          id: 1,
          sender_type: 'user',
          text: 'Pergunta do usuário',
        }),
      )
      expect(userMsg.role).toBe('human')
      expect(userMsg.content).toBe('Pergunta do usuário')
      expect(userMsg.steps).toBeUndefined()

      const assistantWithPayloadSteps = mapMessageFromApi(
        makeMessageDto({
          id: 2,
          parent_id: 1,
          sender_type: 'assistant',
          text: 'Resposta da IA',
          payload: {
            steps: [
              { id: 's-1', title: 'Planejamento', summary: 'Analisou contexto' },
              { title: 'Execução', summary: 'Gerou resposta' },
              { invalid: true },
            ],
          },
        }),
      )
      expect(assistantWithPayloadSteps.role).toBe('ai')
      expect(assistantWithPayloadSteps.steps).toEqual([
        { id: 's-1', title: 'Planejamento', summary: 'Analisou contexto' },
        { id: 'step-2', title: 'Execução', summary: 'Gerou resposta' },
      ])

      const assistantWithMetaSteps = mapMessageFromApi(
        makeMessageDto({
          id: 3,
          sender_type: 'assistant',
          text: 'Resposta com meta_data',
          meta_data: {
            steps: [{ id: 99, title: 'Validação', summary: 'Verificou saída' }],
          },
        }),
      )
      expect(assistantWithMetaSteps.steps).toEqual([
        { id: '99', title: 'Validação', summary: 'Verificou saída' },
      ])
    })

    it('maps SendChatMessageInput to CreateMessageSchema', () => {
      expect(
        mapCreateMessageToApi({
          chatId: 10,
          projectId: null,
          apiKeyId: 4,
          text: 'Nova mensagem',
        }),
      ).toEqual({
        chat_id: 10,
        project_id: null,
        api_key_id: 4,
        text: 'Nova mensagem',
      })

      expect(
        mapCreateMessageToApi({
          projectId: 3,
          apiKeyId: 4,
          text: 'Primeiro prompt',
          config: {
            rag: { provider: 'ollama', model: 'bonsai-2:4b' },
          },
        }),
      ).toEqual({
        project_id: 3,
        api_key_id: 4,
        text: 'Primeiro prompt',
        config: {
          rag: { provider: 'ollama', model: 'bonsai-2:4b' },
        },
      })
    })
  })

  describe('defensive sendMessage response mapping', () => {
    it('handles a single MessageSchema response', () => {
      const dto = makeMessageDto({ id: 201, chat_id: 55, sender_type: 'assistant', text: 'Oi!' })
      const result = mapSendMessageResponseFromApi(dto)

      expect(result.chatId).toBe(55)
      expect(result.messages).toHaveLength(1)
      expect(result.messages[0]?.role).toBe('ai')
      expect(result.messages[0]?.content).toBe('Oi!')
      expect(result.raw).toEqual(dto)
    })

    it('handles an array of MessageSchema items', () => {
      const dtos = [
        makeMessageDto({ id: 1, chat_id: 77, sender_type: 'user', text: 'Pergunta' }),
        makeMessageDto({ id: 2, chat_id: 77, sender_type: 'assistant', text: 'Resposta' }),
      ]
      const result = mapSendMessageResponseFromApi(dtos)

      expect(result.chatId).toBe(77)
      expect(result.messages.map((m) => [m.id, m.role, m.content])).toEqual([
        [1, 'human', 'Pergunta'],
        [2, 'ai', 'Resposta'],
      ])
    })

    it('handles object envelope with user_message and assistant_message', () => {
      const payload = {
        chat_id: 88,
        user_message: makeMessageDto({ id: 11, chat_id: 88, sender_type: 'user', text: 'Oi' }),
        assistant_message: makeMessageDto({
          id: 12,
          chat_id: 88,
          parent_id: 11,
          sender_type: 'assistant',
          text: 'Olá!',
        }),
      }
      const result = mapSendMessageResponseFromApi(payload)

      expect(result.chatId).toBe(88)
      expect(result.messages).toHaveLength(2)
      expect(result.messages[0]?.role).toBe('human')
      expect(result.messages[1]?.role).toBe('ai')
    })

    it('handles object envelope with message, messages, or reply', () => {
      const singleEnvelope = mapSendMessageResponseFromApi({
        chat_id: 90,
        message: makeMessageDto({ id: 30, chat_id: 90, sender_type: 'assistant', text: 'Ok' }),
      })
      expect(singleEnvelope.chatId).toBe(90)
      expect(singleEnvelope.messages).toHaveLength(1)

      const listEnvelope = mapSendMessageResponseFromApi({
        messages: [
          makeMessageDto({ id: 31, chat_id: 91, sender_type: 'user', text: 'A' }),
          makeMessageDto({ id: 32, chat_id: 91, sender_type: 'assistant', text: 'B' }),
        ],
      })
      expect(listEnvelope.chatId).toBe(91)
      expect(listEnvelope.messages).toHaveLength(2)

      const replyEnvelope = mapSendMessageResponseFromApi(
        {
          reply: {
            id: 40,
            sender_type: 'assistant',
            text: 'Resposta rápida',
          },
        },
        123,
      )
      expect(replyEnvelope.chatId).toBe(123)
      expect(replyEnvelope.messages).toHaveLength(1)
      expect(replyEnvelope.messages[0]?.chatId).toBe(123)
      expect(replyEnvelope.messages[0]?.content).toBe('Resposta rápida')
    })

    it('handles SSE streamed text payloads with preceding user message and accumulated reply', () => {
      const ssePayload = [
        'event: message_start\ndata: {"chat_id": 99, "id": 10, "sender_type": "user", "text": "Oi"}',
        'event: token\ndata: {"delta": "Olá, "}',
        'event: token\ndata: {"delta": "como posso ajudar?"}',
        'data: [DONE]',
      ].join('\n\n')

      const result = mapSendMessageResponseFromApi(ssePayload)
      expect(result.chatId).toBe(99)
      expect(result.messages).toHaveLength(2)
      expect(result.messages[0]?.role).toBe('human')
      expect(result.messages[1]?.role).toBe('ai')
      expect(result.messages[1]?.content).toBe('Olá, como posso ajudar?')
    })

    it('streams incremental ReadableStream chunks via onStreamUpdate', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode('data: {"chat_id": 55, "delta": "Bom "}\n\n'))
          controller.enqueue(encoder.encode('data: {"delta": "dia!"}\n\n'))
          controller.close()
        },
      })

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: stream })

      const updates: string[] = []
      const result = await chatsApi.sendMessage(
        { projectId: 3, apiKeyId: 9, text: 'Oi' },
        {
          onStreamUpdate: (partial) => {
            const aiMsg = partial.messages.find((m) => m.role === 'ai')
            if (aiMsg) updates.push(aiMsg.content)
          },
        },
      )

      expect(updates).toEqual(['Bom ', 'Bom dia!'])
      expect(result.chatId).toBe(55)
      expect(result.messages.find((m) => m.role === 'ai')?.content).toBe('Bom dia!')
    })

    it('parses event: chat, JSON string event: token, event: done, and ignores partial JSON chunks until complete', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'event: chat\ndata: {"id":30,"title":"Nova conversa","project_id":5,"owner":5,"created_at":"2026-11-24T12:00:00Z","updated_at":"2026-11-24T12:00:00Z"}\n\n',
            ),
          )
          controller.enqueue(encoder.encode('event: token\ndata: "Ol"\n\nevent: token\ndata: "á'))
          controller.enqueue(encoder.encode('!"\n\n'))
          controller.enqueue(
            encoder.encode(
              'event: done\ndata: {"id":95,"chat_id":30,"parent_id":null,"sender_type":"assistant","text":"Olá!","payload":{},"meta_data":{"workflow":"chat"},"created_at":"2026-11-24T12:00:01Z","updated_at":"2026-11-24T12:00:01Z"}\n\n',
            ),
          )
          controller.close()
        },
      })

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: stream })

      const seenChatIds: Array<number | null> = []
      const updates: string[] = []
      const result = await chatsApi.sendMessage(
        { projectId: 5, apiKeyId: 7, text: 'Oi' },
        {
          onStreamUpdate: (partial) => {
            seenChatIds.push(partial.chatId)
            const aiMsg = partial.messages.find((m) => m.role === 'ai')
            if (aiMsg) updates.push(aiMsg.content)
          },
        },
      )

      expect(seenChatIds[0]).toBe(30)
      expect(updates).toEqual(['Ol', 'Olá!', 'Olá!'])
      expect(result.chatId).toBe(30)
      expect(result.chat?.title).toBe('Nova conversa')
      expect(result.messages[0]?.id).toBe(95)
      expect(result.messages[0]?.content).toBe('Olá!')
    })

    it('emits event: chat update before throwing on subsequent event: error', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'event: chat\ndata: {"id":31,"title":"Nova conversa","project_id":5,"owner":5,"created_at":"2026-11-24T12:00:00Z","updated_at":"2026-11-24T12:00:00Z"}\n\n',
            ),
          )
          controller.enqueue(
            encoder.encode('event: error\ndata: {"message":"model not found"}\n\n'),
          )
          controller.close()
        },
      })

      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: stream })

      let createdChatId: number | null = null
      await expect(
        chatsApi.sendMessage(
          { projectId: 5, apiKeyId: 7, text: 'Oi' },
          {
            onStreamUpdate: (partial) => {
              if (partial.chatId !== null) createdChatId = partial.chatId
            },
          },
        ),
      ).rejects.toThrow('model not found')

      expect(createdChatId).toBe(31)
    })

    it('handles empty or unknown response using fallbackChatId', () => {
      const emptyObjResult = mapSendMessageResponseFromApi({}, 45)
      expect(emptyObjResult).toEqual({ chatId: 45, messages: [], raw: {} })

      const nullResult = mapSendMessageResponseFromApi(null)
      expect(nullResult).toEqual({ chatId: null, messages: [], raw: null })
    })
  })

  describe('useChatsApi endpoints', () => {
    it('listProjectChats calls GET /projects/{id}/chats and maps paginated chats', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          items: [makeChatDto()],
          limit: 20,
          more: true,
          cursor: 'next-cursor-1',
        },
      })

      const result = await chatsApi.listProjectChats(3, { cursor: 'c0', limit: 20 })

      expect(apiClient.get).toHaveBeenCalledWith('/projects/3/chats', {
        params: { cursor: 'c0', limit: 20 },
      })
      expect(result.limit).toBe(20)
      expect(result.hasMore).toBe(true)
      expect(result.nextCursor).toBe('next-cursor-1')
      expect(result.items[0]).toMatchObject({
        id: 10,
        projectId: 3,
        ownerId: 7,
        title: 'Análise de Requisitos',
      })
    })

    it('listChatMessages calls GET /chats/{id}/messages and maps paginated messages', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          items: [
            makeMessageDto({ id: 1, sender_type: 'user', text: 'Oi' }),
            makeMessageDto({ id: 2, sender_type: 'assistant', text: 'Olá!' }),
          ],
          limit: 50,
          more: false,
          cursor: null,
        },
      })

      const result = await chatsApi.listChatMessages(10)

      expect(apiClient.get).toHaveBeenCalledWith('/chats/10/messages', undefined)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()
      expect(result.items.map((item) => item.role)).toEqual(['human', 'ai'])
    })

    it('sendMessage calls POST /chats/messages with mapped payload and normalizes response', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          chat_id: 10,
          assistant_message: makeMessageDto({
            id: 202,
            chat_id: 10,
            sender_type: 'assistant',
            text: 'Pronto!',
          }),
        },
      })

      const result = await chatsApi.sendMessage({
        chatId: 10,
        projectId: 3,
        apiKeyId: 9,
        text: 'Executar tarefa',
      })

      expect(apiClient.post).toHaveBeenCalledWith(
        '/chats/messages',
        {
          chat_id: 10,
          project_id: 3,
          api_key_id: 9,
          text: 'Executar tarefa',
        },
        expect.objectContaining({ timeout: 120000 }),
      )
      expect(result.chatId).toBe(10)
      expect(result.messages).toHaveLength(1)
      expect(result.messages[0]?.content).toBe('Pronto!')
    })

    it('updateChatTitle calls PATCH /chats/{id} and maps ChatSummary', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({
        data: makeChatDto({ id: 10, title: 'Novo Título' }),
      })

      const updated = await chatsApi.updateChatTitle(10, 'Novo Título')

      expect(apiClient.patch).toHaveBeenCalledWith('/chats/10', { title: 'Novo Título' })
      expect(updated.title).toBe('Novo Título')
      expect(updated.projectId).toBe(3)
    })

    it('deleteChat calls DELETE /chats/{id}', async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined })

      await chatsApi.deleteChat(10)

      expect(apiClient.delete).toHaveBeenCalledWith('/chats/10')
    })

    it('wraps chat API failures with parseApiError into ApiRequestError', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(
        createAxiosError(422, {
          detail: [
            {
              loc: ['body', 'text'],
              msg: 'Field required',
              type: 'missing',
            },
          ],
        }),
      )

      let caught: unknown
      try {
        await chatsApi.sendMessage({ apiKeyId: 1, text: '' })
      } catch (err) {
        caught = err
      }

      expect(caught).toBeInstanceOf(ApiRequestError)
      const apiErr = caught as ApiRequestError
      expect(apiErr.status).toBe(422)
      expect(apiErr.fieldErrors).toEqual({ text: 'Field required' })
      expect(apiErr.message).toBe('text: Field required')

      vi.mocked(apiClient.delete).mockRejectedValueOnce(
        createAxiosError(404, { detail: 'Chat não encontrado' }),
      )

      await expect(chatsApi.deleteChat(999)).rejects.toMatchObject({
        name: 'ApiRequestError',
        status: 404,
        message: 'Chat não encontrado',
      })
    })
  })

  describe('workflow mapper & useWorkflowsApi', () => {
    it('maps WorkflowSchema to WorkflowItem with versionLabel and dynamic configNodes', () => {
      const dto = makeWorkflowDto()
      expect(mapWorkflowFromApi(dto)).toEqual({
        id: 5,
        name: 'Code Review Pipeline',
        description: 'Executa revisão automatizada de código.',
        version: '2.1.0',
        versionLabel: 'Versão: 2.1.0',
        configNodes: [
          {
            id: 'rag',
            label: 'rag',
            fields: [
              {
                name: 'provider',
                label: 'provider',
                type: 'select',
                defaultValue: 'ollama',
                options: [
                  { label: 'Ollama', value: 'ollama' },
                  { label: 'OpenRouter', value: 'openrouter' },
                ],
                description: 'Provedor do modelo de linguagem.',
              },
              {
                name: 'model',
                label: 'model',
                type: 'model',
                options: [],
                description: 'Modelo de linguagem usado neste grafo.',
              },
            ],
          },
        ],
        createdAt: '2026-10-01T08:00:00Z',
        updatedAt: '2026-11-15T12:00:00Z',
      })
    })

    it('listWorkflows calls GET /workflows/ and maps paginated workflows', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          items: [makeWorkflowDto()],
          limit: 10,
          more: false,
          cursor: null,
        },
      })

      const result = await workflowsApi.listWorkflows({ limit: 10 })

      expect(apiClient.get).toHaveBeenCalledWith('/workflows/', { params: { limit: 10 } })
      expect(result.limit).toBe(10)
      expect(result.hasMore).toBe(false)
      expect(result.items[0]?.versionLabel).toBe('Versão: 2.1.0')
      expect(result.items[0]?.configNodes).toHaveLength(1)
    })

    it('getWorkflowConfig calls GET /workflows/{name}/config and maps config nodes', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: makeWorkflowDto().config,
      })

      const nodes = await workflowsApi.getWorkflowConfig('chat')

      expect(apiClient.get).toHaveBeenCalledWith('/workflows/chat/config')
      expect(nodes).toHaveLength(1)
      expect(nodes[0]?.id).toBe('rag')
      expect(nodes[0]?.fields.map((f) => f.name)).toEqual(['provider', 'model'])
    })

    it('wraps listWorkflows errors with parseApiError', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        createAxiosError(500, { detail: 'Falha ao carregar workflows' }),
      )

      await expect(workflowsApi.listWorkflows()).rejects.toBeInstanceOf(ApiRequestError)
    })
  })
})
