<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '../icons'

export type NavListOrientation = 'vertical' | 'horizontal'

interface Props {
  title?: string
  orientation?: NavListOrientation
  collapsible?: boolean
  defaultOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'vertical',
  collapsible: false,
  defaultOpen: true,
})

const isOpen = ref(props.defaultOpen)

const navListClasses = computed(() => [
  'nav-list',
  `nav-list--${props.orientation}`,
  props.collapsible && !isOpen.value ? 'nav-list--collapsed' : undefined,
])

const showItems = computed(() => !props.collapsible || isOpen.value)

function toggleOpen() {
  if (!props.collapsible) {
    return
  }
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div :class="navListClasses">
    <div v-if="title || collapsible" class="nav-list__header">
      <button
        v-if="collapsible"
        type="button"
        class="nav-list__toggle"
        :aria-expanded="isOpen"
        @click="toggleOpen"
      >
        <span v-if="title" class="nav-list__title">{{ title }}</span>
        <span class="nav-list__chevron">
          <Icon name="arrow-down" size="md" />
        </span>
      </button>
      <span v-else-if="title" class="nav-list__title">{{ title }}</span>
    </div>
    <div v-if="showItems" class="nav-list__items">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.nav-list {
  --nav-list-bg: var(--surface-elevated);
  --nav-list-toggle-bg: var(--surface-transparent);
  --nav-list-border-width: var(--border-width-none);
  --nav-list-border-color: var(--border-transparent);
  --nav-list-padding: var(--spacing-3);
  --nav-list-gap: var(--spacing-3);
  --nav-list-items-gap: var(--spacing-0);
  --nav-list-items-direction: column;
  --nav-list-title-color: var(--text-primary);
  --nav-list-icon-color: var(--icon-primary);
  --nav-list-title-font-family: var(--type-heading-compact-01-font-family);
  --nav-list-title-font-size: var(--type-heading-compact-01-font-size);
  --nav-list-title-line-height: var(--type-heading-compact-01-line-height);
  --nav-list-title-font-weight: var(--type-heading-compact-01-font-weight);
  --nav-list-title-text-transform: var(--type-heading-compact-01-text-transform);
  --nav-list-shadow-focus: var(--shadow-focus-ring);
  --nav-list-transition-duration: var(--duration-fast);
  --nav-list-transition-easing: var(--easing-standard);
  --nav-list-chevron-transform: rotate(0deg);

  display: flex;
  flex-direction: column;
  padding: var(--nav-list-padding);
  gap: var(--nav-list-gap);
  box-sizing: border-box;
  background-color: var(--nav-list-bg);
}

.nav-list--vertical {
  --nav-list-items-direction: column;
}

.nav-list--horizontal {
  --nav-list-items-direction: row;
}

.nav-list--collapsed {
  --nav-list-chevron-transform: rotate(-90deg);
}

.nav-list__header {
  display: flex;
  align-items: center;
}

.nav-list__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-0);
  gap: var(--nav-list-gap);
  border: var(--nav-list-border-width) solid var(--nav-list-border-color);
  background-color: var(--nav-list-toggle-bg);
  cursor: pointer;
}

.nav-list__toggle:focus-visible {
  outline: none;
  box-shadow: var(--nav-list-shadow-focus);
}

.nav-list__title {
  color: var(--nav-list-title-color);
  font-family: var(--nav-list-title-font-family);
  font-size: var(--nav-list-title-font-size);
  line-height: var(--nav-list-title-line-height);
  font-weight: var(--nav-list-title-font-weight);
  text-transform: var(--nav-list-title-text-transform);
  text-align: left;
}

.nav-list__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--nav-list-icon-color);
  transform: var(--nav-list-chevron-transform);
  transition: transform var(--nav-list-transition-duration) var(--nav-list-transition-easing);
}

.nav-list__items {
  display: flex;
  flex-direction: var(--nav-list-items-direction);
  gap: var(--nav-list-items-gap);
}
</style>
