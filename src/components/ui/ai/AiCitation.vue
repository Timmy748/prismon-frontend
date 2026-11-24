<script setup lang="ts">
import { computed } from 'vue'

export type AiCitationKind = 'document' | 'asset'

export interface AiCitationPayload {
  kind: AiCitationKind
  targetId: number
}

interface Props {
  kind?: AiCitationKind
  targetId: number
  label?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  kind: 'document',
})

const emit = defineEmits<{
  select: [payload: AiCitationPayload]
}>()

const displayLabel = computed(() => props.label || `${props.kind} ${props.targetId}`)

function handleClick() {
  emit('select', {
    kind: props.kind,
    targetId: props.targetId,
  })
}
</script>

<template>
  <button
    type="button"
    class="ai-citation"
    :data-citation-kind="kind"
    :data-citation-id="targetId"
    :title="title || undefined"
    @click="handleClick"
  >
    {{ displayLabel }}
  </button>
</template>

<style scoped>
.ai-citation {
  --ai-citation-color: inherit;
  --ai-citation-color-hover: var(--text-brand);
  --ai-citation-color-active: var(--text-brand-strong);
  --ai-citation-bg: var(--surface-transparent);
  --ai-citation-bg-hover: var(--surface-brand-subtle);
  --ai-citation-bg-active: var(--surface-brand-selection);
  --ai-citation-border-color: var(--border-brand);
  --ai-citation-border-width: var(--border-width-thin);
  --ai-citation-padding-x: var(--spacing-1);
  --ai-citation-offset-bottom: var(--border-width-thin);
  --ai-citation-radius: var(--radius-none);
  --ai-citation-focus-ring: var(--shadow-focus-ring);
  --ai-citation-transition-duration: var(--duration-fast);
  --ai-citation-transition-easing: var(--easing-standard);

  display: inline;
  appearance: none;
  margin: var(--spacing-0);
  padding: var(--spacing-0) var(--ai-citation-padding-x) var(--ai-citation-offset-bottom);
  background-color: var(--ai-citation-bg);
  border: var(--border-width-none);
  border-bottom: var(--ai-citation-border-width) solid var(--ai-citation-border-color);
  border-radius: var(--ai-citation-radius);
  color: var(--ai-citation-color);
  font: inherit;
  line-height: inherit;
  text-align: inherit;
  text-decoration: none;
  vertical-align: baseline;
  cursor: pointer;
  transition:
    color var(--ai-citation-transition-duration) var(--ai-citation-transition-easing),
    background-color var(--ai-citation-transition-duration) var(--ai-citation-transition-easing),
    border-color var(--ai-citation-transition-duration) var(--ai-citation-transition-easing);
}

.ai-citation:hover {
  color: var(--ai-citation-color-hover);
  background-color: var(--ai-citation-bg-hover);
}

.ai-citation:active {
  color: var(--ai-citation-color-active);
  background-color: var(--ai-citation-bg-active);
}

.ai-citation:focus-visible {
  outline: none;
  box-shadow: var(--ai-citation-focus-ring);
}
</style>
