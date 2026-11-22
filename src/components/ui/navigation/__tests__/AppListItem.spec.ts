import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppListItem } from '../index'
import { AppIcon } from '../../icons'

describe('AppListItem', () => {
  it('renders label and default classes without icon', () => {
    const wrapper = mount(AppListItem, {
      props: { label: 'Projetos' },
    })

    expect(wrapper.classes()).toContain('app-list-item')
    expect(wrapper.classes()).not.toContain('app-list-item--with-icon')
    expect(wrapper.classes()).not.toContain('app-list-item--closed')
    expect(wrapper.classes()).not.toContain('app-list-item--active')
    expect(wrapper.find('.app-list-item__label').text()).toBe('Projetos')
    expect(wrapper.findComponent(AppIcon).exists()).toBe(false)
  })

  it('renders left icon with size "md" and applies with-icon modifier', () => {
    const wrapper = mount(AppListItem, {
      props: {
        label: 'Documentos',
        icon: 'documents',
      },
    })

    expect(wrapper.classes()).toContain('app-list-item--with-icon')
    const icon = wrapper.findComponent(AppIcon)
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('documents')
    expect(icon.props('size')).toBe('md')
  })

  it('renders only icon and sets aria-label when collapsed', () => {
    const wrapper = mount(AppListItem, {
      props: {
        label: 'Configurações',
        icon: 'setting',
        collapsed: true,
      },
    })

    expect(wrapper.classes()).toContain('app-list-item--closed')
    expect(wrapper.find('.app-list-item__label').exists()).toBe(false)
    expect(wrapper.find('.app-list-item__trigger').attributes('aria-label')).toBe('Configurações')
    expect(wrapper.findComponent(AppIcon).exists()).toBe(true)
  })

  it('applies active modifier and aria-current="page"', () => {
    const wrapper = mount(AppListItem, {
      props: {
        label: 'Membros',
        active: true,
      },
    })

    expect(wrapper.classes()).toContain('app-list-item--active')
    expect(wrapper.find('.app-list-item__trigger').attributes('aria-current')).toBe('page')
  })

  it('emits click on item click and trailing-click without triggering click', async () => {
    const wrapper = mount(AppListItem, {
      props: {
        label: 'Item com ação',
        hasTrailingAction: true,
      },
    })

    await wrapper.find('.app-list-item__trigger').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('trailing-click')).toBeUndefined()

    await wrapper.find('.app-list-item__trailing').trigger('click')
    expect(wrapper.emitted('trailing-click')).toHaveLength(1)
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('supports #trailing and default slots', () => {
    const wrapper = mount(AppListItem, {
      props: { label: 'Fallback' },
      slots: {
        default: 'Label customizada',
        trailing: '<span data-testid="trailing-slot">3</span>',
      },
    })

    expect(wrapper.find('.app-list-item__label').text()).toBe('Label customizada')
    expect(wrapper.find('[data-testid="trailing-slot"]').text()).toBe('3')
  })
})
