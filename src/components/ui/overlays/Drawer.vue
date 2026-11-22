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
  <Transition name="drawer">
    <div v-if="open" class="drawer">
      <div class="drawer__backdrop" @click.self="handleBackdropClick">
        <div class="drawer__panel" role="dialog" aria-modal="true" :aria-label="ariaLabel">
          <span class="drawer__handle" aria-hidden="true" />
          <div class="drawer__body">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer {
  --drawer-z-index: var(--z-drawer);
  --drawer-backdrop-bg: var(--surface-backdrop);
  --drawer-max-width: 484px;
  --drawer-bg: var(--surface-elevated);
  --drawer-border-color: var(--border-subtle-1);
  --drawer-border-width: var(--border-width-thin);
  --drawer-radius: var(--radius-none);
  --drawer-padding-top: var(--spacing-4);
  --drawer-padding-x: var(--spacing-3);
  --drawer-padding-bottom: var(--spacing-6);
  --drawer-gap: var(--spacing-5);
  --drawer-handle-width: 48px;
  --drawer-handle-height: 8px;
  --drawer-handle-radius: var(--radius-sm);
  --drawer-handle-bg: var(--surface-handle);
  --drawer-opacity-closed: var(--opacity-hidden);
  --drawer-transition-duration: var(--duration-normal);
  --drawer-transition-easing: var(--easing-standard);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--drawer-z-index);
}

.drawer__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--drawer-z-index);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: var(--drawer-backdrop-bg);
}

.drawer__panel {
  display: flex;
  flex-direction: column;
  gap: var(--drawer-gap);
  width: 100%;
  max-width: var(--drawer-max-width);
  padding: var(--drawer-padding-top) var(--drawer-padding-x) var(--drawer-padding-bottom)
    var(--drawer-padding-x);
  box-sizing: border-box;
  background-color: var(--drawer-bg);
  border: var(--drawer-border-width) solid var(--drawer-border-color);
  border-radius: var(--drawer-radius);
}

.drawer__handle {
  align-self: center;
  flex-shrink: 0;
  width: var(--drawer-handle-width);
  height: var(--drawer-handle-height);
  border-radius: var(--drawer-handle-radius);
  background-color: var(--drawer-handle-bg);
}

.drawer__body {
  overflow-y: auto;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity var(--drawer-transition-duration) var(--drawer-transition-easing);
}

.drawer-enter-active .drawer__panel,
.drawer-leave-active .drawer__panel {
  transition: transform var(--drawer-transition-duration) var(--drawer-transition-easing);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: var(--drawer-opacity-closed);
}

.drawer-enter-from .drawer__panel,
.drawer-leave-to .drawer__panel {
  transform: translateY(100%);
}
</style>
