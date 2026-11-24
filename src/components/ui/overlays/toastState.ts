import { computed, markRaw, ref, type Component } from 'vue'
import type { IconName } from '../icons'

export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading'

export type ToastPosition =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export type SwipeDirection = 'top' | 'bottom' | 'left' | 'right'

export interface ToastAction {
  label: string
  onClick: (event: MouseEvent) => void
}

export interface ToasterIcons {
  success?: IconName | null
  error?: IconName | null
  info?: IconName | null
  warning?: IconName | null
  loading?: IconName | null
  close?: IconName
}

export interface ToastOptions {
  id?: string | number
  description?: string
  duration?: number
  position?: ToastPosition
  dismissible?: boolean
  closeButton?: boolean
  icon?: IconName | null
  action?: ToastAction
  cancel?: ToastAction
  testId?: string
  toasterId?: string
  unstyled?: boolean
  className?: string
  onDismiss?: (toast: ToastRecord) => void
  onAutoClose?: (toast: ToastRecord) => void
}

export interface ToastRecord extends ToastOptions {
  id: string | number
  title?: string
  type: ToastType
  createdAt: number
  updatedAt: number
  dismissed?: boolean
  component?: Component
  componentProps?: Record<string, unknown>
}

export type PromiseToastPayload<T> =
  | string
  | ({ title: string } & ToastOptions)
  | ((value: T) => string | ({ title: string } & ToastOptions))

export interface PromiseToastOptions<T> extends ToastOptions {
  loading: string
  success: PromiseToastPayload<T>
  error: PromiseToastPayload<unknown>
  finally?: () => void | Promise<void>
}

let toastCounter = 0

const activeToasts = ref<ToastRecord[]>([])
const toastHistory = ref<ToastRecord[]>([])

function generateId(): number {
  toastCounter += 1
  return toastCounter
}

function recordInHistory(entry: ToastRecord) {
  const idx = toastHistory.value.findIndex((item) => item.id === entry.id)
  if (idx === -1) {
    toastHistory.value.push(entry)
    return
  }
  toastHistory.value[idx] = entry
}

function upsertToast(partial: Omit<ToastRecord, 'createdAt' | 'updatedAt'>): string | number {
  const now = Date.now()
  const existingIndex = activeToasts.value.findIndex((item) => item.id === partial.id)

  if (existingIndex !== -1) {
    const previous = activeToasts.value[existingIndex]!
    const updated: ToastRecord = {
      ...previous,
      ...partial,
      dismissed: false,
      createdAt: previous.createdAt,
      updatedAt: now,
    }
    const next = [...activeToasts.value]
    next[existingIndex] = updated
    activeToasts.value = next
    recordInHistory(updated)
    return updated.id
  }

  const created: ToastRecord = {
    ...partial,
    dismissible: partial.dismissible ?? true,
    dismissed: false,
    createdAt: now,
    updatedAt: now,
  }
  activeToasts.value = [created, ...activeToasts.value]
  recordInHistory(created)
  return created.id
}

function createTypedToast(
  type: ToastType,
  title: string,
  options: ToastOptions = {},
): string | number {
  const id = options.id ?? generateId()
  const defaultDuration = type === 'loading' ? Infinity : options.duration
  return upsertToast({
    ...options,
    id,
    title,
    type,
    duration: defaultDuration,
  })
}

function dismissToast(id?: string | number) {
  if (id === undefined) {
    activeToasts.value = activeToasts.value.map((item) => {
      if (!item.dismissed) {
        item.onDismiss?.(item)
      }
      return { ...item, dismissed: true }
    })
    return
  }

  let matched = false
  activeToasts.value = activeToasts.value.map((item) => {
    if (item.id === id) {
      matched = true
      if (!item.dismissed) {
        item.onDismiss?.(item)
      }
      return { ...item, dismissed: true }
    }
    return item
  })

  if (!matched) {
    return
  }
}

/** Called internally after a toast finishes its leave animation. */
export function removeToastFromDom(id: string | number) {
  activeToasts.value = activeToasts.value.filter((item) => item.id !== id)
}

