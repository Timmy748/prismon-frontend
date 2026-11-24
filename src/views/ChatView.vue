<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApiErrorMessage } from '@/api/errors'
import {
  AiPromptInput,
  Badge,
  Button,
  ChatMessage,
  Icon,
  IconButton,
  MarkdownRenderer,
  Notification,
  ScrollContainer,
  Select,
  Tag,
  WorkflowStepsAccordion,
  toast,
  type AiCitationPayload,
  type SelectOption,
} from '@/components/ui'
import { AppShell } from '@/components/shell'
import WorkflowConfigModal, {
  type WorkflowConfigApplyPayload,
} from '@/components/chat/WorkflowConfigModal.vue'
import { useApiKeysApi } from '@/composables/api'
import { useRepertoryState } from '@/stores/repertoryState'
import { useWorkspaceState, type SelectedWorkflow } from '@/stores/workspaceState'
import type { ApiKeyItem } from '@/types/apiKeys'
import type { ChatMessageItem, ChatWorkflowStep } from '@/types/chats'

const route = useRoute()
const router = useRouter()
const {
  activeProject,
  activeProjectId,
  activeThread,
  activeThreadId,
  isLoadingMessages,
  pendingUserMessage,
  streamingAssistantText,
  selectedWorkflow,
  startNewChat,
  sendChatMessage,
  setSelectedWorkflow,
} = useWorkspaceState()
const { getDocumentsState, getAssetsState } = useRepertoryState()
const { listProjectApiKeys, listMemberApiKeys } = useApiKeysApi()

const messagesScrollRef = ref<InstanceType<typeof ScrollContainer> | null>(null)
const draftMessage = ref('')

const apiKeys = ref<ApiKeyItem[]>([])
const isLoadingApiKeys = ref(false)
const apiKeysError = ref('')
const selectedApiKeyIdString = ref('')
let apiKeysRequestSeq = 0

const isWorkflowModalOpen = ref(false)
const isGenerating = ref(false)

const resolvedProjectId = computed<number | null>(
  () => activeProjectId.value ?? activeProject.value?.id ?? null,
)

function buildTitleMap<T extends { id: number; title: string }>(items: T[]): Record<number, string> {
  const map: Record<number, string> = {}
  for (const item of items) {
    if (item.title) {
      map[item.id] = item.title
    }
  }
  return map
}

const cachedDocumentTitles = computed<Record<number, string>>(() => {
  if (resolvedProjectId.value === null) {
    return {}
  }
  return buildTitleMap(getDocumentsState(resolvedProjectId.value).items)
})

const cachedAssetTitles = computed<Record<number, string>>(() => {
  if (resolvedProjectId.value === null) {
    return {}
  }
  return buildTitleMap(getAssetsState(resolvedProjectId.value).items)
})

const apiKeyOptions = computed<SelectOption[]>(() =>
  apiKeys.value.map((key) => ({
    value: String(key.id),
    label: `${key.provider} • ${key.hint} (${key.scope === 'project' ? 'projeto' : 'membro'})`,
  })),
)

const displayedMessages = computed<ChatMessageItem[]>(() => {
  const base = activeThread.value?.messages ?? []
  if (!isGenerating.value) {
    return base
  }

  const next: ChatMessageItem[] = [...base]
  const pendingText = pendingUserMessage.value
  const lastMsg = base[base.length - 1]

  if (pendingText && !(lastMsg?.role === 'human' && lastMsg.content === pendingText)) {
    next.push({
      id: -101,
      chatId: activeThread.value?.id ?? 0,
      parentId: null,
      role: 'human',
      content: pendingText,
      payload: {},
      metaData: {},
      createdAt: '',
    })
  }

  if (streamingAssistantText.value) {
    next.push({
      id: -102,
      chatId: activeThread.value?.id ?? 0,
      parentId: null,
      role: 'ai',
      content: streamingAssistantText.value,
      payload: {},
      metaData: {},
      createdAt: '',
    })
  }

  return next
})

function scrollMessagesToBottom() {
  void nextTick(() => {
    messagesScrollRef.value?.scrollToBottom()
  })
}

