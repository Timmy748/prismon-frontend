import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { DocumentForm } from '../index'
import { AppButton } from '../../buttons'
import { AppFileUpload, AppTextArea, AppTextInput } from '../../forms'

describe('DocumentForm', () => {
  it('renders upload, title, description fields and footer action buttons with defaults', () => {
    const wrapper = mount(DocumentForm)

    const upload = wrapper.findComponent(AppFileUpload)
    const textInput = wrapper.findComponent(AppTextInput)
    const textArea = wrapper.findComponent(AppTextArea)
    const buttons = wrapper.findAllComponents(AppButton)

    expect(upload.exists()).toBe(true)
    expect(upload.props('label')).toBe('Suba seu arquivo')

    expect(textInput.exists()).toBe(true)
    expect(textInput.props('label')).toBe('Título')

    expect(textArea.exists()).toBe(true)
    expect(textArea.props('label')).toBe('Descrição')

    expect(buttons).toHaveLength(2)
    expect(buttons[0]?.props('variant')).toBe('ghost')
    expect(buttons[0]?.props('fullWidth')).toBe(true)
    expect(buttons[0]?.text()).toBe('Cancelar')

    expect(buttons[1]?.props('variant')).toBe('primary')
    expect(buttons[1]?.props('type')).toBe('submit')
    expect(buttons[1]?.props('fullWidth')).toBe(true)
    expect(buttons[1]?.text()).toBe('Salvar')
  })

  it('forwards field props and custom button labels', () => {
    const wrapper = mount(DocumentForm, {
      props: {
        title: 'Contrato',
        description: 'Descrição inicial',
        accept: '.pdf',
        fileHint: 'Apenas PDF até 5MB',
        fileError: 'Arquivo obrigatório',
        titlePlaceholder: 'Digite o título',
        titleHelpText: 'Máximo 120 caracteres',
        titleError: 'Título inválido',
        descriptionPlaceholder: 'Digite a descrição',
        descriptionHelpText: 'Resumo do documento',
        descriptionError: 'Descrição obrigatória',
        cancelLabel: 'Voltar',
        submitLabel: 'Enviar',
      },
    })

    const upload = wrapper.findComponent(AppFileUpload)
    expect(upload.props('accept')).toBe('.pdf')
    expect(upload.props('hint')).toBe('Apenas PDF até 5MB')
    expect(upload.props('error')).toBe('Arquivo obrigatório')

    const textInput = wrapper.findComponent(AppTextInput)
    expect(textInput.props('modelValue')).toBe('Contrato')
    expect(textInput.props('placeholder')).toBe('Digite o título')
    expect(textInput.props('helpText')).toBe('Máximo 120 caracteres')
    expect(textInput.props('error')).toBe('Título inválido')

    const textArea = wrapper.findComponent(AppTextArea)
    expect(textArea.props('modelValue')).toBe('Descrição inicial')
    expect(textArea.props('placeholder')).toBe('Digite a descrição')
    expect(textArea.props('helpText')).toBe('Resumo do documento')
    expect(textArea.props('error')).toBe('Descrição obrigatória')

    const buttons = wrapper.findAllComponents(AppButton)
    expect(buttons[0]?.text()).toBe('Voltar')
    expect(buttons[1]?.text()).toBe('Enviar')
  })

  it('emits update:title, update:description, select-files and submit payload', async () => {
    const file = new File(['hello'], 'contrato.pdf', { type: 'application/pdf' })
    const wrapper = mount(DocumentForm)

    await wrapper.find('input[type="text"]').setValue('Novo Contrato')
    await wrapper.find('textarea').setValue('Detalhes do contrato')

    const fileInput = wrapper.find('input[type="file"]')
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      configurable: true,
    })
    await fileInput.trigger('change')

    expect(wrapper.emitted('update:title')).toEqual([['Novo Contrato']])
    expect(wrapper.emitted('update:description')).toEqual([['Detalhes do contrato']])
    expect(wrapper.emitted('select-files')).toEqual([[[file]]])

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          title: 'Novo Contrato',
          description: 'Detalhes do contrato',
          files: [file],
        },
      ],
    ])
  })

  it('emits cancel when cancel button is clicked and syncs prop updates', async () => {
    const wrapper = mount(DocumentForm, {
      props: {
        title: 'Inicial',
        description: 'Desc inicial',
      },
    })

    await wrapper.setProps({
      title: 'Atualizado',
      description: 'Desc atualizada',
    })

    expect((wrapper.find('input[type="text"]').element as HTMLInputElement).value).toBe(
      'Atualizado',
    )
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Desc atualizada')

    const cancelButton = wrapper.findAllComponents(AppButton)[0]!
    await cancelButton.trigger('click')
    expect(wrapper.emitted('cancel')).toEqual([[]])
  })

  it('respects disabled and submitDisabled props', async () => {
    const disabledWrapper = mount(DocumentForm, {
      props: {
        disabled: true,
      },
    })

    expect(disabledWrapper.findComponent(AppFileUpload).props('disabled')).toBe(true)
    expect(disabledWrapper.findComponent(AppTextInput).props('disabled')).toBe(true)
    expect(disabledWrapper.findComponent(AppTextArea).props('disabled')).toBe(true)

    const disabledButtons = disabledWrapper.findAllComponents(AppButton)
    expect(disabledButtons[0]?.props('disabled')).toBe(true)
    expect(disabledButtons[1]?.props('disabled')).toBe(true)

    await disabledWrapper.find('form').trigger('submit')
    expect(disabledWrapper.emitted('submit')).toBeUndefined()

    const submitDisabledWrapper = mount(DocumentForm, {
      props: {
        submitDisabled: true,
      },
    })

    const submitDisabledButtons = submitDisabledWrapper.findAllComponents(AppButton)
    expect(submitDisabledButtons[0]?.props('disabled')).toBe(false)
    expect(submitDisabledButtons[1]?.props('disabled')).toBe(true)

    await submitDisabledWrapper.find('form').trigger('submit')
    expect(submitDisabledWrapper.emitted('submit')).toBeUndefined()
  })
})
