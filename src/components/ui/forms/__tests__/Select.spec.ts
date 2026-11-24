import { afterEach, describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import Select from '../Select.vue'

const options = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer', disabled: true },
]

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('Select', () => {
  it('renders combobox trigger, label association, default variant and arrow-down icon', async () => {
    wrapper = mount(Select, {
      props: {
        id: 'role-select',
        name: 'role',
        label: 'Perfil',
        options,
        modelValue: 'admin',
      },
    })

    const combobox = wrapper.find('[role="combobox"]')
    const hiddenInput = wrapper.find('input[type="hidden"]')

    expect(wrapper.classes()).toContain('select')
    expect(wrapper.classes()).toContain('select--default')
    expect(wrapper.find('label').attributes('for')).toBe('role-select')
    expect(combobox.attributes('id')).toBe('role-select')
    expect(combobox.attributes('type')).toBe('button')
    expect(combobox.attributes('aria-expanded')).toBe('false')
    expect(combobox.attributes('aria-haspopup')).toBe('listbox')
    expect(combobox.text()).toContain('Admin')
    expect(hiddenInput.attributes('name')).toBe('role')
    expect((hiddenInput.element as HTMLInputElement).value).toBe('admin')
    expect(wrapper.find('.select__icon').exists()).toBe(true)
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    await combobox.trigger('click')
    expect(combobox.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.select__icon--open').exists()).toBe(true)

    const renderedOptions = wrapper.findAll('[role="option"]')
    expect(renderedOptions).toHaveLength(3)
    expect(renderedOptions[0]?.attributes('aria-selected')).toBe('true')
    expect(renderedOptions[0]?.find('.select__option-check').exists()).toBe(true)
    expect(renderedOptions[1]?.find('.select__option-check').exists()).toBe(false)
    expect(renderedOptions[2]?.attributes('disabled')).toBeDefined()
  })

  it('supports inline variant and ariaLabel when label is omitted', () => {
    wrapper = mount(Select, {
      props: {
        variant: 'inline',
        ariaLabel: 'Ordenar por',
        options,
        modelValue: 'admin',
      },
    })

    expect(wrapper.classes()).toContain('select')
    expect(wrapper.classes()).toContain('select--inline')
    expect(wrapper.find('label').exists()).toBe(false)
    expect(wrapper.find('[role="combobox"]').attributes('aria-label')).toBe('Ordenar por')
  })

  it('renders placeholder label and applies placeholder modifier when empty', () => {
    wrapper = mount(Select, {
      props: {
        placeholder: 'Selecione uma opção',
        options,
        modelValue: '',
      },
    })

    expect(wrapper.find('[role="combobox"]').text()).toContain('Selecione uma opção')
    expect(wrapper.classes()).toContain('select--placeholder')

    const selectedWrapper = mount(Select, {
      props: {
        placeholder: 'Selecione uma opção',
        options,
        modelValue: 'editor',
      },
    })

    expect(selectedWrapper.find('[role="combobox"]').text()).toContain('Editor')
    expect(selectedWrapper.classes()).not.toContain('select--placeholder')
    selectedWrapper.unmount()
  })

  it('emits update:modelValue and change on option click and skips disabled options', async () => {
    wrapper = mount(Select, {
      props: {
        options,
        modelValue: 'admin',
      },
    })

    await wrapper.find('[role="combobox"]').trigger('click')
    const optionButtons = wrapper.findAll('[role="option"]')

    await optionButtons[2]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    await optionButtons[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['editor']])
    expect(wrapper.emitted('change')).toEqual([['editor']])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('supports keyboard navigation (ArrowDown, ArrowUp, Home, End, Enter, Space, Escape) and outside pointerdown', async () => {
    wrapper = mount(Select, {
      props: {
        options,
        modelValue: 'admin',
      },
    })

    const combobox = wrapper.find('[role="combobox"]')

    await combobox.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="option"]')[0]?.classes()).toContain('select__option--active')

    await combobox.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.findAll('[role="option"]')[1]?.classes()).toContain('select__option--active')

    // Disabled third option is skipped on ArrowDown
    await combobox.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.findAll('[role="option"]')[1]?.classes()).toContain('select__option--active')

    await combobox.trigger('keydown', { key: 'Home' })
    expect(wrapper.findAll('[role="option"]')[0]?.classes()).toContain('select__option--active')

    await combobox.trigger('keydown', { key: 'End' })
    expect(wrapper.findAll('[role="option"]')[1]?.classes()).toContain('select__option--active')

    await combobox.trigger('keydown', { key: 'ArrowUp' })
    expect(wrapper.findAll('[role="option"]')[0]?.classes()).toContain('select__option--active')

    await combobox.trigger('keydown', { key: 'ArrowDown' })
    await combobox.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('update:modelValue')).toEqual([['editor']])
    expect(wrapper.emitted('change')).toEqual([['editor']])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    // Reopen with Space and close with Escape
    await combobox.trigger('keydown', { key: ' ' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    await combobox.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)

    // Reopen and close on outside pointerdown
    await combobox.trigger('click')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    document.dispatchEvent(new Event('pointerdown'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('handles focus, error and disabled states accessibly', async () => {
    const errorWrapper = mount(Select, {
      props: {
        id: 'select-err',
        options,
        error: 'Seleção obrigatória',
      },
    })

    const combobox = errorWrapper.find('[role="combobox"]')
    expect(errorWrapper.classes()).toContain('select--error')
    expect(combobox.attributes('aria-invalid')).toBe('true')
    expect(combobox.attributes('aria-describedby')).toBe('select-err-help')
    expect(errorWrapper.find('.select__help').attributes('role')).toBe('alert')

    await combobox.trigger('focus')
    expect(errorWrapper.classes()).toContain('select--focused')
    await combobox.trigger('blur')
    expect(errorWrapper.classes()).not.toContain('select--focused')
    errorWrapper.unmount()

    const disabledWrapper = mount(Select, {
      props: {
        options,
        disabled: true,
      },
    })

    const disabledCombobox = disabledWrapper.find('[role="combobox"]')
    expect(disabledWrapper.classes()).toContain('select--disabled')
    expect(disabledCombobox.attributes('disabled')).toBeDefined()

    await disabledCombobox.trigger('click')
    await disabledCombobox.trigger('keydown', { key: 'ArrowDown' })
    expect(disabledWrapper.find('[role="listbox"]').exists()).toBe(false)
    disabledWrapper.unmount()
  })
})
