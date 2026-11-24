/**
 * Shared JS transition hooks for measured-height collapsible accordions and lists,
 * measuring rendered height so CSS transitions remain interruptible without animating to auto.
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function clearCollapseStyles(el: HTMLElement) {
  el.style.height = ''
  el.style.opacity = ''
  el.style.overflow = ''
}

export function onCollapseEnter(el: Element) {
  const htmlEl = el as HTMLElement
  if (prefersReducedMotion()) {
    return
  }

  htmlEl.style.height = 'auto'
  const targetHeight = htmlEl.getBoundingClientRect().height
  htmlEl.style.height = '0px'
  htmlEl.style.opacity = '0'
  htmlEl.style.overflow = 'hidden'
  void htmlEl.offsetHeight
  htmlEl.style.height = `${targetHeight}px`
  htmlEl.style.opacity = '1'
}

export function onCollapseAfterEnter(el: Element) {
  clearCollapseStyles(el as HTMLElement)
}

export function onCollapseLeave(el: Element) {
  const htmlEl = el as HTMLElement
  if (prefersReducedMotion()) {
    return
  }

  const currentHeight = htmlEl.getBoundingClientRect().height
  htmlEl.style.height = `${currentHeight}px`
  htmlEl.style.opacity = '1'
  htmlEl.style.overflow = 'hidden'
  void htmlEl.offsetHeight
  htmlEl.style.height = '0px'
  htmlEl.style.opacity = '0'
}

export function onCollapseAfterLeave(el: Element) {
  clearCollapseStyles(el as HTMLElement)
}
