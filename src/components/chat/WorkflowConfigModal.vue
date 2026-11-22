<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Badge,
  Button,
  Icon,
  Modal,
  Select,
  Tag,
  TextArea,
  TextInput,
  WorkflowCard,
  type SelectOption,
} from '@/components/ui'

export interface WorkflowPreset {
  id: string
  name: string
  version: string
  badge: string
  description: string
  defaultEffort: string
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

const WORKFLOW_PRESETS: WorkflowPreset[] = [
  {
    id: 'wf-analise-critica',
    name: 'análise crítica',
    version: 'v2.4',
    badge: 'jurídico & compliance',
    description:
      'Avalia contratos, pareceres e cláusulas de risco com verificação cruzada em grafo de etapas.',
    defaultEffort: 'Médio',
  },
  {
    id: 'wf-sintese-executiva',
    name: 'síntese executiva',
    version: 'v2.1',
    badge: 'estratégia',
    description:
      'Condensa relatórios extensos em recomendações objetivas e próximos passos priorizados.',
    defaultEffort: 'Baixo',
  },
  {
    id: 'wf-revisao-tecnica',
    name: 'revisão técnica',
    version: 'v3.0',
    badge: 'engenharia',
    description:
      'Inspeciona especificações, requisitos de arquitetura e lacunas entre documentação e código.',
    defaultEffort: 'Alto',
  },
  {
    id: 'wf-pesquisa-repertorio',
    name: 'pesquisa de repertório',
    version: 'v1.8',
    badge: 'conhecimento',
    description:
      'Cruza a solicitação com documentos indexados para fundamentar respostas com rastreabilidade.',
    defaultEffort: 'Médio',
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

const step = ref<1 | 2>(1)
const draftWorkflowId = ref<string | null>(props.selectedWorkflowId ?? null)
const configuredForWorkflowId = ref<string | null>(null)
const activeNodeId = ref<NodeId>('n1')
const lastEditedNodeId = ref<NodeId>('n1')
const nodesMap = ref<Record<NodeId, WorkflowGraphNodeConfig>>(
  buildPresetNodes(props.selectedWorkflowId),
)
const iterations = ref('2 rodadas')

const selectedWorkflow = computed(
  () => WORKFLOW_PRESETS.find((item) => item.id === draftWorkflowId.value) ?? null,
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
      draftWorkflowId.value = props.selectedWorkflowId ?? null
    }
  },
)

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

function goToConfigStep() {
  if (!draftWorkflowId.value) {
    return
  }
  if (configuredForWorkflowId.value !== draftWorkflowId.value) {
    initializeNodesForWorkflow(draftWorkflowId.value)
  }
  step.value = 2
}

function handleApply() {
  if (!selectedWorkflow.value) {
    return
  }
  const summaryEffort =
    nodesMap.value[lastEditedNodeId.value]?.effort ?? selectedWorkflow.value.defaultEffort

  const clonedNodes: Record<string, WorkflowGraphNodeConfig> = {}
  for (const id of NODE_IDS) {
    clonedNodes[id] = { ...nodesMap.value[id] }
  }

  emit('apply', {
    workflowId: selectedWorkflow.value.id,
    workflowName: selectedWorkflow.value.name,
    version: selectedWorkflow.value.version,
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
        ? 'Escolha qual workflow deseja usar.'
        : 'Selecione os nós do grafo para configurar papel, modelo, aresta e instruções.'
    "
    @update:open="emit('update:open', $event)"
  >
    <div class="workflow-modal">
      <div v-if="step === 1" class="workflow-modal__grid">
        <WorkflowCard
          v-for="item in WORKFLOW_PRESETS"
          :key="item.id"
          :name="item.name"
          :version="item.version"
          :description="item.description"
          :selected="draftWorkflowId === item.id"
          @select="draftWorkflowId = item.id"
        >
          <template #badge>
            <Badge :label="item.badge" />
          </template>
        </WorkflowCard>
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
        <Button variant="primary" :disabled="!draftWorkflowId" @click="goToConfigStep">
          Próximo
        </Button>
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

.workflow-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--workflow-modal-grid-gap);
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
  .workflow-modal__grid,
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

  .workflow-modal__graph-node {
    transition: none;
  }
}
</style>
