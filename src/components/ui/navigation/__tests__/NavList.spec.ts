import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { NavList } from '../index'
import { Icon } from '../../icons'
import { ScrollContainer } from '../../layout'

describe('NavList', () => {
  it('renders vertical ScrollContainer with gap="none", title and slot content', () => {
    const wrapper = mount(NavList, {
      props: { title: 'Navegação' },
      slots: {
        default: '<div data-testid="nav-item">Item 1</div>',
      },
    })

    expect(wrapper.classes()).toContain('nav-list')
    expect(wrapper.classes()).toContain('nav-list--vertical')
    expect(wrapper.classes()).not.toContain('nav-list--horizontal')
    expect(wrapper.find('.nav-list__title').text()).toBe('Navegação')
    expect(wrapper.find('[data-testid="nav-item"]').exists()).toBe(true)
    expect(wrapper.find('.nav-list__toggle').exists()).toBe(false)

    const scrollContainer = wrapper.findComponent(ScrollContainer)
    expect(scrollContainer.exists()).toBe(true)
    expect(scrollContainer.classes()).toContain('nav-list__items')
    expect(scrollContainer.props('direction')).toBe('vertical')
    expect(scrollContainer.props('gap')).toBe('none')
    expect(scrollContainer.props('ariaLabel')).toBe('Navegação')
  })

  it('applies horizontal modifier and horizontal ScrollContainer when orientation is "horizontal"', () => {
    const wrapper = mount(NavList, {
      props: { orientation: 'horizontal' },
    })

    expect(wrapper.classes()).toContain('nav-list')
    expect(wrapper.classes()).toContain('nav-list--horizontal')

    const scrollContainer = wrapper.findComponent(ScrollContainer)
    expect(scrollContainer.exists()).toBe(true)
    expect(scrollContainer.props('direction')).toBe('horizontal')
    expect(scrollContainer.props('gap')).toBe('none')
  })

  it('forwards ScrollContainer overflow masks and boundary wheel lock inside NavList', async () => {
    const wrapper = mount(NavList, {
      props: { title: 'Itens' },
      slots: {
        default: '<div>Item 1</div><div>Item 2</div><div>Item 3</div>',
      },
    })

    const track = wrapper.find('.scroll-container__track')
    const el = track.element as HTMLElement
    Object.defineProperty(el, 'scrollHeight', { value: 400, configurable: true })
    Object.defineProperty(el, 'clientHeight', { value: 160, configurable: true })
    Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true })

    await track.trigger('scroll')
    expect(track.classes()).toContain('scroll-container__track--mask-end')

    el.scrollTop = 240
    await track.trigger('scroll')
    expect(track.classes()).toContain('scroll-container__track--mask-start')

    const wheelAtEnd = new WheelEvent('wheel', { deltaY: 100, cancelable: true })
    el.dispatchEvent(wheelAtEnd)
    expect(wheelAtEnd.defaultPrevented).toBe(true)
  })

  it('toggles visibility and collapsed class when collapsible', async () => {
    const wrapper = mount(NavList, {
      props: {
        title: 'Seção',
        collapsible: true,
        defaultOpen: true,
      },
      slots: {
        default: '<div data-testid="nav-item">Item</div>',
      },
    })

    const toggle = wrapper.find('.nav-list__toggle')
    const icon = wrapper.findComponent(Icon)
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(icon.props('name')).toBe('arrow-down')
    expect(icon.props('size')).toBe('md')
    expect(wrapper.find('[data-testid="nav-item"]').exists()).toBe(true)

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.classes()).toContain('nav-list--collapsed')
    expect(wrapper.find('[data-testid="nav-item"]').exists()).toBe(false)
  })

  it('starts collapsed when defaultOpen is false', () => {
    const wrapper = mount(NavList, {
      props: {
        title: 'Recolhida',
        collapsible: true,
        defaultOpen: false,
      },
      slots: {
        default: '<div data-testid="nav-item">Item</div>',
      },
    })

    expect(wrapper.classes()).toContain('nav-list--collapsed')
    expect(wrapper.find('[data-testid="nav-item"]').exists()).toBe(false)
  })
})
