<script setup lang="ts">
import { computed, useId } from 'vue'
import { AppIconButton } from '../buttons'
import { useEscapeKey } from './useEscapeKey'

export type ModalSize = 'sm' | 'lg'

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
const titleId = `app-modal-title-${uid}`
const subtitleId = `app-modal-subtitle-${uid}`

const modalClasses = computed(() => ['app-modal', `app-modal--${props.size}`])

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
  <Transition name="app-modal">
    <div v-if="open" :class="modalClasses">
      <div class="app-modal__backdrop" @click.self="handleBackdropClick">
        <div
          class="app-modal__dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="subtitle ? subtitleId : undefined"
        >
          <header class="app-modal__header">
            <div class="app-modal__titles">
              <h2 :id="titleId" class="app-modal__title">{{ title }}</h2>
              <p v-if="subtitle" :id="subtitleId" class="app-modal__subtitle">{{ subtitle }}</p>
            </div>
            <AppIconButton
              variant="ghost"
              icon="close"
              :ariaLabel="closeLabel"
              @click="handleClose"
            />
          </header>

          <div class="app-modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="app-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.app-modal {
  --app-modal-z-index: var(--z-modal);
  --app-modal-backdrop-bg: var(--surface-backdrop);
  --app-modal-backdrop-blur: var(--blur-backdrop);
  --app-modal-viewport-padding: var(--spacing-5);
  --app-modal-width: var(--size-modal-sm);
  --app-modal-bg: var(--surface-elevated);
  --app-modal-border-color: var(--border-subtle-1);
  --app-modal-border-width: var(--border-width-thin);
  --app-modal-radius: var(--radius-none);
  --app-modal-padding-top: var(--spacing-5);
  --app-modal-padding-x: var(--spacing-5);
  --app-modal-padding-bottom: var(--spacing-7);
  --app-modal-gap: var(--spacing-5);
  --app-modal-header-gap: var(--spacing-4);
  --app-modal-title-gap: var(--spacing-2);
  --app-modal-body-max-height: var(--size-modal-body-max-height);
  --app-modal-footer-gap: var(--spacing-3);
  --app-modal-title-color: var(--text-primary);
  --app-modal-title-font-family: var(--type-heading-03-font-family);
  --app-modal-title-font-size: var(--type-heading-03-font-size);
  --app-modal-title-line-height: var(--type-heading-03-line-height);
  --app-modal-title-font-weight: var(--type-heading-03-font-weight);
  --app-modal-title-text-transform: var(--type-heading-03-text-transform);
  --app-modal-subtitle-color: var(--text-secondary);
  --app-modal-subtitle-font-family: var(--type-label-01-font-family);
  --app-modal-subtitle-font-size: var(--type-label-01-font-size);
  --app-modal-subtitle-line-height: var(--type-label-01-line-height);
  --app-modal-subtitle-font-weight: var(--type-label-01-font-weight);
  --app-modal-subtitle-text-transform: var(--type-label-01-text-transform);
  --app-modal-opacity-closed: var(--opacity-hidden);
  --app-modal-scale-closed: var(--scale-modal-closed);
  --app-modal-transition-duration: var(--duration-normal);
  --app-modal-transition-easing: var(--easing-standard);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--app-modal-z-index);
}

.app-modal--sm {
  --app-modal-width: var(--size-modal-sm);
}

.app-modal--lg {
  --app-modal-width: var(--size-modal-lg);
}

.app-modal__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--app-modal-z-index);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-modal-viewport-padding);
  box-sizing: border-box;
  background-color: var(--app-modal-backdrop-bg);
  backdrop-filter: blur(var(--app-modal-backdrop-blur));
}

.app-modal__dialog {
  display: flex;
  flex-direction: column;
  gap: var(--app-modal-gap);
  width: 100%;
  max-width: var(--app-modal-width);
  padding: var(--app-modal-padding-top) var(--app-modal-padding-x) var(--app-modal-padding-bottom)
    var(--app-modal-padding-x);
  box-sizing: border-box;
  background-color: var(--app-modal-bg);
  border: var(--app-modal-border-width) solid var(--app-modal-border-color);
  border-radius: var(--app-modal-radius);
}

.app-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-modal-header-gap);
}

.app-modal__titles {
  display: flex;
  flex-direction: column;
  gap: var(--app-modal-title-gap);
  min-width: var(--spacing-0);
}

.app-modal__title {
  margin: var(--spacing-0);
  color: var(--app-modal-title-color);
  font-family: var(--app-modal-title-font-family);
  font-size: var(--app-modal-title-font-size);
  line-height: var(--app-modal-title-line-height);
  font-weight: var(--app-modal-title-font-weight);
  text-transform: var(--app-modal-title-text-transform);
}

.app-modal__subtitle {
  margin: var(--spacing-0);
  color: var(--app-modal-subtitle-color);
  font-family: var(--app-modal-subtitle-font-family);
  font-size: var(--app-modal-subtitle-font-size);
  line-height: var(--app-modal-subtitle-line-height);
  font-weight: var(--app-modal-subtitle-font-weight);
  text-transform: var(--app-modal-subtitle-text-transform);
}

.app-modal__body {
  max-height: var(--app-modal-body-max-height);
  overflow-y: auto;
}

.app-modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--app-modal-footer-gap);
}

.app-modal-enter-active,
.app-modal-leave-active {
  transition: opacity var(--app-modal-transition-duration) var(--app-modal-transition-easing);
}

.app-modal-enter-active .app-modal__dialog,
.app-modal-leave-active .app-modal__dialog {
  transition:
    opacity var(--app-modal-transition-duration) var(--app-modal-transition-easing),
    transform var(--app-modal-transition-duration) var(--app-modal-transition-easing);
}

.app-modal-enter-from,
.app-modal-leave-to {
  opacity: var(--app-modal-opacity-closed);
}

.app-modal-enter-from .app-modal__dialog,
.app-modal-leave-to .app-modal__dialog {
  opacity: var(--app-modal-opacity-closed);
  transform: scale(var(--app-modal-scale-closed));
}
</style>
