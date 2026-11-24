import { defineComponent, ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { TabItem, Tabs, type TabOption } from '../index'

const ITEMS: TabOption[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'members', label: 'Membros' },
  { id: 'settings', label: 'Configurações', disabled: true },
]

describe('TabItem', () => {
  it('renders button with role="tab" and default state', () => {
    const wrapper = mount(TabItem, {
      props: { label: 'Visão geral' },
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('role')).toBe('tab')
    expect(button.attributes('aria-selected')).toBe('false')
    expect(button.classes()).toContain('tab-item')
    expect(button.classes()).not.toContain('tab-item--active')
    expect(button.text()).toBe('Visão geral')
  })

  it('applies active modifier and aria-selected="true" when active', () => {
    const wrapper = mount(TabItem, {
      props: { label: 'Ativa', active: true },
    })

    expect(wrapper.classes()).toContain('tab-item')
    expect(wrapper.classes()).toContain('tab-item--active')
    expect(wrapper.attributes('aria-selected')).toBe('true')
  })

  it('supports default slot content and emits click when enabled', async () => {
    const wrapper = mount(TabItem, {
      slots: { default: 'Conteúdo slot' },
    })

    expect(wrapper.text()).toBe('Conteúdo slot')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(TabItem, {
      props: { label: 'Bloqueada', disabled: true },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('tab-item--disabled')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

describe('Tabs', () => {
  it('renders tablist from items prop and emits update:modelValue on click', async () => {
    const wrapper = mount(Tabs, {
      props: {
        items: ITEMS,
        modelValue: 'overview',
      },
    })

    expect(wrapper.attributes('role')).toBe('tablist')
    expect(wrapper.classes()).toContain('tabs')
    expect(wrapper.classes()).toContain('tabs--has-indicator')
    expect(wrapper.find('.tabs__indicator').exists()).toBe(true)

    const tabs = wrapper.findAllComponents(TabItem)
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
    const wrapper = mount(Tabs, {
      slots: {
        default: '<button role="tab" type="button">Manual</button>',
      },
    })

    expect(wrapper.find('[role="tab"]').text()).toBe('Manual')
  })

  it('positions and animates indicator bar across active items and slotted TabItem changes', async () => {
    const wrapper = mount(Tabs, {
      props: {
        items: ITEMS,
        modelValue: 'overview',
      },
    })

    const tabs = wrapper.findAll('[role="tab"]')
    Object.defineProperty(tabs[0]!.element, 'offsetLeft', { value: 0, configurable: true })
    Object.defineProperty(tabs[0]!.element, 'offsetWidth', { value: 110, configurable: true })
    Object.defineProperty(tabs[1]!.element, 'offsetLeft', { value: 110, configurable: true })
    Object.defineProperty(tabs[1]!.element, 'offsetWidth', { value: 96, configurable: true })

    await wrapper.setProps({ modelValue: 'members' })
    const indicator = wrapper.find('.tabs__indicator').element as HTMLElement
    expect(indicator.style.transform).toBe('translateX(110px)')
    expect(indicator.style.width).toBe('96px')
    expect(indicator.style.opacity).toBe('1')

    await wrapper.setProps({ modelValue: 'overview' })
    expect(indicator.style.transform).toBe('translateX(0px)')
    expect(indicator.style.width).toBe('110px')

    // Slotted TabItem usage
    const SlottedHost = defineComponent({
      components: { Tabs, TabItem },
      setup() {
        const current = ref('first')
        return { current }
      },
      template: `
        <Tabs aria-label="Abas">
          <TabItem label="Primeira" :active="current === 'first'" @click="current = 'first'" />
          <TabItem label="Segunda" :active="current === 'second'" @click="current = 'second'" />
        </Tabs>
      `,
    })

    const slottedWrapper = mount(SlottedHost)
    const slottedTabs = slottedWrapper.findAll('[role="tab"]')
    Object.defineProperty(slottedTabs[0]!.element, 'offsetLeft', { value: 0, configurable: true })
    Object.defineProperty(slottedTabs[0]!.element, 'offsetWidth', { value: 80, configurable: true })
    Object.defineProperty(slottedTabs[1]!.element, 'offsetLeft', { value: 80, configurable: true })
    Object.defineProperty(slottedTabs[1]!.element, 'offsetWidth', { value: 120, configurable: true })

    await slottedTabs[1]!.trigger('click')
    await slottedWrapper.vm.$nextTick()
    // Allow MutationObserver microtask to run
    await new Promise((resolve) => setTimeout(resolve, 0))

    const slottedIndicator = slottedWrapper.find('.tabs__indicator').element as HTMLElement
    expect(slottedIndicator.style.transform).toBe('translateX(80px)')
    expect(slottedIndicator.style.width).toBe('120px')
    expect(slottedIndicator.style.opacity).toBe('1')
  })
})
