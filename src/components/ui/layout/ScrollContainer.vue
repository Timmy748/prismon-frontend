<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'

export type ScrollContainerDirection = 'horizontal' | 'vertical'
export type ScrollContainerGap = 'none' | 'sm' | 'md' | 'lg'

interface Props {
  direction?: ScrollContainerDirection
  gap?: ScrollContainerGap
  ariaLabel?: string
  mouseDrag?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'vertical',
  gap: 'md',
  mouseDrag: true,
})

const DRAG_THRESHOLD_PX = 4
const LINE_SCROLL_PX = 16
const MOBILE_MEDIA_QUERY = '(max-width: 767px)'

const trackRef = ref<HTMLDivElement | null>(null)
const canScrollStart = ref(false)
const canScrollEnd = ref(false)
const isDragging = ref(false)
const isMobile = ref(false)

let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null
let mobileMediaQuery: MediaQueryList | null = null
let suppressNextClick = false
let suppressClickTimer: number | null = null
let activeCleanupDrag: (() => void) | null = null

const rootClasses = computed(() => [
  'scroll-container',
  `scroll-container--${props.direction}`,
  `scroll-container--gap-${props.gap}`,
])

const isScrollable = computed(() => canScrollStart.value || canScrollEnd.value)

const trackClasses = computed(() => {
  const classes = ['scroll-container__track']
  if (isScrollable.value && props.mouseDrag && isMobile.value) {
    classes.push('scroll-container__track--draggable')
  }
  if (isDragging.value) {
    classes.push('scroll-container__track--dragging')
  }
  if (canScrollStart.value && canScrollEnd.value) {
    classes.push('scroll-container__track--mask-both')
  } else if (canScrollStart.value) {
    classes.push('scroll-container__track--mask-start')
  } else if (canScrollEnd.value) {
    classes.push('scroll-container__track--mask-end')
  }
  return classes
})

function updateScrollState() {
  const el = trackRef.value
  if (!el) {
    canScrollStart.value = false
    canScrollEnd.value = false
    return
  }

  if (props.direction === 'horizontal') {
    canScrollStart.value = el.scrollLeft > 1
    canScrollEnd.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    return
  }

  canScrollStart.value = el.scrollTop > 1
  canScrollEnd.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1
}

function normalizeWheelDelta(delta: number, deltaMode: number, pageSize: number): number {
  if (deltaMode === 1) return delta * LINE_SCROLL_PX
  if (deltaMode === 2) return delta * pageSize
  return delta
}

function handleWheel(event: WheelEvent) {
  const el = trackRef.value
  if (!el || event.ctrlKey) {
    return
  }

  if (props.direction === 'horizontal') {
    if (el.scrollWidth <= el.clientWidth) {
      return
    }

    const dominantDelta =
      Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
    const delta = normalizeWheelDelta(dominantDelta, event.deltaMode, el.clientWidth)
    if (delta === 0) {
      return
    }

    const maxScrollLeft = el.scrollWidth - el.clientWidth
    const clamped = Math.max(0, Math.min(maxScrollLeft, el.scrollLeft + delta))
    if (clamped !== el.scrollLeft) {
      el.scrollLeft = clamped
      updateScrollState()
    }
    event.preventDefault()
    event.stopPropagation()
    return
  }

  if (el.scrollHeight <= el.clientHeight) {
    return
  }

  const delta = normalizeWheelDelta(event.deltaY, event.deltaMode, el.clientHeight)
  if (delta === 0) {
    return
  }

  const maxScrollTop = el.scrollHeight - el.clientHeight
  const nextScrollTop = el.scrollTop + delta
  const hitsStart = delta < 0 && nextScrollTop <= 0
  const hitsEnd = delta > 0 && nextScrollTop >= maxScrollTop - 1

  if (hitsStart || hitsEnd) {
    const clamped = Math.max(0, Math.min(maxScrollTop, nextScrollTop))
    if (clamped !== el.scrollTop) {
      el.scrollTop = clamped
      updateScrollState()
    }
    event.preventDefault()
    event.stopPropagation()
  }
}

