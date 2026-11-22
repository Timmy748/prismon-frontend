<script setup lang="ts">
import TabItem from './TabItem.vue'

export interface TabOption {
  id: string
  label: string
  disabled?: boolean
}

interface Props {
  items?: TabOption[]
  modelValue?: string
  ariaLabel?: string
}

withDefaults(defineProps<Props>(), {
  items: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleSelect(item: TabOption) {
  if (item.disabled) {
    return
  }
  emit('update:modelValue', item.id)
}
</script>

<template>
  <div role="tablist" class="tabs" :aria-label="ariaLabel">
    <slot>
      <TabItem
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
.tabs {
  --tabs-gap: var(--spacing-0);
  --tabs-bg: var(--surface-transparent);

  display: inline-flex;
  align-items: stretch;
  gap: var(--tabs-gap);
  background-color: var(--tabs-bg);
}
</style>
