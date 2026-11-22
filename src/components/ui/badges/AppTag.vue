<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '../icons'

interface Props {
  label?: string
  dismissible?: boolean
  dismissLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  dismissible: false,
  dismissLabel: 'Remover tag',
})

const emit = defineEmits<{
  dismiss: []
}>()

const tagClasses = computed(() => [
  'app-tag',
  props.dismissible ? 'app-tag--dismissible' : undefined,
])
</script>

<template>
  <span :class="tagClasses">
    <span class="app-tag__dot" aria-hidden="true" />
    <span class="app-tag__label">
      <slot>{{ label }}</slot>
    </span>
    <button
      v-if="dismissible"
      type="button"
      class="app-tag__dismiss"
      :aria-label="dismissLabel"
      @click="emit('dismiss')"
    >
      <AppIcon name="close" size="md" />
    </button>
  </span>
</template>

<style scoped>
.app-tag {
  --app-tag-bg: var(--surface-transparent);
  --app-tag-color: var(--text-secondary);
  --app-tag-border-color: var(--border-subtle-2);
  --app-tag-border-width: var(--border-width-thin);
  --app-tag-radius: var(--radius-none);
  --app-tag-padding-top: var(--spacing-2);
  --app-tag-padding-right: var(--spacing-4);
  --app-tag-padding-bottom: var(--spacing-2);
  --app-tag-padding-left: var(--spacing-4);
  --app-tag-gap: var(--spacing-3);
  --app-tag-dot-size: var(--size-dot-sm);
  --app-tag-dot-radius: var(--radius-full);
  --app-tag-dot-bg: var(--icon-brand);
  --app-tag-font-family: var(--type-body-compact-01-font-family);
  --app-tag-font-size: var(--type-body-compact-01-font-size);
  --app-tag-line-height: var(--type-body-compact-01-line-height);
  --app-tag-font-weight: var(--type-body-compact-01-font-weight);
  --app-tag-text-transform: var(--type-body-compact-01-text-transform);
  --app-tag-dismiss-bg: var(--surface-transparent);
  --app-tag-dismiss-bg-hover: var(--interactive-ghost-neutral-hover);
  --app-tag-dismiss-bg-active: var(--interactive-ghost-neutral-active);
  --app-tag-dismiss-color: var(--icon-secondary);
  --app-tag-dismiss-color-hover: var(--icon-primary);
  --app-tag-dismiss-padding: var(--spacing-0);
  --app-tag-dismiss-border-width: var(--border-width-none);
  --app-tag-dismiss-border-color: var(--border-transparent);
  --app-tag-dismiss-radius: var(--radius-none);
  --app-tag-dismiss-shadow-focus: var(--shadow-focus-ring);
  --app-tag-dismiss-cursor: pointer;
  --app-tag-transition-duration: var(--duration-fast);
  --app-tag-transition-easing: var(--easing-standard);

  display: inline-flex;
  align-items: center;
  gap: var(--app-tag-gap);
  padding: var(--app-tag-padding-top) var(--app-tag-padding-right) var(--app-tag-padding-bottom)
    var(--app-tag-padding-left);
  box-sizing: border-box;
  background-color: var(--app-tag-bg);
  color: var(--app-tag-color);
  border: var(--app-tag-border-width) solid var(--app-tag-border-color);
  border-radius: var(--app-tag-radius);
  font-family: var(--app-tag-font-family);
  font-size: var(--app-tag-font-size);
  line-height: var(--app-tag-line-height);
  font-weight: var(--app-tag-font-weight);
  text-transform: var(--app-tag-text-transform);
  white-space: nowrap;
}

.app-tag--dismissible {
  --app-tag-padding-right: var(--spacing-2);
}

.app-tag__dot {
  display: inline-block;
  width: var(--app-tag-dot-size);
  height: var(--app-tag-dot-size);
  border-radius: var(--app-tag-dot-radius);
  background-color: var(--app-tag-dot-bg);
  flex-shrink: 0;
}

.app-tag__label {
  display: inline-flex;
  align-items: center;
  color: var(--app-tag-color);
}

.app-tag__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-tag-dismiss-padding);
  border: var(--app-tag-dismiss-border-width) solid var(--app-tag-dismiss-border-color);
  border-radius: var(--app-tag-dismiss-radius);
  background-color: var(--app-tag-dismiss-bg);
  color: var(--app-tag-dismiss-color);
  cursor: var(--app-tag-dismiss-cursor);
  flex-shrink: 0;
  transition:
    background-color var(--app-tag-transition-duration) var(--app-tag-transition-easing),
    color var(--app-tag-transition-duration) var(--app-tag-transition-easing),
    box-shadow var(--app-tag-transition-duration) var(--app-tag-transition-easing);
}

.app-tag__dismiss:hover {
  background-color: var(--app-tag-dismiss-bg-hover);
  color: var(--app-tag-dismiss-color-hover);
}

.app-tag__dismiss:active {
  background-color: var(--app-tag-dismiss-bg-active);
  color: var(--app-tag-dismiss-color-hover);
}

.app-tag__dismiss:focus-visible {
  outline: none;
  box-shadow: var(--app-tag-dismiss-shadow-focus);
}
</style>