/** Marks a toast dismissed when auto-close timer elapses. */
export function autoCloseToast(id: string | number) {
  activeToasts.value = activeToasts.value.map((item) => {
    if (item.id === id && !item.dismissed) {
      item.onAutoClose?.(item)
      return { ...item, dismissed: true }
    }
    return item
  })
}

function resetToastsForTesting() {
  activeToasts.value = []
  toastHistory.value = []
  toastCounter = 0
}

function resolvePromisePayload<T>(
  payload: PromiseToastPayload<T>,
  value: T,
): { title: string } & ToastOptions {
  const resolved = typeof payload === 'function' ? payload(value) : payload
  if (typeof resolved === 'string') {
    return { title: resolved }
  }
  return resolved
}

export interface ToastCallable {
  (title: string, options?: ToastOptions): string | number
  success: (title: string, options?: ToastOptions) => string | number
  error: (title: string, options?: ToastOptions) => string | number
  danger: (title: string, options?: ToastOptions) => string | number
  info: (title: string, options?: ToastOptions) => string | number
  warning: (title: string, options?: ToastOptions) => string | number
  loading: (title: string, options?: ToastOptions) => string | number
  custom: (
    component: Component,
    componentProps?: Record<string, unknown>,
    options?: ToastOptions,
  ) => string | number
  promise: <T>(
    promiseOrFn: Promise<T> | (() => Promise<T>),
    options: PromiseToastOptions<T>,
  ) => Promise<T>
  dismiss: (id?: string | number) => void
  getToasts: () => ToastRecord[]
  getHistory: () => ToastRecord[]
  _resetForTesting: () => void
}

const toastImpl = ((title: string, options: ToastOptions = {}) =>
  createTypedToast('default', title, options)) as ToastCallable

toastImpl.success = (title, options) => createTypedToast('success', title, options)
toastImpl.error = (title, options) => createTypedToast('error', title, options)
toastImpl.danger = (title, options) => createTypedToast('error', title, options)
toastImpl.info = (title, options) => createTypedToast('info', title, options)
toastImpl.warning = (title, options) => createTypedToast('warning', title, options)
toastImpl.loading = (title, options) => createTypedToast('loading', title, options)

toastImpl.custom = (component, componentProps = {}, options = {}) => {
  const id = options.id ?? generateId()
  return upsertToast({
    ...options,
    id,
    type: 'default',
    component: markRaw(component),
    componentProps,
  })
}

toastImpl.promise = async <T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  options: PromiseToastOptions<T>,
): Promise<T> => {
  const { loading, success, error, finally: onFinally, ...baseOptions } = options
  const id = createTypedToast('loading', loading, {
    ...baseOptions,
    duration: Infinity,
  })

  try {
    const target = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn
    const data = await target
    const resolved = resolvePromisePayload(success, data)
    createTypedToast('success', resolved.title, {
      ...baseOptions,
      ...resolved,
      id,
      duration: resolved.duration ?? baseOptions.duration ?? 4000,
    })
    return data
  } catch (err) {
    const resolved = resolvePromisePayload(error, err)
    createTypedToast('error', resolved.title, {
      ...baseOptions,
      ...resolved,
      id,
      duration: resolved.duration ?? baseOptions.duration ?? 4000,
    })
    throw err
  } finally {
    await onFinally?.()
  }
}

toastImpl.dismiss = dismissToast
toastImpl.getToasts = () => activeToasts.value.filter((item) => !item.dismissed)
toastImpl.getHistory = () => [...toastHistory.value]
toastImpl._resetForTesting = resetToastsForTesting

export const toast = toastImpl

/** Reactive access to current toasts (mirrors Sonner's useSonner()). */
export function useToasts() {
  const toasts = computed(() => activeToasts.value)
  const visibleToasts = computed(() => activeToasts.value.filter((item) => !item.dismissed))
  return {
    toasts,
    activeToasts: visibleToasts,
    dismiss: dismissToast,
  }
}
