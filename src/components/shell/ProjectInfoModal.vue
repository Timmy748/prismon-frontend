<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button, ConfirmDialog, Icon, IconButton, Modal, Tag, TextInput } from '@/components/ui'
import type { ProjectDetailsItem } from '@/stores/workspaceState'

interface Props {
  open: boolean
  project: ProjectDetailsItem | null
  isActiveProject?: boolean
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActiveProject: true,
  submitting: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [project: ProjectDetailsItem]
  rename: [projectId: number, name: string]
  delete: [projectId: number]
}>()

const isEditingName = ref(false)
const renameInput = ref('')
const renameError = ref('')
const isDeleteConfirmOpen = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      isEditingName.value = false
      renameInput.value = ''
      renameError.value = ''
      isDeleteConfirmOpen.value = false
    } else if (props.project) {
      renameInput.value = props.project.name
    }
  },
)

watch(
  () => [props.submitting, props.project?.name] as const,
  ([submitting], [wasSubmitting]) => {
    if (wasSubmitting && !submitting) {
      isEditingName.value = false
    }
  },
)

function handleModalOpenChange(nextOpen: boolean) {
  if (props.submitting) {
    return
  }
  emit('update:open', nextOpen)
}

function handleClose() {
  if (props.submitting) {
    return
  }
  emit('update:open', false)
}

function handleSwitchProject(project: ProjectDetailsItem) {
  if (props.submitting) {
    return
  }
  emit('select', project)
  emit('update:open', false)
}

function startEditingName() {
  if (!props.project || props.submitting) {
    return
  }
  renameInput.value = props.project.name
  renameError.value = ''
  isEditingName.value = true
}

function cancelEditingName() {
  if (props.submitting) {
    return
  }
  isEditingName.value = false
  renameError.value = ''
  renameInput.value = props.project?.name ?? ''
}

function handleSaveRename() {
  if (!props.project || props.submitting) {
    return
  }
  const cleanName = renameInput.value.trim()
  if (!cleanName) {
    renameError.value = 'Informe o nome do projeto.'
    return
  }
  if (cleanName === props.project.name) {
    isEditingName.value = false
    return
  }
  emit('rename', props.project.id, cleanName)
}

function handleConfirmDelete() {
  if (!props.project || props.submitting) {
    return
  }
  isDeleteConfirmOpen.value = false
  emit('delete', props.project.id)
}
</script>

<template>
  <Modal
    :open="open"
    size="md"
    title="informações do projeto"
    :subtitle="project ? `${project.name} • ID #${project.id}` : undefined"
    @update:open="handleModalOpenChange"
  >
    <div v-if="project" class="project-info">
      <div class="project-info__top">
        <div class="project-info__identity">
          <div class="project-info__icon-box" aria-hidden="true">
            <Icon :name="project.icon" size="lg" color="brand" />
          </div>
          <div v-if="!isEditingName" class="project-info__titles">
            <div class="project-info__name-row">
              <h3 class="project-info__name">{{ project.name }}</h3>
              <IconButton
                variant="ghost"
                size="sm"
                icon="edit"
                ariaLabel="Renomear projeto"
                :disabled="submitting"
                @click="startEditingName"
              />
            </div>
            <code class="project-info__slug">ID #{{ project.id }}</code>
          </div>
          <form
            v-else
            class="project-info__rename-form"
            novalidate
            @submit.prevent="handleSaveRename"
          >
            <TextInput
              v-model="renameInput"
              label="Nome do projeto"
              name="project-rename"
              placeholder="Novo nome do projeto"
              :disabled="submitting"
              :error="renameError"
              @update:model-value="renameError = ''"
            />
            <div class="project-info__rename-actions">
              <Button type="submit" variant="primary" size="sm" :disabled="submitting">
                {{ submitting ? 'Salvando...' : 'Salvar' }}
              </Button>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                :disabled="submitting"
                @click="cancelEditingName"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
        <div class="project-info__badges">
          <Tag v-if="isActiveProject" label="ativo" />
        </div>
      </div>

      <dl class="project-info__stats">
        <div class="project-info__stat">
          <dt class="project-info__stat-label">identificador</dt>
          <dd class="project-info__stat-value">ID #{{ project.id }}</dd>
        </div>
        <div class="project-info__stat">
          <dt class="project-info__stat-label">proprietário</dt>
          <dd class="project-info__stat-value">Proprietário ID #{{ project.ownerId }}</dd>
        </div>
        <div class="project-info__stat project-info__stat--wide">
          <dt class="project-info__stat-label">criação</dt>
          <dd class="project-info__stat-value">Criado em {{ project.createdAtLabel }}</dd>
        </div>
      </dl>
    </div>

    <template #footer>
      <div class="project-info__footer">
        <Button
          v-if="project"
          variant="danger"
          icon="delete"
          :disabled="submitting"
          @click="isDeleteConfirmOpen = true"
        >
          Excluir projeto
        </Button>
        <div class="project-info__footer-actions">
          <Button
            v-if="project && !isActiveProject"
            variant="secondary"
            :disabled="submitting"
            @click="handleSwitchProject(project)"
          >
            Selecionar projeto
          </Button>
          <Button variant="primary" :disabled="submitting" @click="handleClose">Fechar</Button>
        </div>
      </div>
    </template>
  </Modal>

  <ConfirmDialog
    v-model:open="isDeleteConfirmOpen"
    title="excluir projeto"
    :description="
      project
        ? `Tem certeza que deseja excluir o projeto &quot;${project.name}&quot;? Esta ação não pode ser desfeita.`
        : 'Tem certeza que deseja excluir este projeto?'
    "
    confirm-label="Excluir projeto"
    confirm-variant="danger"
    @confirm="handleConfirmDelete"
  />
