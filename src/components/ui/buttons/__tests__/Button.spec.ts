import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Button, type ButtonSize, type ButtonVariant } from '../index'
import { Icon } from '../../icons'

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'ghost', 'danger']
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']

describe('Button', () => {
  it('renders default slot content and applies default classes and attributes', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Continuar',
      },
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.classes()).toContain('button')
    expect(button.classes()).toContain('button--primary')
    expect(button.classes()).toContain('button--md')
    expect(button.classes()).not.toContain('button--disabled')
    expect(button.classes()).not.toContain('button--full-width')
    expect(wrapper.find('.button__label').text()).toBe('Continuar')
    expect(wrapper.find('.button__icon').exists()).toBe(false)
  })

  it.each(VARIANTS)('applies variant BEM modifier button--%s', (variant) => {
    const wrapper = mount(Button, {
      props: { variant },
      slots: { default: 'Ação' },
    })

    expect(wrapper.classes()).toContain('button')
    expect(wrapper.classes()).toContain(`button--${variant}`)
  })

  it.each(SIZES)('applies size BEM modifier button--%s', (size) => {
    const wrapper = mount(Button, {
      props: { size },
      slots: { default: 'Tamanho' },
    })

    expect(wrapper.classes()).toContain('button')
    expect(wrapper.classes()).toContain(`button--${size}`)
  })

  it.each(['button', 'submit', 'reset'] as const)('sets native type attribute "%s"', (type) => {
    const wrapper = mount(Button, {
      props: { type },
      slots: { default: 'Enviar' },
    })

    expect(wrapper.attributes('type')).toBe(type)
  })

  it('applies full-width modifier when fullWidth is true', () => {
    const wrapper = mount(Button, {
      props: { fullWidth: true },
      slots: { default: 'Entrar' },
    })

    expect(wrapper.classes()).toContain('button')
    expect(wrapper.classes()).toContain('button--full-width')
  })

  it('emits click event when enabled and clicked', async () => {
    const wrapper = mount(Button, {
      slots: { default: 'Salvar' },
    })

    await wrapper.trigger('click')

    const emitted = wrapper.emitted('click')
    expect(emitted).toBeTruthy()
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toBeInstanceOf(MouseEvent)
  })

  it('applies disabled state and does not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true },
      slots: { default: 'Desabilitado' },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('button')
    expect(wrapper.classes()).toContain('button--disabled')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('renders Icon with size "sm" inside .button__icon when icon prop is provided', () => {
    const wrapper = mount(Button, {
      props: { icon: 'search' },
      slots: { default: 'Buscar' },
    })

    const iconWrapper = wrapper.find('.button__icon')
    expect(iconWrapper.exists()).toBe(true)

    const appIcon = wrapper.findComponent(Icon)
    expect(appIcon.exists()).toBe(true)
    expect(appIcon.props('name')).toBe('search')
    expect(appIcon.props('size')).toBe('sm')
  })

  it('renders custom #icon slot content and overrides icon prop fallback', () => {
    const wrapper = mount(Button, {
      props: { icon: 'search' },
      slots: {
        default: 'Custom',
        icon: '<span data-testid="custom-icon">*</span>',
      },
    })

    expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true)
    expect(wrapper.findComponent(Icon).exists()).toBe(false)
  })
})
