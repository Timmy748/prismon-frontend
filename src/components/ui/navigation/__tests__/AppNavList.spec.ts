import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppNavList } from '../index'
import { AppIcon } from '../../icons'

describe('AppNavList', () => {
  it('renders vertical orientation by default with title and slot content', () => {
    const wrapper = mount(AppNavList, {
      props: { title: 'Navegação' },
      slots: {
        default: '<div data-testid="nav-item">Item 1</div>',
      },
    })

    expect(wrapper.classes()).toContain('app-nav-list')
    expect(wrapper.classes()).toContain('app-nav-list--vertical')
    expect(wrapper.classes()).not.toContain('app-nav-list--horizontal')
    expect(wrapper.find('.app-nav-list__title').text()).toBe('Navegação')
    expect(wrapper.find('[data-testid="nav-item"]').exists()).toBe(true)
    expect(wrapper.find('.app-nav-list__toggle').exists()).toBe(false)
  })

  it('applies horizontal modifier when orientation is "horizontal"', () => {
    const wrapper = mount(AppNavList, {
      props: { orientation: 'horizontal' },
    })

    expect(wrapper.classes()).toContain('app-nav-list')
    expect(wrapper.classes()).toContain('app-nav-list--horizontal')
  })

  it('toggles visibility and collapsed class when collapsible', async () => {
    const wrapper = mount(AppNavList, {
      props: {
        title: 'Seção',
        collapsible: true,
        defaultOpen: true,
      },
      slots: {
        default: '<div data-testid="nav-item">Item</div>',
      },
    })

    const toggle = wrapper.find('.app-nav-list__toggle')
    const icon = wrapper.findComponent(AppIcon)
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(icon.props('name')).toBe('arrow-down')
    expect(icon.props('size')).toBe('md')
    expect(wrapper.find('[data-testid="nav-item"]').exists()).toBe(true)

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(wrapper.classes()).toContain('app-nav-list--collapsed')
    expect(wrapper.find('[data-testid="nav-item"]').exists()).toBe(false)
  })

  it('starts collapsed when defaultOpen is false', () => {
    const wrapper = mount(AppNavList, {
      props: {
        title: 'Recolhida',
        collapsible: true,
        defaultOpen: false,
      },
      slots: {
        default: '<div data-testid="nav-item">Item</div>',
      },
    })

    expect(wrapper.classes()).toContain('app-nav-list--collapsed')
    expect(wrapper.find('[data-testid="nav-item"]').exists()).toBe(false)
  })
})
