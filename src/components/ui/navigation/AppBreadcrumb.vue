<script setup lang="ts">
import AppBreadcrumbLink from './AppBreadcrumbLink.vue'

export interface BreadcrumbItem {
  label: string
  href?: string
  id?: string
}

interface Props {
  items?: BreadcrumbItem[]
}

withDefaults(defineProps<Props>(), {
  items: () => [],
})

const emit = defineEmits<{
  navigate: [item: BreadcrumbItem, index: number, event: MouseEvent]
}>()

function handleItemClick(item: BreadcrumbItem, index: number, event: MouseEvent) {
  emit('navigate', item, index, event)
}
</script>

<template>
  <nav aria-label="Breadcrumb" class="app-breadcrumb">
    <ol class="app-breadcrumb__list">
      <slot>
        <AppBreadcrumbLink
          v-for="(item, index) in items"
          :key="item.id ?? `${item.label}-${index}`"
          :label="item.label"
          :href="item.href"
          :current="index === items.length - 1"
          :show-separator="index < items.length - 1"
          @click="handleItemClick(item, index, $event)"
        />
      </slot>
    </ol>
  </nav>
</template>

<style scoped>
.app-breadcrumb {
  --app-breadcrumb-gap: var(--spacing-2);
  --app-breadcrumb-padding: var(--spacing-0);

  display: flex;
  align-items: center;
}

.app-breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-breadcrumb-gap);
  margin: var(--app-breadcrumb-padding);
  padding: var(--app-breadcrumb-padding);
  list-style: none;
}
</style>
