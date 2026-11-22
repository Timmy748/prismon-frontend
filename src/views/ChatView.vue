<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  AiPromptInput,
  Badge,
  ChatMessage,
  FileAttachmentCard,
  Icon,
  IconButton,
  ScrollContainer,
  Tag,
  WorkflowStepsAccordion,
  toast,
  type AiAttachmentItem,
} from '@/components/ui'
import { AppShell } from '@/components/shell'
import WorkflowConfigModal, {
  type WorkflowConfigApplyPayload,
} from '@/components/chat/WorkflowConfigModal.vue'
import {
  nextWorkspaceId,
  useWorkspaceState,
  type ChatThreadMessage,
  type ChatWorkflowStep,
  type SelectedWorkflow,
} from '@/stores/workspaceState'

interface PromptSuggestion {
  id: string
  label: string
  prompt: string
}

const MOCK_ATTACHMENTS: Array<{ filename: string; fileSize: string }> = [
  { filename: 'especificacao-v2.pdf', fileSize: '420 KB' },
  { filename: 'contrato-revisao.docx', fileSize: '184 KB' },
  { filename: 'dados-q4.csv', fileSize: '96 KB' },
]

const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: 'sug-1',
    label: 'revisar cláusulas de contrato',
    prompt: 'Revise os principais riscos contratuais e prazos de SLA deste documento.',
  },
  {
    id: 'sug-2',
    label: 'resumir especificação técnica',
    prompt: 'Gere um resumo executivo com requisitos críticos e pontos em aberto.',
  },
  {
    id: 'sug-3',
    label: 'consultar repertório interno',
    prompt: 'Compare esta proposta com as diretrizes internas do repertório Prismon.',
  },
]

const { activeThread, selectedWorkflow, ensureActiveThread, startNewChat } = useWorkspaceState()

const messagesScrollRef = ref<InstanceType<typeof ScrollContainer> | null>(null)
const draftMessage = ref('')
const pendingAttachments = ref<AiAttachmentItem[]>([])
const mockAttachCursor = ref(0)

const isWorkflowModalOpen = ref(false)
const isGenerating = ref(false)

const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

function scrollMessagesToBottom() {
  void nextTick(() => {
    messagesScrollRef.value?.scrollToBottom()
  })
}

watch(
  () => [activeThread.value?.id, activeThread.value?.messages.length ?? 0, isGenerating.value],
  ([threadId, count], [prevThreadId, prevCount]) => {
    if (threadId && (threadId !== prevThreadId || count !== prevCount)) {
      scrollMessagesToBottom()
    }
  },
)

function handleCreateNewChat() {
  startNewChat()
  draftMessage.value = ''
  pendingAttachments.value = []
}

function handleAttachMockFile() {
  const sample = MOCK_ATTACHMENTS[mockAttachCursor.value % MOCK_ATTACHMENTS.length]!
  mockAttachCursor.value += 1

  const attachment: AiAttachmentItem = {
    id: nextWorkspaceId('att'),
    filename: sample.filename,
    fileSize: sample.fileSize,
  }
  pendingAttachments.value = [...pendingAttachments.value, attachment]
  toast.info(`Arquivo "${sample.filename}" anexado ao prompt.`)
}

function removeAttachment(attachmentId: string) {
  pendingAttachments.value = pendingAttachments.value.filter((item) => item.id !== attachmentId)
}

function handleApplyWorkflow(payload: WorkflowConfigApplyPayload) {
  const applied: SelectedWorkflow = {
    id: payload.workflowId,
    name: payload.workflowName,
    effort: payload.summaryEffort,
    iterations: payload.iterations,
    nodesConfig: payload.nodesConfig,
  }
  selectedWorkflow.value = applied

  if (activeThread.value) {
    activeThread.value.workflowId = payload.workflowId
    activeThread.value.workflowName = payload.workflowName
    activeThread.value.workflowEffort = payload.summaryEffort
  }

  toast.success(`Workflow "${payload.workflowName}" (${payload.version}) aplicado.`)
}

function clearWorkflow() {
  selectedWorkflow.value = null
  if (activeThread.value) {
    activeThread.value.workflowId = null
    activeThread.value.workflowName = null
    activeThread.value.workflowEffort = null
  }
}

function buildThreadTitle(prompt: string): string {
  const normalized = prompt.trim().toLowerCase()
  if (normalized.length <= 36) {
    return normalized
  }
  return `${normalized.slice(0, 36).trim()}...`
}

