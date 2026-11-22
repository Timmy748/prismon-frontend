<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppIcon } from '../icons'

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
  'app-nav-list',
  `app-nav-list--${props.orientation}`,
  props.collapsible && !isOpen.value ? 'app-nav-list--collapsed' : undefined,
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
    <div v-if="title || collapsible" class="app-nav-list__header">
      <button
        v-if="collapsible"
        type="button"
        class="app-nav-list__toggle"
        :aria-expanded="isOpen"
        @click="toggleOpen"
      >
        <span v-if="title" class="app-nav-list__title">{{ title }}</span>
        <span class="app-nav-list__chevron">
          <AppIcon name="arrow-down" size="md" />
        </span>
      </button>
      <span v-else-if="title" class="app-nav-list__title">{{ title }}</span>
    </div>
    <div v-if="showItems" class="app-nav-list__items">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.app-nav-list {
  --app-nav-list-bg: var(--surface-base);
  --app-nav-list-toggle-bg: var(--surface-transparent);
  --app-nav-list-border-width: var(--border-width-none);
  --app-nav-list-border-color: var(--border-transparent);
  --app-nav-list-padding: var(--spacing-3);
  --app-nav-list-gap: var(--spacing-3);
  --app-nav-list-items-direction: column;
  --app-nav-list-title-color: var(--text-primary);
  --app-nav-list-icon-color: var(--icon-primary);
  --app-nav-list-title-font-family: var(--type-heading-compact-01-font-family);
  --app-nav-list-title-font-size: var(--type-heading-compact-01-font-size);
  --app-nav-list-title-line-height: var(--type-heading-compact-01-line-height);
  --app-nav-list-title-font-weight: var(--type-heading-compact-01-font-weight);
  --app-nav-list-title-text-transform: var(--type-heading-compact-01-text-transform);
  --app-nav-list-shadow-focus: var(--shadow-focus-ring);
  --app-nav-list-transition-duration: var(--duration-fast);
  --app-nav-list-transition-easing: var(--easing-standard);
  --app-nav-list-chevron-transform: rotate(0deg);

  display: flex;
  flex-direction: column;
  padding: var(--app-nav-list-padding);
  gap: var(--app-nav-list-gap);
  box-sizing: border-box;
  background-color: var(--app-nav-list-bg);
}

.app-nav-list--vertical {
  --app-nav-list-items-direction: column;
}

.app-nav-list--horizontal {
  --app-nav-list-items-direction: row;
}

.app-nav-list--collapsed {
  --app-nav-list-chevron-transform: rotate(-90deg);
}

.app-nav-list__header {
  display: flex;
  align-items: center;
}

.app-nav-list__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-0);
  gap: var(--app-nav-list-gap);
  border: var(--app-nav-list-border-width) solid var(--app-nav-list-border-color);
  background-color: var(--app-nav-list-toggle-bg);
  cursor: pointer;
}

.app-nav-list__toggle:focus-visible {
  outline: none;
  box-shadow: var(--app-nav-list-shadow-focus);
}

.app-nav-list__title {
  color: var(--app-nav-list-title-color);
  font-family: var(--app-nav-list-title-font-family);
  font-size: var(--app-nav-list-title-font-size);
  line-height: var(--app-nav-list-title-line-height);
  font-weight: var(--app-nav-list-title-font-weight);
  text-transform: var(--app-nav-list-title-text-transform);
  text-align: left;
}

.app-nav-list__chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--app-nav-list-icon-color);
  transform: var(--app-nav-list-chevron-transform);
  transition: transform var(--app-nav-list-transition-duration)
    var(--app-nav-list-transition-easing);
}

.app-nav-list__items {
  display: flex;
  flex-direction: var(--app-nav-list-items-direction);
  gap: var(--app-nav-list-gap);
}
</style>
