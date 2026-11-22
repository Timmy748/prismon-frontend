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

const inputId = computed(() => props.id ?? `app-text-input-${generatedId}`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const displayHelpText = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : props.helpText,
)

const helpId = computed(() => (displayHelpText.value ? `${inputId.value}-help` : undefined))

const rootClasses = computed(() => [
  'app-text-input',
  isFocused.value && !props.disabled ? 'app-text-input--focused' : undefined,
  hasError.value ? 'app-text-input--error' : undefined,
  props.disabled ? 'app-text-input--disabled' : undefined,
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
    <div class="app-text-input__field">
      <label v-if="label" :for="inputId" class="app-text-input__label">
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
        class="app-text-input__control"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    <p
      v-if="displayHelpText"
      :id="helpId"
      class="app-text-input__help"
      :role="hasError ? 'alert' : undefined"
    >
      {{ displayHelpText }}
    </p>
  </div>
</template>

<style scoped>
.app-text-input {
  --app-text-input-bg: var(--field-bg);
  --app-text-input-border-color: var(--field-border);
  --app-text-input-border-width: var(--border-width-thin);
  --app-text-input-radius: var(--radius-none);
  --app-text-input-color: var(--text-primary);
  --app-text-input-placeholder-color: var(--text-placeholder);
  --app-text-input-label-color: var(--text-primary);
  --app-text-input-help-color: var(--text-helper);
  --app-text-input-min-height: var(--size-control-input);
  --app-text-input-padding: var(--spacing-3);
  --app-text-input-label-gap: var(--spacing-3);
  --app-text-input-help-gap: var(--spacing-2);
  --app-text-input-font-family: var(--type-body-compact-02-font-family);
  --app-text-input-font-size: var(--type-body-compact-02-font-size);
  --app-text-input-line-height: var(--type-body-compact-02-line-height);
  --app-text-input-font-weight: var(--type-body-compact-02-font-weight);
  --app-text-input-text-transform: var(--type-body-compact-02-text-transform);
  --app-text-input-transition-duration: var(--duration-fast);
  --app-text-input-transition-easing: var(--easing-standard);
  --app-text-input-cursor: text;

  display: flex;
  flex-direction: column;
  gap: var(--app-text-input-help-gap);
  width: 100%;
  box-sizing: border-box;
}

.app-text-input__field {
  display: flex;
  flex-direction: column;
  gap: var(--app-text-input-label-gap);
}

.app-text-input__label {
  color: var(--app-text-input-label-color);
  font-family: var(--app-text-input-font-family);
  font-size: var(--app-text-input-font-size);
  line-height: var(--app-text-input-line-height);
  font-weight: var(--app-text-input-font-weight);
  text-transform: var(--app-text-input-text-transform);
}

.app-text-input__control {
  width: 100%;
  min-height: var(--app-text-input-min-height);
  padding: var(--app-text-input-padding);
  box-sizing: border-box;
  background-color: var(--app-text-input-bg);
  color: var(--app-text-input-color);
  border: var(--app-text-input-border-width) solid var(--app-text-input-border-color);
  border-radius: var(--app-text-input-radius);
  font-family: var(--app-text-input-font-family);
  font-size: var(--app-text-input-font-size);
  line-height: var(--app-text-input-line-height);
  font-weight: var(--app-text-input-font-weight);
  text-transform: var(--app-text-input-text-transform);
  cursor: var(--app-text-input-cursor);
  outline: none;
  transition:
    background-color var(--app-text-input-transition-duration)
      var(--app-text-input-transition-easing),
    border-color var(--app-text-input-transition-duration) var(--app-text-input-transition-easing),
    color var(--app-text-input-transition-duration) var(--app-text-input-transition-easing);
}

.app-text-input__control::placeholder {
  color: var(--app-text-input-placeholder-color);
}

.app-text-input__help {
  margin: var(--spacing-0);
  color: var(--app-text-input-help-color);
  font-family: var(--app-text-input-font-family);
  font-size: var(--app-text-input-font-size);
  line-height: var(--app-text-input-line-height);
  font-weight: var(--app-text-input-font-weight);
  text-transform: var(--app-text-input-text-transform);
}

.app-text-input:not(.app-text-input--disabled):not(.app-text-input--focused):not(
    .app-text-input--error
  ):hover {
  --app-text-input-border-color: var(--field-border-hover);
}

.app-text-input:focus-within:not(.app-text-input--disabled),
.app-text-input--focused:not(.app-text-input--disabled) {
  --app-text-input-bg: var(--field-bg-focus);
  --app-text-input-border-color: var(--field-border-focus);
}

.app-text-input--error {
  --app-text-input-bg: var(--field-bg);
  --app-text-input-border-color: var(--field-border-danger);
  --app-text-input-help-color: var(--text-danger);
}

.app-text-input--disabled {
  --app-text-input-bg: var(--surface-disabled);
  --app-text-input-border-color: var(--border-disabled);
  --app-text-input-color: var(--text-disabled);
  --app-text-input-placeholder-color: var(--text-disabled);
  --app-text-input-cursor: not-allowed;
}
</style>
