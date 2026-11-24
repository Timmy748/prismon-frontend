<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { Icon } from '../icons'
import { useEscapeKey } from '../overlays/useEscapeKey'
import { hasOverlayPortalRoot } from '../overlays/useOverlayBackdropBlur'

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
const isOpen = ref(false)
const highlightedIndex = ref(-1)

const wrapperRef = ref<HTMLDivElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const menuRef = ref<HTMLDivElement | null>(null)
const menuCoords = ref<{ top: number; left: number; minWidth: number; transformOrigin: string }>({
  top: 0,
  left: 0,
  minWidth: 168,
  transformOrigin: 'top left',
})

const canTeleportOverlay = hasOverlayPortalRoot()

const selectId = computed(() => props.id ?? `select-${generatedId}`)
const labelId = computed(() => `${selectId.value}-label`)
const listboxId = computed(() => `${selectId.value}-listbox`)

const hasError = computed(() =>
  typeof props.error === 'string' ? props.error.length > 0 : Boolean(props.error),
)

const displayHelpText = computed(() =>
  typeof props.error === 'string' && props.error.length > 0 ? props.error : props.helpText,
)

const helpId = computed(() => (displayHelpText.value ? `${selectId.value}-help` : undefined))

const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue),
)

const displayLabel = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value.label
  }
  return props.placeholder ?? ''
})

const isShowingPlaceholder = computed(
  () => !selectedOption.value && Boolean(props.placeholder),
)

const enabledIndices = computed(() =>
  props.options.reduce<number[]>((indices, option, index) => {
    if (!option.disabled) {
      indices.push(index)
    }
    return indices
  }, []),
)

const activeDescendantId = computed(() => {
  if (!isOpen.value || highlightedIndex.value < 0) {
    return undefined
  }
  return getOptionId(highlightedIndex.value)
})

const rootClasses = computed(() => [
  'select',
  `select--${props.variant}`,
  isFocused.value && !props.disabled ? 'select--focused' : undefined,
  isOpen.value && !props.disabled ? 'select--open' : undefined,
  isShowingPlaceholder.value ? 'select--placeholder' : undefined,
  hasError.value ? 'select--error' : undefined,
  props.disabled ? 'select--disabled' : undefined,
])

const menuStyle = computed(() => ({
  top: `${menuCoords.value.top}px`,
  left: `${menuCoords.value.left}px`,
  minWidth: `${menuCoords.value.minWidth}px`,
  transformOrigin: menuCoords.value.transformOrigin,
}))

function getOptionId(index: number): string {
  return `${listboxId.value}-option-${index}`
}

function getInitialHighlightIndex(direction: 'first' | 'last' = 'first'): number {
  const selectedIndex = props.options.findIndex(
    (option) => option.value === props.modelValue && !option.disabled,
  )
  if (selectedIndex >= 0) {
    return selectedIndex
  }
  const indices = enabledIndices.value
  if (indices.length === 0) {
    return -1
  }
  return direction === 'last' ? (indices[indices.length - 1] ?? -1) : (indices[0] ?? -1)
}

function updatePosition() {
  if (typeof window === 'undefined' || !triggerRef.value) {
    return
  }

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const menuRect = menuRef.value?.getBoundingClientRect()
  const minWidth = Math.max(168, triggerRect.width)
  const menuWidth = Math.max(minWidth, menuRect?.width ?? minWidth)
  const menuHeight = menuRect?.height ?? Math.min(280, props.options.length * 38 + 8)
  const viewportPadding = 8
  const bottomGap = 4

  let top = triggerRect.bottom + bottomGap
  let transformOrigin = 'top left'
  if (
    top + menuHeight > window.innerHeight - viewportPadding &&
    triggerRect.top > menuHeight + bottomGap
  ) {
    top = Math.max(viewportPadding, triggerRect.top - menuHeight - bottomGap)
    transformOrigin = 'bottom left'
  }

  let left = triggerRect.left
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuWidth - viewportPadding))

  menuCoords.value = {
    top,
    left,
    minWidth,
    transformOrigin,
  }
}

