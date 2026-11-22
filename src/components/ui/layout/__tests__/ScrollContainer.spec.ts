import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ScrollContainer } from '../index'

const originalMatchMedia = window.matchMedia

function mockMobileMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn<(query: string) => MediaQueryList>().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn<() => void>(),
      removeListener: vi.fn<() => void>(),
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
      dispatchEvent: vi.fn<() => boolean>(() => false),
    })),
  })
}

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  })
})

describe('ScrollContainer', () => {
  it('applies mutually exclusive direction modifier and gap classes', () => {
    const horizontal = mount(ScrollContainer, {
      props: {
        direction: 'horizontal',
        gap: 'lg',
        ariaLabel: 'Lista horizontal',
      },
      slots: {
        default: '<span class="item">1</span><span class="item">2</span>',
      },
    })

    expect(horizontal.classes()).toContain('scroll-container--horizontal')
    expect(horizontal.classes()).not.toContain('scroll-container--vertical')
    expect(horizontal.classes()).toContain('scroll-container--gap-lg')
    expect(horizontal.find('.scroll-container__track').attributes('aria-label')).toBe(
      'Lista horizontal',
    )

    const vertical = mount(ScrollContainer, {
      props: {
        direction: 'vertical',
        gap: 'sm',
      },
    })

    expect(vertical.classes()).toContain('scroll-container--vertical')
    expect(vertical.classes()).not.toContain('scroll-container--horizontal')
    expect(vertical.classes()).toContain('scroll-container--gap-sm')
  })

  it('toggles horizontal masks based on scrollLeft', async () => {
    const wrapper = mount(ScrollContainer, {
      props: { direction: 'horizontal' },
      slots: { default: '<span>A</span><span>B</span>' },
    })

    const track = wrapper.find('.scroll-container__track')
    const el = track.element as HTMLElement

    Object.defineProperty(el, 'scrollWidth', { value: 500, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollLeft', { value: 0, writable: true, configurable: true })

    await track.trigger('scroll')
    expect(track.classes()).toContain('scroll-container__track--mask-end')
    expect(track.classes()).not.toContain('scroll-container__track--draggable')

    el.scrollLeft = 100
    await track.trigger('scroll')
    expect(track.classes()).toContain('scroll-container__track--mask-both')

    el.scrollLeft = 300
    await track.trigger('scroll')
    expect(track.classes()).toContain('scroll-container__track--mask-start')
    expect(track.classes()).not.toContain('scroll-container__track--mask-end')
  })

  it('toggles vertical masks based on scrollTop', async () => {
    const wrapper = mount(ScrollContainer, {
      props: { direction: 'vertical' },
      slots: { default: '<div>Item 1</div><div>Item 2</div>' },
    })

    const track = wrapper.find('.scroll-container__track')
    const el = track.element as HTMLElement

    Object.defineProperty(el, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true })

    await track.trigger('scroll')
    expect(track.classes()).toContain('scroll-container__track--mask-end')

    el.scrollTop = 120
    await track.trigger('scroll')
    expect(track.classes()).toContain('scroll-container__track--mask-both')

    el.scrollTop = 300
    await track.trigger('scroll')
    expect(track.classes()).toContain('scroll-container__track--mask-start')
    expect(track.classes()).not.toContain('scroll-container__track--mask-end')
  })

  it('converts vertical mouse wheel deltaY (including line mode) to scrollLeft in horizontal mode', () => {
    const wrapper = mount(ScrollContainer, {
      props: { direction: 'horizontal' },
      slots: { default: '<span>Item</span>' },
    })

    const el = wrapper.find('.scroll-container__track').element as HTMLElement
    Object.defineProperty(el, 'scrollWidth', { value: 400, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollLeft', { value: 0, writable: true, configurable: true })

    const wheelPx = new WheelEvent('wheel', { deltaY: 60, cancelable: true })
    el.dispatchEvent(wheelPx)
    expect(el.scrollLeft).toBe(60)
    expect(wheelPx.defaultPrevented).toBe(true)

    const wheelLine = new WheelEvent('wheel', { deltaY: 3, deltaMode: 1, cancelable: true })
    el.dispatchEvent(wheelLine)
    expect(el.scrollLeft).toBe(108)
    expect(wheelLine.defaultPrevented).toBe(true)

    el.scrollLeft = 200
    const wheelAtEnd = new WheelEvent('wheel', { deltaY: 80, cancelable: true })
    el.dispatchEvent(wheelAtEnd)
    expect(el.scrollLeft).toBe(200)
    expect(wheelAtEnd.defaultPrevented).toBe(true)
  })

  it('locks vertical wheel scroll at boundaries so page does not scroll, while preserving non-overflowing page scroll', () => {
    const vertical = mount(ScrollContainer, {
      props: { direction: 'vertical' },
      slots: { default: '<div>A</div><div>B</div>' },
    })

    const el = vertical.find('.scroll-container__track').element as HTMLElement
    Object.defineProperty(el, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true })

    const wheelAtTop = new WheelEvent('wheel', { deltaY: -40, cancelable: true })
    el.dispatchEvent(wheelAtTop)
    expect(el.scrollTop).toBe(0)
    expect(wheelAtTop.defaultPrevented).toBe(true)

    el.scrollTop = 50
    const wheelMiddle = new WheelEvent('wheel', { deltaY: 30, cancelable: true })
    el.dispatchEvent(wheelMiddle)
    expect(wheelMiddle.defaultPrevented).toBe(false)

    el.scrollTop = 270
    const wheelToBottom = new WheelEvent('wheel', { deltaY: 100, cancelable: true })
    el.dispatchEvent(wheelToBottom)
    expect(el.scrollTop).toBe(300)
    expect(wheelToBottom.defaultPrevented).toBe(true)

    const wheelPastBottom = new WheelEvent('wheel', { deltaY: 120, cancelable: true })
    el.dispatchEvent(wheelPastBottom)
    expect(el.scrollTop).toBe(300)
    expect(wheelPastBottom.defaultPrevented).toBe(true)

    Object.defineProperty(el, 'scrollHeight', { value: 200, configurable: true })
    const wheelNoOverflow = new WheelEvent('wheel', { deltaY: 80, cancelable: true })
    el.dispatchEvent(wheelNoOverflow)
    expect(wheelNoOverflow.defaultPrevented).toBe(false)
  })

  it('enables drag scrolling only on mobile viewports/coarse pointers and disables it on desktop', async () => {
    mockMobileMatchMedia(false)
    const onDesktopClick = vi.fn<() => void>()
    const desktop = mount(ScrollContainer, {
      props: { direction: 'horizontal' },
      slots: { default: '<button class="tag-btn">Tag</button>' },
    })

    desktop.find('.tag-btn').element.addEventListener('click', onDesktopClick)
    const dTrack = desktop.find('.scroll-container__track')
    const dEl = dTrack.element as HTMLElement
    Object.defineProperty(dEl, 'scrollWidth', { value: 500, configurable: true })
    Object.defineProperty(dEl, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(dEl, 'scrollLeft', { value: 0, writable: true, configurable: true })

    await dTrack.trigger('scroll')
    expect(dTrack.classes()).not.toContain('scroll-container__track--draggable')

    await dTrack.trigger('mousedown', { button: 0, clientX: 150, clientY: 10 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 90, clientY: 10 }))
    expect(dEl.scrollLeft).toBe(0)
    await desktop.find('.tag-btn').trigger('click')
    expect(onDesktopClick).toHaveBeenCalledTimes(1)

    mockMobileMatchMedia(true)
    const onTagClick = vi.fn<() => void>()
    const horizontal = mount(ScrollContainer, {
      props: { direction: 'horizontal' },
      slots: { default: '<button class="tag-btn">Tag</button>' },
    })

    horizontal.find('.tag-btn').element.addEventListener('click', onTagClick)
    const hTrack = horizontal.find('.scroll-container__track')
    const hEl = hTrack.element as HTMLElement
    Object.defineProperty(hEl, 'scrollWidth', { value: 500, configurable: true })
    Object.defineProperty(hEl, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(hEl, 'scrollLeft', { value: 0, writable: true, configurable: true })

    await hTrack.trigger('scroll')
    expect(hTrack.classes()).toContain('scroll-container__track--draggable')

    await hTrack.trigger('mousedown', { button: 0, clientX: 150, clientY: 10 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 90, clientY: 10 }))
    expect(hEl.scrollLeft).toBe(60)

    await horizontal.vm.$nextTick()
    expect(hTrack.classes()).toContain('scroll-container__track--dragging')

    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 90, clientY: 10 }))
    await horizontal.find('.tag-btn').trigger('click')
    expect(onTagClick).not.toHaveBeenCalled()

    const vertical = mount(ScrollContainer, {
      props: { direction: 'vertical' },
      slots: { default: '<div>A</div><div>B</div>' },
    })

    const vTrack = vertical.find('.scroll-container__track')
    const vEl = vTrack.element as HTMLElement
    Object.defineProperty(vEl, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(vEl, 'clientHeight', { value: 200, configurable: true })
    Object.defineProperty(vEl, 'scrollTop', { value: 0, writable: true, configurable: true })

    await vTrack.trigger('mousedown', { button: 0, clientX: 10, clientY: 200 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 120 }))
    expect(vEl.scrollTop).toBe(80)
    window.dispatchEvent(new MouseEvent('mouseup', { clientX: 10, clientY: 120 }))
  })
})
