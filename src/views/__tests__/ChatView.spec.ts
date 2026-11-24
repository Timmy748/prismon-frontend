import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { apiClient } from '@/api/client'
import type { ApiKeyHintSchema } from '@/api/types/apiKeys'
import type { UserSchema } from '@/api/types/auth'
import type { ChatSchema, MessageSchema } from '@/api/types/chats'
import type { ProjectSchema } from '@/api/types/projects'
import type { WorkflowSchema } from '@/api/types/workflows'
import WorkflowConfigModal from '@/components/chat/WorkflowConfigModal.vue'
import {
  AiCitation,
  AiPromptInput,
  ChatMessage,
  MarkdownRenderer,
  Notification,
  Select,
  WorkflowSlideCard,
  WorkflowStepsAccordion,
  toast,
} from '@/components/ui'
import { _resetAuthForTesting, useAuthState } from '@/stores/authState'
import { _resetRepertoryForTesting, useRepertoryState } from '@/stores/repertoryState'
import { _resetWorkspaceForTesting, useWorkspaceState } from '@/stores/workspaceState'
import ChatView from '../ChatView.vue'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    put: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  setUnauthorizedHandler: vi.fn<(handler: (() => void) | null) => void>(),
  uploadFileToPresignedUrl: vi.fn<(...args: unknown[]) => Promise<void>>(),
  resolveApiUrl: vi.fn<(path: string) => string>(
    (path: string) => `/api${path.startsWith('/') ? path : `/${path}`}`,
  ),
}))

const DummyRouteView = { template: '<div data-testid="dummy-route" />' }

const USER_DTO: UserSchema = {
  id: 1,
  username: 'ana.paula',
  email: 'ana@prismon.ai',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
}

const PROJECT_DTO: ProjectSchema = {
  id: 10,
  name: 'Projeto Prismon',
  owner_id: 1,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
}

const INITIAL_CHATS: ChatSchema[] = [
  {
    id: 101,
    title: 'revisão contratual',
    project_id: 10,
    owner: 1,
    created_at: '2026-11-20T09:00:00Z',
    updated_at: '2026-11-22T12:00:00Z',
  },
]

const INITIAL_MESSAGES_101: MessageSchema[] = [
  {
    id: 501,
    chat_id: 101,
    parent_id: null,
    sender_type: 'user',
    text: 'Quais os riscos da cláusula 5?',
    payload: {},
    meta_data: {},
    created_at: '2026-11-22T12:00:00Z',
    updated_at: '2026-11-22T12:00:00Z',
  },
  {
    id: 502,
    chat_id: 101,
    parent_id: 501,
    sender_type: 'assistant',
    text: 'A cláusula 5 exige prazo de aviso prévio de 60 dias.',
    payload: {
      steps: [
        {
          id: 'step-1',
          title: 'Leitura do contrato',
          summary: 'Identificada cláusula de rescisão e SLA.',
        },
      ],
    },
    meta_data: {},
    created_at: '2026-11-22T12:00:05Z',
    updated_at: '2026-11-22T12:00:05Z',
  },
]

const PROJECT_API_KEYS: ApiKeyHintSchema[] = [
  {
    id: 21,
    provider: 'openrouter',
    api_hint: 'sk-or-•••proj21',
    created_at: '2026-11-10T10:00:00Z',
  },
]

const MEMBER_API_KEYS: ApiKeyHintSchema[] = [
  {
    id: 21,
    provider: 'openrouter',
    api_hint: 'sk-or-•••proj21',
    created_at: '2026-11-10T10:00:00Z',
  },
  {
    id: 22,
    provider: 'openrouter',
    api_hint: 'sk-or-•••mem22',
    created_at: '2026-11-15T10:00:00Z',
  },
]

