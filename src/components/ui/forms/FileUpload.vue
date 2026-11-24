<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
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
  files?: File[]
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
  clear: []
  remove: [index: number]
}>()

const generatedId = useId()
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const internalFiles = ref<File[]>(props.files ? [...props.files] : [])

watch(
  () => props.files,
  (nextFiles) => {
    if (nextFiles !== undefined) {
      internalFiles.value = [...nextFiles]
    }
  },
)

const inputId = computed(() => props.id ?? `file-upload-${generatedId}`)

const activeFiles = computed(() =>
  props.files !== undefined ? props.files : internalFiles.value,
)

const hasFiles = computed(() => activeFiles.value.length > 0)

const uploadedStatusLabel = computed(() =>
  activeFiles.value.length > 1 ? 'Arquivos carregados' : 'Arquivo carregado',
)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const errorMessage = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : undefined,
)

const errorId = computed(() => (errorMessage.value ? `${inputId.value}-error` : undefined))

const rootClasses = computed(() => [
  'file-upload',
  hasFiles.value ? 'file-upload--uploaded' : undefined,
  isDragging.value && !props.disabled ? 'file-upload--dragging' : undefined,
  hasError.value ? 'file-upload--error' : undefined,
  props.disabled ? 'file-upload--disabled' : undefined,
])

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const kb = bytes / 1024
  if (kb < 1024) {
    const formattedKb = kb >= 10 ? String(Math.round(kb)) : kb.toFixed(1).replace(/\.0$/, '')
    return `${formattedKb} KB`
  }
  const mb = kb / 1024
  const formattedMb = mb >= 10 ? String(Math.round(mb)) : mb.toFixed(1).replace(/\.0$/, '')
  return `${formattedMb} MB`
}

function openFilePicker() {
  if (props.disabled) {
    return
  }
  fileInputRef.value?.click()
}

function handleRemoveFile(index: number) {
  if (props.disabled) {
    return
  }
  const nextFiles = activeFiles.value.filter((_, itemIndex) => itemIndex !== index)
  internalFiles.value = nextFiles
  emit('remove', index)
  if (nextFiles.length === 0) {
    emit('clear')
  }
}

function handleClearFiles() {
  if (props.disabled) {
    return
  }
  internalFiles.value = []
  emit('clear')
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
    internalFiles.value = selectedFiles
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
    internalFiles.value = selectedFiles
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
        <template v-if="hasFiles">
          <div class="file-upload__uploaded-header">
            <span class="file-upload__uploaded-badge">
              <Icon name="check" size="sm" :color="disabled ? 'disabled' : 'brand'" />
            </span>
            <span class="file-upload__uploaded-status">{{ uploadedStatusLabel }}</span>
          </div>

          <ul class="file-upload__uploaded-list">
            <li
              v-for="(file, index) in activeFiles"
              :key="`${file.name}-${file.size}-${index}`"
              class="file-upload__uploaded-item"
            >
              <div class="file-upload__uploaded-info">
                <span class="file-upload__uploaded-name">{{ file.name }}</span>
                <span class="file-upload__uploaded-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <button
                type="button"
                class="file-upload__action-btn file-upload__action-btn--remove"
                :disabled="disabled"
                @click.stop="handleRemoveFile(index)"
                @keydown.enter.stop
                @keydown.space.stop
              >
                Remover
              </button>
            </li>
          </ul>

          <div class="file-upload__uploaded-actions">
            <button
              type="button"
              class="file-upload__action-btn file-upload__action-btn--primary"
              :disabled="disabled"
              @click.stop="openFilePicker"
              @keydown.enter.stop
              @keydown.space.stop
            >
              Trocar arquivo
            </button>
            <button
              v-if="activeFiles.length > 1"
              type="button"
              class="file-upload__action-btn file-upload__action-btn--clear"
              :disabled="disabled"
              @click.stop="handleClearFiles"
              @keydown.enter.stop
              @keydown.space.stop
            >
              Remover todos
            </button>
          </div>
        </template>

        <template v-else>
          <Icon
            name="upload"
            size="3xl"
            :color="disabled ? 'disabled' : 'secondary'"
            class="file-upload__icon"
          />
          <p class="file-upload__title">{{ title }}</p>
          <p class="file-upload__hint">{{ hint }}</p>
        </template>

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
  --file-upload-min-height: 240px;
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
  --file-upload-transition-easing: var(--easing-hover);
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

.file-upload__uploaded-header {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.file-upload__uploaded-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background-color: var(--surface-brand-selection);
  flex-shrink: 0;
}

.file-upload__uploaded-status {
  color: var(--text-brand-strong);
  font-family: var(--type-heading-compact-01-font-family);
  font-size: var(--type-heading-compact-01-font-size);
  line-height: var(--type-heading-compact-01-line-height);
  font-weight: var(--type-heading-compact-01-font-weight);
}

.file-upload__uploaded-list {
  list-style: none;
  margin: var(--spacing-0);
  padding: var(--spacing-0);
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.file-upload__uploaded-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  box-sizing: border-box;
  background-color: var(--surface-elevated);
  border: var(--border-width-thin) solid var(--border-subtle-1);
  text-align: left;
}

.file-upload__uploaded-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  min-width: 0;
  flex: 1;
}

