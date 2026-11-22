<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, type IconName } from '../icons'

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
  'app-icon-button',
  `app-icon-button--${props.variant}`,
  props.disabled ? 'app-icon-button--disabled' : undefined,
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
    <span class="app-icon-button__icon">
      <slot>
        <AppIcon v-if="icon" :name="icon" size="sm" />
      </slot>
    </span>
  </button>
</template>

<style scoped>
.app-icon-button {
  --app-icon-button-bg: var(--interactive-brand);
  --app-icon-button-bg-hover: var(--interactive-brand-hover);
  --app-icon-button-bg-active: var(--interactive-brand-active);
  --app-icon-button-color: var(--icon-on-brand);
  --app-icon-button-border-color: var(--border-transparent);
  --app-icon-button-border-width: var(--border-width-thin);
  --app-icon-button-shadow: var(--shadow-button-primary);
  --app-icon-button-shadow-hover: var(--shadow-button-primary-hover);
  --app-icon-button-shadow-active: var(--shadow-button-primary-active);
  --app-icon-button-shadow-focus: var(--shadow-focus-ring);
  --app-icon-button-size: var(--size-control-icon);
  --app-icon-button-padding: var(--spacing-3);
  --app-icon-button-radius: var(--radius-none);
  --app-icon-button-transition-duration: var(--duration-fast);
  --app-icon-button-transition-easing: var(--easing-standard);
  --app-icon-button-cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--app-icon-button-size);
  height: var(--app-icon-button-size);
  padding: var(--app-icon-button-padding);
  box-sizing: border-box;
  flex-shrink: 0;
  background-color: var(--app-icon-button-bg);
  color: var(--app-icon-button-color);
  border: var(--app-icon-button-border-width) solid var(--app-icon-button-border-color);
  border-radius: var(--app-icon-button-radius);
  box-shadow: var(--app-icon-button-shadow);
  cursor: var(--app-icon-button-cursor);
  transition:
    background-color var(--app-icon-button-transition-duration)
      var(--app-icon-button-transition-easing),
    color var(--app-icon-button-transition-duration) var(--app-icon-button-transition-easing),
    border-color var(--app-icon-button-transition-duration) var(--app-icon-button-transition-easing),
    box-shadow var(--app-icon-button-transition-duration) var(--app-icon-button-transition-easing);
}

.app-icon-button:hover:not(:disabled):not(.app-icon-button--disabled) {
  background-color: var(--app-icon-button-bg-hover);
  box-shadow: var(--app-icon-button-shadow-hover);
}

.app-icon-button:active:not(:disabled):not(.app-icon-button--disabled) {
  background-color: var(--app-icon-button-bg-active);
  box-shadow: var(--app-icon-button-shadow-active);
}

.app-icon-button:focus-visible {
  outline: none;
  box-shadow: var(--app-icon-button-shadow-focus);
}

.app-icon-button__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-icon-button--primary {
  --app-icon-button-bg: var(--interactive-brand);
  --app-icon-button-bg-hover: var(--interactive-brand-hover);
  --app-icon-button-bg-active: var(--interactive-brand-active);
  --app-icon-button-color: var(--icon-on-brand);
  --app-icon-button-border-color: var(--border-transparent);
  --app-icon-button-shadow: var(--shadow-button-primary);
  --app-icon-button-shadow-hover: var(--shadow-button-primary-hover);
  --app-icon-button-shadow-active: var(--shadow-button-primary-active);
}

.app-icon-button--secondary {
  --app-icon-button-bg: var(--interactive-secondary);
  --app-icon-button-bg-hover: var(--interactive-secondary-hover);
  --app-icon-button-bg-active: var(--interactive-secondary-active);
  --app-icon-button-color: var(--icon-inverse);
  --app-icon-button-border-color: var(--border-transparent);
  --app-icon-button-shadow: var(--shadow-button-secondary);
  --app-icon-button-shadow-hover: var(--shadow-button-secondary-hover);
  --app-icon-button-shadow-active: var(--shadow-button-secondary-active);
}

.app-icon-button--tertiary {
  --app-icon-button-bg: var(--interactive-tertiary);
  --app-icon-button-bg-hover: var(--interactive-tertiary-hover);
  --app-icon-button-bg-active: var(--interactive-tertiary-active);
  --app-icon-button-color: var(--icon-primary);
  --app-icon-button-border-color: var(--border-subtle-1);
  --app-icon-button-shadow: var(--shadow-button-tertiary);
  --app-icon-button-shadow-hover: var(--shadow-button-tertiary-hover);
  --app-icon-button-shadow-active: var(--shadow-button-tertiary-hover);
}

.app-icon-button--ghost {
  --app-icon-button-bg: var(--interactive-ghost);
  --app-icon-button-bg-hover: var(--interactive-ghost-neutral-hover);
  --app-icon-button-bg-active: var(--interactive-ghost-neutral-active);
  --app-icon-button-color: var(--icon-primary);
  --app-icon-button-border-color: var(--border-transparent);
  --app-icon-button-shadow: var(--shadow-none);
  --app-icon-button-shadow-hover: var(--shadow-none);
  --app-icon-button-shadow-active: var(--shadow-none);
}

.app-icon-button--danger {
  --app-icon-button-bg: var(--interactive-danger);
  --app-icon-button-bg-hover: var(--interactive-danger-hover);
  --app-icon-button-bg-active: var(--interactive-danger-active);
  --app-icon-button-color: var(--icon-on-danger);
  --app-icon-button-border-color: var(--border-transparent);
  --app-icon-button-shadow: var(--shadow-button-danger);
  --app-icon-button-shadow-hover: var(--shadow-button-danger-hover);
  --app-icon-button-shadow-active: var(--shadow-button-danger-active);
}

.app-icon-button--disabled,
.app-icon-button:disabled {
  --app-icon-button-bg: var(--interactive-disabled-subtle);
  --app-icon-button-bg-hover: var(--interactive-disabled-subtle);
  --app-icon-button-bg-active: var(--interactive-disabled-subtle);
  --app-icon-button-color: var(--icon-disabled);
  --app-icon-button-border-color: var(--border-transparent);
  --app-icon-button-shadow: var(--shadow-none);
  --app-icon-button-shadow-hover: var(--shadow-none);
  --app-icon-button-shadow-active: var(--shadow-none);
  --app-icon-button-cursor: not-allowed;
}
</style>
