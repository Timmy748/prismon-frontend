import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { WorkflowSlideCard } from '../index'

describe('WorkflowSlideCard', () => {
  it('renders background image, top name + version, badge slot and closed clip-path sheet by default', () => {
    const wrapper = mount(WorkflowSlideCard, {
      props: {
        name: 'análise crítica',
        version: 'Versão: 2.4.0',
        description: 'Avalia contratos e riscos em grafo.',
        imageUrl: '/workflow-hero.jpg',
      },
      slots: {
        badge: '<span data-testid="slide-badge">jurídico</span>',
      },
    })

    expect(wrapper.find('img.workflow-slide-card__image').attributes('src')).toBe(
      '/workflow-hero.jpg',
    )
    expect(wrapper.find('.workflow-slide-card__front').text()).toContain('análise crítica')
    expect(wrapper.find('.workflow-slide-card__front').text()).toContain('Versão: 2.4.0')
    expect(wrapper.find('[data-testid="slide-badge"]').text()).toBe('jurídico')

    const sheet = wrapper.find('.workflow-slide-card__sheet')
    expect(sheet.attributes('aria-hidden')).toBe('true')
    expect(wrapper.classes()).not.toContain('workflow-slide-card--description-open')
  })

  it('expands white description layer via clip-path on description button click without emitting card select', async () => {
    const wrapper = mount(WorkflowSlideCard, {
      props: {
        name: 'síntese executiva',
        version: 'Versão: 2.1.0',
        description: 'Condensa relatórios extensos com rastreabilidade.',
        imageUrl: '/workflow-hero.jpg',
      },
    })

    const openBtn = wrapper.find('button[aria-label="Ver descrição"]')
    expect(openBtn.exists()).toBe(true)

    await openBtn.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
    expect(wrapper.classes()).toContain('workflow-slide-card--description-open')

    const sheet = wrapper.find('.workflow-slide-card__sheet')
    expect(sheet.attributes('aria-hidden')).toBe('false')
    expect(sheet.text()).toContain('síntese executiva')
    expect(sheet.text()).toContain('Versão: 2.1.0')
    expect(sheet.text()).toContain('Condensa relatórios extensos com rastreabilidade.')

    const closeBtn = wrapper.find('button[aria-label="Fechar descrição"]')
    await closeBtn.trigger('click')
    expect(wrapper.classes()).not.toContain('workflow-slide-card--description-open')
  })

  it('emits select when clicking the card surface', async () => {
    const wrapper = mount(WorkflowSlideCard, {
      props: {
        name: 'revisão técnica',
        description: 'Valida arquitetura.',
        imageUrl: '/workflow-hero.jpg',
        selected: true,
      },
    })

    expect(wrapper.classes()).toContain('workflow-slide-card--selected')
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })
})
