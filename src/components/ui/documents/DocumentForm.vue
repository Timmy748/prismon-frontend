<script setup lang="ts">
import { ref, watch } from 'vue'
import { AppButton } from '../buttons'
import { AppFileUpload, AppTextArea, AppTextInput } from '../forms'

export interface DocumentFormPayload {
  title: string
  description: string
  files: File[]
}

interface Props {
  title?: string
  description?: string
  accept?: string
  fileLabel?: string
  fileHint?: string
  fileError?: string | boolean
  titleLabel?: string
  titlePlaceholder?: string
  titleHelpText?: string
  titleError?: string | boolean
  descriptionLabel?: string
  descriptionPlaceholder?: string
  descriptionHelpText?: string
  descriptionError?: string | boolean
  cancelLabel?: string
  submitLabel?: string
  disabled?: boolean
  submitDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  fileLabel: 'Suba seu arquivo',
  titleLabel: 'Título',
  descriptionLabel: 'Descrição',
  cancelLabel: 'Cancelar',
  submitLabel: 'Salvar',
  disabled: false,
  submitDisabled: false,
})

const emit = defineEmits<{
  'update:title': [value: string]
  'update:description': [value: string]
  'select-files': [files: File[]]
  submit: [payload: DocumentFormPayload]
  cancel: []
}>()

const localTitle = ref(props.title)
const localDescription = ref(props.description)
const selectedFiles = ref<File[]>([])

watch(
  () => props.title,
  (newValue) => {
    localTitle.value = newValue
  },
)

watch(
  () => props.description,
  (newValue) => {
    localDescription.value = newValue
  },
)

function handleTitleUpdate(value: string) {
  localTitle.value = value
  emit('update:title', value)
}

function handleDescriptionUpdate(value: string) {
  localDescription.value = value
  emit('update:description', value)
}

function handleFilesSelect(files: File[]) {
  selectedFiles.value = files
  emit('select-files', files)
}

function handleSubmit() {
  if (props.disabled || props.submitDisabled) {
    return
  }
  emit('submit', {
    title: localTitle.value,
    description: localDescription.value,
    files: selectedFiles.value,
  })
}
</script>

<template>
  <form class="document-form" @submit.prevent="handleSubmit">
    <div class="document-form__fields">
      <AppFileUpload
        :label="fileLabel"
        :accept="accept"
        :hint="fileHint"
        :error="fileError"
        :disabled="disabled"
        @select="handleFilesSelect"
      />
      <AppTextInput
        :model-value="localTitle"
        :label="titleLabel"
        :placeholder="titlePlaceholder"
        :help-text="titleHelpText"
        :error="titleError"
        :disabled="disabled"
        @update:model-value="handleTitleUpdate"
      />
      <AppTextArea
        :model-value="localDescription"
        :label="descriptionLabel"
        :placeholder="descriptionPlaceholder"
        :help-text="descriptionHelpText"
        :error="descriptionError"
        :disabled="disabled"
        @update:model-value="handleDescriptionUpdate"
      />
    </div>

    <div class="document-form__actions">
      <AppButton variant="ghost" full-width :disabled="disabled" @click="emit('cancel')">
        {{ cancelLabel }}
      </AppButton>
      <AppButton type="submit" variant="primary" full-width :disabled="disabled || submitDisabled">
        {{ submitLabel }}
      </AppButton>
    </div>
  </form>
</template>

<style scoped>
.document-form {
  --document-form-width: 100%;
  --document-form-max-width: var(--size-form-width);
  --document-form-gap: var(--spacing-6);
  --document-form-fields-gap: var(--spacing-5);
  --document-form-actions-gap: var(--spacing-0);

  display: flex;
  flex-direction: column;
  gap: var(--document-form-gap);
  width: var(--document-form-width);
  max-width: var(--document-form-max-width);
  box-sizing: border-box;
}

.document-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--document-form-fields-gap);
}

.document-form__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--document-form-actions-gap);
}
</style>