const DEFAULT_WORKFLOW_CONFIG = {
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
  chat: [
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
}

const WORKFLOW_DTOS: WorkflowSchema[] = [
  {
    id: 1,
    name: 'chat',
    description: 'Conversa simples usando o histórico do chat.',
    version: '1',
    config: DEFAULT_WORKFLOW_CONFIG,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'síntese executiva',
    description: 'Condensa relatórios em recomendações objetivas.',
    version: '2.1.0',
    config: {
      síntese: [
        {
          name: 'tone',
          type: 'select',
          default: 'objetivo',
          options: [
            { label: 'Objetivo', value: 'objetivo' },
            { label: 'Detalhado', value: 'detalhado' },
          ],
          description: 'Tom da síntese.',
        },
      ],
    },
    created_at: '2026-10-02T10:00:00Z',
    updated_at: '2026-11-02T10:00:00Z',
  },
  {
    id: 3,
    name: 'revisão técnica',
    description: 'Inspeciona requisitos de arquitetura e lacunas.',
    version: '3.0.0',
    config: DEFAULT_WORKFLOW_CONFIG,
    created_at: '2026-10-03T10:00:00Z',
    updated_at: '2026-11-03T10:00:00Z',
  },
]

interface ApiMockOptions {
  projectKeys?: ApiKeyHintSchema[]
  memberKeys?: ApiKeyHintSchema[]
  chats?: ChatSchema[]
  messagesByChatId?: Record<number, MessageSchema[]>
  workflows?: WorkflowSchema[]
  workflowsError?: Error | null
}

function setupApiGetMock(options: ApiMockOptions = {}) {
  const chats = options.chats ?? INITIAL_CHATS
  const messagesByChatId = options.messagesByChatId ?? { 101: INITIAL_MESSAGES_101 }
  const projectKeys = options.projectKeys ?? PROJECT_API_KEYS
  const memberKeys = options.memberKeys ?? MEMBER_API_KEYS
  const workflows = options.workflows ?? WORKFLOW_DTOS

  vi.mocked(apiClient.get).mockImplementation(async (url: unknown) => {
    const path = String(url)
    if (path === '/me') {
      return { data: USER_DTO }
    }
    if (path === '/projects' || path === '/projects/') {
      return { data: { items: [PROJECT_DTO], next_cursor: null } }
    }
    if (path === `/projects/${PROJECT_DTO.id}/chats`) {
      return { data: { items: chats, next_cursor: null } }
    }
    if (path === `/projects/${PROJECT_DTO.id}/api-keys`) {
      return { data: { items: projectKeys, next_cursor: null } }
    }
    if (path === `/projects/${PROJECT_DTO.id}/members/me/api-keys`) {
      return { data: { items: memberKeys, next_cursor: null } }
    }
    if (path === '/workflows/') {
      if (options.workflowsError) {
        throw options.workflowsError
      }
      return { data: { items: workflows, next_cursor: null } }
    }
    const workflowConfigMatch = path.match(/^\/workflows\/([^/]+)\/config$/)
    if (workflowConfigMatch) {
      const requestedName = decodeURIComponent(workflowConfigMatch[1]!)
      const found = workflows.find((wf) => wf.name === requestedName)
      return { data: found?.config ?? {} }
    }
    const chatMsgMatch = path.match(/^\/chats\/(\d+)\/messages$/)
    if (chatMsgMatch) {
      const chatId = Number(chatMsgMatch[1])
      return { data: { items: messagesByChatId[chatId] ?? [], next_cursor: null } }
    }
    throw new Error(`Unexpected GET ${path}`)
  })
}

async function createTestRouter(initialPath = '/projetos/10/chats'): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projetos/:projectId/chats', name: 'chat', component: ChatView },
      { path: '/projetos/:projectId/chats/:chatId', name: 'chat-thread', component: ChatView },
      { path: '/projetos/:projectId/repertorio', name: 'repertory', component: DummyRouteView },
      {
        path: '/projetos/:projectId/repertorio/documentos/:itemId',
        name: 'repertory-document-detail',
        component: DummyRouteView,
      },
      {
        path: '/projetos/:projectId/repertorio/assets/:itemId',
        name: 'repertory-asset-detail',
        component: DummyRouteView,
      },
      { path: '/projetos/:projectId/membros', name: 'members', component: DummyRouteView },
      { path: '/projetos/:projectId/api-keys', name: 'api-keys', component: DummyRouteView },
      { path: '/chat', name: 'legacy-chat', component: ChatView },
      { path: '/repertorio', name: 'legacy-repertory', component: DummyRouteView },
      { path: '/membros', name: 'legacy-members', component: DummyRouteView },
      { path: '/api-keys', name: 'legacy-api-keys', component: DummyRouteView },
    ],
  })

  await router.push(initialPath)
  await router.isReady()
  return router
}

