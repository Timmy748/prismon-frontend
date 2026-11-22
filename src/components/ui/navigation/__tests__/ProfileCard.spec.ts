import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ProfileCard } from '../index'
import { IconButton } from '../../buttons'

describe('ProfileCard', () => {
  it('renders username, role, initials fallback and settings button by default', () => {
    const wrapper = mount(ProfileCard, {
      props: {
        username: 'Ana Silva',
        role: 'Administradora',
      },
    })

    expect(wrapper.classes()).toContain('profile-card')
    expect(wrapper.find('.profile-card__username').text()).toBe('Ana Silva')
    expect(wrapper.find('.profile-card__role').text()).toBe('Administradora')
    expect(wrapper.find('.profile-card__avatar-initials').text()).toBe('AS')
    expect(wrapper.find('img').exists()).toBe(false)

    const settingsBtn = wrapper.findComponent(IconButton)
    expect(settingsBtn.exists()).toBe(true)
    expect(settingsBtn.props('variant')).toBe('ghost')
    expect(settingsBtn.props('size')).toBe('lg')
    expect(settingsBtn.props('icon')).toBe('setting')
    expect(settingsBtn.props('ariaLabel')).toBe('Configurações do perfil')
  })

  it('renders avatar image when avatarSrc is provided', () => {
    const wrapper = mount(ProfileCard, {
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
    expect(wrapper.find('.profile-card__avatar-initials').exists()).toBe(false)
  })

  it('hides settings button when showSettings is false', () => {
    const wrapper = mount(ProfileCard, {
      props: {
        username: 'Maria',
        showSettings: false,
      },
    })

    expect(wrapper.findComponent(IconButton).exists()).toBe(false)
  })

  it('emits settings-click when settings button is clicked', async () => {
    const wrapper = mount(ProfileCard, {
      props: {
        username: 'João',
        settingsLabel: 'Abrir ajustes',
      },
    })

    const settingsBtn = wrapper.findComponent(IconButton)
    expect(settingsBtn.props('ariaLabel')).toBe('Abrir ajustes')

    await settingsBtn.trigger('click')
    expect(wrapper.emitted('settings-click')).toHaveLength(1)
  })
})
