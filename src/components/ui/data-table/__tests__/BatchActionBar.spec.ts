import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { BatchActionBar, type BatchAction } from '../index'
import { Icon } from '../../icons'

const ACTIONS: BatchAction[] = [
  { id: 'download', label: 'baixar', icon: 'download' },
  { id: 'delete', label: 'excluir', icon: 'delete' },
]

describe('BatchActionBar', () => {
  it('renders selected count and default cancel button', () => {
    const wrapper = mount(BatchActionBar, {
      props: {
        selectedCount: 3,
      },
    })

    expect(wrapper.classes()).toContain('batch-action-bar')
    expect(wrapper.find('.batch-action-bar__count').text()).toBe('3 itens selecionados')

    const cancelButton = wrapper.find('.batch-action-bar__button--cancel')
    expect(cancelButton.exists()).toBe(true)
    expect(cancelButton.text()).toBe('cancelar')
  })

  it('supports custom selectionLabel and #count slot', () => {
    const withLabel = mount(BatchActionBar, {
      props: {
        selectedCount: 1,
        selectionLabel: '1 documento marcado',
      },
    })
    expect(withLabel.find('.batch-action-bar__count').text()).toBe('1 documento marcado')

    const withSlot = mount(BatchActionBar, {
      props: {
        selectedCount: 5,
      },
      slots: {
        count: '<span data-testid="custom-count">Selecionados: 5</span>',
      },
    })
    expect(withSlot.find('[data-testid="custom-count"]').text()).toBe('Selecionados: 5')
  })

  it('renders batch actions with optional sm icon and emits action id on click', async () => {
    const wrapper = mount(BatchActionBar, {
      props: {
        selectedCount: 2,
        actions: [...ACTIONS, { id: 'archive', label: 'arquivar' }],
      },
    })

    const actionButtons = wrapper.findAll(
      '.batch-action-bar__button:not(.batch-action-bar__button--cancel)',
    )
    expect(actionButtons).toHaveLength(3)
    expect(actionButtons[0]!.text()).toContain('baixar')
    expect(actionButtons[2]!.find('.batch-action-bar__button-icon').exists()).toBe(false)

    const icons = wrapper.findAllComponents(Icon)
    expect(icons).toHaveLength(2)
    expect(icons[0]!.props('name')).toBe('download')
    expect(icons[0]!.props('size')).toBe('sm')
    expect(icons[1]!.props('name')).toBe('delete')
    expect(icons[1]!.props('size')).toBe('sm')

    await actionButtons[1]!.trigger('click')
    expect(wrapper.emitted('action')).toEqual([['delete']])
  })

  it('emits cancel when cancel button is clicked and hides cancel when showCancel is false', async () => {
    const wrapper = mount(BatchActionBar, {
      props: {
        selectedCount: 2,
        cancelLabel: 'limpar',
      },
    })

    const cancelButton = wrapper.find('.batch-action-bar__button--cancel')
    expect(cancelButton.text()).toBe('limpar')
    await cancelButton.trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)

    const withoutCancel = mount(BatchActionBar, {
      props: {
        selectedCount: 2,
        showCancel: false,
      },
    })
    expect(withoutCancel.find('.batch-action-bar__button--cancel').exists()).toBe(false)
  })

  it('renders custom #actions slot content', () => {
    const wrapper = mount(BatchActionBar, {
      props: {
        selectedCount: 4,
        actions: ACTIONS,
      },
      slots: {
        actions: '<button type="button" data-testid="custom-action">exportar</button>',
      },
    })

    expect(wrapper.find('[data-testid="custom-action"]').exists()).toBe(true)
    expect(wrapper.findAllComponents(Icon)).toHaveLength(0)
  })

  it('renders multiple batch actions alongside cancel inside wrapping actions container', async () => {
    const manyActions: BatchAction[] = [
      ...ACTIONS,
      { id: 'archive', label: 'arquivar' },
      { id: 'duplicate', label: 'duplicar' },
    ]
    const wrapper = mount(BatchActionBar, {
      props: {
        selectedCount: 12,
        actions: manyActions,
      },
    })

    const actionsContainer = wrapper.find('.batch-action-bar__actions')
    expect(actionsContainer.exists()).toBe(true)

    const buttons = actionsContainer.findAll('button.batch-action-bar__button')
    expect(buttons).toHaveLength(5)
    expect(buttons[4]!.classes()).toContain('batch-action-bar__button--cancel')

    await buttons[2]!.trigger('click')
    expect(wrapper.emitted('action')).toEqual([['archive']])
  })
})
