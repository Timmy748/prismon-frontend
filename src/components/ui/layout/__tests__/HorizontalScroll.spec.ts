import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { HorizontalScroll } from '../index'

describe('HorizontalScroll', () => {
  it('renders slot items and gap modifier classes', () => {
    const wrapper = mount(HorizontalScroll, {
      props: {
        gap: 'lg',
        ariaLabel: 'Lista horizontal',
      },
      slots: {
        default: '<span class="item">Item 1</span><span class="item">Item 2</span>',
      },
    })

    expect(wrapper.classes()).toContain('horizontal-scroll')
    expect(wrapper.classes()).toContain('horizontal-scroll--gap-lg')
    expect(wrapper.find('.horizontal-scroll__track').attributes('aria-label')).toBe(
      'Lista horizontal',
    )
    expect(wrapper.findAll('.item')).toHaveLength(2)
  })

  it('toggles left and right mask modifiers based on scroll position', async () => {
    const wrapper = mount(HorizontalScroll, {
      slots: {
        default: '<span>A</span><span>B</span><span>C</span>',
      },
    })

    const track = wrapper.find('.horizontal-scroll__track')
    const el = track.element as HTMLElement

    Object.defineProperty(el, 'scrollWidth', { value: 500, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollLeft', { value: 0, writable: true, configurable: true })

    await track.trigger('scroll')
    expect(track.classes()).toContain('horizontal-scroll__track--mask-right')
    expect(track.classes()).not.toContain('horizontal-scroll__track--mask-left')
    expect(track.classes()).not.toContain('horizontal-scroll__track--mask-both')

    el.scrollLeft = 100
    await track.trigger('scroll')
    expect(track.classes()).toContain('horizontal-scroll__track--mask-both')

    el.scrollLeft = 300
    await track.trigger('scroll')
    expect(track.classes()).toContain('horizontal-scroll__track--mask-left')
    expect(track.classes()).not.toContain('horizontal-scroll__track--mask-right')
  })

  it('converts vertical wheel deltaY to horizontal scrollLeft when overflowing', async () => {
    const wrapper = mount(HorizontalScroll, {
      slots: {
        default: '<span>Item</span>',
      },
    })

    const track = wrapper.find('.horizontal-scroll__track')
    const el = track.element as HTMLElement

    Object.defineProperty(el, 'scrollWidth', { value: 400, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollLeft', { value: 0, writable: true, configurable: true })

    await track.trigger('wheel', { deltaY: 60, deltaX: 0 })
    expect(el.scrollLeft).toBe(60)
  })
})
