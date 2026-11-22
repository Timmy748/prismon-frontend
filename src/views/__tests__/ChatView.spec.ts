import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import {
  AiPromptInput,
  ChatMessage,
  ConfirmDialog,
  FileAttachmentCard,
  ListItem,
  Sidebar,
  WorkflowSlideCard,
  WorkflowStepsAccordion,
  toast,
} from '@/components/ui'
import WorkflowConfigModal from '@/components/chat/WorkflowConfigModal.vue'
import ChatView from '../ChatView.vue'

const DummyRouteView = { template: '<div data-testid="dummy-route" />' }

async function createTestRouter(initialPath = '/chat'): Promise<Router> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/chat', name: 'chat', component: ChatView },
      { path: '/repertorio', name: 'repertory', component: DummyRouteView },
      { path: '/membros', name: 'members', component: DummyRouteView },
      { path: '/api-keys', name: 'api-keys', component: DummyRouteView },
      { path: '/ui-kit', name: 'ui-kit', component: DummyRouteView },
    ],
  })

  await router.push(initialPath)
  await router.isReady()
  return router
}

let wrapper: VueWrapper | undefined

beforeEach(() => {
  toast._resetForTesting()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.style.overflow = ''
})

describe('ChatView', () => {
  it('renders human and AI messages with differentiated sender classes inside the feed', async () => {
    const router = await createTestRouter('/chat')

    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })

    const feed = wrapper.find('.chat-view__feed')
    expect(feed.exists()).toBe(true)

    const messages = feed.findAllComponents(ChatMessage)
    expect(messages.length).toBeGreaterThanOrEqual(2)

    const humanMsg = messages.find(
      (msg: VueWrapper) => (msg.props() as { role?: string }).role === 'human',
    )
    const aiMsg = messages.find(
      (msg: VueWrapper) => (msg.props() as { role?: string }).role === 'ai',
    )

    expect(humanMsg).toBeDefined()
    expect(aiMsg).toBeDefined()
    expect(humanMsg!.classes()).toContain('chat-message--human')
    expect(aiMsg!.classes()).toContain('chat-message--ai')
    expect(feed.find('.chat-view__message-attachments').exists()).toBe(true)
  })

  it('sends a message, renders generating AI placeholder, and generates a simulated AI response with workflow steps', async () => {
    vi.useFakeTimers()
    const router = await createTestRouter('/chat')

    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })

    const initialMessages = wrapper.findAllComponents(ChatMessage).length
    const promptInput = wrapper.findComponent(AiPromptInput)

    await promptInput.find('textarea').setValue('Resuma os principais riscos do anexo.')
    await promptInput.find('button[aria-label="Enviar mensagem"]').trigger('click')
    await flushPromises()

    const feed = wrapper.find('.chat-view__feed')
    const afterSendMessages = feed.findAllComponents(ChatMessage)
    expect(afterSendMessages.length).toBeGreaterThan(initialMessages)
    expect(wrapper.text()).toContain('Resuma os principais riscos do anexo.')

    const generatingPlaceholder = afterSendMessages[afterSendMessages.length - 1]
    expect(generatingPlaceholder?.props('role')).toBe('ai')
    expect(generatingPlaceholder?.classes()).toContain('chat-message--ai')
    expect(generatingPlaceholder?.text()).toContain('Processando etapas do workflow...')

    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()

    const completedMessages = feed.findAllComponents(ChatMessage)
    const lastMessage = completedMessages[completedMessages.length - 1]
    expect(lastMessage?.props('role')).toBe('ai')
    expect(lastMessage?.classes()).toContain('chat-message--ai')
    expect(lastMessage?.findComponent(WorkflowStepsAccordion).exists()).toBe(true)
    expect(lastMessage?.text()).toContain('Analisando contexto')
    expect(lastMessage?.text()).toContain('Consultando repertório')
    expect(lastMessage?.text()).toContain('Gerando resposta estruturada')
  })

  it('attaches mock files and allows removing an attachment in AiPromptInput', async () => {
    const router = await createTestRouter('/chat')

    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })

    const promptInput = wrapper.findComponent(AiPromptInput)
    expect(promptInput.findAllComponents(FileAttachmentCard)).toHaveLength(0)

    await promptInput.find('button[aria-label="Anexar arquivo"]').trigger('click')
    await promptInput.find('button[aria-label="Anexar arquivo"]').trigger('click')
    await flushPromises()

    const cards = promptInput.findAllComponents(FileAttachmentCard)
    expect(cards).toHaveLength(2)
    expect(cards[0]?.props('filename')).toBe('especificacao-v2.pdf')
    expect(cards[1]?.props('filename')).toBe('contrato-revisao.docx')
    expect(toast.getToasts().some((item) => item.type === 'info')).toBe(true)

    await cards[0]!.find('button[aria-label="Remover anexo"]').trigger('click')
    await flushPromises()

    const remainingCards = promptInput.findAllComponents(FileAttachmentCard)
    expect(remainingCards).toHaveLength(1)
    expect(remainingCards[0]?.props('filename')).toBe('contrato-revisao.docx')
  })

  it('renders conversations integrated inside the primary navigation sidebar (#sidebar-extra) and supports collapsed mode', async () => {
    const router = await createTestRouter('/chat')

    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.app-shell__secondary-sidebar').exists()).toBe(false)
    const sidebars = wrapper.findAllComponents(Sidebar)
    expect(sidebars.some((sb) => sb.props('title') === 'conversas')).toBe(false)

    const sidebarExtra = wrapper.find('.app-shell__sidebar-extra')
    expect(sidebarExtra.exists()).toBe(true)
    expect(sidebarExtra.find('.chat-threads__title').text()).toBe('conversas')
    expect(sidebarExtra.find('input[aria-label="Buscar conversas"]').exists()).toBe(true)
    expect(sidebarExtra.text()).toContain('hoje')
    expect(sidebarExtra.text()).toContain('últimos 7 dias')

    const navToggleButton = wrapper.find('button[aria-label="Alternar menu do projeto"]')
    expect(navToggleButton.exists()).toBe(true)
    await navToggleButton.trigger('click')
    await flushPromises()

    expect(sidebarExtra.find('.chat-threads__collapsed').exists()).toBe(true)
    expect(sidebarExtra.find('button[aria-label="Nova conversa"]').exists()).toBe(true)
    const collapsedItems = sidebarExtra.findAllComponents(ListItem)
    expect(collapsedItems.length).toBeGreaterThan(0)
    expect(
      collapsedItems.every(
        (item: VueWrapper) => (item.props() as { collapsed?: boolean }).collapsed === true,
      ),
    ).toBe(true)
  })

  it('opens WorkflowConfigModal, navigates the node graph, edits node config, and applies the workflow', async () => {
    const router = await createTestRouter('/chat')

    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })

    const promptInput = wrapper.findComponent(AiPromptInput)
    await promptInput.find('button[aria-label="Selecionar workflow"]').trigger('click')
    await flushPromises()

    const workflowModal = wrapper.findComponent(WorkflowConfigModal)
    expect(workflowModal.props('open')).toBe(true)
    expect(workflowModal.find('.modal').classes()).toContain('modal--lg')
    expect(workflowModal.find('.modal__title').text()).toBe('workflows')

    const cards = workflowModal.findAllComponents(WorkflowSlideCard)
    expect(cards).toHaveLength(5)

    await cards[0]!.find('button[aria-label="Ver descrição"]').trigger('click')
    await flushPromises()
    expect(cards[0]!.classes()).toContain('workflow-slide-card--description-open')

    await cards[0]!.find('button[aria-label="Fechar descrição"]').trigger('click')
    await flushPromises()
    expect(cards[0]!.classes()).not.toContain('workflow-slide-card--description-open')

    const slideNextButton = workflowModal
      .findAll('button')
      .find((btn) => btn.text().trim() === 'Próximo')
    expect(slideNextButton).toBeDefined()
    await slideNextButton!.trigger('click')
    await slideNextButton!.trigger('click')
    await flushPromises()
    expect(cards[2]!.props('selected')).toBe(true)

    const selectButton = workflowModal
      .findAll('button')
      .find((btn) => btn.text().trim() === 'Selecionar')
    expect(selectButton).toBeDefined()
    await selectButton!.trigger('click')
    await flushPromises()

    expect(workflowModal.find('.modal__title').text()).toBe('configurações')

    const graphNodes = workflowModal.findAll('.workflow-modal__graph-node')
    expect(graphNodes).toHaveLength(3)
    expect(graphNodes[0]!.classes()).toContain('workflow-modal__graph-node--selected')
    expect(workflowModal.find('.workflow-modal__node-form-title').text()).toContain(
      'configurando nó: Ingestão',
    )

    await graphNodes[1]!.trigger('click')
    await flushPromises()

    expect(graphNodes[1]!.classes()).toContain('workflow-modal__graph-node--selected')
    expect(workflowModal.find('.workflow-modal__node-form-title').text()).toContain(
      'configurando nó: Análise Crítica',
    )

    const nodeLabelInput = workflowModal.find('.workflow-modal__node-form input')
    await nodeLabelInput.setValue('Auditoria Profunda')
    await flushPromises()
    expect(graphNodes[1]!.text()).toContain('Auditoria Profunda')

    const nodeFormSelects = workflowModal.findAll('.workflow-modal__node-form select')
    expect(nodeFormSelects).toHaveLength(3)
    await nodeFormSelects[0]!.setValue('Claude Sonnet')
    await nodeFormSelects[1]!.setValue('Baixo')
    await nodeFormSelects[2]!.setValue('output')
    await flushPromises()

    expect(graphNodes[1]!.text()).toContain('Claude Sonnet')
    expect(graphNodes[1]!.text()).toContain('Saída')

    const instructionTextarea = workflowModal.find('.workflow-modal__node-form textarea')
    await instructionTextarea.setValue('Validar aderência arquitetural e riscos de segurança.')
    await flushPromises()

    const applyButton = workflowModal
      .findAll('button')
      .find((btn) => btn.text().trim() === 'Aplicar workflow')
    expect(applyButton).toBeDefined()
    await applyButton!.trigger('click')
    await flushPromises()

    expect(workflowModal.props('open')).toBe(false)
    expect(wrapper.find('.chat-view__header').text()).toContain('revisão técnica')
    expect(wrapper.find('.chat-view__workflow-chip').text()).toContain(
      'workflow: revisão técnica (Baixo)',
    )
    expect(toast.getToasts().some((item) => item.type === 'success')).toBe(true)

    await wrapper
      .find('.chat-view__workflow-chip button[aria-label="Remover workflow selecionado"]')
      .trigger('click')
    await flushPromises()

    expect(wrapper.find('.chat-view__workflow-chip').exists()).toBe(false)
  })

  it('creates a new conversation in empty state and deletes a conversation via ConfirmDialog', async () => {
    const router = await createTestRouter('/chat')

    wrapper = mount(ChatView, {
      global: {
        plugins: [router],
      },
    })

    const newChatButton = wrapper
      .findAll('.chat-threads button')
      .find((btn) => btn.text().includes('nova conversa'))
    expect(newChatButton).toBeDefined()

    await newChatButton!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.chat-view__empty').exists()).toBe(true)
    expect(wrapper.find('.chat-view__empty-title').text()).toBe('como posso ajudar hoje?')
    expect(wrapper.findAll('.chat-view__suggestion-btn')).toHaveLength(3)

    const removeButtons = wrapper.findAll('.chat-threads button[aria-label="Remover conversa"]')
    const initialThreadCount = removeButtons.length
    expect(initialThreadCount).toBeGreaterThan(1)

    await removeButtons[0]!.trigger('click')
    await flushPromises()

    const confirmDialog = wrapper.findComponent(ConfirmDialog)
    expect(confirmDialog.props('open')).toBe(true)
    expect(confirmDialog.find('.confirm-dialog__title').text()).toBe('remover conversa')

    const confirmRemoveBtn = confirmDialog
      .findAll('button')
      .find((btn) => btn.text().trim() === 'Remover')
    expect(confirmRemoveBtn).toBeDefined()
    await confirmRemoveBtn!.trigger('click')
    await flushPromises()

    expect(confirmDialog.props('open')).toBe(false)
    const remainingRemoveButtons = wrapper.findAll(
      '.chat-threads button[aria-label="Remover conversa"]',
    )
    expect(remainingRemoveButtons).toHaveLength(initialThreadCount - 1)
    expect(toast.getToasts().some((item) => item.type === 'info')).toBe(true)
  })
})
