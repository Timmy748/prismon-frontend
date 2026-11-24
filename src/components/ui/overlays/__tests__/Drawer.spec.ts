import { afterEach, describe, it, expect, vi } from 'vitest'
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

  it('supports direction modifiers for Vaul multi-edge drawers', () => {
    wrapper = mount(Drawer, {
      props: {
        open: true,
        direction: 'right',
      },
    })

    expect(wrapper.find('.drawer').classes()).toContain('drawer--right')
    expect(wrapper.find('.drawer__handle').exists()).toBe(false)
  })

  it('supports drag-to-dismiss past closeThreshold and snap-back when released early', async () => {
    wrapper = mount(Drawer, {
      props: {
        open: true,
        closeThreshold: 0.25,
      },
    })

    const panel = wrapper.find('.drawer__panel')
    const panelEl = panel.element as HTMLElement
    vi.spyOn(panelEl, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // Small drag (< threshold & slow): snaps back instead of closing
    vi.useFakeTimers()
    await panel.trigger('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    vi.advanceTimersByTime(300)
    await panel.trigger('pointermove', { pointerId: 1, clientX: 100, clientY: 130 })
    await panel.trigger('pointerup', { pointerId: 1, clientX: 100, clientY: 130 })
    vi.useRealTimers()

    expect(wrapper.emitted('drag')).toBeTruthy()
    expect(wrapper.emitted('release')).toEqual([[true]])
    expect(wrapper.emitted('close')).toBeUndefined()

    // Drag past closeThreshold (25% of 400 = 100px): dismisses
    await panel.trigger('pointerdown', { button: 0, pointerId: 2, clientX: 100, clientY: 100 })
    await panel.trigger('pointermove', { pointerId: 2, clientX: 100, clientY: 260 })
    await panel.trigger('pointerup', { pointerId: 2, clientX: 100, clientY: 260 })

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('supports Vaul snapPoints and ignores drag when handleOnly is true outside handle', async () => {
    wrapper = mount(Drawer, {
      props: {
        open: true,
        handleOnly: true,
        snapPoints: [0.4, 0.9],
        activeSnapPoint: 0.9,
      },
      slots: {
        default: '<div data-testid="drawer-content">Conteúdo</div>',
      },
    })

    const panel = wrapper.find('.drawer__panel')
    vi.spyOn(panel.element as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 500,
      top: 0,
      left: 0,
      right: 400,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // Dragging body when handleOnly is true should be ignored
    await wrapper.find('[data-testid="drawer-content"]').trigger('pointerdown', {
      button: 0,
      pointerId: 3,
      clientX: 100,
      clientY: 100,
    })
    await panel.trigger('pointermove', { pointerId: 3, clientX: 100, clientY: 320 })
    await panel.trigger('pointerup', { pointerId: 3, clientX: 100, clientY: 320 })
    expect(wrapper.emitted('drag')).toBeUndefined()

    // Dragging handle slowly to 40% offset (300px) snaps to nearest snap point (0.4)
    vi.useFakeTimers()
    const handleHit = wrapper.find('.drawer__handle-hit')
    await handleHit.trigger('pointerdown', { button: 0, pointerId: 4, clientX: 100, clientY: 50 })
    vi.advanceTimersByTime(400)
    await panel.trigger('pointermove', { pointerId: 4, clientX: 100, clientY: 290 })
    await panel.trigger('pointerup', { pointerId: 4, clientX: 100, clientY: 290 })
    vi.useRealTimers()

    expect(wrapper.emitted('update:activeSnapPoint')).toEqual([[0.4]])
  })
})
