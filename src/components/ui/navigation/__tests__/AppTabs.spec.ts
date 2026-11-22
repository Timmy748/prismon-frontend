import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppTabItem, AppTabs, type TabItem } from '../index'

const ITEMS: TabItem[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'members', label: 'Membros' },
  { id: 'settings', label: 'Configurações', disabled: true },
]

describe('AppTabItem', () => {
  it('renders button with role="tab" and default state', () => {
    const wrapper = mount(AppTabItem, {
      props: { label: 'Visão geral' },
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('role')).toBe('tab')
    expect(button.attributes('aria-selected')).toBe('false')
    expect(button.classes()).toContain('app-tab-item')
    expect(button.classes()).not.toContain('app-tab-item--active')
    expect(button.text()).toBe('Visão geral')
  })

  it('applies active modifier and aria-selected="true" when active', () => {
    const wrapper = mount(AppTabItem, {
      props: { label: 'Ativa', active: true },
    })

    expect(wrapper.classes()).toContain('app-tab-item')
    expect(wrapper.classes()).toContain('app-tab-item--active')
    expect(wrapper.attributes('aria-selected')).toBe('true')
  })

  it('supports default slot content and emits click when enabled', async () => {
    const wrapper = mount(AppTabItem, {
      slots: { default: 'Conteúdo slot' },
    })

    expect(wrapper.text()).toBe('Conteúdo slot')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(AppTabItem, {
      props: { label: 'Bloqueada', disabled: true },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('app-tab-item--disabled')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

describe('AppTabs', () => {
  it('renders tablist from items prop and emits update:modelValue on click', async () => {
    const wrapper = mount(AppTabs, {
      props: {
        items: ITEMS,
        modelValue: 'overview',
      },
    })

    expect(wrapper.attributes('role')).toBe('tablist')
    expect(wrapper.classes()).toContain('app-tabs')

    const tabs = wrapper.findAllComponents(AppTabItem)
    expect(tabs).toHaveLength(3)
    expect(tabs[0]?.props('active')).toBe(true)
    expect(tabs[1]?.props('active')).toBe(false)
    expect(tabs[2]?.props('disabled')).toBe(true)

    await tabs[1]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['members']])

    await tabs[2]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
  })

  it('supports manual composition via default slot', () => {
    const wrapper = mount(AppTabs, {
      slots: {
        default: '<button role="tab" type="button">Manual</button>',
      },
    })

    expect(wrapper.find('[role="tab"]').text()).toBe('Manual')
  })
})
