<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useIsMobile } from '../composables/useIsMobile'
import { Icon, type IconName } from '../icons'
import { useEscapeKey } from './useEscapeKey'
import { hasOverlayPortalRoot } from './useOverlayBackdropBlur'

export type DropdownAlign = 'left' | 'right'
export type DropdownPlacement = 'bottom' | 'right-start'

export interface DropdownItem {
  id: string
  label: string
  icon?: IconName
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface Props {
  items: DropdownItem[]
  align?: DropdownAlign
  placement?: DropdownPlacement
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  align: 'right',
  placement: 'bottom',
  ariaLabel: 'Menu de ações',
})

const emit = defineEmits<{
  select: [itemId: string]
}>()

const uid = useId()
const menuId = `dropdown-menu-${uid}`
const isMobile = useIsMobile()

const isOpen = ref(false)
const triggerRef = ref<HTMLDivElement | null>(null)
const menuRef = ref<HTMLDivElement | null>(null)
const menuCoords = ref<{ top: number; left: number; minWidth: number; transformOrigin: string }>({
  top: 0,
  left: 0,
  minWidth: 168,
  transformOrigin: 'top right',
})

const canTeleportOverlay = hasOverlayPortalRoot()

const menuStyle = computed(() => ({
  top: `${menuCoords.value.top}px`,
  left: `${menuCoords.value.left}px`,
  minWidth: `${menuCoords.value.minWidth}px`,
  transformOrigin: menuCoords.value.transformOrigin,
}))

function updatePosition() {
  if (typeof window === 'undefined' || !triggerRef.value) {
    return
  }

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const menuRect = menuRef.value?.getBoundingClientRect()
  const menuWidth = Math.max(168, menuRect?.width ?? 176)
  const menuHeight = menuRect?.height ?? props.items.length * 38 + 8
  const viewportPadding = 8
  const gap = 8

  if (
    props.placement === 'right-start' &&
    !isMobile.value &&
    triggerRect.right + gap + menuWidth <= window.innerWidth - viewportPadding
  ) {
    const left = triggerRect.right + gap
    const top = Math.max(
      viewportPadding,
      Math.min(triggerRect.top, window.innerHeight - menuHeight - viewportPadding),
    )
    menuCoords.value = {
      top,
      left,
      minWidth: 168,
      transformOrigin: 'top left',
    }
    return
  }

  const bottomGap = 4
  let top = triggerRect.bottom + bottomGap
  if (
    top + menuHeight > window.innerHeight - viewportPadding &&
    triggerRect.top > menuHeight + bottomGap
  ) {
    top = Math.max(viewportPadding, triggerRect.top - menuHeight - bottomGap)
  }

  let left = props.align === 'right' ? triggerRect.right - menuWidth : triggerRect.left
  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - menuWidth - viewportPadding))

  menuCoords.value = {
    top,
    left,
    minWidth: Math.max(168, triggerRect.width),
    transformOrigin: props.align === 'right' ? 'top right' : 'top left',
  }
}

function close() {
  isOpen.value = false
}

async function openMenu() {
  isOpen.value = true
  await nextTick()
  updatePosition()
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    void openMenu()
  }
}

function handleSelect(item: DropdownItem) {
  if (item.disabled) {
    return
  }
  close()
  emit('select', item.id)
}

function handleDocumentPointerDown(event: PointerEvent) {
  if (!isOpen.value) {
    return
  }
  const target = event.target as Node | null
  if (!target) {
    return
  }
  if (triggerRef.value?.contains(target) || menuRef.value?.contains(target)) {
    return
  }
  close()
}

function handleWindowResizeOrScroll() {
  if (!isOpen.value) {
    return
  }
  updatePosition()
}

watch(isOpen, (open) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }
  if (open) {
    document.addEventListener('pointerdown', handleDocumentPointerDown, true)
    window.addEventListener('resize', handleWindowResizeOrScroll)
    window.addEventListener('scroll', handleWindowResizeOrScroll, true)
  } else {
    document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
    window.removeEventListener('resize', handleWindowResizeOrScroll)
    window.removeEventListener('scroll', handleWindowResizeOrScroll, true)
  }
})

useEscapeKey(
  () => isOpen.value,
  () => close(),
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleWindowResizeOrScroll)
    window.removeEventListener('scroll', handleWindowResizeOrScroll, true)
  }
})
</script>

