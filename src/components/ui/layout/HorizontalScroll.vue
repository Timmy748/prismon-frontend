<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'

export type HorizontalScrollGap = 'none' | 'sm' | 'md' | 'lg'

interface Props {
  gap?: HorizontalScrollGap
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  gap: 'md',
})

const trackRef = ref<HTMLDivElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

const rootClasses = computed(() => ['horizontal-scroll', `horizontal-scroll--gap-${props.gap}`])

const trackClasses = computed(() => {
  const classes = ['horizontal-scroll__track']
  if (canScrollLeft.value && canScrollRight.value) {
    classes.push('horizontal-scroll__track--mask-both')
  } else if (canScrollLeft.value) {
    classes.push('horizontal-scroll__track--mask-left')
  } else if (canScrollRight.value) {
    classes.push('horizontal-scroll__track--mask-right')
  }
  return classes
})

function updateScrollState() {
  const el = trackRef.value
  if (!el) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  const { scrollLeft, scrollWidth, clientWidth } = el
  canScrollLeft.value = scrollLeft > 1
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1
}

function handleWheel(event: WheelEvent) {
  const el = trackRef.value
  if (!el || el.scrollWidth <= el.clientWidth) {
    return
  }
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
    return
  }
  const nextScrollLeft = el.scrollLeft + event.deltaY
  const maxScrollLeft = el.scrollWidth - el.clientWidth
  const clamped = Math.max(0, Math.min(maxScrollLeft, nextScrollLeft))
  if (clamped !== el.scrollLeft) {
    el.scrollLeft = clamped
    event.preventDefault()
  }
}

onMounted(() => {
  updateScrollState()
  const el = trackRef.value
  if (!el) {
    return
  }
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(el)
  }
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(updateScrollState)
    mutationObserver.observe(el, { childList: true, subtree: true })
  }
})

onUpdated(() => {
  updateScrollState()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
})
</script>

<template>
  <div :class="rootClasses">
    <div
      ref="trackRef"
      :class="trackClasses"
      :aria-label="ariaLabel"
      @scroll="updateScrollState"
      @wheel="handleWheel"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.horizontal-scroll {
  --horizontal-scroll-gap: var(--spacing-4);
  --horizontal-scroll-mask-size: var(--spacing-6);
  --horizontal-scroll-mask-opaque: var(--text-primary);
  --horizontal-scroll-mask-transparent: var(--surface-transparent);
  --horizontal-scroll-mask: none;

  width: 100%;
  max-width: 100%;
  min-width: var(--spacing-0);
  overflow: hidden;
  box-sizing: border-box;
}

.horizontal-scroll--gap-none {
  --horizontal-scroll-gap: var(--spacing-0);
}

.horizontal-scroll--gap-sm {
  --horizontal-scroll-gap: var(--spacing-3);
}

.horizontal-scroll--gap-md {
  --horizontal-scroll-gap: var(--spacing-4);
}

.horizontal-scroll--gap-lg {
  --horizontal-scroll-gap: var(--spacing-5);
}

.horizontal-scroll__track {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--horizontal-scroll-gap);
  width: 100%;
  min-width: var(--spacing-0);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-mask-image: var(--horizontal-scroll-mask);
  mask-image: var(--horizontal-scroll-mask);
}

.horizontal-scroll__track::-webkit-scrollbar {
  display: none;
}

.horizontal-scroll__track > :deep(*) {
  flex-shrink: 0;
}

.horizontal-scroll__track--mask-left {
  --horizontal-scroll-mask: linear-gradient(
    to right,
    var(--horizontal-scroll-mask-transparent) 0,
    var(--horizontal-scroll-mask-opaque) var(--horizontal-scroll-mask-size),
    var(--horizontal-scroll-mask-opaque) 100%
  );
}

.horizontal-scroll__track--mask-right {
  --horizontal-scroll-mask: linear-gradient(
    to right,
    var(--horizontal-scroll-mask-opaque) 0,
    var(--horizontal-scroll-mask-opaque) calc(100% - var(--horizontal-scroll-mask-size)),
    var(--horizontal-scroll-mask-transparent) 100%
  );
}

.horizontal-scroll__track--mask-both {
  --horizontal-scroll-mask: linear-gradient(
    to right,
    var(--horizontal-scroll-mask-transparent) 0,
    var(--horizontal-scroll-mask-opaque) var(--horizontal-scroll-mask-size),
    var(--horizontal-scroll-mask-opaque) calc(100% - var(--horizontal-scroll-mask-size)),
    var(--horizontal-scroll-mask-transparent) 100%
  );
}
</style>
