import { afterEach, describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { AppSheet, type SheetSize } from '../index'
import { AppIconButton } from '../../buttons'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('AppSheet', () => {
  it('does not render when open is false', () => {
    wrapper = mount(AppSheet, {
      props: {
        open: false,
        title: 'Propriedades',
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders panel with accessibility attributes, title, slot content and default md modifier', () => {
    wrapper = mount(AppSheet, {
      props: {
        open: true,
        title: 'Configurar agente',
      },
      slots: {
        default: '<div data-testid="sheet-content">Formulário lateral</div>',
      },
    })

    const root = wrapper.find('.app-sheet')
    expect(root.classes()).toContain('app-sheet--md')

    const panel = wrapper.find('[role="dialog"]')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('aria-modal')).toBe('true')

    const title = wrapper.find('.app-sheet__title')
    expect(title.text()).toBe('Configurar agente')
    expect(panel.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(wrapper.find('[data-testid="sheet-content"]').text()).toBe('Formulário lateral')
  })

  it.each(['md', 'lg'] as SheetSize[])('applies size BEM modifier app-sheet--%s', (size) => {
    wrapper = mount(AppSheet, {
      props: {
        open: true,
        title: 'Painel',
        size,
      },
    })

    const root = wrapper.find('.app-sheet')
    expect(root.classes()).toContain('app-sheet')
    expect(root.classes()).toContain(`app-sheet--${size}`)
  })

  it('emits close and update:open(false) on close button click with custom closeLabel', async () => {
    wrapper = mount(AppSheet, {
      props: {
        open: true,
        title: 'Painel',
        closeLabel: 'Fechar configurações',
      },
    })

    const closeButton = wrapper.findComponent(AppIconButton)
    expect(closeButton.props('variant')).toBe('ghost')
    expect(closeButton.props('icon')).toBe('close')
    expect(closeButton.props('ariaLabel')).toBe('Fechar configurações')

    await closeButton.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('closes on backdrop click when closeOnBackdrop is true and ignores clicks inside panel', async () => {
    wrapper = mount(AppSheet, {
      props: {
        open: true,
        title: 'Painel',
      },
    })

    await wrapper.find('.app-sheet__panel').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.find('.app-sheet__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('does not close on backdrop click when closeOnBackdrop is false', async () => {
    wrapper = mount(AppSheet, {
      props: {
        open: true,
        title: 'Painel',
        closeOnBackdrop: false,
      },
    })

    await wrapper.find('.app-sheet__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('closes on Escape keydown only when open is true', async () => {
    wrapper = mount(AppSheet, {
      props: {
        open: false,
        title: 'Painel',
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
