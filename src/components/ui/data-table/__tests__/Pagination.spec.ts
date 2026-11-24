import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Pagination } from '../index'
import { IconButton } from '../../buttons'
import { Icon } from '../../icons'

describe('Pagination', () => {
  it('renders two ghost IconButton controls with arrow-left and arrow-right icons', () => {
    const wrapper = mount(Pagination)

    const buttons = wrapper.findAllComponents(IconButton)
    expect(buttons).toHaveLength(2)

    const prevButton = buttons[0]!
    const nextButton = buttons[1]!

    expect(prevButton.props('variant')).toBe('ghost')
    expect(prevButton.props('icon')).toBe('arrow-left')
    expect(prevButton.props('ariaLabel')).toBe('Página anterior')
    expect(prevButton.props('disabled')).toBe(false)

    expect(nextButton.props('variant')).toBe('ghost')
    expect(nextButton.props('icon')).toBe('arrow-right')
    expect(nextButton.props('ariaLabel')).toBe('Próxima página')
    expect(nextButton.props('disabled')).toBe(false)

    const icons = wrapper.findAllComponents(Icon)
    expect(icons[0]!.props('name')).toBe('arrow-left')
    expect(icons[1]!.props('name')).toBe('arrow-right')
  })

  it('supports custom previousLabel and nextLabel', () => {
    const wrapper = mount(Pagination, {
      props: {
        previousLabel: 'Voltar',
        nextLabel: 'Avançar',
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0]!.attributes('aria-label')).toBe('Voltar')
    expect(buttons[1]!.attributes('aria-label')).toBe('Avançar')
  })

  it('emits previous and next when enabled buttons are clicked', async () => {
    const wrapper = mount(Pagination)

    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('previous')).toHaveLength(1)
    expect(wrapper.emitted('next')).toHaveLength(1)
  })

  it('disables buttons and prevents emits when canPrevious or canNext is false', async () => {
    const wrapper = mount(Pagination, {
      props: {
        canPrevious: false,
        canNext: false,
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0]!.attributes('disabled')).toBeDefined()
    expect(buttons[1]!.attributes('disabled')).toBeDefined()

    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('previous')).toBeUndefined()
    expect(wrapper.emitted('next')).toBeUndefined()
  })
})
