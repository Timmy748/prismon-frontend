import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  DataTable,
  Pagination,
  BatchActionBar,
  type DataTableColumn,
  type BatchAction,
} from '../index'
import { Button } from '../../buttons'

const COLUMNS: DataTableColumn[] = [
  { key: 'name', label: 'Nome' },
  { key: 'role', label: 'Função', align: 'center' },
  { key: 'status', label: 'Status', align: 'right' },
]

const ROWS = [
  { id: 'u1', name: 'Ana Silva', role: 'Admin', status: 'Ativo' },
  { id: 'u2', name: 'Bruno Costa', role: 'Editor', status: 'Inativo' },
]

const BATCH_ACTIONS: BatchAction[] = [{ id: 'delete', label: 'excluir', icon: 'delete' }]

describe('DataTable', () => {
  it('renders columns and rows in semantic table without checkboxes', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: COLUMNS,
        rows: ROWS,
      },
    })

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    expect(wrapper.find('.data-table__header').exists()).toBe(false)
    expect(wrapper.find('.data-table__toolbar').exists()).toBe(false)

    const headers = wrapper.findAll('thead th.data-table__header-cell')
    expect(headers).toHaveLength(3)
    expect(headers.map((th) => th.text())).toEqual(['Nome', 'Função', 'Status'])
    expect(headers[1]!.classes()).toContain('data-table__header-cell--align-center')
    expect(headers[2]!.classes()).toContain('data-table__header-cell--align-right')

    const bodyRows = wrapper.findAll('tbody tr.data-table__row')
    expect(bodyRows).toHaveLength(2)

    const firstRowCells = bodyRows[0]!.findAll('td.data-table__cell')
    expect(firstRowCells.map((td) => td.text())).toEqual(['Ana Silva', 'Admin', 'Ativo'])
    expect(firstRowCells[1]!.classes()).toContain('data-table__cell--align-center')
    expect(firstRowCells[2]!.classes()).toContain('data-table__cell--align-right')
  })

  it('renders optional header with title and description', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Membros',
        description: 'Gerencie os acessos da equipe.',
        columns: COLUMNS,
        rows: ROWS,
      },
    })

    expect(wrapper.find('.data-table__header').exists()).toBe(true)
    expect(wrapper.find('.data-table__title').text()).toBe('Membros')
    expect(wrapper.find('.data-table__description').text()).toBe('Gerencie os acessos da equipe.')
  })

  it('supports custom cell slots #cell-<key> with row, value and rowIndex', () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: COLUMNS,
        rows: ROWS,
      },
      slots: {
        'cell-status': `
          <template #cell-status="{ row, value, rowIndex }">
            <span data-testid="custom-status">{{ rowIndex }}:{{ row.id }}:{{ value }}</span>
          </template>
        `,
      },
    })

    const customCells = wrapper.findAll('[data-testid="custom-status"]')
    expect(customCells).toHaveLength(2)
    expect(customCells[0]!.text()).toBe('0:u1:Ativo')
    expect(customCells[1]!.text()).toBe('1:u2:Inativo')
  })

  it('renders pagination and primary action in toolbar and emits toolbar events', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: COLUMNS,
        rows: ROWS,
        showPagination: true,
        canPrevious: false,
        canNext: true,
        actionLabel: 'Adicionar membro',
        actionIcon: 'add-member',
      },
    })

    const pagination = wrapper.findComponent(Pagination)
    expect(pagination.exists()).toBe(true)
    expect(pagination.props('canPrevious')).toBe(false)
    expect(pagination.props('canNext')).toBe(true)

    const primaryButton = wrapper.findComponent(Button)
    expect(primaryButton.exists()).toBe(true)
    expect(primaryButton.props('icon')).toBe('add-member')
    expect(primaryButton.text()).toContain('Adicionar membro')

    const paginationButtons = pagination.findAll('button')
    await paginationButtons[1]!.trigger('click')
    await primaryButton.trigger('click')

    expect(wrapper.emitted('next-page')).toHaveLength(1)
    expect(wrapper.emitted('primary-action')).toHaveLength(1)
  })

  it('emits row-click without toggle-select when selectable is false', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: COLUMNS,
        rows: ROWS,
        selectable: false,
      },
    })

    const firstRow = wrapper.findAll('tbody tr')[0]!
    expect(firstRow.classes()).not.toContain('data-table__row--selectable')

    await firstRow.trigger('click')
    expect(wrapper.emitted('row-click')).toEqual([[ROWS[0], 0]])
    expect(wrapper.emitted('toggle-select')).toBeUndefined()
  })

  it('handles selectable rows via click and keyboard without checkboxes', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: COLUMNS,
        rows: ROWS,
        selectable: true,
        selectedRowKeys: ['u2'],
      },
    })

    const bodyRows = wrapper.findAll('tbody tr')
    expect(bodyRows[0]!.classes()).toContain('data-table__row--selectable')
    expect(bodyRows[0]!.classes()).not.toContain('data-table__row--selected')
    expect(bodyRows[0]!.attributes('aria-selected')).toBe('false')

    expect(bodyRows[1]!.classes()).toContain('data-table__row--selectable')
    expect(bodyRows[1]!.classes()).toContain('data-table__row--selected')
    expect(bodyRows[1]!.attributes('aria-selected')).toBe('true')

    await bodyRows[0]!.trigger('click')
    expect(wrapper.emitted('row-click')?.[0]).toEqual([ROWS[0], 0])
    expect(wrapper.emitted('toggle-select')?.[0]).toEqual(['u1', ROWS[0]])

    await bodyRows[1]!.trigger('keydown.enter')
    expect(wrapper.emitted('toggle-select')?.[1]).toEqual(['u2', ROWS[1]])
  })

  it('shows BatchActionBar when selectedRowKeys is non-empty and relays events', async () => {
    const wrapperWithoutSelection = mount(DataTable, {
      props: {
        columns: COLUMNS,
        rows: ROWS,
        selectable: true,
        selectedRowKeys: [],
        batchActions: BATCH_ACTIONS,
      },
    })
    expect(wrapperWithoutSelection.findComponent(BatchActionBar).exists()).toBe(false)

    const wrapper = mount(DataTable, {
      props: {
        columns: COLUMNS,
        rows: ROWS,
        selectable: true,
        selectedRowKeys: ['u1', 'u2'],
        batchActions: BATCH_ACTIONS,
      },
    })

    const batchBar = wrapper.findComponent(BatchActionBar)
    expect(batchBar.exists()).toBe(true)
    expect(batchBar.props('selectedCount')).toBe(2)
    expect(batchBar.props('actions')).toEqual(BATCH_ACTIONS)

    const deleteButton = batchBar.find(
      '.batch-action-bar__button:not(.batch-action-bar__button--cancel)',
    )
    const cancelButton = batchBar.find('.batch-action-bar__button--cancel')

    await deleteButton.trigger('click')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('batch-action')).toEqual([['delete']])
    expect(wrapper.emitted('clear-selection')).toHaveLength(1)
  })

  it('positions batch wrapper inside container below table wrapper and toggles on selection changes', async () => {
    const wrapper = mount(DataTable, {
      props: {
        columns: COLUMNS,
        rows: ROWS,
        selectable: true,
        selectedRowKeys: [],
        batchActions: BATCH_ACTIONS,
      },
    })

    const container = wrapper.find('.data-table__container')
    expect(container.exists()).toBe(true)
    expect(container.find('.data-table__table-wrapper').exists()).toBe(true)
    expect(container.find('.data-table__batch-wrapper').exists()).toBe(false)

    await wrapper.setProps({ selectedRowKeys: ['u1'] })
    const batchWrapper = container.find('.data-table__batch-wrapper')
    expect(batchWrapper.exists()).toBe(true)
    expect(batchWrapper.find('.data-table__batch-inner').exists()).toBe(true)
    expect(batchWrapper.findComponent(BatchActionBar).props('selectedCount')).toBe(1)

    await wrapper.setProps({ selectedRowKeys: [] })
    expect(container.find('.data-table__batch-wrapper').exists()).toBe(false)
  })
})
