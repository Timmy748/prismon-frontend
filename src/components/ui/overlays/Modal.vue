<script setup lang="ts">
import { computed, useId } from 'vue'
import { IconButton } from '../buttons'
import { useEscapeKey } from './useEscapeKey'
import { hasOverlayPortalRoot, useOverlayBackdropBlur } from './useOverlayBackdropBlur'

export type ModalSize = 'sm' | 'md' | 'lg'

interface Props {
  open: boolean
  title: string
  subtitle?: string
  size?: ModalSize
  closeOnBackdrop?: boolean
  closeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  closeOnBackdrop: true,
  closeLabel: 'Fechar modal',
})

const emit = defineEmits<{
  close: []
  'update:open': [value: boolean]
}>()

const uid = useId()
const titleId = `modal-title-${uid}`
const subtitleId = `modal-subtitle-${uid}`

const modalClasses = computed(() => ['modal', `modal--${props.size}`])

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
useOverlayBackdropBlur(() => props.open)
useEscapeKey(() => props.open, handleClose)
</script>

<template>
  <Teleport to="#prismon-overlay-root" :disabled="!canTeleportOverlay">
    <Transition name="modal">
      <div v-if="open" :class="modalClasses">
        <div class="modal__backdrop" @click.self="handleBackdropClick">
          <div
            class="modal__dialog"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="subtitle ? subtitleId : undefined"
          >
            <header class="modal__header">
              <div class="modal__titles">
                <h2 :id="titleId" class="modal__title">{{ title }}</h2>
                <p v-if="subtitle" :id="subtitleId" class="modal__subtitle">{{ subtitle }}</p>
              </div>
              <IconButton
                variant="ghost"
                icon="close"
                :ariaLabel="closeLabel"
                @click="handleClose"
              />
            </header>

            <div class="modal__body">
              <slot />
            </div>

            <footer v-if="$slots.footer" class="modal__footer">
              <slot name="footer" />
            </footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  --modal-z-index: var(--z-modal);
  --modal-backdrop-bg: var(--surface-backdrop);
  --modal-viewport-padding: var(--spacing-5);
  --modal-width: 360px;
  --modal-dialog-height: auto;
  --modal-bg: var(--surface-elevated);
  --modal-border-color: var(--border-subtle-1);
  --modal-border-width: var(--border-width-thin);
  --modal-radius: var(--radius-none);
  --modal-padding-top: var(--spacing-5);
  --modal-padding-x: var(--spacing-5);
  --modal-padding-bottom: var(--spacing-7);
  --modal-gap: var(--spacing-5);
  --modal-header-gap: var(--spacing-4);
  --modal-title-gap: var(--spacing-2);
  --modal-body-flex: 0 1 auto;
  --modal-body-max-height: 320px;
  --modal-footer-gap: var(--spacing-3);
  --modal-title-color: var(--text-primary);
  --modal-title-font-family: var(--type-heading-03-font-family);
  --modal-title-font-size: var(--type-heading-03-font-size);
  --modal-title-line-height: var(--type-heading-03-line-height);
  --modal-title-font-weight: var(--type-heading-03-font-weight);
  --modal-title-text-transform: var(--type-heading-03-text-transform);
  --modal-subtitle-color: var(--text-secondary);
  --modal-subtitle-font-family: var(--type-label-01-font-family);
  --modal-subtitle-font-size: var(--type-label-01-font-size);
  --modal-subtitle-line-height: var(--type-label-01-line-height);
  --modal-subtitle-font-weight: var(--type-label-01-font-weight);
  --modal-subtitle-text-transform: var(--type-label-01-text-transform);
  --modal-opacity-closed: var(--opacity-hidden);
  --modal-scale-closed: var(--scale-modal-closed);
  --modal-dialog-transform-closed: scale(var(--modal-scale-closed));
  --modal-transition-duration: var(--duration-modal);
  --modal-transition-easing: var(--easing-out);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--modal-z-index);
}

.modal--sm {
  --modal-width: 360px;
}

.modal--md {
  --modal-width: 713px;
  --modal-body-max-height: min(64dvh, 560px);
}

.modal--lg {
  --modal-width: min(960px, calc(100vw - var(--spacing-8)));
  --modal-body-max-height: min(76dvh, 700px);
}

.modal__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--modal-z-index);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--modal-viewport-padding);
  box-sizing: border-box;
  background-color: var(--modal-backdrop-bg);
}

.modal__dialog {
  display: flex;
  flex-direction: column;
  gap: var(--modal-gap);
  width: 100%;
  max-width: var(--modal-width);
  height: var(--modal-dialog-height);
  padding: var(--modal-padding-top) var(--modal-padding-x) var(--modal-padding-bottom)
    var(--modal-padding-x);
  box-sizing: border-box;
  background-color: var(--modal-bg);
  border: var(--modal-border-width) solid var(--modal-border-color);
  border-radius: var(--modal-radius);
  transform-origin: center;
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--modal-header-gap);
  flex-shrink: 0;
}

.modal__titles {
  display: flex;
  flex-direction: column;
  gap: var(--modal-title-gap);
  min-width: var(--spacing-0);
}

.modal__title {
  margin: var(--spacing-0);
  color: var(--modal-title-color);
  font-family: var(--modal-title-font-family);
  font-size: var(--modal-title-font-size);
  line-height: var(--modal-title-line-height);
  font-weight: var(--modal-title-font-weight);
  text-transform: var(--modal-title-text-transform);
}

.modal__subtitle {
  margin: var(--spacing-0);
  color: var(--modal-subtitle-color);
  font-family: var(--modal-subtitle-font-family);
  font-size: var(--modal-subtitle-font-size);
  line-height: var(--modal-subtitle-line-height);
  font-weight: var(--modal-subtitle-font-weight);
  text-transform: var(--modal-subtitle-text-transform);
}

.modal__body {
  flex: var(--modal-body-flex);
  min-height: var(--spacing-0);
  max-height: var(--modal-body-max-height);
  overflow-y: auto;
}

.modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--modal-footer-gap);
  flex-shrink: 0;
}

@media (max-width: 767px) {
  .modal,
  .modal--sm,
  .modal--md,
  .modal--lg {
    --modal-viewport-padding: var(--spacing-0);
    --modal-width: 100%;
    --modal-dialog-height: 100%;
    --modal-border-width: var(--border-width-none);
    --modal-radius: var(--radius-none);
    --modal-body-flex: 1 1 auto;
    --modal-body-max-height: none;
    --modal-dialog-transform-closed: translateY(var(--spacing-5));
    --modal-transition-easing: var(--easing-drawer);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--modal-transition-duration) var(--modal-transition-easing);
}

.modal-enter-active .modal__dialog,
.modal-leave-active .modal__dialog {
  transition:
    opacity var(--modal-transition-duration) var(--modal-transition-easing),
    transform var(--modal-transition-duration) var(--modal-transition-easing);
}

.modal-enter-from,
.modal-leave-to {
  opacity: var(--modal-opacity-closed);
}

.modal-enter-from .modal__dialog,
.modal-leave-to .modal__dialog {
  opacity: var(--modal-opacity-closed);
  transform: var(--modal-dialog-transform-closed);
}

@media (prefers-reduced-motion: reduce) {
  .modal,
  .modal--sm,
  .modal--md,
  .modal--lg {
    --modal-dialog-transform-closed: none;
    --modal-transition-duration: var(--duration-normal);
  }
}
</style>
