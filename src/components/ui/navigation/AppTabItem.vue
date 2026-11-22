<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  active?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  disabled: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const tabItemClasses = computed(() => [
  'app-tab-item',
  props.active ? 'app-tab-item--active' : undefined,
  props.disabled ? 'app-tab-item--disabled' : undefined,
])

function handleClick(event: MouseEvent) {
  if (props.disabled) {
    return
  }
  emit('click', event)
}
</script>

<template>
  <button
    type="button"
    role="tab"
    :class="tabItemClasses"
    :aria-selected="active"
    :disabled="disabled"
    @click="handleClick"
  >
    <span class="app-tab-item__label">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style scoped>
.app-tab-item {
  --app-tab-item-bg: var(--surface-transparent);
  --app-tab-item-bg-hover: var(--surface-subtle-hover);
  --app-tab-item-color: var(--text-secondary);
  --app-tab-item-border-color: var(--border-transparent);
  --app-tab-item-border-width: var(--border-width-thin);
  --app-tab-item-padding-y: var(--spacing-2);
  --app-tab-item-padding-x: var(--spacing-5);
  --app-tab-item-font-family: var(--type-body-compact-02-font-family);
  --app-tab-item-font-size: var(--type-body-compact-02-font-size);
  --app-tab-item-line-height: var(--type-body-compact-02-line-height);
  --app-tab-item-font-weight: var(--type-body-compact-02-font-weight);
  --app-tab-item-text-transform: var(--type-body-compact-02-text-transform);
  --app-tab-item-shadow-focus: var(--shadow-focus-ring);
  --app-tab-item-transition-duration: var(--duration-fast);
  --app-tab-item-transition-easing: var(--easing-standard);
  --app-tab-item-cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-tab-item-padding-y) var(--app-tab-item-padding-x);
  box-sizing: border-box;
  background-color: var(--app-tab-item-bg);
  color: var(--app-tab-item-color);
  border-width: 0;
  border-bottom-width: var(--app-tab-item-border-width);
  border-style: solid;
  border-color: var(--app-tab-item-border-color);
  font-family: var(--app-tab-item-font-family);
  font-size: var(--app-tab-item-font-size);
  line-height: var(--app-tab-item-line-height);
  font-weight: var(--app-tab-item-font-weight);
  text-transform: var(--app-tab-item-text-transform);
  white-space: nowrap;
  cursor: var(--app-tab-item-cursor);
  transition:
    background-color var(--app-tab-item-transition-duration) var(--app-tab-item-transition-easing),
    color var(--app-tab-item-transition-duration) var(--app-tab-item-transition-easing),
    border-color var(--app-tab-item-transition-duration) var(--app-tab-item-transition-easing);
}

.app-tab-item:hover:not(:disabled):not(.app-tab-item--disabled) {
  background-color: var(--app-tab-item-bg-hover);
}

.app-tab-item:focus-visible {
  outline: none;
  box-shadow: var(--app-tab-item-shadow-focus);
}

.app-tab-item__label {
  display: inline-flex;
  align-items: center;
}

.app-tab-item--active {
  --app-tab-item-bg: var(--surface-elevated);
  --app-tab-item-bg-hover: var(--surface-elevated);
  --app-tab-item-color: var(--text-primary);
  --app-tab-item-border-color: var(--border-brand);
}

.app-tab-item--disabled,
.app-tab-item:disabled {
  --app-tab-item-bg-hover: var(--surface-transparent);
  --app-tab-item-color: var(--text-disabled);
  --app-tab-item-cursor: not-allowed;
}
</style>
