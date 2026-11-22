import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileUpload from '../FileUpload.vue'

describe('FileUpload', () => {
  it('renders default title, hint, upload icon and optional label', () => {
    const wrapper = mount(FileUpload, {
      props: {
        id: 'avatar-upload',
        label: 'Documento',
        accept: '.png,.jpg',
      },
    })

    const label = wrapper.find('label')
    const input = wrapper.find('input[type="file"]')
    const dropzone = wrapper.find('.file-upload__dropzone')

    expect(label.text()).toBe('Documento')
    expect(label.attributes('for')).toBe('avatar-upload')
    expect(input.attributes('id')).toBe('avatar-upload')
    expect(input.attributes('accept')).toBe('.png,.jpg')
    expect(dropzone.attributes('role')).toBe('button')
    expect(dropzone.attributes('tabindex')).toBe('0')
    expect(wrapper.find('.file-upload__icon').exists()).toBe(true)
    expect(wrapper.find('.file-upload__title').text()).toBe(
      'Arraste arquivos aqui ou clique para navegar',
    )
    expect(wrapper.find('.file-upload__hint').text()).toBe('JPG, PNG, WEBP upload até 10mb')
  })

  it('opens hidden file input on click and keyboard activation', async () => {
    const wrapper = mount(FileUpload)
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})

    const dropzone = wrapper.find('.file-upload__dropzone')
    await dropzone.trigger('click')
    await dropzone.trigger('keydown.enter')
    await dropzone.trigger('keydown.space')

    expect(clickSpy).toHaveBeenCalledTimes(3)
    clickSpy.mockRestore()
  })

  it('emits select with chosen files when file input changes', async () => {
    const file1 = new File(['a'], 'doc1.png', { type: 'image/png' })
    const file2 = new File(['b'], 'doc2.png', { type: 'image/png' })

    const singleWrapper = mount(FileUpload, {
      props: {
        multiple: false,
      },
    })

    const singleInput = singleWrapper.find('input[type="file"]')
    Object.defineProperty(singleInput.element, 'files', {
      value: [file1, file2],
      configurable: true,
    })
    await singleInput.trigger('change')

    expect(singleWrapper.emitted('select')).toEqual([[[file1]]])

    const multiWrapper = mount(FileUpload, {
      props: {
        multiple: true,
      },
    })

    const multiInput = multiWrapper.find('input[type="file"]')
    Object.defineProperty(multiInput.element, 'files', {
      value: [file1, file2],
      configurable: true,
    })
    await multiInput.trigger('change')

    expect(multiWrapper.emitted('select')).toEqual([[[file1, file2]]])
  })

  it('toggles dragging class and emits select on drop', async () => {
    const file = new File(['content'], 'photo.webp', { type: 'image/webp' })
    const wrapper = mount(FileUpload)
    const dropzone = wrapper.find('.file-upload__dropzone')

    await dropzone.trigger('dragenter')
    expect(wrapper.classes()).toContain('file-upload--dragging')

    await dropzone.trigger('dragleave')
    expect(wrapper.classes()).not.toContain('file-upload--dragging')

    await dropzone.trigger('dragover')
    expect(wrapper.classes()).toContain('file-upload--dragging')

    await dropzone.trigger('drop', {
      dataTransfer: {
        files: [file],
      },
    })

    expect(wrapper.classes()).not.toContain('file-upload--dragging')
    expect(wrapper.emitted('select')).toEqual([[[file]]])
  })

  it('supports error state with boolean and string message', () => {
    const boolWrapper = mount(FileUpload, {
      props: {
        error: true,
      },
    })

    expect(boolWrapper.classes()).toContain('file-upload--error')
    expect(boolWrapper.find('.file-upload__dropzone').attributes('aria-invalid')).toBe('true')
    expect(boolWrapper.find('.file-upload__error').exists()).toBe(false)

    const msgWrapper = mount(FileUpload, {
      props: {
        id: 'upload-err',
        error: 'Arquivo muito grande',
      },
    })

    expect(msgWrapper.classes()).toContain('file-upload--error')
    expect(msgWrapper.find('.file-upload__dropzone').attributes('aria-invalid')).toBe('true')
    expect(msgWrapper.find('.file-upload__dropzone').attributes('aria-describedby')).toBe(
      'upload-err-error',
    )
    expect(msgWrapper.find('.file-upload__error').text()).toBe('Arquivo muito grande')
    expect(msgWrapper.find('.file-upload__error').attributes('role')).toBe('alert')
  })

  it('blocks interactions when disabled', async () => {
    const file = new File(['content'], 'blocked.png', { type: 'image/png' })
    const wrapper = mount(FileUpload, {
      props: {
        disabled: true,
      },
    })

    const dropzone = wrapper.find('.file-upload__dropzone')
    const input = wrapper.find('input[type="file"]').element as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {})

    expect(wrapper.classes()).toContain('file-upload--disabled')
    expect(dropzone.attributes('tabindex')).toBe('-1')
    expect(dropzone.attributes('aria-disabled')).toBe('true')
    expect(wrapper.find('input[type="file"]').attributes('disabled')).toBeDefined()

    await dropzone.trigger('click')
    await dropzone.trigger('dragenter')
    expect(wrapper.classes()).not.toContain('file-upload--dragging')

    await dropzone.trigger('drop', {
      dataTransfer: {
        files: [file],
      },
    })

    expect(clickSpy).not.toHaveBeenCalled()
    expect(wrapper.emitted('select')).toBeUndefined()
    clickSpy.mockRestore()
  })
})
