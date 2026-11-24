<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  watch,
  type CSSProperties,
} from 'vue'
import { Icon, type IconName } from '../icons'

interface Props {
  label: string
  icon?: IconName
  href?: string
  collapsed?: boolean
  active?: boolean
  hasTrailingAction?: boolean
  trailingLabel?: string
  marqueeOnHover?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  href: undefined,
  collapsed: false,
  active: false,
  hasTrailingAction: false,
  trailingLabel: 'Mais ações',
  marqueeOnHover: false,
})

const emit = defineEmits<{
  'trailing-click': [event: MouseEvent]
}>()

const HOVER_REVEAL_DELAY_MS = 300
const RETURN_DURATION_MS = 180

const labelWrapRef = ref<HTMLSpanElement | null>(null)
const labelTextRef = ref<HTMLSpanElement | null>(null)
const overflowDistance = ref(0)
const isMarqueeActive = ref(false)

let hoverTimer: number | null = null
let resizeObserver: ResizeObserver | null = null

const listItemClasses = computed(() => [
  'list-item',
  props.icon ? 'list-item--with-icon' : undefined,
  props.collapsed ? 'list-item--closed' : undefined,
  props.active ? 'list-item--active' : undefined,
])

const labelClasses = computed(() => {
  if (!props.marqueeOnHover) {
    return ['list-item__label']
  }
  const hasOverflow = overflowDistance.value > 1
  return [
    'list-item__label',
    'list-item__label--marquee',
    hasOverflow && !isMarqueeActive.value ? 'list-item__label--mask-end' : undefined,
    hasOverflow && isMarqueeActive.value ? 'list-item__label--mask-start' : undefined,
  ]
})

const marqueeTextStyle = computed<CSSProperties | undefined>(() => {
  if (!props.marqueeOnHover) {
    return undefined
  }
  if (!isMarqueeActive.value || overflowDistance.value <= 1) {
    return {
      transform: 'translate3d(0, 0, 0)',
      transitionDuration: `${RETURN_DURATION_MS}ms`,
    }
  }
  const shiftPx = overflowDistance.value + 4
  const durationMs = Math.max(900, Math.min(3500, Math.round(shiftPx * 22)))
  return {
    transform: `translate3d(-${shiftPx}px, 0, 0)`,
    transitionDuration: `${durationMs}ms`,
    transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  }
})

function measureLabelOverflow() {
  if (!props.marqueeOnHover || props.collapsed) {
    overflowDistance.value = 0
    return
  }
  const wrapEl = labelWrapRef.value
  const textEl = labelTextRef.value
  if (!wrapEl || !textEl) {
    overflowDistance.value = 0
    return
  }
  overflowDistance.value = Math.max(0, Math.ceil(textEl.scrollWidth - wrapEl.clientWidth))
}

