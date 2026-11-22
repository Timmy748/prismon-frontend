<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, type IconName } from '../icons'

interface Props {
  label: string
  icon?: IconName
  collapsed?: boolean
  active?: boolean
  hasTrailingAction?: boolean
  trailingLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  active: false,
  hasTrailingAction: false,
  trailingLabel: 'Mais ações',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  'trailing-click': [event: MouseEvent]
}>()

const listItemClasses = computed(() => [
  'app-list-item',
  props.icon ? 'app-list-item--with-icon' : undefined,
  props.collapsed ? 'app-list-item--closed' : undefined,
  props.active ? 'app-list-item--active' : undefined,
])

function handleClick(event: MouseEvent) {
  emit('click', event)
}

function handleTrailingClick(event: MouseEvent) {
  emit('trailing-click', event)
}
</script>

<template>
  <div :class="listItemClasses" @click="handleClick">
    <button
      type="button"
      class="app-list-item__trigger"
      :aria-label="collapsed ? label : undefined"
      :aria-current="active ? 'page' : undefined"
    >
      <span v-if="icon" class="app-list-item__icon">
        <AppIcon :name="icon" size="md" />
      </span>
      <span v-if="!collapsed" class="app-list-item__label">
        <slot>{{ label }}</slot>
      </span>
    </button>
    <span
      v-if="!collapsed && $slots.trailing"
      class="app-list-item__trailing"
      @click.stop="handleTrailingClick"
    >
      <slot name="trailing" />
    </span>
    <button
      v-else-if="!collapsed && hasTrailingAction"
      type="button"
      class="app-list-item__trailing"
      :aria-label="trailingLabel"
      @click.stop="handleTrailingClick"
    >
      <AppIcon name="arrow-right" size="sm" />
    </button>
  </div>
</template>

<style scoped>
.app-list-item {
  --app-list-item-bg: var(--surface-base);
  --app-list-item-bg-hover: var(--surface-subtle-hover);
  --app-list-item-control-bg: var(--surface-transparent);
  --app-list-item-border-width: var(--border-width-none);
  --app-list-item-border-color: var(--border-transparent);
  --app-list-item-color: var(--text-secondary);
  --app-list-item-height: var(--size-list-item);
  --app-list-item-width: 100%;
  --app-list-item-padding: var(--spacing-3);
  --app-list-item-gap: var(--spacing-4);
  --app-list-item-justify: flex-start;
  --app-list-item-radius: var(--radius-none);
  --app-list-item-font-family: var(--type-body-compact-01-font-family);
  --app-list-item-font-size: var(--type-body-compact-01-font-size);
  --app-list-item-line-height: var(--type-body-compact-01-line-height);
  --app-list-item-font-weight: var(--type-body-compact-01-font-weight);
  --app-list-item-text-transform: var(--type-body-compact-01-text-transform);
  --app-list-item-shadow-focus: var(--shadow-focus-ring);
  --app-list-item-transition-duration: var(--duration-fast);
  --app-list-item-transition-easing: var(--easing-standard);

  display: flex;
  align-items: center;
  justify-content: var(--app-list-item-justify);
  width: var(--app-list-item-width);
  height: var(--app-list-item-height);
  padding: var(--app-list-item-padding);
  gap: var(--app-list-item-gap);
  box-sizing: border-box;
  background-color: var(--app-list-item-bg);
  color: var(--app-list-item-color);
  border-radius: var(--app-list-item-radius);
  transition:
    background-color var(--app-list-item-transition-duration) var(--app-list-item-transition-easing),
    color var(--app-list-item-transition-duration) var(--app-list-item-transition-easing);
}

.app-list-item:hover {
  background-color: var(--app-list-item-bg-hover);
}

.app-list-item__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: var(--app-list-item-justify);
  flex: 1;
  min-width: var(--spacing-0);
  gap: var(--app-list-item-gap);
  padding: var(--spacing-0);
  border: var(--app-list-item-border-width) solid var(--app-list-item-border-color);
  background-color: var(--app-list-item-control-bg);
  color: inherit;
  font-family: var(--app-list-item-font-family);
  font-size: var(--app-list-item-font-size);
  line-height: var(--app-list-item-line-height);
  font-weight: var(--app-list-item-font-weight);
  text-transform: var(--app-list-item-text-transform);
  text-align: left;
  cursor: pointer;
}

.app-list-item__trigger:focus-visible,
.app-list-item__trailing:focus-visible {
  outline: none;
  box-shadow: var(--app-list-item-shadow-focus);
}

.app-list-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-list-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-list-item__trailing {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: var(--spacing-0);
  border: var(--app-list-item-border-width) solid var(--app-list-item-border-color);
  background-color: var(--app-list-item-control-bg);
  color: inherit;
  cursor: pointer;
}

.app-list-item--with-icon {
  --app-list-item-gap: var(--spacing-2);
}

.app-list-item--closed {
  --app-list-item-width: var(--size-list-item);
  --app-list-item-gap: var(--spacing-0);
  --app-list-item-justify: center;
}

.app-list-item--active {
  --app-list-item-bg: var(--surface-brand-selection);
  --app-list-item-bg-hover: var(--surface-brand-selection);
}
</style>
