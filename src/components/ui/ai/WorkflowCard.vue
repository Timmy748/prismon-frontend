<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  description: string
  version?: string
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
})

const emit = defineEmits<{
  select: []
}>()

const cardClasses = computed(() => [
  'workflow-card',
  props.selected ? 'workflow-card--selected' : undefined,
])
</script>

<template>
  <button type="button" :class="cardClasses" :aria-pressed="selected" @click="emit('select')">
    <span class="workflow-card__header">
      <span class="workflow-card__name">{{ name }}</span>
      <span v-if="version" class="workflow-card__version">{{ version }}</span>
    </span>
    <span v-if="$slots.badge" class="workflow-card__badge">
      <slot name="badge" />
    </span>
    <span class="workflow-card__description">{{ description }}</span>
  </button>
</template>

<style scoped>
.workflow-card {
  --workflow-card-max-width: var(--size-workflow-card-width);
  --workflow-card-padding-top: var(--spacing-5);
  --workflow-card-padding-right: var(--spacing-5);
  --workflow-card-padding-bottom: var(--spacing-7);
  --workflow-card-padding-left: var(--spacing-5);
  --workflow-card-gap: var(--spacing-4);
  --workflow-card-header-gap: var(--spacing-3);
  --workflow-card-bg: var(--surface-elevated);
  --workflow-card-border-width: var(--border-width-thin);
  --workflow-card-border-color: var(--border-subtle-1);
  --workflow-card-radius: var(--radius-none);
  --workflow-card-shadow-focus: var(--shadow-focus-ring);
  --workflow-card-cursor: pointer;
  --workflow-card-transition-duration: var(--duration-fast);
  --workflow-card-transition-easing: var(--easing-standard);
  --workflow-card-name-color: var(--text-primary);
  --workflow-card-name-font-family: var(--type-heading-02-font-family);
  --workflow-card-name-font-size: var(--type-heading-02-font-size);
  --workflow-card-name-line-height: var(--type-heading-02-line-height);
  --workflow-card-name-font-weight: var(--type-heading-02-font-weight);
  --workflow-card-name-text-transform: var(--type-heading-02-text-transform);
  --workflow-card-version-color: var(--text-tertiary);
  --workflow-card-version-font-family: var(--type-heading-02-font-family);
  --workflow-card-version-font-size: var(--type-heading-02-font-size);
  --workflow-card-version-line-height: var(--type-heading-02-line-height);
  --workflow-card-version-font-weight: var(--type-heading-02-font-weight);
  --workflow-card-version-text-transform: var(--type-heading-02-text-transform);
  --workflow-card-description-color: var(--text-tertiary);
  --workflow-card-description-font-family: var(--type-body-compact-02-font-family);
  --workflow-card-description-font-size: var(--type-body-compact-02-font-size);
  --workflow-card-description-line-height: var(--type-body-compact-02-line-height);
  --workflow-card-description-font-weight: var(--type-body-compact-02-font-weight);
  --workflow-card-description-text-transform: var(--type-body-compact-02-text-transform);

  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: var(--workflow-card-max-width);
  padding: var(--workflow-card-padding-top) var(--workflow-card-padding-right)
    var(--workflow-card-padding-bottom) var(--workflow-card-padding-left);
  gap: var(--workflow-card-gap);
  box-sizing: border-box;
  text-align: left;
  background-color: var(--workflow-card-bg);
  border: var(--workflow-card-border-width) solid var(--workflow-card-border-color);
  border-radius: var(--workflow-card-radius);
  cursor: var(--workflow-card-cursor);
  transition:
    border-color var(--workflow-card-transition-duration) var(--workflow-card-transition-easing),
    box-shadow var(--workflow-card-transition-duration) var(--workflow-card-transition-easing);
}

.workflow-card:hover:not(.workflow-card--selected) {
  --workflow-card-border-color: var(--border-subtle-hover);
}

.workflow-card:focus-visible {
  outline: none;
  box-shadow: var(--workflow-card-shadow-focus);
}

.workflow-card--selected {
  --workflow-card-border-width: var(--border-width-thick);
  --workflow-card-border-color: var(--border-brand-subtle);
}

.workflow-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--workflow-card-header-gap);
}

.workflow-card__name {
  color: var(--workflow-card-name-color);
  font-family: var(--workflow-card-name-font-family);
  font-size: var(--workflow-card-name-font-size);
  line-height: var(--workflow-card-name-line-height);
  font-weight: var(--workflow-card-name-font-weight);
  text-transform: var(--workflow-card-name-text-transform);
}

.workflow-card__version {
  color: var(--workflow-card-version-color);
  font-family: var(--workflow-card-version-font-family);
  font-size: var(--workflow-card-version-font-size);
  line-height: var(--workflow-card-version-line-height);
  font-weight: var(--workflow-card-version-font-weight);
  text-transform: var(--workflow-card-version-text-transform);
  flex-shrink: 0;
}

.workflow-card__badge {
  display: inline-flex;
  align-items: center;
}

.workflow-card__description {
  color: var(--workflow-card-description-color);
  font-family: var(--workflow-card-description-font-family);
  font-size: var(--workflow-card-description-font-size);
  line-height: var(--workflow-card-description-line-height);
  font-weight: var(--workflow-card-description-font-weight);
  text-transform: var(--workflow-card-description-text-transform);
}
</style>
