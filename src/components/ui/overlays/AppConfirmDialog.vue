<script setup lang="ts">
import { useId } from 'vue'
import { AppButton } from '../buttons'
import { useEscapeKey } from './useEscapeKey'

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
const titleId = `app-confirm-dialog-title-${uid}`
const descriptionId = `app-confirm-dialog-description-${uid}`

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}

useEscapeKey(() => props.open, handleCancel)
</script>

<template>
  <Transition name="app-confirm-dialog">
    <div v-if="open" class="app-confirm-dialog">
      <div class="app-confirm-dialog__backdrop" @click.self="handleCancel">
        <div
          class="app-confirm-dialog__dialog"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId"
        >
          <div class="app-confirm-dialog__content">
            <h2 :id="titleId" class="app-confirm-dialog__title">{{ title }}</h2>
            <p :id="descriptionId" class="app-confirm-dialog__description">{{ description }}</p>
          </div>

          <footer class="app-confirm-dialog__footer">
            <AppButton variant="ghost" @click="handleCancel">{{ cancelLabel }}</AppButton>
            <AppButton :variant="confirmVariant" @click="emit('confirm')">
              {{ confirmLabel }}
            </AppButton>
          </footer>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.app-confirm-dialog {
  --app-confirm-dialog-z-index: var(--z-modal);
  --app-confirm-dialog-backdrop-bg: var(--surface-backdrop);
  --app-confirm-dialog-backdrop-blur: var(--blur-backdrop);
  --app-confirm-dialog-viewport-padding: var(--spacing-5);
  --app-confirm-dialog-width: var(--size-modal-sm);
  --app-confirm-dialog-bg: var(--surface-elevated);
  --app-confirm-dialog-border-color: var(--border-subtle-1);
  --app-confirm-dialog-border-width: var(--border-width-thin);
  --app-confirm-dialog-radius: var(--radius-none);
  --app-confirm-dialog-padding-y: var(--spacing-5);
  --app-confirm-dialog-padding-x: var(--spacing-6);
  --app-confirm-dialog-gap: var(--spacing-6);
  --app-confirm-dialog-content-gap: var(--spacing-2);
  --app-confirm-dialog-actions-gap: var(--spacing-3);
  --app-confirm-dialog-title-color: var(--text-primary);
  --app-confirm-dialog-title-font-family: var(--type-heading-02-font-family);
  --app-confirm-dialog-title-font-size: var(--type-heading-02-font-size);
  --app-confirm-dialog-title-line-height: var(--type-heading-02-line-height);
  --app-confirm-dialog-title-font-weight: var(--type-heading-02-font-weight);
  --app-confirm-dialog-title-text-transform: var(--type-heading-02-text-transform);
  --app-confirm-dialog-description-color: var(--text-primary);
  --app-confirm-dialog-description-font-family: var(--type-body-compact-02-font-family);
  --app-confirm-dialog-description-font-size: var(--type-body-compact-02-font-size);
  --app-confirm-dialog-description-line-height: var(--type-body-compact-02-line-height);
  --app-confirm-dialog-description-font-weight: var(--type-body-compact-02-font-weight);
  --app-confirm-dialog-description-text-transform: var(--type-body-compact-02-text-transform);
  --app-confirm-dialog-opacity-closed: var(--opacity-hidden);
  --app-confirm-dialog-scale-closed: var(--scale-modal-closed);
  --app-confirm-dialog-transition-duration: var(--duration-normal);
  --app-confirm-dialog-transition-easing: var(--easing-standard);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--app-confirm-dialog-z-index);
}

.app-confirm-dialog__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--app-confirm-dialog-z-index);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-confirm-dialog-viewport-padding);
  box-sizing: border-box;
  background-color: var(--app-confirm-dialog-backdrop-bg);
  backdrop-filter: blur(var(--app-confirm-dialog-backdrop-blur));
}

.app-confirm-dialog__dialog {
  display: flex;
  flex-direction: column;
  gap: var(--app-confirm-dialog-gap);
  width: 100%;
  max-width: var(--app-confirm-dialog-width);
  padding: var(--app-confirm-dialog-padding-y) var(--app-confirm-dialog-padding-x);
  box-sizing: border-box;
  background-color: var(--app-confirm-dialog-bg);
  border: var(--app-confirm-dialog-border-width) solid var(--app-confirm-dialog-border-color);
  border-radius: var(--app-confirm-dialog-radius);
}

.app-confirm-dialog__content {
  display: flex;
  flex-direction: column;
  gap: var(--app-confirm-dialog-content-gap);
}

.app-confirm-dialog__title {
  margin: var(--spacing-0);
  color: var(--app-confirm-dialog-title-color);
  font-family: var(--app-confirm-dialog-title-font-family);
  font-size: var(--app-confirm-dialog-title-font-size);
  line-height: var(--app-confirm-dialog-title-line-height);
  font-weight: var(--app-confirm-dialog-title-font-weight);
  text-transform: var(--app-confirm-dialog-title-text-transform);
}

.app-confirm-dialog__description {
  margin: var(--spacing-0);
  color: var(--app-confirm-dialog-description-color);
  font-family: var(--app-confirm-dialog-description-font-family);
  font-size: var(--app-confirm-dialog-description-font-size);
  line-height: var(--app-confirm-dialog-description-line-height);
  font-weight: var(--app-confirm-dialog-description-font-weight);
  text-transform: var(--app-confirm-dialog-description-text-transform);
}

.app-confirm-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--app-confirm-dialog-actions-gap);
}

.app-confirm-dialog-enter-active,
.app-confirm-dialog-leave-active {
  transition: opacity var(--app-confirm-dialog-transition-duration)
    var(--app-confirm-dialog-transition-easing);
}

.app-confirm-dialog-enter-active .app-confirm-dialog__dialog,
.app-confirm-dialog-leave-active .app-confirm-dialog__dialog {
  transition:
    opacity var(--app-confirm-dialog-transition-duration)
      var(--app-confirm-dialog-transition-easing),
    transform var(--app-confirm-dialog-transition-duration)
      var(--app-confirm-dialog-transition-easing);
}

.app-confirm-dialog-enter-from,
.app-confirm-dialog-leave-to {
  opacity: var(--app-confirm-dialog-opacity-closed);
}

.app-confirm-dialog-enter-from .app-confirm-dialog__dialog,
.app-confirm-dialog-leave-to .app-confirm-dialog__dialog {
  opacity: var(--app-confirm-dialog-opacity-closed);
  transform: scale(var(--app-confirm-dialog-scale-closed));
}
</style>