async function loadApiKeysForProject(projectId: number | null) {
  const requestId = ++apiKeysRequestSeq
  if (projectId === null) {
    apiKeys.value = []
    apiKeysError.value = ''
    selectedApiKeyIdString.value = ''
    isLoadingApiKeys.value = false
    return
  }

  isLoadingApiKeys.value = true
  apiKeysError.value = ''

  try {
    const [projectResult, memberResult] = await Promise.allSettled([
      listProjectApiKeys(projectId, { limit: 100 }),
      listMemberApiKeys(projectId, { limit: 100 }),
    ])
    if (requestId !== apiKeysRequestSeq) {
      return
    }

    if (projectResult.status === 'rejected' && memberResult.status === 'rejected') {
      apiKeys.value = []
      selectedApiKeyIdString.value = ''
      apiKeysError.value = getApiErrorMessage(
        projectResult.reason,
        'Não foi possível carregar as chaves de API.',
      )
      return
    }

    const projectItems = projectResult.status === 'fulfilled' ? projectResult.value.items : []
    const memberItems = memberResult.status === 'fulfilled' ? memberResult.value.items : []

    const deduped = new Map<number, ApiKeyItem>()
    for (const item of [...projectItems, ...memberItems]) {
      if (!deduped.has(item.id)) {
        deduped.set(item.id, item)
      }
    }

    const mergedKeys = Array.from(deduped.values())
    apiKeys.value = mergedKeys

    const currentId = Number(selectedApiKeyIdString.value)
    const hasSelected =
      selectedApiKeyIdString.value !== '' && mergedKeys.some((item) => item.id === currentId)
    if (!hasSelected) {
      selectedApiKeyIdString.value = mergedKeys.length > 0 ? String(mergedKeys[0]!.id) : ''
    }
  } catch (error) {
    if (requestId !== apiKeysRequestSeq) {
      return
    }
    apiKeys.value = []
    selectedApiKeyIdString.value = ''
    apiKeysError.value = getApiErrorMessage(error, 'Não foi possível carregar as chaves de API.')
  } finally {
    if (requestId === apiKeysRequestSeq) {
      isLoadingApiKeys.value = false
    }
  }
}

watch(
  resolvedProjectId,
  (projectId) => {
    void loadApiKeysForProject(projectId)
  },
  { immediate: true },
)

watch(
  () => [
    activeThread.value?.id,
    displayedMessages.value.length,
    streamingAssistantText.value,
    isGenerating.value,
    isLoadingMessages.value,
  ],
  ([threadId, count], [prevThreadId, prevCount]) => {
    if (
      (threadId && threadId !== prevThreadId) ||
      count !== prevCount ||
      streamingAssistantText.value
    ) {
      scrollMessagesToBottom()
    }
  },
)

function handleCreateNewChat() {
  draftMessage.value = ''
  startNewChat()
  if (resolvedProjectId.value !== null && router.hasRoute('chat')) {
    const targetProjectId = String(resolvedProjectId.value)
    if (route.name !== 'chat' || route.params.projectId !== targetProjectId) {
      void router.push({ name: 'chat', params: { projectId: targetProjectId } })
    }
  }
}

function handleAttachUnavailable() {
  toast.info('Anexos no chat estarão disponíveis em breve na API.')
}

function handleApplyWorkflow(payload: WorkflowConfigApplyPayload) {
  const applied: SelectedWorkflow = {
    id: payload.workflowId,
    name: payload.workflowName,
    version: payload.version,
    description: payload.description,
    config: payload.config,
  }
  setSelectedWorkflow(applied)
  toast.success(`Workflow "${payload.workflowName}" (${payload.version}) configurado.`)
}

function clearWorkflow() {
  setSelectedWorkflow(null)
}

function goToApiKeys() {
  if (resolvedProjectId.value !== null && router.hasRoute('api-keys')) {
    void router.push({
      name: 'api-keys',
      params: { projectId: String(resolvedProjectId.value) },
    })
    return
  }
  void router.push('/api-keys')
}

