<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, type IconName } from '../icons'

export interface BatchAction {
  id: string
  label: string
  icon?: IconName
}

interface Props {
  selectedCount: number
  actions?: BatchAction[]
  selectionLabel?: string
  cancelLabel?: string
  showCancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
  cancelLabel: 'cancelar',
  showCancel: true,
})

const emit = defineEmits<{
  action: [actionId: string]
  cancel: []
}>()

const resolvedSelectionLabel = computed(
  () => props.selectionLabel ?? `${props.selectedCount} itens selecionados`,
)
</script>

<template>
  <div class="app-batch-action-bar" role="region" aria-label="Ações em lote">
    <div class="app-batch-action-bar__count">
      <slot name="count" :selected-count="selectedCount">
        {{ resolvedSelectionLabel }}
      </slot>
    </div>

    <div class="app-batch-action-bar__actions">
      <slot name="actions">
        <button
          v-for="action in actions"
          :key="action.id"
          type="button"
          class="app-batch-action-bar__button"
          @click="emit('action', action.id)"
        >
          <span class="app-batch-action-bar__button-label">{{ action.label }}</span>
          <span v-if="action.icon" class="app-batch-action-bar__button-icon">
            <AppIcon :name="action.icon" size="sm" />
          </span>
        </button>
      </slot>

      <button
        v-if="showCancel"
        type="button"
        class="app-batch-action-bar__button app-batch-action-bar__button--cancel"
        @click="emit('cancel')"
      >
        <span class="app-batch-action-bar__button-label">{{ cancelLabel }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.app-batch-action-bar {
  --app-batch-action-bar-bg: var(--surface-inverse-subtle);
  --app-batch-action-bar-color: var(--text-on-inverse-subtle);
  --app-batch-action-bar-min-height: var(--size-control-lg);
  --app-batch-action-bar-count-padding: var(--spacing-3);
  --app-batch-action-bar-actions-gap: var(--spacing-0);
  --app-batch-action-bar-button-min-height: var(--size-control-lg);
  --app-batch-action-bar-button-padding: var(--spacing-4);
  --app-batch-action-bar-button-gap: var(--spacing-4);
  --app-batch-action-bar-button-bg: var(--surface-inverse-subtle);
  --app-batch-action-bar-button-bg-hover: var(--surface-inverse);
  --app-batch-action-bar-button-color: var(--text-on-inverse-subtle);
  --app-batch-action-bar-button-border-width: var(--border-width-none);
  --app-batch-action-bar-button-border-color: var(--border-transparent);
  --app-batch-action-bar-button-radius: var(--radius-none);
  --app-batch-action-bar-button-shadow-focus: var(--shadow-focus-ring);
  --app-batch-action-bar-font-family: var(--type-body-compact-02-font-family);
  --app-batch-action-bar-font-size: var(--type-body-compact-02-font-size);
  --app-batch-action-bar-line-height: var(--type-body-compact-02-line-height);
  --app-batch-action-bar-font-weight: var(--type-body-compact-02-font-weight);
  --app-batch-action-bar-text-transform: var(--type-body-compact-02-text-transform);
  --app-batch-action-bar-transition-duration: var(--duration-fast);
  --app-batch-action-bar-transition-easing: var(--easing-standard);
  --app-batch-action-bar-button-cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--app-batch-action-bar-min-height);
  box-sizing: border-box;
  background-color: var(--app-batch-action-bar-bg);
  color: var(--app-batch-action-bar-color);
}

.app-batch-action-bar__count {
  padding: var(--app-batch-action-bar-count-padding);
  font-family: var(--app-batch-action-bar-font-family);
  font-size: var(--app-batch-action-bar-font-size);
  line-height: var(--app-batch-action-bar-line-height);
  font-weight: var(--app-batch-action-bar-font-weight);
  text-transform: var(--app-batch-action-bar-text-transform);
}

.app-batch-action-bar__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--app-batch-action-bar-actions-gap);
}

.app-batch-action-bar__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-batch-action-bar-button-gap);
  min-height: var(--app-batch-action-bar-button-min-height);
  padding: var(--app-batch-action-bar-button-padding);
  box-sizing: border-box;
  background-color: var(--app-batch-action-bar-button-bg);
  color: var(--app-batch-action-bar-button-color);
  border: var(--app-batch-action-bar-button-border-width) solid
    var(--app-batch-action-bar-button-border-color);
  border-radius: var(--app-batch-action-bar-button-radius);
  font-family: var(--app-batch-action-bar-font-family);
  font-size: var(--app-batch-action-bar-font-size);
  line-height: var(--app-batch-action-bar-line-height);
  font-weight: var(--app-batch-action-bar-font-weight);
  text-transform: var(--app-batch-action-bar-text-transform);
  white-space: nowrap;
  cursor: var(--app-batch-action-bar-button-cursor);
  transition: background-color var(--app-batch-action-bar-transition-duration)
    var(--app-batch-action-bar-transition-easing);
}

.app-batch-action-bar__button:hover {
  --app-batch-action-bar-button-bg: var(--app-batch-action-bar-button-bg-hover);
}

.app-batch-action-bar__button:focus-visible {
  outline: none;
  box-shadow: var(--app-batch-action-bar-button-shadow-focus);
}

.app-batch-action-bar__button-label {
  display: inline-flex;
  align-items: center;
}

.app-batch-action-bar__button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
