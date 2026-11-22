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

const linkClasses = computed(() => [
  'breadcrumb-link',
  props.current ? 'breadcrumb-link--current' : undefined,
])
</script>

<template>
  <li :class="linkClasses">
    <a v-if="href && !current" :href="href" class="breadcrumb-link__control">
      <slot>{{ label }}</slot>
    </a>
    <span v-else-if="current" class="breadcrumb-link__control" aria-current="page">
      <slot>{{ label }}</slot>
    </span>
    <button v-else type="button" class="breadcrumb-link__control">
      <slot>{{ label }}</slot>
    </button>
    <span v-if="showSeparator" class="breadcrumb-link__separator" aria-hidden="true"> &gt; </span>
  </li>
</template>

<style scoped>
.breadcrumb-link {
  --breadcrumb-link-bg: var(--surface-transparent);
  --breadcrumb-link-bg-hover: var(--surface-subtle-hover);
  --breadcrumb-link-color: var(--text-secondary);
  --breadcrumb-link-separator-color: var(--text-secondary);
  --breadcrumb-link-border-width: var(--border-width-none);
  --breadcrumb-link-border-color: var(--border-transparent);
  --breadcrumb-link-padding-y: var(--spacing-2);
  --breadcrumb-link-padding-x: var(--spacing-3);
  --breadcrumb-link-gap: var(--spacing-2);
  --breadcrumb-link-font-family: var(--type-body-compact-02-font-family);
  --breadcrumb-link-font-size: var(--type-body-compact-02-font-size);
  --breadcrumb-link-line-height: var(--type-body-compact-02-line-height);
  --breadcrumb-link-font-weight: var(--type-body-compact-02-font-weight);
  --breadcrumb-link-text-transform: var(--type-body-compact-02-text-transform);
  --breadcrumb-link-shadow-focus: var(--shadow-focus-ring);
  --breadcrumb-link-transition-duration: var(--duration-fast);
  --breadcrumb-link-transition-easing: var(--easing-standard);
  --breadcrumb-link-cursor: pointer;

  display: inline-flex;
  align-items: center;
  gap: var(--breadcrumb-link-gap);
  list-style: none;
}

.breadcrumb-link__control {
  display: inline-flex;
  align-items: center;
  padding: var(--breadcrumb-link-padding-y) var(--breadcrumb-link-padding-x);
  background-color: var(--breadcrumb-link-bg);
  color: var(--breadcrumb-link-color);
  border: var(--breadcrumb-link-border-width) solid var(--breadcrumb-link-border-color);
  font-family: var(--breadcrumb-link-font-family);
  font-size: var(--breadcrumb-link-font-size);
  line-height: var(--breadcrumb-link-line-height);
  font-weight: var(--breadcrumb-link-font-weight);
  text-transform: var(--breadcrumb-link-text-transform);
  text-decoration: none;
  white-space: nowrap;
  cursor: var(--breadcrumb-link-cursor);
  transition:
    background-color var(--breadcrumb-link-transition-duration)
      var(--breadcrumb-link-transition-easing),
    color var(--breadcrumb-link-transition-duration) var(--breadcrumb-link-transition-easing);
}

.breadcrumb-link:not(.breadcrumb-link--current) .breadcrumb-link__control:hover {
  background-color: var(--breadcrumb-link-bg-hover);
}

.breadcrumb-link__control:focus-visible {
  outline: none;
  box-shadow: var(--breadcrumb-link-shadow-focus);
}

.breadcrumb-link__separator {
  color: var(--breadcrumb-link-separator-color);
  font-family: var(--breadcrumb-link-font-family);
  font-size: var(--breadcrumb-link-font-size);
  line-height: var(--breadcrumb-link-line-height);
  font-weight: var(--breadcrumb-link-font-weight);
  user-select: none;
}

.breadcrumb-link--current {
  --breadcrumb-link-bg-hover: var(--surface-transparent);
  --breadcrumb-link-cursor: default;
}
</style>
