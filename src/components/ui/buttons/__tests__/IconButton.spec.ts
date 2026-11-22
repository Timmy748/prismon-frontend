import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { IconButton, type IconButtonVariant } from '../index'
import { Icon } from '../../icons'

const VARIANTS: IconButtonVariant[] = ['primary', 'secondary', 'tertiary', 'ghost', 'danger']

describe('IconButton', () => {
  it('renders button with required aria-label and default props', () => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'close',
        ariaLabel: 'Fechar modal',
      },
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.attributes('aria-label')).toBe('Fechar modal')
    expect(button.attributes('disabled')).toBeUndefined()
    expect(button.classes()).toContain('icon-button')
    expect(button.classes()).toContain('icon-button--primary')
    expect(button.classes()).not.toContain('icon-button--disabled')
  })

  it.each(VARIANTS)('applies variant BEM modifier icon-button--%s', (variant) => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'delete',
        ariaLabel: 'Excluir',
        variant,
      },
    })

    expect(wrapper.classes()).toContain('icon-button')
    expect(wrapper.classes()).toContain(`icon-button--${variant}`)
  })

  it.each(['button', 'submit', 'reset'] as const)('sets native type attribute "%s"', (type) => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'search',
        ariaLabel: 'Pesquisar',
        type,
      },
    })

    expect(wrapper.attributes('type')).toBe(type)
  })

  it('renders Icon with size "sm" when icon prop is provided', () => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'download',
        ariaLabel: 'Baixar arquivo',
      },
    })

    const iconContainer = wrapper.find('.icon-button__icon')
    expect(iconContainer.exists()).toBe(true)

    const appIcon = wrapper.findComponent(Icon)
    expect(appIcon.exists()).toBe(true)
    expect(appIcon.props('name')).toBe('download')
    expect(appIcon.props('size')).toBe('sm')
  })

  it('renders default slot content instead of icon prop fallback when provided', () => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'close',
        ariaLabel: 'Ação customizada',
      },
      slots: {
        default: '<span data-testid="custom-slot-icon">+</span>',
      },
    })

    expect(wrapper.find('[data-testid="custom-slot-icon"]').exists()).toBe(true)
    expect(wrapper.findComponent(Icon).exists()).toBe(false)
  })

  it('emits click event when enabled and clicked', async () => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'search',
        ariaLabel: 'Buscar',
      },
    })

    await wrapper.trigger('click')

    const emitted = wrapper.emitted('click')
    expect(emitted).toBeTruthy()
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toBeInstanceOf(MouseEvent)
  })

  it('applies disabled state and does not emit click when disabled', async () => {
    const wrapper = mount(IconButton, {
      props: {
        icon: 'delete',
        ariaLabel: 'Excluir',
        disabled: true,
      },
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('icon-button')
    expect(wrapper.classes()).toContain('icon-button--disabled')

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
