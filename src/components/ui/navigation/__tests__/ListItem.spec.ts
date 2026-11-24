import { afterEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ListItem } from '../index'
import { Icon } from '../../icons'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('ListItem', () => {
  it('renders label and default classes without icon', () => {
    const wrapper = mount(ListItem, {
      props: { label: 'Projetos' },
    })

    expect(wrapper.classes()).toContain('list-item')
    expect(wrapper.classes()).not.toContain('list-item--with-icon')
    expect(wrapper.classes()).not.toContain('list-item--closed')
    expect(wrapper.classes()).not.toContain('list-item--active')
    expect(wrapper.find('.list-item__label').text()).toBe('Projetos')
    expect(wrapper.findComponent(Icon).exists()).toBe(false)
  })

  it('renders left icon with size "md" and applies with-icon modifier', () => {
    const wrapper = mount(ListItem, {
      props: {
        label: 'Documentos',
        icon: 'documents',
      },
    })

    expect(wrapper.classes()).toContain('list-item--with-icon')
    const icon = wrapper.findComponent(Icon)
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('documents')
    expect(icon.props('size')).toBe('md')
  })

  it('renders only icon and sets aria-label when collapsed', () => {
    const wrapper = mount(ListItem, {
      props: {
        label: 'Configurações',
        icon: 'setting',
        collapsed: true,
      },
    })

    expect(wrapper.classes()).toContain('list-item--closed')
    expect(wrapper.find('.list-item__label').exists()).toBe(false)
    expect(wrapper.find('.list-item__trigger').attributes('aria-label')).toBe('Configurações')
    expect(wrapper.findComponent(Icon).exists()).toBe(true)
  })

  it('applies active modifier and aria-current="page"', () => {
    const wrapper = mount(ListItem, {
      props: {
        label: 'Membros',
        active: true,
      },
    })

    expect(wrapper.classes()).toContain('list-item--active')
    expect(wrapper.find('.list-item__trigger').attributes('aria-current')).toBe('page')
  })

  it('emits click on item click and trailing-click without triggering click', async () => {
    const wrapper = mount(ListItem, {
      props: {
        label: 'Item com ação',
        hasTrailingAction: true,
      },
    })

    await wrapper.find('.list-item__trigger').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('trailing-click')).toBeUndefined()

    await wrapper.find('.list-item__trailing').trigger('click')
    expect(wrapper.emitted('trailing-click')).toHaveLength(1)
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('supports #trailing and default slots', () => {
    const wrapper = mount(ListItem, {
      props: { label: 'Fallback' },
      slots: {
        default: 'Label customizada',
        trailing: '<span data-testid="trailing-slot">3</span>',
      },
    })

    expect(wrapper.find('.list-item__label').text()).toBe('Label customizada')
    expect(wrapper.find('[data-testid="trailing-slot"]').text()).toBe('3')
  })

  it('renders an anchor link when href is provided and intercepts unmodified left-click for SPA navigation', async () => {
    const wrapper = mount(ListItem, {
      props: {
        label: 'Repertório',
        href: '/projetos/1/repertorio',
      },
    })

    const trigger = wrapper.find('a.list-item__trigger')
    expect(trigger.exists()).toBe(true)
    expect(trigger.attributes('href')).toBe('/projetos/1/repertorio')
    expect(trigger.attributes('type')).toBeUndefined()

    await trigger.trigger('click', { ctrlKey: true })
    expect(wrapper.emitted('click')).toBeUndefined()

    await trigger.trigger('click', { button: 0 })
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('masks overflowing label and translates to end after 300ms hover when marqueeOnHover is true', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ListItem, {
      props: {
        label: 'Título de conversa extremamente longo para testar o marquee',
        marqueeOnHover: true,
      },
    })

    const wrapEl = wrapper.find('.list-item__label').element as HTMLElement
    const textEl = wrapper.find('.list-item__label-marquee-text').element as HTMLElement

    Object.defineProperty(wrapEl, 'clientWidth', { value: 120, configurable: true })
    Object.defineProperty(textEl, 'scrollWidth', { value: 260, configurable: true })

    window.dispatchEvent(new Event('resize'))
    await wrapper.trigger('pointerenter', { pointerType: 'mouse' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.list-item__label').classes()).toContain('list-item__label--mask-end')
    expect(textEl.style.transform).toBe('translate3d(0, 0, 0)')

    // Before 300ms, marquee should not start yet
    vi.advanceTimersByTime(250)
    await wrapper.vm.$nextTick()
    expect(textEl.style.transform).toBe('translate3d(0, 0, 0)')

    // After 300ms continuous hover, translates smoothly by overflow distance
    vi.advanceTimersByTime(60)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.list-item__label').classes()).toContain('list-item__label--mask-start')
    expect(textEl.style.transform).toContain('translate3d(-144px')

    // Leaving immediately restores original state
    await wrapper.trigger('pointerleave')
    await wrapper.vm.$nextTick()
    expect(textEl.style.transform).toBe('translate3d(0, 0, 0)')
    expect(wrapper.find('.list-item__label').classes()).toContain('list-item__label--mask-end')
  })
})
