import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AiPromptInput } from '../index'
import { IconButton } from '../../buttons'

describe('AiPromptInput', () => {
  it('renders textarea with default placeholder and action buttons', () => {
    const wrapper = mount(AiPromptInput)

    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('placeholder')).toBe('Digite sua mensagem')
    expect(wrapper.classes()).toContain('ai-prompt-input')
    expect(wrapper.classes()).not.toContain('ai-prompt-input--disabled')

    const buttons = wrapper.findAllComponents(IconButton)
    expect(buttons).toHaveLength(3)
    expect(buttons[0]?.props('icon')).toBe('attachment')
    expect(buttons[0]?.props('variant')).toBe('ghost')
    expect(buttons[0]?.props('ariaLabel')).toBe('Anexar arquivo')

    expect(buttons[1]?.props('icon')).toBe('robot')
    expect(buttons[1]?.props('variant')).toBe('ghost')
    expect(buttons[1]?.props('ariaLabel')).toBe('Selecionar workflow')

    expect(buttons[2]?.props('icon')).toBe('send')
    expect(buttons[2]?.props('variant')).toBe('primary')
    expect(buttons[2]?.props('ariaLabel')).toBe('Enviar mensagem')
    expect(buttons[2]?.props('disabled')).toBe(true)
  })

  it('uses custom placeholder and aria-label props', () => {
    const wrapper = mount(AiPromptInput, {
      props: {
        placeholder: 'Escreva um comando',
        attachLabel: 'Incluir anexo',
        workflowLabel: 'Escolher fluxo',
        sendLabel: 'Disparar',
      },
    })

    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Escreva um comando')

    const buttons = wrapper.findAllComponents(IconButton)
    expect(buttons[0]?.props('ariaLabel')).toBe('Incluir anexo')
    expect(buttons[1]?.props('ariaLabel')).toBe('Escolher fluxo')
    expect(buttons[2]?.props('ariaLabel')).toBe('Disparar')
  })

  it('renders optional #actions-left slot content', () => {
    const wrapper = mount(AiPromptInput, {
      slots: {
        'actions-left': '<span data-testid="extra-action">Modelo X</span>',
      },
    })

    const leftActions = wrapper.find('.ai-prompt-input__actions-left')
    expect(leftActions.find('[data-testid="extra-action"]').text()).toBe('Modelo X')
  })

  it('emits update:modelValue when typing in textarea', async () => {
    const wrapper = mount(AiPromptInput)

    await wrapper.find('textarea').setValue('Resumir ata')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual(['Resumir ata'])
  })

  it('keeps send disabled for whitespace-only modelValue and enables for non-empty text', () => {
    const whitespaceWrapper = mount(AiPromptInput, {
      props: { modelValue: '   \n  ' },
    })
    const sendButtonWhitespace = whitespaceWrapper.findAllComponents(IconButton)[2]
    expect(sendButtonWhitespace?.props('disabled')).toBe(true)

    const validWrapper = mount(AiPromptInput, {
      props: { modelValue: 'Analisar contrato' },
    })
    const sendButtonValid = validWrapper.findAllComponents(IconButton)[2]
    expect(sendButtonValid?.props('disabled')).toBe(false)
  })

  it('emits submit with modelValue when send button is clicked', async () => {
    const wrapper = mount(AiPromptInput, {
      props: { modelValue: 'Gerar relatório' },
    })

    const sendButton = wrapper.findAllComponents(IconButton)[2]
    await sendButton?.trigger('click')

    const emitted = wrapper.emitted('submit')
    expect(emitted).toBeTruthy()
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]).toEqual(['Gerar relatório'])
  })

  it('emits submit on Enter without Shift and does not emit on Shift+Enter', async () => {
    const wrapper = mount(AiPromptInput, {
      props: { modelValue: 'Pergunta rápida' },
    })

    const textarea = wrapper.find('textarea')
    await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(wrapper.emitted('submit')).toBeUndefined()

    await textarea.trigger('keydown', { key: 'Enter', shiftKey: false })
    expect(wrapper.emitted('submit')).toEqual([['Pergunta rápida']])
  })

  it('emits attach and select-workflow when left action buttons are clicked', async () => {
    const wrapper = mount(AiPromptInput)
    const buttons = wrapper.findAllComponents(IconButton)

    await buttons[0]?.trigger('click')
    await buttons[1]?.trigger('click')

    expect(wrapper.emitted('attach')).toHaveLength(1)
    expect(wrapper.emitted('select-workflow')).toHaveLength(1)
  })

  it('disables textarea and all buttons when disabled is true', async () => {
    const wrapper = mount(AiPromptInput, {
      props: {
        modelValue: 'Texto pronto',
        disabled: true,
      },
    })

    expect(wrapper.classes()).toContain('ai-prompt-input--disabled')
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()

    const buttons = wrapper.findAllComponents(IconButton)
    for (const button of buttons) {
      expect(button.props('disabled')).toBe(true)
    }

    await wrapper.find('textarea').trigger('keydown', { key: 'Enter', shiftKey: false })
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