function handleCitationClick(payload: AiCitationPayload) {
  const targetRouteName =
    payload.kind === 'asset' ? 'repertory-asset-detail' : 'repertory-document-detail'
  if (resolvedProjectId.value !== null && router.hasRoute(targetRouteName)) {
    void router.push({
      name: targetRouteName,
      params: {
        projectId: String(resolvedProjectId.value),
        itemId: String(payload.targetId),
      },
    })
    return
  }

  if (router.hasRoute('repertory')) {
    const repertoryRoute = router.getRoutes().find((entry) => entry.name === 'repertory')
    if (resolvedProjectId.value !== null && repertoryRoute?.path.includes(':projectId')) {
      void router.push({
        name: 'repertory',
        params: { projectId: String(resolvedProjectId.value) },
      })
      return
    }
    void router.push({ name: 'repertory' })
    return
  }

  void router.push('/repertorio')
}

async function handleSendMessage(value: string) {
  const trimmed = value.trim()
  if (!trimmed || isGenerating.value) {
    return
  }

  const apiKeyId = Number(selectedApiKeyIdString.value)
  if (!selectedApiKeyIdString.value || !Number.isFinite(apiKeyId) || apiKeyId <= 0) {
    toast.error('Selecione ou cadastre uma chave de API em Chaves de API antes de enviar.')
    return
  }

  const wasNewChat = activeThreadId.value === null
  draftMessage.value = ''
  isGenerating.value = true
  try {
    await sendChatMessage({ text: trimmed, apiKeyId })
  } catch (error) {
    if (draftMessage.value.length === 0) {
      draftMessage.value = trimmed
    }
    toast.error(getApiErrorMessage(error, 'Não foi possível enviar a mensagem.'))
  } finally {
    if (
      wasNewChat &&
      activeThreadId.value !== null &&
      resolvedProjectId.value !== null &&
      router.hasRoute('chat-thread')
    ) {
      await router.replace({
        name: 'chat-thread',
        params: {
          projectId: String(resolvedProjectId.value),
          chatId: String(activeThreadId.value),
        },
      })
    }
    isGenerating.value = false
  }
}

function getMessageSteps(msg: ChatMessageItem): ChatWorkflowStep[] {
  if (msg.steps && msg.steps.length > 0) {
    return msg.steps
  }

  const rawSteps = Array.isArray(msg.payload?.steps)
    ? msg.payload.steps
    : Array.isArray(msg.metaData?.steps)
      ? msg.metaData.steps
      : []

  return rawSteps
    .filter(
      (item): item is { id?: string | number; title: string; summary: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).title === 'string' &&
        typeof (item as Record<string, unknown>).summary === 'string',
    )
    .map((item, idx) => ({
      id: item.id !== undefined && String(item.id).trim() ? String(item.id) : `step-${idx + 1}`,
      title: item.title,
      summary: item.summary,
    }))
}

function getStepSummary(steps: ChatWorkflowStep[] | undefined, stepId: string): string {
  return steps?.find((item) => item.id === stepId)?.summary ?? ''
}
</script>

