export interface CursorPaginationParams {
  cursor?: string | null
  limit?: number
}

export interface PageSchema<T> {
  items: T[]
  limit: number
  more: boolean
  cursor: string | null
}

export interface ValidationErrorItem {
  loc: Array<string | number>
  msg: string
  type: string
  input?: unknown
  ctx?: Record<string, unknown>
}

export interface HTTPValidationError {
  detail?: ValidationErrorItem[] | string
}

export interface PaginatedResult<T> {
  items: T[]
  limit: number
  hasMore: boolean
  nextCursor: string | null
}

/**
 * Translates a cursor-paginated API response into the decoupled domain format.
 */
export function mapPageFromApi<TApi, TDomain>(
  page: PageSchema<TApi>,
  mapItem: (item: TApi) => TDomain,
): PaginatedResult<TDomain> {
  return {
    items: page.items.map(mapItem),
    limit: page.limit,
    hasMore: page.more,
    nextCursor: page.cursor,
  }
}
