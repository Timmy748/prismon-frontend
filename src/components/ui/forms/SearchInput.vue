<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '../icons'

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
  'search-input',
  isFocused.value && !props.disabled ? 'search-input--focused' : undefined,
  props.disabled ? 'search-input--disabled' : undefined,
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
    <Icon
      name="search"
      size="lg"
      :color="disabled ? 'disabled' : 'helper'"
      class="search-input__icon"
    />
    <input
      :id="id"
      :name="name"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel"
      :disabled="disabled"
      class="search-input__control"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter="handleSearch"
    />
  </div>
</template>

<style scoped>
.search-input {
  --search-input-bg: var(--field-bg);
  --search-input-border-color: var(--field-border);
  --search-input-border-width: var(--border-width-thin);
  --search-input-radius: var(--radius-none);
  --search-input-color: var(--text-primary);
  --search-input-placeholder-color: var(--text-placeholder);
  --search-input-min-height: 38px;
  --search-input-padding: var(--spacing-3);
  --search-input-gap: var(--spacing-3);
  --search-input-font-family: var(--type-body-compact-02-font-family);
  --search-input-font-size: var(--type-body-compact-02-font-size);
  --search-input-line-height: var(--type-body-compact-02-line-height);
  --search-input-font-weight: var(--type-body-compact-02-font-weight);
  --search-input-text-transform: var(--type-body-compact-02-text-transform);
  --search-input-transition-duration: var(--duration-fast);
  --search-input-transition-easing: var(--easing-hover);
  --search-input-cursor: text;

  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--search-input-min-height);
  padding: var(--search-input-padding);
  gap: var(--search-input-gap);
  box-sizing: border-box;
  background-color: var(--search-input-bg);
  border: var(--search-input-border-width) solid var(--search-input-border-color);
  border-radius: var(--search-input-radius);
  cursor: var(--search-input-cursor);
  transition:
    background-color var(--search-input-transition-duration) var(--search-input-transition-easing),
    border-color var(--search-input-transition-duration) var(--search-input-transition-easing);
}

.search-input__icon {
  flex-shrink: 0;
}

.search-input__control {
  flex: 1;
  min-width: var(--spacing-0);
  padding: var(--spacing-0);
  border: var(--border-width-none);
  background-color: var(--surface-transparent);
  color: var(--search-input-color);
  font-family: var(--search-input-font-family);
  font-size: var(--search-input-font-size);
  line-height: var(--search-input-line-height);
  font-weight: var(--search-input-font-weight);
  text-transform: var(--search-input-text-transform);
  cursor: var(--search-input-cursor);
  outline: none;
}

.search-input__control::placeholder {
  color: var(--search-input-placeholder-color);
}

.search-input__control::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

@media (hover: hover) and (pointer: fine) {
  .search-input:not(.search-input--disabled):not(.search-input--focused):hover {
    --search-input-border-color: var(--field-border-hover);
  }
}

.search-input:focus-within:not(.search-input--disabled),
.search-input--focused:not(.search-input--disabled) {
  --search-input-bg: var(--field-bg-focus);
  --search-input-border-color: var(--field-border-focus);
}

.search-input--disabled {
  --search-input-bg: var(--surface-disabled);
  --search-input-border-color: var(--border-disabled);
  --search-input-color: var(--text-disabled);
  --search-input-placeholder-color: var(--text-disabled);
  --search-input-cursor: not-allowed;
}
</style>
