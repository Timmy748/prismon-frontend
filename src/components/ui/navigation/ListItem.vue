<script setup lang="ts">
import { computed } from 'vue'
import { Icon, type IconName } from '../icons'

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
  'trailing-click': [event: MouseEvent]
}>()

const listItemClasses = computed(() => [
  'list-item',
  props.icon ? 'list-item--with-icon' : undefined,
  props.collapsed ? 'list-item--closed' : undefined,
  props.active ? 'list-item--active' : undefined,
])

function handleTrailingClick(event: MouseEvent) {
  emit('trailing-click', event)
}
</script>

<template>
  <div :class="listItemClasses">
    <button
      type="button"
      class="list-item__trigger"
      :aria-label="collapsed ? label : undefined"
      :aria-current="active ? 'page' : undefined"
    >
      <span v-if="icon" class="list-item__icon">
        <Icon :name="icon" size="md" />
      </span>
      <span v-if="!collapsed" class="list-item__label">
        <slot>{{ label }}</slot>
      </span>
    </button>
    <span
      v-if="!collapsed && $slots.trailing"
      class="list-item__trailing"
      @click.stop="handleTrailingClick"
    >
      <slot name="trailing" />
    </span>
    <button
      v-else-if="!collapsed && hasTrailingAction"
      type="button"
      class="list-item__trailing"
      :aria-label="trailingLabel"
      @click.stop="handleTrailingClick"
    >
      <Icon name="arrow-right" size="sm" />
    </button>
  </div>
</template>

<style scoped>
.list-item {
  --list-item-bg: var(--surface-elevated);
  --list-item-bg-hover: var(--surface-subtle-hover);
  --list-item-control-bg: var(--surface-transparent);
  --list-item-border-width: var(--border-width-none);
  --list-item-border-color: var(--border-transparent);
  --list-item-color: var(--text-secondary);
  --list-item-height: 34px;
  --list-item-width: 100%;
  --list-item-padding: var(--spacing-3);
  --list-item-gap: var(--spacing-4);
  --list-item-justify: flex-start;
  --list-item-radius: var(--radius-none);
  --list-item-font-family: var(--type-body-compact-01-font-family);
  --list-item-font-size: var(--type-body-compact-01-font-size);
  --list-item-line-height: var(--type-body-compact-01-line-height);
  --list-item-font-weight: var(--type-body-compact-01-font-weight);
  --list-item-text-transform: var(--type-body-compact-01-text-transform);
  --list-item-shadow-focus: var(--shadow-focus-ring);
  --list-item-transition-duration: var(--duration-fast);
  --list-item-transition-easing: var(--easing-out);
  --list-item-hover-transition-easing: var(--easing-hover);
  --list-item-press-scale: var(--scale-press);

  display: flex;
  align-items: center;
  justify-content: var(--list-item-justify);
  width: var(--list-item-width);
  height: var(--list-item-height);
  padding: var(--list-item-padding);
  gap: var(--list-item-gap);
  box-sizing: border-box;
  background-color: var(--list-item-bg);
  color: var(--list-item-color);
  border-radius: var(--list-item-radius);
}

@media (hover: hover) and (pointer: fine) {
  .list-item:hover {
    background-color: var(--list-item-bg-hover);
  }
}

.list-item__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: var(--list-item-justify);
  flex: 1;
  min-width: var(--spacing-0);
  gap: var(--list-item-gap);
  padding: var(--spacing-0);
  border: var(--list-item-border-width) solid var(--list-item-border-color);
  background-color: var(--list-item-control-bg);
  color: inherit;
  font-family: var(--list-item-font-family);
  font-size: var(--list-item-font-size);
  line-height: var(--list-item-line-height);
  font-weight: var(--list-item-font-weight);
  text-transform: var(--list-item-text-transform);
  text-align: left;
  cursor: pointer;
}

.list-item__trigger:focus-visible,
.list-item__trailing:focus-visible {
  outline: none;
  box-shadow: var(--list-item-shadow-focus);
}

.list-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.list-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__trailing {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: var(--spacing-0);
  border: var(--list-item-border-width) solid var(--list-item-border-color);
  background-color: var(--list-item-control-bg);
  color: inherit;
  cursor: pointer;
  transition: transform var(--list-item-transition-duration) var(--list-item-transition-easing);
}

.list-item__trailing:active {
  transform: scale(var(--list-item-press-scale));
}

@media (prefers-reduced-motion: reduce) {
  .list-item {
    --list-item-press-scale: 1;
  }
}

.list-item--with-icon {
  --list-item-gap: var(--spacing-2);
}

.list-item--closed {
  --list-item-width: 34px;
  --list-item-gap: var(--spacing-0);
  --list-item-justify: center;
}

.list-item--active {
  --list-item-bg: var(--surface-brand-selection);
  --list-item-bg-hover: var(--surface-brand-selection);
}
</style>
