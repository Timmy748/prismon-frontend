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
  'app-icon',
  `app-icon--${props.size}`,
  props.color !== 'inherit' ? `app-icon--${props.color}` : undefined,
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
.app-icon {
  --app-icon-size: var(--icon-size-xl);
  --app-icon-color: currentColor;

  width: var(--app-icon-size);
  height: var(--app-icon-size);
  color: var(--app-icon-color);
  display: inline-flex;
  flex-shrink: 0;
}

.app-icon--sm {
  --app-icon-size: var(--icon-size-sm);
}

.app-icon--md {
  --app-icon-size: var(--icon-size-md);
}

.app-icon--lg {
  --app-icon-size: var(--icon-size-lg);
}

.app-icon--xl {
  --app-icon-size: var(--icon-size-xl);
}

.app-icon--2xl {
  --app-icon-size: var(--icon-size-2xl);
}

.app-icon--primary {
  --app-icon-color: var(--icon-primary);
}

.app-icon--secondary {
  --app-icon-color: var(--icon-secondary);
}

.app-icon--tertiary {
  --app-icon-color: var(--icon-tertiary);
}

.app-icon--helper {
  --app-icon-color: var(--icon-helper);
}

.app-icon--disabled {
  --app-icon-color: var(--icon-disabled);
}

.app-icon--brand {
  --app-icon-color: var(--icon-brand);
}

.app-icon--brand-strong {
  --app-icon-color: var(--icon-brand-strong);
}

.app-icon--danger {
  --app-icon-color: var(--icon-danger);
}

.app-icon--inverse {
  --app-icon-color: var(--icon-inverse);
}

.app-icon--on-brand {
  --app-icon-color: var(--icon-on-brand);
}

.app-icon--on-danger {
  --app-icon-color: var(--icon-on-danger);
}
</style>
