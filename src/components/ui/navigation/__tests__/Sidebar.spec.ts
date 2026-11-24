import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Sidebar } from '../index'
import { IconButton } from '../../buttons'

describe('Sidebar', () => {
  it('renders expanded sidebar with title, close icon button, body and footer slots', () => {
    const wrapper = mount(Sidebar, {
      props: {
        title: 'Prismon',
      },
      slots: {
        default: '<div data-testid="sidebar-body">Menu</div>',
        footer: '<div data-testid="sidebar-footer">Rodapé</div>',
      },
    })

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('sidebar')
    expect(aside.classes()).not.toContain('sidebar--closed')
    expect(wrapper.find('.sidebar__title').text()).toBe('Prismon')
    expect(wrapper.find('[data-testid="sidebar-body"]').text()).toBe('Menu')
    expect(wrapper.find('[data-testid="sidebar-footer"]').text()).toBe('Rodapé')

    const toggleButton = wrapper.findComponent(IconButton)
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.props('variant')).toBe('ghost')
    expect(toggleButton.props('icon')).toBe('close')
    expect(toggleButton.props('ariaLabel')).toBe('Alternar barra lateral')
  })

  it('applies closed modifier, hides title and switches icon when collapsed', () => {
    const wrapper = mount(Sidebar, {
      props: {
        title: 'Prismon',
        collapsed: true,
        toggleLabel: 'Expandir menu',
      },
    })

    expect(wrapper.classes()).toContain('sidebar')
    expect(wrapper.classes()).toContain('sidebar--closed')
    expect(wrapper.find('.sidebar__title').exists()).toBe(false)

    const toggleButton = wrapper.findComponent(IconButton)
    expect(toggleButton.props('icon')).toBe('arrow-right')
    expect(toggleButton.props('ariaLabel')).toBe('Expandir menu')
  })

  it('emits toggle and update:collapsed when toggle button is clicked', async () => {
    const wrapper = mount(Sidebar, {
      props: { collapsed: false },
    })

    await wrapper.findComponent(IconButton).trigger('click')

    expect(wrapper.emitted('toggle')).toHaveLength(1)
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
  })
})
