import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { Toaster, ToastItem, toast } from '../index'

let wrapper: VueWrapper | undefined

beforeEach(() => {
  vi.useFakeTimers()
  toast._resetForTesting()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  toast._resetForTesting()
  vi.useRealTimers()
})

describe('Toaster & toast()', () => {
  it('mounts Toaster and renders stacked toasts with Sonner API variants', async () => {
    wrapper = mount(Toaster)

    toast('Documento salvo', { description: 'Alterações aplicadas agora.' })
    toast.success('Upload concluído')
    toast.error('Falha ao enviar arquivo')
    toast.warning('Atenção aos metadados')
    toast.info('Nova versão disponível')
    await wrapper.vm.$nextTick()

    const items = wrapper.findAllComponents(ToastItem)
    expect(items).toHaveLength(5)
    expect(wrapper.find('[data-type="info"][data-front="true"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"][data-type="error"]').exists()).toBe(true)
    expect(wrapper.find('[role="status"][data-type="success"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Documento salvo')
    expect(wrapper.text()).toContain('Alterações aplicadas agora.')

    // Default visibleToasts is 3: indices 0, 1, 2 are visible, 3+ are hidden
    const visibleFlags = items.map((item) => item.attributes('data-visible'))
    expect(visibleFlags).toEqual(['true', 'true', 'true', 'false', 'false'])
  })

  it('updates an existing toast in-place when called with the same id and resolves toast.promise', async () => {
    wrapper = mount(Toaster)

    let resolveTask!: (value: string) => void
    const work = new Promise<string>((resolve) => {
      resolveTask = resolve
    })

    const promise = toast.promise(work, {
      loading: 'Indexando documento...',
      success: (name) => `Arquivo "${name}" pronto`,
      error: 'Erro inesperado',
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-type="loading"]').text()).toContain('Indexando documento...')

    resolveTask('manual.pdf')
    await promise
    await wrapper.vm.$nextTick()

    expect(wrapper.findAllComponents(ToastItem)).toHaveLength(1)
    expect(wrapper.find('[data-type="success"]').text()).toContain('Arquivo "manual.pdf" pronto')
  })

  it('handles toast.promise rejection by transitioning loading toast to error', async () => {
    wrapper = mount(Toaster)

    const failing = Promise.reject(new Error('network'))
    await expect(
      toast.promise(failing, {
        loading: 'Conectando...',
        success: 'Ok',
        error: 'Sem conexão com o servidor',
      }),
    ).rejects.toThrow('network')

    await wrapper.vm.$nextTick()
    expect(wrapper.findAllComponents(ToastItem)).toHaveLength(1)
    expect(wrapper.find('[data-type="error"]').text()).toContain('Sem conexão com o servidor')
  })

  it('supports action, cancel and close buttons and respects event.preventDefault()', async () => {
    wrapper = mount(Toaster, { props: { closeButton: true } })
    const onAction = vi.fn<(event: MouseEvent) => void>((event) => {
      event.preventDefault()
    })
    const onCancel = vi.fn<(event: MouseEvent) => void>()

    toast('Confirmar alteração', {
      action: { label: 'Manter', onClick: onAction },
      cancel: { label: 'Desfazer', onClick: onCancel },
    })
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('.toast__actions button')
    expect(buttons).toHaveLength(2)

    await buttons[1]!.trigger('click')
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(toast.getToasts()).toHaveLength(1)

    await buttons[0]!.trigger('click')
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(toast.getToasts()).toHaveLength(0)
  })

  it('pauses auto-close when hovering Toaster and resumes remaining duration on mouseleave', async () => {
    const onAutoClose = vi.fn<() => void>()
    wrapper = mount(Toaster, { props: { duration: 4000 } })

    toast('Temporizado', { onAutoClose })
    await wrapper.vm.$nextTick()

    vi.advanceTimersByTime(2500)
    expect(toast.getToasts()).toHaveLength(1)

    await wrapper.find('.toaster__list').trigger('mouseenter')
    vi.advanceTimersByTime(5000)
    expect(toast.getToasts()).toHaveLength(1)
    expect(onAutoClose).not.toHaveBeenCalled()

    await wrapper.find('.toaster__list').trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(1600)
    expect(toast.getToasts()).toHaveLength(0)
    expect(onAutoClose).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(450)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAllComponents(ToastItem)).toHaveLength(0)
  })

  it('supports swipe-to-dismiss along allowed position axes', async () => {
    wrapper = mount(Toaster, { props: { position: 'bottom-right' } })
    const onDismiss = vi.fn<() => void>()

    toast('Arraste para dispensar', { onDismiss })
    await wrapper.vm.$nextTick()

    const item = wrapper.find('.toast')
    await item.trigger('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    await item.trigger('pointermove', { pointerId: 1, clientX: 100, clientY: 170 })
    await item.trigger('pointerup', { pointerId: 1, clientX: 100, clientY: 170 })

    expect(toast.getToasts()).toHaveLength(0)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('supports custom components via toast.custom() and scoped toasterId routing', async () => {
    const CustomBody = defineComponent({
      props: {
        message: { type: String, required: true },
        dismiss: { type: Function, required: true },
      },
      setup(props) {
        return () =>
          h(
            'button',
            { 'data-testid': 'custom-toast-btn', onClick: () => (props.dismiss as () => void)() },
            props.message,
          )
      },
    })

    wrapper = mount(Toaster, { props: { id: 'workspace' } })

    const otherId = toast('Outro toaster')
    const workspaceId = toast.custom(
      CustomBody,
      { message: 'Personalizado' },
      { toasterId: 'workspace' },
    )
    await wrapper.vm.$nextTick()

    expect(wrapper.findAllComponents(ToastItem)).toHaveLength(1)
    await wrapper.find('[data-testid="custom-toast-btn"]').trigger('click')
    expect(toast.getToasts().map((item) => item.id)).toEqual([otherId])
    expect(toast.getToasts().some((item) => item.id === workspaceId)).toBe(false)
  })

  it('focuses toaster list when pressing Alt+T hotkey', async () => {
    wrapper = mount(Toaster, { attachTo: document.body })
    toast('Atalho')
    toast('Segundo')
    await wrapper.vm.$nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, code: 'KeyT' }))
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(wrapper.find('.toaster__list').element)
    expect(wrapper.find('.toast').attributes('data-expanded')).toBe('true')
  })
})
