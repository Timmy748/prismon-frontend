<script setup lang="ts">
import { computed, useId } from 'vue'
import { AppIconButton } from '../buttons'
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
const titleId = `app-sheet-title-${uid}`

const sheetClasses = computed(() => ['app-sheet', `app-sheet--${props.size}`])

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
  <Transition name="app-sheet">
    <div v-if="open" :class="sheetClasses">
      <div class="app-sheet__backdrop" @click.self="handleBackdropClick">
        <aside class="app-sheet__panel" role="dialog" aria-modal="true" :aria-labelledby="titleId">
          <header class="app-sheet__header">
            <h2 :id="titleId" class="app-sheet__title">{{ title }}</h2>
            <AppIconButton
              variant="ghost"
              icon="close"
              :ariaLabel="closeLabel"
              @click="handleClose"
            />
          </header>

          <div class="app-sheet__body">
            <slot />
          </div>
        </aside>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.app-sheet {
  --app-sheet-z-index: var(--z-sheet);
  --app-sheet-backdrop-bg: var(--surface-backdrop);
  --app-sheet-backdrop-blur: var(--blur-backdrop);
  --app-sheet-width: var(--size-sheet-width);
  --app-sheet-bg: var(--surface-elevated);
  --app-sheet-border-color: var(--border-subtle-1);
  --app-sheet-border-width: var(--border-width-thin);
  --app-sheet-padding-top: var(--spacing-5);
  --app-sheet-padding-x: var(--spacing-5);
  --app-sheet-padding-bottom: var(--spacing-7);
  --app-sheet-gap: var(--spacing-5);
  --app-sheet-header-gap: var(--spacing-4);
  --app-sheet-title-color: var(--text-primary);
  --app-sheet-title-font-family: var(--type-heading-03-font-family);
  --app-sheet-title-font-size: var(--type-heading-03-font-size);
  --app-sheet-title-line-height: var(--type-heading-03-line-height);
  --app-sheet-title-font-weight: var(--type-heading-03-font-weight);
  --app-sheet-title-text-transform: var(--type-heading-03-text-transform);
  --app-sheet-opacity-closed: var(--opacity-hidden);
  --app-sheet-transition-duration: var(--duration-normal);
  --app-sheet-transition-easing: var(--easing-standard);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--app-sheet-z-index);
}

.app-sheet--md {
  --app-sheet-width: var(--size-sheet-width);
}

.app-sheet--lg {
  --app-sheet-width: var(--size-sheet-width-lg);
}

.app-sheet__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--app-sheet-z-index);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  background-color: var(--app-sheet-backdrop-bg);
  backdrop-filter: blur(var(--app-sheet-backdrop-blur));
}

.app-sheet__panel {
  display: flex;
  flex-direction: column;
  gap: var(--app-sheet-gap);
  width: 100%;
  max-width: var(--app-sheet-width);
  height: 100%;
  padding: var(--app-sheet-padding-top) var(--app-sheet-padding-x) var(--app-sheet-padding-bottom)
    var(--app-sheet-padding-x);
  box-sizing: border-box;
  background-color: var(--app-sheet-bg);
  border-left: var(--app-sheet-border-width) solid var(--app-sheet-border-color);
}

.app-sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-sheet-header-gap);
}

.app-sheet__title {
  margin: var(--spacing-0);
  color: var(--app-sheet-title-color);
  font-family: var(--app-sheet-title-font-family);
  font-size: var(--app-sheet-title-font-size);
  line-height: var(--app-sheet-title-line-height);
  font-weight: var(--app-sheet-title-font-weight);
  text-transform: var(--app-sheet-title-text-transform);
}

.app-sheet__body {
  flex: 1;
  min-height: var(--spacing-0);
  overflow-y: auto;
}

.app-sheet-enter-active,
.app-sheet-leave-active {
  transition: opacity var(--app-sheet-transition-duration) var(--app-sheet-transition-easing);
}

.app-sheet-enter-active .app-sheet__panel,
.app-sheet-leave-active .app-sheet__panel {
  transition: transform var(--app-sheet-transition-duration) var(--app-sheet-transition-easing);
}

.app-sheet-enter-from,
.app-sheet-leave-to {
  opacity: var(--app-sheet-opacity-closed);
}

.app-sheet-enter-from .app-sheet__panel,
.app-sheet-leave-to .app-sheet__panel {
  transform: translateX(100%);
}
</style>
