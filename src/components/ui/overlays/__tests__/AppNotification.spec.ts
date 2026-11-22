import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppNotification, type NotificationVariant } from '../index'
import { AppIcon } from '../../icons'

describe('AppNotification', () => {
  it('renders title, message, default variant and role="status"', () => {
    const wrapper = mount(AppNotification, {
      props: {
        title: 'Fluxo salvo',
        message: 'As alterações foram aplicadas com sucesso.',
      },
    })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.classes()).toContain('app-notification')
    expect(wrapper.classes()).toContain('app-notification--default')
    expect(wrapper.find('.app-notification__title').text()).toBe('Fluxo salvo')
    expect(wrapper.find('.app-notification__message').text()).toBe(
      'As alterações foram aplicadas com sucesso.',
    )
    expect(wrapper.find('.app-notification__icon').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findComponent(AppIcon).exists()).toBe(false)
  })

  it.each([
    { variant: 'default' as NotificationVariant, expectedRole: 'status' },
    { variant: 'danger' as NotificationVariant, expectedRole: 'alert' },
  ])('applies variant "$variant" with role="$expectedRole"', ({ variant, expectedRole }) => {
    const wrapper = mount(AppNotification, {
      props: {
        title: 'Aviso',
        variant,
      },
    })

    expect(wrapper.classes()).toContain('app-notification')
    expect(wrapper.classes()).toContain(`app-notification--${variant}`)
    expect(wrapper.attributes('role')).toBe(expectedRole)
  })

  it('renders AppIcon inside .app-notification__icon when icon prop is provided', () => {
    const wrapper = mount(AppNotification, {
      props: {
        title: 'Assistente pronto',
        icon: 'robot',
      },
    })

    const appIcon = wrapper.findComponent(AppIcon)
    expect(appIcon.exists()).toBe(true)
    expect(appIcon.props('name')).toBe('robot')
    expect(appIcon.props('size')).toBe('sm')
  })

  it('renders custom #icon slot and overrides icon prop fallback', () => {
    const wrapper = mount(AppNotification, {
      props: {
        title: 'Erro na execução',
        variant: 'danger',
        icon: 'robot',
      },
      slots: {
        icon: '<span data-testid="custom-notification-icon">!</span>',
      },
    })

    expect(wrapper.find('[data-testid="custom-notification-icon"]').exists()).toBe(true)
    expect(wrapper.findComponent(AppIcon).exists()).toBe(false)
  })

  it('omits message element when neither message prop nor default slot is provided', () => {
    const wrapper = mount(AppNotification, {
      props: {
        title: 'Apenas título',
      },
    })

    expect(wrapper.find('.app-notification__message').exists()).toBe(false)
  })

  it('supports default slot for message content', () => {
    const wrapper = mount(AppNotification, {
      props: {
        title: 'Notificação',
      },
      slots: {
        default: 'Mensagem via slot',
      },
    })

    expect(wrapper.find('.app-notification__message').text()).toBe('Mensagem via slot')
  })
})
