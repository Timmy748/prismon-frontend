<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const tablistRef = ref<HTMLElement | null>(null)
const indicatorRef = ref<HTMLElement | null>(null)
const isTransitionReady = ref(false)

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

function updateIndicator() {
  const container = tablistRef.value
  const indicator = indicatorRef.value
  if (!container || !indicator) {
    return
  }

  const activeTab = container.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
  if (!activeTab) {
    indicator.style.opacity = '0'
    return
  }

  indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`
  indicator.style.width = `${activeTab.offsetWidth}px`
  indicator.style.opacity = '1'
}

function observeTabsResize() {
  if (!resizeObserver || !tablistRef.value) {
    return
  }
  resizeObserver.disconnect()
  resizeObserver.observe(tablistRef.value)
  const tabs = tablistRef.value.querySelectorAll<HTMLElement>('[role="tab"]')
  for (const tab of tabs) {
    resizeObserver.observe(tab)
  }
}

function handleSelect(item: TabOption) {
  if (item.disabled) {
    return
  }
  emit('update:modelValue', item.id)
}

watch(
  () => [props.modelValue, props.items],
  () => {
    observeTabsResize()
    updateIndicator()
  },
  { flush: 'post', deep: true },
)

onMounted(() => {
  updateIndicator()

  if (typeof ResizeObserver !== 'undefined' && tablistRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateIndicator()
    })
    observeTabsResize()
  }

  if (typeof MutationObserver !== 'undefined' && tablistRef.value) {
    mutationObserver = new MutationObserver(() => {
      observeTabsResize()
      updateIndicator()
    })
    mutationObserver.observe(tablistRef.value, {
      attributes: true,
      attributeFilter: ['aria-selected'],
      childList: true,
      subtree: true,
    })
  }

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      isTransitionReady.value = true
    })
  } else {
    isTransitionReady.value = true
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  mutationObserver?.disconnect()
  mutationObserver = null
})
</script>

<template>
  <div ref="tablistRef" role="tablist" class="tabs tabs--has-indicator" :aria-label="ariaLabel">
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
    <span
      ref="indicatorRef"
      :class="['tabs__indicator', isTransitionReady ? 'tabs__indicator--ready' : undefined]"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.tabs {
  --tabs-gap: var(--spacing-0);
  --tabs-bg: var(--surface-transparent);

  position: relative;
  display: inline-flex;
  align-items: stretch;
  gap: var(--tabs-gap);
  background-color: var(--tabs-bg);
}

.tabs--has-indicator :deep(.tab-item) {
  --tab-item-border-color: var(--border-transparent);
  transition:
    background-color var(--tab-item-transition-duration) var(--tab-item-hover-transition-easing),
    color var(--tab-item-transition-duration) var(--tab-item-hover-transition-easing);
}

.tabs--has-indicator :deep(.tab-item--active) {
  --tab-item-border-color: var(--border-transparent);
}

.tabs__indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background-color: var(--border-brand);
  pointer-events: none;
  will-change: transform, width;
}

.tabs__indicator--ready {
  transition:
    transform var(--duration-normal) var(--easing-out),
    width var(--duration-normal) var(--easing-out),
    opacity var(--duration-fast) var(--easing-out);
}

@supports (anchor-name: --active-tab) and (position-anchor: --active-tab) and
  (anchor-scope: --active-tab) {
  .tabs {
    anchor-scope: --active-tab;
  }

  .tabs :deep([role='tab'][aria-selected='true']) {
    anchor-name: --active-tab;
  }

  .tabs__indicator {
    position-anchor: --active-tab;
    left: anchor(left);
    width: anchor-size(width) !important;
    transform: none !important;
  }

  .tabs__indicator--ready {
    transition:
      left var(--duration-normal) var(--easing-out),
      width var(--duration-normal) var(--easing-out),
      opacity var(--duration-fast) var(--easing-out);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tabs__indicator,
  .tabs__indicator--ready {
    transition: none;
  }
}
</style>
