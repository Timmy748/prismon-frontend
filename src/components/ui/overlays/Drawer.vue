<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useEscapeKey } from './useEscapeKey'
import { hasOverlayPortalRoot, useOverlayBackdropBlur } from './useOverlayBackdropBlur'

export type DrawerDirection = 'bottom' | 'top' | 'left' | 'right'
export type DrawerSnapPoint = number | string

interface Props {
  open: boolean
  direction?: DrawerDirection
  snapPoints?: DrawerSnapPoint[]
  activeSnapPoint?: DrawerSnapPoint | null
  closeThreshold?: number
  closeOnBackdrop?: boolean
  dismissible?: boolean
  handleOnly?: boolean
  lockBodyScroll?: boolean
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'bottom',
  activeSnapPoint: null,
  closeThreshold: 0.25,
  closeOnBackdrop: true,
  dismissible: true,
  handleOnly: false,
  lockBodyScroll: true,
  ariaLabel: 'Gaveta',
})

const emit = defineEmits<{
  close: []
  'update:open': [value: boolean]
  'update:activeSnapPoint': [value: DrawerSnapPoint]
  drag: [percentageDragged: number]
  release: [open: boolean]
}>()

const DRAG_SLOP_PX = 4
const MIN_FLICK_DISTANCE_PX = 48
const VELOCITY_DISMISS_PX_MS = 0.35

const rootRef = ref<HTMLDivElement | null>(null)
const backdropRef = ref<HTMLDivElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)
const bodyRef = ref<HTMLDivElement | null>(null)

const internalSnapPoint = ref<DrawerSnapPoint | null>(props.activeSnapPoint)

let activePointerId: number | null = null
let hasEngagedDrag = false
let dragStartPointer = 0
let dragStartOffset = 0
let dragStartTime = 0
let currentOffset = 0
let releaseTransitionDurationMs: number | null = null
let savedBodyOverflow: string | null = null
let transitionCleanup: (() => void) | null = null

const isHorizontal = computed(() => props.direction === 'left' || props.direction === 'right')

const hasSnapPoints = computed(() => Array.isArray(props.snapPoints) && props.snapPoints.length > 0)

const currentSnapPoint = computed<DrawerSnapPoint | null>(() => {
  if (!hasSnapPoints.value) {
    return null
  }
  return props.activeSnapPoint ?? internalSnapPoint.value ?? props.snapPoints![0]!
})

const drawerClasses = computed(() => [
  'drawer',
  `drawer--${props.direction}`,
  hasSnapPoints.value ? 'drawer--snap' : undefined,
])

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function getPanelDimension(): number {
  const panel = panelRef.value
  if (!panel) {
    return 400
  }
  const rect = panel.getBoundingClientRect()
  const raw = isHorizontal.value ? rect.width : rect.height
  if (raw > 0) {
    return raw
  }
  return isHorizontal.value
    ? Math.min(window.innerWidth || 400, 484)
    : Math.min(window.innerHeight || 500, 500)
}

function resolveSnapRatio(point: DrawerSnapPoint, panelDim: number): number {
  if (typeof point === 'number') {
    return Math.max(0.1, Math.min(1, point))
  }
  const parsed = Number.parseFloat(point)
  if (!Number.isFinite(parsed) || parsed <= 0 || panelDim <= 0) {
    return 1
  }
  return Math.max(0.1, Math.min(1, parsed / panelDim))
}

function getSortedSnapOffsets(panelDim: number): Array<{ point: DrawerSnapPoint; offset: number }> {
  if (!hasSnapPoints.value) {
    return []
  }
  const sign = props.direction === 'top' || props.direction === 'left' ? -1 : 1
  return props
    .snapPoints!.map((point) => {
      const ratio = resolveSnapRatio(point, panelDim)
      return {
        point,
        offset: sign * panelDim * (1 - ratio),
      }
    })
    .sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset))
}

function getRestOffset(panelDim = getPanelDimension()): number {
  if (!hasSnapPoints.value || currentSnapPoint.value === null) {
    return 0
  }
  const sign = props.direction === 'top' || props.direction === 'left' ? -1 : 1
  const ratio = resolveSnapRatio(currentSnapPoint.value, panelDim)
  return sign * panelDim * (1 - ratio)
}