</template>

<style scoped>
.project-info {
  --project-info-gap: var(--spacing-5);
  --project-info-card-bg: var(--surface-base);
  --project-info-border-color: var(--border-subtle-1);
  --project-info-border-width: var(--border-width-thin);
  --project-info-padding: var(--spacing-4);
  --project-info-name-color: var(--text-primary);
  --project-info-name-font-family: var(--type-heading-02-font-family);
  --project-info-name-font-size: var(--type-heading-02-font-size);
  --project-info-name-line-height: var(--type-heading-02-line-height);
  --project-info-name-font-weight: var(--type-heading-02-font-weight);
  --project-info-label-color: var(--text-helper);
  --project-info-label-font-family: var(--type-label-01-font-family);
  --project-info-label-font-size: var(--type-label-01-font-size);
  --project-info-label-line-height: var(--type-label-01-line-height);
  --project-info-label-font-weight: var(--type-label-01-font-weight);
  --project-info-value-color: var(--text-primary);
  --project-info-value-font-family: var(--type-body-compact-02-font-family);
  --project-info-value-font-size: var(--type-body-compact-02-font-size);
  --project-info-value-line-height: var(--type-body-compact-02-line-height);
  --project-info-value-font-weight: var(--type-heading-01-font-weight);

  display: flex;
  flex-direction: column;
  gap: var(--project-info-gap);
}

.project-info__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-4);
  padding: var(--project-info-padding);
  background-color: var(--project-info-card-bg);
  border: var(--project-info-border-width) solid var(--project-info-border-color);
}

.project-info__identity {
  display: flex;
  align-items: center;
  flex: 1 1 0;
  gap: var(--spacing-3);
  min-width: var(--spacing-0);
}

.project-info__icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background-color: var(--surface-brand-subtle);
  border: var(--project-info-border-width) solid var(--border-brand-subtle);
  flex-shrink: 0;
}

.project-info__titles {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: var(--spacing-0);
}

.project-info__name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.project-info__name {
  margin: var(--spacing-0);
  color: var(--project-info-name-color);
  font-family: var(--project-info-name-font-family);
  font-size: var(--project-info-name-font-size);
  line-height: var(--project-info-name-line-height);
  font-weight: var(--project-info-name-font-weight);
}

.project-info__slug {
  color: var(--project-info-label-color);
  font-family: var(--type-code-01-font-family, monospace);
  font-size: var(--project-info-label-font-size);
}

.project-info__rename-form {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  gap: var(--spacing-2);
  min-width: var(--spacing-0);
}

.project-info__rename-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.project-info__badges {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.project-info__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-3);
  margin: var(--spacing-0);
}

.project-info__stat {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  background-color: var(--project-info-card-bg);
  border: var(--project-info-border-width) solid var(--project-info-border-color);
}

.project-info__stat--wide {
  grid-column: 1 / -1;
}

.project-info__stat-label {
  color: var(--project-info-label-color);
  font-family: var(--project-info-label-font-family);
  font-size: var(--project-info-label-font-size);
  line-height: var(--project-info-label-line-height);
  font-weight: var(--project-info-label-font-weight);
  text-transform: uppercase;
}

.project-info__stat-value {
  margin: var(--spacing-0);
  color: var(--project-info-value-color);
  font-family: var(--project-info-value-font-family);
  font-size: var(--project-info-value-font-size);
  line-height: var(--project-info-value-line-height);
  font-weight: var(--project-info-value-font-weight);
}

.project-info__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  width: 100%;
  gap: var(--spacing-3);
}

.project-info__footer-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-left: auto;
}

@media (max-width: 767px) {
  .project-info__stats {
    grid-template-columns: minmax(0, 1fr);
  }

  .project-info__footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .project-info__footer-actions {
    flex-direction: column-reverse;
    align-items: stretch;
    margin-left: var(--spacing-0);
  }
}
</style>
