<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import heroRobotImg from '@/assets/images/2da21ad867bb41c5bb1b67c4a94cdda9ac4949e1.jpg'
import {
  Badge,
  Button,
  Icon,
  Modal,
  Select,
  Tag,
  TextArea,
  TextInput,
  WorkflowSlideCard,
  type SelectOption,
} from '@/components/ui'

export interface WorkflowPreset {
  id: string
  name: string
  version: string
  badge: string
  description: string
  defaultEffort: string
  imageUrl: string
}

export interface WorkflowGraphNodeConfig {
  nodeId: string
  label: string
  model: string
  effort: string
  nextNodeId: string
  instruction: string
}

export interface WorkflowConfigApplyPayload {
  workflowId: string
  workflowName: string
  version: string
  iterations: string
  summaryEffort: string
  stageOneEffort: string
  nodesConfig: Record<string, WorkflowGraphNodeConfig>
}

interface Props {
  open: boolean
  selectedWorkflowId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedWorkflowId: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  apply: [payload: WorkflowConfigApplyPayload]
}>()

function createWorkflowBackdropSvg(
  variant: 'strategy' | 'engineering' | 'knowledge' | 'compliance',
): string {
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

const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: 'wf-analise-critica',
    name: 'análise crítica',
    version: 'Versão: 2.4.0',
    badge: 'jurídico & compliance',
    description:
      'Avalia contratos, pareceres e cláusulas de risco com verificação cruzada em grafo de etapas e justificativa rastreável por documento.',
    defaultEffort: 'Médio',
    imageUrl: heroRobotImg,
  },
  {
    id: 'wf-sintese-executiva',
    name: 'síntese executiva',
    version: 'Versão: 2.1.0',
    badge: 'estratégia',
    description:
      'Condensa relatórios extensos em recomendações objetivas, pontos de decisão e próximos passos priorizados para liderança.',
    defaultEffort: 'Baixo',
    imageUrl: createWorkflowBackdropSvg('strategy'),
  },
  {
    id: 'wf-revisao-tecnica',
    name: 'revisão técnica',
    version: 'Versão: 3.0.0',
    badge: 'engenharia',
    description:
      'Inspeciona especificações, requisitos de arquitetura e lacunas entre documentação técnica e contratos de implementação.',
    defaultEffort: 'Alto',
    imageUrl: createWorkflowBackdropSvg('engineering'),
  },
  {
    id: 'wf-pesquisa-repertorio',
    name: 'pesquisa de repertório',
    version: 'Versão: 1.8.0',
    badge: 'conhecimento',
    description:
      'Cruza a solicitação com documentos indexados e assets visuais para fundamentar respostas com citações diretas.',
    defaultEffort: 'Médio',
    imageUrl: createWorkflowBackdropSvg('knowledge'),
  },
  {
    id: 'wf-auditoria-regulatoria',
    name: 'auditoria regulatória',
    version: 'Versão: 1.5.0',
    badge: 'compliance',
    description:
      'Confronta políticas internas, pareceres de risco e requisitos normativos com trilha de evidências auditável.',
    defaultEffort: 'Alto',
    imageUrl: createWorkflowBackdropSvg('compliance'),
  },
]

const NODE_IDS = ['n1', 'n2', 'n3'] as const
type NodeId = (typeof NODE_IDS)[number]

const MODEL_OPTIONS: SelectOption[] = [
  { label: 'Prismon Pro 2.5', value: 'Prismon Pro 2.5' },
  { label: 'Prismon Flash', value: 'Prismon Flash' },
  { label: 'Claude Sonnet', value: 'Claude Sonnet' },
  { label: 'GPT-5 Mini', value: 'GPT-5 Mini' },
]

const EFFORT_OPTIONS: SelectOption[] = [
  { label: 'Baixo', value: 'Baixo' },
  { label: 'Médio', value: 'Médio' },
  { label: 'Alto', value: 'Alto' },
]

const ITERATION_OPTIONS: SelectOption[] = [
  { label: '1 rodada', value: '1 rodada' },
  { label: '2 rodadas', value: '2 rodadas' },
  { label: '3 rodadas', value: '3 rodadas' },
]