async function seedAuthenticatedWorkspace() {
  await useAuthState().loadSession()
  await useWorkspaceState().ensureWorkspaceInitialized()
}

let wrapper: VueWrapper | undefined

beforeEach(() => {
  vi.clearAllMocks()
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetRepertoryForTesting()
  _resetWorkspaceForTesting()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  toast._resetForTesting()
  _resetAuthForTesting()
  _resetRepertoryForTesting()
  _resetWorkspaceForTesting()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.style.overflow = ''
})

describe('ChatView', () => {
  it('loads and dedupes project and member API keys, and warns when none exist', async () => {
    setupApiGetMock({ projectKeys: [], memberKeys: [] })
    await seedAuthenticatedWorkspace()
    const router = await createTestRouter('/chat')

    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    expect(apiClient.get).toHaveBeenCalledWith(
      `/projects/${PROJECT_DTO.id}/api-keys`,
      expect.anything(),
    )
    expect(apiClient.get).toHaveBeenCalledWith(
      `/projects/${PROJECT_DTO.id}/members/me/api-keys`,
      expect.anything(),
    )

    const warning = wrapper
      .findAllComponents(Notification)
      .find((item) => item.props('title') === 'Nenhuma chave de API cadastrada')
    expect(warning).toBeDefined()

    const promptInput = wrapper.findComponent(AiPromptInput)
    await promptInput.find('textarea').setValue('Olá Prismon')
    await promptInput.find('button[aria-label="Enviar mensagem"]').trigger('click')
    await flushPromises()

    expect(apiClient.post).not.toHaveBeenCalled()
    expect(
      toast
        .getToasts()
        .some(
          (item) =>
            item.type === 'error' &&
            item.title?.includes(
              'Selecione ou cadastre uma chave de API em Chaves de API antes de enviar.',
            ),
        ),
    ).toBe(true)

    const goApiKeysBtn = warning!
      .findAll('button')
      .find((btn) => btn.text().includes('Ir para Chaves de API'))
    expect(goApiKeysBtn).toBeDefined()
    await goApiKeysBtn!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/projetos/10/api-keys')
  })

  it('does not render quick prompt suggestions on initial empty chat screen', async () => {
    setupApiGetMock()
    await seedAuthenticatedWorkspace()

    const router = await createTestRouter('/projetos/10/chats')
    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    expect(wrapper.find('.chat-view__empty').exists()).toBe(true)
    expect(wrapper.find('.chat-view__suggestions').exists()).toBe(false)
    expect(wrapper.find('.chat-view__suggestion-btn').exists()).toBe(false)
  })

  it('sends a message via POST /chats/messages, refreshes messages, and renders steps', async () => {
    const messagesByChatId: Record<number, MessageSchema[]> = {
      101: [...INITIAL_MESSAGES_101],
    }
    const chats: ChatSchema[] = [...INITIAL_CHATS]
    setupApiGetMock({ chats, messagesByChatId })
    await seedAuthenticatedWorkspace()

    let resolvePost!: (value: unknown) => void
    vi.mocked(apiClient.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve
        }),
    )

    const router = await createTestRouter('/chat')
    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    // Select API key option from deduped list (21 and 22)
    const apiKeySelect = wrapper.find('.chat-view__api-key-control').findComponent(Select)
    expect(apiKeySelect.props('options')).toHaveLength(2)
    expect(apiKeySelect.props('modelValue')).toBe('21')
    await apiKeySelect.find('[role="combobox"]').trigger('click')
    await flushPromises()
    const key22Option = apiKeySelect
      .findAll('[role="option"]')
      .find((option) => option.text().includes('sk-or-•••mem22'))
    expect(key22Option).toBeDefined()
    await key22Option!.trigger('click')
    await flushPromises()

    const promptInput = wrapper.findComponent(AiPromptInput)
    await promptInput.find('textarea').setValue('Gere um resumo executivo.')
    await promptInput.find('button[aria-label="Enviar mensagem"]').trigger('click')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith(
      '/chats/messages',
      {
        project_id: PROJECT_DTO.id,
        chat_id: null,
        api_key_id: 22,
        text: 'Gere um resumo executivo.',
      },
      expect.objectContaining({
        adapter: 'fetch',
        responseType: 'stream',
        timeout: 120000,
      }),
    )

    // Optimistic human bubble and AI generating indicator appear immediately even on novo chat
    const pendingMessages = wrapper.find('.chat-view__feed').findAllComponents(ChatMessage)
    expect(pendingMessages).toHaveLength(2)
    expect(pendingMessages[0]?.classes()).toContain('chat-message--human')
    expect(pendingMessages[0]?.text()).toContain('Gere um resumo executivo.')
    expect(pendingMessages[1]?.classes()).toContain('chat-message--ai')
    expect(pendingMessages[1]?.text()).toContain('Processando resposta...')

    // Add newly created chat and messages before resolving POST
    chats.unshift({
      id: 202,
      title: 'Gere um resumo executivo.',
      project_id: PROJECT_DTO.id,
      owner: USER_DTO.id,
      created_at: '2026-11-22T15:00:00Z',
      updated_at: '2026-11-22T15:00:00Z',
    })
    messagesByChatId[202] = [
      {
        id: 601,
        chat_id: 202,
        parent_id: null,
        sender_type: 'user',
        text: 'Gere um resumo executivo.',
        payload: {},
        meta_data: {},
        created_at: '2026-11-22T15:00:00Z',
        updated_at: '2026-11-22T15:00:00Z',
      },
      {
        id: 602,
        chat_id: 202,
        parent_id: 601,
        sender_type: 'assistant',
        text: 'Resumo executivo gerado com sucesso.',
        payload: {
          steps: [
            {
              id: 's1',
              title: 'Análise de contexto',
              summary: 'Contexto do projeto processado.',
            },
          ],
        },
        meta_data: {},
        created_at: '2026-11-22T15:00:05Z',
        updated_at: '2026-11-22T15:00:05Z',
      },
    ]

    resolvePost({
      data: {
        chat_id: 202,
        messages: messagesByChatId[202],
      },
    })
    await flushPromises()

    expect(promptInput.find('textarea').element.value).toBe('')
    const feed = wrapper.find('.chat-view__feed')
    const renderedMessages = feed.findAllComponents(ChatMessage)
    expect(renderedMessages).toHaveLength(2)
    expect(renderedMessages[0]?.classes()).toContain('chat-message--human')
    expect(renderedMessages[1]?.classes()).toContain('chat-message--ai')
    expect(renderedMessages[1]?.findComponent(WorkflowStepsAccordion).exists()).toBe(true)
    expect(renderedMessages[1]?.text()).toContain('Análise de contexto')
    expect(renderedMessages[1]?.text()).toContain('Resumo executivo gerado com sucesso.')
  })

  it('loads workflows and dynamic config in WorkflowConfigModal, applies config, and sends it on chat POST', async () => {
    const workflowsError = new Error('Falha ao buscar workflows')
    setupApiGetMock({ workflowsError })
    await seedAuthenticatedWorkspace()

    const router = await createTestRouter('/chat')
    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const promptInput = wrapper.findComponent(AiPromptInput)
    await promptInput.find('button[aria-label="Selecionar workflow"]').trigger('click')
    await flushPromises()

    const workflowModal = wrapper.findComponent(WorkflowConfigModal)
    expect(workflowModal.props('open')).toBe(true)
    expect(workflowModal.text()).toContain('Falha ao buscar workflows')

    // Retry with live workflows
    setupApiGetMock()
    const retryBtn = workflowModal
      .findAll('button')
      .find((btn) => btn.text().trim() === 'Tentar novamente')
    expect(retryBtn).toBeDefined()
    await retryBtn!.trigger('click')
    await flushPromises()

    const cards = workflowModal.findAllComponents(WorkflowSlideCard)
    expect(cards).toHaveLength(3)
    expect(cards[0]?.props('name')).toBe('chat')
    expect(cards[0]?.props('imageUrl')).not.toContain('data:image/svg+xml')
    expect(cards[1]?.props('imageUrl')).toContain('data:image/svg+xml')

    // Continue on chat workflow to step 2 (dynamic rag + chat nodes)
    const selectBtn = workflowModal
      .findAll('button')
      .find((btn) => btn.text().trim() === 'Selecionar')
    await selectBtn!.trigger('click')
    await flushPromises()

    expect(workflowModal.find('.modal__title').text()).toBe('configurações')
    expect(workflowModal.text()).not.toContain('Pré-visualização somente leitura')

    const graphNodes = workflowModal.findAll('.workflow-modal__graph-node')
    expect(graphNodes).toHaveLength(2)
    expect(graphNodes[0]?.text()).toContain('rag')
    expect(graphNodes[1]?.text()).toContain('chat')

    // Edit rag model field
    const ragModelInput = workflowModal.find('.workflow-modal__config input')
    expect(ragModelInput.exists()).toBe(true)
    expect((ragModelInput.element as HTMLInputElement).disabled).toBe(false)
    await ragModelInput.setValue('bonsai-2:4b')
    await flushPromises()

    // Switch to chat node, change provider to openrouter, and set chat model
    await graphNodes[1]!.trigger('click')
    await flushPromises()

    const chatProviderSelect = workflowModal
      .find('.workflow-modal__config')
      .findComponent(Select)
    expect(chatProviderSelect.props('modelValue')).toBe('ollama')
    await chatProviderSelect.find('[role="combobox"]').trigger('click')
    await flushPromises()
    const openRouterOption = chatProviderSelect
      .findAll('[role="option"]')
      .find((opt) => opt.text().includes('OpenRouter'))
    await openRouterOption!.trigger('click')
    await flushPromises()

    const chatModelInput = workflowModal.find('.workflow-modal__config input')
    await chatModelInput.setValue('openai/gpt-4o-mini')
    await flushPromises()

    const applyBtn = workflowModal
      .findAll('button')
      .find((btn) => btn.text().trim() === 'Aplicar workflow')
    await applyBtn!.trigger('click')
    await flushPromises()

    expect(workflowModal.props('open')).toBe(false)
    expect(wrapper.find('.chat-view__header').text()).toContain('chat')
    expect(wrapper.find('.chat-view__workflow-chip').text()).toContain('workflow: chat (v1)')
    expect(wrapper.find('.chat-view__workflow-chip').text()).not.toContain('em breve na API')

    // Send message and verify serialized config is sent to POST /chats/messages
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        chat_id: 101,
        messages: INITIAL_MESSAGES_101,
      },
    })
    await promptInput.find('textarea').setValue('Testando config dinâmico')
    await promptInput.find('button[aria-label="Enviar mensagem"]').trigger('click')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledWith(
      '/chats/messages',
      {
        project_id: PROJECT_DTO.id,
        chat_id: null,
        api_key_id: 21,
        text: 'Testando config dinâmico',
        config: {
          rag: { provider: 'ollama', model: 'bonsai-2:4b' },
          chat: { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
        },
      },
      expect.objectContaining({
        adapter: 'fetch',
        responseType: 'stream',
      }),
    )

    await wrapper
      .find('.chat-view__workflow-chip button[aria-label="Remover workflow selecionado"]')
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('.chat-view__workflow-chip').exists()).toBe(false)
  })

  it('shows "Em breve na API" info toast on attach click without mutating attachments', async () => {
    setupApiGetMock()
    await seedAuthenticatedWorkspace()

    const router = await createTestRouter('/chat')
    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const promptInput = wrapper.findComponent(AiPromptInput)
    await promptInput.find('button[aria-label="Anexar arquivo"]').trigger('click')
    await flushPromises()

    expect(promptInput.props('attachments')).toEqual([])
    expect(
      toast
        .getToasts()
        .some(
          (item) =>
            item.type === 'info' &&
            item.title === 'Anexos no chat estarão disponíveis em breve na API.',
        ),
    ).toBe(true)
  })

  it('renders existing thread messages after selecting a thread and preserves draft on send error', async () => {
    setupApiGetMock()
    await seedAuthenticatedWorkspace()

    const router = await createTestRouter('/chat')
    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    await useWorkspaceState().selectThread(101)
    await flushPromises()

    const feed = wrapper.find('.chat-view__feed')
    expect(feed.exists()).toBe(true)
    const messages = feed.findAllComponents(ChatMessage)
    expect(messages).toHaveLength(2)
    expect(messages[0]?.classes()).toContain('chat-message--human')
    expect(messages[1]?.classes()).toContain('chat-message--ai')
    expect(messages[1]?.findComponent(WorkflowStepsAccordion).exists()).toBe(true)
    expect(messages[1]?.text()).toContain('Leitura do contrato')

    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Falha no servidor de IA'))

    const promptInput = wrapper.findComponent(AiPromptInput)
    await promptInput.find('textarea').setValue('Nova pergunta com falha')
    await promptInput.find('button[aria-label="Enviar mensagem"]').trigger('click')
    await flushPromises()

    expect(promptInput.find('textarea').element.value).toBe('Nova pergunta com falha')
    expect(
      toast
        .getToasts()
        .some((item) => item.type === 'error' && item.title?.includes('Falha no servidor de IA')),
    ).toBe(true)
  })

  it('allows typing next draft while AI is generating, blocks submit/Enter, and preserves typed draft', async () => {
    const messagesByChatId: Record<number, MessageSchema[]> = {
      101: [...INITIAL_MESSAGES_101],
    }
    const chats: ChatSchema[] = [...INITIAL_CHATS]
    setupApiGetMock({ chats, messagesByChatId })
    await seedAuthenticatedWorkspace()

    let resolvePost!: (value: unknown) => void
    vi.mocked(apiClient.post).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePost = resolve
        }),
    )

    const router = await createTestRouter('/projetos/10/chats')
    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const promptInput = wrapper.findComponent(AiPromptInput)
    const textarea = promptInput.find('textarea')
    const sendButton = promptInput.find('button[aria-label="Enviar mensagem"]')

    await textarea.setValue('Primeira pergunta')
    await sendButton.trigger('click')
    await flushPromises()

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    expect((textarea.element as HTMLTextAreaElement).disabled).toBe(false)
    expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    expect((sendButton.element as HTMLButtonElement).disabled).toBe(true)

    await textarea.setValue('Próxima pergunta enquanto gera')
    await flushPromises()

    expect((textarea.element as HTMLTextAreaElement).value).toBe('Próxima pergunta enquanto gera')
    expect((sendButton.element as HTMLButtonElement).disabled).toBe(true)

    await textarea.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(apiClient.post).toHaveBeenCalledTimes(1)

    chats.unshift({
      id: 205,
      title: 'Primeira pergunta',
      project_id: PROJECT_DTO.id,
      owner: USER_DTO.id,
      created_at: '2026-11-22T15:10:00Z',
      updated_at: '2026-11-22T15:10:00Z',
    })
    messagesByChatId[205] = [
      {
        id: 701,
        chat_id: 205,
        parent_id: null,
        sender_type: 'user',
        text: 'Primeira pergunta',
        payload: {},
        meta_data: {},
        created_at: '2026-11-22T15:10:00Z',
        updated_at: '2026-11-22T15:10:00Z',
      },
      {
        id: 702,
        chat_id: 205,
        parent_id: 701,
        sender_type: 'assistant',
        text: 'Resposta concluída.',
        payload: {},
        meta_data: {},
        created_at: '2026-11-22T15:10:05Z',
        updated_at: '2026-11-22T15:10:05Z',
      },
    ]

    resolvePost({
      data: {
        chat_id: 205,
        messages: messagesByChatId[205],
      },
    })
    await flushPromises()

    expect((textarea.element as HTMLTextAreaElement).value).toBe('Próxima pergunta enquanto gera')
    expect((sendButton.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('replaces route to /projetos/10/chats/<id> after sending first message in a new chat', async () => {
    const messagesByChatId: Record<number, MessageSchema[]> = {
      101: [...INITIAL_MESSAGES_101],
    }
    const chats: ChatSchema[] = [...INITIAL_CHATS]
    setupApiGetMock({ chats, messagesByChatId })
    await seedAuthenticatedWorkspace()

    chats.unshift({
      id: 303,
      title: 'Novo tópico',
      project_id: PROJECT_DTO.id,
      owner: USER_DTO.id,
      created_at: '2026-11-22T16:00:00Z',
      updated_at: '2026-11-22T16:00:00Z',
    })
    messagesByChatId[303] = [
      {
        id: 801,
        chat_id: 303,
        parent_id: null,
        sender_type: 'user',
        text: 'Novo tópico',
        payload: {},
        meta_data: {},
        created_at: '2026-11-22T16:00:00Z',
        updated_at: '2026-11-22T16:00:00Z',
      },
      {
        id: 802,
        chat_id: 303,
        parent_id: 801,
        sender_type: 'assistant',
        text: 'Thread criada.',
        payload: {},
        meta_data: {},
        created_at: '2026-11-22T16:00:05Z',
        updated_at: '2026-11-22T16:00:05Z',
      },
    ]

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        chat_id: 303,
        messages: messagesByChatId[303],
      },
    })

    const router = await createTestRouter('/projetos/10/chats')
    const replaceSpy = vi.spyOn(router, 'replace')

    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const promptInput = wrapper.findComponent(AiPromptInput)
    await promptInput.find('textarea').setValue('Novo tópico')
    await promptInput.find('button[aria-label="Enviar mensagem"]').trigger('click')
    await flushPromises()

    expect(replaceSpy).toHaveBeenCalledWith({
      name: 'chat-thread',
      params: {
        projectId: '10',
        chatId: '303',
      },
    })
    expect(router.currentRoute.value.path).toBe('/projetos/10/chats/303')

    await wrapper.find('button[aria-label="Criar novo chat"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/projetos/10/chats')
  })

  it('renders AI markdown with expressive classes and navigates on [document 5] citation click', async () => {
    const messagesByChatId: Record<number, MessageSchema[]> = {
      101: [
        INITIAL_MESSAGES_101[0]!,
        {
          id: 503,
          chat_id: 101,
          parent_id: 501,
          sender_type: 'assistant',
          text: '## Parecer Técnico\n\nConsulte o item [document 5] para detalhes.',
          payload: {},
          meta_data: {},
          created_at: '2026-11-22T12:01:00Z',
          updated_at: '2026-11-22T12:01:00Z',
        },
      ],
    }
    setupApiGetMock({ messagesByChatId })
    await seedAuthenticatedWorkspace()

    useRepertoryState().upsertDocument(10, {
      id: 5,
      projectId: 10,
      title: 'Contrato SLA 2026',
      description: '',
      status: 'published',
      statusLabel: 'Publicado',
      format: 'PDF',
      contentType: 'application/pdf',
      filePath: null,
      fileExtension: 'pdf',
      createdAt: '',
      updatedAt: '',
      createdAtLabel: '',
      tags: [],
    })

    const router = await createTestRouter('/projetos/10/chats/101')
    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const aiMessage = wrapper
      .findAllComponents(ChatMessage)
      .find((msg) => msg.classes().includes('chat-message--ai'))
    expect(aiMessage).toBeDefined()

    const markdown = aiMessage!.findComponent(MarkdownRenderer)
    expect(markdown.exists()).toBe(true)
    expect(markdown.find('h2').classes()).toContain('type-expressive-heading-03')
    expect(markdown.find('p').classes()).toContain('type-expressive-body-02')

    const citation = markdown.findComponent(AiCitation)
    expect(citation.exists()).toBe(true)
    expect(citation.props('kind')).toBe('document')
    expect(citation.props('targetId')).toBe(5)
    expect(citation.text()).toBe('Contrato SLA 2026')

    await citation.find('button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/projetos/10/repertorio/documentos/5')
  })
})
