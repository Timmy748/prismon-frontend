<script setup lang="ts">
import { computed, useId } from 'vue'
import { IconButton } from '../buttons'
import { useIsMobile } from '../composables/useIsMobile'
import Drawer from './Drawer.vue'
import { useEscapeKey } from './useEscapeKey'
import { hasOverlayPortalRoot, useOverlayBackdropBlur } from './useOverlayBackdropBlur'

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

const isMobile = useIsMobile()
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

const canTeleportOverlay = hasOverlayPortalRoot()
useOverlayBackdropBlur(() => props.open && !isMobile.value)
useEscapeKey(() => props.open && !isMobile.value, handleClose)
</script>

<template>
  <Drawer
    v-if="isMobile"
    :open="open"
    direction="bottom"
    :close-on-backdrop="closeOnBackdrop"
    :aria-label="title"
    @close="emit('close')"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <header class="sheet__header sheet__header--drawer">
        <h2 :id="titleId" class="sheet__title">{{ title }}</h2>
        <IconButton variant="ghost" icon="close" :ariaLabel="closeLabel" @click="handleClose" />
      </header>
    </template>

    <div class="sheet__drawer-content">
      <div v-if="$slots.preview" class="sheet__drawer-preview">
        <slot name="preview" />
      </div>
      <div class="sheet__drawer-body">
        <slot />
      </div>
    </div>
  </Drawer>

  <Teleport v-else to="#prismon-overlay-root" :disabled="!canTeleportOverlay">
    <Transition name="sheet">
      <div v-if="open" :class="sheetClasses">
        <div class="sheet__backdrop" @click.self="handleBackdropClick">
          <div v-if="$slots.preview" class="sheet__stage" @click.self="handleBackdropClick">
            <div class="sheet__preview-frame">
              <slot name="preview" />
            </div>
          </div>
          <aside class="sheet__panel" role="dialog" aria-modal="true" :aria-labelledby="titleId">
            <header class="sheet__header">
              <h2 :id="titleId" class="sheet__title">{{ title }}</h2>
              <IconButton
                variant="ghost"
                icon="close"
                :ariaLabel="closeLabel"
                @click="handleClose"
              />
            </header>

            <div class="sheet__body">
              <slot />
            </div>
          </aside>
        </div>
      </div>
    </Transition>
  </Teleport>
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
  --sheet-stage-padding: var(--spacing-7);
  --sheet-preview-max-width: 600px;
  --sheet-preview-scale-closed: var(--scale-modal-closed);
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

.sheet__stage {
  flex: 1;
  min-width: var(--spacing-0);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sheet-stage-padding);
  box-sizing: border-box;
  overflow: hidden;
}

.sheet__preview-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: var(--sheet-preview-max-width);
  max-height: 100%;
  transform-origin: center;
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

.sheet__header--drawer {
  --sheet-header-gap: var(--spacing-4);
  --sheet-title-color: var(--text-primary);
  --sheet-title-font-family: var(--type-heading-03-font-family);
  --sheet-title-font-size: var(--type-heading-03-font-size);
  --sheet-title-line-height: var(--type-heading-03-line-height);
  --sheet-title-font-weight: var(--type-heading-03-font-weight);
  --sheet-title-text-transform: var(--type-heading-03-text-transform);
}

.sheet__drawer-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
  width: 100%;
  min-width: var(--spacing-0);
}

.sheet__drawer-preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: var(--spacing-0);
}

.sheet__drawer-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: var(--spacing-0);
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

.sheet-enter-active .sheet__preview-frame,
.sheet-leave-active .sheet__preview-frame {
  transition:
    opacity var(--sheet-backdrop-transition-duration) var(--sheet-backdrop-transition-easing),
    transform var(--sheet-backdrop-transition-duration) var(--sheet-backdrop-transition-easing);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: var(--sheet-opacity-closed);
}

.sheet-enter-from .sheet__panel,
.sheet-leave-to .sheet__panel {
  transform: var(--sheet-transform-closed);
}

.sheet-enter-from .sheet__preview-frame,
.sheet-leave-to .sheet__preview-frame {
  opacity: var(--sheet-opacity-closed);
  transform: scale(var(--sheet-preview-scale-closed));
}

@media (max-width: 767px) {
  .sheet__backdrop {
    flex-direction: column;
    justify-content: flex-end;
  }

  .sheet__stage {
    flex: 0 0 auto;
    height: auto;
    max-height: 36dvh;
    padding: var(--spacing-4);
  }

  .sheet__panel {
    flex: 1 1 auto;
    max-width: 100%;
    height: auto;
    min-height: var(--spacing-0);
    border-left: none;
    border-top: var(--sheet-border-width) solid var(--sheet-border-color);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet {
    --sheet-transform-closed: none;
    --sheet-preview-scale-closed: 1;
    --sheet-transition-duration: var(--duration-normal);
    --sheet-backdrop-transition-duration: var(--duration-normal);
  }
}
</style>
