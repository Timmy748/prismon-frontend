<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '../buttons'
import { TextArea, TextInput } from '../forms'

export interface TagFormPayload {
  name: string
  description: string
  color?: string
}

interface Props {
  name?: string
  description?: string
  color?: string
  showColor?: boolean
  nameLabel?: string
  namePlaceholder?: string
  nameHelpText?: string
  nameError?: string | boolean
  descriptionLabel?: string
  descriptionPlaceholder?: string
  descriptionHelpText?: string
  descriptionError?: string | boolean
  colorLabel?: string
  colorError?: string | boolean
  cancelLabel?: string
  submitLabel?: string
  disabled?: boolean
  submitDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  description: '',
  color: '#f33ff0',
  showColor: false,
  nameLabel: 'Nome',
  descriptionLabel: 'Descrição',
  colorLabel: 'Cor (Hex)',
  cancelLabel: 'Cancelar',
  submitLabel: 'Salvar',
  disabled: false,
  submitDisabled: false,
})

const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  'update:color': [value: string]
  submit: [payload: TagFormPayload]
  cancel: []
}>()

const localName = ref(props.name)
const localDescription = ref(props.description)
const localColor = ref(props.color)

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

watch(
  () => props.color,
  (newValue) => {
    localColor.value = newValue
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

function handleColorUpdate(value: string) {
  localColor.value = value
  emit('update:color', value)
}

function handleSubmit() {
  if (props.disabled || props.submitDisabled) {
    return
  }
  const payload: TagFormPayload = {
    name: localName.value,
    description: localDescription.value,
  }
  if (props.showColor) {
    payload.color = localColor.value
  }
  emit('submit', payload)
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
      <div v-if="showColor" class="tag-form__color-row">
        <label class="tag-form__color-label" for="tag-form-color-picker">
          {{ colorLabel }}
        </label>
        <div class="tag-form__color-controls">
          <input
            id="tag-form-color-picker"
            type="color"
            class="tag-form__color-picker"
            :value="localColor"
            :disabled="disabled"
            aria-label="Selecionar cor da tag"
            @input="handleColorUpdate(($event.target as HTMLInputElement).value)"
          />
          <div class="tag-form__color-hex">
            <TextInput
              :model-value="localColor"
              placeholder="#f33ff0"
              :error="colorError"
              :disabled="disabled"
              aria-label="Código hexadecimal da cor"
              @update:model-value="handleColorUpdate"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="tag-form__actions">
      <Button variant="tertiary" full-width :disabled="disabled" @click="emit('cancel')">
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
  --tag-form-gap: var(--spacing-6);
  --tag-form-fields-gap: var(--spacing-5);
  --tag-form-actions-gap: var(--spacing-0);
  --tag-form-color-label-color: var(--text-primary);
  --tag-form-color-label-font-family: var(--type-label-01-font-family);
  --tag-form-color-label-font-size: var(--type-label-01-font-size);
  --tag-form-color-label-line-height: var(--type-label-01-line-height);
  --tag-form-color-label-font-weight: var(--type-label-01-font-weight);
  --tag-form-picker-border-color: var(--border-subtle-1);
  --tag-form-picker-border-width: var(--border-width-thin);

  display: flex;
  flex-direction: column;
  gap: var(--tag-form-gap);
  width: var(--tag-form-width);
  box-sizing: border-box;
}

.tag-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--tag-form-fields-gap);
}

.tag-form__color-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.tag-form__color-label {
  color: var(--tag-form-color-label-color);
  font-family: var(--tag-form-color-label-font-family);
  font-size: var(--tag-form-color-label-font-size);
  line-height: var(--tag-form-color-label-line-height);
  font-weight: var(--tag-form-color-label-font-weight);
}

.tag-form__color-controls {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
}

.tag-form__color-picker {
  width: 44px;
  height: 40px;
  padding: var(--spacing-1);
  border: var(--tag-form-picker-border-width) solid var(--tag-form-picker-border-color);
  background-color: var(--surface-elevated);
  cursor: pointer;
  flex-shrink: 0;
}

.tag-form__color-hex {
  flex: 1;
  min-width: var(--spacing-0);
}

.tag-form__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--tag-form-actions-gap);
}

@media (max-width: 767px) {
  .tag-form__actions {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--spacing-3);
  }

  .tag-form__actions :deep([type='submit']) {
    order: -1;
  }
}
</style>