function handleMouseDown(event: MouseEvent) {
  const el = trackRef.value
  if (!props.mouseDrag || !isMobile.value || event.button !== 0 || !el) {
    return
  }

  const target = event.target
  if (
    target instanceof Element &&
    target.closest('input, textarea, select, option, [contenteditable="true"]')
  ) {
    return
  }

  const isHorizontal = props.direction === 'horizontal'
  const hasOverflow = isHorizontal
    ? el.scrollWidth > el.clientWidth
    : el.scrollHeight > el.clientHeight
  if (!hasOverflow) {
    return
  }

  activeCleanupDrag?.()

  const startPointer = isHorizontal ? event.clientX : event.clientY
  const startScroll = isHorizontal ? el.scrollLeft : el.scrollTop
  let dragMoved = false

  const onMouseMove = (moveEvent: MouseEvent) => {
    const currentPointer = isHorizontal ? moveEvent.clientX : moveEvent.clientY
    const delta = startPointer - currentPointer

    if (!dragMoved && Math.abs(delta) < DRAG_THRESHOLD_PX) {
      return
    }

    if (!dragMoved) {
      dragMoved = true
      isDragging.value = true
      suppressNextClick = true
      window.getSelection()?.removeAllRanges()
    }

    if (isHorizontal) {
      const max = el.scrollWidth - el.clientWidth
      el.scrollLeft = Math.max(0, Math.min(max, startScroll + delta))
    } else {
      const max = el.scrollHeight - el.clientHeight
      el.scrollTop = Math.max(0, Math.min(max, startScroll + delta))
    }
    updateScrollState()
  }

  const cleanup = () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('blur', onMouseUp)
    isDragging.value = false
    activeCleanupDrag = null
  }

  const onMouseUp = () => {
    cleanup()
    if (dragMoved) {
      if (suppressClickTimer !== null) {
        window.clearTimeout(suppressClickTimer)
      }
      suppressClickTimer = window.setTimeout(() => {
        suppressNextClick = false
        suppressClickTimer = null
      }, 0)
    }
  }

  activeCleanupDrag = cleanup
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('blur', onMouseUp)
}

function handleDragStart(event: DragEvent) {
  if (isMobile.value && props.mouseDrag) {
    event.preventDefault()
  }
}

function handleClickCapture(event: MouseEvent) {
  if (!suppressNextClick) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  suppressNextClick = false
  if (suppressClickTimer !== null) {
    window.clearTimeout(suppressClickTimer)
    suppressClickTimer = null
  }
}

function updateMobileState() {
  if (typeof window === 'undefined') {
    isMobile.value = false
    return
  }

  if (typeof window.matchMedia === 'function') {
    mobileMediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    isMobile.value = mobileMediaQuery.matches
  } else {
    isMobile.value = window.innerWidth <= 767
  }

  if (!isMobile.value) {
    activeCleanupDrag?.()
  }
}

watch(() => props.direction, updateScrollState)

