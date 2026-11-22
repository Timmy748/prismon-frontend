<script setup lang="ts">
import { useEscapeKey } from './useEscapeKey'

interface Props {
  open: boolean
  ariaLabel?: string
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  ariaLabel: 'Gaveta',
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  close: []
  'update:open': [value: boolean]
}>()

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
  <Transition name="app-drawer">
    <div v-if="open" class="app-drawer">
      <div class="app-drawer__backdrop" @click.self="handleBackdropClick">
        <div class="app-drawer__panel" role="dialog" aria-modal="true" :aria-label="ariaLabel">
          <span class="app-drawer__handle" aria-hidden="true" />
          <div class="app-drawer__body">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.app-drawer {
  --app-drawer-z-index: var(--z-drawer);
  --app-drawer-backdrop-bg: var(--surface-backdrop);
  --app-drawer-backdrop-blur: var(--blur-backdrop);
  --app-drawer-max-width: var(--size-drawer-max-width);
  --app-drawer-bg: var(--surface-elevated);
  --app-drawer-border-color: var(--border-subtle-1);
  --app-drawer-border-width: var(--border-width-thin);
  --app-drawer-radius: var(--radius-none);
  --app-drawer-padding-top: var(--spacing-4);
  --app-drawer-padding-x: var(--spacing-3);
  --app-drawer-padding-bottom: var(--spacing-6);
  --app-drawer-gap: var(--spacing-5);
  --app-drawer-handle-width: var(--size-handle-width);
  --app-drawer-handle-height: var(--size-handle-height);
  --app-drawer-handle-radius: var(--radius-sm);
  --app-drawer-handle-bg: var(--surface-handle);
  --app-drawer-opacity-closed: var(--opacity-hidden);
  --app-drawer-transition-duration: var(--duration-normal);
  --app-drawer-transition-easing: var(--easing-standard);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--app-drawer-z-index);
}

.app-drawer__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--app-drawer-z-index);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: var(--app-drawer-backdrop-bg);
  backdrop-filter: blur(var(--app-drawer-backdrop-blur));
}

.app-drawer__panel {
  display: flex;
  flex-direction: column;
  gap: var(--app-drawer-gap);
  width: 100%;
  max-width: var(--app-drawer-max-width);
  padding: var(--app-drawer-padding-top) var(--app-drawer-padding-x)
    var(--app-drawer-padding-bottom) var(--app-drawer-padding-x);
  box-sizing: border-box;
  background-color: var(--app-drawer-bg);
  border: var(--app-drawer-border-width) solid var(--app-drawer-border-color);
  border-radius: var(--app-drawer-radius);
}

.app-drawer__handle {
  align-self: center;
  flex-shrink: 0;
  width: var(--app-drawer-handle-width);
  height: var(--app-drawer-handle-height);
  border-radius: var(--app-drawer-handle-radius);
  background-color: var(--app-drawer-handle-bg);
}

.app-drawer__body {
  overflow-y: auto;
}

.app-drawer-enter-active,
.app-drawer-leave-active {
  transition: opacity var(--app-drawer-transition-duration) var(--app-drawer-transition-easing);
}

.app-drawer-enter-active .app-drawer__panel,
.app-drawer-leave-active .app-drawer__panel {
  transition: transform var(--app-drawer-transition-duration) var(--app-drawer-transition-easing);
}

.app-drawer-enter-from,
.app-drawer-leave-to {
  opacity: var(--app-drawer-opacity-closed);
}

.app-drawer-enter-from .app-drawer__panel,
.app-drawer-leave-to .app-drawer__panel {
  transform: translateY(100%);
}
</style>