function buildSimulatedAiResponse(
  prompt: string,
  workflow: SelectedWorkflow | null,
  attachments: AiAttachmentItem[],
): ChatThreadMessage {
  const workflowLabel = workflow ? `${workflow.name} (${workflow.effort})` : 'fluxo padrão Prismon'
  const attachmentNote =
    attachments.length > 0
      ? ` considerando ${attachments.map((item) => item.filename).join(', ')}`
      : ''
  const pipelineNote = workflow?.nodesConfig
    ? ` (${Object.values(workflow.nodesConfig)
        .map((node) => `${node.label} [${node.model}]`)
        .join(' → ')})`
    : ''

  return {
    id: nextWorkspaceId('msg'),
    role: 'ai',
    steps: [
      {
        id: nextWorkspaceId('step'),
        title: 'Analisando contexto',
        summary: `Solicitação interpretada com foco em: "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}".`,
      },
      {
        id: nextWorkspaceId('step'),
        title: 'Consultando repertório',
        summary: `Referências cruzadas no repertório utilizando ${workflowLabel}${pipelineNote}${attachmentNote}.`,
      },
      {
        id: nextWorkspaceId('step'),
        title: 'Gerando resposta estruturada',
        summary: 'Síntese final validada e formatada para leitura rápida.',
      },
    ],
    content: `Análise concluída via ${workflowLabel}${attachmentNote}. Os principais pontos levantados para "${prompt}" foram organizados com recomendações objetivas e critérios de verificação prontos para revisão.`,
  }
}

function handleSendMessage(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return
  }

  const targetThread = ensureActiveThread()
  const attachmentsSnapshot = [...pendingAttachments.value]
  const workflowSnapshot = selectedWorkflow.value ? { ...selectedWorkflow.value } : null

  if (targetThread.messages.length === 0 && targetThread.title === 'nova conversa') {
    targetThread.title = buildThreadTitle(trimmed)
  }

  targetThread.messages.push({
    id: nextWorkspaceId('msg'),
    role: 'human',
    content: trimmed,
    attachments: attachmentsSnapshot.length > 0 ? attachmentsSnapshot : undefined,
  })

  draftMessage.value = ''
  pendingAttachments.value = []
  isGenerating.value = true

  const timer = setTimeout(() => {
    pendingTimers.delete(timer)
    targetThread.messages.push(
      buildSimulatedAiResponse(trimmed, workflowSnapshot, attachmentsSnapshot),
    )
    isGenerating.value = false
  }, 450)

  pendingTimers.add(timer)
}

function applyPromptSuggestion(prompt: string) {
  handleSendMessage(prompt)
}

function getStepSummary(steps: ChatWorkflowStep[] | undefined, stepId: string): string {
  return steps?.find((item) => item.id === stepId)?.summary ?? ''
}

onBeforeUnmount(() => {
  for (const timer of pendingTimers) {
    clearTimeout(timer)
  }
  pendingTimers.clear()
})
</script>

<template>
  <AppShell active-nav="chat" :show-topbar="false" title="chatbot">
    <section class="chat-view" aria-label="Área de conversa">
      <header class="chat-view__header">
        <div class="chat-view__header-main">
          <h1 class="chat-view__title">{{ activeThread?.title ?? 'novo chat' }}</h1>
          <Badge v-if="activeThread?.workflowName" :label="activeThread.workflowName" />
        </div>
        <IconButton
          variant="ghost"
          size="sm"
          icon="plus"
          ariaLabel="Criar novo chat"
          @click="handleCreateNewChat"
        />
      </header>

      <ScrollContainer
        ref="messagesScrollRef"
        direction="vertical"
        class="chat-view__messages"
        ariaLabel="Mensagens da conversa"
      >
        <div v-if="!activeThread || activeThread.messages.length === 0" class="chat-view__empty">
          <Icon name="robot" size="2xl" color="brand" />
          <div class="chat-view__empty-copy">
            <h2 class="chat-view__empty-title">como posso ajudar hoje?</h2>
            <p class="chat-view__empty-subtitle">
              Escolha um workflow de IA ou envie uma pergunta com documentos de apoio.
            </p>
          </div>
          <div class="chat-view__suggestions">
            <button
              v-for="suggestion in PROMPT_SUGGESTIONS"
              :key="suggestion.id"
              type="button"
              class="chat-view__suggestion-btn"
              @click="applyPromptSuggestion(suggestion.prompt)"
            >
              <Tag :label="suggestion.label" />
            </button>
          </div>
        </div>

        <div v-else class="chat-view__feed">
          <ChatMessage v-for="msg in activeThread.messages" :key="msg.id" :role="msg.role">
            <div class="chat-view__message-body">
              <div
                v-if="msg.role === 'human' && msg.attachments && msg.attachments.length > 0"
                class="chat-view__message-attachments"
              >
                <FileAttachmentCard
                  v-for="att in msg.attachments"
                  :key="att.id"
                  :filename="att.filename"
                  :file-size="att.fileSize"
                />
              </div>

              <WorkflowStepsAccordion
                v-if="msg.role === 'ai' && msg.steps && msg.steps.length > 0"
                :steps="msg.steps"
                class="chat-view__message-steps"
              >
                <template #step="{ step }">
                  <p class="chat-view__step-summary">
                    {{ getStepSummary(msg.steps, step.id) }}
                  </p>
                </template>
              </WorkflowStepsAccordion>

              <p class="chat-view__message-text">{{ msg.content }}</p>
            </div>
          </ChatMessage>

          <ChatMessage v-if="isGenerating" role="ai">
            <p class="chat-view__generating">Processando etapas do workflow...</p>
          </ChatMessage>
        </div>
      </ScrollContainer>

      <div class="chat-view__composer-wrap">
        <div class="chat-view__composer">
          <div v-if="selectedWorkflow" class="chat-view__workflow-chip">
            <Tag
              :label="`workflow: ${selectedWorkflow.name} (${selectedWorkflow.effort})`"
              :dismissible="true"
              dismiss-label="Remover workflow selecionado"
              @dismiss="clearWorkflow"
            />
          </div>

          <AiPromptInput
            v-model="draftMessage"
            :attachments="pendingAttachments"
            placeholder="Digite sua mensagem"
            @attach="handleAttachMockFile"
            @select-workflow="isWorkflowModalOpen = true"
            @remove-attachment="removeAttachment"
            @submit="handleSendMessage"
          />
        </div>
      </div>
    </section>

    <WorkflowConfigModal
      v-model:open="isWorkflowModalOpen"
      :selected-workflow-id="selectedWorkflow?.id ?? null"
      @apply="handleApplyWorkflow"
    />
  </AppShell>
