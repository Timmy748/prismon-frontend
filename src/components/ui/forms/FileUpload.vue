<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Icon } from '../icons'

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

const inputId = computed(() => props.id ?? `file-upload-${generatedId}`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const errorMessage = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : undefined,
)

const errorId = computed(() => (errorMessage.value ? `${inputId.value}-error` : undefined))

const rootClasses = computed(() => [
  'file-upload',
  isDragging.value && !props.disabled ? 'file-upload--dragging' : undefined,
  hasError.value ? 'file-upload--error' : undefined,
  props.disabled ? 'file-upload--disabled' : undefined,
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
    <div class="file-upload__field">
      <label v-if="label" :for="inputId" class="file-upload__label">
        {{ label }}
      </label>
      <div
        class="file-upload__dropzone"
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
        <Icon
          name="upload"
          size="2xl"
          :color="disabled ? 'disabled' : 'secondary'"
          class="file-upload__icon"
        />
        <p class="file-upload__title">{{ title }}</p>
        <p class="file-upload__hint">{{ hint }}</p>
        <input
          :id="inputId"
          ref="fileInputRef"
          type="file"
          :accept="accept"
          :multiple="multiple"
          :disabled="disabled"
          tabindex="-1"
          aria-hidden="true"
          class="file-upload__input"
          @change="handleFileChange"
        />
      </div>
    </div>
    <p v-if="errorMessage" :id="errorId" class="file-upload__error" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.file-upload {
  --file-upload-bg: var(--field-bg);
  --file-upload-border-color: var(--field-border);
  --file-upload-border-width: var(--border-width-thin);
  --file-upload-radius: var(--radius-none);
  --file-upload-label-color: var(--text-primary);
  --file-upload-title-color: var(--text-primary);
  --file-upload-hint-color: var(--text-tertiary);
  --file-upload-error-color: var(--text-danger);
  --file-upload-shadow-focus: var(--shadow-focus-ring);
  --file-upload-min-height: var(--size-upload-min-height);
  --file-upload-padding: var(--spacing-5);
  --file-upload-gap: var(--spacing-3);
  --file-upload-label-gap: var(--spacing-3);
  --file-upload-error-gap: var(--spacing-2);
  --file-upload-font-family: var(--type-body-compact-02-font-family);
  --file-upload-font-size: var(--type-body-compact-02-font-size);
  --file-upload-line-height: var(--type-body-compact-02-line-height);
  --file-upload-font-weight: var(--type-body-compact-02-font-weight);
  --file-upload-text-transform: var(--type-body-compact-02-text-transform);
  --file-upload-transition-duration: var(--duration-fast);
  --file-upload-transition-easing: var(--easing-standard);
  --file-upload-cursor: pointer;

  display: flex;
  flex-direction: column;
  gap: var(--file-upload-error-gap);
  width: 100%;
  box-sizing: border-box;
}

.file-upload__field {
  display: flex;
  flex-direction: column;
  gap: var(--file-upload-label-gap);
}

.file-upload__label {
  color: var(--file-upload-label-color);
  font-family: var(--file-upload-font-family);
  font-size: var(--file-upload-font-size);
  line-height: var(--file-upload-line-height);
  font-weight: var(--file-upload-font-weight);
  text-transform: var(--file-upload-text-transform);
}

.file-upload__dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  min-height: var(--file-upload-min-height);
  padding: var(--file-upload-padding);
  gap: var(--file-upload-gap);
  box-sizing: border-box;
  background-color: var(--file-upload-bg);
  border: var(--file-upload-border-width) dashed var(--file-upload-border-color);
  border-radius: var(--file-upload-radius);
  cursor: var(--file-upload-cursor);
  outline: none;
  transition:
    background-color var(--file-upload-transition-duration) var(--file-upload-transition-easing),
    border-color var(--file-upload-transition-duration) var(--file-upload-transition-easing),
    box-shadow var(--file-upload-transition-duration) var(--file-upload-transition-easing);
}

.file-upload__dropzone:focus-visible {
  box-shadow: var(--file-upload-shadow-focus);
}

.file-upload__icon {
  flex-shrink: 0;
}

.file-upload__title {
  margin: var(--spacing-0);
  color: var(--file-upload-title-color);
  font-family: var(--file-upload-font-family);
  font-size: var(--file-upload-font-size);
  line-height: var(--file-upload-line-height);
  font-weight: var(--file-upload-font-weight);
  text-transform: var(--file-upload-text-transform);
}

.file-upload__hint {
  margin: var(--spacing-0);
  color: var(--file-upload-hint-color);
  font-family: var(--file-upload-font-family);
  font-size: var(--file-upload-font-size);
  line-height: var(--file-upload-line-height);
  font-weight: var(--file-upload-font-weight);
  text-transform: var(--file-upload-text-transform);
}

.file-upload__input {
  display: none;
}

.file-upload__error {
  margin: var(--spacing-0);
  color: var(--file-upload-error-color);
  font-family: var(--file-upload-font-family);
  font-size: var(--file-upload-font-size);
  line-height: var(--file-upload-line-height);
  font-weight: var(--file-upload-font-weight);
  text-transform: var(--file-upload-text-transform);
}

.file-upload:not(.file-upload--disabled):not(.file-upload--dragging):not(.file-upload--error)
  .file-upload__dropzone:hover {
  --file-upload-border-color: var(--field-border-hover);
}

.file-upload--dragging:not(.file-upload--disabled) {
  --file-upload-bg: var(--field-bg-focus);
  --file-upload-border-color: var(--field-border-focus);
}

.file-upload--error {
  --file-upload-border-color: var(--field-border-danger);
}

.file-upload--disabled {
  --file-upload-bg: var(--surface-disabled);
  --file-upload-border-color: var(--border-disabled);
  --file-upload-title-color: var(--text-disabled);
  --file-upload-hint-color: var(--text-disabled);
  --file-upload-cursor: not-allowed;
}
</style>