async function openMenu(initialDirection: 'first' | 'last' = 'first') {
  if (props.disabled) {
    return
  }
  highlightedIndex.value = getInitialHighlightIndex(initialDirection)
  isOpen.value = true
  await nextTick()
  updatePosition()
}

function close(restoreFocus = false) {
  isOpen.value = false
  highlightedIndex.value = -1
  if (restoreFocus) {
    triggerRef.value?.focus()
  }
}

function toggle() {
  if (props.disabled) {
    return
  }
  if (isOpen.value) {
    close()
  } else {
    void openMenu()
  }
}

function selectOption(option: SelectOption) {
  if (props.disabled || option.disabled) {
    return
  }
  close(true)
  emit('update:modelValue', option.value)
  emit('change', option.value)
}

function moveHighlight(delta: 1 | -1) {
  const indices = enabledIndices.value
  if (indices.length === 0) {
    highlightedIndex.value = -1
    return
  }
  const currentPos = indices.indexOf(highlightedIndex.value)
  if (currentPos === -1) {
    highlightedIndex.value = delta === 1 ? indices[0]! : indices[indices.length - 1]!
    return
  }
  const nextPos = Math.max(0, Math.min(indices.length - 1, currentPos + delta))
  highlightedIndex.value = indices[nextPos]!
}

function handleOptionMouseEnter(index: number, option: SelectOption) {
  if (!option.disabled) {
    highlightedIndex.value = index
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (props.disabled) {
    return
  }

  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault()
      if (!isOpen.value) {
        void openMenu('first')
      } else {
        moveHighlight(1)
      }
      break
    }
    case 'ArrowUp': {
      event.preventDefault()
      if (!isOpen.value) {
        void openMenu('last')
      } else {
        moveHighlight(-1)
      }
      break
    }
    case 'Home': {
      event.preventDefault()
      if (!isOpen.value) {
        void openMenu('first')
      } else {
        highlightedIndex.value = enabledIndices.value[0] ?? -1
      }
      break
    }
    case 'End': {
      event.preventDefault()
      if (!isOpen.value) {
        void openMenu('last')
      } else {
        const indices = enabledIndices.value
        highlightedIndex.value = indices[indices.length - 1] ?? -1
      }
      break
    }
    case 'Enter':
    case ' ': {
      event.preventDefault()
      if (!isOpen.value) {
        void openMenu('first')
      } else if (highlightedIndex.value >= 0) {
        const option = props.options[highlightedIndex.value]
        if (option && !option.disabled) {
          selectOption(option)
        }
      }
      break
    }
    case 'Escape': {
      if (isOpen.value) {
        event.preventDefault()
        close(true)
      }
      break
    }
    case 'Tab': {
      if (isOpen.value) {
        close()
      }
      break
    }
  }
}

function handleFocus() {
  if (props.disabled) {
    return
  }
  isFocused.value = true
}

function handleBlur(event: FocusEvent) {
  const nextTarget = event.relatedTarget as Node | null
  if (
    nextTarget &&
    (wrapperRef.value?.contains(nextTarget) || menuRef.value?.contains(nextTarget))
  ) {
    return
  }
  isFocused.value = false
  if (isOpen.value) {
    close()
  }
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!isOpen.value) {
    return
  }
  const target = event.target as Node | null
  if (!target) {
    return
  }
  if (wrapperRef.value?.contains(target) || menuRef.value?.contains(target)) {
    return
  }
  close()
}

function handleWindowResizeOrScroll() {
  if (!isOpen.value) {
    return
  }
  updatePosition()
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }
  if (open) {
    document.addEventListener('pointerdown', handleDocumentPointerDown, true)
    window.addEventListener('resize', handleWindowResizeOrScroll)
    window.addEventListener('scroll', handleWindowResizeOrScroll, true)
  } else {
    document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
    window.removeEventListener('resize', handleWindowResizeOrScroll)
    window.removeEventListener('scroll', handleWindowResizeOrScroll, true)
  }
})

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled && isOpen.value) {
      close()
    }
  },
)

