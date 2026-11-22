import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import {
  AiPromptInput,
  ChatMessage,
  ConfirmDialog,
  FileAttachmentCard,
  WorkflowCard,
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
  it('sends a message and generates a simulated AI response with workflow steps', async () => {
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

    const afterSendMessages = wrapper.findAllComponents(ChatMessage)
    expect(afterSendMessages.length).toBeGreaterThan(initialMessages)
    expect(wrapper.text()).toContain('Resuma os principais riscos do anexo.')

    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()

    const completedMessages = wrapper.findAllComponents(ChatMessage)
    const lastMessage = completedMessages[completedMessages.length - 1]
    expect(lastMessage?.props('role')).toBe('ai')
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

  it('opens WorkflowConfigModal, advances to step 2, and applies the configured workflow', async () => {
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
    expect(workflowModal.find('.modal__title').text()).toBe('workflows')

    const cards = workflowModal.findAllComponents(WorkflowCard)
    expect(cards).toHaveLength(4)

    await cards[2]!.trigger('click')
    await flushPromises()
    expect(cards[2]!.props('selected')).toBe(true)

    const nextButton = workflowModal
      .findAll('button')
      .find((btn) => btn.text().trim() === 'Próximo')
    expect(nextButton).toBeDefined()
    await nextButton!.trigger('click')
    await flushPromises()

    expect(workflowModal.find('.modal__title').text()).toBe('configurações')
    const selects = workflowModal.findAll('select')
    expect(selects.length).toBeGreaterThanOrEqual(5)

    await selects[1]!.setValue('Alto')
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
      'workflow: revisão técnica (Alto)',
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
      .findAll('.chat-history-sidebar button')
      .find((btn) => btn.text().includes('nova conversa'))
    expect(newChatButton).toBeDefined()

    await newChatButton!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.chat-view__empty').exists()).toBe(true)
    expect(wrapper.find('.chat-view__empty-title').text()).toBe('como posso ajudar hoje?')
    expect(wrapper.findAll('.chat-view__suggestion-btn')).toHaveLength(3)

    const removeButtons = wrapper.findAll(
      '.chat-history-sidebar button[aria-label="Remover conversa"]',
    )
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
      '.chat-history-sidebar button[aria-label="Remover conversa"]',
    )
    expect(remainingRemoveButtons).toHaveLength(initialThreadCount - 1)
    expect(toast.getToasts().some((item) => item.type === 'info')).toBe(true)
  })
})