</template>

<style scoped>
.chat-view {
  --chat-view-bg: var(--surface-base);
  --chat-view-header-bg: var(--surface-elevated);
  --chat-view-border-color: var(--border-subtle-1);
  --chat-view-border-width: var(--border-width-thin);
  --chat-view-header-min-height: 56px;
  --chat-view-header-padding-y: var(--spacing-3);
  --chat-view-header-padding-x: var(--spacing-6);
  --chat-view-header-gap: var(--spacing-4);
  --chat-view-title-color: var(--text-primary);
  --chat-view-title-font-family: var(--type-heading-03-font-family);
  --chat-view-title-font-size: var(--type-heading-03-font-size);
  --chat-view-title-line-height: var(--type-heading-03-line-height);
  --chat-view-title-font-weight: var(--type-heading-03-font-weight);
  --chat-view-title-text-transform: var(--type-heading-03-text-transform);
  --chat-view-feed-max-width: 760px;
  --chat-view-feed-padding-y: var(--spacing-6);
  --chat-view-feed-padding-x: var(--spacing-6);
  --chat-view-feed-gap: var(--spacing-5);
  --chat-view-human-max-width: min(78%, 580px);
  --chat-view-ai-max-width: min(88%, 660px);
  --chat-view-composer-padding-top: var(--spacing-3);
  --chat-view-composer-padding-x: var(--spacing-6);
  --chat-view-composer-padding-bottom: var(--spacing-6);
  --chat-view-composer-gap: var(--spacing-3);
  --chat-view-empty-gap: var(--spacing-5);
  --chat-view-empty-title-color: var(--text-primary);
  --chat-view-empty-title-font-family: var(--type-heading-04-font-family);
  --chat-view-empty-title-font-size: var(--type-heading-04-font-size);
  --chat-view-empty-title-line-height: var(--type-heading-04-line-height);
  --chat-view-empty-title-font-weight: var(--type-heading-04-font-weight);
  --chat-view-empty-title-text-transform: var(--type-heading-04-text-transform);
  --chat-view-empty-subtitle-color: var(--text-tertiary);
  --chat-view-empty-subtitle-font-family: var(--type-body-01-font-family);
  --chat-view-empty-subtitle-font-size: var(--type-body-01-font-size);
  --chat-view-empty-subtitle-line-height: var(--type-body-01-line-height);
  --chat-view-empty-subtitle-font-weight: var(--type-body-01-font-weight);
  --chat-view-step-color: var(--text-tertiary);
  --chat-view-step-font-family: var(--type-body-compact-01-font-family);
  --chat-view-step-font-size: var(--type-body-compact-01-font-size);
  --chat-view-step-line-height: var(--type-body-compact-01-line-height);
  --chat-view-step-font-weight: var(--type-body-compact-01-font-weight);
  --chat-view-generating-color: var(--text-helper);
  --chat-view-shadow-focus: var(--shadow-focus-ring);
  --chat-view-transition-duration: var(--duration-fast);
  --chat-view-transition-easing: var(--easing-out);
  --chat-view-press-scale: var(--scale-press);

  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: var(--spacing-0);
  overflow: hidden;
  background-color: var(--chat-view-bg);
}

