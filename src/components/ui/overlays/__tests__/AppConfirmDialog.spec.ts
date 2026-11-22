import { afterEach, describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { AppConfirmDialog, type ConfirmDialogVariant } from '../index'
import { AppButton } from '../../buttons'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('AppConfirmDialog', () => {
  it('does not render when open is false', () => {
    wrapper = mount(AppConfirmDialog, {
      props: {
        open: false,
        title: 'Deseja sair da conta?',
        description: 'Você precisará entrar novamente.',
      },
    })

    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
  })

  it('renders alertdialog with title, description, accessibility attributes and default labels', () => {
    wrapper = mount(AppConfirmDialog, {
      props: {
        open: true,
        title: 'Deseja sair da conta?',
        description: 'Você precisará entrar novamente.',
      },
    })

    const dialog = wrapper.find('[role="alertdialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')

    const title = wrapper.find('.app-confirm-dialog__title')
    const description = wrapper.find('.app-confirm-dialog__description')
    expect(title.text()).toBe('Deseja sair da conta?')
    expect(description.text()).toBe('Você precisará entrar novamente.')
    expect(dialog.attributes('aria-labelledby')).toBe(title.attributes('id'))
    expect(dialog.attributes('aria-describedby')).toBe(description.attributes('id'))

    const buttons = wrapper.findAllComponents(AppButton)
    expect(buttons).toHaveLength(2)
    expect(buttons[0]?.props('variant')).toBe('ghost')
    expect(buttons[0]?.text()).toBe('Cancelar')
    expect(buttons[1]?.props('variant')).toBe('primary')
    expect(buttons[1]?.text()).toBe('Confirmar')
  })

  it.each(['primary', 'danger'] as ConfirmDialogVariant[])(
    'applies confirmVariant "%s" and custom labels',
    (confirmVariant) => {
      wrapper = mount(AppConfirmDialog, {
        props: {
          open: true,
          title: 'Excluir item',
          description: 'Esta ação não pode ser desfeita.',
          cancelLabel: 'Voltar',
          confirmLabel: 'Excluir',
          confirmVariant,
        },
      })

      const buttons = wrapper.findAllComponents(AppButton)
      expect(buttons[0]?.text()).toBe('Voltar')
      expect(buttons[1]?.text()).toBe('Excluir')
      expect(buttons[1]?.props('variant')).toBe(confirmVariant)
    },
  )

  it('emits confirm when confirm button is clicked', async () => {
    wrapper = mount(AppConfirmDialog, {
      props: {
        open: true,
        title: 'Confirmar ação',
        description: 'Prosseguir?',
      },
    })

    const buttons = wrapper.findAllComponents(AppButton)
    await buttons[1]?.trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('emits cancel and update:open(false) on cancel button click, backdrop click and Escape', async () => {
    wrapper = mount(AppConfirmDialog, {
      props: {
        open: true,
        title: 'Sair',
        description: 'Confirmar saída?',
      },
    })

    const buttons = wrapper.findAllComponents(AppButton)
    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])

    await wrapper.find('.app-confirm-dialog__backdrop').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(2)
    expect(wrapper.emitted('update:open')).toEqual([[false], [false]])

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('cancel')).toHaveLength(3)
    expect(wrapper.emitted('update:open')).toEqual([[false], [false], [false]])
  })

  it('does not emit cancel on Escape when open is false', () => {
    wrapper = mount(AppConfirmDialog, {
      props: {
        open: false,
        title: 'Sair',
        description: 'Confirmar saída?',
      },
    })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
})
