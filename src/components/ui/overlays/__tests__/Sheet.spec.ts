import { afterEach, describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { Sheet, type SheetSize } from '../index'
import { IconButton } from '../../buttons'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('Sheet', () => {
  it('does not render when open is false', () => {
    wrapper = mount(Sheet, {
      props: {
        open: false,
        title: 'Propriedades',
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders panel with accessibility attributes, title, slot content and default md modifier', () => {
    wrapper = mount(Sheet, {
      props: {
        open: true,
        title: 'Configurar agente',
      },
      slots: {
        default: '<div data-testid="sheet-content">Formulário lateral</div>',
      },
    })

    const root = wrapper.find('.sheet')
    expect(root.classes()).toContain('sheet--md')

    const panel = wrapper.find('[role="dialog"]')
    expect(panel.exists()).toBe(true)
    expect(panel.attributes('aria-modal')).toBe('true')

    const title = wrapper.find('.sheet__title')
    expect(title.text()).toBe('Configurar agente')
    expect(panel.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(wrapper.find('[data-testid="sheet-content"]').text()).toBe('Formulário lateral')
  })

  it.each(['md', 'lg'] as SheetSize[])('applies size BEM modifier sheet--%s', (size) => {
    wrapper = mount(Sheet, {
      props: {
        open: true,
        title: 'Painel',
        size,
      },
    })

    const root = wrapper.find('.sheet')
    expect(root.classes()).toContain('sheet')
    expect(root.classes()).toContain(`sheet--${size}`)
  })

  it('emits close and update:open(false) on close button click with custom closeLabel', async () => {
    wrapper = mount(Sheet, {
      props: {
        open: true,
        title: 'Painel',
        closeLabel: 'Fechar configurações',
      },
    })

    const closeButton = wrapper.findComponent(IconButton)
    expect(closeButton.props('variant')).toBe('ghost')
    expect(closeButton.props('icon')).toBe('close')
    expect(closeButton.props('ariaLabel')).toBe('Fechar configurações')

    await closeButton.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('closes on backdrop click when closeOnBackdrop is true and ignores clicks inside panel', async () => {
    wrapper = mount(Sheet, {
      props: {
        open: true,
        title: 'Painel',
      },
    })

    await wrapper.find('.sheet__panel').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.find('.sheet__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('does not close on backdrop click when closeOnBackdrop is false', async () => {
    wrapper = mount(Sheet, {
      props: {
        open: true,
        title: 'Painel',
        closeOnBackdrop: false,
      },
    })

    await wrapper.find('.sheet__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('closes on Escape keydown only when open is true', async () => {
    wrapper = mount(Sheet, {
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

  it('renders left stage #preview slot beside the right panel and closes on stage backdrop click', async () => {
    wrapper = mount(Sheet, {
      props: {
        open: true,
        title: 'Detalhes',
      },
      slots: {
        preview: '<div data-testid="sheet-left-preview">Preview visual</div>',
        default: '<div data-testid="sheet-right-details">Metadados</div>',
      },
    })

    const stage = wrapper.find('.sheet__stage')
    expect(stage.exists()).toBe(true)
    expect(stage.find('[data-testid="sheet-left-preview"]').text()).toBe('Preview visual')
    expect(wrapper.find('.sheet__panel [data-testid="sheet-right-details"]').exists()).toBe(true)

    await stage.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
