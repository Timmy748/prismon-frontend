import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ModificationEvent } from '../index'
import { Icon } from '../../icons'

describe('ModificationEvent', () => {
  it('renders title, summary, author and date with helper icons', () => {
    const wrapper = mount(ModificationEvent, {
      props: {
        title: 'Alteração de título',
        summary: 'Atualizou o título para Guia de UI.',
        author: 'Timmy Chen',
        date: '22/11/2026',
      },
    })

    expect(wrapper.find('.modification-event__title').text()).toBe('Alteração de título')
    expect(wrapper.find('.modification-event__summary').text()).toBe(
      'Atualizou o título para Guia de UI.',
    )
    expect(wrapper.text()).toContain('Timmy Chen')
    expect(wrapper.text()).toContain('22/11/2026')

    const icons = wrapper.findAllComponents(Icon)
    expect(icons).toHaveLength(2)
    expect(icons[0]?.props('name')).toBe('people')
    expect(icons[0]?.props('size')).toBe('sm')
    expect(icons[0]?.props('color')).toBe('helper')
    expect(icons[1]?.props('name')).toBe('calendar')
    expect(icons[1]?.props('size')).toBe('sm')
    expect(icons[1]?.props('color')).toBe('helper')
  })
})
