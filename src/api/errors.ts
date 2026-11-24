import axios from 'axios'
import type { HTTPValidationError, ValidationErrorItem } from '@/api/types/common'

export class ApiRequestError extends Error {
  readonly status?: number
  readonly fieldErrors: Record<string, string>
  readonly rawDetail?: unknown

  constructor(
    message: string,
    options: {
      status?: number
      fieldErrors?: Record<string, string>
      rawDetail?: unknown
    } = {},
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = options.status
    this.fieldErrors = options.fieldErrors ?? {}
    this.rawDetail = options.rawDetail
  }
}

function isValidationItem(value: unknown): value is ValidationErrorItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'loc' in value &&
    Array.isArray((value as ValidationErrorItem).loc) &&
    'msg' in value
  )
}

function defaultMessageForStatus(status?: number): string {
  switch (status) {
    case 400:
      return 'Requisição inválida. Revise os dados enviados.'
    case 401:
      return 'Sessão expirada ou credenciais inválidas.'
    case 403:
      return 'Você não tem permissão para executar esta ação.'
    case 404:
      return 'Recurso não encontrado.'
    case 409:
      return 'Conflito com os dados já cadastrados.'
    case 422:
      return 'Alguns campos enviados são inválidos.'
    case 500:
    case 502:
    case 503:
      return 'Erro interno no servidor. Tente novamente em instantes.'
    default:
      return 'Não foi possível concluir a comunicação com o servidor.'
  }
}

/**
 * Converts an unknown error (usually AxiosError) into a structured ApiRequestError.
 */
export function parseApiError(error: unknown, fallbackMessage?: string): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error
  }

  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return new ApiRequestError(error.message || fallbackMessage || defaultMessageForStatus())
    }
    return new ApiRequestError(fallbackMessage || defaultMessageForStatus())
  }

  const status = error.response?.status
  const data = error.response?.data as HTTPValidationError | Record<string, unknown> | undefined
  const fieldErrors: Record<string, string> = {}

  if (!error.response) {
    return new ApiRequestError(
      fallbackMessage || 'Falha de conexão com a API. Verifique se o servidor está ativo.',
      { rawDetail: error.message },
    )
  }

  const detail = data && typeof data === 'object' ? (data as HTTPValidationError).detail : undefined

  if (Array.isArray(detail)) {
    const messages: string[] = []
    for (const item of detail) {
      if (!isValidationItem(item)) continue
      const fieldKey = String(item.loc[item.loc.length - 1] ?? 'field')
      if (!(fieldKey in fieldErrors)) {
        fieldErrors[fieldKey] = item.msg
      }
      messages.push(`${fieldKey}: ${item.msg}`)
    }
    const message = messages[0] || fallbackMessage || defaultMessageForStatus(status)
    return new ApiRequestError(message, { status, fieldErrors, rawDetail: detail })
  }

  if (typeof detail === 'string' && detail.trim().length > 0) {
    return new ApiRequestError(detail, { status, rawDetail: detail })
  }

  const fallback = fallbackMessage || defaultMessageForStatus(status)
  return new ApiRequestError(fallback, { status, rawDetail: data })
}

export function getApiErrorMessage(error: unknown, fallbackMessage?: string): string {
  return parseApiError(error, fallbackMessage).message
}
