import { afterEach, describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { Drawer } from '../index'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('Drawer', () => {
  it('does not render when open is false', () => {
    wrapper = mount(Drawer, {
      props: {
        open: false,
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders drawer with handle, accessibility attributes and default slot content', () => {
    wrapper = mount(Drawer, {
      props: {
        open: true,
      },
      slots: {
        default: '<ul data-testid="drawer-list"><li>Opção 1</li></ul>',
      },
    })

    const panel = wrapper.find('[role="dialog"]')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('aria-modal')).toBe('true')
    expect(panel.attributes('aria-label')).toBe('Gaveta')

    const handle = wrapper.find('.drawer__handle')
    expect(handle.exists()).toBe(true)
    expect(handle.attributes('aria-hidden')).toBe('true')

    expect(wrapper.find('[data-testid="drawer-list"]').exists()).toBe(true)
  })

  it('supports custom ariaLabel', () => {
    wrapper = mount(Drawer, {
      props: {
        open: true,
        ariaLabel: 'Menu de ações',
      },
    })

    expect(wrapper.find('[role="dialog"]').attributes('aria-label')).toBe('Menu de ações')
  })

  it('closes on backdrop click when closeOnBackdrop is true and ignores clicks inside panel', async () => {
    wrapper = mount(Drawer, {
      props: {
        open: true,
      },
    })

    await wrapper.find('.drawer__panel').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.find('.drawer__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('does not close on backdrop click when closeOnBackdrop is false', async () => {
    wrapper = mount(Drawer, {
      props: {
        open: true,
        closeOnBackdrop: false,
      },
    })

    await wrapper.find('.drawer__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('closes on Escape keydown only when open is true', async () => {
    wrapper = mount(Drawer, {
      props: {
        open: false,
      },
    })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.setProps({ open: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
