import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppButton, type ButtonSize, type ButtonVariant } from '../index'
import { AppIcon } from '../../icons'

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'ghost', 'danger']
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']

describe('AppButton', () => {
  it('renders default slot content and applies default classes and attributes', () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Continuar',
      },
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.classes()).toContain('app-button')
    expect(button.classes()).toContain('app-button--primary')
    expect(button.classes()).toContain('app-button--md')
    expect(button.classes()).not.toContain('app-button--disabled')
    expect(button.classes()).not.toContain('app-button--full-width')
    expect(wrapper.find('.app-button__label').text()).toBe('Continuar')
    expect(wrapper.find('.app-button__icon').exists()).toBe(false)
  })

  it.each(VARIANTS)('applies variant BEM modifier app-button--%s', (variant) => {
    const wrapper = mount(AppButton, {
      props: { variant },
      slots: { default: 'Ação' },
    })

    expect(wrapper.classes()).toContain('app-button')
    expect(wrapper.classes()).toContain(`app-button--${variant}`)
  })

  it.each(SIZES)('applies size BEM modifier app-button--%s', (size) => {
    const wrapper = mount(AppButton, {
      props: { size },
      slots: { default: 'Tamanho' },
    })

    expect(wrapper.classes()).toContain('app-button')
    expect(wrapper.classes()).toContain(`app-button--${size}`)
  })

  it.each(['button', 'submit', 'reset'] as const)('sets native type attribute "%s"', (type) => {
    const wrapper = mount(AppButton, {
      props: { type },
      slots: { default: 'Enviar' },
    })

    expect(wrapper.attributes('type')).toBe(type)
  })

  it('applies full-width modifier when fullWidth is true', () => {
    const wrapper = mount(AppButton, {
      props: { fullWidth: true },
      slots: { default: 'Entrar' },
    })

    expect(wrapper.classes()).toContain('app-button')
    expect(wrapper.classes()).toContain('app-button--full-width')
  })

  it('emits click event when enabled and clicked', async () => {
    const wrapper = mount(AppButton, {
      slots: { default: 'Salvar' },
    })

    await wrapper.trigger('click')

    const emitted = wrapper.emitted('click')
    expect(emitted).toBeTruthy()
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toBeInstanceOf(MouseEvent)
  })

  it('applies disabled state and does not emit click when disabled', async () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true },
      slots: { default: 'Desabilitado' },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('app-button')
    expect(wrapper.classes()).toContain('app-button--disabled')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('renders AppIcon with size "sm" inside .app-button__icon when icon prop is provided', () => {
    const wrapper = mount(AppButton, {
      props: { icon: 'search' },
      slots: { default: 'Buscar' },
    })

    const iconWrapper = wrapper.find('.app-button__icon')
    expect(iconWrapper.exists()).toBe(true)

    const appIcon = wrapper.findComponent(AppIcon)
    expect(appIcon.exists()).toBe(true)
    expect(appIcon.props('name')).toBe('search')
    expect(appIcon.props('size')).toBe('sm')
  })

  it('renders custom #icon slot content and overrides icon prop fallback', () => {
    const wrapper = mount(AppButton, {
      props: { icon: 'search' },
      slots: {
        default: 'Custom',
        icon: '<span data-testid="custom-icon">*</span>',
      },
    })

    expect(wrapper.find('[data-testid="custom-icon"]').exists()).toBe(true)
    expect(wrapper.findComponent(AppIcon).exists()).toBe(false)
  })
})
