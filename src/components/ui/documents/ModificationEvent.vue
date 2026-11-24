<script setup lang="ts">
import { Icon } from '../icons'

interface Props {
  title: string
  summary: string
  author: string
  date: string
}

defineProps<Props>()
</script>

<template>
  <article class="modification-event">
    <h4 class="modification-event__title">{{ title }}</h4>
    <div class="modification-event__body">
      <p class="modification-event__summary">{{ summary }}</p>
      <div class="modification-event__meta">
        <span class="modification-event__meta-item">
          <Icon name="people" size="sm" color="helper" />
          <span>{{ author }}</span>
        </span>
        <span class="modification-event__meta-item">
          <Icon name="calendar" size="sm" color="helper" />
          <span>{{ date }}</span>
        </span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.modification-event {
  --modification-event-gap: var(--spacing-4);
  --modification-event-body-gap: var(--spacing-3);
  --modification-event-meta-gap: var(--spacing-5);
  --modification-event-meta-item-gap: var(--spacing-2);
  --modification-event-reset-spacing: var(--spacing-0);

  --modification-event-title-color: var(--text-tertiary);
  --modification-event-title-font-family: var(--type-heading-01-font-family);
  --modification-event-title-font-size: var(--type-heading-01-font-size);
  --modification-event-title-line-height: var(--type-heading-01-line-height);
  --modification-event-title-font-weight: var(--type-heading-01-font-weight);
  --modification-event-title-text-transform: var(--type-heading-01-text-transform);

  --modification-event-text-color: var(--text-helper);
  --modification-event-text-font-family: var(--type-body-compact-01-font-family);
  --modification-event-text-font-size: var(--type-body-compact-01-font-size);
  --modification-event-text-line-height: var(--type-body-compact-01-line-height);
  --modification-event-text-font-weight: var(--type-body-compact-01-font-weight);
  --modification-event-text-text-transform: var(--type-body-compact-01-text-transform);

  display: flex;
  flex-direction: column;
  gap: var(--modification-event-gap);
  width: 100%;
}

.modification-event__title {
  margin: var(--modification-event-reset-spacing);
  color: var(--modification-event-title-color);
  font-family: var(--modification-event-title-font-family);
  font-size: var(--modification-event-title-font-size);
  line-height: var(--modification-event-title-line-height);
  font-weight: var(--modification-event-title-font-weight);
  text-transform: var(--modification-event-title-text-transform);
}

.modification-event__body {
  display: flex;
  flex-direction: column;
  gap: var(--modification-event-body-gap);
}

.modification-event__summary {
  margin: var(--modification-event-reset-spacing);
  color: var(--modification-event-text-color);
  font-family: var(--modification-event-text-font-family);
  font-size: var(--modification-event-text-font-size);
  line-height: var(--modification-event-text-line-height);
  font-weight: var(--modification-event-text-font-weight);
  text-transform: var(--modification-event-text-text-transform);
}

.modification-event__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--modification-event-meta-gap);
  color: var(--modification-event-text-color);
  font-family: var(--modification-event-text-font-family);
  font-size: var(--modification-event-text-font-size);
  line-height: var(--modification-event-text-line-height);
  font-weight: var(--modification-event-text-font-weight);
  text-transform: var(--modification-event-text-text-transform);
}

.modification-event__meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--modification-event-meta-item-gap);
}
</style>
