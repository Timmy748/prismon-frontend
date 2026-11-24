<script setup lang="ts">
import BreadcrumbLink from './BreadcrumbLink.vue'

export interface BreadcrumbItem {
  label: string
  href?: string
  id?: string
}

interface Props {
  items?: BreadcrumbItem[]
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
})

const emit = defineEmits<{
  navigate: [item: BreadcrumbItem, index: number, event: MouseEvent]
}>()

function handleItemClick(item: BreadcrumbItem, index: number, event: MouseEvent) {
  if (index === props.items.length - 1) {
    return
  }
  emit('navigate', item, index, event)
}
</script>

<template>
  <nav aria-label="Breadcrumb" class="breadcrumb">
    <ol class="breadcrumb__list">
      <slot>
        <BreadcrumbLink
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
.breadcrumb {
  --breadcrumb-gap: var(--spacing-2);
  --breadcrumb-padding: var(--spacing-0);

  display: flex;
  align-items: center;
}

.breadcrumb__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--breadcrumb-gap);
  margin: var(--breadcrumb-padding);
  padding: var(--breadcrumb-padding);
  list-style: none;
}
</style>
