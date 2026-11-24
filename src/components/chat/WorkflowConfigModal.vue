<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import chatWorkflowImage from '@/assets/images/9d170a1eb9fe2e47d22162cd576ea7e1e82394e9.jpg'
import { getApiErrorMessage } from '@/api/errors'
import { buildWorkflowConfigValues } from '@/api/mappers/workflowMapper'
import {
  Badge,
  Button,
  Icon,
  Modal,
  Notification,
  Select,
  Tag,
  TextArea,
  TextInput,
  WorkflowSlideCard,
  type SelectOption,
} from '@/components/ui'
import { useWorkflowsApi } from '@/composables/api'
import type {
  WorkflowConfigField,
  WorkflowConfigFieldValue,
  WorkflowConfigNode,
  WorkflowConfigValues,
  WorkflowItem,
} from '@/types/workflows'

export interface WorkflowSlide extends WorkflowItem {
  badge: string
  imageUrl: string
}

export interface WorkflowConfigApplyPayload {
  workflowId: number
  workflowName: string
  version: string
  description: string
  config: WorkflowConfigValues
}

interface Props {
  open: boolean
  selectedWorkflowId?: number | null
  selectedWorkflowConfig?: WorkflowConfigValues | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedWorkflowId: null,
  selectedWorkflowConfig: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: [payload: WorkflowConfigApplyPayload]
}>()

const BACKDROP_VARIANTS = ['strategy', 'engineering', 'knowledge', 'compliance'] as const