function buildPresetNodes(workflowId: string | null): Record<NodeId, WorkflowGraphNodeConfig> {
  const preset = WORKFLOW_PRESETS.find((item) => item.id === workflowId)
  const defaultEffort = preset?.defaultEffort ?? 'Médio'

  if (workflowId === 'wf-revisao-tecnica') {
    return {
      n1: {
        nodeId: 'n1',
        label: 'Ingestão',
        model: 'Prismon Flash',
        effort: defaultEffort,
        nextNodeId: 'n2',
        instruction: 'Mapear requisitos arquiteturais, interfaces públicas e restrições técnicas.',
      },
      n2: {
        nodeId: 'n2',
        label: 'Análise Crítica',
        model: 'Prismon Pro 2.5',
        effort: defaultEffort,
        nextNodeId: 'n3',
        instruction: 'Detectar gargalos de concorrência, falhas de contrato e riscos de regressão.',
      },
      n3: {
        nodeId: 'n3',
        label: 'Síntese',
        model: 'Claude Sonnet',
        effort: defaultEffort,
        nextNodeId: 'output',
        instruction: 'Gerar plano de mitigação priorizado com critérios objetivos de validação.',
      },
    }
  }

  if (workflowId === 'wf-sintese-executiva') {
    return {
      n1: {
        nodeId: 'n1',
        label: 'Ingestão',
        model: 'Prismon Flash',
        effort: defaultEffort,
        nextNodeId: 'n2',
        instruction: 'Extrair métricas-chave, marcos operacionais e desvios do período.',
      },
      n2: {
        nodeId: 'n2',
        label: 'Análise Crítica',
        model: 'Prismon Pro 2.5',
        effort: defaultEffort,
        nextNodeId: 'n3',
        instruction: 'Priorizar impactos estratégicos e dependências entre áreas.',
      },
      n3: {
        nodeId: 'n3',
        label: 'Síntese',
        model: 'GPT-5 Mini',
        effort: defaultEffort,
        nextNodeId: 'output',
        instruction: 'Redigir sumário executivo conciso com próximos passos acionáveis.',
      },
    }
  }

  return {
    n1: {
      nodeId: 'n1',
      label: 'Ingestão',
      model: 'Prismon Flash',
      effort: defaultEffort,
      nextNodeId: 'n2',
      instruction: 'Extrair contexto, entidades relevantes e documentos anexados ao pedido.',
    },
    n2: {
      nodeId: 'n2',
      label: 'Análise Crítica',
      model: 'Prismon Pro 2.5',
      effort: defaultEffort,
      nextNodeId: 'n3',
      instruction: 'Cruzar evidências com o repertório institucional e apontar divergências.',
    },
    n3: {
      nodeId: 'n3',
      label: 'Síntese',
      model: 'Claude Sonnet',
      effort: defaultEffort,
      nextNodeId: 'output',
      instruction: 'Consolidar recomendações estruturadas com rastreabilidade clara.',
    },
  }
}

const DRAG_SWIPE_THRESHOLD_PX = 48
const DRAG_VELOCITY_THRESHOLD = 0.25

const step = ref<1 | 2>(1)
const activeSlideIndex = ref(0)
const draftWorkflowId = ref<string>(props.selectedWorkflowId ?? WORKFLOW_PRESETS[0]!.id)
const configuredForWorkflowId = ref<string | null>(null)
const activeNodeId = ref<NodeId>('n1')
const lastEditedNodeId = ref<NodeId>('n1')
const nodesMap = ref<Record<NodeId, WorkflowGraphNodeConfig>>(
  buildPresetNodes(props.selectedWorkflowId),
)
const iterations = ref('2 rodadas')

const isDragging = ref(false)
const dragOffsetX = ref(0)
let activePointerId: number | null = null
let dragStartX = 0
let dragStartTime = 0
let suppressSlideClick = false

const activeSlidePreset = computed(
  () => WORKFLOW_PRESETS[activeSlideIndex.value] ?? WORKFLOW_PRESETS[0]!,
)

const selectedWorkflow = computed(
  () =>
    WORKFLOW_PRESETS.find((item) => item.id === draftWorkflowId.value) ?? activeSlidePreset.value,
)

const orderedNodes = computed(() => NODE_IDS.map((id) => nodesMap.value[id]))

const activeNode = computed(() => nodesMap.value[activeNodeId.value])

const nextNodeOptions = computed<SelectOption[]>(() => {
  const currentIndex = NODE_IDS.indexOf(activeNodeId.value)
  const followingOptions: SelectOption[] = NODE_IDS.slice(currentIndex + 1).map((id) => ({
    label: `${id}: ${nodesMap.value[id].label}`,
    value: id,
  }))
  return [...followingOptions, { label: 'Saída final', value: 'output' }]
})

