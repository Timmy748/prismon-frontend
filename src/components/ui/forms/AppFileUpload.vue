<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { AppIcon } from '../icons'

interface Props {
  label?: string
  title?: string
  hint?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  error?: string | boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Arraste arquivos aqui ou clique para navegar',
  hint: 'JPG, PNG, WEBP upload até 10mb',
  multiple: false,
  disabled: false,
  error: false,
})

const emit = defineEmits<{
  select: [files: File[]]
}>()

const generatedId = useId()
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const inputId = computed(() => props.id ?? `app-file-upload-${generatedId}`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const errorMessage = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : undefined,
)

const errorId = computed(() => (errorMessage.value ? `${inputId.value}-error` : undefined))

const rootClasses = computed(() => [
  'app-file-upload',
  isDragging.value && !props.disabled ? 'app-file-upload--dragging' : undefined,
  hasError.value ? 'app-file-upload--error' : undefined,
  props.disabled ? 'app-file-upload--disabled' : undefined,
])

function openFilePicker() {
  if (props.disabled) {
    return
  }
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  if (props.disabled) {
    return
  }
  const target = event.target as HTMLInputElement
  const fileList = target.files
  if (!fileList || fileList.length === 0) {
    return
  }
  const files = Array.from(fileList)
  const selectedFiles = props.multiple ? files : files.slice(0, 1)
  if (selectedFiles.length > 0) {
    emit('select', selectedFiles)
  }
  target.value = ''
}

function handleDragEnter() {
  if (props.disabled) {
    return
  }
  isDragging.value = true
}

function handleDragOver() {
  if (props.disabled) {
    return
  }
  isDragging.value = true
}

function handleDragLeave(event: DragEvent) {
  if (
    event.currentTarget instanceof HTMLElement &&
    event.relatedTarget instanceof Node &&
    event.currentTarget.contains(event.relatedTarget)
  ) {
    return
  }
  isDragging.value = false
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (props.disabled) {
    return
  }
  const fileList = event.dataTransfer?.files
  if (!fileList || fileList.length === 0) {
    return
  }
  const files = Array.from(fileList)
  const selectedFiles = props.multiple ? files : files.slice(0, 1)
  if (selectedFiles.length > 0) {
    emit('select', selectedFiles)
  }
}
</script>

<template>
  <div :class="rootClasses">
    <div class="app-file-upload__field">
      <label v-if="label" :for="inputId" class="app-file-upload__label">
        {{ label }}
      </label>
      <div
        class="app-file-upload__dropzone"
        role="button"
        :tabindex="disabled ? -1 : 0"
        :aria-disabled="disabled ? 'true' : undefined"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="errorId"
        @click="openFilePicker"
        @keydown.enter.prevent="openFilePicker"
        @keydown.space.prevent="openFilePicker"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <AppIcon
          name="upload"
          size="2xl"
          :color="disabled ? 'disabled' : 'secondary'"
          class="app-file-upload__icon"
        />
        <p class="app-file-upload__title">{{ title }}</p>
        <p class="app-file-upload__hint">{{ hint }}</p>
        <input
          :id="inputId"
          ref="fileInputRef"
          type="file"
          :accept="accept"
          :multiple="multiple"
          :disabled="disabled"
          tabindex="-1"
          aria-hidden="true"
          class="app-file-upload__input"
          @change="handleFileChange"
        />
      </div>
    </div>
    <p v-if="errorMessage" :id="errorId" class="app-file-upload__error" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.app-file-upload {
  --app-file-upload-bg: var(--field-bg);
  --app-file-upload-border-color: var(--field-border);
  --app-file-upload-border-width: var(--border-width-thin);
  --app-file-upload-radius: var(--radius-none);
  --app-file-upload-label-color: var(--text-primary);
  --app-file-upload-title-color: var(--text-primary);
  --app-file-upload-hint-color: var(--text-tertiary);
  --app-file-upload-error-color: var(--text-danger);
  --app-file-upload-shadow-focus: var(--shadow-focus-ring);
  --app-file-upload-min-height: var(--size-upload-min-height);
  --app-file-upload-padding: var(--spacing-5);
  --app-file-upload-gap: var(--spacing-3);
  --app-file-upload-label-gap: var(--spacing-3);
  --app-file-upload-error-gap: var(--spacing-2);
  --app-file-upload-font-family: var(--type-body-compact-02-font-family);
  --app-file-upload-font-size: var(--type-body-compact-02-font-size);
  --app-file-upload-line-height: var(--type-body-compact-02-line-height);
  --app-file-upload-font-weight: var(--type-body-compact-02-font-weight);
  --app-file-upload-text-transform: var(--type-body-compact-02-text-transform);
  --app-file-upload-transition-duration: var(--duration-fast);
  --app-file-upload-transition-easing: var(--easing-standard);
  --app-file-upload-cursor: pointer;

  display: flex;
  flex-direction: column;
  gap: var(--app-file-upload-error-gap);
  width: 100%;
  box-sizing: border-box;
}

