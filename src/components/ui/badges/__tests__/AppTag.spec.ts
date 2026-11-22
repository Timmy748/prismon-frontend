import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppTag } from '../index'
import { AppIcon } from '../../icons'

describe('AppTag', () => {
  it('renders label prop, decorative dot, and default BEM classes without dismiss button', () => {
    const wrapper = mount(AppTag, {
      props: { label: 'Design' },
    })

    expect(wrapper.classes()).toContain('app-tag')
    expect(wrapper.classes()).not.toContain('app-tag--dismissible')

    const dot = wrapper.find('.app-tag__dot')
    expect(dot.exists()).toBe(true)
    expect(dot.attributes('aria-hidden')).toBe('true')

    const label = wrapper.find('.app-tag__label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Design')

    expect(wrapper.find('.app-tag__dismiss').exists()).toBe(false)
  })

  it('renders default slot content and overrides label prop when both are provided', () => {
    const wrapper = mount(AppTag, {
      props: { label: 'Fallback' },
      slots: {
        default: '<span data-testid="custom-tag">Customiza</span>',
      },
    })

    const label = wrapper.find('.app-tag__label')
    expect(label.find('[data-testid="custom-tag"]').exists()).toBe(true)
    expect(label.text()).toBe('Customiza')
  })

  it('applies .app-tag--dismissible modifier and renders native dismiss button with close icon', () => {
    const wrapper = mount(AppTag, {
      props: {
        label: 'Vue 3',
        dismissible: true,
      },
    })

    expect(wrapper.classes()).toContain('app-tag')
    expect(wrapper.classes()).toContain('app-tag--dismissible')

    const dismissButton = wrapper.find('button.app-tag__dismiss')
    expect(dismissButton.exists()).toBe(true)
    expect(dismissButton.attributes('type')).toBe('button')
    expect(dismissButton.attributes('aria-label')).toBe('Remover tag')

    const icon = dismissButton.findComponent(AppIcon)
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('close')
    expect(icon.props('size')).toBe('md')
    expect(icon.attributes('aria-hidden')).toBe('true')
  })

  it('uses custom dismissLabel prop as aria-label on dismiss button', () => {
    const wrapper = mount(AppTag, {
      props: {
        label: 'TypeScript',
        dismissible: true,
        dismissLabel: 'Remover filtro TypeScript',
      },
    })

    const dismissButton = wrapper.find('button.app-tag__dismiss')
    expect(dismissButton.attributes('aria-label')).toBe('Remover filtro TypeScript')
  })

  it('emits dismiss event when dismiss button is clicked and not when label is clicked', async () => {
    const wrapper = mount(AppTag, {
      props: {
        label: 'Vitest',
        dismissible: true,
      },
    })

    await wrapper.find('.app-tag__label').trigger('click')
    expect(wrapper.emitted('dismiss')).toBeUndefined()

    await wrapper.find('button.app-tag__dismiss').trigger('click')
    const emitted = wrapper.emitted('dismiss')
    expect(emitted).toBeTruthy()
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]).toEqual([])
  })
})
