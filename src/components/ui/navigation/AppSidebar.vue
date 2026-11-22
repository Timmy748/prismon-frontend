<script setup lang="ts">
import { computed } from 'vue'
import { AppIconButton } from '../buttons'

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

const sidebarClasses = computed(() => [
  'app-sidebar',
  props.collapsed ? 'app-sidebar--closed' : undefined,
])

function handleToggle() {
  emit('toggle')
  emit('update:collapsed', !props.collapsed)
}
</script>

<template>
  <aside :class="sidebarClasses">
    <header class="app-sidebar__header">
      <h2 v-if="title && !collapsed" class="app-sidebar__title">
        {{ title }}
      </h2>
      <AppIconButton
        variant="ghost"
        :icon="collapsed ? 'arrow-right' : 'close'"
        :ariaLabel="toggleLabel"
        @click="handleToggle"
      />
    </header>
    <div class="app-sidebar__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="app-sidebar__footer">
      <slot name="footer" />
    </footer>
  </aside>
</template>

<style scoped>
.app-sidebar {
  --app-sidebar-width: var(--size-sidebar-open);
  --app-sidebar-height: 100%;
  --app-sidebar-bg: var(--surface-elevated);
  --app-sidebar-border-color: var(--border-subtle-1);
  --app-sidebar-border-width: var(--border-width-thin);
  --app-sidebar-padding-top: var(--spacing-5);
  --app-sidebar-padding-x: var(--spacing-5);
  --app-sidebar-padding-bottom: var(--spacing-7);
  --app-sidebar-gap: var(--spacing-5);
  --app-sidebar-header-justify: space-between;
  --app-sidebar-title-color: var(--text-primary);
  --app-sidebar-title-font-family: var(--type-heading-04-font-family);
  --app-sidebar-title-font-size: var(--type-heading-04-font-size);
  --app-sidebar-title-line-height: var(--type-heading-04-line-height);
  --app-sidebar-title-font-weight: var(--type-heading-04-font-weight);
  --app-sidebar-title-text-transform: var(--type-heading-04-text-transform);
  --app-sidebar-transition-duration: var(--duration-normal);
  --app-sidebar-transition-easing: var(--easing-standard);

  display: flex;
  flex-direction: column;
  width: var(--app-sidebar-width);
  height: var(--app-sidebar-height);
  padding: var(--app-sidebar-padding-top) var(--app-sidebar-padding-x)
    var(--app-sidebar-padding-bottom) var(--app-sidebar-padding-x);
  gap: var(--app-sidebar-gap);
  box-sizing: border-box;
  background-color: var(--app-sidebar-bg);
  border: var(--app-sidebar-border-width) solid var(--app-sidebar-border-color);
  transition: width var(--app-sidebar-transition-duration) var(--app-sidebar-transition-easing);
}

.app-sidebar--closed {
  --app-sidebar-width: var(--size-sidebar-closed);
  --app-sidebar-header-justify: center;
}

.app-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: var(--app-sidebar-header-justify);
  gap: var(--app-sidebar-gap);
  flex-shrink: 0;
}

.app-sidebar__title {
  margin: var(--spacing-0);
  color: var(--app-sidebar-title-color);
  font-family: var(--app-sidebar-title-font-family);
  font-size: var(--app-sidebar-title-font-size);
  line-height: var(--app-sidebar-title-line-height);
  font-weight: var(--app-sidebar-title-font-weight);
  text-transform: var(--app-sidebar-title-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-sidebar__body {
  flex: 1;
  min-height: var(--spacing-0);
  overflow-y: auto;
}

.app-sidebar__footer {
  flex-shrink: 0;
}
</style>
