<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Badge,
  Button,
  Modal,
  Select,
  WorkflowCard,
  WorkflowStepsAccordion,
  type SelectOption,
  type WorkflowStep,
} from '@/components/ui'

export interface WorkflowPreset {
  id: string
  name: string
  version: string
  badge: string
  description: string
}

export interface WorkflowConfigApplyPayload {
  workflowId: string
  workflowName: string
  version: string
  stageOneModel: string
  stageOneEffort: string
  stageTwoModel: string
  stageTwoEffort: string
  iterations: string
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
      'Avalia contratos, pareceres e cláusulas de risco com verificação cruzada em duas etapas.',
  },
  {
    id: 'wf-sintese-executiva',
    name: 'síntese executiva',
    version: 'v2.1',
    badge: 'estratégia',
    description:
      'Condensa relatórios extensos em recomendações objetivas e próximos passos priorizados.',
  },
  {
    id: 'wf-revisao-tecnica',
    name: 'revisão técnica',
    version: 'v3.0',
    badge: 'engenharia',
    description:
      'Inspeciona especificações, requisitos de arquitetura e lacunas entre documentação e código.',
  },
  {
    id: 'wf-pesquisa-repertorio',
    name: 'pesquisa de repertório',
    version: 'v1.8',
    badge: 'conhecimento',
    description:
      'Cruza a solicitação com documentos indexados para fundamentar respostas com rastreabilidade.',
  },
]

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

const STAGE_STEPS: WorkflowStep[] = [
  { id: 'stage-1', title: 'Etapa 1' },
  { id: 'stage-2', title: 'Etapa 2' },
]

const step = ref<1 | 2>(1)
const draftWorkflowId = ref<string | null>(props.selectedWorkflowId ?? null)
const stageOneModel = ref('Prismon Pro 2.5')
const stageOneEffort = ref('Médio')
const stageTwoModel = ref('Claude Sonnet')
const stageTwoEffort = ref('Alto')
const iterations = ref('2 rodadas')

const selectedWorkflow = computed(
  () => WORKFLOW_PRESETS.find((item) => item.id === draftWorkflowId.value) ?? null,
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      step.value = 1
      draftWorkflowId.value = props.selectedWorkflowId ?? null
    }
  },
)

function handleClose() {
  emit('update:open', false)
}

function goToConfigStep() {
  if (!draftWorkflowId.value) {
    return
  }
  step.value = 2
}

function handleApply() {
  if (!selectedWorkflow.value) {
    return
  }
  emit('apply', {
    workflowId: selectedWorkflow.value.id,
    workflowName: selectedWorkflow.value.name,
    version: selectedWorkflow.value.version,
    stageOneModel: stageOneModel.value,
    stageOneEffort: stageOneEffort.value,
    stageTwoModel: stageTwoModel.value,
    stageTwoEffort: stageTwoEffort.value,
    iterations: iterations.value,
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
        : 'Configure modelos, esforço e quantidade de rodadas de iteração.'
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

        <WorkflowStepsAccordion :steps="STAGE_STEPS" :default-open-ids="['stage-1', 'stage-2']">
          <template #step="{ step: stage }">
            <div v-if="stage.id === 'stage-1'" class="workflow-modal__stage-fields">
              <Select v-model="stageOneModel" label="Modelo" :options="MODEL_OPTIONS" />
              <Select v-model="stageOneEffort" label="Esforço" :options="EFFORT_OPTIONS" />
            </div>
            <div v-else class="workflow-modal__stage-fields">
              <Select v-model="stageTwoModel" label="Modelo" :options="MODEL_OPTIONS" />
              <Select v-model="stageTwoEffort" label="Esforço" :options="EFFORT_OPTIONS" />
            </div>
          </template>
        </WorkflowStepsAccordion>

        <div class="workflow-modal__iterations">
          <Select v-model="iterations" label="Rodadas de iteração" :options="ITERATION_OPTIONS" />
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
  --workflow-modal-gap: var(--spacing-3);
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
  --workflow-modal-iterations-border-color: var(--border-subtle-1);
  --workflow-modal-iterations-border-width: var(--border-width-thin);
  --workflow-modal-iterations-padding-top: var(--spacing-2);
  --workflow-modal-transition-duration: var(--duration-normal);
  --workflow-modal-transition-easing: var(--easing-out);

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

.workflow-modal__stage-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--workflow-modal-grid-gap);
}

.workflow-modal__iterations {
  padding-top: var(--workflow-modal-iterations-padding-top);
  border-top: var(--workflow-modal-iterations-border-width) solid
    var(--workflow-modal-iterations-border-color);
}

@media (max-width: 767px) {
  .workflow-modal__grid,
  .workflow-modal__stage-fields {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .workflow-modal {
    --workflow-modal-transition-duration: 0ms;
  }
}
</style>