function getClosedTransform(): string {
  switch (props.direction) {
    case 'top':
      return 'translate3d(0, -100%, 0)'
    case 'left':
      return 'translate3d(-100%, 0, 0)'
    case 'right':
      return 'translate3d(100%, 0, 0)'
    case 'bottom':
    default:
      return 'translate3d(0, 100%, 0)'
  }
}

function formatOffsetTransform(offset: number): string {
  return isHorizontal.value ? `translate3d(${offset}px, 0, 0)` : `translate3d(0, ${offset}px, 0)`
}

function dampValue(overdrag: number, dimension: number): number {
  const safeDim = Math.max(120, dimension)
  return (overdrag * safeDim * 0.22) / (safeDim + Math.abs(overdrag) * 0.22)
}

function readLiveTransformOffset(panel: HTMLElement): number {
  if (typeof window === 'undefined') {
    return 0
  }
  const raw = window.getComputedStyle(panel).transform
  if (!raw || raw === 'none') {
    return 0
  }
  if (typeof DOMMatrixReadOnly !== 'undefined') {
    try {
      const matrix = new DOMMatrixReadOnly(raw)
      return isHorizontal.value ? matrix.m41 : matrix.m42
    } catch {
      // Fallback below
    }
  }
  const match = raw.match(/matrix\(([^)]+)\)/)
  if (match && match[1]) {
    const parts = match[1].split(',').map((val) => Number.parseFloat(val.trim()))
    const idx = isHorizontal.value ? 4 : 5
    return Number.isFinite(parts[idx]) ? parts[idx]! : 0
  }
  return 0
}

function canBodyScrollAlongDrag(target: EventTarget | null, delta: number): boolean {
  if (!(target instanceof Element) || target.closest('.drawer__handle-hit')) {
    return false
  }
  const panel = panelRef.value
  let cursor: Element | null = target
  while (cursor && cursor !== panel) {
    const style = window.getComputedStyle(cursor)
    if (isHorizontal.value) {
      const canOverflowX = style.overflowX === 'auto' || style.overflowX === 'scroll'
      if (canOverflowX && cursor.scrollWidth > cursor.clientWidth + 1) {
        if (props.direction === 'right' && delta > 0 && cursor.scrollLeft > 0) return true
        if (
          props.direction === 'left' &&
          delta < 0 &&
          cursor.scrollLeft + cursor.clientWidth < cursor.scrollWidth - 1
        )
          return true
        if (
          props.direction === 'right' &&
          delta < 0 &&
          cursor.scrollLeft + cursor.clientWidth < cursor.scrollWidth - 1
        )
          return true
        if (props.direction === 'left' && delta > 0 && cursor.scrollLeft > 0) return true
      }
    } else {
      const canOverflowY = style.overflowY === 'auto' || style.overflowY === 'scroll'
      if (canOverflowY && cursor.scrollHeight > cursor.clientHeight + 1) {
        if (props.direction === 'bottom' && delta > 0 && cursor.scrollTop > 0) return true
        if (
          props.direction === 'bottom' &&
          delta < 0 &&
          cursor.scrollTop + cursor.clientHeight < cursor.scrollHeight - 1
        )
          return true
        if (
          props.direction === 'top' &&
          delta < 0 &&
          cursor.scrollTop + cursor.clientHeight < cursor.scrollHeight - 1
        )
          return true
        if (props.direction === 'top' && delta > 0 && cursor.scrollTop > 0) return true
      }
    }
    cursor = cursor.parentElement
  }
  return false
}

function updateDragVisuals(offset: number, panelDim: number) {
  const panel = panelRef.value
  const backdrop = backdropRef.value
  if (panel) {
    panel.style.transform = formatOffsetTransform(offset)
  }

  const dismissSign = props.direction === 'top' || props.direction === 'left' ? -1 : 1
  const towardDismiss = Math.max(0, offset * dismissSign)
  const progress = Math.max(0, Math.min(1, towardDismiss / Math.max(1, panelDim)))

  if (backdrop) {
    backdrop.style.opacity = String(1 - progress)
  }

  emit('drag', progress)
}