.app-file-upload__field {
  display: flex;
  flex-direction: column;
  gap: var(--app-file-upload-label-gap);
}

.app-file-upload__label {
  color: var(--app-file-upload-label-color);
  font-family: var(--app-file-upload-font-family);
  font-size: var(--app-file-upload-font-size);
  line-height: var(--app-file-upload-line-height);
  font-weight: var(--app-file-upload-font-weight);
  text-transform: var(--app-file-upload-text-transform);
}

.app-file-upload__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  min-height: var(--app-file-upload-min-height);
  padding: var(--app-file-upload-padding);
  gap: var(--app-file-upload-gap);
  box-sizing: border-box;
  background-color: var(--app-file-upload-bg);
  border: var(--app-file-upload-border-width) dashed var(--app-file-upload-border-color);
  border-radius: var(--app-file-upload-radius);
  cursor: var(--app-file-upload-cursor);
  outline: none;
  transition:
    background-color var(--app-file-upload-transition-duration)
      var(--app-file-upload-transition-easing),
    border-color var(--app-file-upload-transition-duration) var(--app-file-upload-transition-easing),
    box-shadow var(--app-file-upload-transition-duration) var(--app-file-upload-transition-easing);
}

.app-file-upload__dropzone:focus-visible {
  box-shadow: var(--app-file-upload-shadow-focus);
}

.app-file-upload__icon {
  flex-shrink: 0;
}

.app-file-upload__title {
  margin: var(--spacing-0);
  color: var(--app-file-upload-title-color);
  font-family: var(--app-file-upload-font-family);
  font-size: var(--app-file-upload-font-size);
  line-height: var(--app-file-upload-line-height);
  font-weight: var(--app-file-upload-font-weight);
  text-transform: var(--app-file-upload-text-transform);
}

.app-file-upload__hint {
  margin: var(--spacing-0);
  color: var(--app-file-upload-hint-color);
  font-family: var(--app-file-upload-font-family);
  font-size: var(--app-file-upload-font-size);
  line-height: var(--app-file-upload-line-height);
  font-weight: var(--app-file-upload-font-weight);
  text-transform: var(--app-file-upload-text-transform);
}

.app-file-upload__input {
  display: none;
}

.app-file-upload__error {
  margin: var(--spacing-0);
  color: var(--app-file-upload-error-color);
  font-family: var(--app-file-upload-font-family);
  font-size: var(--app-file-upload-font-size);
  line-height: var(--app-file-upload-line-height);
  font-weight: var(--app-file-upload-font-weight);
  text-transform: var(--app-file-upload-text-transform);
}

.app-file-upload:not(.app-file-upload--disabled):not(.app-file-upload--dragging):not(
    .app-file-upload--error
  )
  .app-file-upload__dropzone:hover {
  --app-file-upload-border-color: var(--field-border-hover);
}

.app-file-upload--dragging:not(.app-file-upload--disabled) {
  --app-file-upload-bg: var(--field-bg-focus);
  --app-file-upload-border-color: var(--field-border-focus);
}

.app-file-upload--error {
  --app-file-upload-border-color: var(--field-border-danger);
}

.app-file-upload--disabled {
  --app-file-upload-bg: var(--surface-disabled);
  --app-file-upload-border-color: var(--border-disabled);
  --app-file-upload-title-color: var(--text-disabled);
  --app-file-upload-hint-color: var(--text-disabled);
  --app-file-upload-cursor: not-allowed;
}
</style>