.file-upload__uploaded-name {
  color: var(--text-primary);
  font-family: var(--type-body-compact-01-font-family);
  font-size: var(--type-body-compact-01-font-size);
  line-height: var(--type-body-compact-01-line-height);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-upload__uploaded-size {
  color: var(--text-helper);
  font-family: var(--type-label-01-font-family);
  font-size: var(--type-label-01-font-size);
  line-height: var(--type-label-01-line-height);
  font-weight: var(--type-label-01-font-weight);
  flex-shrink: 0;
}

.file-upload__uploaded-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
}

.file-upload__action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1) var(--spacing-3);
  background-color: var(--surface-elevated);
  color: var(--text-secondary);
  border: var(--border-width-thin) solid var(--border-subtle-2);
  font-family: var(--type-label-01-font-family);
  font-size: var(--type-label-01-font-size);
  line-height: var(--type-label-01-line-height);
  font-weight: var(--type-label-01-font-weight);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color var(--file-upload-transition-duration) var(--file-upload-transition-easing),
    border-color var(--file-upload-transition-duration) var(--file-upload-transition-easing),
    color var(--file-upload-transition-duration) var(--file-upload-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .file-upload__action-btn:not(:disabled):hover {
    background-color: var(--surface-subtle-hover);
    color: var(--text-primary);
  }
}

.file-upload__action-btn:focus-visible {
  outline: none;
  box-shadow: var(--file-upload-shadow-focus);
}

.file-upload__action-btn--primary {
  color: var(--text-brand);
  border-color: var(--border-brand-subtle);
}

.file-upload__action-btn--remove {
  color: var(--text-danger);
}

.file-upload__action-btn:disabled {
  background-color: var(--surface-disabled);
  border-color: var(--border-disabled);
  color: var(--text-disabled);
  cursor: not-allowed;
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

@media (hover: hover) and (pointer: fine) {
  .file-upload:not(.file-upload--disabled):not(.file-upload--dragging):not(.file-upload--error)
    .file-upload__dropzone:hover {
    --file-upload-border-color: var(--field-border-hover);
  }
}

.file-upload--uploaded {
  --file-upload-bg: var(--surface-brand-subtle);
  --file-upload-border-color: var(--border-brand-subtle);
}

.file-upload--uploaded .file-upload__dropzone {
  border-style: solid;
}

.file-upload--dragging:not(.file-upload--disabled) {
  --file-upload-bg: var(--field-bg-focus);
  --file-upload-border-color: var(--field-border-focus);
}

.file-upload--dragging:not(.file-upload--disabled) .file-upload__dropzone {
  border-style: dashed;
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

.file-upload--disabled .file-upload__uploaded-badge {
  background-color: var(--surface-disabled);
}

.file-upload--disabled .file-upload__uploaded-status {
  color: var(--text-disabled);
}
</style>
