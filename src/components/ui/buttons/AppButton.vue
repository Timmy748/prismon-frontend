<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, type IconName } from '../icons'

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  icon?: IconName
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  fullWidth: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => [
  'app-button',
  `app-button--${props.variant}`,
  `app-button--${props.size}`,
  props.disabled ? 'app-button--disabled' : undefined,
  props.fullWidth ? 'app-button--full-width' : undefined,
])

function handleClick(event: MouseEvent) {
  if (props.disabled) {
    return
  }
  emit('click', event)
}
</script>

<template>
  <button :type="type" :class="buttonClasses" :disabled="disabled" @click="handleClick">
    <span v-if="$slots.default" class="app-button__label">
      <slot />
    </span>
    <span v-if="$slots.icon || icon" class="app-button__icon">
      <slot name="icon">
        <AppIcon v-if="icon" :name="icon" size="sm" />
      </slot>
    </span>
  </button>
</template>

<style scoped>
.app-button {
  --app-button-bg: var(--interactive-brand);
  --app-button-bg-hover: var(--interactive-brand-hover);
  --app-button-bg-active: var(--interactive-brand-active);
  --app-button-color: var(--text-on-brand);
  --app-button-border-color: var(--border-transparent);
  --app-button-border-width: var(--border-width-thin);
  --app-button-shadow: var(--shadow-button-primary);
  --app-button-shadow-hover: var(--shadow-button-primary-hover);
  --app-button-shadow-active: var(--shadow-button-primary-active);
  --app-button-shadow-focus: var(--shadow-focus-ring);
  --app-button-padding: var(--spacing-3);
  --app-button-min-height: var(--size-control-md);
  --app-button-gap: var(--spacing-4);
  --app-button-radius: var(--radius-none);
  --app-button-width: auto;
  --app-button-font-family: var(--type-body-compact-02-font-family);
  --app-button-font-size: var(--type-body-compact-02-font-size);
  --app-button-line-height: var(--type-body-compact-02-line-height);
  --app-button-font-weight: var(--type-body-compact-02-font-weight);
  --app-button-text-transform: var(--type-body-compact-02-text-transform);
  --app-button-transition-duration: var(--duration-fast);
  --app-button-transition-easing: var(--easing-standard);
  --app-button-cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-button-gap);
  width: var(--app-button-width);
  min-height: var(--app-button-min-height);
  padding: var(--app-button-padding);
  box-sizing: border-box;
  background-color: var(--app-button-bg);
  color: var(--app-button-color);
  border: var(--app-button-border-width) solid var(--app-button-border-color);
  border-radius: var(--app-button-radius);
  box-shadow: var(--app-button-shadow);
  font-family: var(--app-button-font-family);
  font-size: var(--app-button-font-size);
  line-height: var(--app-button-line-height);
  font-weight: var(--app-button-font-weight);
  text-transform: var(--app-button-text-transform);
  text-decoration: none;
  white-space: nowrap;
  cursor: var(--app-button-cursor);
  transition:
    background-color var(--app-button-transition-duration) var(--app-button-transition-easing),
    color var(--app-button-transition-duration) var(--app-button-transition-easing),
    border-color var(--app-button-transition-duration) var(--app-button-transition-easing),
    box-shadow var(--app-button-transition-duration) var(--app-button-transition-easing);
}

.app-button:hover:not(:disabled):not(.app-button--disabled) {
  background-color: var(--app-button-bg-hover);
  box-shadow: var(--app-button-shadow-hover);
}

.app-button:active:not(:disabled):not(.app-button--disabled) {
  background-color: var(--app-button-bg-active);
  box-shadow: var(--app-button-shadow-active);
}

.app-button:focus-visible {
  outline: none;
  box-shadow: var(--app-button-shadow-focus);
}

.app-button__label {
  display: inline-flex;
  align-items: center;
}

.app-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-button--sm {
  --app-button-padding: var(--spacing-2);
  --app-button-min-height: var(--size-control-sm);
}

