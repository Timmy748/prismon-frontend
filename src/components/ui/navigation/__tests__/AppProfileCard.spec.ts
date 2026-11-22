import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppProfileCard } from '../index'
import { AppIconButton } from '../../buttons'

describe('AppProfileCard', () => {
  it('renders username, role, initials fallback and settings button by default', () => {
    const wrapper = mount(AppProfileCard, {
      props: {
        username: 'Ana Silva',
        role: 'Administradora',
      },
    })

    expect(wrapper.classes()).toContain('app-profile-card')
    expect(wrapper.find('.app-profile-card__username').text()).toBe('Ana Silva')
    expect(wrapper.find('.app-profile-card__role').text()).toBe('Administradora')
    expect(wrapper.find('.app-profile-card__avatar-initials').text()).toBe('AS')
    expect(wrapper.find('img').exists()).toBe(false)

    const settingsBtn = wrapper.findComponent(AppIconButton)
    expect(settingsBtn.exists()).toBe(true)
    expect(settingsBtn.props('variant')).toBe('ghost')
    expect(settingsBtn.props('icon')).toBe('setting')
    expect(settingsBtn.props('ariaLabel')).toBe('Configurações do perfil')
  })

  it('renders avatar image when avatarSrc is provided', () => {
    const wrapper = mount(AppProfileCard, {
      props: {
        username: 'Carlos',
        avatarSrc: 'https://example.com/avatar.png',
        avatarAlt: 'Foto de Carlos',
      },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/avatar.png')
    expect(img.attributes('alt')).toBe('Foto de Carlos')
    expect(wrapper.find('.app-profile-card__avatar-initials').exists()).toBe(false)
  })

  it('hides settings button when showSettings is false', () => {
    const wrapper = mount(AppProfileCard, {
      props: {
        username: 'Maria',
        showSettings: false,
      },
    })

    expect(wrapper.findComponent(AppIconButton).exists()).toBe(false)
  })

  it('emits settings-click when settings button is clicked', async () => {
    const wrapper = mount(AppProfileCard, {
      props: {
        username: 'João',
        settingsLabel: 'Abrir ajustes',
      },
    })

    const settingsBtn = wrapper.findComponent(AppIconButton)
    expect(settingsBtn.props('ariaLabel')).toBe('Abrir ajustes')

    await settingsBtn.trigger('click')
    expect(wrapper.emitted('settings-click')).toHaveLength(1)
  })
})
