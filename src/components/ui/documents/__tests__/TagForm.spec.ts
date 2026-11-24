import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { TagForm } from '../index'
import { Button } from '../../buttons'
import { TextArea, TextInput } from '../../forms'

describe('TagForm', () => {
  it('renders name and description fields and footer action buttons with defaults', () => {
    const wrapper = mount(TagForm)

    const textInput = wrapper.findComponent(TextInput)
    const textArea = wrapper.findComponent(TextArea)
    const buttons = wrapper.findAllComponents(Button)

    expect(textInput.exists()).toBe(true)
    expect(textInput.props('label')).toBe('Nome')

    expect(textArea.exists()).toBe(true)
    expect(textArea.props('label')).toBe('Descrição')

    expect(buttons).toHaveLength(2)
    expect(buttons[0]?.props('variant')).toBe('tertiary')
    expect(buttons[0]?.props('fullWidth')).toBe(true)
    expect(buttons[0]?.text()).toBe('Cancelar')

    expect(buttons[1]?.props('variant')).toBe('primary')
    expect(buttons[1]?.props('type')).toBe('submit')
    expect(buttons[1]?.props('fullWidth')).toBe(true)
    expect(buttons[1]?.text()).toBe('Salvar')
  })

  it('forwards field props and custom labels', () => {
    const wrapper = mount(TagForm, {
      props: {
        name: 'Urgente',
        description: 'Documentos com prazo curto',
        namePlaceholder: 'Digite o nome da tag',
        nameHelpText: 'Nome curto',
        nameError: 'Nome obrigatório',
        descriptionPlaceholder: 'Digite a descrição da tag',
        descriptionHelpText: 'Quando usar esta tag',
        descriptionError: 'Descrição inválida',
        cancelLabel: 'Fechar',
        submitLabel: 'Criar tag',
      },
    })

    const textInput = wrapper.findComponent(TextInput)
    expect(textInput.props('modelValue')).toBe('Urgente')
    expect(textInput.props('placeholder')).toBe('Digite o nome da tag')
    expect(textInput.props('helpText')).toBe('Nome curto')
    expect(textInput.props('error')).toBe('Nome obrigatório')

    const textArea = wrapper.findComponent(TextArea)
    expect(textArea.props('modelValue')).toBe('Documentos com prazo curto')
    expect(textArea.props('placeholder')).toBe('Digite a descrição da tag')
    expect(textArea.props('helpText')).toBe('Quando usar esta tag')
    expect(textArea.props('error')).toBe('Descrição inválida')

    const buttons = wrapper.findAllComponents(Button)
    expect(buttons[0]?.text()).toBe('Fechar')
    expect(buttons[1]?.text()).toBe('Criar tag')
  })

  it('emits update:name, update:description and submit payload', async () => {
    const wrapper = mount(TagForm)

    await wrapper.find('input[type="text"]').setValue('Jurídico')
    await wrapper.find('textarea').setValue('Documentos do setor jurídico')

    expect(wrapper.emitted('update:name')).toEqual([['Jurídico']])
    expect(wrapper.emitted('update:description')).toEqual([['Documentos do setor jurídico']])

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          name: 'Jurídico',
          description: 'Documentos do setor jurídico',
        },
      ],
    ])
  })

  it('emits cancel when cancel button is clicked and syncs prop updates', async () => {
    const wrapper = mount(TagForm, {
      props: {
        name: 'Inicial',
        description: 'Desc inicial',
      },
    })

    await wrapper.setProps({
      name: 'Atualizada',
      description: 'Desc atualizada',
    })

    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe(
      'Atualizada',
    )
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Desc atualizada')

    const cancelButton = wrapper.findAllComponents(Button)[0]!
    await cancelButton.trigger('click')
    expect(wrapper.emitted('cancel')).toEqual([[]])
  })

  it('respects disabled and submitDisabled props', async () => {
    const disabledWrapper = mount(TagForm, {
      props: {
        disabled: true,
      },
    })

    expect(disabledWrapper.findComponent(TextInput).props('disabled')).toBe(true)
    expect(disabledWrapper.findComponent(TextArea).props('disabled')).toBe(true)

    const disabledButtons = disabledWrapper.findAllComponents(Button)
    expect(disabledButtons[0]?.props('disabled')).toBe(true)
    expect(disabledButtons[1]?.props('disabled')).toBe(true)

    await disabledWrapper.find('form').trigger('submit')
    expect(disabledWrapper.emitted('submit')).toBeUndefined()

    const submitDisabledWrapper = mount(TagForm, {
      props: {
        submitDisabled: true,
      },
    })

    const submitDisabledButtons = submitDisabledWrapper.findAllComponents(Button)
    expect(submitDisabledButtons[0]?.props('disabled')).toBe(false)
    expect(submitDisabledButtons[1]?.props('disabled')).toBe(true)

    await submitDisabledWrapper.find('form').trigger('submit')
    expect(submitDisabledWrapper.emitted('submit')).toBeUndefined()
  })
})
