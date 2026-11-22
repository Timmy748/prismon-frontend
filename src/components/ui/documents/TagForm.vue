<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '../buttons'
import { TextArea, TextInput } from '../forms'

export interface TagFormPayload {
  name: string
  description: string
}

interface Props {
  name?: string
  description?: string
  nameLabel?: string
  namePlaceholder?: string
  nameHelpText?: string
  nameError?: string | boolean
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
  name: '',
  description: '',
  nameLabel: 'Nome',
  descriptionLabel: 'Descrição',
  cancelLabel: 'Cancelar',
  submitLabel: 'Salvar',
  disabled: false,
  submitDisabled: false,
})

const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  submit: [payload: TagFormPayload]
  cancel: []
}>()

const localName = ref(props.name)
const localDescription = ref(props.description)

watch(
  () => props.name,
  (newValue) => {
    localName.value = newValue
  },
)

watch(
  () => props.description,
  (newValue) => {
    localDescription.value = newValue
  },
)

function handleNameUpdate(value: string) {
  localName.value = value
  emit('update:name', value)
}

function handleDescriptionUpdate(value: string) {
  localDescription.value = value
  emit('update:description', value)
}

function handleSubmit() {
  if (props.disabled || props.submitDisabled) {
    return
  }
  emit('submit', {
    name: localName.value,
    description: localDescription.value,
  })
}
</script>

<template>
  <form class="tag-form" @submit.prevent="handleSubmit">
    <div class="tag-form__fields">
      <TextInput
        :model-value="localName"
        :label="nameLabel"
        :placeholder="namePlaceholder"
        :help-text="nameHelpText"
        :error="nameError"
        :disabled="disabled"
        @update:model-value="handleNameUpdate"
      />
      <TextArea
        :model-value="localDescription"
        :label="descriptionLabel"
        :placeholder="descriptionPlaceholder"
        :help-text="descriptionHelpText"
        :error="descriptionError"
        :disabled="disabled"
        @update:model-value="handleDescriptionUpdate"
      />
    </div>

    <div class="tag-form__actions">
      <Button variant="ghost" full-width :disabled="disabled" @click="emit('cancel')">
        {{ cancelLabel }}
      </Button>
      <Button type="submit" variant="primary" full-width :disabled="disabled || submitDisabled">
        {{ submitLabel }}
      </Button>
    </div>
  </form>
</template>

<style scoped>
.tag-form {
  --tag-form-width: 100%;
  --tag-form-max-width: var(--size-form-width);
  --tag-form-gap: var(--spacing-6);
  --tag-form-fields-gap: var(--spacing-5);
  --tag-form-actions-gap: var(--spacing-0);

  display: flex;
  flex-direction: column;
  gap: var(--tag-form-gap);
  width: var(--tag-form-width);
  max-width: var(--tag-form-max-width);
  box-sizing: border-box;
}

.tag-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--tag-form-fields-gap);
}

.tag-form__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--tag-form-actions-gap);
}
</style>
