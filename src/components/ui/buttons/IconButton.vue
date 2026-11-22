<script setup lang="ts">
import { computed } from 'vue'
import { Icon, type IconName } from '../icons'

export type IconButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'

interface Props {
  icon?: IconName
  ariaLabel: string
  variant?: IconButtonVariant
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => [
  'icon-button',
  `icon-button--${props.variant}`,
  props.disabled ? 'icon-button--disabled' : undefined,
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
    :type="type"
    :class="buttonClasses"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <span class="icon-button__icon">
      <slot>
        <Icon v-if="icon" :name="icon" size="sm" />
      </slot>
    </span>
  </button>
</template>

<style scoped>
.icon-button {
  --icon-button-bg: var(--interactive-brand);
  --icon-button-bg-hover: var(--interactive-brand-hover);
  --icon-button-bg-active: var(--interactive-brand-active);
  --icon-button-color: var(--icon-on-brand);
  --icon-button-border-color: var(--border-transparent);
  --icon-button-border-width: var(--border-width-thin);
  --icon-button-shadow: var(--shadow-button-primary);
  --icon-button-shadow-hover: var(--shadow-button-primary-hover);
  --icon-button-shadow-active: var(--shadow-button-primary-active);
  --icon-button-shadow-focus: var(--shadow-focus-ring);
  --icon-button-size: var(--size-control-icon);
  --icon-button-padding: var(--spacing-3);
  --icon-button-radius: var(--radius-none);
  --icon-button-transition-duration: var(--duration-fast);
  --icon-button-transition-easing: var(--easing-standard);
  --icon-button-cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-button-size);
  height: var(--icon-button-size);
  padding: var(--icon-button-padding);
  box-sizing: border-box;
  flex-shrink: 0;
  background-color: var(--icon-button-bg);
  color: var(--icon-button-color);
  border: var(--icon-button-border-width) solid var(--icon-button-border-color);
  border-radius: var(--icon-button-radius);
  box-shadow: var(--icon-button-shadow);
  cursor: var(--icon-button-cursor);
  transition:
    background-color var(--icon-button-transition-duration) var(--icon-button-transition-easing),
    color var(--icon-button-transition-duration) var(--icon-button-transition-easing),
    border-color var(--icon-button-transition-duration) var(--icon-button-transition-easing),
    box-shadow var(--icon-button-transition-duration) var(--icon-button-transition-easing);
}

.icon-button:hover:not(:disabled):not(.icon-button--disabled) {
  background-color: var(--icon-button-bg-hover);
  box-shadow: var(--icon-button-shadow-hover);
}

.icon-button:active:not(:disabled):not(.icon-button--disabled) {
  background-color: var(--icon-button-bg-active);
  box-shadow: var(--icon-button-shadow-active);
}

.icon-button:focus-visible {
  outline: none;
  box-shadow: var(--icon-button-shadow-focus);
}

.icon-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-button--primary {
  --icon-button-bg: var(--interactive-brand);
  --icon-button-bg-hover: var(--interactive-brand-hover);
  --icon-button-bg-active: var(--interactive-brand-active);
  --icon-button-color: var(--icon-on-brand);
  --icon-button-border-color: var(--border-transparent);
  --icon-button-shadow: var(--shadow-button-primary);
  --icon-button-shadow-hover: var(--shadow-button-primary-hover);
  --icon-button-shadow-active: var(--shadow-button-primary-active);
}

.icon-button--secondary {
  --icon-button-bg: var(--interactive-secondary);
  --icon-button-bg-hover: var(--interactive-secondary-hover);
  --icon-button-bg-active: var(--interactive-secondary-active);
  --icon-button-color: var(--icon-inverse);
  --icon-button-border-color: var(--border-transparent);
  --icon-button-shadow: var(--shadow-button-secondary);
  --icon-button-shadow-hover: var(--shadow-button-secondary-hover);
  --icon-button-shadow-active: var(--shadow-button-secondary-active);
}

.icon-button--tertiary {
  --icon-button-bg: var(--interactive-tertiary);
  --icon-button-bg-hover: var(--interactive-tertiary-hover);
  --icon-button-bg-active: var(--interactive-tertiary-active);
  --icon-button-color: var(--icon-primary);
  --icon-button-border-color: var(--border-subtle-1);
  --icon-button-shadow: var(--shadow-button-tertiary);
  --icon-button-shadow-hover: var(--shadow-button-tertiary-hover);
  --icon-button-shadow-active: var(--shadow-button-tertiary-hover);
}

.icon-button--ghost {
  --icon-button-bg: var(--interactive-ghost);
  --icon-button-bg-hover: var(--interactive-ghost-neutral-hover);
  --icon-button-bg-active: var(--interactive-ghost-neutral-active);
  --icon-button-color: var(--icon-primary);
  --icon-button-border-color: var(--border-transparent);
  --icon-button-shadow: var(--shadow-none);
  --icon-button-shadow-hover: var(--shadow-none);
  --icon-button-shadow-active: var(--shadow-none);
}

.icon-button--danger {
  --icon-button-bg: var(--interactive-danger);
  --icon-button-bg-hover: var(--interactive-danger-hover);
  --icon-button-bg-active: var(--interactive-danger-active);
  --icon-button-color: var(--icon-on-danger);
  --icon-button-border-color: var(--border-transparent);
  --icon-button-shadow: var(--shadow-button-danger);
  --icon-button-shadow-hover: var(--shadow-button-danger-hover);
  --icon-button-shadow-active: var(--shadow-button-danger-active);
}

.icon-button--disabled,
.icon-button:disabled {
  --icon-button-bg: var(--interactive-disabled-subtle);
  --icon-button-bg-hover: var(--interactive-disabled-subtle);
  --icon-button-bg-active: var(--interactive-disabled-subtle);
  --icon-button-color: var(--icon-disabled);
  --icon-button-border-color: var(--border-transparent);
  --icon-button-shadow: var(--shadow-none);
  --icon-button-shadow-hover: var(--shadow-none);
  --icon-button-shadow-active: var(--shadow-none);
  --icon-button-cursor: not-allowed;
}
</style>
