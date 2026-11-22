<script setup lang="ts">
import { computed } from 'vue'
import { IconButton } from '../buttons'

interface Props {
  title?: string
  collapsed?: boolean
  toggleLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
  toggleLabel: 'Alternar barra lateral',
})

const emit = defineEmits<{
  toggle: []
  'update:collapsed': [value: boolean]
}>()

const sidebarClasses = computed(() => ['sidebar', props.collapsed ? 'sidebar--closed' : undefined])

function handleToggle() {
  emit('toggle')
  emit('update:collapsed', !props.collapsed)
}
</script>

<template>
  <aside :class="sidebarClasses">
    <header class="sidebar__header">
      <h2 v-if="title && !collapsed" class="sidebar__title">
        {{ title }}
      </h2>
      <IconButton
        variant="ghost"
        :icon="collapsed ? 'arrow-right' : 'close'"
        :ariaLabel="toggleLabel"
        @click="handleToggle"
      />
    </header>
    <div class="sidebar__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="sidebar__footer">
      <slot name="footer" />
    </footer>
  </aside>
</template>

<style scoped>
.sidebar {
  --sidebar-width: 240px;
  --sidebar-height: 100%;
  --sidebar-bg: var(--surface-elevated);
  --sidebar-border-color: var(--border-subtle-1);
  --sidebar-border-width: var(--border-width-thin);
  --sidebar-padding-top: var(--spacing-5);
  --sidebar-padding-x: var(--spacing-5);
  --sidebar-padding-bottom: var(--spacing-7);
  --sidebar-gap: var(--spacing-5);
  --sidebar-header-justify: space-between;
  --sidebar-title-color: var(--text-primary);
  --sidebar-title-font-family: var(--type-heading-04-font-family);
  --sidebar-title-font-size: var(--type-heading-04-font-size);
  --sidebar-title-line-height: var(--type-heading-04-line-height);
  --sidebar-title-font-weight: var(--type-heading-04-font-weight);
  --sidebar-title-text-transform: var(--type-heading-04-text-transform);
  --sidebar-transition-duration: var(--duration-normal);
  --sidebar-transition-easing: var(--easing-in-out);

  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: var(--sidebar-height);
  padding: var(--sidebar-padding-top) var(--sidebar-padding-x) var(--sidebar-padding-bottom)
    var(--sidebar-padding-x);
  gap: var(--sidebar-gap);
  box-sizing: border-box;
  background-color: var(--sidebar-bg);
  border: var(--sidebar-border-width) solid var(--sidebar-border-color);
  transition: width var(--sidebar-transition-duration) var(--sidebar-transition-easing);
}

.sidebar--closed {
  --sidebar-width: 66px;
  --sidebar-header-justify: center;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: var(--sidebar-header-justify);
  gap: var(--sidebar-gap);
  flex-shrink: 0;
}

.sidebar__title {
  margin: var(--spacing-0);
  color: var(--sidebar-title-color);
  font-family: var(--sidebar-title-font-family);
  font-size: var(--sidebar-title-font-size);
  line-height: var(--sidebar-title-line-height);
  font-weight: var(--sidebar-title-font-weight);
  text-transform: var(--sidebar-title-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: var(--spacing-0);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sidebar__footer {
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar {
    transition: none;
  }
}
</style>