function runPanelTransition(
  durationMs: number,
  targetTransform: string,
  targetOpacity: string,
  onFinished?: () => void,
) {
  transitionCleanup?.()
  const panel = panelRef.value
  const backdrop = backdropRef.value

  if (!panel) {
    onFinished?.()
    return
  }

  const reduced = prefersReducedMotion()
  const easing = reduced ? 'var(--easing-hover)' : 'var(--drawer-transition-easing)'
  const effectiveDuration = reduced ? Math.min(durationMs, 200) : durationMs

  panel.style.transition = reduced
    ? `opacity ${effectiveDuration}ms ${easing}`
    : `transform ${effectiveDuration}ms ${easing}`
  if (backdrop) {
    backdrop.style.transition = `opacity ${Math.min(effectiveDuration, 260)}ms var(--drawer-backdrop-transition-easing)`
  }

  void panel.offsetHeight

  if (reduced) {
    panel.style.opacity = targetOpacity
  } else {
    panel.style.transform = targetTransform
  }
  if (backdrop) {
    backdrop.style.opacity = targetOpacity
  }

  let finished = false
  let fallbackTimer: number | null = null

  const complete = () => {
    if (finished) return
    finished = true
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer)
      fallbackTimer = null
    }
    panel.removeEventListener('transitionend', onTransitionEnd)
    transitionCleanup = null
    onFinished?.()
  }

  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target === panel) {
      complete()
    }
  }

  panel.addEventListener('transitionend', onTransitionEnd)
  fallbackTimer = window.setTimeout(complete, effectiveDuration + 60)

  transitionCleanup = () => {
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer)
      fallbackTimer = null
    }
    panel.removeEventListener('transitionend', onTransitionEnd)
  }
}

function handleClose(customDuration?: number) {
  releaseTransitionDurationMs = customDuration ?? null
  emit('release', false)
  emit('close')
  emit('update:open', false)
}

function handleBackdropClick() {
  if (!props.closeOnBackdrop || !props.dismissible) {
    return
  }
  handleClose()
}

function onPointerDown(event: PointerEvent) {
  if (activePointerId !== null || event.button === 2) {
    return
  }

  const target = event.target
  const inHandle = target instanceof Element && Boolean(target.closest('.drawer__handle-hit'))
  if (props.handleOnly && !inHandle) {
    return
  }

  if (
    !inHandle &&
    target instanceof Element &&
    target.closest(
      'button, a, input, textarea, select, option, [contenteditable="true"], [data-drawer-no-drag], [data-vaul-no-drag]',
    )
  ) {
    return
  }

  const panel = panelRef.value
  if (!panel) {
    return
  }

  activePointerId = event.pointerId
  hasEngagedDrag = false
  dragStartPointer = isHorizontal.value ? event.clientX : event.clientY
  dragStartOffset = readLiveTransformOffset(panel)
  currentOffset = dragStartOffset
  dragStartTime = Date.now()
}

function onPointerMove(event: PointerEvent) {
  if (activePointerId !== event.pointerId) {
    return
  }

  const pointerPos = isHorizontal.value ? event.clientX : event.clientY
  const delta = pointerPos - dragStartPointer

  if (!hasEngagedDrag) {
    if (Math.abs(delta) < DRAG_SLOP_PX) {
      return
    }
    if (canBodyScrollAlongDrag(event.target, delta)) {
      activePointerId = null
      return
    }
    transitionCleanup?.()
    hasEngagedDrag = true
    const panel = panelRef.value
    const backdrop = backdropRef.value
    if (panel) {
      dragStartOffset = readLiveTransformOffset(panel)
      panel.style.transition = 'none'
      try {
        panel.setPointerCapture(event.pointerId)
      } catch {
        // Fallback when pointer capture isn't supported (e.g. jsdom)
      }
    }
    if (backdrop) {
      backdrop.style.opacity = window.getComputedStyle(backdrop).opacity
      backdrop.style.transition = 'none'
    }
  }

  const panelDim = getPanelDimension()
  const rawOffset = dragStartOffset + delta
  const dismissSign = props.direction === 'top' || props.direction === 'left' ? -1 : 1
  const minOffset = hasSnapPoints.value ? (getSortedSnapOffsets(panelDim)[0]?.offset ?? 0) : 0

  const signedRaw = rawOffset * dismissSign
  const signedMin = minOffset * dismissSign

  let finalOffset = rawOffset
  if (signedRaw < signedMin) {
    finalOffset = minOffset + dismissSign * dampValue(signedRaw - signedMin, panelDim)
  } else if (!props.dismissible && signedRaw > signedMin) {
    finalOffset = minOffset + dismissSign * dampValue(signedRaw - signedMin, panelDim)
  }

  currentOffset = finalOffset
  updateDragVisuals(finalOffset, panelDim)
}

