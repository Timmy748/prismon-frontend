import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppSidebar } from '../index'
import { AppIconButton } from '../../buttons'

describe('AppSidebar', () => {
  it('renders expanded sidebar with title, close icon button, body and footer slots', () => {
    const wrapper = mount(AppSidebar, {
      props: {
        title: 'Prismon',
      },
      slots: {
        default: '<div data-testid="sidebar-body">Menu</div>',
        footer: '<div data-testid="sidebar-footer">Rodapé</div>',
      },
    })

    const aside = wrapper.find('aside')
    expect(aside.classes()).toContain('app-sidebar')
    expect(aside.classes()).not.toContain('app-sidebar--closed')
    expect(wrapper.find('.app-sidebar__title').text()).toBe('Prismon')
    expect(wrapper.find('[data-testid="sidebar-body"]').text()).toBe('Menu')
    expect(wrapper.find('[data-testid="sidebar-footer"]').text()).toBe('Rodapé')

    const toggleButton = wrapper.findComponent(AppIconButton)
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.props('variant')).toBe('ghost')
    expect(toggleButton.props('icon')).toBe('close')
    expect(toggleButton.props('ariaLabel')).toBe('Alternar barra lateral')
  })

  it('applies closed modifier, hides title and switches icon when collapsed', () => {
    const wrapper = mount(AppSidebar, {
      props: {
        title: 'Prismon',
        collapsed: true,
        toggleLabel: 'Expandir menu',
      },
    })

    expect(wrapper.classes()).toContain('app-sidebar')
    expect(wrapper.classes()).toContain('app-sidebar--closed')
    expect(wrapper.find('.app-sidebar__title').exists()).toBe(false)

    const toggleButton = wrapper.findComponent(AppIconButton)
    expect(toggleButton.props('icon')).toBe('arrow-right')
    expect(toggleButton.props('ariaLabel')).toBe('Expandir menu')
  })

  it('emits toggle and update:collapsed when toggle button is clicked', async () => {
    const wrapper = mount(AppSidebar, {
      props: { collapsed: false },
    })

    await wrapper.findComponent(AppIconButton).trigger('click')

    expect(wrapper.emitted('toggle')).toHaveLength(1)
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
  })
})
