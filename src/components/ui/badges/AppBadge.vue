<script setup lang="ts">
interface Props {
  label?: string
}

defineProps<Props>()
</script>

<template>
  <span class="app-badge">
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.app-badge {
  --app-badge-bg: var(--surface-brand-selection);
  --app-badge-color: var(--text-brand-strong);
  --app-badge-padding-y: var(--spacing-2);
  --app-badge-padding-x: var(--spacing-4);
  --app-badge-gap: var(--spacing-3);
  --app-badge-radius: var(--radius-full);
  --app-badge-font-family: var(--type-body-compact-01-font-family);
  --app-badge-font-size: var(--type-body-compact-01-font-size);
  --app-badge-line-height: var(--type-body-compact-01-line-height);
  --app-badge-font-weight: var(--type-body-compact-01-font-weight);
  --app-badge-text-transform: var(--type-body-compact-01-text-transform);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-badge-gap);
  padding: var(--app-badge-padding-y) var(--app-badge-padding-x);
  box-sizing: border-box;
  background-color: var(--app-badge-bg);
  color: var(--app-badge-color);
  border-radius: var(--app-badge-radius);
  font-family: var(--app-badge-font-family);
  font-size: var(--app-badge-font-size);
  line-height: var(--app-badge-line-height);
  font-weight: var(--app-badge-font-weight);
  text-transform: var(--app-badge-text-transform);
  white-space: nowrap;
}
</style>
