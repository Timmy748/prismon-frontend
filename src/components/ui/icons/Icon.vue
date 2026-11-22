<script setup lang="ts">
import { computed } from 'vue'
import { ICON_PATHS, type IconName } from './iconRegistry'

export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export type IconColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'helper'
  | 'disabled'
  | 'brand'
  | 'brand-strong'
  | 'danger'
  | 'inverse'
  | 'on-brand'
  | 'on-danger'

interface Props {
  name: IconName
  size?: IconSize
  color?: IconColor
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'xl',
  color: 'inherit',
})

const icon = computed(() => ICON_PATHS[props.name])

const hasLabel = computed(() => Boolean(props.label && props.label.trim().length > 0))

const iconClasses = computed(() => [
  'icon',
  `icon--${props.size}`,
  props.color !== 'inherit' ? `icon--${props.color}` : undefined,
])
</script>

<template>
  <svg
    :class="iconClasses"
    :viewBox="icon.viewBox"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :role="hasLabel ? 'img' : undefined"
    :aria-label="hasLabel ? label : undefined"
    :aria-hidden="hasLabel ? undefined : 'true'"
  >
    <path v-for="(d, index) in icon.paths" :key="index" :d="d" fill="currentColor" />
  </svg>
</template>

<style scoped>
.icon {
  --icon-size: var(--icon-size-xl);
  --icon-color: currentColor;

  width: var(--icon-size);
  height: var(--icon-size);
  color: var(--icon-color);
  display: inline-flex;
  flex-shrink: 0;
}

.icon--sm {
  --icon-size: var(--icon-size-sm);
}

.icon--md {
  --icon-size: var(--icon-size-md);
}

.icon--lg {
  --icon-size: var(--icon-size-lg);
}

.icon--xl {
  --icon-size: var(--icon-size-xl);
}

.icon--2xl {
  --icon-size: var(--icon-size-2xl);
}

.icon--primary {
  --icon-color: var(--icon-primary);
}

.icon--secondary {
  --icon-color: var(--icon-secondary);
}

.icon--tertiary {
  --icon-color: var(--icon-tertiary);
}

.icon--helper {
  --icon-color: var(--icon-helper);
}

.icon--disabled {
  --icon-color: var(--icon-disabled);
}

.icon--brand {
  --icon-color: var(--icon-brand);
}

.icon--brand-strong {
  --icon-color: var(--icon-brand-strong);
}

.icon--danger {
  --icon-color: var(--icon-danger);
}

.icon--inverse {
  --icon-color: var(--icon-inverse);
}

.icon--on-brand {
  --icon-color: var(--icon-on-brand);
}

.icon--on-danger {
  --icon-color: var(--icon-on-danger);
}
</style>
