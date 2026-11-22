<script setup lang="ts">
import { useId } from 'vue'
import { Button } from '../buttons'
import { useIsMobile } from '../composables/useIsMobile'
import Drawer from './Drawer.vue'
import { useEscapeKey } from './useEscapeKey'
import { hasOverlayPortalRoot, useOverlayBackdropBlur } from './useOverlayBackdropBlur'

export type ConfirmDialogVariant = 'primary' | 'danger'

interface Props {
  open: boolean
  title: string
  description: string
  cancelLabel?: string
  confirmLabel?: string
  confirmVariant?: ConfirmDialogVariant
}

const props = withDefaults(defineProps<Props>(), {
  cancelLabel: 'Cancelar',
  confirmLabel: 'Confirmar',
  confirmVariant: 'primary',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
  'update:open': [value: boolean]
}>()

const uid = useId()
const titleId = `confirm-dialog-title-${uid}`
const descriptionId = `confirm-dialog-description-${uid}`

const isMobile = useIsMobile()

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}

const canTeleportOverlay = hasOverlayPortalRoot()
useOverlayBackdropBlur(() => props.open && !isMobile.value)
useEscapeKey(() => props.open && !isMobile.value, handleCancel)
</script>

<template>
  <Drawer
    v-if="isMobile"
    :open="open"
    direction="bottom"
    :aria-label="title"
    @close="emit('cancel')"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="confirm-dialog__drawer-header">
        <h2 :id="titleId" class="confirm-dialog__title confirm-dialog__title--drawer">
          {{ title }}
        </h2>
      </div>
    </template>

    <p :id="descriptionId" class="confirm-dialog__description confirm-dialog__description--drawer">
      {{ description }}
    </p>

    <template #footer>
      <footer class="confirm-dialog__footer confirm-dialog__footer--drawer">
        <Button :variant="confirmVariant" full-width @click="emit('confirm')">
          {{ confirmLabel }}
        </Button>
        <Button variant="tertiary" full-width @click="handleCancel">{{ cancelLabel }}</Button>
      </footer>
    </template>
  </Drawer>

  <Teleport v-else to="#prismon-overlay-root" :disabled="!canTeleportOverlay">
    <Transition name="confirm-dialog">
      <div v-if="open" class="confirm-dialog">
        <div class="confirm-dialog__backdrop" @click.self="handleCancel">
          <div
            class="confirm-dialog__dialog"
            role="alertdialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="descriptionId"
          >
            <div class="confirm-dialog__content">
              <h2 :id="titleId" class="confirm-dialog__title">{{ title }}</h2>
              <p :id="descriptionId" class="confirm-dialog__description">{{ description }}</p>
            </div>

            <footer class="confirm-dialog__footer">
              <Button variant="tertiary" @click="handleCancel">{{ cancelLabel }}</Button>
              <Button :variant="confirmVariant" @click="emit('confirm')">
                {{ confirmLabel }}
              </Button>
            </footer>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-dialog {
  --confirm-dialog-z-index: var(--z-modal);
  --confirm-dialog-backdrop-bg: var(--surface-backdrop);
  --confirm-dialog-viewport-padding: var(--spacing-5);
  --confirm-dialog-width: 360px;
  --confirm-dialog-bg: var(--surface-elevated);
  --confirm-dialog-border-color: var(--border-subtle-1);
  --confirm-dialog-border-width: var(--border-width-thin);
  --confirm-dialog-radius: var(--radius-none);
  --confirm-dialog-padding-y: var(--spacing-5);
  --confirm-dialog-padding-x: var(--spacing-6);
  --confirm-dialog-gap: var(--spacing-6);
  --confirm-dialog-content-gap: var(--spacing-2);
  --confirm-dialog-actions-gap: var(--spacing-3);
  --confirm-dialog-title-color: var(--text-primary);
  --confirm-dialog-title-font-family: var(--type-heading-02-font-family);
  --confirm-dialog-title-font-size: var(--type-heading-02-font-size);
  --confirm-dialog-title-line-height: var(--type-heading-02-line-height);
  --confirm-dialog-title-font-weight: var(--type-heading-02-font-weight);
  --confirm-dialog-title-text-transform: var(--type-heading-02-text-transform);
  --confirm-dialog-description-color: var(--text-primary);
  --confirm-dialog-description-font-family: var(--type-body-compact-02-font-family);
  --confirm-dialog-description-font-size: var(--type-body-compact-02-font-size);
  --confirm-dialog-description-line-height: var(--type-body-compact-02-line-height);
  --confirm-dialog-description-font-weight: var(--type-body-compact-02-font-weight);
  --confirm-dialog-description-text-transform: var(--type-body-compact-02-text-transform);
  --confirm-dialog-opacity-closed: var(--opacity-hidden);
  --confirm-dialog-scale-closed: var(--scale-modal-closed);
  --confirm-dialog-transform-closed: scale(var(--confirm-dialog-scale-closed));
  --confirm-dialog-transition-duration: var(--duration-modal);
  --confirm-dialog-transition-easing: var(--easing-out);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--confirm-dialog-z-index);
}

