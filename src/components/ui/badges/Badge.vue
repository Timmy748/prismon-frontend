<script setup lang="ts">
interface Props {
  label?: string
}

defineProps<Props>()
</script>

<template>
  <span class="badge">
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.badge {
  --badge-bg: var(--surface-brand-selection);
  --badge-color: var(--text-brand-strong);
  --badge-padding-y: var(--spacing-2);
  --badge-padding-x: var(--spacing-4);
  --badge-gap: var(--spacing-3);
  --badge-radius: var(--radius-full);
  --badge-font-family: var(--type-body-compact-01-font-family);
  --badge-font-size: var(--type-body-compact-01-font-size);
  --badge-line-height: var(--type-body-compact-01-line-height);
  --badge-font-weight: var(--type-body-compact-01-font-weight);
  --badge-text-transform: var(--type-body-compact-01-text-transform);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--badge-gap);
  padding: var(--badge-padding-y) var(--badge-padding-x);
  box-sizing: border-box;
  background-color: var(--badge-bg);
  color: var(--badge-color);
  border-radius: var(--badge-radius);
  font-family: var(--badge-font-family);
  font-size: var(--badge-font-size);
  line-height: var(--badge-line-height);
  font-weight: var(--badge-font-weight);
  text-transform: var(--badge-text-transform);
  white-space: nowrap;
}
</style>
