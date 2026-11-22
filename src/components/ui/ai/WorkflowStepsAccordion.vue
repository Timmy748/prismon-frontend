<script setup lang="ts">
import { ref } from 'vue'
import { AppIcon } from '../icons'

export interface WorkflowStep {
  id: string
  title: string
}

interface Props {
  steps: WorkflowStep[]
  defaultOpenIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpenIds: () => [],
})

const emit = defineEmits<{
  toggle: [stepId: string, isOpen: boolean]
}>()

const openIds = ref<Set<string>>(new Set(props.defaultOpenIds))

function isStepOpen(stepId: string): boolean {
  return openIds.value.has(stepId)
}

function toggleStep(stepId: string) {
  const nextOpen = !openIds.value.has(stepId)
  const nextSet = new Set(openIds.value)
  if (nextOpen) {
    nextSet.add(stepId)
  } else {
    nextSet.delete(stepId)
  }
  openIds.value = nextSet
  emit('toggle', stepId, nextOpen)
}
</script>

<template>
  <div class="workflow-steps-accordion">
    <div
      v-for="(step, index) in steps"
      :key="step.id"
      :class="[
        'workflow-steps-accordion__item',
        isStepOpen(step.id) ? 'workflow-steps-accordion__item--open' : undefined,
      ]"
    >
      <button
        type="button"
        class="workflow-steps-accordion__trigger"
        :aria-expanded="isStepOpen(step.id)"
        @click="toggleStep(step.id)"
      >
        <span class="workflow-steps-accordion__title">{{ step.title }}</span>
        <span class="workflow-steps-accordion__icon">
          <AppIcon name="arrow-down" size="lg" />
        </span>
      </button>

      <div v-if="isStepOpen(step.id)" class="workflow-steps-accordion__content">
        <slot name="step" :step="step" :index="index" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.workflow-steps-accordion {
  --workflow-steps-accordion-gap: var(--spacing-5);
  --workflow-steps-accordion-content-gap: var(--spacing-4);
  --workflow-steps-accordion-trigger-gap: var(--spacing-3);
  --workflow-steps-accordion-trigger-padding: var(--spacing-0);
  --workflow-steps-accordion-trigger-bg: var(--surface-transparent);
  --workflow-steps-accordion-trigger-border-width: var(--border-width-none);
  --workflow-steps-accordion-trigger-border-color: var(--border-transparent);
  --workflow-steps-accordion-trigger-cursor: pointer;
  --workflow-steps-accordion-shadow-focus: var(--shadow-focus-ring);
  --workflow-steps-accordion-title-color: var(--text-primary);
  --workflow-steps-accordion-title-font-family: var(--type-heading-compact-01-font-family);
  --workflow-steps-accordion-title-font-size: var(--type-heading-compact-01-font-size);
  --workflow-steps-accordion-title-line-height: var(--type-heading-compact-01-line-height);
  --workflow-steps-accordion-title-font-weight: var(--type-heading-compact-01-font-weight);
  --workflow-steps-accordion-title-text-transform: var(--type-heading-compact-01-text-transform);
  --workflow-steps-accordion-icon-color: var(--icon-primary);
  --workflow-steps-accordion-icon-rotation: 0deg;
  --workflow-steps-accordion-transition-duration: var(--duration-fast);
  --workflow-steps-accordion-transition-easing: var(--easing-standard);

  display: flex;
  flex-direction: column;
  gap: var(--workflow-steps-accordion-gap);
}

.workflow-steps-accordion__item {
  display: flex;
  flex-direction: column;
  gap: var(--workflow-steps-accordion-content-gap);
}

.workflow-steps-accordion__item--open {
  --workflow-steps-accordion-icon-rotation: 180deg;
}

.workflow-steps-accordion__trigger {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: var(--workflow-steps-accordion-trigger-padding);
  gap: var(--workflow-steps-accordion-trigger-gap);
  background-color: var(--workflow-steps-accordion-trigger-bg);
  border: var(--workflow-steps-accordion-trigger-border-width) solid
    var(--workflow-steps-accordion-trigger-border-color);
  color: var(--workflow-steps-accordion-title-color);
  cursor: var(--workflow-steps-accordion-trigger-cursor);
}

.workflow-steps-accordion__trigger:focus-visible {
  outline: none;
  box-shadow: var(--workflow-steps-accordion-shadow-focus);
}

.workflow-steps-accordion__title {
  color: var(--workflow-steps-accordion-title-color);
  font-family: var(--workflow-steps-accordion-title-font-family);
  font-size: var(--workflow-steps-accordion-title-font-size);
  line-height: var(--workflow-steps-accordion-title-line-height);
  font-weight: var(--workflow-steps-accordion-title-font-weight);
  text-transform: var(--workflow-steps-accordion-title-text-transform);
}

.workflow-steps-accordion__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--workflow-steps-accordion-icon-color);
  transform: rotate(var(--workflow-steps-accordion-icon-rotation));
  transition: transform var(--workflow-steps-accordion-transition-duration)
    var(--workflow-steps-accordion-transition-easing);
}

.workflow-steps-accordion__content {
  display: flex;
  flex-direction: column;
  gap: var(--workflow-steps-accordion-content-gap);
}
</style>
