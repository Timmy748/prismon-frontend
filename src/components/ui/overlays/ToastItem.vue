<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Button, IconButton } from '../buttons'
import { Icon, type IconName } from '../icons'
import type { SwipeDirection, ToastPosition, ToastRecord, ToasterIcons } from './toastState'

interface Props {
  toast: ToastRecord
  index: number
  visibleIndex: number
  totalVisible: number
  expanded: boolean
  position: ToastPosition
  visibleToasts: number
  frontToastHeight: number
  offsetBefore: number
  gap: number
  swipeDirections: SwipeDirection[]
  interacting: boolean
  defaultDuration: number
  closeButton: boolean
  icons?: ToasterIcons
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dismiss: [id: string | number]
  'auto-close': [id: string | number]
  'remove-from-dom': [id: string | number]
  'height-change': [id: string | number, height: number]
  'interacting-change': [interacting: boolean]
}>()

const SWIPE_THRESHOLD_PX = 45
const VELOCITY_THRESHOLD_PX_MS = 0.11
const EXIT_REMOVE_DELAY_MS = 380

const itemRef = ref<HTMLLIElement | null>(null)
const isMounted = ref(false)
const isSwipedOut = ref(false)
const measuredHeight = ref(0)

let closeTimer: number | null = null
let removeTimer: number | null = null
let timerStartedAt = 0
let remainingDuration = resolveDuration()
let isDocumentHidden = typeof document !== 'undefined' ? document.hidden : false

let resizeObserver: ResizeObserver | null = null
let activePointerId: number | null = null
let dragStartX = 0
let dragStartY = 0
let dragStartTime = 0
let lockedAxis: 'x' | 'y' | null = null
let swipeDeltaX = 0
let swipeDeltaY = 0

function resolveDuration(): number {
  if (props.toast.duration !== undefined) {
    return props.toast.duration
  }
  return props.toast.type === 'loading' ? Infinity : props.defaultDuration
}

const yPosition = computed<'top' | 'bottom'>(() =>
  props.position.startsWith('top') ? 'top' : 'bottom',
)

const xPosition = computed<'left' | 'center' | 'right'>(() => {
  if (props.position.endsWith('left')) return 'left'
  if (props.position.endsWith('center')) return 'center'
  return 'right'
})

const isRemoved = computed(() => Boolean(props.toast.dismissed) || isSwipedOut.value)
const isVisible = computed(() => !props.toast.dismissed && props.visibleIndex < props.visibleToasts)
const isFront = computed(() => props.visibleIndex === 0)
const hasCloseButton = computed(() => props.toast.closeButton ?? props.closeButton)
const isDismissible = computed(() => props.toast.dismissible !== false)

const resolvedIcon = computed<IconName | null>(() => {
  if (props.toast.icon === null) {
    return null
  }
  if (props.toast.icon) {
    return props.toast.icon
  }
  const type = props.toast.type
  if (type === 'loading') {
    const custom = props.icons?.loading
    return custom === undefined ? 'repeat' : custom
  }
  if (type === 'error') {
    const custom = props.icons?.error
    return custom === undefined ? 'close' : custom
  }
  if (type === 'success') return props.icons?.success ?? null
  if (type === 'info') return props.icons?.info ?? null
  if (type === 'warning') return props.icons?.warning ?? null
  return null
})

const showIndicatorDot = computed(
  () =>
    resolvedIcon.value === null &&
    props.toast.icon !== null &&
    (props.toast.type === 'success' ||
      props.toast.type === 'info' ||
      props.toast.type === 'warning'),
)

const roleAttribute = computed(() => (props.toast.type === 'error' ? 'alert' : 'status'))

const toastClasses = computed(() => [
  'toast',
  `toast--${props.toast.type}`,
  props.toast.unstyled ? 'toast--unstyled' : undefined,
  props.toast.className,
])

const toastStyles = computed(() => ({
  '--toast-index': String(props.visibleIndex),
  '--toast-toasts-before': String(props.visibleIndex),
  '--toast-z-index': String(Math.max(1, props.totalVisible - props.index)),
  '--toast-offset': `${props.offsetBefore}px`,
  '--toast-initial-height': measuredHeight.value > 0 ? `${measuredHeight.value}px` : 'auto',
  '--toast-front-height': props.frontToastHeight > 0 ? `${props.frontToastHeight}px` : 'auto',
  '--toast-gap': `${props.gap}px`,
  '--toast-lift': yPosition.value === 'top' ? '1' : '-1',
  '--toast-lift-amount': `calc(var(--toast-lift) * ${props.gap}px * ${props.visibleIndex})`,
}))

