<script setup lang="ts">
import { computed } from 'vue'
import { Icon, type IconName } from '../icons'

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
  <div class="batch-action-bar" role="region" aria-label="Ações em lote">
    <div class="batch-action-bar__count">
      <slot name="count" :selected-count="selectedCount">
        {{ resolvedSelectionLabel }}
      </slot>
    </div>

    <div class="batch-action-bar__actions">
      <slot name="actions">
        <button
          v-for="action in actions"
          :key="action.id"
          type="button"
          class="batch-action-bar__button"
          @click="emit('action', action.id)"
        >
          <span class="batch-action-bar__button-label">{{ action.label }}</span>
          <span v-if="action.icon" class="batch-action-bar__button-icon">
            <Icon :name="action.icon" size="sm" />
          </span>
        </button>
      </slot>

      <button
        v-if="showCancel"
        type="button"
        class="batch-action-bar__button batch-action-bar__button--cancel"
        @click="emit('cancel')"
      >
        <span class="batch-action-bar__button-label">{{ cancelLabel }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.batch-action-bar {
  --batch-action-bar-bg: var(--surface-inverse-subtle);
  --batch-action-bar-color: var(--text-on-inverse-subtle);
  --batch-action-bar-min-height: var(--size-control-lg);
  --batch-action-bar-count-padding: var(--spacing-3);
  --batch-action-bar-actions-gap: var(--spacing-0);
  --batch-action-bar-button-min-height: var(--size-control-lg);
  --batch-action-bar-button-padding: var(--spacing-4);
  --batch-action-bar-button-gap: var(--spacing-4);
  --batch-action-bar-button-bg: var(--surface-inverse-subtle);
  --batch-action-bar-button-bg-hover: var(--surface-inverse);
  --batch-action-bar-button-color: var(--text-on-inverse-subtle);
  --batch-action-bar-button-border-width: var(--border-width-none);
  --batch-action-bar-button-border-color: var(--border-transparent);
  --batch-action-bar-button-radius: var(--radius-none);
  --batch-action-bar-button-shadow-focus: var(--shadow-focus-ring);
  --batch-action-bar-font-family: var(--type-body-compact-02-font-family);
  --batch-action-bar-font-size: var(--type-body-compact-02-font-size);
  --batch-action-bar-line-height: var(--type-body-compact-02-line-height);
  --batch-action-bar-font-weight: var(--type-body-compact-02-font-weight);
  --batch-action-bar-text-transform: var(--type-body-compact-02-text-transform);
  --batch-action-bar-transition-duration: var(--duration-fast);
  --batch-action-bar-transition-easing: var(--easing-standard);
  --batch-action-bar-button-cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: var(--batch-action-bar-min-height);
  box-sizing: border-box;
  background-color: var(--batch-action-bar-bg);
  color: var(--batch-action-bar-color);
}

.batch-action-bar__count {
  padding: var(--batch-action-bar-count-padding);
  font-family: var(--batch-action-bar-font-family);
  font-size: var(--batch-action-bar-font-size);
  line-height: var(--batch-action-bar-line-height);
  font-weight: var(--batch-action-bar-font-weight);
  text-transform: var(--batch-action-bar-text-transform);
}

.batch-action-bar__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--batch-action-bar-actions-gap);
}

.batch-action-bar__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--batch-action-bar-button-gap);
  min-height: var(--batch-action-bar-button-min-height);
  padding: var(--batch-action-bar-button-padding);
  box-sizing: border-box;
  background-color: var(--batch-action-bar-button-bg);
  color: var(--batch-action-bar-button-color);
  border: var(--batch-action-bar-button-border-width) solid
    var(--batch-action-bar-button-border-color);
  border-radius: var(--batch-action-bar-button-radius);
  font-family: var(--batch-action-bar-font-family);
  font-size: var(--batch-action-bar-font-size);
  line-height: var(--batch-action-bar-line-height);
  font-weight: var(--batch-action-bar-font-weight);
  text-transform: var(--batch-action-bar-text-transform);
  white-space: nowrap;
  cursor: var(--batch-action-bar-button-cursor);
  transition: background-color var(--batch-action-bar-transition-duration)
    var(--batch-action-bar-transition-easing);
}

.batch-action-bar__button:hover {
  --batch-action-bar-button-bg: var(--batch-action-bar-button-bg-hover);
}

.batch-action-bar__button:focus-visible {
  outline: none;
  box-shadow: var(--batch-action-bar-button-shadow-focus);
}

.batch-action-bar__button-label {
  display: inline-flex;
  align-items: center;
}

.batch-action-bar__button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
