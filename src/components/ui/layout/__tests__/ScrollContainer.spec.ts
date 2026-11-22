import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ScrollContainer } from '../index'

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
    expect(track.classes()).toContain('scroll-container__track--draggable')

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
  })

  it('supports mouse drag scrolling horizontally and vertically and suppresses click after dragging', async () => {
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
