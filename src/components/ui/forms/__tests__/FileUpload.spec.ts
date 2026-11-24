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

  it('displays uploaded state indicator, formatted byte sizes, replace and remove actions', async () => {
    const smallFile = new File(['hello'], 'nota.txt', { type: 'text/plain' })
    const kbFile = new File([new Uint8Array(2048)], 'manual.pdf', { type: 'application/pdf' })
    const mbFile = new File([new Uint8Array(2 * 1024 * 1024)], 'video.mp4', {
      type: 'video/mp4',
    })

    const wrapper = mount(FileUpload, {
      props: {
        multiple: true,
      },
    })

    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [smallFile, kbFile, mbFile],
      configurable: true,
    })
    await input.trigger('change')

    expect(wrapper.classes()).toContain('file-upload--uploaded')
    expect(wrapper.find('.file-upload__uploaded-status').text()).toBe('Arquivos carregados')
    expect(wrapper.find('.file-upload__uploaded-badge svg').exists()).toBe(true)

    const items = wrapper.findAll('.file-upload__uploaded-item')
    expect(items).toHaveLength(3)
    expect(items[0]?.text()).toContain('nota.txt')
    expect(items[0]?.text()).toContain('5 B')
    expect(items[1]?.text()).toContain('manual.pdf')
    expect(items[1]?.text()).toContain('2 KB')
    expect(items[2]?.text()).toContain('video.mp4')
    expect(items[2]?.text()).toContain('2 MB')

    const clickSpy = vi.spyOn(input.element as HTMLInputElement, 'click').mockImplementation(() => {})
    await wrapper.find('.file-upload__action-btn--primary').trigger('click')
    expect(clickSpy).toHaveBeenCalledTimes(1)

    await items[1]!.find('.file-upload__action-btn--remove').trigger('click')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('remove')).toEqual([[1]])
    expect(wrapper.findAll('.file-upload__uploaded-item')).toHaveLength(2)

    await wrapper.find('.file-upload__action-btn--clear').trigger('click')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('clear')).toEqual([[]])
    expect(wrapper.classes()).not.toContain('file-upload--uploaded')
    expect(wrapper.find('.file-upload__title').exists()).toBe(true)
    clickSpy.mockRestore()
  })

  it('syncs controlled files prop and emits remove and clear for single file', async () => {
    const file = new File(['abc'], 'contrato.pdf', { type: 'application/pdf' })
    const wrapper = mount(FileUpload, {
      props: {
        files: [file],
      },
    })

    expect(wrapper.classes()).toContain('file-upload--uploaded')
    expect(wrapper.find('.file-upload__uploaded-status').text()).toBe('Arquivo carregado')
    expect(wrapper.find('.file-upload__uploaded-name').text()).toBe('contrato.pdf')
    expect(wrapper.find('.file-upload__uploaded-size').text()).toBe('3 B')

    await wrapper.find('.file-upload__action-btn--remove').trigger('click')
    expect(wrapper.emitted('remove')).toEqual([[0]])
    expect(wrapper.emitted('clear')).toEqual([[]])

    await wrapper.setProps({ files: [] })
    expect(wrapper.classes()).not.toContain('file-upload--uploaded')
  })
})