useEscapeKey(
  () => isOpen.value,
  () => close(true),
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowResizeOrScroll)
    window.removeEventListener('scroll', handleWindowResizeOrScroll, true)
  }
})
</script>

<template>
  <div ref="wrapperRef" :class="rootClasses">
    <div class="select__field">
      <label v-if="label" :id="labelId" :for="selectId" class="select__label">
        {{ label }}
      </label>
      <div class="select__control-wrapper">
        <button
          :id="selectId"
          ref="triggerRef"
          type="button"
          role="combobox"
          :disabled="disabled"
          :aria-label="label ? undefined : ariaLabel"
          :aria-labelledby="label ? labelId : undefined"
          :aria-expanded="isOpen ? 'true' : 'false'"
          aria-haspopup="listbox"
          :aria-controls="isOpen ? listboxId : undefined"
          :aria-activedescendant="activeDescendantId"
          :aria-required="required ? 'true' : undefined"
          :aria-invalid="hasError ? 'true' : undefined"
          :aria-describedby="helpId"
          class="select__control"
          @click="toggle"
          @keydown="handleKeydown"
          @focus="handleFocus"
          @blur="handleBlur"
        >
          <span class="select__value">{{ displayLabel }}</span>
          <Icon
            name="arrow-down"
            size="lg"
            :color="disabled ? 'disabled' : 'primary'"
            :class="['select__icon', isOpen ? 'select__icon--open' : undefined]"
          />
        </button>
        <input v-if="name" type="hidden" :name="name" :value="modelValue" :disabled="disabled" />
      </div>
    </div>

    <Teleport to="#prismon-overlay-root" :disabled="!canTeleportOverlay">
      <Transition name="dropdown-menu">
        <div
          v-if="isOpen"
          :id="listboxId"
          ref="menuRef"
          class="select__menu"
          :style="menuStyle"
          role="listbox"
          :aria-label="label || ariaLabel"
          @mousedown.prevent
          @click.stop
        >
          <button
            v-for="(option, index) in options"
            :id="getOptionId(index)"
            :key="option.value"
            type="button"
            role="option"
            tabindex="-1"
            :disabled="option.disabled"
            :aria-selected="option.value === modelValue ? 'true' : 'false'"
            :class="[
              'select__option',
              option.value === modelValue ? 'select__option--selected' : undefined,
              index === highlightedIndex ? 'select__option--active' : undefined,
            ]"
            @click="selectOption(option)"
            @mouseenter="handleOptionMouseEnter(index, option)"
          >
            <span class="select__option-label">{{ option.label }}</span>
            <Icon
              v-if="option.value === modelValue"
              name="check"
              size="sm"
              class="select__option-check"
            />
          </button>
        </div>
      </Transition>
    </Teleport>

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
  --select-transition-easing: var(--easing-hover);
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
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
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
  text-align: left;
  cursor: var(--select-cursor);
  outline: none;
  transition:
    background-color var(--select-transition-duration) var(--select-transition-easing),
    border-color var(--select-transition-duration) var(--select-transition-easing),
    color var(--select-transition-duration) var(--select-transition-easing);
}

.select__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select__icon {
  position: absolute;
  right: var(--select-icon-offset);
  pointer-events: none;
  transition: transform var(--select-transition-duration) var(--easing-out);
}

.select__icon--open {
  transform: rotate(180deg);
}

