import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { WorkflowStepsAccordion, type WorkflowStep } from '../index'
import { AppIcon } from '../../icons'

const STEPS: WorkflowStep[] = [
  { id: 'step-1', title: '1. Extração de Dados' },
  { id: 'step-2', title: '2. Validação Semântica' },
]

describe('WorkflowStepsAccordion', () => {
  it('renders all steps collapsed by default with arrow-down lg icons', () => {
    const wrapper = mount(WorkflowStepsAccordion, {
      props: { steps: STEPS },
    })

    expect(wrapper.classes()).toContain('workflow-steps-accordion')

    const items = wrapper.findAll('.workflow-steps-accordion__item')
    expect(items).toHaveLength(2)
    expect(items[0]?.classes()).not.toContain('workflow-steps-accordion__item--open')
    expect(items[1]?.classes()).not.toContain('workflow-steps-accordion__item--open')

    const triggers = wrapper.findAll('.workflow-steps-accordion__trigger')
    expect(triggers[0]?.attributes('aria-expanded')).toBe('false')
    expect(triggers[0]?.find('.workflow-steps-accordion__title').text()).toBe(
      '1. Extração de Dados',
    )
    expect(triggers[1]?.attributes('aria-expanded')).toBe('false')
    expect(triggers[1]?.find('.workflow-steps-accordion__title').text()).toBe(
      '2. Validação Semântica',
    )

    const icons = wrapper.findAllComponents(AppIcon)
    expect(icons).toHaveLength(2)
    for (const icon of icons) {
      expect(icon.props('name')).toBe('arrow-down')
      expect(icon.props('size')).toBe('lg')
    }

    expect(wrapper.find('.workflow-steps-accordion__content').exists()).toBe(false)
  })

  it('opens steps listed in defaultOpenIds and renders scoped #step slot', () => {
    const wrapper = mount(WorkflowStepsAccordion, {
      props: {
        steps: STEPS,
        defaultOpenIds: ['step-2'],
      },
      slots: {
        step: `<template #step="{ step, index }">
          <div :data-testid="'panel-' + step.id">{{ index }} - {{ step.title }}</div>
        </template>`,
      },
    })

    const items = wrapper.findAll('.workflow-steps-accordion__item')
    expect(items[0]?.classes()).not.toContain('workflow-steps-accordion__item--open')
    expect(items[1]?.classes()).toContain('workflow-steps-accordion__item--open')

    const triggers = wrapper.findAll('.workflow-steps-accordion__trigger')
    expect(triggers[0]?.attributes('aria-expanded')).toBe('false')
    expect(triggers[1]?.attributes('aria-expanded')).toBe('true')

    expect(wrapper.find('[data-testid="panel-step-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="panel-step-2"]').text()).toBe('1 - 2. Validação Semântica')
  })

  it('toggles step open and closed on trigger click and emits toggle event', async () => {
    const wrapper = mount(WorkflowStepsAccordion, {
      props: { steps: STEPS },
      slots: {
        step: `<template #step="{ step }">
          <div :data-testid="'content-' + step.id">Conteúdo {{ step.id }}</div>
        </template>`,
      },
    })

    const firstTrigger = wrapper.findAll('.workflow-steps-accordion__trigger')[0]
    await firstTrigger?.trigger('click')

    expect(wrapper.find('[data-testid="content-step-1"]').exists()).toBe(true)
    expect(firstTrigger?.attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('.workflow-steps-accordion__item')[0]?.classes()).toContain(
      'workflow-steps-accordion__item--open',
    )

    await firstTrigger?.trigger('click')

    expect(wrapper.find('[data-testid="content-step-1"]').exists()).toBe(false)
    expect(firstTrigger?.attributes('aria-expanded')).toBe('false')
    expect(wrapper.findAll('.workflow-steps-accordion__item')[0]?.classes()).not.toContain(
      'workflow-steps-accordion__item--open',
    )

    expect(wrapper.emitted('toggle')).toEqual([
      ['step-1', true],
      ['step-1', false],
    ])
  })
})
