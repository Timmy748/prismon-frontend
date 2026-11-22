<script setup lang="ts">
import { computed, ref, useId } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  helpText?: string
  error?: string | boolean
  type?: string
  id?: string
  name?: string
  disabled?: boolean
  required?: boolean
  autocomplete?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
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

const inputId = computed(() => props.id ?? `text-input-${generatedId}`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const displayHelpText = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : props.helpText,
)

const helpId = computed(() => (displayHelpText.value ? `${inputId.value}-help` : undefined))

const rootClasses = computed(() => [
  'text-input',
  isFocused.value && !props.disabled ? 'text-input--focused' : undefined,
  hasError.value ? 'text-input--error' : undefined,
  props.disabled ? 'text-input--disabled' : undefined,
])

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
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
    <div class="text-input__field">
      <label v-if="label" :for="inputId" class="text-input__label">
        {{ label }}
      </label>
      <input
        :id="inputId"
        :type="type"
        :name="name"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :autocomplete="autocomplete"
        :aria-invalid="hasError ? 'true' : undefined"
        :aria-describedby="helpId"
        class="text-input__control"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    <p
      v-if="displayHelpText"
      :id="helpId"
      class="text-input__help"
      :role="hasError ? 'alert' : undefined"
    >
      {{ displayHelpText }}
    </p>
  </div>
</template>

<style scoped>
.text-input {
  --text-input-bg: var(--field-bg);
  --text-input-border-color: var(--field-border);
  --text-input-border-width: var(--border-width-thin);
  --text-input-radius: var(--radius-none);
  --text-input-color: var(--text-primary);
  --text-input-placeholder-color: var(--text-placeholder);
  --text-input-label-color: var(--text-primary);
  --text-input-help-color: var(--text-helper);
  --text-input-min-height: var(--size-control-input);
  --text-input-padding: var(--spacing-3);
  --text-input-label-gap: var(--spacing-3);
  --text-input-help-gap: var(--spacing-2);
  --text-input-font-family: var(--type-body-compact-02-font-family);
  --text-input-font-size: var(--type-body-compact-02-font-size);
  --text-input-line-height: var(--type-body-compact-02-line-height);
  --text-input-font-weight: var(--type-body-compact-02-font-weight);
  --text-input-text-transform: var(--type-body-compact-02-text-transform);
  --text-input-transition-duration: var(--duration-fast);
  --text-input-transition-easing: var(--easing-standard);
  --text-input-cursor: text;

  display: flex;
  flex-direction: column;
  gap: var(--text-input-help-gap);
  width: 100%;
  box-sizing: border-box;
}

.text-input__field {
  display: flex;
  flex-direction: column;
  gap: var(--text-input-label-gap);
}

.text-input__label {
  color: var(--text-input-label-color);
  font-family: var(--text-input-font-family);
  font-size: var(--text-input-font-size);
  line-height: var(--text-input-line-height);
  font-weight: var(--text-input-font-weight);
  text-transform: var(--text-input-text-transform);
}

.text-input__control {
  width: 100%;
  min-height: var(--text-input-min-height);
  padding: var(--text-input-padding);
  box-sizing: border-box;
  background-color: var(--text-input-bg);
  color: var(--text-input-color);
  border: var(--text-input-border-width) solid var(--text-input-border-color);
  border-radius: var(--text-input-radius);
  font-family: var(--text-input-font-family);
  font-size: var(--text-input-font-size);
  line-height: var(--text-input-line-height);
  font-weight: var(--text-input-font-weight);
  text-transform: var(--text-input-text-transform);
  cursor: var(--text-input-cursor);
  outline: none;
  transition:
    background-color var(--text-input-transition-duration) var(--text-input-transition-easing),
    border-color var(--text-input-transition-duration) var(--text-input-transition-easing),
    color var(--text-input-transition-duration) var(--text-input-transition-easing);
}

.text-input__control::placeholder {
  color: var(--text-input-placeholder-color);
}

.text-input__help {
  margin: var(--spacing-0);
  color: var(--text-input-help-color);
  font-family: var(--text-input-font-family);
  font-size: var(--text-input-font-size);
  line-height: var(--text-input-line-height);
  font-weight: var(--text-input-font-weight);
  text-transform: var(--text-input-text-transform);
}

.text-input:not(.text-input--disabled):not(.text-input--focused):not(.text-input--error):hover {
  --text-input-border-color: var(--field-border-hover);
}

.text-input:focus-within:not(.text-input--disabled),
.text-input--focused:not(.text-input--disabled) {
  --text-input-bg: var(--field-bg-focus);
  --text-input-border-color: var(--field-border-focus);
}

.text-input--error {
  --text-input-bg: var(--field-bg);
  --text-input-border-color: var(--field-border-danger);
  --text-input-help-color: var(--text-danger);
}

.text-input--disabled {
  --text-input-bg: var(--surface-disabled);
  --text-input-border-color: var(--border-disabled);
  --text-input-color: var(--text-disabled);
  --text-input-placeholder-color: var(--text-disabled);
  --text-input-cursor: not-allowed;
}
</style>
