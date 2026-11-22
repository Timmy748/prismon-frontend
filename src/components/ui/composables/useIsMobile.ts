import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)'

function readInitialIsMobile(query = MOBILE_BREAKPOINT_QUERY): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  if (typeof window.matchMedia === 'function') {
    const mql = window.matchMedia(query)
    if (typeof mql.matches === 'boolean') {
      return mql.matches
    }
  }
  return (window.innerWidth || 1024) <= 767
}

export function useIsMobile(query = MOBILE_BREAKPOINT_QUERY): Ref<boolean> {
  const isMobile = ref(readInitialIsMobile(query))

  let mediaQuery: MediaQueryList | null = null

  function handleChange(event?: MediaQueryListEvent) {
    if (event && typeof event.matches === 'boolean') {
      isMobile.value = event.matches
      return
    }
    isMobile.value = readInitialIsMobile(query)
  }

  onMounted(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (typeof window.matchMedia === 'function') {
      mediaQuery = window.matchMedia(query)
      handleChange()
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange)
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleChange)
      }
    } else {
      handleChange()
    }
  })

  onBeforeUnmount(() => {
    if (!mediaQuery) {
      return
    }
    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', handleChange)
    } else if (typeof mediaQuery.removeListener === 'function') {
      mediaQuery.removeListener(handleChange)
    }
  })

  return isMobile
}