function onPointerUp(event: PointerEvent) {
  if (activePointerId !== event.pointerId) {
    return
  }

  const panel = panelRef.value
  const wasDragging = hasEngagedDrag
  activePointerId = null
  hasEngagedDrag = false

  if (panel) {
    try {
      if (panel.hasPointerCapture(event.pointerId)) {
        panel.releasePointerCapture(event.pointerId)
      }
    } catch {
      // Ignore in test environments
    }
  }

  if (!wasDragging) {
    return
  }

  const panelDim = getPanelDimension()
  const dismissSign = props.direction === 'top' || props.direction === 'left' ? -1 : 1
  const elapsed = Math.max(16, Date.now() - dragStartTime)
  const delta = currentOffset - dragStartOffset
  const velocity = Math.min(2.5, (delta * dismissSign) / elapsed)

  if (hasSnapPoints.value) {
    const snaps = getSortedSnapOffsets(panelDim)
    const largestSnapOffset = snaps[snaps.length - 1]!.offset
    const closeLimit = largestSnapOffset * dismissSign + panelDim * props.closeThreshold
    const projectedSigned = currentOffset * dismissSign + velocity * 140

    if (
      props.dismissible &&
      (projectedSigned > closeLimit ||
        (currentOffset * dismissSign >= largestSnapOffset * dismissSign &&
          delta * dismissSign >= MIN_FLICK_DISTANCE_PX &&
          velocity >= VELOCITY_DISMISS_PX_MS) ||
        velocity >= 1.2)
    ) {
      const quickDuration = Math.max(180, Math.min(400, Math.round(380 - velocity * 120)))
      handleClose(quickDuration)
      return
    }

    let nearest = snaps[0]!
    let minDist = Math.abs(projectedSigned - nearest.offset * dismissSign)
    for (const candidate of snaps) {
      const dist = Math.abs(projectedSigned - candidate.offset * dismissSign)
      if (dist < minDist) {
        minDist = dist
        nearest = candidate
      }
    }

    internalSnapPoint.value = nearest.point
    emit('update:activeSnapPoint', nearest.point)
    emit('release', true)

    runPanelTransition(360, formatOffsetTransform(nearest.offset), '1', () => {
      if (backdropRef.value) {
        backdropRef.value.style.transition = ''
      }
    })
    return
  }

  const progress = (currentOffset * dismissSign) / Math.max(1, panelDim)
  const shouldDismiss =
    props.dismissible &&
    (progress >= props.closeThreshold ||
      (delta * dismissSign >= MIN_FLICK_DISTANCE_PX && velocity >= VELOCITY_DISMISS_PX_MS))

  if (shouldDismiss) {
    const quickDuration = Math.max(180, Math.min(400, Math.round(380 - velocity * 120)))
    handleClose(quickDuration)
    return
  }

  emit('release', true)
  runPanelTransition(320, formatOffsetTransform(0), '1', () => {
    if (panel) {
      panel.style.transition = ''
      panel.style.transform = ''
    }
    if (backdropRef.value) {
      backdropRef.value.style.transition = ''
      backdropRef.value.style.opacity = ''
    }
  })
}

function onBeforeEnter() {
  releaseTransitionDurationMs = null
  const panel = panelRef.value
  const backdrop = backdropRef.value
  if (panel) {
    panel.style.transition = 'none'
    if (prefersReducedMotion()) {
      panel.style.opacity = '0'
    } else {
      panel.style.transform = getClosedTransform()
    }
  }
  if (backdrop) {
    backdrop.style.transition = 'none'
    backdrop.style.opacity = '0'
  }
}

