<script setup lang="ts">
import { AppIconButton } from '../buttons'

interface Props {
  canPrevious?: boolean
  canNext?: boolean
  previousLabel?: string
  nextLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  canPrevious: true,
  canNext: true,
  previousLabel: 'Página anterior',
  nextLabel: 'Próxima página',
})

const emit = defineEmits<{
  previous: []
  next: []
}>()

function handlePrevious() {
  if (!props.canPrevious) {
    return
  }
  emit('previous')
}

function handleNext() {
  if (!props.canNext) {
    return
  }
  emit('next')
}
</script>

<template>
  <nav class="app-pagination" aria-label="Paginação">
    <AppIconButton
      class="app-pagination__button app-pagination__button--previous"
      variant="ghost"
      icon="arrow-left"
      :ariaLabel="previousLabel"
      :disabled="!canPrevious"
      @click="handlePrevious"
    />
    <AppIconButton
      class="app-pagination__button app-pagination__button--next"
      variant="ghost"
      icon="arrow-right"
      :ariaLabel="nextLabel"
      :disabled="!canNext"
      @click="handleNext"
    />
  </nav>
</template>

<style scoped>
.app-pagination {
  --app-pagination-gap: var(--spacing-0);

  display: inline-flex;
  align-items: center;
  gap: var(--app-pagination-gap);
}
</style>