const activeEdgeSummaryTag = computed(() => {
  const incomingNode = orderedNodes.value.find((node) => node.nextNodeId === activeNodeId.value)
  const entryLabel = incomingNode ? incomingNode.nodeId : 'entrada'
  const exitLabel =
    activeNode.value.nextNodeId === 'output' ? 'saída final' : activeNode.value.nextNodeId
  return `${entryLabel} → ${exitLabel}`
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      step.value = 1
      isDragging.value = false
      dragOffsetX.value = 0
      activePointerId = null
      const matchedIdx = WORKFLOW_PRESETS.findIndex((item) => item.id === props.selectedWorkflowId)
      const resolvedIndex = matchedIdx >= 0 ? matchedIdx : 0
      activeSlideIndex.value = resolvedIndex
      draftWorkflowId.value = WORKFLOW_PRESETS[resolvedIndex]!.id
    }
  },
)

function getRelativeOffset(index: number): number {
  const total = WORKFLOW_PRESETS.length
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
  const total = WORKFLOW_PRESETS.length
  const normalized = ((index % total) + total) % total
  activeSlideIndex.value = normalized
  draftWorkflowId.value = WORKFLOW_PRESETS[normalized]!.id
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
  draftWorkflowId.value = WORKFLOW_PRESETS[index]!.id
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

function initializeNodesForWorkflow(workflowId: string | null) {
  nodesMap.value = buildPresetNodes(workflowId)
  configuredForWorkflowId.value = workflowId
  activeNodeId.value = 'n1'
  lastEditedNodeId.value = 'n1'
}

function selectNode(nodeId: NodeId) {
  activeNodeId.value = nodeId
}

function updateActiveNodeField<K extends keyof Omit<WorkflowGraphNodeConfig, 'nodeId'>>(
  field: K,
  value: WorkflowGraphNodeConfig[K],
) {
  const targetId = activeNodeId.value
  nodesMap.value = {
    ...nodesMap.value,
    [targetId]: {
      ...nodesMap.value[targetId],
      [field]: value,
    },
  }
  lastEditedNodeId.value = targetId
}

function formatEdgeTarget(nextNodeId: string): string {
  return nextNodeId === 'output' ? 'Saída' : `→ ${nextNodeId}`
}

function handleClose() {
  emit('update:open', false)
}

function selectCurrentSlideAndContinue() {
  draftWorkflowId.value = activeSlidePreset.value.id
  if (configuredForWorkflowId.value !== draftWorkflowId.value) {
    initializeNodesForWorkflow(draftWorkflowId.value)
  }
  step.value = 2
}

function handleApply() {
  const chosenWorkflow = selectedWorkflow.value
  const summaryEffort =
    nodesMap.value[lastEditedNodeId.value]?.effort ?? chosenWorkflow.defaultEffort

  const clonedNodes: Record<string, WorkflowGraphNodeConfig> = {}
  for (const id of NODE_IDS) {
    clonedNodes[id] = { ...nodesMap.value[id] }
  }

  emit('apply', {
    workflowId: chosenWorkflow.id,
    workflowName: chosenWorkflow.name,
    version: chosenWorkflow.version,
    iterations: iterations.value,
    summaryEffort,
    stageOneEffort: summaryEffort,
    nodesConfig: clonedNodes,
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
        ? 'Arraste ou navegue no slide para escolher qual workflow deseja configurar.'
        : 'Selecione os nós do grafo para configurar papel, modelo, aresta e instruções.'
    "
    @update:open="emit('update:open', $event)"
  >
    <div class="workflow-modal">
      <div v-if="step === 1" class="workflow-modal__slide-view">
        <div
          :class="[
            'workflow-modal__carousel-stage',
            isDragging ? 'workflow-modal__carousel-stage--dragging' : undefined,
          ]"
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
            v-for="(item, index) in WORKFLOW_PRESETS"
            :key="item.id"
            :class="['workflow-modal__slide-slot', getSlideSlotClass(index)]"
            :style="getSlideSlotStyle(index)"
          >
            <WorkflowSlideCard
              :name="item.name"
              :version="item.version"
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
          <Button variant="tertiary" size="sm" icon="arrow-left" @click="goPreviousSlide">
            Anterior
          </Button>

          <div class="workflow-modal__slide-indicators" aria-label="Indicadores do slide">
            <button
              v-for="(item, index) in WORKFLOW_PRESETS"
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
              {{ activeSlideIndex + 1 }} / {{ WORKFLOW_PRESETS.length }}
            </span>
          </div>

          <Button variant="tertiary" size="sm" @click="goNextSlide">
            <span>Próximo</span>
            <Icon name="arrow-right" size="sm" />
          </Button>
        </div>
      </div>

      <div v-else class="workflow-modal__config">
        <div v-if="selectedWorkflow" class="workflow-modal__summary">
          <div class="workflow-modal__summary-meta">
            <span class="workflow-modal__summary-name">{{ selectedWorkflow.name }}</span>
            <span class="workflow-modal__summary-version">{{ selectedWorkflow.version }}</span>
          </div>
          <Badge :label="selectedWorkflow.badge" />
        </div>

        <div class="workflow-modal__graph" role="group" aria-label="Grafo de etapas do workflow">
          <template v-for="(node, index) in orderedNodes" :key="node.nodeId">
            <button
              type="button"
              :class="[
                'workflow-modal__graph-node',
                activeNodeId === node.nodeId ? 'workflow-modal__graph-node--selected' : undefined,
              ]"
              :aria-pressed="activeNodeId === node.nodeId"
              @click="selectNode(node.nodeId as NodeId)"
            >
              <span class="workflow-modal__node-meta">
                <span class="workflow-modal__node-id">{{ node.nodeId }}</span>
                <span class="workflow-modal__node-edge">
                  {{ formatEdgeTarget(node.nextNodeId) }}
                </span>
              </span>
              <span class="workflow-modal__node-title">{{ node.label }}</span>
              <span class="workflow-modal__node-badge">
                <Badge :label="node.model" />
              </span>
            </button>

            <span
              v-if="index < orderedNodes.length - 1"
              class="workflow-modal__graph-connector"
              aria-hidden="true"
            >
              <Icon name="arrow-right" size="md" color="helper" />
            </span>
          </template>
        </div>

        <div class="workflow-modal__node-form">
          <div class="workflow-modal__node-form-header">
            <h3 class="workflow-modal__node-form-title">configurando nó: {{ activeNode.label }}</h3>
            <Tag :label="activeEdgeSummaryTag" />
          </div>

          <div class="workflow-modal__node-fields">
            <TextInput
              :model-value="activeNode.label"
              label="Rótulo / papel do nó"
              placeholder="Ex: Análise Crítica"
              @update:model-value="updateActiveNodeField('label', $event)"
            />
            <Select
              :model-value="activeNode.model"
              label="Modelo"
              :options="MODEL_OPTIONS"
              @update:model-value="updateActiveNodeField('model', $event)"
            />
            <Select
              :model-value="activeNode.effort"
              label="Esforço"
              :options="EFFORT_OPTIONS"
              @update:model-value="updateActiveNodeField('effort', $event)"
            />
            <Select
              :model-value="activeNode.nextNodeId"
              label="Próximo nó (aresta de saída)"
              :options="nextNodeOptions"
              @update:model-value="updateActiveNodeField('nextNodeId', $event)"
            />
          </div>

          <TextArea
            :model-value="activeNode.instruction"
            label="Instrução do nó"
            :rows="3"
            placeholder="Descreva a instrução deste nó no pipeline"
            class="workflow-modal__node-instruction"
            @update:model-value="updateActiveNodeField('instruction', $event)"
          />
        </div>

        <div class="workflow-modal__iterations">
          <Select
            v-model="iterations"
            label="Rodadas de iteração global"
            :options="ITERATION_OPTIONS"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <template v-if="step === 1">
        <Button variant="tertiary" @click="handleClose">Cancelar</Button>
        <Button variant="primary" @click="selectCurrentSlideAndContinue">Selecionar</Button>
      </template>
      <template v-else>
        <Button variant="tertiary" @click="step = 1">Voltar</Button>
        <Button variant="primary" @click="handleApply">Aplicar workflow</Button>
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
    --workflow-modal-stage-height: 360px;
    --workflow-modal-stage-mask-size: var(--spacing-6);
    --workflow-modal-card-width: min(300px, calc(100vw - var(--spacing-8)));
    --workflow-modal-card-height: 344px;
  }

  .workflow-modal__slide-slot--left,
  .workflow-modal__slide-slot--right,
  .workflow-modal__slide-slot--far-left,
  .workflow-modal__slide-slot--far-right {
    opacity: var(--opacity-hidden);
    pointer-events: none;
  }

  .workflow-modal__node-fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .workflow-modal__graph {
    flex-direction: column;
  }

  .workflow-modal__graph-connector {
    transform: rotate(90deg);
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
