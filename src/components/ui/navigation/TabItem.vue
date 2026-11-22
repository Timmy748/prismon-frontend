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

const tabItemClasses = computed(() => [
  'tab-item',
  props.active ? 'tab-item--active' : undefined,
  props.disabled ? 'tab-item--disabled' : undefined,
])
</script>

<template>
  <button
    type="button"
    role="tab"
    :class="tabItemClasses"
    :aria-selected="active"
    :disabled="disabled"
  >
    <span class="tab-item__label">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<style scoped>
.tab-item {
  --tab-item-bg: var(--surface-transparent);
  --tab-item-bg-hover: var(--surface-subtle-hover);
  --tab-item-color: var(--text-secondary);
  --tab-item-border-color: var(--border-transparent);
  --tab-item-border-width: var(--border-width-thin);
  --tab-item-padding-y: var(--spacing-2);
  --tab-item-padding-x: var(--spacing-5);
  --tab-item-font-family: var(--type-body-compact-02-font-family);
  --tab-item-font-size: var(--type-body-compact-02-font-size);
  --tab-item-line-height: var(--type-body-compact-02-line-height);
  --tab-item-font-weight: var(--type-body-compact-02-font-weight);
  --tab-item-text-transform: var(--type-body-compact-02-text-transform);
  --tab-item-shadow-focus: var(--shadow-focus-ring);
  --tab-item-transition-duration: var(--duration-fast);
  --tab-item-transition-easing: var(--easing-out);
  --tab-item-hover-transition-easing: var(--easing-hover);
  --tab-item-press-scale: var(--scale-press-subtle);
  --tab-item-cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--tab-item-padding-y) var(--tab-item-padding-x);
  box-sizing: border-box;
  background-color: var(--tab-item-bg);
  color: var(--tab-item-color);
  border-width: 0;
  border-bottom-width: var(--tab-item-border-width);
  border-style: solid;
  border-color: var(--tab-item-border-color);
  font-family: var(--tab-item-font-family);
  font-size: var(--tab-item-font-size);
  line-height: var(--tab-item-line-height);
  font-weight: var(--tab-item-font-weight);
  text-transform: var(--tab-item-text-transform);
  white-space: nowrap;
  cursor: var(--tab-item-cursor);
  transition:
    background-color var(--tab-item-transition-duration) var(--tab-item-hover-transition-easing),
    color var(--tab-item-transition-duration) var(--tab-item-hover-transition-easing),
    border-color var(--tab-item-transition-duration) var(--tab-item-hover-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .tab-item:hover:not(:disabled):not(.tab-item--disabled) {
    background-color: var(--tab-item-bg-hover);
  }
}

.tab-item:focus-visible {
  outline: none;
  box-shadow: var(--tab-item-shadow-focus);
}

.tab-item__label {
  display: inline-flex;
  align-items: center;
  transition: transform var(--tab-item-transition-duration) var(--tab-item-transition-easing);
}

.tab-item:active:not(:disabled):not(.tab-item--disabled) .tab-item__label {
  transform: scale(var(--tab-item-press-scale));
}

@media (prefers-reduced-motion: reduce) {
  .tab-item {
    --tab-item-press-scale: 1;
  }
}

.tab-item--active {
  --tab-item-bg: var(--surface-elevated);
  --tab-item-bg-hover: var(--surface-elevated);
  --tab-item-color: var(--text-primary);
  --tab-item-border-color: var(--border-brand);
}

.tab-item--disabled,
.tab-item:disabled {
  --tab-item-bg-hover: var(--surface-transparent);
  --tab-item-color: var(--text-disabled);
  --tab-item-cursor: not-allowed;
}
</style>
