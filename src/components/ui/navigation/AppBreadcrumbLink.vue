<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  href?: string
  current?: boolean
  showSeparator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  current: false,
  showSeparator: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const linkClasses = computed(() => [
  'app-breadcrumb-link',
  props.current ? 'app-breadcrumb-link--current' : undefined,
])

function handleClick(event: MouseEvent) {
  if (props.current) {
    return
  }
  emit('click', event)
}
</script>

<template>
  <li :class="linkClasses">
    <a
      v-if="href && !current"
      :href="href"
      class="app-breadcrumb-link__control"
      @click="handleClick"
    >
      <slot>{{ label }}</slot>
    </a>
    <span v-else-if="current" class="app-breadcrumb-link__control" aria-current="page">
      <slot>{{ label }}</slot>
    </span>
    <button v-else type="button" class="app-breadcrumb-link__control" @click="handleClick">
      <slot>{{ label }}</slot>
    </button>
    <span v-if="showSeparator" class="app-breadcrumb-link__separator" aria-hidden="true">
      &gt;
    </span>
  </li>
</template>

<style scoped>
.app-breadcrumb-link {
  --app-breadcrumb-link-bg: var(--surface-transparent);
  --app-breadcrumb-link-bg-hover: var(--surface-subtle-hover);
  --app-breadcrumb-link-color: var(--text-secondary);
  --app-breadcrumb-link-separator-color: var(--text-secondary);
  --app-breadcrumb-link-border-width: var(--border-width-none);
  --app-breadcrumb-link-border-color: var(--border-transparent);
  --app-breadcrumb-link-padding-y: var(--spacing-2);
  --app-breadcrumb-link-padding-x: var(--spacing-3);
  --app-breadcrumb-link-gap: var(--spacing-2);
  --app-breadcrumb-link-font-family: var(--type-body-compact-02-font-family);
  --app-breadcrumb-link-font-size: var(--type-body-compact-02-font-size);
  --app-breadcrumb-link-line-height: var(--type-body-compact-02-line-height);
  --app-breadcrumb-link-font-weight: var(--type-body-compact-02-font-weight);
  --app-breadcrumb-link-text-transform: var(--type-body-compact-02-text-transform);
  --app-breadcrumb-link-shadow-focus: var(--shadow-focus-ring);
  --app-breadcrumb-link-transition-duration: var(--duration-fast);
  --app-breadcrumb-link-transition-easing: var(--easing-standard);
  --app-breadcrumb-link-cursor: pointer;

  display: inline-flex;
  align-items: center;
  gap: var(--app-breadcrumb-link-gap);
  list-style: none;
}

.app-breadcrumb-link__control {
  display: inline-flex;
  align-items: center;
  padding: var(--app-breadcrumb-link-padding-y) var(--app-breadcrumb-link-padding-x);
  background-color: var(--app-breadcrumb-link-bg);
  color: var(--app-breadcrumb-link-color);
  border: var(--app-breadcrumb-link-border-width) solid var(--app-breadcrumb-link-border-color);
  font-family: var(--app-breadcrumb-link-font-family);
  font-size: var(--app-breadcrumb-link-font-size);
  line-height: var(--app-breadcrumb-link-line-height);
  font-weight: var(--app-breadcrumb-link-font-weight);
  text-transform: var(--app-breadcrumb-link-text-transform);
  text-decoration: none;
  white-space: nowrap;
  cursor: var(--app-breadcrumb-link-cursor);
  transition:
    background-color var(--app-breadcrumb-link-transition-duration)
      var(--app-breadcrumb-link-transition-easing),
    color var(--app-breadcrumb-link-transition-duration)
      var(--app-breadcrumb-link-transition-easing);
}

.app-breadcrumb-link:not(.app-breadcrumb-link--current) .app-breadcrumb-link__control:hover {
  background-color: var(--app-breadcrumb-link-bg-hover);
}

.app-breadcrumb-link__control:focus-visible {
  outline: none;
  box-shadow: var(--app-breadcrumb-link-shadow-focus);
}

.app-breadcrumb-link__separator {
  color: var(--app-breadcrumb-link-separator-color);
  font-family: var(--app-breadcrumb-link-font-family);
  font-size: var(--app-breadcrumb-link-font-size);
  line-height: var(--app-breadcrumb-link-line-height);
  font-weight: var(--app-breadcrumb-link-font-weight);
  user-select: none;
}

.app-breadcrumb-link--current {
  --app-breadcrumb-link-bg-hover: var(--surface-transparent);
  --app-breadcrumb-link-cursor: default;
}
</style>