.chat-view__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  min-height: var(--chat-view-header-min-height);
  padding: var(--chat-view-header-padding-y) var(--chat-view-header-padding-x);
  gap: var(--chat-view-header-gap);
  box-sizing: border-box;
  background-color: var(--chat-view-header-bg);
  border-bottom: var(--chat-view-border-width) solid var(--chat-view-border-color);
}

.chat-view__header-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  min-width: var(--spacing-0);
  gap: var(--spacing-3);
}

.chat-view__title {
  margin: var(--spacing-0);
  color: var(--chat-view-title-color);
  font-family: var(--chat-view-title-font-family);
  font-size: var(--chat-view-title-font-size);
  line-height: var(--chat-view-title-line-height);
  font-weight: var(--chat-view-title-font-weight);
  text-transform: var(--chat-view-title-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-view__messages {
  flex: 1;
  min-height: var(--spacing-0);
}

.chat-view__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  max-width: var(--chat-view-feed-max-width);
  margin: var(--spacing-0) auto;
  padding: var(--chat-view-feed-padding-y) var(--chat-view-feed-padding-x);
  gap: var(--chat-view-empty-gap);
  box-sizing: border-box;
  text-align: center;
}

.chat-view__empty-copy {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.chat-view__empty-title {
  margin: var(--spacing-0);
  color: var(--chat-view-empty-title-color);
  font-family: var(--chat-view-empty-title-font-family);
  font-size: var(--chat-view-empty-title-font-size);
  line-height: var(--chat-view-empty-title-line-height);
  font-weight: var(--chat-view-empty-title-font-weight);
  text-transform: var(--chat-view-empty-title-text-transform);
}

.chat-view__empty-subtitle {
  margin: var(--spacing-0);
  color: var(--chat-view-empty-subtitle-color);
  font-family: var(--chat-view-empty-subtitle-font-family);
  font-size: var(--chat-view-empty-subtitle-font-size);
  line-height: var(--chat-view-empty-subtitle-line-height);
  font-weight: var(--chat-view-empty-subtitle-font-weight);
}

.chat-view__suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-3);
}

.chat-view__suggestion-btn {
  padding: var(--spacing-0);
  border: var(--border-width-none) solid var(--border-transparent);
  background-color: var(--surface-transparent);
  cursor: pointer;
  transition: transform var(--chat-view-transition-duration) var(--chat-view-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .chat-view__suggestion-btn:hover {
    transform: translateY(calc(var(--spacing-1) * -1));
  }
}

.chat-view__suggestion-btn:active {
  transform: scale(var(--chat-view-press-scale));
}

.chat-view__suggestion-btn:focus-visible {
  outline: none;
  box-shadow: var(--chat-view-shadow-focus);
}

.chat-view__feed {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--chat-view-feed-max-width);
  margin: var(--spacing-0) auto;
  padding: var(--chat-view-feed-padding-y) var(--chat-view-feed-padding-x);
  gap: var(--chat-view-feed-gap);
  box-sizing: border-box;
}

.chat-view__feed :deep(.chat-message--human) {
  align-self: flex-end;
  max-width: var(--chat-view-human-max-width);
  width: fit-content;
}

.chat-view__feed :deep(.chat-message--ai) {
  align-self: flex-start;
  max-width: var(--chat-view-ai-max-width);
  width: 100%;
}

.chat-view__message-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.chat-view__message-attachments {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

.chat-view__message-steps {
  padding-bottom: var(--spacing-2);
}

.chat-view__step-summary {
  margin: var(--spacing-0);
  color: var(--chat-view-step-color);
  font-family: var(--chat-view-step-font-family);
  font-size: var(--chat-view-step-font-size);
  line-height: var(--chat-view-step-line-height);
  font-weight: var(--chat-view-step-font-weight);
}

.chat-view__message-text {
  margin: var(--spacing-0);
  white-space: pre-wrap;
}

.chat-view__generating {
  margin: var(--spacing-0);
  color: var(--chat-view-generating-color);
}

.chat-view__composer-wrap {
  flex-shrink: 0;
  padding: var(--chat-view-composer-padding-top) var(--chat-view-composer-padding-x)
    var(--chat-view-composer-padding-bottom);
  box-sizing: border-box;
}

.chat-view__composer {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--chat-view-feed-max-width);
  margin: var(--spacing-0) auto;
  gap: var(--chat-view-composer-gap);
}

.chat-view__workflow-chip {
  display: flex;
  align-items: center;
}

@media (max-width: 767px) {
  .chat-view__header {
    padding: var(--spacing-3) var(--spacing-4);
  }

  .chat-view__empty,
  .chat-view__feed {
    padding: var(--spacing-5) var(--spacing-4);
  }

  .chat-view__composer-wrap {
    padding: var(--spacing-3) var(--spacing-4) var(--spacing-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-view__suggestion-btn {
    transition: none;
  }

  .chat-view__suggestion-btn:active {
    transform: none;
  }
}
</style>
