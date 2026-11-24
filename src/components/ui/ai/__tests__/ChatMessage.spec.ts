import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ChatMessage, type ChatMessageRole } from '../index'

const ROLES: ChatMessageRole[] = ['human', 'ai']

describe('ChatMessage', () => {
  it.each(ROLES)('applies base and role BEM modifier chat-message--%s', (role) => {
    const wrapper = mount(ChatMessage, {
      props: {
        role,
        content: 'Mensagem de teste',
      },
    })

    expect(wrapper.classes()).toContain('chat-message')
    expect(wrapper.classes()).toContain(`chat-message--${role}`)
  })

  it('renders content prop when default slot is not provided', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        role: 'human',
        content: 'Analise este documento',
      },
    })

    expect(wrapper.find('.chat-message__content').text()).toBe('Analise este documento')
  })

  it('renders default slot content and overrides content prop fallback', () => {
    const wrapper = mount(ChatMessage, {
      props: {
        role: 'ai',
        content: 'Fallback content',
      },
      slots: {
        default: '<p data-testid="rich-content">Resposta estruturada</p>',
      },
    })

    expect(wrapper.find('[data-testid="rich-content"]').text()).toBe('Resposta estruturada')
    expect(wrapper.text()).not.toContain('Fallback content')
  })
})