<template>
  <AppShell active-nav="chat" :show-topbar="false" title="chatbot">
    <section class="chat-view" aria-label="Área de conversa">
      <header class="chat-view__header">
        <div class="chat-view__header-main">
          <h1 class="chat-view__title">{{ activeThread?.title ?? 'novo chat' }}</h1>
          <Badge v-if="selectedWorkflow" :label="selectedWorkflow.name" />
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
        <div
          v-if="isLoadingMessages && displayedMessages.length === 0"
          class="chat-view__loading"
          role="status"
        >
          <Icon name="robot" size="xl" color="brand" />
          <p class="chat-view__loading-text">Carregando mensagens da conversa...</p>
        </div>

        <div v-else-if="displayedMessages.length === 0 && !isGenerating" class="chat-view__empty">
          <Icon name="robot" size="2xl" color="brand" />
          <div class="chat-view__empty-copy">
            <h2 class="chat-view__empty-title">como posso ajudar hoje?</h2>
            <p class="chat-view__empty-subtitle">
              Escolha uma chave de API, selecione um workflow ou envie sua pergunta abaixo.
            </p>
          </div>
        </div>

        <div v-else class="chat-view__feed">
          <ChatMessage v-for="msg in displayedMessages" :key="msg.id" :role="msg.role">
            <div class="chat-view__message-body">
              <WorkflowStepsAccordion
                v-if="msg.role === 'ai' && getMessageSteps(msg).length > 0"
                :steps="getMessageSteps(msg)"
                class="chat-view__message-steps"
              >
                <template #step="{ step }">
                  <p class="chat-view__step-summary">
                    {{ getStepSummary(getMessageSteps(msg), step.id) }}
                  </p>
                </template>
              </WorkflowStepsAccordion>

              <MarkdownRenderer
                v-if="msg.role === 'ai'"
                :content="msg.content"
                :document-titles="cachedDocumentTitles"
                :asset-titles="cachedAssetTitles"
                @citation-click="handleCitationClick"
              />
              <p v-else class="chat-view__message-text">{{ msg.content }}</p>
            </div>
          </ChatMessage>

          <ChatMessage v-if="isGenerating && !streamingAssistantText" role="ai">
            <p class="chat-view__generating">Processando resposta...</p>
          </ChatMessage>
          <ChatMessage v-else-if="isLoadingMessages" role="ai">
            <p class="chat-view__generating">Carregando mensagens...</p>
          </ChatMessage>
        </div>
      </ScrollContainer>

      <div class="chat-view__composer-wrap">
        <div class="chat-view__composer">
          <Notification
            v-if="apiKeysError"
            variant="danger"
            icon="exclamation"
            title="Erro ao carregar chaves de API"
            :message="apiKeysError"
          />

          <Notification
            v-else-if="!isLoadingApiKeys && resolvedProjectId !== null && apiKeys.length === 0"
            icon="api-keys"
            title="Nenhuma chave de API cadastrada"
          >
            <span class="chat-view__api-key-warning">
              <span>
                Cadastre uma chave de API para este projeto ou membro antes de enviar mensagens.
              </span>
              <Button variant="tertiary" size="sm" @click="goToApiKeys">
                Ir para Chaves de API
              </Button>
            </span>
          </Notification>

          <div class="chat-view__composer-controls">
            <div class="chat-view__api-key-control">
              <Select
                v-model="selectedApiKeyIdString"
                variant="inline"
                aria-label="Selecionar chave de API"
                :options="apiKeyOptions"
                :placeholder="isLoadingApiKeys ? 'Carregando chaves...' : 'Nenhuma chave de API'"
                :disabled="isLoadingApiKeys || apiKeys.length === 0 || isGenerating"
              />
            </div>

            <div v-if="selectedWorkflow" class="chat-view__workflow-chip">
              <Tag
                :label="`workflow: ${selectedWorkflow.name} (v${selectedWorkflow.version})`"
                :dismissible="true"
                dismiss-label="Remover workflow selecionado"
                @dismiss="clearWorkflow"
              />
            </div>
          </div>

          <AiPromptInput
            v-model="draftMessage"
            :submit-disabled="isGenerating"
            placeholder="Digite sua mensagem"
            @attach="handleAttachUnavailable"
            @select-workflow="isWorkflowModalOpen = true"
            @submit="handleSendMessage"
          />
        </div>
      </div>
    </section>

    <WorkflowConfigModal
      v-model:open="isWorkflowModalOpen"
      :selected-workflow-id="selectedWorkflow?.id ?? null"
      :selected-workflow-config="selectedWorkflow?.config ?? null"
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

.chat-view__loading,
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

.chat-view__loading-text {
  margin: var(--spacing-0);
  color: var(--chat-view-empty-subtitle-color);
  font-family: var(--chat-view-empty-subtitle-font-family);
  font-size: var(--chat-view-empty-subtitle-font-size);
  line-height: var(--chat-view-empty-subtitle-line-height);
  font-weight: var(--chat-view-empty-subtitle-font-weight);
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

.chat-view__composer-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.chat-view__api-key-control {
  display: flex;
  align-items: center;
}

.chat-view__api-key-warning {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.chat-view__workflow-chip {
  display: flex;
  align-items: center;
}

@media (max-width: 767px) {
  .chat-view__header {
    padding: var(--spacing-3) var(--spacing-4);
  }

  .chat-view__loading,
  .chat-view__empty,
  .chat-view__feed {
    padding: var(--spacing-5) var(--spacing-4);
  }

  .chat-view__composer-wrap {
    padding: var(--spacing-3) var(--spacing-4) var(--spacing-4);
  }
}
</style>
