import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { WorkflowCard } from '../index'

describe('WorkflowCard', () => {
  it('renders name and description with unselected default state', () => {
    const wrapper = mount(WorkflowCard, {
      props: {
        name: 'Revisão Jurídica',
        description: 'Extrai cláusulas críticas e sugere ajustes.',
      },
    })

    expect(wrapper.classes()).toContain('workflow-card')
    expect(wrapper.classes()).not.toContain('workflow-card--selected')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('.workflow-card__name').text()).toBe('Revisão Jurídica')
    expect(wrapper.find('.workflow-card__description').text()).toBe(
      'Extrai cláusulas críticas e sugere ajustes.',
    )
    expect(wrapper.find('.workflow-card__version').exists()).toBe(false)
    expect(wrapper.find('.workflow-card__badge').exists()).toBe(false)
  })

  it('renders version and #badge slot when provided', () => {
    const wrapper = mount(WorkflowCard, {
      props: {
        name: 'Auditoria Fiscal',
        description: 'Valida notas fiscais.',
        version: 'Versão: 1.0.0',
      },
      slots: {
        badge: '<span data-testid="workflow-badge">Ativo</span>',
      },
    })

    expect(wrapper.find('.workflow-card__version').text()).toBe('Versão: 1.0.0')
    expect(wrapper.find('.workflow-card__badge [data-testid="workflow-badge"]').text()).toBe(
      'Ativo',
    )
  })

  it('applies workflow-card--selected modifier and aria-pressed when selected is true', () => {
    const wrapper = mount(WorkflowCard, {
      props: {
        name: 'Resumo Executivo',
        description: 'Gera síntese executiva.',
        selected: true,
      },
    })

    expect(wrapper.classes()).toContain('workflow-card')
    expect(wrapper.classes()).toContain('workflow-card--selected')
    expect(wrapper.attributes('aria-pressed')).toBe('true')
  })

  it('emits select event when clicked', async () => {
    const wrapper = mount(WorkflowCard, {
      props: {
        name: 'Classificador',
        description: 'Classifica documentos por categoria.',
      },
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')).toHaveLength(1)
  })
})
