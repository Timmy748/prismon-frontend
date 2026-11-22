<script setup lang="ts">
import { computed } from 'vue'
import { AppIconButton } from '../buttons'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  attachLabel?: string
  workflowLabel?: string
  sendLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Digite sua mensagem',
  disabled: false,
  attachLabel: 'Anexar arquivo',
  workflowLabel: 'Selecionar workflow',
  sendLabel: 'Enviar mensagem',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: [value: string]
  attach: []
  'select-workflow': []
}>()

const containerClasses = computed(() => [
  'ai-prompt-input',
  props.disabled ? 'ai-prompt-input--disabled' : undefined,
])

const isSendDisabled = computed(() => props.disabled || !props.modelValue.trim())

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function handleSubmit() {
  if (isSendDisabled.value) {
    return
  }
  emit('submit', props.modelValue)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing) {
    return
  }
  event.preventDefault()
  handleSubmit()
}
</script>

<template>
  <div :class="containerClasses">
    <textarea
      class="ai-prompt-input__textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      rows="2"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    <div class="ai-prompt-input__footer">
      <div class="ai-prompt-input__actions-left">
        <AppIconButton
          variant="ghost"
          icon="attachment"
          :ariaLabel="attachLabel"
          :disabled="disabled"
          @click="emit('attach')"
        />
        <AppIconButton
          variant="ghost"
          icon="robot"
          :ariaLabel="workflowLabel"
          :disabled="disabled"
          @click="emit('select-workflow')"
        />
        <slot name="actions-left" />
      </div>
      <AppIconButton
        variant="primary"
        icon="send"
        :ariaLabel="sendLabel"
        :disabled="isSendDisabled"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>

<style scoped>
.ai-prompt-input {
  --ai-prompt-input-max-width: var(--size-ai-input-max-width);
  --ai-prompt-input-padding: var(--spacing-3);
  --ai-prompt-input-gap: var(--spacing-5);
  --ai-prompt-input-actions-gap: var(--spacing-3);
  --ai-prompt-input-bg: var(--field-bg);
  --ai-prompt-input-border-color: var(--field-border);
  --ai-prompt-input-border-width: var(--border-width-thin);
  --ai-prompt-input-radius: var(--radius-none);
  --ai-prompt-input-textarea-bg: var(--surface-transparent);
  --ai-prompt-input-textarea-border-width: var(--border-width-none);
  --ai-prompt-input-textarea-border-color: var(--border-transparent);
  --ai-prompt-input-text-color: var(--text-primary);
  --ai-prompt-input-placeholder-color: var(--text-placeholder);
  --ai-prompt-input-font-family: var(--type-body-compact-02-font-family);
  --ai-prompt-input-font-size: var(--type-body-compact-02-font-size);
  --ai-prompt-input-line-height: var(--type-body-compact-02-line-height);
  --ai-prompt-input-font-weight: var(--type-body-compact-02-font-weight);
  --ai-prompt-input-text-transform: var(--type-body-compact-02-text-transform);
  --ai-prompt-input-transition-duration: var(--duration-fast);
  --ai-prompt-input-transition-easing: var(--easing-standard);

  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--ai-prompt-input-max-width);
  padding: var(--ai-prompt-input-padding);
  gap: var(--ai-prompt-input-gap);
  box-sizing: border-box;
  background-color: var(--ai-prompt-input-bg);
  border: var(--ai-prompt-input-border-width) solid var(--ai-prompt-input-border-color);
  border-radius: var(--ai-prompt-input-radius);
  transition: border-color var(--ai-prompt-input-transition-duration)
    var(--ai-prompt-input-transition-easing);
}

.ai-prompt-input:focus-within:not(.ai-prompt-input--disabled) {
  --ai-prompt-input-border-color: var(--field-border-focus);
}

.ai-prompt-input--disabled {
  --ai-prompt-input-bg: var(--surface-disabled);
  --ai-prompt-input-border-color: var(--border-disabled);
  --ai-prompt-input-text-color: var(--text-disabled);
}

.ai-prompt-input__textarea {
  width: 100%;
  padding: var(--ai-prompt-input-padding);
  box-sizing: border-box;
  background-color: var(--ai-prompt-input-textarea-bg);
  border: var(--ai-prompt-input-textarea-border-width) solid
    var(--ai-prompt-input-textarea-border-color);
  color: var(--ai-prompt-input-text-color);
  font-family: var(--ai-prompt-input-font-family);
  font-size: var(--ai-prompt-input-font-size);
  line-height: var(--ai-prompt-input-line-height);
  font-weight: var(--ai-prompt-input-font-weight);
  text-transform: var(--ai-prompt-input-text-transform);
  resize: none;
  outline: none;
}

.ai-prompt-input__textarea::placeholder {
  color: var(--ai-prompt-input-placeholder-color);
}

.ai-prompt-input__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ai-prompt-input-actions-gap);
}

.ai-prompt-input__actions-left {
  display: flex;
  align-items: center;
  gap: var(--ai-prompt-input-actions-gap);
}
</style>
