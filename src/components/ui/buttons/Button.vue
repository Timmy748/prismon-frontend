<script setup lang="ts">
import { computed } from 'vue'
import { Icon, type IconName } from '../icons'

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

const buttonClasses = computed(() => [
  'button',
  `button--${props.variant}`,
  `button--${props.size}`,
  props.disabled ? 'button--disabled' : undefined,
  props.fullWidth ? 'button--full-width' : undefined,
])
</script>

<template>
  <button :type="type" :class="buttonClasses" :disabled="disabled">
    <span v-if="$slots.default" class="button__label">
      <slot />
    </span>
    <span v-if="$slots.icon || icon" class="button__icon">
      <slot name="icon">
        <Icon v-if="icon" :name="icon" size="sm" />
      </slot>
    </span>
  </button>
</template>

<style scoped>
.button {
  --button-bg: var(--interactive-brand);
  --button-bg-hover: var(--interactive-brand-hover);
  --button-bg-active: var(--interactive-brand-active);
  --button-color: var(--text-on-brand);
  --button-border-color: var(--border-transparent);
  --button-border-color-hover: var(--button-border-color);
  --button-border-color-active: var(--button-border-color);
  --button-border-width: var(--border-width-thin);
  --button-shadow: var(--shadow-button-primary);
  --button-shadow-hover: var(--shadow-button-primary-hover);
  --button-shadow-active: var(--shadow-button-primary-active);
  --button-shadow-focus: var(--shadow-focus-ring);
  --button-padding: var(--spacing-3);
  --button-min-height: 36px;
  --button-gap: var(--spacing-4);
  --button-radius: var(--radius-none);
  --button-width: auto;
  --button-font-family: var(--type-body-compact-02-font-family);
  --button-font-size: var(--type-body-compact-02-font-size);
  --button-line-height: var(--type-body-compact-02-line-height);
  --button-font-weight: var(--type-body-compact-02-font-weight);
  --button-text-transform: var(--type-body-compact-02-text-transform);
  --button-transition-duration: var(--duration-fast);
  --button-transition-easing: var(--easing-out);
  --button-hover-transition-easing: var(--easing-hover);
  --button-press-scale: var(--scale-press);
  --button-cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--button-gap);
  width: var(--button-width);
  min-height: var(--button-min-height);
  padding: var(--button-padding);
  box-sizing: border-box;
  background-color: var(--button-bg);
  color: var(--button-color);
  border: var(--button-border-width) solid var(--button-border-color);
  border-radius: var(--button-radius);
  box-shadow: var(--button-shadow);
  font-family: var(--button-font-family);
  font-size: var(--button-font-size);
  line-height: var(--button-line-height);
  font-weight: var(--button-font-weight);
  text-transform: var(--button-text-transform);
  text-decoration: none;
  white-space: nowrap;
  cursor: var(--button-cursor);
  transition:
    transform var(--button-transition-duration) var(--button-transition-easing),
    background-color var(--button-transition-duration) var(--button-hover-transition-easing),
    color var(--button-transition-duration) var(--button-hover-transition-easing),
    border-color var(--button-transition-duration) var(--button-hover-transition-easing),
    box-shadow var(--button-transition-duration) var(--button-hover-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .button:hover:not(:disabled):not(.button--disabled) {
    background-color: var(--button-bg-hover);
    border-color: var(--button-border-color-hover);
    box-shadow: var(--button-shadow-hover);
  }
}

.button:active:not(:disabled):not(.button--disabled) {
  background-color: var(--button-bg-active);
  border-color: var(--button-border-color-active);
  box-shadow: var(--button-shadow-active);
  transform: scale(var(--button-press-scale));
}

@media (prefers-reduced-motion: reduce) {
  .button {
    --button-press-scale: 1;
  }
}

.button:focus-visible {
  outline: none;
  box-shadow: var(--button-shadow-focus);
}

.button__label {
  display: inline-flex;
  align-items: center;
}

