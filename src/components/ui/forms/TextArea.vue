<script setup lang="ts">
import { computed, ref, useId } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  helpText?: string
  error?: string | boolean
  id?: string
  name?: string
  rows?: number
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const generatedId = useId()
const isFocused = ref(false)

const textareaId = computed(() => props.id ?? `text-area-${generatedId}`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const displayHelpText = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : props.helpText,
)

const helpId = computed(() => (displayHelpText.value ? `${textareaId.value}-help` : undefined))

const rootClasses = computed(() => [
  'text-area',
  isFocused.value && !props.disabled ? 'text-area--focused' : undefined,
  hasError.value ? 'text-area--error' : undefined,
  props.disabled ? 'text-area--disabled' : undefined,
])

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

function handleFocus(event: FocusEvent) {
  if (props.disabled) {
    return
  }
  isFocused.value = true
  emit('focus', event)
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false
  emit('blur', event)
}
</script>

<template>
  <div :class="rootClasses">
    <div class="text-area__field">
      <label v-if="label" :for="textareaId" class="text-area__label">
        {{ label }}
      </label>
      <textarea
        :id="textareaId"
        :name="name"
        :rows="rows"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="helpId"
        class="text-area__control"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    <p
      v-if="displayHelpText"
      :id="helpId"
      class="text-area__help"
      :role="hasError ? 'alert' : undefined"
    >
      {{ displayHelpText }}
    </p>
  </div>
</template>

<style scoped>
.text-area {
  --text-area-bg: var(--field-bg);
  --text-area-border-color: var(--field-border);
  --text-area-border-width: var(--border-width-thin);
  --text-area-radius: var(--radius-none);
  --text-area-color: var(--text-primary);
  --text-area-placeholder-color: var(--text-placeholder);
  --text-area-label-color: var(--text-primary);
  --text-area-help-color: var(--text-helper);
  --text-area-min-height: 160px;
  --text-area-padding: var(--spacing-3);
  --text-area-label-gap: var(--spacing-3);
  --text-area-help-gap: var(--spacing-2);
  --text-area-resize: vertical;
  --text-area-font-family: var(--type-body-compact-02-font-family);
  --text-area-font-size: var(--type-body-compact-02-font-size);
  --text-area-line-height: var(--type-body-compact-02-line-height);
  --text-area-font-weight: var(--type-body-compact-02-font-weight);
  --text-area-text-transform: var(--type-body-compact-02-text-transform);
  --text-area-transition-duration: var(--duration-fast);
  --text-area-transition-easing: var(--easing-standard);
  --text-area-cursor: text;

  display: flex;
  flex-direction: column;
  gap: var(--text-area-help-gap);
  width: 100%;
  box-sizing: border-box;
}

.text-area__field {
  display: flex;
  flex-direction: column;
  gap: var(--text-area-label-gap);
}

.text-area__label {
  color: var(--text-area-label-color);
  font-family: var(--text-area-font-family);
  font-size: var(--text-area-font-size);
  line-height: var(--text-area-line-height);
  font-weight: var(--text-area-font-weight);
  text-transform: var(--text-area-text-transform);
}

.text-area__control {
  width: 100%;
  min-height: var(--text-area-min-height);
  padding: var(--text-area-padding);
  box-sizing: border-box;
  resize: var(--text-area-resize);
  background-color: var(--text-area-bg);
  color: var(--text-area-color);
  border: var(--text-area-border-width) solid var(--text-area-border-color);
  border-radius: var(--text-area-radius);
  font-family: var(--text-area-font-family);
  font-size: var(--text-area-font-size);
  line-height: var(--text-area-line-height);
  font-weight: var(--text-area-font-weight);
  text-transform: var(--text-area-text-transform);
  cursor: var(--text-area-cursor);
  outline: none;
  transition:
    background-color var(--text-area-transition-duration) var(--text-area-transition-easing),
    border-color var(--text-area-transition-duration) var(--text-area-transition-easing),
    color var(--text-area-transition-duration) var(--text-area-transition-easing);
}

.text-area__control::placeholder {
  color: var(--text-area-placeholder-color);
}

.text-area__help {
  margin: var(--spacing-0);
  color: var(--text-area-help-color);
  font-family: var(--text-area-font-family);
  font-size: var(--text-area-font-size);
  line-height: var(--text-area-line-height);
  font-weight: var(--text-area-font-weight);
  text-transform: var(--text-area-text-transform);
}

.text-area:not(.text-area--disabled):not(.text-area--focused):not(.text-area--error):hover {
  --text-area-border-color: var(--field-border-hover);
}

.text-area:focus-within:not(.text-area--disabled),
.text-area--focused:not(.text-area--disabled) {
  --text-area-bg: var(--field-bg-focus);
  --text-area-border-color: var(--field-border-focus);
}

.text-area--error {
  --text-area-bg: var(--field-bg);
  --text-area-border-color: var(--field-border-danger);
  --text-area-help-color: var(--text-danger);
}

.text-area--disabled {
  --text-area-bg: var(--surface-disabled);
  --text-area-border-color: var(--border-disabled);
  --text-area-color: var(--text-disabled);
  --text-area-placeholder-color: var(--text-disabled);
  --text-area-cursor: not-allowed;
}
</style>
