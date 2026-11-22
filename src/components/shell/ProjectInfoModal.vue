<script setup lang="ts">
import { Badge, Button, Icon, Modal, Tag } from '@/components/ui'
import type { ProjectDetailsItem } from '@/stores/workspaceState'

interface Props {
  open: boolean
  project: ProjectDetailsItem | null
  isActiveProject?: boolean
}

withDefaults(defineProps<Props>(), {
  isActiveProject: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [project: ProjectDetailsItem]
}>()

function handleClose() {
  emit('update:open', false)
}

function handleSwitchProject(project: ProjectDetailsItem) {
  emit('select', project)
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    size="lg"
    title="informações do projeto"
    :subtitle="project ? `${project.name} • ID ${project.id}` : undefined"
    @update:open="emit('update:open', $event)"
  >
    <div v-if="project" class="project-info">
      <div class="project-info__top">
        <div class="project-info__identity">
          <div class="project-info__icon-box" aria-hidden="true">
            <Icon :name="project.icon" size="lg" color="brand" />
          </div>
          <div class="project-info__titles">
            <h3 class="project-info__name">{{ project.name }}</h3>
            <code class="project-info__slug">{{ project.id }}</code>
          </div>
        </div>
        <div class="project-info__badges">
          <Badge :label="project.role" />
          <Tag v-if="isActiveProject" label="ativo" />
        </div>
      </div>

      <p class="project-info__description">{{ project.description }}</p>

      <dl class="project-info__stats">
        <div class="project-info__stat">
          <dt class="project-info__stat-label">responsável</dt>
          <dd class="project-info__stat-value">{{ project.owner }}</dd>
        </div>
        <div class="project-info__stat">
          <dt class="project-info__stat-label">criado em</dt>
          <dd class="project-info__stat-value">{{ project.createdAt }}</dd>
        </div>
        <div class="project-info__stat">
          <dt class="project-info__stat-label">membros</dt>
          <dd class="project-info__stat-value">{{ project.membersCount }}</dd>
        </div>
        <div class="project-info__stat">
          <dt class="project-info__stat-label">repertório & workflows</dt>
          <dd class="project-info__stat-value">
            {{ project.documentsCount }} docs • {{ project.workflowsCount }} workflows
          </dd>
        </div>
      </dl>
    </div>

    <template #footer>
      <Button
        v-if="project && !isActiveProject"
        variant="secondary"
        @click="handleSwitchProject(project)"
      >
        Selecionar projeto
      </Button>
      <Button variant="primary" @click="handleClose">Fechar</Button>
    </template>
  </Modal>
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
  --project-info-desc-color: var(--text-secondary);
  --project-info-desc-font-family: var(--type-body-01-font-family);
  --project-info-desc-font-size: var(--type-body-01-font-size);
  --project-info-desc-line-height: var(--type-body-01-line-height);
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
  font-family: monospace;
  font-size: var(--project-info-label-font-size);
}

.project-info__badges {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.project-info__description {
  margin: var(--spacing-0);
  color: var(--project-info-desc-color);
  font-family: var(--project-info-desc-font-family);
  font-size: var(--project-info-desc-font-size);
  line-height: var(--project-info-desc-line-height);
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

@media (max-width: 767px) {
  .project-info__stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