function measureHeight() {
  const el = itemRef.value
  if (!el) {
    return
  }
  const previousHeight = el.style.height
  el.style.height = 'auto'
  const height = el.getBoundingClientRect().height
  el.style.height = previousHeight
  if (height > 0 && Math.abs(height - measuredHeight.value) > 0.5) {
    measuredHeight.value = height
    emit('height-change', props.toast.id, height)
  }
}

function clearCloseTimer() {
  if (closeTimer !== null) {
    window.clearTimeout(closeTimer)
    closeTimer = null
  }
}

function pauseTimer() {
  if (closeTimer === null) {
    return
  }
  clearCloseTimer()
  const elapsed = Date.now() - timerStartedAt
  remainingDuration = Math.max(0, remainingDuration - elapsed)
}

function startTimer() {
  clearCloseTimer()
  if (
    remainingDuration === Infinity ||
    isRemoved.value ||
    props.expanded ||
    props.interacting ||
    isDocumentHidden
  ) {
    return
  }
  timerStartedAt = Date.now()
  closeTimer = window.setTimeout(() => {
    closeTimer = null
    emit('auto-close', props.toast.id)
  }, remainingDuration)
}

function scheduleDomRemoval() {
  if (removeTimer !== null) {
    return
  }
  removeTimer = window.setTimeout(() => {
    removeTimer = null
    emit('remove-from-dom', props.toast.id)
  }, EXIT_REMOVE_DELAY_MS)
}

function handleVisibilityChange() {
  isDocumentHidden = document.hidden
  if (isDocumentHidden) {
    pauseTimer()
  } else {
    startTimer()
  }
}

function handleActionClick(event: MouseEvent) {
  props.toast.action?.onClick(event)
  if (!event.defaultPrevented) {
    emit('dismiss', props.toast.id)
  }
}

function handleCancelClick(event: MouseEvent) {
  props.toast.cancel?.onClick(event)
  emit('dismiss', props.toast.id)
}

function handleCloseClick() {
  if (!isDismissible.value) {
    return
  }
  emit('dismiss', props.toast.id)
}

function dampSwipe(delta: number): number {
  const factor = 1 / (1 + Math.abs(delta) * 0.05)
  return delta * factor
}

function isSwipeDirectionAllowed(direction: SwipeDirection): boolean {
  return props.swipeDirections.includes(direction)
}

function onPointerDown(event: PointerEvent) {
  if (!isDismissible.value || event.button === 2 || isRemoved.value) {
    return
  }
  const target = event.target
  if (
    target instanceof Element &&
    target.closest(
      'button, a, input, textarea, select, option, [contenteditable="true"], [data-no-swipe]',
    )
  ) {
    return
  }

  const el = itemRef.value
  if (!el) {
    return
  }

  activePointerId = event.pointerId
  dragStartX = event.clientX
  dragStartY = event.clientY
  dragStartTime = Date.now()
  lockedAxis = null
  swipeDeltaX = 0
  swipeDeltaY = 0
  emit('interacting-change', true)

  try {
    el.setPointerCapture(event.pointerId)
  } catch {
    // Fallback for test environments without pointer capture
  }

  el.style.transition = 'none'
}

function onPointerMove(event: PointerEvent) {
  if (activePointerId !== event.pointerId) {
    return
  }
  const el = itemRef.value
  if (!el) {
    return
  }

  const rawX = event.clientX - dragStartX
  const rawY = event.clientY - dragStartY

  if (!lockedAxis) {
    if (Math.abs(rawX) < 4 && Math.abs(rawY) < 4) {
      return
    }
    const horizontalAllowed = isSwipeDirectionAllowed('left') || isSwipeDirectionAllowed('right')
    const verticalAllowed = isSwipeDirectionAllowed('top') || isSwipeDirectionAllowed('bottom')

    if (Math.abs(rawX) > Math.abs(rawY) && horizontalAllowed) {
      lockedAxis = 'x'
    } else if (verticalAllowed) {
      lockedAxis = 'y'
    } else {
      lockedAxis = 'x'
    }
  }

  const baseTranslateY = props.expanded
    ? yPosition.value === 'top'
      ? props.offsetBefore
      : -props.offsetBefore
    : yPosition.value === 'top'
      ? props.gap * props.visibleIndex
      : -props.gap * props.visibleIndex

  if (lockedAxis === 'x') {
    const dir: SwipeDirection = rawX >= 0 ? 'right' : 'left'
    swipeDeltaX = isSwipeDirectionAllowed(dir) ? rawX : dampSwipe(rawX)
    swipeDeltaY = 0
    el.style.transform = `translate3d(${swipeDeltaX}px, ${baseTranslateY}px, 0)`
  } else {
    const dir: SwipeDirection = rawY >= 0 ? 'bottom' : 'top'
    swipeDeltaY = isSwipeDirectionAllowed(dir) ? rawY : dampSwipe(rawY)
    swipeDeltaX = 0
    el.style.transform = `translate3d(0, ${baseTranslateY + swipeDeltaY}px, 0)`
  }
}