.confirm-dialog__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--confirm-dialog-z-index);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--confirm-dialog-viewport-padding);
  box-sizing: border-box;
  background-color: var(--confirm-dialog-backdrop-bg);
}

.confirm-dialog__dialog {
  display: flex;
  flex-direction: column;
  gap: var(--confirm-dialog-gap);
  width: 100%;
  max-width: var(--confirm-dialog-width);
  padding: var(--confirm-dialog-padding-y) var(--confirm-dialog-padding-x);
  box-sizing: border-box;
  background-color: var(--confirm-dialog-bg);
  border: var(--confirm-dialog-border-width) solid var(--confirm-dialog-border-color);
  border-radius: var(--confirm-dialog-radius);
  transform-origin: center;
}

.confirm-dialog__content {
  display: flex;
  flex-direction: column;
  gap: var(--confirm-dialog-content-gap);
}

.confirm-dialog__title {
  margin: var(--spacing-0);
  color: var(--confirm-dialog-title-color);
  font-family: var(--confirm-dialog-title-font-family);
  font-size: var(--confirm-dialog-title-font-size);
  line-height: var(--confirm-dialog-title-line-height);
  font-weight: var(--confirm-dialog-title-font-weight);
  text-transform: var(--confirm-dialog-title-text-transform);
}

.confirm-dialog__description {
  margin: var(--spacing-0);
  color: var(--confirm-dialog-description-color);
  font-family: var(--confirm-dialog-description-font-family);
  font-size: var(--confirm-dialog-description-font-size);
  line-height: var(--confirm-dialog-description-line-height);
  font-weight: var(--confirm-dialog-description-font-weight);
  text-transform: var(--confirm-dialog-description-text-transform);
}

.confirm-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--confirm-dialog-actions-gap);
}

.confirm-dialog__title--drawer {
  --confirm-dialog-title-color: var(--text-primary);
  --confirm-dialog-title-font-family: var(--type-heading-02-font-family);
  --confirm-dialog-title-font-size: var(--type-heading-02-font-size);
  --confirm-dialog-title-line-height: var(--type-heading-02-line-height);
  --confirm-dialog-title-font-weight: var(--type-heading-02-font-weight);
  --confirm-dialog-title-text-transform: var(--type-heading-02-text-transform);
}

.confirm-dialog__description--drawer {
  --confirm-dialog-description-color: var(--text-primary);
  --confirm-dialog-description-font-family: var(--type-body-compact-02-font-family);
  --confirm-dialog-description-font-size: var(--type-body-compact-02-font-size);
  --confirm-dialog-description-line-height: var(--type-body-compact-02-line-height);
  --confirm-dialog-description-font-weight: var(--type-body-compact-02-font-weight);
  --confirm-dialog-description-text-transform: var(--type-body-compact-02-text-transform);
}

.confirm-dialog__footer--drawer {
  --confirm-dialog-actions-gap: var(--spacing-3);
  flex-direction: column;
  align-items: stretch;
  width: 100%;
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity var(--confirm-dialog-transition-duration)
    var(--confirm-dialog-transition-easing);
}

.confirm-dialog-enter-active .confirm-dialog__dialog,
.confirm-dialog-leave-active .confirm-dialog__dialog {
  transition:
    opacity var(--confirm-dialog-transition-duration) var(--confirm-dialog-transition-easing),
    transform var(--confirm-dialog-transition-duration) var(--confirm-dialog-transition-easing);
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: var(--confirm-dialog-opacity-closed);
}

.confirm-dialog-enter-from .confirm-dialog__dialog,
.confirm-dialog-leave-to .confirm-dialog__dialog {
  opacity: var(--confirm-dialog-opacity-closed);
  transform: var(--confirm-dialog-transform-closed);
}

@media (prefers-reduced-motion: reduce) {
  .confirm-dialog {
    --confirm-dialog-transform-closed: none;
    --confirm-dialog-transition-duration: var(--duration-normal);
  }
}
</style>
