import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { DocumentDetails, type DocumentHistoryEntry, type DocumentTagItem } from '../index'
import { Tag } from '../../badges'
import { IconButton } from '../../buttons'
import { Icon } from '../../icons'

const sampleTags: DocumentTagItem[] = [
  { id: 't1', label: 'Contrato' },
  { id: 't2', label: 'Financeiro' },
]

const sampleHistory: DocumentHistoryEntry[] = [
  {
    id: 'h1',
    summary: 'Atualizou cláusula de vigência',
    author: 'Ana Silva',
    date: '2026-11-20',
  },
  {
    id: 'h2',
    summary: 'Criou documento inicial',
    author: 'Carlos Souza',
    date: '2026-11-18',
  },
]

describe('DocumentDetails', () => {
  it('renders title, description, header-actions slot and default history title', () => {
    const wrapper = mount(DocumentDetails, {
      props: {
        title: 'Contrato de Prestação de Serviços',
        description: 'Documento referente ao escopo anual de serviços.',
      },
      slots: {
        'header-actions': '<button data-testid="edit-btn">Editar</button>',
      },
    })

    expect(wrapper.find('.document-details__title').text()).toBe(
      'Contrato de Prestação de Serviços',
    )
    expect(wrapper.find('.document-details__description').text()).toBe(
      'Documento referente ao escopo anual de serviços.',
    )
    expect(wrapper.find('[data-testid="edit-btn"]').exists()).toBe(true)
    expect(wrapper.find('.document-details__history-title').text()).toBe(
      'Histórico de modificações',
    )
  })

  it('renders tags and emits add-tag and remove-tag events', async () => {
    const wrapper = mount(DocumentDetails, {
      props: {
        title: 'Política Interna',
        tags: sampleTags,
        editableTags: true,
        addTagLabel: 'Vincular tag',
      },
    })

    const tagComponents = wrapper.findAllComponents(Tag)
    expect(tagComponents).toHaveLength(2)
    expect(tagComponents[0]?.props('label')).toBe('Contrato')
    expect(tagComponents[0]?.props('dismissible')).toBe(true)
    expect(tagComponents[1]?.props('label')).toBe('Financeiro')

    const addButton = wrapper.findComponent(IconButton)
    expect(addButton.exists()).toBe(true)
    expect(addButton.props('variant')).toBe('ghost')
    expect(addButton.props('icon')).toBe('tag')
    expect(addButton.props('ariaLabel')).toBe('Vincular tag')
    expect(addButton.attributes('aria-label')).toBe('Vincular tag')

    await addButton.trigger('click')
    expect(wrapper.emitted('add-tag')).toEqual([[]])

    await tagComponents[1]!.find('.tag__dismiss').trigger('click')
    expect(wrapper.emitted('remove-tag')).toEqual([['t2']])
  })

  it('does not show tag dismiss buttons when editableTags is false and hides add button when showAddTag is false', () => {
    const wrapper = mount(DocumentDetails, {
      props: {
        title: 'Manual',
        tags: sampleTags,
        editableTags: false,
        showAddTag: false,
      },
    })

    const tagComponents = wrapper.findAllComponents(Tag)
    expect(tagComponents).toHaveLength(2)
    expect(tagComponents[0]?.props('dismissible')).toBe(false)
    expect(wrapper.find('.tag__dismiss').exists()).toBe(false)
    expect(wrapper.findComponent(IconButton).exists()).toBe(false)
  })

  it('renders history entries with summary, author, date and helper icons', () => {
    const wrapper = mount(DocumentDetails, {
      props: {
        title: 'Ata de Reunião',
        historyTitle: 'Alterações recentes',
        history: sampleHistory,
      },
    })

    expect(wrapper.find('.document-details__history-title').text()).toBe('Alterações recentes')

    const items = wrapper.findAll('.document-details__history-item')
    expect(items).toHaveLength(2)

    const firstItem = items[0]!
    expect(firstItem.find('.document-details__history-summary').text()).toBe(
      'Atualizou cláusula de vigência',
    )
    expect(firstItem.text()).toContain('Ana Silva')
    expect(firstItem.text()).toContain('2026-11-20')

    const icons = firstItem.findAllComponents(Icon)
    expect(icons).toHaveLength(2)
    expect(icons[0]?.props('name')).toBe('people')
    expect(icons[0]?.props('size')).toBe('sm')
    expect(icons[0]?.props('color')).toBe('helper')
    expect(icons[1]?.props('name')).toBe('calendar')
    expect(icons[1]?.props('size')).toBe('sm')
    expect(icons[1]?.props('color')).toBe('helper')
  })

  it('handles omitted optional description, tags and history cleanly', () => {
    const wrapper = mount(DocumentDetails, {
      props: {
        title: 'Documento Vazio',
        showAddTag: false,
      },
    })

    expect(wrapper.find('.document-details__description').exists()).toBe(false)
    expect(wrapper.find('.document-details__tags-row').exists()).toBe(false)
    expect(wrapper.find('.document-details__history-list').exists()).toBe(false)
  })
})
