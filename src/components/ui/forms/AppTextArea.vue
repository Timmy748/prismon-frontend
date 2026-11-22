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

const textareaId = computed(() => props.id ?? `app-text-area-${generatedId}`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const displayHelpText = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : props.helpText,
)

const helpId = computed(() => (displayHelpText.value ? `${textareaId.value}-help` : undefined))

const rootClasses = computed(() => [
  'app-text-area',
  isFocused.value && !props.disabled ? 'app-text-area--focused' : undefined,
  hasError.value ? 'app-text-area--error' : undefined,
  props.disabled ? 'app-text-area--disabled' : undefined,
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
    <div class="app-text-area__field">
      <label v-if="label" :for="textareaId" class="app-text-area__label">
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
        class="app-text-area__control"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>
    <p
      v-if="displayHelpText"
      :id="helpId"
      class="app-text-area__help"
      :role="hasError ? 'alert' : undefined"
    >
      {{ displayHelpText }}
    </p>
  </div>
</template>

<style scoped>
.app-text-area {
  --app-text-area-bg: var(--field-bg);
  --app-text-area-border-color: var(--field-border);
  --app-text-area-border-width: var(--border-width-thin);
  --app-text-area-radius: var(--radius-none);
  --app-text-area-color: var(--text-primary);
  --app-text-area-placeholder-color: var(--text-placeholder);
  --app-text-area-label-color: var(--text-primary);
  --app-text-area-help-color: var(--text-helper);
  --app-text-area-min-height: var(--size-textarea-min-height);
  --app-text-area-padding: var(--spacing-3);
  --app-text-area-label-gap: var(--spacing-3);
  --app-text-area-help-gap: var(--spacing-2);
  --app-text-area-resize: vertical;
  --app-text-area-font-family: var(--type-body-compact-02-font-family);
  --app-text-area-font-size: var(--type-body-compact-02-font-size);
  --app-text-area-line-height: var(--type-body-compact-02-line-height);
  --app-text-area-font-weight: var(--type-body-compact-02-font-weight);
  --app-text-area-text-transform: var(--type-body-compact-02-text-transform);
  --app-text-area-transition-duration: var(--duration-fast);
  --app-text-area-transition-easing: var(--easing-standard);
  --app-text-area-cursor: text;

  display: flex;
  flex-direction: column;
  gap: var(--app-text-area-help-gap);
  width: 100%;
  box-sizing: border-box;
}

.app-text-area__field {
  display: flex;
  flex-direction: column;
  gap: var(--app-text-area-label-gap);
}

.app-text-area__label {
  color: var(--app-text-area-label-color);
  font-family: var(--app-text-area-font-family);
  font-size: var(--app-text-area-font-size);
  line-height: var(--app-text-area-line-height);
  font-weight: var(--app-text-area-font-weight);
  text-transform: var(--app-text-area-text-transform);
}

.app-text-area__control {
  width: 100%;
  min-height: var(--app-text-area-min-height);
  padding: var(--app-text-area-padding);
  box-sizing: border-box;
  resize: var(--app-text-area-resize);
  background-color: var(--app-text-area-bg);
  color: var(--app-text-area-color);
  border: var(--app-text-area-border-width) solid var(--app-text-area-border-color);
  border-radius: var(--app-text-area-radius);
  font-family: var(--app-text-area-font-family);
  font-size: var(--app-text-area-font-size);
  line-height: var(--app-text-area-line-height);
  font-weight: var(--app-text-area-font-weight);
  text-transform: var(--app-text-area-text-transform);
  cursor: var(--app-text-area-cursor);
  outline: none;
  transition:
    background-color var(--app-text-area-transition-duration) var(--app-text-area-transition-easing),
    border-color var(--app-text-area-transition-duration) var(--app-text-area-transition-easing),
    color var(--app-text-area-transition-duration) var(--app-text-area-transition-easing);
}

.app-text-area__control::placeholder {
  color: var(--app-text-area-placeholder-color);
}

.app-text-area__help {
  margin: var(--spacing-0);
  color: var(--app-text-area-help-color);
  font-family: var(--app-text-area-font-family);
  font-size: var(--app-text-area-font-size);
  line-height: var(--app-text-area-line-height);
  font-weight: var(--app-text-area-font-weight);
  text-transform: var(--app-text-area-text-transform);
}

.app-text-area:not(.app-text-area--disabled):not(.app-text-area--focused):not(
    .app-text-area--error
  ):hover {
  --app-text-area-border-color: var(--field-border-hover);
}

.app-text-area:focus-within:not(.app-text-area--disabled),
.app-text-area--focused:not(.app-text-area--disabled) {
  --app-text-area-bg: var(--field-bg-focus);
  --app-text-area-border-color: var(--field-border-focus);
}

.app-text-area--error {
  --app-text-area-bg: var(--field-bg);
  --app-text-area-border-color: var(--field-border-danger);
  --app-text-area-help-color: var(--text-danger);
}

.app-text-area--disabled {
  --app-text-area-bg: var(--surface-disabled);
  --app-text-area-border-color: var(--border-disabled);
  --app-text-area-color: var(--text-disabled);
  --app-text-area-placeholder-color: var(--text-disabled);
  --app-text-area-cursor: not-allowed;
}
</style>
