import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTextArea from '../AppTextArea.vue'

describe('AppTextArea', () => {
  it('renders label, textarea attributes and associates label with id', () => {
    const wrapper = mount(AppTextArea, {
      props: {
        id: 'description-field',
        name: 'description',
        label: 'Descrição',
        placeholder: 'Digite aqui...',
        rows: 5,
        modelValue: 'Conteúdo inicial',
        required: true,
      },
    })

    const label = wrapper.find('label')
    const textarea = wrapper.find('textarea')

    expect(label.text()).toBe('Descrição')
    expect(label.attributes('for')).toBe('description-field')
    expect(textarea.attributes('id')).toBe('description-field')
    expect(textarea.attributes('name')).toBe('description')
    expect(textarea.attributes('placeholder')).toBe('Digite aqui...')
    expect(textarea.attributes('rows')).toBe('5')
    expect(textarea.attributes('required')).toBeDefined()
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Conteúdo inicial')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppTextArea, {
      props: {
        modelValue: '',
      },
    })

    await wrapper.find('textarea').setValue('Texto atualizado')

    expect(wrapper.emitted('update:modelValue')).toEqual([['Texto atualizado']])
  })

  it('emits focus and blur events and toggles focused modifier class', async () => {
    const wrapper = mount(AppTextArea)
    const textarea = wrapper.find('textarea')

    await textarea.trigger('focus')
    expect(wrapper.classes()).toContain('app-text-area--focused')
    expect(wrapper.emitted('focus')).toHaveLength(1)

    await textarea.trigger('blur')
    expect(wrapper.classes()).not.toContain('app-text-area--focused')
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })

  it('renders helpText and error states with proper accessibility attributes', () => {
    const helperWrapper = mount(AppTextArea, {
      props: {
        id: 'notes',
        helpText: 'Máximo 500 caracteres',
      },
    })

    expect(helperWrapper.find('.app-text-area__help').text()).toBe('Máximo 500 caracteres')
    expect(helperWrapper.find('textarea').attributes('aria-describedby')).toBe('notes-help')
    expect(helperWrapper.find('textarea').attributes('aria-invalid')).toBeUndefined()

    const errorWrapper = mount(AppTextArea, {
      props: {
        id: 'notes',
        error: 'Descrição inválida',
      },
    })

    expect(errorWrapper.classes()).toContain('app-text-area--error')
    expect(errorWrapper.find('textarea').attributes('aria-invalid')).toBe('true')
    expect(errorWrapper.find('.app-text-area__help').text()).toBe('Descrição inválida')
    expect(errorWrapper.find('.app-text-area__help').attributes('role')).toBe('alert')
  })

  it('supports disabled state', async () => {
    const wrapper = mount(AppTextArea, {
      props: {
        disabled: true,
      },
    })

    const textarea = wrapper.find('textarea')
    expect(wrapper.classes()).toContain('app-text-area--disabled')
    expect(textarea.attributes('disabled')).toBeDefined()

    await textarea.trigger('focus')
    expect(wrapper.classes()).not.toContain('app-text-area--focused')
  })
})