function onPointerUp(event: PointerEvent) {
  if (activePointerId !== event.pointerId) {
    return
  }
  const el = itemRef.value
  activePointerId = null
  emit('interacting-change', false)

  if (!el) {
    return
  }

  try {
    if (el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId)
    }
  } catch {
    // Ignore in environments without pointer capture
  }

  const delta = lockedAxis === 'x' ? swipeDeltaX : swipeDeltaY
  const elapsed = Math.max(1, Date.now() - dragStartTime)
  const velocity = Math.abs(delta) / elapsed

  let swipedInAllowedDirection = false
  if (lockedAxis === 'x') {
    swipedInAllowedDirection =
      (delta > 0 && isSwipeDirectionAllowed('right')) ||
      (delta < 0 && isSwipeDirectionAllowed('left'))
  } else if (lockedAxis === 'y') {
    swipedInAllowedDirection =
      (delta > 0 && isSwipeDirectionAllowed('bottom')) ||
      (delta < 0 && isSwipeDirectionAllowed('top'))
  }

  if (
    swipedInAllowedDirection &&
    (Math.abs(delta) >= SWIPE_THRESHOLD_PX || velocity > VELOCITY_THRESHOLD_PX_MS)
  ) {
    isSwipedOut.value = true
    el.style.transition =
      'transform var(--duration-normal) var(--easing-out), opacity var(--duration-normal) var(--easing-out)'
    if (lockedAxis === 'x') {
      const sign = delta >= 0 ? '100%' : '-100%'
      el.style.transform = `translate3d(${sign}, 0, 0)`
    } else {
      const sign = delta >= 0 ? '100%' : '-100%'
      el.style.transform = `translate3d(0, ${sign}, 0)`
    }
    el.style.opacity = '0'
    clearCloseTimer()
    emit('dismiss', props.toast.id)
    scheduleDomRemoval()
    return
  }

  el.style.transition = ''
  el.style.transform = ''
  lockedAxis = null
  swipeDeltaX = 0
  swipeDeltaY = 0
}

watch(
  () => [props.expanded, props.interacting] as const,
  ([expanded, interacting]) => {
    if (expanded || interacting) {
      pauseTimer()
    } else {
      startTimer()
    }
  },
)

watch(
  () => [props.toast.updatedAt, props.toast.duration, props.toast.type] as const,
  () => {
    remainingDuration = resolveDuration()
    nextTick(() => {
      measureHeight()
      startTimer()
    })
  },
)

watch(
  () => props.toast.dismissed,
  (dismissed) => {
    if (dismissed) {
      clearCloseTimer()
      scheduleDomRemoval()
    }
  },
  { immediate: true, flush: 'sync' },
)

onMounted(() => {
  measureHeight()
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      isMounted.value = true
    })
  } else {
    isMounted.value = true
  }

  if (typeof ResizeObserver !== 'undefined' && itemRef.value) {
    resizeObserver = new ResizeObserver(measureHeight)
    resizeObserver.observe(itemRef.value)
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  startTimer()
})

