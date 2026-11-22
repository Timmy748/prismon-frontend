<script setup lang="ts">
import AppTabItem from './AppTabItem.vue'

export interface TabItem {
  id: string
  label: string
  disabled?: boolean
}

interface Props {
  items?: TabItem[]
  modelValue?: string
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  items: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleSelect(item: TabItem) {
  if (item.disabled) {
    return
  }
  emit('update:modelValue', item.id)
}
</script>

<template>
  <div role="tablist" class="app-tabs" :aria-label="ariaLabel">
    <slot>
      <AppTabItem
        v-for="item in items"
        :key="item.id"
        :label="item.label"
        :active="item.id === modelValue"
        :disabled="item.disabled"
        @click="handleSelect(item)"
      />
    </slot>
  </div>
</template>

<style scoped>
.app-tabs {
  --app-tabs-gap: var(--spacing-0);
  --app-tabs-bg: var(--surface-transparent);

  display: inline-flex;
  align-items: stretch;
  gap: var(--app-tabs-gap);
  background-color: var(--app-tabs-bg);
}
</style>
