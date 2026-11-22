import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppBadge } from '../index'

describe('AppBadge', () => {
  it('renders label prop with .app-badge BEM class', () => {
    const wrapper = mount(AppBadge, {
      props: { label: 'Novo' },
    })

    expect(wrapper.classes()).toContain('app-badge')
    expect(wrapper.text()).toBe('Novo')
  })

  it('renders default slot content when provided', () => {
    const wrapper = mount(AppBadge, {
      slots: {
        default: 'Em destaque',
      },
    })

    expect(wrapper.classes()).toContain('app-badge')
    expect(wrapper.text()).toBe('Em destaque')
  })

  it('prefers default slot content over label prop when both are provided', () => {
    const wrapper = mount(AppBadge, {
      props: { label: 'Fallback' },
      slots: {
        default: '<span data-testid="custom-badge">Slot</span>',
      },
    })

    expect(wrapper.find('[data-testid="custom-badge"]').text()).toBe('Slot')
    expect(wrapper.text()).toBe('Slot')
  })

  it('renders cleanly when neither label nor default slot is provided', () => {
    const wrapper = mount(AppBadge)

    expect(wrapper.classes()).toContain('app-badge')
    expect(wrapper.text()).toBe('')
  })
})