function onEnter(_el: Element, done: () => void) {
  const panelDim = getPanelDimension()
  const restOffset = getRestOffset(panelDim)
  runPanelTransition(400, formatOffsetTransform(restOffset), '1', done)
}

function onAfterEnter() {
  const panel = panelRef.value
  const backdrop = backdropRef.value
  if (panel) {
    panel.style.transition = ''
    panel.style.opacity = ''
    if (!hasSnapPoints.value) {
      panel.style.transform = ''
    }
  }
  if (backdrop) {
    backdrop.style.transition = ''
    backdrop.style.opacity = ''
  }
}

function onLeave(_el: Element, done: () => void) {
  const duration = releaseTransitionDurationMs ?? 400
  releaseTransitionDurationMs = null
  runPanelTransition(duration, getClosedTransform(), '0', done)
}

function onAfterLeave() {
  transitionCleanup?.()
  const panel = panelRef.value
  const backdrop = backdropRef.value
  if (panel) {
    panel.style.transition = ''
    panel.style.transform = ''
    panel.style.opacity = ''
  }
  if (backdrop) {
    backdrop.style.transition = ''
    backdrop.style.opacity = ''
  }
}

function setBodyScrollLock(locked: boolean) {
  if (typeof document === 'undefined' || !props.lockBodyScroll) {
    return
  }
  if (locked) {
    if (savedBodyOverflow === null) {
      savedBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
  } else if (savedBodyOverflow !== null) {
    document.body.style.overflow = savedBodyOverflow
    savedBodyOverflow = null
  }
}

watch(
  () => props.open,
  (open) => {
    setBodyScrollLock(open)
    if (open && hasSnapPoints.value) {
      internalSnapPoint.value = props.activeSnapPoint ?? props.snapPoints![0]!
    }
  },
  { immediate: true },
)

watch(
  () => props.activeSnapPoint,
  (point) => {
    if (point !== undefined && point !== null && hasSnapPoints.value) {
      internalSnapPoint.value = point
      if (props.open && panelRef.value) {
        const restOffset = getRestOffset(getPanelDimension())
        runPanelTransition(360, formatOffsetTransform(restOffset), '1')
      }
    }
  },
)

const canTeleportOverlay = hasOverlayPortalRoot()
useOverlayBackdropBlur(() => props.open)

useEscapeKey(
  () => props.open && props.dismissible,
  () => handleClose(),
)

onBeforeUnmount(() => {
  transitionCleanup?.()
  setBodyScrollLock(false)
})
</script>

<template>
  <Teleport to="#prismon-overlay-root" :disabled="!canTeleportOverlay">
    <Transition
      name="drawer"
      :css="false"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
      @after-leave="onAfterLeave"
    >
      <div v-if="open" ref="rootRef" :class="drawerClasses">
        <div ref="backdropRef" class="drawer__backdrop" @click="handleBackdropClick" />

        <div
          ref="panelRef"
          class="drawer__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <div
            v-if="direction === 'bottom' || direction === 'top'"
            class="drawer__handle-hit"
            aria-hidden="true"
          >
            <div class="drawer__handle" aria-hidden="true" />
          </div>

          <header v-if="$slots.header" class="drawer__header">
            <slot name="header" />
          </header>

          <div ref="bodyRef" class="drawer__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="drawer__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer {
  --drawer-z-index: var(--z-drawer);
  --drawer-backdrop-bg: var(--surface-backdrop);
  --drawer-max-width: 100%;
  --drawer-max-height: 92dvh;
  --drawer-bg: var(--surface-elevated);
  --drawer-border-color: var(--border-subtle-1);
  --drawer-border-width: var(--border-width-thin);
  --drawer-radius: var(--radius-none);
  --drawer-padding-top: var(--spacing-4);
  --drawer-padding-x: var(--spacing-5);
  --drawer-padding-bottom: var(--spacing-6);
  --drawer-gap: var(--spacing-4);
  --drawer-handle-width: 48px;
  --drawer-handle-height: 6px;
  --drawer-handle-radius: var(--radius-full);
  --drawer-handle-bg: var(--surface-handle);
  --drawer-handle-hit-size: 28px;
  --drawer-touch-action: pan-x;
  --drawer-opacity-closed: var(--opacity-hidden);
  --drawer-transform-closed: translate3d(0, 100%, 0);
  --drawer-transition-duration: var(--duration-drawer);
  --drawer-backdrop-transition-duration: var(--duration-modal);
  --drawer-transition-easing: var(--easing-drawer);
  --drawer-backdrop-transition-easing: var(--easing-out);

  position: fixed;
  inset: var(--spacing-0);
  z-index: var(--drawer-z-index);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.drawer--bottom {
  align-items: flex-end;
  justify-content: center;
  --drawer-touch-action: pan-x;
  --drawer-transform-closed: translate3d(0, 100%, 0);
}

.drawer--top {
  align-items: flex-start;
  justify-content: center;
  --drawer-touch-action: pan-x;
  --drawer-transform-closed: translate3d(0, -100%, 0);
}

.drawer--left {
  align-items: stretch;
  justify-content: flex-start;
  --drawer-max-width: min(360px, 100%);
  --drawer-touch-action: pan-y;
  --drawer-transform-closed: translate3d(-100%, 0, 0);
}

.drawer--right {
  align-items: stretch;
  justify-content: flex-end;
  --drawer-max-width: min(360px, 100%);
  --drawer-touch-action: pan-y;
  --drawer-transform-closed: translate3d(100%, 0, 0);
}

.drawer__backdrop {
  position: fixed;
  inset: var(--spacing-0);
  z-index: 0;
  background-color: var(--drawer-backdrop-bg);
}

.drawer__panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--drawer-gap);
  width: 100%;
  max-width: var(--drawer-max-width);
  max-height: var(--drawer-max-height);
  padding: var(--drawer-padding-top) var(--drawer-padding-x) var(--drawer-padding-bottom)
    var(--drawer-padding-x);
  box-sizing: border-box;
  background-color: var(--drawer-bg);
  border: var(--drawer-border-width) solid var(--drawer-border-color);
  border-radius: var(--drawer-radius);
  touch-action: var(--drawer-touch-action);
  overscroll-behavior: contain;
}

