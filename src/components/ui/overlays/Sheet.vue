<script setup lang="ts">
import { computed, useId } from 'vue'
import { IconButton } from '../buttons'
import { useEscapeKey } from './useEscapeKey'

export type SheetSize = 'md' | 'lg'

interface Props {
  open: boolean
  title: string
  size?: SheetSize
  closeOnBackdrop?: boolean
  closeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnBackdrop: true,
  closeLabel: 'Fechar painel',
})

const emit = defineEmits<{
  close: []
  'update:open': [value: boolean]
}>()

const uid = useId()
const titleId = `sheet-title-${uid}`

const sheetClasses = computed(() => ['sheet', `sheet--${props.size}`])

function handleClose() {
  emit('close')
  emit('update:open', false)
}

function handleBackdropClick() {
  if (!props.closeOnBackdrop) {
    return
  }
  handleClose()
}

useEscapeKey(() => props.open, handleClose)
</script>

<template>
  <Transition name="sheet">
    <div v-if="open" :class="sheetClasses">
      <div class="sheet__backdrop" @click.self="handleBackdropClick">
        <aside class="sheet__panel" role="dialog" aria-modal="true" :aria-labelledby="titleId">
          <header class="sheet__header">
            <h2 :id="titleId" class="sheet__title">{{ title }}</h2>
            <IconButton variant="ghost" icon="close" :ariaLabel="closeLabel" @click="handleClose" />
          </header>

          <div class="sheet__body">
            <slot />
          </div>
        </aside>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sheet {
  --sheet-z-index: var(--z-sheet);
  --sheet-backdrop-bg: var(--surface-backdrop);
  --sheet-width: 443px;
  --sheet-bg: var(--surface-elevated);
  --sheet-border-color: var(--border-subtle-1);
  --sheet-border-width: var(--border-width-thin);
  --sheet-padding-top: var(--spacing-5);
  --sheet-padding-x: var(--spacing-5);
  --sheet-padding-bottom: var(--spacing-7);
  --sheet-gap: var(--spacing-5);
  --sheet-header-gap: var(--spacing-4);
  --sheet-title-color: var(--text-primary);
  --sheet-title-font-family: var(--type-heading-03-font-family);
  --sheet-title-font-size: var(--type-heading-03-font-size);
  --sheet-title-line-height: var(--type-heading-03-line-height);
  --sheet-title-font-weight: var(--type-heading-03-font-weight);
  --sheet-title-text-transform: var(--type-heading-03-text-transform);
  --sheet-opacity-closed: var(--opacity-hidden);
  --sheet-transform-closed: translateX(100%);
  --sheet-transition-duration: var(--duration-drawer);
  --sheet-backdrop-transition-duration: var(--duration-modal);
  --sheet-transition-easing: var(--easing-drawer);
  --sheet-backdrop-transition-easing: var(--easing-out);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--sheet-z-index);
}

.sheet--md {
  --sheet-width: 443px;
}

.sheet--lg {
  --sheet-width: 632px;
}

.sheet__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--sheet-z-index);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  background-color: var(--sheet-backdrop-bg);
}

.sheet__panel {
  display: flex;
  flex-direction: column;
  gap: var(--sheet-gap);
  width: 100%;
  max-width: var(--sheet-width);
  height: 100%;
  padding: var(--sheet-padding-top) var(--sheet-padding-x) var(--sheet-padding-bottom)
    var(--sheet-padding-x);
  box-sizing: border-box;
  background-color: var(--sheet-bg);
  border-left: var(--sheet-border-width) solid var(--sheet-border-color);
}

.sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sheet-header-gap);
}

.sheet__title {
  margin: var(--spacing-0);
  color: var(--sheet-title-color);
  font-family: var(--sheet-title-font-family);
  font-size: var(--sheet-title-font-size);
  line-height: var(--sheet-title-line-height);
  font-weight: var(--sheet-title-font-weight);
  text-transform: var(--sheet-title-text-transform);
}

.sheet__body {
  flex: 1;
  min-height: var(--spacing-0);
  overflow-y: auto;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--sheet-backdrop-transition-duration)
    var(--sheet-backdrop-transition-easing);
}

.sheet-enter-active .sheet__panel,
.sheet-leave-active .sheet__panel {
  transition: transform var(--sheet-transition-duration) var(--sheet-transition-easing);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: var(--sheet-opacity-closed);
}

.sheet-enter-from .sheet__panel,
.sheet-leave-to .sheet__panel {
  transform: var(--sheet-transform-closed);
}

@media (prefers-reduced-motion: reduce) {
  .sheet {
    --sheet-transform-closed: none;
    --sheet-transition-duration: var(--duration-normal);
    --sheet-backdrop-transition-duration: var(--duration-normal);
  }
}
</style>
