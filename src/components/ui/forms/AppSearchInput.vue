<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppIcon } from '../icons'

interface Props {
  modelValue?: string
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'search',
  ariaLabel: 'Buscar',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const isFocused = ref(false)

const rootClasses = computed(() => [
  'app-search-input',
  isFocused.value && !props.disabled ? 'app-search-input--focused' : undefined,
  props.disabled ? 'app-search-input--disabled' : undefined,
])

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
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

function handleSearch(event: Event) {
  if (props.disabled) {
    return
  }
  const target = event.target as HTMLInputElement
  emit('search', target.value)
}
</script>

<template>
  <div :class="rootClasses">
    <AppIcon
      name="search"
      size="lg"
      :color="disabled ? 'disabled' : 'helper'"
      class="app-search-input__icon"
    />
    <input
      :id="id"
      :name="name"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :disabled="disabled"
      class="app-search-input__control"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter="handleSearch"
    />
  </div>
</template>

<style scoped>
.app-search-input {
  --app-search-input-bg: var(--field-bg);
  --app-search-input-border-color: var(--field-border);
  --app-search-input-border-width: var(--border-width-thin);
  --app-search-input-radius: var(--radius-none);
  --app-search-input-color: var(--text-primary);
  --app-search-input-placeholder-color: var(--text-placeholder);
  --app-search-input-min-height: var(--size-control-input);
  --app-search-input-padding: var(--spacing-3);
  --app-search-input-gap: var(--spacing-3);
  --app-search-input-font-family: var(--type-body-compact-02-font-family);
  --app-search-input-font-size: var(--type-body-compact-02-font-size);
  --app-search-input-line-height: var(--type-body-compact-02-line-height);
  --app-search-input-font-weight: var(--type-body-compact-02-font-weight);
  --app-search-input-text-transform: var(--type-body-compact-02-text-transform);
  --app-search-input-transition-duration: var(--duration-fast);
  --app-search-input-transition-easing: var(--easing-standard);
  --app-search-input-cursor: text;

  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--app-search-input-min-height);
  padding: var(--app-search-input-padding);
  gap: var(--app-search-input-gap);
  box-sizing: border-box;
  background-color: var(--app-search-input-bg);
  border: var(--app-search-input-border-width) solid var(--app-search-input-border-color);
  border-radius: var(--app-search-input-radius);
  cursor: var(--app-search-input-cursor);
  transition:
    background-color var(--app-search-input-transition-duration)
      var(--app-search-input-transition-easing),
    border-color var(--app-search-input-transition-duration)
      var(--app-search-input-transition-easing);
}

.app-search-input__icon {
  flex-shrink: 0;
}

.app-search-input__control {
  flex: 1;
  min-width: var(--spacing-0);
  padding: var(--spacing-0);
  border: var(--border-width-none);
  background-color: var(--surface-transparent);
  color: var(--app-search-input-color);
  font-family: var(--app-search-input-font-family);
  font-size: var(--app-search-input-font-size);
  line-height: var(--app-search-input-line-height);
  font-weight: var(--app-search-input-font-weight);
  text-transform: var(--app-search-input-text-transform);
  cursor: var(--app-search-input-cursor);
  outline: none;
}

.app-search-input__control::placeholder {
  color: var(--app-search-input-placeholder-color);
}

.app-search-input__control::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.app-search-input:not(.app-search-input--disabled):not(.app-search-input--focused):hover {
  --app-search-input-border-color: var(--field-border-hover);
}

.app-search-input:focus-within:not(.app-search-input--disabled),
.app-search-input--focused:not(.app-search-input--disabled) {
  --app-search-input-bg: var(--field-bg-focus);
  --app-search-input-border-color: var(--field-border-focus);
}

.app-search-input--disabled {
  --app-search-input-bg: var(--surface-disabled);
  --app-search-input-border-color: var(--border-disabled);
  --app-search-input-color: var(--text-disabled);
  --app-search-input-placeholder-color: var(--text-disabled);
  --app-search-input-cursor: not-allowed;
}
</style>