onBeforeUnmount(() => {
  clearCloseTimer()
  if (removeTimer !== null) {
    window.clearTimeout(removeTimer)
  }
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <li
    ref="itemRef"
    :class="toastClasses"
    :style="toastStyles"
    :role="roleAttribute"
    aria-live="polite"
    aria-atomic="true"
    tabindex="0"
    :data-testid="toast.testId"
    :data-mounted="isMounted"
    :data-removed="isRemoved"
    :data-visible="isVisible"
    :data-expanded="expanded"
    :data-front="isFront"
    :data-swipe-out="isSwipedOut"
    :data-y-position="yPosition"
    :data-x-position="xPosition"
    :data-type="toast.type"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <template v-if="toast.component">
      <component :is="toast.component" v-bind="toast.componentProps" :dismiss="handleCloseClick" />
    </template>

    <template v-else>
      <div
        v-if="resolvedIcon || showIndicatorDot"
        :class="['toast__icon', toast.type === 'loading' ? 'toast__icon--loading' : undefined]"
        aria-hidden="true"
      >
        <Icon v-if="resolvedIcon" :name="resolvedIcon" size="sm" />
        <span v-else-if="showIndicatorDot" class="toast__indicator" />
      </div>

      <div class="toast__content">
        <p v-if="toast.title" class="toast__title">{{ toast.title }}</p>
        <p v-if="toast.description" class="toast__description">{{ toast.description }}</p>

        <div v-if="toast.action || toast.cancel" class="toast__actions">
          <Button v-if="toast.cancel" size="sm" variant="tertiary" @click="handleCancelClick">
            {{ toast.cancel.label }}
          </Button>
          <Button v-if="toast.action" size="sm" variant="primary" @click="handleActionClick">
            {{ toast.action.label }}
          </Button>
        </div>
      </div>

      <IconButton
        v-if="hasCloseButton && isDismissible"
        class="toast__close"
        variant="ghost"
        size="sm"
        :icon="icons?.close ?? 'close'"
        ariaLabel="Fechar notificação"
        @click="handleCloseClick"
      />
    </template>
  </li>
</template>

<style scoped>
.toast {
  --toast-bg: var(--surface-elevated);
  --toast-color: var(--text-primary);
  --toast-description-color: var(--text-secondary);
  --toast-border-color: var(--border-subtle-1);
  --toast-border-width: var(--border-width-thin);
  --toast-radius: var(--radius-none);
  --toast-shadow: var(--shadow-toast);
  --toast-padding-y: var(--spacing-4);
  --toast-padding-x: var(--spacing-5);
  --toast-gap: var(--spacing-4);
  --toast-content-gap: var(--spacing-1);
  --toast-actions-gap: var(--spacing-2);
  --toast-icon-size: 28px;
  --toast-icon-bg: var(--surface-placeholder);
  --toast-icon-color: var(--icon-primary);
  --toast-indicator-size: 8px;
  --toast-indicator-bg: var(--interactive-brand);
  --toast-title-font-family: var(--type-heading-01-font-family);
  --toast-title-font-size: var(--type-heading-01-font-size);
  --toast-title-line-height: var(--type-heading-01-line-height);
  --toast-title-font-weight: var(--type-heading-01-font-weight);
  --toast-desc-font-family: var(--type-body-compact-01-font-family);
  --toast-desc-font-size: var(--type-body-compact-01-font-size);
  --toast-desc-line-height: var(--type-body-compact-01-line-height);
  --toast-desc-font-weight: var(--type-body-compact-01-font-weight);
  --toast-transition-duration: var(--duration-toast);
  --toast-transition-easing: var(--easing-hover);
  --toast-shadow-focus: var(--shadow-focus-ring);
  --toast-scale: calc(1 - var(--toast-toasts-before, 0) * 0.05);
  --toast-y: translateY(100%);

  position: absolute;
  left: var(--spacing-0);
  right: var(--spacing-0);
  display: flex;
  align-items: flex-start;
  gap: var(--toast-gap);
  width: 100%;
  padding: var(--toast-padding-y) var(--toast-padding-x);
  box-sizing: border-box;
  background-color: var(--toast-bg);
  color: var(--toast-color);
  border: var(--toast-border-width) solid var(--toast-border-color);
  border-radius: var(--toast-radius);
  box-shadow: var(--toast-shadow);
  z-index: var(--toast-z-index, 1);
  transform: var(--toast-y);
  opacity: var(--opacity-hidden);
  touch-action: none;
  user-select: none;
  transition:
    transform var(--toast-transition-duration) var(--toast-transition-easing),
    opacity var(--toast-transition-duration) var(--toast-transition-easing),
    height var(--toast-transition-duration) var(--toast-transition-easing);
}

.toast[data-y-position='bottom'] {
  bottom: var(--spacing-0);
  transform-origin: bottom center;
  --toast-y: translateY(100%);
}

.toast[data-y-position='top'] {
  top: var(--spacing-0);
  transform-origin: top center;
  --toast-y: translateY(-100%);
}

.toast[data-mounted='true'] {
  opacity: var(--opacity-visible);
  --toast-y: translateY(0) scale(1);
}

.toast[data-mounted='true'][data-expanded='false'][data-front='false'] {
  height: var(--toast-front-height);
  overflow: hidden;
  --toast-y: translateY(var(--toast-lift-amount)) scale(var(--toast-scale));
}

.toast[data-mounted='true'][data-expanded='false'][data-front='false'] .toast__content {
  opacity: var(--opacity-hidden);
  transition: opacity var(--duration-normal) var(--toast-transition-easing);
}

.toast[data-mounted='true'][data-expanded='true'] {
  height: var(--toast-initial-height);
  --toast-y: translateY(calc(var(--toast-lift) * var(--toast-offset))) scale(1);
}

.toast[data-mounted='true'][data-expanded='true']::after {
  content: '';
  position: absolute;
  left: var(--spacing-0);
  right: var(--spacing-0);
  height: calc(var(--toast-gap) + var(--spacing-2));
}

.toast[data-y-position='bottom'][data-expanded='true']::after {
  top: 100%;
}

.toast[data-y-position='top'][data-expanded='true']::after {
  bottom: 100%;
}

.toast[data-visible='false'] {
  opacity: var(--opacity-hidden);
  pointer-events: none;
}

.toast[data-removed='true'] {
  pointer-events: none;
  opacity: var(--opacity-hidden);
}

.toast[data-removed='true'][data-swipe-out='false'][data-y-position='bottom'] {
  --toast-y: translateY(100%);
}

.toast[data-removed='true'][data-swipe-out='false'][data-y-position='top'] {
  --toast-y: translateY(-100%);
}

.toast[data-removed='true'][data-front='false'][data-swipe-out='false'][data-expanded='true'] {
  --toast-y: translateY(calc(var(--toast-lift) * var(--toast-offset) + var(--toast-lift) * -50%));
}

.toast:focus-visible {
  outline: none;
  box-shadow: var(--toast-shadow-focus);
}

.toast--success {
  --toast-bg: var(--surface-brand-subtle);
  --toast-border-color: var(--border-brand-subtle);
  --toast-icon-bg: var(--surface-brand-selection);
  --toast-indicator-bg: var(--interactive-brand);
}

.toast--info {
  --toast-bg: var(--surface-elevated);
  --toast-border-color: var(--border-subtle-2);
  --toast-icon-bg: var(--surface-subtle);
  --toast-indicator-bg: var(--icon-primary);
}

.toast--warning {
  --toast-bg: var(--surface-subtle-hover);
  --toast-border-color: var(--border-strong);
  --toast-icon-bg: var(--surface-placeholder);
  --toast-indicator-bg: var(--icon-primary);
}

.toast--error {
  --toast-bg: var(--surface-danger-subtle);
  --toast-border-color: var(--border-danger-subtle);
  --toast-icon-bg: var(--border-danger-subtle);
  --toast-icon-color: var(--icon-danger);
}

.toast--loading {
  --toast-bg: var(--surface-brand-subtle);
  --toast-border-color: var(--border-brand-subtle);
  --toast-icon-bg: var(--surface-brand-selection);
  --toast-icon-color: var(--icon-brand);
}

.toast--unstyled {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: var(--spacing-0);
}

.toast__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--toast-icon-size);
  height: var(--toast-icon-size);
  background-color: var(--toast-icon-bg);
  color: var(--toast-icon-color);
}