.drawer--snap .drawer__panel {
  height: var(--drawer-max-height);
}

.drawer--left .drawer__panel,
.drawer--right .drawer__panel {
  height: 100%;
  max-height: 100%;
}

.drawer__handle-hit {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex-shrink: 0;
  width: 100%;
  padding-block: var(--spacing-2);
  touch-action: none;
  cursor: grab;
}

.drawer__handle-hit::before {
  content: '';
  position: absolute;
  inset: calc(var(--drawer-handle-hit-size) * -0.5) var(--spacing-0);
}

.drawer__handle-hit:active {
  cursor: grabbing;
}

.drawer--top .drawer__handle-hit {
  order: 3;
}

.drawer__handle {
  width: var(--drawer-handle-width);
  height: var(--drawer-handle-height);
  border-radius: var(--drawer-handle-radius);
  background-color: var(--drawer-handle-bg);
}

.drawer__header,
.drawer__footer {
  flex-shrink: 0;
}

.drawer__body {
  flex: 1 1 auto;
  min-height: var(--spacing-0);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.drawer-enter-active .drawer__backdrop,
.drawer-leave-active .drawer__backdrop {
  transition: opacity var(--drawer-backdrop-transition-duration)
    var(--drawer-backdrop-transition-easing);
}

.drawer-enter-active .drawer__panel,
.drawer-leave-active .drawer__panel {
  transition: transform var(--drawer-transition-duration) var(--drawer-transition-easing);
}

.drawer-enter-from .drawer__backdrop,
.drawer-leave-to .drawer__backdrop {
  opacity: var(--drawer-opacity-closed);
}

.drawer-enter-from .drawer__panel,
.drawer-leave-to .drawer__panel {
  transform: var(--drawer-transform-closed);
}

@media (prefers-reduced-motion: reduce) {
  .drawer {
    --drawer-transform-closed: none;
    --drawer-transition-duration: var(--duration-normal);
    --drawer-backdrop-transition-duration: var(--duration-normal);
  }
}
</style>