onMounted(() => {
  updateMobileState()
  mobileMediaQuery?.addEventListener('change', updateMobileState)
  updateScrollState()
  const el = trackRef.value
  if (!el) {
    return
  }
  el.addEventListener('wheel', handleWheel, { passive: false })
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
  mobileMediaQuery?.removeEventListener('change', updateMobileState)
  trackRef.value?.removeEventListener('wheel', handleWheel)
  activeCleanupDrag?.()
  if (suppressClickTimer !== null) {
    window.clearTimeout(suppressClickTimer)
  }
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
      @mousedown="handleMouseDown"
      @click.capture="handleClickCapture"
      @dragstart="handleDragStart"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.scroll-container {
  --scroll-container-gap: var(--spacing-4);
  --scroll-container-mask-size: var(--spacing-6);
  --scroll-container-mask-opaque: var(--text-primary);
  --scroll-container-mask-transparent: var(--surface-transparent);
  --scroll-container-mask-angle: to bottom;
  --scroll-container-mask: none;
  --scroll-container-direction: column;
  --scroll-container-align: stretch;
  --scroll-container-overflow-x: hidden;
  --scroll-container-overflow-y: auto;
  --scroll-container-overscroll: contain;
  --scroll-container-cursor: auto;
  --scroll-container-user-select: auto;
  --scroll-container-reset-spacing: var(--spacing-0);

  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  min-width: var(--scroll-container-reset-spacing);
  min-height: var(--scroll-container-reset-spacing);
  overflow: hidden;
  box-sizing: border-box;
}

.scroll-container--horizontal {
  --scroll-container-direction: row;
  --scroll-container-align: center;
  --scroll-container-overflow-x: auto;
  --scroll-container-overflow-y: hidden;
  --scroll-container-mask-angle: to right;
}

.scroll-container--vertical {
  --scroll-container-direction: column;
  --scroll-container-align: stretch;
  --scroll-container-overflow-x: hidden;
  --scroll-container-overflow-y: auto;
  --scroll-container-mask-angle: to bottom;
  height: 100%;
  max-height: 100%;
}

.scroll-container--gap-none {
  --scroll-container-gap: var(--spacing-0);
}

.scroll-container--gap-sm {
  --scroll-container-gap: var(--spacing-3);
}

.scroll-container--gap-md {
  --scroll-container-gap: var(--spacing-4);
}

.scroll-container--gap-lg {
  --scroll-container-gap: var(--spacing-5);
}

.scroll-container__track {
  display: flex;
  flex: 1 1 auto;
  flex-direction: var(--scroll-container-direction);
  flex-wrap: nowrap;
  align-items: var(--scroll-container-align);
  gap: var(--scroll-container-gap);
  width: 100%;
  min-width: var(--scroll-container-reset-spacing);
  min-height: var(--scroll-container-reset-spacing);
  overflow-x: var(--scroll-container-overflow-x);
  overflow-y: var(--scroll-container-overflow-y);
  overscroll-behavior: var(--scroll-container-overscroll);
  cursor: var(--scroll-container-cursor);
  user-select: var(--scroll-container-user-select);
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-mask-image: var(--scroll-container-mask);
  mask-image: var(--scroll-container-mask);
}

.scroll-container__track::-webkit-scrollbar {
  display: none;
}

.scroll-container__track > :deep(*) {
  flex-shrink: 0;
}

.scroll-container__track--draggable {
  --scroll-container-cursor: grab;
}

.scroll-container__track--dragging {
  --scroll-container-cursor: grabbing;
  --scroll-container-user-select: none;
}

.scroll-container__track--mask-start {
  --scroll-container-mask: linear-gradient(
    var(--scroll-container-mask-angle),
    var(--scroll-container-mask-transparent) var(--scroll-container-reset-spacing),
    var(--scroll-container-mask-opaque) var(--scroll-container-mask-size),
    var(--scroll-container-mask-opaque) 100%
  );
}

.scroll-container__track--mask-end {
  --scroll-container-mask: linear-gradient(
    var(--scroll-container-mask-angle),
    var(--scroll-container-mask-opaque) var(--scroll-container-reset-spacing),
    var(--scroll-container-mask-opaque) calc(100% - var(--scroll-container-mask-size)),
    var(--scroll-container-mask-transparent) 100%
  );
}

.scroll-container__track--mask-both {
  --scroll-container-mask: linear-gradient(
    var(--scroll-container-mask-angle),
    var(--scroll-container-mask-transparent) var(--scroll-container-reset-spacing),
    var(--scroll-container-mask-opaque) var(--scroll-container-mask-size),
    var(--scroll-container-mask-opaque) calc(100% - var(--scroll-container-mask-size)),
    var(--scroll-container-mask-transparent) 100%
  );
}
</style>
