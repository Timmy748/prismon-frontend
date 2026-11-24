const DATE_FORMATTER_BR = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const DATE_COMPACT_BR = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/**
 * Formats an ISO date string into a readable pt-BR label (e.g. "22 nov 2026" or "22/11/2026").
 */
export function formatApiDate(
  iso: string | null | undefined,
  style: 'short' | 'compact' = 'short',
): string {
  if (!iso) return '—'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return iso
  }
  if (style === 'compact') {
    return DATE_COMPACT_BR.format(parsed)
  }
  return DATE_FORMATTER_BR.format(parsed).replace(/\./g, '')
}