.button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.button--sm {
  --button-padding: var(--spacing-2);
  --button-min-height: 28px;
  --button-font-family: var(--type-body-01-font-family);
  --button-font-size: var(--type-body-01-font-size);
  --button-line-height: var(--type-body-01-line-height);
  --button-font-weight: var(--type-body-01-font-weight);
  --button-text-transform: var(--type-body-01-text-transform);
}

.button--md {
  --button-padding: var(--spacing-3);
  --button-min-height: 36px;
}

.button--lg {
  --button-padding: var(--spacing-4);
  --button-min-height: 44px;
}

.button--full-width {
  --button-width: 100%;
}

.button--primary {
  --button-bg: var(--interactive-brand);
  --button-bg-hover: var(--interactive-brand-hover);
  --button-bg-active: var(--interactive-brand-active);
  --button-color: var(--text-on-brand);
  --button-border-color: var(--border-transparent);
  --button-shadow: var(--shadow-button-primary);
  --button-shadow-hover: var(--shadow-button-primary-hover);
  --button-shadow-active: var(--shadow-button-primary-active);
}

.button--secondary {
  --button-bg: var(--interactive-secondary);
  --button-bg-hover: var(--interactive-secondary-hover);
  --button-bg-active: var(--interactive-secondary-active);
  --button-color: var(--text-inverse);
  --button-border-color: var(--border-transparent);
  --button-shadow: var(--shadow-button-secondary);
  --button-shadow-hover: var(--shadow-button-secondary-hover);
  --button-shadow-active: var(--shadow-button-secondary-active);
}

.button--tertiary {
  --button-bg: var(--interactive-tertiary);
  --button-bg-hover: var(--interactive-tertiary-hover);
  --button-bg-active: var(--interactive-tertiary-active);
  --button-color: var(--text-primary);
  --button-border-color: var(--border-subtle-1);
  --button-border-color-hover: var(--border-subtle-hover);
  --button-border-color-active: var(--border-subtle-hover);
  --button-shadow: var(--shadow-none);
  --button-shadow-hover: var(--shadow-none);
  --button-shadow-active: var(--shadow-none);
}

.button--ghost {
  --button-bg: var(--interactive-ghost);
  --button-bg-hover: var(--interactive-ghost-hover);
  --button-bg-active: var(--interactive-ghost-active);
  --button-color: var(--text-brand);
  --button-border-color: var(--border-transparent);
  --button-shadow: var(--shadow-none);
  --button-shadow-hover: var(--shadow-none);
  --button-shadow-active: var(--shadow-none);
}

.button--danger {
  --button-bg: var(--interactive-danger);
  --button-bg-hover: var(--interactive-danger-hover);
  --button-bg-active: var(--interactive-danger-active);
  --button-color: var(--text-on-danger);
  --button-border-color: var(--border-transparent);
  --button-shadow: var(--shadow-button-danger);
  --button-shadow-hover: var(--shadow-button-danger-hover);
  --button-shadow-active: var(--shadow-button-danger-active);
}

.button--disabled,
.button:disabled {
  --button-bg: var(--interactive-disabled);
  --button-bg-hover: var(--interactive-disabled);
  --button-bg-active: var(--interactive-disabled);
  --button-color: var(--text-on-disabled);
  --button-border-color: var(--border-transparent);
  --button-shadow: var(--shadow-button-disabled);
  --button-shadow-hover: var(--shadow-button-disabled);
  --button-shadow-active: var(--shadow-button-disabled);
  --button-cursor: not-allowed;
}

.button--ghost.button--disabled,
.button--ghost:disabled {
  --button-bg: var(--interactive-ghost);
  --button-bg-hover: var(--interactive-ghost);
  --button-bg-active: var(--interactive-ghost);
  --button-color: var(--text-disabled);
  --button-shadow: var(--shadow-none);
  --button-shadow-hover: var(--shadow-none);
  --button-shadow-active: var(--shadow-none);
}
</style>
