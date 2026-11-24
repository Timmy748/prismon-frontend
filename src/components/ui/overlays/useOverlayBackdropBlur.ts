import { onBeforeUnmount, watch, type WatchSource } from 'vue'

const activeOverlayIds = new Set<symbol>()

function syncBodyOverlayAttribute() {
  if (typeof document === 'undefined' || !document.body) {
    return
  }

  if (activeOverlayIds.size > 0) {
    document.body.setAttribute('data-overlay-open', 'true')
  } else {
    document.body.removeAttribute('data-overlay-open')
  }
}

export function hasOverlayPortalRoot(): boolean {
  if (typeof document === 'undefined') {
    return false
  }
  return Boolean(document.getElementById('prismon-overlay-root'))
}

export function useOverlayBackdropBlur(isOpen: WatchSource<boolean>) {
  const token = Symbol('overlay')

  watch(
    isOpen,
    (open) => {
      if (open) {
        activeOverlayIds.add(token)
      } else {
        activeOverlayIds.delete(token)
      }
      syncBodyOverlayAttribute()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    activeOverlayIds.delete(token)
    syncBodyOverlayAttribute()
  })
}
