import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextInput from '../TextInput.vue'

describe('TextInput', () => {
  it('renders label, input attributes and associates label with input id', () => {
    const wrapper = mount(TextInput, {
      props: {
        id: 'email-field',
        name: 'email',
        type: 'email',
        label: 'E-mail',
        placeholder: 'nome@exemplo.com',
        modelValue: 'ana@prismon.dev',
        required: true,
        autocomplete: 'email',
      },
    })

    const label = wrapper.find('label')
    const input = wrapper.find('input')

    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('E-mail')
    expect(label.attributes('for')).toBe('email-field')
    expect(input.attributes('id')).toBe('email-field')
    expect(input.attributes('name')).toBe('email')
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('placeholder')).toBe('nome@exemplo.com')
    expect(input.attributes('autocomplete')).toBe('email')
    expect(input.attributes('required')).toBeDefined()
    expect((input.element as HTMLInputElement).value).toBe('ana@prismon.dev')
  })

  it('generates a unique id automatically when id prop is omitted', () => {
    const wrapper = mount(TextInput, {
      props: {
        label: 'Nome',
      },
    })

    const label = wrapper.find('label')
    const input = wrapper.find('input')
    const generatedId = input.attributes('id')

    expect(generatedId).toBeTruthy()
    expect(label.attributes('for')).toBe(generatedId)
  })

  it('emits update:modelValue when typing', async () => {
    const wrapper = mount(TextInput, {
      props: {
        modelValue: '',
      },
    })

    await wrapper.find('input').setValue('Novo valor')

    expect(wrapper.emitted('update:modelValue')).toEqual([['Novo valor']])
  })

  it('emits focus and blur events and toggles focused modifier class', async () => {
    const wrapper = mount(TextInput)
    const input = wrapper.find('input')

    await input.trigger('focus')
    expect(wrapper.classes()).toContain('text-input--focused')
    expect(wrapper.emitted('focus')).toHaveLength(1)

    await input.trigger('blur')
    expect(wrapper.classes()).not.toContain('text-input--focused')
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })

  it('renders helpText and links it with aria-describedby', () => {
    const wrapper = mount(TextInput, {
      props: {
        id: 'api-key',
        helpText: 'Use sua chave pública',
      },
    })

    const input = wrapper.find('input')
    const help = wrapper.find('.text-input__help')

    expect(help.exists()).toBe(true)
    expect(help.text()).toBe('Use sua chave pública')
    expect(help.attributes('id')).toBe('api-key-help')
    expect(help.attributes('role')).toBeUndefined()
    expect(input.attributes('aria-describedby')).toBe('api-key-help')
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })

  it('supports error state with string message and boolean flag', () => {
    const withMessage = mount(TextInput, {
      props: {
        id: 'username',
        helpText: 'Texto normal',
        error: 'Campo obrigatório',
      },
    })

    expect(withMessage.classes()).toContain('text-input--error')
    expect(withMessage.find('input').attributes('aria-invalid')).toBe('true')
    expect(withMessage.find('.text-input__help').text()).toBe('Campo obrigatório')
    expect(withMessage.find('.text-input__help').attributes('role')).toBe('alert')

    const withBoolean = mount(TextInput, {
      props: {
        helpText: 'Informe um valor válido',
        error: true,
      },
    })

    expect(withBoolean.classes()).toContain('text-input--error')
    expect(withBoolean.find('input').attributes('aria-invalid')).toBe('true')
    expect(withBoolean.find('.text-input__help').text()).toBe('Informe um valor válido')
  })

  it('applies disabled class and prevents focused state when disabled', async () => {
    const wrapper = mount(TextInput, {
      props: {
        disabled: true,
      },
    })

    const input = wrapper.find('input')
    expect(wrapper.classes()).toContain('text-input--disabled')
    expect(input.attributes('disabled')).toBeDefined()

    await input.trigger('focus')
    expect(wrapper.classes()).not.toContain('text-input--focused')
    expect(wrapper.emitted('focus')).toBeUndefined()
  })
})
