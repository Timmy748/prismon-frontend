<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { AppIcon } from '../icons'

export type SelectVariant = 'default' | 'inline'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

interface Props {
  modelValue?: string
  options: SelectOption[]
  variant?: SelectVariant
  label?: string
  placeholder?: string
  helpText?: string
  error?: string | boolean
  id?: string
  name?: string
  disabled?: boolean
  required?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  variant: 'default',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const generatedId = useId()
const isFocused = ref(false)

const selectId = computed(() => props.id ?? `app-select-${generatedId}`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const displayHelpText = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : props.helpText,
)

const helpId = computed(() => (displayHelpText.value ? `${selectId.value}-help` : undefined))

const isShowingPlaceholder = computed(() => Boolean(props.placeholder) && !props.modelValue)

const rootClasses = computed(() => [
  'app-select',
  `app-select--${props.variant}`,
  isFocused.value && !props.disabled ? 'app-select--focused' : undefined,
  isShowingPlaceholder.value ? 'app-select--placeholder' : undefined,
  hasError.value ? 'app-select--error' : undefined,
  props.disabled ? 'app-select--disabled' : undefined,
])

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change', target.value)
}

function handleFocus() {
  if (props.disabled) {
    return
  }
  isFocused.value = true
}

function handleBlur() {
  isFocused.value = false
}
</script>

<template>
  <div :class="rootClasses">
    <div class="app-select__field">
      <label v-if="label" :for="selectId" class="app-select__label">
        {{ label }}
      </label>
      <div class="app-select__control-wrapper">
        <select
          :id="selectId"
          :name="name"
          :value="modelValue"
          :disabled="disabled"
          :required="required"
          :aria-label="label ? undefined : ariaLabel"
          :aria-invalid="hasError ? 'true' : undefined"
          :aria-describedby="helpId"
          class="app-select__control"
          @change="handleChange"
          @focus="handleFocus"
          @blur="handleBlur"
        >
          <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
          <option
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </option>
        </select>
        <AppIcon
          name="arrow-down"
          size="lg"
          :color="disabled ? 'disabled' : 'primary'"
          class="app-select__icon"
        />
      </div>
    </div>
    <p
      v-if="displayHelpText"
      :id="helpId"
      class="app-select__help"
      :role="hasError ? 'alert' : undefined"
    >
      {{ displayHelpText }}
    </p>
  </div>
</template>

<style scoped>
.app-select {
  --app-select-bg: var(--field-bg);
  --app-select-bg-hover: var(--field-bg);
  --app-select-border-color: var(--field-border);
  --app-select-border-hover: var(--field-border-hover);
  --app-select-border-width: var(--border-width-thin);
  --app-select-radius: var(--radius-none);
  --app-select-color: var(--text-primary);
  --app-select-label-color: var(--text-primary);
  --app-select-help-color: var(--text-helper);
  --app-select-min-height: var(--size-control-input);
  --app-select-width: 100%;
  --app-select-padding-y: var(--spacing-3);
  --app-select-padding-left: var(--spacing-3);
  --app-select-padding-right: calc(var(--icon-size-lg) + var(--spacing-5));
  --app-select-icon-offset: var(--spacing-3);
  --app-select-label-gap: var(--spacing-3);
  --app-select-help-gap: var(--spacing-2);
  --app-select-font-family: var(--type-body-compact-02-font-family);
  --app-select-font-size: var(--type-body-compact-02-font-size);
  --app-select-line-height: var(--type-body-compact-02-line-height);
  --app-select-font-weight: var(--type-body-compact-02-font-weight);
  --app-select-text-transform: var(--type-body-compact-02-text-transform);
  --app-select-transition-duration: var(--duration-fast);
  --app-select-transition-easing: var(--easing-standard);
  --app-select-cursor: pointer;

  display: flex;
  flex-direction: column;
  gap: var(--app-select-help-gap);
  width: var(--app-select-width);
  box-sizing: border-box;
}

.app-select__field {
  display: flex;
  flex-direction: column;
  gap: var(--app-select-label-gap);
}

.app-select__label {
  color: var(--app-select-label-color);
  font-family: var(--app-select-font-family);
  font-size: var(--app-select-font-size);
  line-height: var(--app-select-line-height);
  font-weight: var(--app-select-font-weight);
  text-transform: var(--app-select-text-transform);
}

.app-select__control-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.app-select__control {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  min-height: var(--app-select-min-height);
  padding: var(--app-select-padding-y) var(--app-select-padding-right) var(--app-select-padding-y)
    var(--app-select-padding-left);
  box-sizing: border-box;
  background-color: var(--app-select-bg);
  color: var(--app-select-color);
  border: var(--app-select-border-width) solid var(--app-select-border-color);
  border-radius: var(--app-select-radius);
  font-family: var(--app-select-font-family);
  font-size: var(--app-select-font-size);
  line-height: var(--app-select-line-height);
  font-weight: var(--app-select-font-weight);
  text-transform: var(--app-select-text-transform);
  cursor: var(--app-select-cursor);
  outline: none;
  transition:
    background-color var(--app-select-transition-duration) var(--app-select-transition-easing),
    border-color var(--app-select-transition-duration) var(--app-select-transition-easing),
    color var(--app-select-transition-duration) var(--app-select-transition-easing);
}

.app-select__icon {
  position: absolute;
  right: var(--app-select-icon-offset);
  pointer-events: none;
}

.app-select__help {
  margin: var(--spacing-0);
  color: var(--app-select-help-color);
  font-family: var(--app-select-font-family);
  font-size: var(--app-select-font-size);
  line-height: var(--app-select-line-height);
  font-weight: var(--app-select-font-weight);
  text-transform: var(--app-select-text-transform);
}

.app-select--default {
  --app-select-min-height: var(--size-control-input);
  --app-select-bg: var(--field-bg);
  --app-select-bg-hover: var(--field-bg);
  --app-select-border-color: var(--field-border);
  --app-select-border-hover: var(--field-border-hover);
  --app-select-width: 100%;
}

.app-select--inline {
  --app-select-min-height: var(--size-control-md);
  --app-select-bg: var(--surface-transparent);
  --app-select-bg-hover: var(--surface-subtle-hover);
  --app-select-border-color: var(--border-transparent);
  --app-select-border-hover: var(--border-transparent);
  --app-select-width: fit-content;
}

.app-select--placeholder {
  --app-select-color: var(--text-placeholder);
}

.app-select:not(.app-select--disabled):not(.app-select--focused):not(.app-select--error):hover {
  --app-select-bg: var(--app-select-bg-hover);
  --app-select-border-color: var(--app-select-border-hover);
}

.app-select:focus-within:not(.app-select--disabled),
.app-select--focused:not(.app-select--disabled) {
  --app-select-bg: var(--field-bg-focus);
  --app-select-border-color: var(--field-border-focus);
}

.app-select--error {
  --app-select-bg: var(--field-bg);
  --app-select-border-color: var(--field-border-danger);
  --app-select-help-color: var(--text-danger);
}

.app-select--disabled {
  --app-select-bg: var(--surface-disabled);
  --app-select-border-color: var(--border-disabled);
  --app-select-color: var(--text-disabled);
  --app-select-cursor: not-allowed;
}
</style>