function createWorkflowBackdropSvg(variant: (typeof BACKDROP_VARIANTS)[number]): string {
  const motifs = {
    strategy: `
      <defs>
        <linearGradient id="bg-strat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1b181a"/>
          <stop offset="55%" stop-color="#353134"/>
          <stop offset="100%" stop-color="#60065e"/>
        </linearGradient>
      </defs>
      <rect width="520" height="600" fill="url(#bg-strat)"/>
      <circle cx="420" cy="140" r="170" fill="#f33ff0" fill-opacity="0.16"/>
      <circle cx="110" cy="440" r="140" fill="#fb6af9" fill-opacity="0.12"/>
      <path d="M56 380 L180 280 L300 320 L460 170" fill="none" stroke="#f99ff7" stroke-width="3"/>
      <circle cx="180" cy="280" r="8" fill="#ffffff" stroke="#f33ff0" stroke-width="3"/>
      <circle cx="300" cy="320" r="8" fill="#ffffff" stroke="#f33ff0" stroke-width="3"/>
      <circle cx="460" cy="170" r="8" fill="#f33ff0"/>
    `,
    engineering: `
      <defs>
        <linearGradient id="bg-eng" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#080708"/>
          <stop offset="100%" stop-color="#2a2429"/>
        </linearGradient>
      </defs>
      <rect width="520" height="600" fill="url(#bg-eng)"/>
      <g stroke="#4f4a4f" stroke-width="1" opacity="0.45">
        <path d="M0 120 H520 M0 240 H520 M0 360 H520 M0 480 H520"/>
        <path d="M104 0 V600 M208 0 V600 M312 0 V600 M416 0 V600"/>
      </g>
      <rect x="64" y="210" width="124" height="72" fill="#1b181a" stroke="#f33ff0" stroke-width="2"/>
      <rect x="240" y="150" width="144" height="72" fill="#1b181a" stroke="#fb6af9" stroke-width="2"/>
      <rect x="240" y="290" width="144" height="72" fill="#1b181a" stroke="#837c83" stroke-width="2"/>
      <path d="M188 246 H214 V186 H240 M214 246 V326 H240" fill="none" stroke="#f33ff0" stroke-width="2"/>
    `,
    knowledge: `
      <defs>
        <linearGradient id="bg-know" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#353134"/>
          <stop offset="50%" stop-color="#1b181a"/>
          <stop offset="100%" stop-color="#080708"/>
        </linearGradient>
      </defs>
      <rect width="520" height="600" fill="url(#bg-know)"/>
      <circle cx="260" cy="290" r="160" fill="none" stroke="#f33ff0" stroke-opacity="0.35" stroke-width="1.5"/>
      <circle cx="260" cy="290" r="108" fill="none" stroke="#fb6af9" stroke-opacity="0.55" stroke-width="1.5"/>
      <circle cx="260" cy="290" r="56" fill="#f33ff0" fill-opacity="0.22" stroke="#f99ff7" stroke-width="2"/>
      <rect x="92" y="420" width="336" height="14" fill="#4f4a4f" opacity="0.6"/>
      <rect x="132" y="450" width="256" height="10" fill="#837c83" opacity="0.45"/>
    `,
    compliance: `
      <defs>
        <linearGradient id="bg-comp" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#1b181a"/>
          <stop offset="50%" stop-color="#2a2429"/>
          <stop offset="100%" stop-color="#4f4a4f"/>
        </linearGradient>
      </defs>
      <rect width="520" height="600" fill="url(#bg-comp)"/>
      <polygon points="260,120 400,200 400,360 260,440 120,360 120,200" fill="none" stroke="#f99ff7" stroke-opacity="0.35" stroke-width="2"/>
      <polygon points="260,170 356,225 356,335 260,390 164,335 164,225" fill="#f33ff0" fill-opacity="0.14" stroke="#fb6af9" stroke-width="2"/>
      <circle cx="260" cy="280" r="24" fill="#f33ff0"/>
    `,
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 600">${motifs[variant]}</svg>`,
  )}`
}

function mapWorkflowToSlide(workflow: WorkflowItem, index: number): WorkflowSlide {
  const variant = BACKDROP_VARIANTS[index % BACKDROP_VARIANTS.length]!
  const isChatWorkflow = workflow.name.trim().toLowerCase() === 'chat'
  return {
    ...workflow,
    badge: `v${workflow.version}`,
    imageUrl: isChatWorkflow ? chatWorkflowImage : createWorkflowBackdropSvg(variant),
  }
}

const BOOLEAN_SELECT_OPTIONS: SelectOption[] = [
  { label: 'Ativado', value: 'true' },
  { label: 'Desativado', value: 'false' },
]

const DRAG_SWIPE_THRESHOLD_PX = 48
const DRAG_VELOCITY_THRESHOLD = 0.25

const { listWorkflows, getWorkflowConfig } = useWorkflowsApi()

const workflowSlides = ref<WorkflowSlide[]>([])
const isLoadingWorkflows = ref(false)
const workflowError = ref('')
let workflowsRequestSeq = 0
let configRequestSeq = 0

const step = ref<1 | 2>(1)
const activeSlideIndex = ref(0)
const draftWorkflowId = ref<number | null>(props.selectedWorkflowId ?? null)

const configNodes = ref<WorkflowConfigNode[]>([])
const configValues = ref<WorkflowConfigValues>({})
const activeNodeId = ref('')
const isLoadingConfig = ref(false)
const configError = ref('')

const isDragging = ref(false)
const dragOffsetX = ref(0)
let activePointerId: number | null = null
let dragStartX = 0
let dragStartTime = 0
let suppressSlideClick = false

const activeSlidePreset = computed<WorkflowSlide | null>(
  () => workflowSlides.value[activeSlideIndex.value] ?? workflowSlides.value[0] ?? null,
)

const selectedWorkflow = computed<WorkflowSlide | null>(
  () =>
    workflowSlides.value.find((item) => item.id === draftWorkflowId.value) ??
    activeSlidePreset.value,
)

const activeNode = computed<WorkflowConfigNode | null>(
  () => configNodes.value.find((node) => node.id === activeNodeId.value) ?? configNodes.value[0] ?? null,
)

const activeNodeIndex = computed(() =>
  activeNode.value ? configNodes.value.findIndex((node) => node.id === activeNode.value!.id) : -1,
)

const activeEdgeSummaryTag = computed(() => {
  if (!activeNode.value) return ''
  const idx = activeNodeIndex.value
  const entryLabel = idx > 0 ? configNodes.value[idx - 1]!.id : 'entrada'
  const exitLabel =
    idx >= 0 && idx < configNodes.value.length - 1 ? configNodes.value[idx + 1]!.id : 'saída'
  return `${entryLabel} → ${exitLabel}`
})

async function loadWorkflows() {
  const requestId = ++workflowsRequestSeq
  isLoadingWorkflows.value = true
  workflowError.value = ''

  try {
    const page = await listWorkflows({ limit: 100 })
    if (requestId !== workflowsRequestSeq) {
      return
    }
    const mapped = page.items.map(mapWorkflowToSlide)
    workflowSlides.value = mapped

    if (mapped.length > 0) {
      const matchedIdx = mapped.findIndex((item) => item.id === props.selectedWorkflowId)
      const resolvedIndex = matchedIdx >= 0 ? matchedIdx : 0
      activeSlideIndex.value = resolvedIndex
      draftWorkflowId.value = mapped[resolvedIndex]!.id
    } else {
      activeSlideIndex.value = 0
      draftWorkflowId.value = null
    }
  } catch (error) {
    if (requestId !== workflowsRequestSeq) {
      return
    }
    workflowSlides.value = []
    workflowError.value = getApiErrorMessage(error, 'Não foi possível carregar os workflows.')
  } finally {
    if (requestId === workflowsRequestSeq) {
      isLoadingWorkflows.value = false
    }
  }
}

function seedNodesForWorkflow(
  workflow: WorkflowSlide,
  nodes: WorkflowConfigNode[],
  preservedValues?: WorkflowConfigValues | null,
) {
  configNodes.value = nodes
  configValues.value = buildWorkflowConfigValues(nodes, preservedValues)
  if (!nodes.some((node) => node.id === activeNodeId.value)) {
    activeNodeId.value = nodes[0]?.id ?? ''
  }
}

async function loadWorkflowConfigForSlide(workflow: WorkflowSlide) {
  const requestId = ++configRequestSeq
  const priorSaved =
    props.selectedWorkflowId === workflow.id ? props.selectedWorkflowConfig : null

  configError.value = ''
  seedNodesForWorkflow(workflow, workflow.configNodes, priorSaved)

  isLoadingConfig.value = workflow.configNodes.length === 0
  try {
    const fetchedNodes = await getWorkflowConfig(workflow.name)
    if (requestId !== configRequestSeq) {
      return
    }
    if (fetchedNodes.length > 0 || workflow.configNodes.length === 0) {
      seedNodesForWorkflow(workflow, fetchedNodes, {
        ...priorSaved,
        ...configValues.value,
      })
    }
  } catch (error) {
    if (requestId !== configRequestSeq) {
      return
    }
    if (workflow.configNodes.length === 0) {
      configNodes.value = []
      configError.value = getApiErrorMessage(
        error,
        'Não foi possível carregar a configuração do workflow.',
      )
    }
  } finally {
    if (requestId === configRequestSeq) {
      isLoadingConfig.value = false
    }
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      step.value = 1
      isDragging.value = false
      dragOffsetX.value = 0
      activePointerId = null
      configError.value = ''
      void loadWorkflows()
    }
  },
  { immediate: true },
)

function getRelativeOffset(index: number): number {
  const total = workflowSlides.value.length
  if (total === 0) return 0
  let diff = (index - activeSlideIndex.value) % total
  if (diff > total / 2) diff -= total
  if (diff < -total / 2) diff += total
  return diff
}

function getSlideSlotClass(index: number) {
  const offset = getRelativeOffset(index)
  if (offset === 0) return 'workflow-modal__slide-slot--center'
  if (offset === -1) return 'workflow-modal__slide-slot--left'
  if (offset === 1) return 'workflow-modal__slide-slot--right'
  if (offset === -2) return 'workflow-modal__slide-slot--far-left'
  if (offset === 2) return 'workflow-modal__slide-slot--far-right'
  return 'workflow-modal__slide-slot--hidden'
}

function getSlideSlotStyle(index: number): Record<string, string> | undefined {
  const offset = getRelativeOffset(index)
  if (offset !== 0 || !isDragging.value || dragOffsetX.value === 0) {
    return undefined
  }
  return {
    transform: `translate3d(calc(-50% + ${dragOffsetX.value}px), 0, 0) scale(1)`,
  }
}

function setSlideIndex(index: number) {
  const total = workflowSlides.value.length
  if (total === 0) return
  const normalized = ((index % total) + total) % total
  activeSlideIndex.value = normalized
  draftWorkflowId.value = workflowSlides.value[normalized]!.id
}

function goPreviousSlide() {
  setSlideIndex(activeSlideIndex.value - 1)
}

function goNextSlide() {
  setSlideIndex(activeSlideIndex.value + 1)
}

function handleSlideClick(index: number) {
  if (suppressSlideClick) {
    suppressSlideClick = false
    return
  }
  if (activeSlideIndex.value !== index) {
    setSlideIndex(index)
    return
  }
  const target = workflowSlides.value[index]
  if (target) {
    draftWorkflowId.value = target.id
  }
}

function handleStagePointerDown(event: PointerEvent) {
  if (event.button !== 0 && event.pointerType === 'mouse') {
    return
  }
  const target = event.target as HTMLElement | null
  if (target?.closest('button, a, input, select, textarea')) {
    return
  }

  activePointerId = event.pointerId
  dragStartX = event.clientX
  dragStartTime = performance.now()
  isDragging.value = true
  dragOffsetX.value = 0
  suppressSlideClick = false
  ;(event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
}

function handleStagePointerMove(event: PointerEvent) {
  if (!isDragging.value || activePointerId !== event.pointerId) {
    return
  }
  const deltaX = event.clientX - dragStartX
  dragOffsetX.value = Math.max(-220, Math.min(220, deltaX))
}

function handleStagePointerUp(event: PointerEvent) {
  if (!isDragging.value || activePointerId !== event.pointerId) {
    return
  }
  const deltaX = event.clientX - dragStartX
  const elapsed = Math.max(1, performance.now() - dragStartTime)
  const velocity = Math.abs(deltaX) / elapsed

  if (Math.abs(deltaX) > 6) {
    suppressSlideClick = true
  }

  if (deltaX <= -DRAG_SWIPE_THRESHOLD_PX || (deltaX < -20 && velocity >= DRAG_VELOCITY_THRESHOLD)) {
    goNextSlide()
  } else if (
    deltaX >= DRAG_SWIPE_THRESHOLD_PX ||
    (deltaX > 20 && velocity >= DRAG_VELOCITY_THRESHOLD)
  ) {
    goPreviousSlide()
  }

  isDragging.value = false
  dragOffsetX.value = 0
  activePointerId = null
}

function handleStageKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    goPreviousSlide()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    goNextSlide()
  }
}

function selectNode(nodeId: string) {
  activeNodeId.value = nodeId
}

function formatEdgeTarget(index: number): string {
  const nextNode = configNodes.value[index + 1]
  return nextNode ? `→ ${nextNode.id}` : 'Saída'
}

function getNodeSummaryBadge(node: WorkflowConfigNode): string {
  const nodeState = configValues.value[node.id] ?? {}
  const modelValue = nodeState.model
  if (typeof modelValue === 'string' && modelValue.trim().length > 0) {
    return modelValue.trim()
  }
  const providerValue = nodeState.provider
  if (typeof providerValue === 'string' && providerValue.trim().length > 0) {
    return providerValue.trim()
  }
  return `${node.fields.length} ${node.fields.length === 1 ? 'campo' : 'campos'}`
}

function getFieldValue(nodeId: string, fieldName: string): string {
  const val = configValues.value[nodeId]?.[fieldName]
  if (val === undefined) return ''
  return String(val)
}

function updateFieldValue(
  nodeId: string,
  field: WorkflowConfigField,
  rawValue: string,
) {
  let nextValue: WorkflowConfigFieldValue = rawValue
  if (field.type === 'boolean' || field.type === 'checkbox' || field.type === 'toggle') {
    nextValue = rawValue === 'true'
  } else if (field.type === 'number' || field.type === 'integer' || field.type === 'float') {
    const trimmed = rawValue.trim()
    nextValue = trimmed === '' ? '' : Number.isFinite(Number(trimmed)) ? Number(trimmed) : rawValue
  }

  configValues.value = {
    ...configValues.value,
    [nodeId]: {
      ...configValues.value[nodeId],
      [field.name]: nextValue,
    },
  }
}

function getFieldPlaceholder(nodeId: string, field: WorkflowConfigField): string {
  if (field.placeholder) {
    return field.placeholder
  }
  if (field.type === 'model') {
    const provider = configValues.value[nodeId]?.provider
    if (provider === 'openrouter') {
      return 'Ex: openai/gpt-4o-mini (opcional)'
    }
    return 'Ex: bonsai-2:4b (padrão se vazio)'
  }
  if (field.type === 'select') {
    return 'Selecione uma opção'
  }
  return field.description || `Informe ${field.label}`
}

function handleClose() {
  emit('update:open', false)
}

function selectCurrentSlideAndContinue() {
  const current = activeSlidePreset.value
  if (!current) {
    return
  }
  draftWorkflowId.value = current.id
  step.value = 2
  void loadWorkflowConfigForSlide(current)
}

function handleRetryConfig() {
  if (!selectedWorkflow.value) return
  void loadWorkflowConfigForSlide(selectedWorkflow.value)
}

function handleApply() {
  const chosenWorkflow = selectedWorkflow.value
  if (!chosenWorkflow) {
    return
  }

  emit('apply', {
    workflowId: chosenWorkflow.id,
    workflowName: chosenWorkflow.name,
    version: chosenWorkflow.version,
    description: chosenWorkflow.description,
    config: buildWorkflowConfigValues(configNodes.value, configValues.value),
  })
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    size="lg"
    :title="step === 1 ? 'workflows' : 'configurações'"
    :subtitle="
      step === 1
        ? 'Arraste ou navegue no slide para escolher qual workflow deseja visualizar.'
        : 'Configure os parâmetros dos nós do workflow selecionado.'
    "
    @update:open="emit('update:open', $event)"
  >
    <div class="workflow-modal">
      <div v-if="step === 1" class="workflow-modal__slide-view">
        <div v-if="isLoadingWorkflows" class="workflow-modal__state" role="status">
          <Icon name="robot" size="lg" color="brand" />
          <p class="workflow-modal__state-text">Carregando workflows...</p>
        </div>

        <div v-else-if="workflowError" class="workflow-modal__state">
          <Notification
            variant="danger"
            icon="exclamation"
            title="Erro ao carregar workflows"
            :message="workflowError"
          />
          <div class="workflow-modal__state-actions">
            <Button variant="secondary" size="sm" @click="loadWorkflows">Tentar novamente</Button>
          </div>
        </div>

        <div v-else-if="workflowSlides.length === 0" class="workflow-modal__state">
          <Notification
            icon="robot"
            title="Nenhum workflow disponível"
            message="A API não retornou workflows disponíveis no momento."
          />
          <div class="workflow-modal__state-actions">
            <Button variant="secondary" size="sm" @click="loadWorkflows">Atualizar</Button>
          </div>
        </div>

        <template v-else>
          <div
            :class="[
              'workflow-modal__carousel-stage',
              isDragging ? 'workflow-modal__carousel-stage--dragging' : undefined,
            ]"
            data-drawer-no-drag
            tabindex="0"
            role="region"
            aria-roledescription="carrossel"
            aria-label="Slide de seleção de workflow"
            @pointerdown="handleStagePointerDown"
            @pointermove="handleStagePointerMove"
            @pointerup="handleStagePointerUp"
            @pointercancel="handleStagePointerUp"
            @keydown="handleStageKeydown"
          >
            <div
              v-for="(item, index) in workflowSlides"
              :key="item.id"
              :class="['workflow-modal__slide-slot', getSlideSlotClass(index)]"
              :style="getSlideSlotStyle(index)"
            >
              <WorkflowSlideCard
                :name="item.name"
                :version="item.versionLabel"
                :description="item.description"
                :image-url="item.imageUrl"
                :selected="activeSlideIndex === index"
                @select="handleSlideClick(index)"
              >
                <template #badge>
                  <Badge :label="item.badge" />
                </template>
              </WorkflowSlideCard>
            </div>
          </div>

          <div class="workflow-modal__slide-controls">
            <Button variant="tertiary" size="sm" @click="goPreviousSlide">
              <span class="workflow-modal__nav-btn-content">
                <Icon name="arrow-left" size="sm" />
                <span>Anterior</span>
              </span>
            </Button>

            <div class="workflow-modal__slide-indicators" aria-label="Indicadores do slide">
              <button
                v-for="(item, index) in workflowSlides"
                :key="item.id"
                type="button"
                :class="[
                  'workflow-modal__slide-dot',
                  activeSlideIndex === index ? 'workflow-modal__slide-dot--active' : undefined,
                ]"
                :aria-label="`Ir para workflow ${item.name}`"
                :aria-current="activeSlideIndex === index ? 'true' : undefined"
                @click="setSlideIndex(index)"
              />
              <span class="workflow-modal__slide-counter">
                {{ activeSlideIndex + 1 }} / {{ workflowSlides.length }}
              </span>
            </div>

            <Button variant="tertiary" size="sm" @click="goNextSlide">
              <span class="workflow-modal__nav-btn-content">
                <span>Próximo</span>
                <Icon name="arrow-right" size="sm" />
              </span>
            </Button>
          </div>
        </template>
      </div>

      <div v-else class="workflow-modal__config">
        <div v-if="selectedWorkflow" class="workflow-modal__summary">
          <div class="workflow-modal__summary-meta">
            <span class="workflow-modal__summary-name">{{ selectedWorkflow.name }}</span>
            <span class="workflow-modal__summary-version">{{ selectedWorkflow.versionLabel }}</span>
          </div>
          <Badge :label="selectedWorkflow.badge" />
        </div>

        <div v-if="isLoadingConfig && configNodes.length === 0" class="workflow-modal__state" role="status">
          <Icon name="robot" size="lg" color="brand" />
          <p class="workflow-modal__state-text">Carregando configuração do workflow...</p>
        </div>

        <div v-else-if="configError && configNodes.length === 0" class="workflow-modal__state">
          <Notification
            variant="danger"
            icon="exclamation"
            title="Erro ao carregar configuração"
            :message="configError"
          />
          <div class="workflow-modal__state-actions">
            <Button variant="secondary" size="sm" @click="handleRetryConfig">Tentar novamente</Button>
          </div>
        </div>

        <Notification
          v-else-if="configNodes.length === 0"
          icon="info"
          title="Sem parâmetros configuráveis"
          message="Este workflow não possui parâmetros adicionais para configurar."
        />

        <template v-else>
          <div
            class="workflow-modal__graph"
            data-drawer-no-drag
            role="group"
            aria-label="Grafo de etapas do workflow"
          >
            <template v-for="(node, index) in configNodes" :key="node.id">
              <button
                type="button"
                :class="[
                  'workflow-modal__graph-node',
                  activeNode?.id === node.id ? 'workflow-modal__graph-node--selected' : undefined,
                ]"
                :aria-pressed="activeNode?.id === node.id"
                @click="selectNode(node.id)"
              >
                <span class="workflow-modal__node-meta">
                  <span class="workflow-modal__node-id">{{ node.id }}</span>
                  <span class="workflow-modal__node-edge">
                    {{ formatEdgeTarget(index) }}
                  </span>
                </span>
                <span class="workflow-modal__node-title">{{ node.label }}</span>
                <span class="workflow-modal__node-badge">
                  <Badge :label="getNodeSummaryBadge(node)" />
                </span>
              </button>

              <span
                v-if="index < configNodes.length - 1"
                class="workflow-modal__graph-connector"
                aria-hidden="true"
              >
                <Icon name="arrow-right" size="md" color="helper" />
              </span>
            </template>
          </div>

          <div v-if="activeNode" class="workflow-modal__node-form">
            <div class="workflow-modal__node-form-header">
              <h3 class="workflow-modal__node-form-title">nó: {{ activeNode.label }}</h3>
              <div class="workflow-modal__node-form-tags">
                <Tag v-if="activeEdgeSummaryTag" :label="activeEdgeSummaryTag" />
                <Badge :label="`${activeNode.fields.length} campos`" />
              </div>
            </div>

            <div class="workflow-modal__node-fields">
              <template v-for="field in activeNode.fields" :key="`${activeNode.id}-${field.name}`">
                <Select
                  v-if="field.type === 'select'"
                  :model-value="getFieldValue(activeNode.id, field.name)"
                  :label="field.label"
                  :options="field.options"
                  :placeholder="getFieldPlaceholder(activeNode.id, field)"
                  :help-text="field.description"
                  :required="field.required"
                  @update:model-value="updateFieldValue(activeNode.id, field, $event)"
                />

                <Select
                  v-else-if="
                    field.type === 'boolean' ||
                    field.type === 'checkbox' ||
                    field.type === 'toggle'
                  "
                  :model-value="getFieldValue(activeNode.id, field.name)"
                  :label="field.label"
                  :options="BOOLEAN_SELECT_OPTIONS"
                  :help-text="field.description"
                  :required="field.required"
                  @update:model-value="updateFieldValue(activeNode.id, field, $event)"
                />

                <TextArea
                  v-else-if="field.type === 'textarea'"
                  :model-value="getFieldValue(activeNode.id, field.name)"
                  :label="field.label"
                  :placeholder="getFieldPlaceholder(activeNode.id, field)"
                  :help-text="field.description"
                  :required="field.required"
                  :rows="3"
                  class="workflow-modal__node-instruction"
                  @update:model-value="updateFieldValue(activeNode.id, field, $event)"
                />

                <TextInput
                  v-else
                  :type="
                    field.type === 'number' || field.type === 'integer' || field.type === 'float'
                      ? 'number'
                      : 'text'
                  "
                  :model-value="getFieldValue(activeNode.id, field.name)"
                  :label="field.label"
                  :placeholder="getFieldPlaceholder(activeNode.id, field)"
                  :help-text="field.description"
                  :required="field.required"
                  @update:model-value="updateFieldValue(activeNode.id, field, $event)"
                />
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <template v-if="step === 1">
        <Button variant="tertiary" @click="handleClose">Cancelar</Button>
        <Button
          variant="primary"
          :disabled="isLoadingWorkflows || Boolean(workflowError) || !activeSlidePreset"
          @click="selectCurrentSlideAndContinue"
        >
          Selecionar
        </Button>
      </template>
      <template v-else>
        <Button variant="tertiary" @click="step = 1">Voltar</Button>
        <Button variant="primary" :disabled="!selectedWorkflow" @click="handleApply">
          Aplicar workflow
        </Button>
      </template>
    </template>
  </Modal>
</template>

<style scoped>
.workflow-modal {
  --workflow-modal-gap: var(--spacing-4);
  --workflow-modal-grid-gap: var(--spacing-4);
  --workflow-modal-stage-height: 410px;
  --workflow-modal-stage-mask-size: var(--spacing-8);
  --workflow-modal-stage-mask-opaque: var(--text-primary);
  --workflow-modal-stage-mask-transparent: var(--surface-transparent);
  --workflow-modal-card-width: 320px;
  --workflow-modal-card-height: 392px;
  --workflow-modal-slide-duration: var(--duration-drawer);
  --workflow-modal-slide-easing: var(--easing-drawer);
  --workflow-modal-dot-bg: var(--surface-placeholder);
  --workflow-modal-dot-active-bg: var(--interactive-brand);
  --workflow-modal-counter-color: var(--text-helper);
  --workflow-modal-summary-bg: var(--surface-base);
  --workflow-modal-summary-border-color: var(--border-subtle-1);
  --workflow-modal-summary-border-width: var(--border-width-thin);
  --workflow-modal-summary-padding-y: var(--spacing-2);
  --workflow-modal-summary-padding-x: var(--spacing-3);
  --workflow-modal-summary-gap: var(--spacing-3);
  --workflow-modal-name-color: var(--text-primary);
  --workflow-modal-name-font-family: var(--type-heading-02-font-family);
  --workflow-modal-name-font-size: var(--type-heading-02-font-size);
  --workflow-modal-name-line-height: var(--type-heading-02-line-height);
  --workflow-modal-name-font-weight: var(--type-heading-02-font-weight);
  --workflow-modal-name-text-transform: var(--type-heading-02-text-transform);
  --workflow-modal-version-color: var(--text-tertiary);
  --workflow-modal-version-font-family: var(--type-body-compact-01-font-family);
  --workflow-modal-version-font-size: var(--type-body-compact-01-font-size);
  --workflow-modal-version-line-height: var(--type-body-compact-01-line-height);
  --workflow-modal-version-font-weight: var(--type-body-compact-01-font-weight);
  --workflow-modal-graph-bg: var(--surface-base);
  --workflow-modal-graph-border-color: var(--border-subtle-1);
  --workflow-modal-graph-padding: var(--spacing-4);
  --workflow-modal-graph-gap: var(--spacing-3);
  --workflow-modal-node-bg: var(--surface-elevated);
  --workflow-modal-node-border-color: var(--border-subtle-1);
  --workflow-modal-node-border-width: var(--border-width-thin);
  --workflow-modal-node-padding: var(--spacing-3);
  --workflow-modal-node-gap: var(--spacing-2);
  --workflow-modal-node-id-color: var(--text-helper);
  --workflow-modal-node-edge-color: var(--text-brand-strong);
  --workflow-modal-node-title-color: var(--text-primary);
  --workflow-modal-node-title-font-family: var(--type-heading-01-font-family);
  --workflow-modal-node-title-font-size: var(--type-heading-01-font-size);
  --workflow-modal-node-title-line-height: var(--type-heading-01-line-height);
  --workflow-modal-node-title-font-weight: var(--type-heading-01-font-weight);
  --workflow-modal-node-meta-font-family: var(--type-label-01-font-family);
  --workflow-modal-node-meta-font-size: var(--type-label-01-font-size);
  --workflow-modal-node-meta-line-height: var(--type-label-01-line-height);
  --workflow-modal-node-meta-font-weight: var(--type-label-01-font-weight);
  --workflow-modal-form-bg: var(--surface-elevated);
  --workflow-modal-form-border-color: var(--border-subtle-1);
  --workflow-modal-form-padding: var(--spacing-4);
  --workflow-modal-form-gap: var(--spacing-4);
  --workflow-modal-form-title-color: var(--text-primary);
  --workflow-modal-form-title-font-family: var(--type-heading-02-font-family);
  --workflow-modal-form-title-font-size: var(--type-heading-02-font-size);
  --workflow-modal-form-title-line-height: var(--type-heading-02-line-height);
  --workflow-modal-form-title-font-weight: var(--type-heading-02-font-weight);
  --workflow-modal-form-title-text-transform: lowercase;
  --workflow-modal-iterations-border-color: var(--border-subtle-1);
  --workflow-modal-iterations-border-width: var(--border-width-thin);
  --workflow-modal-iterations-padding-top: var(--spacing-3);
  --workflow-modal-shadow-focus: var(--shadow-focus-ring);
  --workflow-modal-transition-duration: var(--duration-fast);
  --workflow-modal-transition-easing: var(--easing-out);
  --workflow-modal-press-scale: var(--scale-press-subtle);

  display: flex;
  flex-direction: column;
  gap: var(--workflow-modal-gap);
}

.workflow-modal__slide-view {
  display: flex;
  flex-direction: column;
  gap: var(--workflow-modal-gap);
}

.workflow-modal__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: var(--workflow-modal-stage-height);
  padding: var(--spacing-6);
  gap: var(--spacing-4);
  box-sizing: border-box;
  background-color: var(--workflow-modal-summary-bg);
  border: var(--workflow-modal-summary-border-width) solid
    var(--workflow-modal-summary-border-color);
  text-align: center;
}

.workflow-modal__state-text {
  margin: var(--spacing-0);
  color: var(--workflow-modal-version-color);
  font-family: var(--type-body-01-font-family);
  font-size: var(--type-body-01-font-size);
  line-height: var(--type-body-01-line-height);
  font-weight: var(--type-body-01-font-weight);
}

.workflow-modal__state-actions {
  display: flex;
  justify-content: center;
}

.workflow-modal__carousel-stage {
  position: relative;
  width: 100%;
  height: var(--workflow-modal-stage-height);
  overflow: hidden;
  touch-action: pan-y;
  cursor: grab;
  outline: none;
  -webkit-mask-image: linear-gradient(
    to right,
    var(--workflow-modal-stage-mask-transparent) var(--spacing-0),
    var(--workflow-modal-stage-mask-opaque) var(--workflow-modal-stage-mask-size),
    var(--workflow-modal-stage-mask-opaque) calc(100% - var(--workflow-modal-stage-mask-size)),
    var(--workflow-modal-stage-mask-transparent) 100%
  );
  mask-image: linear-gradient(
    to right,
    var(--workflow-modal-stage-mask-transparent) var(--spacing-0),
    var(--workflow-modal-stage-mask-opaque) var(--workflow-modal-stage-mask-size),
    var(--workflow-modal-stage-mask-opaque) calc(100% - var(--workflow-modal-stage-mask-size)),
    var(--workflow-modal-stage-mask-transparent) 100%
  );
}

.workflow-modal__carousel-stage--dragging {
  cursor: grabbing;
}

.workflow-modal__carousel-stage:focus-visible {
  outline: none;
  box-shadow: var(--workflow-modal-shadow-focus);
}

.workflow-modal__slide-slot {
  position: absolute;
  top: calc((var(--workflow-modal-stage-height) - var(--workflow-modal-card-height)) / 2);
  left: 50%;
  width: var(--workflow-modal-card-width);
  height: var(--workflow-modal-card-height);
  transform-origin: center;
  transition:
    transform var(--workflow-modal-slide-duration) var(--workflow-modal-slide-easing),
    opacity var(--workflow-modal-slide-duration) var(--workflow-modal-slide-easing);
}

.workflow-modal__carousel-stage--dragging .workflow-modal__slide-slot--center {
  transition: opacity var(--workflow-modal-slide-duration) var(--workflow-modal-slide-easing);
}

.workflow-modal__slide-slot--center {
  z-index: 5;
  opacity: var(--opacity-visible);
  transform: translate3d(-50%, 0, 0) scale(1);
}

.workflow-modal__slide-slot--left {
  z-index: 4;
  opacity: 0.88;
  transform: translate3d(-106%, 0, 0) scale(0.84);
}

.workflow-modal__slide-slot--right {
  z-index: 4;
  opacity: 0.88;
  transform: translate3d(6%, 0, 0) scale(0.84);
}

.workflow-modal__slide-slot--far-left {
  z-index: 3;
  opacity: 0.62;
  transform: translate3d(-160%, 0, 0) scale(0.68);
}

.workflow-modal__slide-slot--far-right {
  z-index: 3;
  opacity: 0.62;
  transform: translate3d(60%, 0, 0) scale(0.68);
}

.workflow-modal__slide-slot--hidden {
  z-index: 1;
  opacity: var(--opacity-hidden);
  pointer-events: none;
  transform: translate3d(-50%, 0, 0) scale(0.56);
}

.workflow-modal__slide-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.workflow-modal__nav-btn-content {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3);
}

.workflow-modal__slide-indicators {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.workflow-modal__slide-dot {
  width: 8px;
  height: 8px;
  padding: var(--spacing-0);
  border: var(--border-width-none);
  background-color: var(--workflow-modal-dot-bg);
  cursor: pointer;
  transition: transform var(--workflow-modal-transition-duration)
    var(--workflow-modal-transition-easing);
}

.workflow-modal__slide-dot--active {
  background-color: var(--workflow-modal-dot-active-bg);
  transform: scale(1.25);
}

.workflow-modal__slide-dot:focus-visible {
  outline: none;
  box-shadow: var(--workflow-modal-shadow-focus);
}

.workflow-modal__slide-counter {
  margin-left: var(--spacing-2);
  color: var(--workflow-modal-counter-color);
  font-family: var(--type-label-01-font-family);
  font-size: var(--type-label-01-font-size);
  line-height: var(--type-label-01-line-height);
  font-weight: var(--type-label-01-font-weight);
}

.workflow-modal__config {
  display: flex;
  flex-direction: column;
  gap: var(--workflow-modal-gap);
}

.workflow-modal__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--workflow-modal-summary-gap);
  padding: var(--workflow-modal-summary-padding-y) var(--workflow-modal-summary-padding-x);
  background-color: var(--workflow-modal-summary-bg);
  border: var(--workflow-modal-summary-border-width) solid
    var(--workflow-modal-summary-border-color);
}

.workflow-modal__summary-meta {
  display: flex;
  align-items: baseline;
  gap: var(--workflow-modal-summary-gap);
}

.workflow-modal__summary-name {
  color: var(--workflow-modal-name-color);
  font-family: var(--workflow-modal-name-font-family);
  font-size: var(--workflow-modal-name-font-size);
  line-height: var(--workflow-modal-name-line-height);
  font-weight: var(--workflow-modal-name-font-weight);
  text-transform: var(--workflow-modal-name-text-transform);
}

.workflow-modal__summary-version {
  color: var(--workflow-modal-version-color);
  font-family: var(--workflow-modal-version-font-family);
  font-size: var(--workflow-modal-version-font-size);
  line-height: var(--workflow-modal-version-line-height);
  font-weight: var(--workflow-modal-version-font-weight);
}

.workflow-modal__graph {
  display: flex;
  align-items: stretch;
  gap: var(--workflow-modal-graph-gap);
  padding: var(--workflow-modal-graph-padding);
  background-color: var(--workflow-modal-graph-bg);
  border: var(--workflow-modal-summary-border-width) solid var(--workflow-modal-graph-border-color);
  overflow-x: auto;
}

.workflow-modal__graph-node {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 1 0;
  min-width: var(--spacing-12);
  padding: var(--workflow-modal-node-padding);
  gap: var(--workflow-modal-node-gap);
  box-sizing: border-box;
  text-align: left;
  background-color: var(--workflow-modal-node-bg);
  border: var(--workflow-modal-node-border-width) solid var(--workflow-modal-node-border-color);
  border-radius: var(--radius-none);
  cursor: pointer;
  transition: transform var(--workflow-modal-transition-duration)
    var(--workflow-modal-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .workflow-modal__graph-node:hover:not(.workflow-modal__graph-node--selected) {
    --workflow-modal-node-border-color: var(--border-subtle-hover);
  }
}

.workflow-modal__graph-node:active {
  transform: scale(var(--workflow-modal-press-scale));
}

.workflow-modal__graph-node:focus-visible {
  outline: none;
  box-shadow: var(--workflow-modal-shadow-focus);
}

.workflow-modal__graph-node--selected {
  --workflow-modal-node-bg: var(--surface-brand-subtle);
  --workflow-modal-node-border-color: var(--border-brand);
}

.workflow-modal__node-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--spacing-2);
  font-family: var(--workflow-modal-node-meta-font-family);
  font-size: var(--workflow-modal-node-meta-font-size);
  line-height: var(--workflow-modal-node-meta-line-height);
  font-weight: var(--workflow-modal-node-meta-font-weight);
}

.workflow-modal__node-id {
  color: var(--workflow-modal-node-id-color);
}

.workflow-modal__node-edge {
  color: var(--workflow-modal-node-edge-color);
}

.workflow-modal__node-title {
  color: var(--workflow-modal-node-title-color);
  font-family: var(--workflow-modal-node-title-font-family);
  font-size: var(--workflow-modal-node-title-font-size);
  line-height: var(--workflow-modal-node-title-line-height);
  font-weight: var(--workflow-modal-node-title-font-weight);
}

.workflow-modal__node-badge {
  display: inline-flex;
  margin-top: auto;
}

.workflow-modal__graph-connector {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.workflow-modal__node-form {
  display: flex;
  flex-direction: column;
  gap: var(--workflow-modal-form-gap);
  padding: var(--workflow-modal-form-padding);
  background-color: var(--workflow-modal-form-bg);
  border: var(--workflow-modal-summary-border-width) solid var(--workflow-modal-form-border-color);
}

.workflow-modal__node-form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-3);
}

.workflow-modal__node-form-tags {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.workflow-modal__node-form-title {
  margin: var(--spacing-0);
  color: var(--workflow-modal-form-title-color);
  font-family: var(--workflow-modal-form-title-font-family);
  font-size: var(--workflow-modal-form-title-font-size);
  line-height: var(--workflow-modal-form-title-line-height);
  font-weight: var(--workflow-modal-form-title-font-weight);
  text-transform: var(--workflow-modal-form-title-text-transform);
}

.workflow-modal__node-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--workflow-modal-grid-gap);
}

.workflow-modal__node-instruction {
  --text-area-min-height: 88px;
}

.workflow-modal__iterations {
  padding-top: var(--workflow-modal-iterations-padding-top);
  border-top: var(--workflow-modal-iterations-border-width) solid
    var(--workflow-modal-iterations-border-color);
}

@media (max-width: 767px) {
  .workflow-modal {
    --workflow-modal-stage-height: 316px;
    --workflow-modal-stage-mask-size: var(--spacing-5);
    --workflow-modal-card-width: min(296px, calc(100vw - var(--spacing-7)));
    --workflow-modal-card-height: 304px;
  }

  .workflow-modal__slide-slot--left,
  .workflow-modal__slide-slot--right,
  .workflow-modal__slide-slot--far-left,
  .workflow-modal__slide-slot--far-right {
    opacity: var(--opacity-hidden);
    pointer-events: none;
  }

  .workflow-modal__slide-controls {
    gap: var(--spacing-2);
  }

  .workflow-modal__node-fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .workflow-modal__graph {
    flex-direction: column;
    padding: var(--spacing-3);
    gap: var(--spacing-2);
  }

  .workflow-modal__graph-node {
    min-width: var(--spacing-0);
    width: 100%;
  }

  .workflow-modal__graph-connector {
    transform: rotate(90deg);
    align-self: center;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workflow-modal {
    --workflow-modal-press-scale: 1;
  }

  .workflow-modal__slide-slot,
  .workflow-modal__graph-node,
  .workflow-modal__slide-dot {
    transition: none;
  }
}
</style>
