import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  DocumentDetails,
  ModificationEvent,
  RepertoryItemDetails,
  type RepertoryItemHistoryEntry,
  type RepertoryItemTag,
} from '../index'
import { Tag } from '../../badges'
import { IconButton } from '../../buttons'
import { Icon } from '../../icons'
import { ScrollContainer } from '../../layout'

const sampleTags: RepertoryItemTag[] = [
  { id: 't1', label: 'Contrato' },
  { id: 't2', label: 'Financeiro' },
]

const sampleHistory: RepertoryItemHistoryEntry[] = [
  {
    id: 'h1',
    title: 'Alteração de cláusula',
    summary: 'Atualizou cláusula de vigência',
    author: 'Ana Silva',
    date: '2026-11-20',
  },
  {
    id: 'h2',
    title: 'Criação do documento',
    summary: 'Criou documento inicial',
    author: 'Carlos Souza',
    date: '2026-11-18',
  },
]

describe('RepertoryItemDetails (DocumentDetails)', () => {
  it('exposes DocumentDetails compatibility alias', () => {
    expect(DocumentDetails).toBe(RepertoryItemDetails)
  })

  it('renders title, description, header-actions slot and default history title', () => {
    const wrapper = mount(RepertoryItemDetails, {
      props: {
        title: 'Contrato de Prestação de Serviços',
        description: 'Documento referente ao escopo anual de serviços.',
      },
      slots: {
        'header-actions': '<button data-testid="edit-btn">Editar</button>',
      },
    })

    expect(wrapper.find('.repertory-item-details__title').text()).toBe(
      'Contrato de Prestação de Serviços',
    )
    expect(wrapper.find('.repertory-item-details__description').text()).toBe(
      'Documento referente ao escopo anual de serviços.',
    )
    expect(wrapper.find('[data-testid="edit-btn"]').exists()).toBe(true)
    expect(wrapper.find('.repertory-item-details__history-title').text()).toBe(
      'Histórico de modificações',
    )
    expect(wrapper.find('.repertory-item-details__preview').exists()).toBe(false)
  })

  it('renders image asset preview and document excerpt preview', () => {
    const assetWrapper = mount(RepertoryItemDetails, {
      props: {
        title: 'Ilustração Prismon Hero',
        previewType: 'image',
        previewUrl: '/img/hero.jpg',
        previewLabel: 'JPG',
        previewMeta: '1376x768 px • 896 KB',
      },
    })

    expect(assetWrapper.find('.repertory-item-details__preview').exists()).toBe(true)
    expect(assetWrapper.find('.repertory-item-details__preview-image').attributes('src')).toBe(
      '/img/hero.jpg',
    )
    expect(assetWrapper.text()).toContain('1376x768 px • 896 KB')
    expect(assetWrapper.text()).toContain('JPG')

    const docWrapper = mount(RepertoryItemDetails, {
      props: {
        title: 'Manual de Identidade',
        previewType: 'document',
        previewLabel: 'PDF',
        previewMeta: 'PDF • 2.4 MB • 14 páginas',
        previewExcerpt: 'Capítulo 1: Princípios tipográficos e semânticos.',
      },
    })

    expect(docWrapper.find('.repertory-item-details__preview-doc').exists()).toBe(true)
    expect(docWrapper.text()).toContain('PDF • 2.4 MB • 14 páginas')
    expect(docWrapper.text()).toContain('Capítulo 1: Princípios tipográficos e semânticos.')
  })

  it('renders tags and emits add-tag and remove-tag events', async () => {
    const wrapper = mount(RepertoryItemDetails, {
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
    const wrapper = mount(RepertoryItemDetails, {
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

  it('renders history entries using ModificationEvent with title, summary, author, date and helper icons', () => {
    const wrapper = mount(RepertoryItemDetails, {
      props: {
        title: 'Ata de Reunião',
        historyTitle: 'Alterações recentes',
        history: sampleHistory,
      },
    })

    expect(wrapper.find('.repertory-item-details__history-title').text()).toBe(
      'Alterações recentes',
    )

    const events = wrapper.findAllComponents(ModificationEvent)
    expect(events).toHaveLength(2)

    const firstEvent = events[0]!
    expect(firstEvent.find('.modification-event__title').text()).toBe('Alteração de cláusula')
    expect(firstEvent.find('.modification-event__summary').text()).toBe(
      'Atualizou cláusula de vigência',
    )
    expect(firstEvent.text()).toContain('Ana Silva')
    expect(firstEvent.text()).toContain('2026-11-20')

    const icons = firstEvent.findAllComponents(Icon)
    expect(icons).toHaveLength(2)
    expect(icons[0]?.props('name')).toBe('people')
    expect(icons[0]?.props('size')).toBe('sm')
    expect(icons[0]?.props('color')).toBe('helper')
    expect(icons[1]?.props('name')).toBe('calendar')
    expect(icons[1]?.props('size')).toBe('sm')
    expect(icons[1]?.props('color')).toBe('helper')
  })

  it('handles omitted optional description, tags and history cleanly', () => {
    const wrapper = mount(RepertoryItemDetails, {
      props: {
        title: 'Documento Vazio',
        showAddTag: false,
      },
    })

    expect(wrapper.find('.repertory-item-details__description').exists()).toBe(false)
    expect(wrapper.find('.repertory-item-details__tags-row').exists()).toBe(false)
    expect(wrapper.find('.repertory-item-details__history-list').exists()).toBe(false)
  })

  it('renders tags inside horizontal ScrollContainer without masking the add-tag button', async () => {
    const wrapper = mount(RepertoryItemDetails, {
      props: {
        title: 'Documento com muitas tags',
        tags: sampleTags,
        showAddTag: true,
      },
    })

    const scrollContainer = wrapper.findComponent(ScrollContainer)
    const scroller = scrollContainer.find('.scroll-container__track')
    const addButton = wrapper.find('.repertory-item-details__add-tag')

    expect(scrollContainer.exists()).toBe(true)
    expect(scrollContainer.props('direction')).toBe('horizontal')
    expect(addButton.exists()).toBe(true)
    expect(scrollContainer.find('.repertory-item-details__add-tag').exists()).toBe(false)

    const el = scroller.element as HTMLElement
    Object.defineProperty(el, 'scrollWidth', { value: 400, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: 200, configurable: true })
    Object.defineProperty(el, 'scrollLeft', { value: 0, writable: true, configurable: true })

    await scroller.trigger('scroll')
    expect(scroller.classes()).toContain('scroll-container__track--mask-end')
    expect(scroller.classes()).not.toContain('scroll-container__track--mask-start')

    el.scrollLeft = 80
    await scroller.trigger('scroll')
    expect(scroller.classes()).toContain('scroll-container__track--mask-both')

    el.scrollLeft = 200
    await scroller.trigger('scroll')
    expect(scroller.classes()).toContain('scroll-container__track--mask-start')
    expect(scroller.classes()).not.toContain('scroll-container__track--mask-end')
  })
})
