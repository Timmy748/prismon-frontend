<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '../icons'

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

const tagClasses = computed(() => ['tag', props.dismissible ? 'tag--dismissible' : undefined])
</script>

<template>
  <span :class="tagClasses">
    <span class="tag__dot" aria-hidden="true" />
    <span class="tag__label">
      <slot>{{ label }}</slot>
    </span>
    <button
      v-if="dismissible"
      type="button"
      class="tag__dismiss"
      :aria-label="dismissLabel"
      @click="emit('dismiss')"
    >
      <Icon name="close" size="md" />
    </button>
  </span>
</template>

<style scoped>
.tag {
  --tag-bg: var(--surface-transparent);
  --tag-color: var(--text-secondary);
  --tag-border-color: var(--border-subtle-2);
  --tag-border-width: var(--border-width-thin);
  --tag-radius: var(--radius-none);
  --tag-padding-top: var(--spacing-2);
  --tag-padding-right: var(--spacing-4);
  --tag-padding-bottom: var(--spacing-2);
  --tag-padding-left: var(--spacing-4);
  --tag-gap: var(--spacing-3);
  --tag-dot-size: 4px;
  --tag-dot-radius: var(--radius-full);
  --tag-dot-bg: var(--icon-brand);
  --tag-font-family: var(--type-body-compact-01-font-family);
  --tag-font-size: var(--type-body-compact-01-font-size);
  --tag-line-height: var(--type-body-compact-01-line-height);
  --tag-font-weight: var(--type-body-compact-01-font-weight);
  --tag-text-transform: var(--type-body-compact-01-text-transform);
  --tag-dismiss-bg: var(--surface-transparent);
  --tag-dismiss-bg-hover: var(--interactive-ghost-neutral-hover);
  --tag-dismiss-bg-active: var(--interactive-ghost-neutral-active);
  --tag-dismiss-color: var(--icon-secondary);
  --tag-dismiss-color-hover: var(--icon-primary);
  --tag-dismiss-padding: var(--spacing-0);
  --tag-dismiss-border-width: var(--border-width-none);
  --tag-dismiss-border-color: var(--border-transparent);
  --tag-dismiss-radius: var(--radius-none);
  --tag-dismiss-shadow-focus: var(--shadow-focus-ring);
  --tag-dismiss-cursor: pointer;
  --tag-press-scale: var(--scale-press);
  --tag-transition-duration: var(--duration-fast);
  --tag-transition-easing: var(--easing-out);
  --tag-hover-transition-easing: var(--easing-hover);

  display: inline-flex;
  align-items: center;
  gap: var(--tag-gap);
  padding: var(--tag-padding-top) var(--tag-padding-right) var(--tag-padding-bottom)
    var(--tag-padding-left);
  box-sizing: border-box;
  background-color: var(--tag-bg);
  color: var(--tag-color);
  border: var(--tag-border-width) solid var(--tag-border-color);
  border-radius: var(--tag-radius);
  font-family: var(--tag-font-family);
  font-size: var(--tag-font-size);
  line-height: var(--tag-line-height);
  font-weight: var(--tag-font-weight);
  text-transform: var(--tag-text-transform);
  white-space: nowrap;
}

.tag--dismissible {
  --tag-padding-right: var(--spacing-2);
}

.tag__dot {
  display: inline-block;
  width: var(--tag-dot-size);
  height: var(--tag-dot-size);
  border-radius: var(--tag-dot-radius);
  background-color: var(--tag-dot-bg);
  flex-shrink: 0;
}

.tag__label {
  display: inline-flex;
  align-items: center;
  color: var(--tag-color);
}

.tag__dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--tag-dismiss-padding);
  border: var(--tag-dismiss-border-width) solid var(--tag-dismiss-border-color);
  border-radius: var(--tag-dismiss-radius);
  background-color: var(--tag-dismiss-bg);
  color: var(--tag-dismiss-color);
  cursor: var(--tag-dismiss-cursor);
  flex-shrink: 0;
  transition:
    transform var(--tag-transition-duration) var(--tag-transition-easing),
    background-color var(--tag-transition-duration) var(--tag-hover-transition-easing),
    color var(--tag-transition-duration) var(--tag-hover-transition-easing),
    box-shadow var(--tag-transition-duration) var(--tag-hover-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .tag__dismiss:hover {
    background-color: var(--tag-dismiss-bg-hover);
    color: var(--tag-dismiss-color-hover);
  }
}

.tag__dismiss:active {
  background-color: var(--tag-dismiss-bg-active);
  color: var(--tag-dismiss-color-hover);
  transform: scale(var(--tag-press-scale));
}

@media (prefers-reduced-motion: reduce) {
  .tag {
    --tag-press-scale: 1;
  }
}

.tag__dismiss:focus-visible {
  outline: none;
  box-shadow: var(--tag-dismiss-shadow-focus);
}
</style>
