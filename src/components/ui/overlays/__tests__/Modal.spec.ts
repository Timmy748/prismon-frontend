import { afterEach, describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { Modal, type ModalSize } from '../index'
import { IconButton } from '../../buttons'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('Modal', () => {
  it('does not render dialog when open is false', () => {
    wrapper = mount(Modal, {
      props: {
        open: false,
        title: 'Configurações',
      },
    })

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.find('.modal__backdrop').exists()).toBe(false)
  })

  it('renders dialog with accessibility attributes, title, default slot and sm modifier by default', () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        title: 'Novo fluxo',
      },
      slots: {
        default: '<p data-testid="modal-body">Conteúdo do modal</p>',
      },
    })

    const root = wrapper.find('.modal')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('modal--sm')

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')

    const title = wrapper.find('.modal__title')
    expect(title.text()).toBe('Novo fluxo')
    expect(dialog.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(dialog.attributes('aria-describedby')).toBeUndefined()

    expect(wrapper.find('[data-testid="modal-body"]').text()).toBe('Conteúdo do modal')
    expect(wrapper.find('.modal__footer').exists()).toBe(false)
  })

  it('renders optional subtitle and binds aria-describedby', () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        title: 'Novo fluxo',
        subtitle: 'Preencha os detalhes abaixo',
      },
    })

    const dialog = wrapper.find('[role="dialog"]')
    const subtitle = wrapper.find('.modal__subtitle')
    expect(subtitle.exists()).toBe(true)
    expect(subtitle.text()).toBe('Preencha os detalhes abaixo')
    expect(dialog.attributes('aria-describedby')).toBe(subtitle.attributes('id'))
  })

  it('renders optional #footer slot when provided', () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        title: 'Editar',
      },
      slots: {
        default: 'Corpo',
        footer: '<button data-testid="save-btn">Salvar</button>',
      },
    })

    const footer = wrapper.find('.modal__footer')
    expect(footer.exists()).toBe(true)
    expect(footer.find('[data-testid="save-btn"]').exists()).toBe(true)
  })

  it.each(['sm', 'md', 'lg'] as ModalSize[])('applies size BEM modifier modal--%s', (size) => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        title: 'Modal',
        size,
      },
    })

    const root = wrapper.find('.modal')
    expect(root.classes()).toContain('modal')
    expect(root.classes()).toContain(`modal--${size}`)
  })

  it('emits close and update:open(false) when close button is clicked and respects closeLabel', async () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        title: 'Detalhes',
        closeLabel: 'Encerrar janela',
      },
    })

    const closeButton = wrapper.findComponent(IconButton)
    expect(closeButton.exists()).toBe(true)
    expect(closeButton.props('variant')).toBe('ghost')
    expect(closeButton.props('icon')).toBe('close')
    expect(closeButton.props('ariaLabel')).toBe('Encerrar janela')

    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('closes on backdrop click when closeOnBackdrop is true and ignores clicks inside dialog', async () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        title: 'Detalhes',
      },
    })

    await wrapper.find('.modal__dialog').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.find('.modal__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('does not close on backdrop click when closeOnBackdrop is false', async () => {
    wrapper = mount(Modal, {
      props: {
        open: true,
        title: 'Bloqueado',
        closeOnBackdrop: false,
      },
    })

    await wrapper.find('.modal__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('closes on Escape keydown only when open is true', async () => {
    wrapper = mount(Modal, {
      props: {
        open: false,
        title: 'Modal',
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
