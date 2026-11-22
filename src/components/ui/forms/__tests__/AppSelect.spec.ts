import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSelect from '../AppSelect.vue'

const options = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer', disabled: true },
]

describe('AppSelect', () => {
  it('renders native select with options, default variant and arrow-down icon', () => {
    const wrapper = mount(AppSelect, {
      props: {
        id: 'role-select',
        label: 'Perfil',
        options,
        modelValue: 'admin',
      },
    })

    const select = wrapper.find('select')
    const renderedOptions = wrapper.findAll('option')

    expect(wrapper.classes()).toContain('app-select')
    expect(wrapper.classes()).toContain('app-select--default')
    expect(wrapper.find('label').attributes('for')).toBe('role-select')
    expect(select.attributes('id')).toBe('role-select')
    expect(renderedOptions).toHaveLength(3)
    expect(renderedOptions[2]?.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.app-select__icon').exists()).toBe(true)
  })

  it('supports inline variant and ariaLabel when label is omitted', () => {
    const wrapper = mount(AppSelect, {
      props: {
        variant: 'inline',
        ariaLabel: 'Ordenar por',
        options,
        modelValue: 'admin',
      },
    })

    expect(wrapper.classes()).toContain('app-select')
    expect(wrapper.classes()).toContain('app-select--inline')
    expect(wrapper.find('label').exists()).toBe(false)
    expect(wrapper.find('select').attributes('aria-label')).toBe('Ordenar por')
  })

  it('renders placeholder option and applies placeholder modifier when empty', () => {
    const wrapper = mount(AppSelect, {
      props: {
        placeholder: 'Selecione uma opção',
        options,
        modelValue: '',
      },
    })

    const firstOption = wrapper.find('option')
    expect(firstOption.text()).toBe('Selecione uma opção')
    expect(firstOption.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('app-select--placeholder')

    const selectedWrapper = mount(AppSelect, {
      props: {
        placeholder: 'Selecione uma opção',
        options,
        modelValue: 'editor',
      },
    })

    expect(selectedWrapper.classes()).not.toContain('app-select--placeholder')
  })

  it('emits update:modelValue and change when selection changes', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        options,
        modelValue: 'admin',
      },
    })

    await wrapper.find('select').setValue('editor')

    expect(wrapper.emitted('update:modelValue')).toEqual([['editor']])
    expect(wrapper.emitted('change')).toEqual([['editor']])
  })

  it('handles focus, error and disabled states accessibly', async () => {
    const errorWrapper = mount(AppSelect, {
      props: {
        id: 'select-err',
        options,
        error: 'Seleção obrigatória',
      },
    })

    const select = errorWrapper.find('select')
    expect(errorWrapper.classes()).toContain('app-select--error')
    expect(select.attributes('aria-invalid')).toBe('true')
    expect(select.attributes('aria-describedby')).toBe('select-err-help')
    expect(errorWrapper.find('.app-select__help').attributes('role')).toBe('alert')

    await select.trigger('focus')
    expect(errorWrapper.classes()).toContain('app-select--focused')
    await select.trigger('blur')
    expect(errorWrapper.classes()).not.toContain('app-select--focused')

    const disabledWrapper = mount(AppSelect, {
      props: {
        options,
        disabled: true,
      },
    })

    expect(disabledWrapper.classes()).toContain('app-select--disabled')
    expect(disabledWrapper.find('select').attributes('disabled')).toBeDefined()
  })
})
