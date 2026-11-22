import { onBeforeUnmount, onMounted } from 'vue'

export function useEscapeKey(isActive: () => boolean, onEscape: () => void) {
  function handleKeydown(event: KeyboardEvent) {
    if (isActive() && event.key === 'Escape') {
      onEscape()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}