function clearHoverTimer() {
  if (hoverTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(hoverTimer)
    hoverTimer = null
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function handlePointerEnter(event: PointerEvent) {
  if (
    !props.marqueeOnHover ||
    props.collapsed ||
    event.pointerType === 'touch' ||
    prefersReducedMotion()
  ) {
    return
  }
  clearHoverTimer()
  measureLabelOverflow()
  if (overflowDistance.value <= 1 || typeof window === 'undefined') {
    return
  }
  hoverTimer = window.setTimeout(() => {
    hoverTimer = null
    measureLabelOverflow()
    if (overflowDistance.value > 1) {
      isMarqueeActive.value = true
    }
  }, HOVER_REVEAL_DELAY_MS)
}

function handlePointerLeave() {
  clearHoverTimer()
  isMarqueeActive.value = false
}

watch(
  () => [props.label, props.marqueeOnHover, props.collapsed],
  () => {
    clearHoverTimer()
    isMarqueeActive.value = false
    void nextTick(measureLabelOverflow)
  },
)

onMounted(() => {
  measureLabelOverflow()
  if (typeof ResizeObserver !== 'undefined' && labelWrapRef.value) {
    resizeObserver = new ResizeObserver(measureLabelOverflow)
    resizeObserver.observe(labelWrapRef.value)
  }
})

onUpdated(() => {
  measureLabelOverflow()
})

onBeforeUnmount(() => {
  clearHoverTimer()
  resizeObserver?.disconnect()
})

function handleTrailingClick(event: MouseEvent) {
  emit('trailing-click', event)
}

function handleTriggerClick(event: MouseEvent) {
  if (!props.href) {
    return
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    event.stopPropagation()
    return
  }
  event.preventDefault()
}
</script>

<template>
  <div
    :class="listItemClasses"
    @pointerenter="handlePointerEnter"
    @pointerleave="handlePointerLeave"
  >
    <component
      :is="href ? 'a' : 'button'"
      :href="href || undefined"
      :type="href ? undefined : 'button'"
      class="list-item__trigger"
      :aria-label="collapsed ? label : undefined"
      :aria-current="active ? 'page' : undefined"
      @click="handleTriggerClick"
    >
      <span v-if="icon" class="list-item__icon">
        <Icon :name="icon" size="md" />
      </span>
      <span v-if="!collapsed" ref="labelWrapRef" :class="labelClasses">
        <span
          v-if="marqueeOnHover"
          ref="labelTextRef"
          class="list-item__label-marquee-text"
          :style="marqueeTextStyle"
        >
          <slot>{{ label }}</slot>
        </span>
        <slot v-else>{{ label }}</slot>
      </span>
    </component>
    <span
      v-if="!collapsed && $slots.trailing"
      class="list-item__trailing"
      @click.stop="handleTrailingClick"
    >
      <slot name="trailing" />
    </span>
    <button
      v-else-if="!collapsed && hasTrailingAction"
      type="button"
      class="list-item__trailing"
      :aria-label="trailingLabel"
      @click.stop="handleTrailingClick"
    >
      <Icon name="arrow-right" size="sm" />
    </button>
  </div>
</template>

<style scoped>
.list-item {
  --list-item-bg: var(--surface-elevated);
  --list-item-bg-hover: var(--surface-subtle-hover);
  --list-item-control-bg: var(--surface-transparent);
  --list-item-border-width: var(--border-width-none);
  --list-item-border-color: var(--border-transparent);
  --list-item-color: var(--text-secondary);
  --list-item-height: 34px;
  --list-item-width: 100%;
  --list-item-padding: var(--spacing-3);
  --list-item-gap: var(--spacing-4);
  --list-item-justify: flex-start;
  --list-item-radius: var(--radius-none);
  --list-item-font-family: var(--type-body-compact-01-font-family);
  --list-item-font-size: var(--type-body-compact-01-font-size);
  --list-item-line-height: var(--type-body-compact-01-line-height);
  --list-item-font-weight: var(--type-body-compact-01-font-weight);
  --list-item-text-transform: var(--type-body-compact-01-text-transform);
  --list-item-shadow-focus: var(--shadow-focus-ring);
  --list-item-transition-duration: var(--duration-fast);
  --list-item-transition-easing: var(--easing-out);
  --list-item-hover-transition-easing: var(--easing-hover);
  --list-item-press-scale: var(--scale-press);

  display: flex;
  align-items: center;
  justify-content: var(--list-item-justify);
  width: var(--list-item-width);
  height: var(--list-item-height);
  padding: var(--list-item-padding);
  gap: var(--list-item-gap);
  box-sizing: border-box;
  background-color: var(--list-item-bg);
  color: var(--list-item-color);
  border-radius: var(--list-item-radius);
}

@media (hover: hover) and (pointer: fine) {
  .list-item:hover {
    background-color: var(--list-item-bg-hover);
  }
}

.list-item__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: var(--list-item-justify);
  flex: 1;
  min-width: var(--spacing-0);
  overflow: hidden;
  gap: var(--list-item-gap);
  padding: var(--spacing-0);
  border: var(--list-item-border-width) solid var(--list-item-border-color);
  background-color: var(--list-item-control-bg);
  color: inherit;
  font-family: var(--list-item-font-family);
  font-size: var(--list-item-font-size);
  line-height: var(--list-item-line-height);
  font-weight: var(--list-item-font-weight);
  text-transform: var(--list-item-text-transform);
  text-decoration: none;
  text-align: left;
  cursor: pointer;
}

.list-item__trigger:focus-visible,
.list-item__trailing:focus-visible {
  outline: none;
  box-shadow: var(--list-item-shadow-focus);
}

.list-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.list-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-item__label--marquee {
  display: block;
  width: 100%;
  text-overflow: clip;
  --list-item-marquee-mask-opaque: var(--text-primary);
  --list-item-marquee-mask-transparent: var(--surface-transparent);
  --list-item-marquee-mask-size: var(--spacing-5);
}

.list-item__label--mask-end {
  -webkit-mask-image: linear-gradient(
    to right,
    var(--list-item-marquee-mask-opaque) var(--spacing-0),
    var(--list-item-marquee-mask-opaque) calc(100% - var(--list-item-marquee-mask-size)),
    var(--list-item-marquee-mask-transparent) 100%
  );
  mask-image: linear-gradient(
    to right,
    var(--list-item-marquee-mask-opaque) var(--spacing-0),
    var(--list-item-marquee-mask-opaque) calc(100% - var(--list-item-marquee-mask-size)),
    var(--list-item-marquee-mask-transparent) 100%
  );
}

.list-item__label--mask-start {
  -webkit-mask-image: linear-gradient(
    to right,
    var(--list-item-marquee-mask-transparent) var(--spacing-0),
    var(--list-item-marquee-mask-opaque) var(--list-item-marquee-mask-size),
    var(--list-item-marquee-mask-opaque) 100%
  );
  mask-image: linear-gradient(
    to right,
    var(--list-item-marquee-mask-transparent) var(--spacing-0),
    var(--list-item-marquee-mask-opaque) var(--list-item-marquee-mask-size),
    var(--list-item-marquee-mask-opaque) 100%
  );
}

.list-item__label-marquee-text {
  display: inline-block;
  white-space: nowrap;
  will-change: transform;
  transition-property: transform;
  transition-timing-function: var(--easing-out);
}

@media (prefers-reduced-motion: reduce) {
  .list-item__label-marquee-text {
    transition: none;
  }
}

.list-item__trailing {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: var(--spacing-0);
  border: var(--list-item-border-width) solid var(--list-item-border-color);
  background-color: var(--list-item-control-bg);
  color: inherit;
  cursor: pointer;
  transition: transform var(--list-item-transition-duration) var(--list-item-transition-easing);
}

.list-item__trailing:active {
  transform: scale(var(--list-item-press-scale));
}

@media (prefers-reduced-motion: reduce) {
  .list-item {
    --list-item-press-scale: 1;
  }
}

.list-item--with-icon {
  --list-item-gap: var(--spacing-2);
}

.list-item--closed {
  --list-item-width: 34px;
  --list-item-gap: var(--spacing-0);
  --list-item-justify: center;
}

.list-item--active {
  --list-item-bg: var(--surface-brand-selection);
  --list-item-bg-hover: var(--surface-brand-selection);
}
</style>