.app-button--md {
  --app-button-padding: var(--spacing-3);
  --app-button-min-height: var(--size-control-md);
}

.app-button--lg {
  --app-button-padding: var(--spacing-4);
  --app-button-min-height: var(--size-control-lg);
}

.app-button--full-width {
  --app-button-width: 100%;
}

.app-button--primary {
  --app-button-bg: var(--interactive-brand);
  --app-button-bg-hover: var(--interactive-brand-hover);
  --app-button-bg-active: var(--interactive-brand-active);
  --app-button-color: var(--text-on-brand);
  --app-button-border-color: var(--border-transparent);
  --app-button-shadow: var(--shadow-button-primary);
  --app-button-shadow-hover: var(--shadow-button-primary-hover);
  --app-button-shadow-active: var(--shadow-button-primary-active);
}

.app-button--secondary {
  --app-button-bg: var(--interactive-secondary);
  --app-button-bg-hover: var(--interactive-secondary-hover);
  --app-button-bg-active: var(--interactive-secondary-active);
  --app-button-color: var(--text-inverse);
  --app-button-border-color: var(--border-transparent);
  --app-button-shadow: var(--shadow-button-secondary);
  --app-button-shadow-hover: var(--shadow-button-secondary-hover);
  --app-button-shadow-active: var(--shadow-button-secondary-active);
}

.app-button--tertiary {
  --app-button-bg: var(--interactive-tertiary);
  --app-button-bg-hover: var(--interactive-tertiary-hover);
  --app-button-bg-active: var(--interactive-tertiary-active);
  --app-button-color: var(--text-primary);
  --app-button-border-color: var(--border-subtle-1);
  --app-button-shadow: var(--shadow-button-tertiary);
  --app-button-shadow-hover: var(--shadow-button-tertiary-hover);
  --app-button-shadow-active: var(--shadow-button-tertiary-hover);
}

.app-button--ghost {
  --app-button-bg: var(--interactive-ghost);
  --app-button-bg-hover: var(--interactive-ghost-hover);
  --app-button-bg-active: var(--interactive-ghost-active);
  --app-button-color: var(--text-brand);
  --app-button-border-color: var(--border-transparent);
  --app-button-shadow: var(--shadow-none);
  --app-button-shadow-hover: var(--shadow-none);
  --app-button-shadow-active: var(--shadow-none);
}

.app-button--danger {
  --app-button-bg: var(--interactive-danger);
  --app-button-bg-hover: var(--interactive-danger-hover);
  --app-button-bg-active: var(--interactive-danger-active);
  --app-button-color: var(--text-on-danger);
  --app-button-border-color: var(--border-transparent);
  --app-button-shadow: var(--shadow-button-danger);
  --app-button-shadow-hover: var(--shadow-button-danger-hover);
  --app-button-shadow-active: var(--shadow-button-danger-active);
}

.app-button--disabled,
.app-button:disabled {
  --app-button-bg: var(--interactive-disabled);
  --app-button-bg-hover: var(--interactive-disabled);
  --app-button-bg-active: var(--interactive-disabled);
  --app-button-color: var(--text-on-disabled);
  --app-button-border-color: var(--border-transparent);
  --app-button-shadow: var(--shadow-button-disabled);
  --app-button-shadow-hover: var(--shadow-button-disabled);
  --app-button-shadow-active: var(--shadow-button-disabled);
  --app-button-cursor: not-allowed;
}

.app-button--ghost.app-button--disabled,
.app-button--ghost:disabled {
  --app-button-bg: var(--interactive-ghost);
  --app-button-bg-hover: var(--interactive-ghost);
  --app-button-bg-active: var(--interactive-ghost);
  --app-button-color: var(--text-disabled);
  --app-button-shadow: var(--shadow-none);
  --app-button-shadow-hover: var(--shadow-none);
  --app-button-shadow-active: var(--shadow-none);
}
</style>
