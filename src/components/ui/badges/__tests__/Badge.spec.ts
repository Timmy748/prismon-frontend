import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Badge } from '../index'

describe('Badge', () => {
  it('renders label prop with .badge BEM class', () => {
    const wrapper = mount(Badge, {
      props: { label: 'Novo' },
    })

    expect(wrapper.classes()).toContain('badge')
    expect(wrapper.text()).toBe('Novo')
  })

  it('renders default slot content when provided', () => {
    const wrapper = mount(Badge, {
      slots: {
        default: 'Em destaque',
      },
    })

    expect(wrapper.classes()).toContain('badge')
    expect(wrapper.text()).toBe('Em destaque')
  })

  it('prefers default slot content over label prop when both are provided', () => {
    const wrapper = mount(Badge, {
      props: { label: 'Fallback' },
      slots: {
        default: '<span data-testid="custom-badge">Slot</span>',
      },
    })

    expect(wrapper.find('[data-testid="custom-badge"]').text()).toBe('Slot')
    expect(wrapper.text()).toBe('Slot')
  })

  it('renders cleanly when neither label nor default slot is provided', () => {
    const wrapper = mount(Badge)

    expect(wrapper.classes()).toContain('badge')
    expect(wrapper.text()).toBe('')
  })
})
