import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchInput from '../SearchInput.vue'

describe('SearchInput', () => {
  it('renders search icon and input with default placeholder and aria-label', () => {
    const wrapper = mount(SearchInput)
    const input = wrapper.find('input')

    expect(wrapper.classes()).toContain('search-input')
    expect(wrapper.find('.search-input__icon').exists()).toBe(true)
    expect(input.attributes('type')).toBe('search')
    expect(input.attributes('placeholder')).toBe('search')
    expect(input.attributes('aria-label')).toBe('Buscar')
  })

  it('supports custom props and emits update:modelValue on input', async () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: 'teste',
        placeholder: 'Buscar documentos',
        ariaLabel: 'Buscar documentos',
      },
    })

    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('Buscar documentos')
    expect(input.attributes('aria-label')).toBe('Buscar documentos')
    expect((input.element as HTMLInputElement).value).toBe('teste')

    await input.setValue('relatório')
    expect(wrapper.emitted('update:modelValue')).toEqual([['relatório']])
  })

  it('emits search event on enter keydown', async () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: 'contrato',
      },
    })

    await wrapper.find('input').trigger('keydown.enter')

    expect(wrapper.emitted('search')).toEqual([['contrato']])
  })

  it('toggles focused modifier class on focus and blur', async () => {
    const wrapper = mount(SearchInput)
    const input = wrapper.find('input')

    await input.trigger('focus')
    expect(wrapper.classes()).toContain('search-input--focused')

    await input.trigger('blur')
    expect(wrapper.classes()).not.toContain('search-input--focused')
  })

  it('supports disabled state and blocks search emission', async () => {
    const wrapper = mount(SearchInput, {
      props: {
        modelValue: 'bloqueado',
        disabled: true,
      },
    })

    const input = wrapper.find('input')
    expect(wrapper.classes()).toContain('search-input--disabled')
    expect(input.attributes('disabled')).toBeDefined()

    await input.trigger('focus')
    expect(wrapper.classes()).not.toContain('search-input--focused')

    await input.trigger('keydown.enter')
    expect(wrapper.emitted('search')).toBeUndefined()
  })
})