<template>
  <div ref="triggerRef" class="dropdown">
    <slot name="trigger" :open="isOpen" :toggle="toggle" :close="close" :menu-id="menuId" />

    <Teleport to="#prismon-overlay-root" :disabled="!canTeleportOverlay">
      <Transition name="dropdown-menu">
        <div
          v-if="isOpen"
          :id="menuId"
          ref="menuRef"
          class="dropdown__menu"
          :style="menuStyle"
          role="menu"
          :aria-label="ariaLabel"
          @click.stop
        >
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            role="menuitem"
            :disabled="item.disabled"
            :class="[
              'dropdown__item',
              item.variant === 'danger' ? 'dropdown__item--danger' : undefined,
            ]"
            @click="handleSelect(item)"
          >
            <Icon v-if="item.icon" :name="item.icon" size="sm" />
            <span class="dropdown__label">{{ item.label }}</span>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dropdown {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.dropdown__menu {
  --dropdown-z-index: calc(var(--z-modal) + 10);
  --dropdown-bg: var(--surface-elevated);
  --dropdown-border-color: var(--border-subtle-1);
  --dropdown-border-width: var(--border-width-thin);
  --dropdown-padding: var(--spacing-1);
  --dropdown-item-bg: var(--surface-elevated);
  --dropdown-item-bg-hover: var(--surface-subtle-hover);
  --dropdown-item-color: var(--text-primary);
  --dropdown-item-danger-color: var(--text-danger);
  --dropdown-item-danger-hover-bg: var(--surface-danger-subtle);
  --dropdown-item-disabled-color: var(--text-disabled);
  --dropdown-item-gap: var(--spacing-3);
  --dropdown-item-padding-y: var(--spacing-3);
  --dropdown-item-padding-x: var(--spacing-4);
  --dropdown-item-font-family: var(--type-body-compact-01-font-family);
  --dropdown-item-font-size: var(--type-body-compact-01-font-size);
  --dropdown-item-line-height: var(--type-body-compact-01-line-height);
  --dropdown-item-font-weight: var(--type-body-compact-01-font-weight);
  --dropdown-shadow-focus: var(--shadow-focus-ring);
  --dropdown-transition-duration: var(--duration-fast);
  --dropdown-transition-easing: var(--easing-out);
  --dropdown-scale-closed: var(--scale-popover-closed);
  --dropdown-press-scale: var(--scale-press-subtle);

  position: fixed;
  z-index: var(--dropdown-z-index);
  display: flex;
  flex-direction: column;
  padding: var(--dropdown-padding);
  box-sizing: border-box;
  background-color: var(--dropdown-bg);
  border: var(--dropdown-border-width) solid var(--dropdown-border-color);
  transform-origin: top right;
}

.dropdown__item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--dropdown-item-padding-y) var(--dropdown-item-padding-x);
  gap: var(--dropdown-item-gap);
  border: var(--border-width-none) solid var(--border-transparent);
  background-color: var(--dropdown-item-bg);
  color: var(--dropdown-item-color);
  font-family: var(--dropdown-item-font-family);
  font-size: var(--dropdown-item-font-size);
  line-height: var(--dropdown-item-line-height);
  font-weight: var(--dropdown-item-font-weight);
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  transition: transform var(--dropdown-transition-duration) var(--dropdown-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .dropdown__item:not(:disabled):hover {
    background-color: var(--dropdown-item-bg-hover);
  }

  .dropdown__item--danger:not(:disabled):hover {
    background-color: var(--dropdown-item-danger-hover-bg);
  }
}

.dropdown__item:not(:disabled):active {
  transform: scale(var(--dropdown-press-scale));
}

.dropdown__item:focus-visible {
  outline: none;
  box-shadow: var(--dropdown-shadow-focus);
}

.dropdown__item--danger {
  color: var(--dropdown-item-danger-color);
}

.dropdown__item:disabled {
  color: var(--dropdown-item-disabled-color);
  cursor: not-allowed;
}

.dropdown__label {
  flex: 1;
}

.dropdown-menu-enter-active,
.dropdown-menu-leave-active {
  transition:
    opacity var(--dropdown-transition-duration) var(--dropdown-transition-easing),
    transform var(--dropdown-transition-duration) var(--dropdown-transition-easing);
}

.dropdown-menu-enter-from,
.dropdown-menu-leave-to {
  opacity: var(--opacity-hidden);
  transform: scale(var(--dropdown-scale-closed));
}

@media (prefers-reduced-motion: reduce) {
  .dropdown__menu {
    --dropdown-scale-closed: 1;
    --dropdown-press-scale: 1;
  }

  .dropdown__item,
  .dropdown-menu-enter-active,
  .dropdown-menu-leave-active {
    transition: none;
  }
}
</style>
