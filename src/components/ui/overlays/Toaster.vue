<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ToastItem from './ToastItem.vue'
import { hasOverlayPortalRoot } from './useOverlayBackdropBlur'
import {
  autoCloseToast,
  removeToastFromDom,
  toast,
  useToasts,
  type SwipeDirection,
  type ToastOptions,
  type ToastPosition,
  type ToastRecord,
  type ToasterIcons,
} from './toastState'

export type ToasterOffset =
  string | number | Partial<Record<'top' | 'right' | 'bottom' | 'left', string | number>>

interface Props {
  id?: string
  position?: ToastPosition
  visibleToasts?: number
  closeButton?: boolean
  duration?: number
  gap?: number
  offset?: ToasterOffset
  mobileOffset?: ToasterOffset
  swipeDirections?: SwipeDirection[]
  icons?: ToasterIcons
  hotkey?: string[]
  dir?: 'ltr' | 'rtl' | 'auto'
  containerAriaLabel?: string
  toastOptions?: Partial<ToastOptions>
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  visibleToasts: 3,
  closeButton: false,
  duration: 4000,
  gap: 14,
  offset: '24px',
  mobileOffset: '16px',
  hotkey: () => ['altKey', 'KeyT'],
  dir: 'auto',
  containerAriaLabel: 'Notificações',
})

const { toasts } = useToasts()

const expandedByHover = ref(false)
const interacting = ref(false)
const toastHeights = ref<Record<string, number>>({})
const lastKnownLayout = new Map<string, { visibleIndex: number; offsetBefore: number }>()
const listElements = ref<HTMLOListElement[]>([])

const filteredToasts = computed(() =>
  toasts.value
    .filter((item) => (props.id ? item.toasterId === props.id : !item.toasterId))
    .map((item) => ({
      ...props.toastOptions,
      ...item,
    })),
)

const activePositions = computed<ToastPosition[]>(() => {
  const seen = new Set<ToastPosition>()
  for (const item of filteredToasts.value) {
    seen.add(item.position ?? props.position)
  }
  return Array.from(seen)
})

const isExpanded = computed(() => expandedByHover.value)

const activeVisibleCount = computed(
  () => filteredToasts.value.filter((item) => !item.dismissed).length,
)

function toCssDimension(value: string | number | undefined, fallback: string): string {
  if (value === undefined) return fallback
  return typeof value === 'number' ? `${value}px` : value
}

function resolveOffsetVars(offsetValue: ToasterOffset, prefix: string): Record<string, string> {
  if (typeof offsetValue === 'string' || typeof offsetValue === 'number') {
    const dim = toCssDimension(offsetValue, '24px')
    return {
      [`--${prefix}-top`]: dim,
      [`--${prefix}-right`]: dim,
      [`--${prefix}-bottom`]: dim,
      [`--${prefix}-left`]: dim,
    }
  }
  return {
    [`--${prefix}-top`]: toCssDimension(offsetValue.top, '24px'),
    [`--${prefix}-right`]: toCssDimension(offsetValue.right, '24px'),
    [`--${prefix}-bottom`]: toCssDimension(offsetValue.bottom, '24px'),
    [`--${prefix}-left`]: toCssDimension(offsetValue.left, '24px'),
  }
}

const listStyleVars = computed(() => ({
  '--toaster-gap': `${props.gap}px`,
  '--toaster-width': '356px',
  ...resolveOffsetVars(props.offset, 'toaster-offset'),
  ...resolveOffsetVars(props.mobileOffset, 'toaster-mobile-offset'),
}))

function getToastsForPosition(pos: ToastPosition): ToastRecord[] {
  return filteredToasts.value.filter((item) => (item.position ?? props.position) === pos)
}