.toast__icon--loading {
  animation: toast-spin 1s linear infinite;
}

.toast__indicator {
  display: inline-block;
  width: var(--toast-indicator-size);
  height: var(--toast-indicator-size);
  border-radius: var(--radius-none);
  background-color: var(--toast-indicator-bg);
}

.toast__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--toast-content-gap);
  min-width: var(--spacing-0);
}

.toast__title {
  margin: var(--spacing-0);
  color: var(--toast-color);
  font-family: var(--toast-title-font-family);
  font-size: var(--toast-title-font-size);
  line-height: var(--toast-title-line-height);
  font-weight: var(--toast-title-font-weight);
}

.toast__description {
  margin: var(--spacing-0);
  color: var(--toast-description-color);
  font-family: var(--toast-desc-font-family);
  font-size: var(--toast-desc-font-size);
  line-height: var(--toast-desc-line-height);
  font-weight: var(--toast-desc-font-weight);
}

.toast__actions {
  display: flex;
  align-items: center;
  gap: var(--toast-actions-gap);
  margin-top: var(--spacing-2);
}

.toast__close {
  flex-shrink: 0;
}

@keyframes toast-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    --toast-transition-duration: var(--duration-normal);
    --toast-y: translateY(0);
  }

  .toast[data-y-position='bottom'],
  .toast[data-y-position='top'],
  .toast[data-removed='true'][data-swipe-out='false'][data-y-position='bottom'],
  .toast[data-removed='true'][data-swipe-out='false'][data-y-position='top'] {
    --toast-y: translateY(0);
  }

  .toast__icon--loading {
    animation: none;
  }
}
</style>
