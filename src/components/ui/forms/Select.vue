<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Icon } from '../icons'

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

const selectId = computed(() => props.id ?? `select-${generatedId}`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const displayHelpText = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : props.helpText,
)

const helpId = computed(() => (displayHelpText.value ? `${selectId.value}-help` : undefined))

const isShowingPlaceholder = computed(() => Boolean(props.placeholder) && !props.modelValue)

const rootClasses = computed(() => [
  'select',
  `select--${props.variant}`,
  isFocused.value && !props.disabled ? 'select--focused' : undefined,
  isShowingPlaceholder.value ? 'select--placeholder' : undefined,
  hasError.value ? 'select--error' : undefined,
  props.disabled ? 'select--disabled' : undefined,
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
    <div class="select__field">
      <label v-if="label" :for="selectId" class="select__label">
        {{ label }}
      </label>
      <div class="select__control-wrapper">
        <select
          :id="selectId"
          :name="name"
          :value="modelValue"
          :disabled="disabled"
          :required="required"
          :aria-label="label ? undefined : ariaLabel"
          :aria-invalid="hasError ? 'true' : undefined"
          :aria-describedby="helpId"
          class="select__control"
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
        <Icon
          name="arrow-down"
          size="lg"
          :color="disabled ? 'disabled' : 'primary'"
          class="select__icon"
        />
      </div>
    </div>
    <p
      v-if="displayHelpText"
      :id="helpId"
      class="select__help"
      :role="hasError ? 'alert' : undefined"
    >
      {{ displayHelpText }}
    </p>
  </div>
</template>

<style scoped>
.select {
  --select-bg: var(--field-bg);
  --select-bg-hover: var(--field-bg);
  --select-border-color: var(--field-border);
  --select-border-hover: var(--field-border-hover);
  --select-border-width: var(--border-width-thin);
  --select-radius: var(--radius-none);
  --select-color: var(--text-primary);
  --select-label-color: var(--text-primary);
  --select-help-color: var(--text-helper);
  --select-min-height: 38px;
  --select-width: 100%;
  --select-padding-y: var(--spacing-3);
  --select-padding-left: var(--spacing-3);
  --select-icon-size: 20px;
  --select-padding-right: calc(var(--select-icon-size) + var(--spacing-5));
  --select-icon-offset: var(--spacing-3);
  --select-label-gap: var(--spacing-3);
  --select-help-gap: var(--spacing-2);
  --select-font-family: var(--type-body-compact-02-font-family);
  --select-font-size: var(--type-body-compact-02-font-size);
  --select-line-height: var(--type-body-compact-02-line-height);
  --select-font-weight: var(--type-body-compact-02-font-weight);
  --select-text-transform: var(--type-body-compact-02-text-transform);
  --select-transition-duration: var(--duration-fast);
  --select-transition-easing: var(--easing-standard);
  --select-cursor: pointer;

  display: flex;
  flex-direction: column;
  gap: var(--select-help-gap);
  width: var(--select-width);
  box-sizing: border-box;
}

.select__field {
  display: flex;
  flex-direction: column;
  gap: var(--select-label-gap);
}

.select__label {
  color: var(--select-label-color);
  font-family: var(--select-font-family);
  font-size: var(--select-font-size);
  line-height: var(--select-line-height);
  font-weight: var(--select-font-weight);
  text-transform: var(--select-text-transform);
}

.select__control-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.select__control {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  min-height: var(--select-min-height);
  padding: var(--select-padding-y) var(--select-padding-right) var(--select-padding-y)
    var(--select-padding-left);
  box-sizing: border-box;
  background-color: var(--select-bg);
  color: var(--select-color);
  border: var(--select-border-width) solid var(--select-border-color);
  border-radius: var(--select-radius);
  font-family: var(--select-font-family);
  font-size: var(--select-font-size);
  line-height: var(--select-line-height);
  font-weight: var(--select-font-weight);
  text-transform: var(--select-text-transform);
  cursor: var(--select-cursor);
  outline: none;
  transition:
    background-color var(--select-transition-duration) var(--select-transition-easing),
    border-color var(--select-transition-duration) var(--select-transition-easing),
    color var(--select-transition-duration) var(--select-transition-easing);
}

.select__icon {
  position: absolute;
  right: var(--select-icon-offset);
  pointer-events: none;
}

.select__help {
  margin: var(--spacing-0);
  color: var(--select-help-color);
  font-family: var(--select-font-family);
  font-size: var(--select-font-size);
  line-height: var(--select-line-height);
  font-weight: var(--select-font-weight);
  text-transform: var(--select-text-transform);
}

.select--default {
  --select-min-height: 38px;
  --select-bg: var(--field-bg);
  --select-bg-hover: var(--field-bg);
  --select-border-color: var(--field-border);
  --select-border-hover: var(--field-border-hover);
  --select-width: 100%;
}

.select--inline {
  --select-min-height: 36px;
  --select-bg: var(--surface-transparent);
  --select-bg-hover: var(--surface-subtle-hover);
  --select-border-color: var(--border-transparent);
  --select-border-hover: var(--border-transparent);
  --select-width: fit-content;
}

.select--placeholder {
  --select-color: var(--text-placeholder);
}

.select:not(.select--disabled):not(.select--focused):not(.select--error):hover {
  --select-bg: var(--select-bg-hover);
  --select-border-color: var(--select-border-hover);
}

.select:focus-within:not(.select--disabled),
.select--focused:not(.select--disabled) {
  --select-bg: var(--field-bg-focus);
  --select-border-color: var(--field-border-focus);
}

.select--error {
  --select-bg: var(--field-bg);
  --select-border-color: var(--field-border-danger);
  --select-help-color: var(--text-danger);
}

.select--disabled {
  --select-bg: var(--surface-disabled);
  --select-border-color: var(--border-disabled);
  --select-color: var(--text-disabled);
  --select-cursor: not-allowed;
}
</style>