function getVisibleIndex(pos: ToastPosition, toastId: string | number): number {
  const activeInPos = getToastsForPosition(pos).filter((item) => !item.dismissed)
  const idx = activeInPos.findIndex((item) => item.id === toastId)
  if (idx !== -1) {
    const prev = lastKnownLayout.get(String(toastId))
    lastKnownLayout.set(String(toastId), {
      visibleIndex: idx,
      offsetBefore: prev?.offsetBefore ?? 0,
    })
    return idx
  }
  return lastKnownLayout.get(String(toastId))?.visibleIndex ?? 0
}

function getFrontToastHeight(pos: ToastPosition): number {
  const firstActive = getToastsForPosition(pos).find((item) => !item.dismissed)
  if (!firstActive) {
    return 0
  }
  return toastHeights.value[String(firstActive.id)] ?? 0
}

function getOffsetBefore(pos: ToastPosition, toastId: string | number): number {
  const activeInPos = getToastsForPosition(pos).filter((item) => !item.dismissed)
  let offset = 0
  let found = false
  for (let i = 0; i < activeInPos.length; i += 1) {
    const item = activeInPos[i]!
    if (item.id === toastId) {
      lastKnownLayout.set(String(toastId), {
        visibleIndex: i,
        offsetBefore: offset,
      })
      found = true
      break
    }
    const h = toastHeights.value[String(item.id)] ?? 0
    if (h > 0) {
      offset += h + props.gap
    }
  }
  if (found) {
    return offset
  }
  return lastKnownLayout.get(String(toastId))?.offsetBefore ?? 0
}

function getDefaultSwipeDirections(pos: ToastPosition): SwipeDirection[] {
  const [yDir, xDir] = pos.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right']
  const directions: SwipeDirection[] = [yDir]
  if (xDir === 'left' || xDir === 'right') {
    directions.push(xDir)
  }
  return directions
}

function getSwipeDirections(pos: ToastPosition): SwipeDirection[] {
  return props.swipeDirections ?? getDefaultSwipeDirections(pos)
}

function handleHeightChange(id: string | number, height: number) {
  toastHeights.value = {
    ...toastHeights.value,
    [String(id)]: height,
  }
}

function handleRemoveFromDom(id: string | number) {
  const next = { ...toastHeights.value }
  delete next[String(id)]
  toastHeights.value = next
  lastKnownLayout.delete(String(id))
  removeToastFromDom(id)
}

function setListRef(el: Element | null, posIndex: number) {
  if (el instanceof HTMLOListElement) {
    listElements.value[posIndex] = el
  }
}

function handleMouseEnter() {
  expandedByHover.value = true
}

function handleMouseMove() {
  if (!expandedByHover.value) {
    expandedByHover.value = true
  }
}

function handleMouseLeave() {
  if (!interacting.value) {
    expandedByHover.value = false
  }
}

function handlePointerDown() {
  interacting.value = true
}

function handlePointerUp() {
  interacting.value = false
}

function handleFocusOut(event: FocusEvent) {
  const target = event.currentTarget as HTMLElement | null
  if (target && !target.contains(event.relatedTarget as Node | null)) {
    expandedByHover.value = false
  }
}

function handleHotkeyKeydown(event: KeyboardEvent) {
  if (props.hotkey.length === 0 || filteredToasts.value.length === 0) {
    return
  }

  const pressed = props.hotkey.every((key) => {
    if (key === 'altKey' || key === 'Alt') return event.altKey
    if (key === 'ctrlKey' || key === 'Control') return event.ctrlKey
    if (key === 'metaKey' || key === 'Meta') return event.metaKey
    if (key === 'shiftKey' || key === 'Shift') return event.shiftKey
    return event.code === key || event.key.toLowerCase() === key.toLowerCase()
  })

  if (pressed) {
    event.preventDefault()
    expandedByHover.value = true
    listElements.value[0]?.focus()
  }
}

watch(activeVisibleCount, (count) => {
  if (count <= 1) {
    expandedByHover.value = false
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleHotkeyKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleHotkeyKeydown)
})
const canTeleportToaster = hasOverlayPortalRoot()
</script>