.select__menu {
  --dropdown-z-index: calc(var(--z-modal) + 10);
  --dropdown-bg: var(--surface-elevated);
  --dropdown-border-color: var(--border-subtle-1);
  --dropdown-border-width: var(--border-width-thin);
  --dropdown-padding: var(--spacing-1);
  --dropdown-item-bg: var(--surface-elevated);
  --dropdown-item-bg-hover: var(--surface-subtle-hover);
  --dropdown-item-color: var(--text-primary);
  --dropdown-item-selected-color: var(--text-brand);
  --dropdown-item-disabled-color: var(--text-disabled);
  --dropdown-item-gap: var(--spacing-3);
  --dropdown-item-padding-y: var(--spacing-3);
  --dropdown-item-padding-x: var(--spacing-4);
  --dropdown-item-font-family: var(--type-body-compact-01-font-family);
  --dropdown-item-font-size: var(--type-body-compact-01-font-size);
  --dropdown-item-line-height: var(--type-body-compact-01-line-height);
  --dropdown-item-font-weight: var(--type-body-compact-01-font-weight);
  --dropdown-shadow-focus: var(--shadow-focus-ring);
  --dropdown-transition-duration: var(--duration-fast);
  --dropdown-transition-easing: var(--easing-out);
  --dropdown-scale-closed: var(--scale-popover-closed);
  --dropdown-press-scale: var(--scale-press-subtle);

  position: fixed;
  z-index: var(--dropdown-z-index);
  display: flex;
  flex-direction: column;
  max-height: 280px;
  overflow-y: auto;
  padding: var(--dropdown-padding);
  box-sizing: border-box;
  background-color: var(--dropdown-bg);
  border: var(--dropdown-border-width) solid var(--dropdown-border-color);
  transform-origin: top left;
}

.select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--dropdown-item-padding-y) var(--dropdown-item-padding-x);
  gap: var(--dropdown-item-gap);
  border: var(--border-width-none) solid var(--border-transparent);
  background-color: var(--dropdown-item-bg);
  color: var(--dropdown-item-color);
  font-family: var(--dropdown-item-font-family);
  font-size: var(--dropdown-item-font-size);
  line-height: var(--dropdown-item-line-height);
  font-weight: var(--dropdown-item-font-weight);
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  transition: transform var(--dropdown-transition-duration) var(--dropdown-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .select__option:not(:disabled):hover {
    background-color: var(--dropdown-item-bg-hover);
  }
}

.select__option--active:not(:disabled) {
  background-color: var(--dropdown-item-bg-hover);
}

.select__option--selected {
  color: var(--dropdown-item-selected-color);
  font-weight: var(--font-weight-medium);
}

.select__option:not(:disabled):active {
  transform: scale(var(--dropdown-press-scale));
}

.select__option:focus-visible {
  outline: none;
  box-shadow: var(--dropdown-shadow-focus);
}

.select__option:disabled {
  color: var(--dropdown-item-disabled-color);
  cursor: not-allowed;
}

.select__option-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select__option-check {
  flex-shrink: 0;
}

.dropdown-menu-enter-active,
.dropdown-menu-leave-active {
  transition:
    opacity var(--dropdown-transition-duration) var(--dropdown-transition-easing),
    transform var(--dropdown-transition-duration) var(--dropdown-transition-easing);
}

.dropdown-menu-enter-from,
.dropdown-menu-leave-to {
  opacity: var(--opacity-hidden);
  transform: scale(var(--dropdown-scale-closed));
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

@media (hover: hover) and (pointer: fine) {
  .select:not(.select--disabled):not(.select--focused):not(.select--open):not(.select--error):hover {
    --select-bg: var(--select-bg-hover);
    --select-border-color: var(--select-border-hover);
  }
}

.select:focus-within:not(.select--disabled),
.select--focused:not(.select--disabled),
.select--open:not(.select--disabled) {
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

@media (prefers-reduced-motion: reduce) {
  .select__menu {
    --dropdown-scale-closed: 1;
    --dropdown-press-scale: 1;
  }

  .select__icon,
  .select__option,
  .dropdown-menu-enter-active,
  .dropdown-menu-leave-active {
    transition: none;
  }
}
</style>