<template>
  <Teleport to="#prismon-overlay-root" :disabled="!canTeleportToaster">
    <section
      class="toaster"
      :aria-label="containerAriaLabel"
      :dir="dir"
      tabindex="-1"
      aria-live="polite"
    >
      <ol
        v-for="(pos, posIndex) in activePositions"
        :key="pos"
        :ref="(el) => setListRef(el as Element | null, posIndex)"
        :class="['toaster__list', `toaster__list--${pos}`]"
        :style="listStyleVars"
        tabindex="-1"
        :data-y-position="pos.startsWith('top') ? 'top' : 'bottom'"
        :data-x-position="
          pos.endsWith('left') ? 'left' : pos.endsWith('center') ? 'center' : 'right'
        "
        @mouseenter="handleMouseEnter"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        @focusin="handleMouseEnter"
        @focusout="handleFocusOut"
        @pointerdown="handlePointerDown"
        @pointerup="handlePointerUp"
      >
        <ToastItem
          v-for="(item, index) in getToastsForPosition(pos)"
          :key="item.id"
          :toast="item"
          :index="index"
          :visibleIndex="getVisibleIndex(pos, item.id)"
          :totalVisible="getToastsForPosition(pos).length"
          :expanded="isExpanded"
          :position="pos"
          :visibleToasts="visibleToasts"
          :frontToastHeight="getFrontToastHeight(pos)"
          :offsetBefore="getOffsetBefore(pos, item.id)"
          :gap="gap"
          :swipeDirections="getSwipeDirections(pos)"
          :interacting="interacting"
          :defaultDuration="duration"
          :closeButton="closeButton"
          :icons="icons"
          @dismiss="toast.dismiss"
          @auto-close="autoCloseToast"
          @remove-from-dom="handleRemoveFromDom"
          @height-change="handleHeightChange"
          @interacting-change="interacting = $event"
        />
      </ol>
    </section>
  </Teleport>
</template>

<style scoped>
.toaster {
  --toaster-z-index: var(--z-toast);

  position: fixed;
  inset: var(--spacing-0);
  pointer-events: none;
  z-index: var(--toaster-z-index);
}

.toaster__list {
  position: fixed;
  width: var(--toaster-width);
  max-width: calc(100vw - var(--spacing-6));
  margin: var(--spacing-0);
  padding: var(--spacing-0);
  list-style: none;
  outline: none;
  pointer-events: none;
  z-index: var(--toaster-z-index);
}

.toaster__list :deep(.toast) {
  pointer-events: auto;
}

.toaster__list--bottom-right {
  bottom: var(--toaster-offset-bottom);
  right: var(--toaster-offset-right);
}

.toaster__list--bottom-left {
  bottom: var(--toaster-offset-bottom);
  left: var(--toaster-offset-left);
}

.toaster__list--bottom-center {
  bottom: var(--toaster-offset-bottom);
  left: 50%;
  transform: translateX(-50%);
}

.toaster__list--top-right {
  top: var(--toaster-offset-top);
  right: var(--toaster-offset-right);
}

.toaster__list--top-left {
  top: var(--toaster-offset-top);
  left: var(--toaster-offset-left);
}

.toaster__list--top-center {
  top: var(--toaster-offset-top);
  left: 50%;
  transform: translateX(-50%);
}

@media (max-width: 600px) {
  .toaster__list,
  .toaster__list--bottom-right,
  .toaster__list--bottom-left,
  .toaster__list--bottom-center,
  .toaster__list--top-right,
  .toaster__list--top-left,
  .toaster__list--top-center {
    left: var(--toaster-mobile-offset-left);
    right: var(--toaster-mobile-offset-right);
    width: calc(100% - var(--toaster-mobile-offset-left) - var(--toaster-mobile-offset-right));
    max-width: none;
    transform: none;
  }

  .toaster__list[data-y-position='bottom'] {
    bottom: var(--toaster-mobile-offset-bottom);
    top: auto;
  }

  .toaster__list[data-y-position='top'] {
    top: var(--toaster-mobile-offset-top);
    bottom: auto;
  }
}
</style>
