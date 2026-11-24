<script setup lang="ts">
import { Fragment, computed, h, type FunctionalComponent, type VNodeChild } from 'vue'
import AiCitation, { type AiCitationKind, type AiCitationPayload } from './AiCitation.vue'

interface Props {
  content: string
  documentTitles?: Record<number, string>
  assetTitles?: Record<number, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'citation-click': [payload: AiCitationPayload]
}>()

type TableAlignment = 'left' | 'center' | 'right' | null

interface ListItemNode {
  text: string
  children: MarkdownBlock[]
}

type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'blockquote'; blocks: MarkdownBlock[] }
  | { type: 'list'; ordered: boolean; start: number; items: ListItemNode[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'hr' }
  | { type: 'table'; headers: string[]; alignments: TableAlignment[]; rows: string[][] }

const HEADING_RE = /^ {0,3}(#{1,6})(?:\s+(.*)|\s*$)/
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/
const HR_RE = /^ {0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/
const BLOCKQUOTE_RE = /^ {0,3}>\s?(.*)$/
const UL_ITEM_RE = /^( *)([-*+])\s+(.*)$/
const OL_ITEM_RE = /^( *)(\d+)\.\s+(.*)$/
const CITATION_RE = /^\[(document|documento|asset)\s+#?(\d+)\]/i
const ESCAPABLE_RE = /^[\\`*_{}[\]()#+\-.!|~>]/

const HEADING_TYPE_CLASS: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: 'type-expressive-heading-04',
  2: 'type-expressive-heading-03',
  3: 'type-expressive-heading-02',
  4: 'type-expressive-heading-01',
  5: 'type-expressive-heading-01',
  6: 'type-expressive-heading-01',
}

function splitTableRow(line: string): string[] {
  let trimmed = line.trim()
  if (trimmed.startsWith('|')) {
    trimmed = trimmed.slice(1)
  }
  if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) {
    trimmed = trimmed.slice(0, -1)
  }

  const cells: string[] = []
  let current = ''
  let inCode = false

  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!
    if (ch === '\\' && i + 1 < trimmed.length && trimmed[i + 1] === '|') {
      current += '|'
      i += 1
      continue
    }
    if (ch === '`') {
      inCode = !inCode
      current += ch
      continue
    }
    if (ch === '|' && !inCode) {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current.trim())
  return cells
}

function parseTableDelimiter(line: string): TableAlignment[] | null {
  if (!line.includes('|')) {
    return null
  }
  const cells = splitTableRow(line)
  if (cells.length === 0) {
    return null
  }
  const alignments: TableAlignment[] = []
  for (const cell of cells) {
    if (!/^:?-{1,}:?$/.test(cell)) {
      return null
    }
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')
    if (left && right) {
      alignments.push('center')
    } else if (left) {
      alignments.push('left')
    } else if (right) {
      alignments.push('right')
    } else {
      alignments.push(null)
    }
  }
  return alignments
}

function isTableStart(lines: string[], index: number): boolean {
  if (index + 1 >= lines.length) {
    return false
  }
  const headerLine = lines[index]!
  const delimiterLine = lines[index + 1]!
  if (!headerLine.includes('|')) {
    return false
  }
  const alignments = parseTableDelimiter(delimiterLine)
  if (!alignments) {
    return false
  }
  const headers = splitTableRow(headerLine)
  return headers.length === alignments.length
}

function isBlockStart(lines: string[], index: number): boolean {
  const line = lines[index] ?? ''
  if (!line.trim()) {
    return true
  }
  if (HR_RE.test(line) || HEADING_RE.test(line) || BLOCKQUOTE_RE.test(line)) {
    return true
  }
  const fenceMatch = line.match(FENCE_RE)
  if (fenceMatch) {
    const fence = fenceMatch[1]!
    const info = (fenceMatch[2] ?? '').trim()
    if (!(fence.startsWith('`') && info.includes('`'))) {
      return true
    }
  }
  if (UL_ITEM_RE.test(line) || OL_ITEM_RE.test(line)) {
    return true
  }
  return isTableStart(lines, index)
}

function parseList(
  lines: string[],
  startIndex: number,
  baseIndent: number,
  ordered: boolean,
): { block: MarkdownBlock; nextIndex: number } {
  const items: ListItemNode[] = []
  let i = startIndex
  let startNumber = 1

  while (i < lines.length) {
    const line = lines[i] ?? ''
    const match = ordered ? line.match(OL_ITEM_RE) : line.match(UL_ITEM_RE)
    if (!match || match[1]!.length !== baseIndent) {
      break
    }

    if (items.length === 0 && ordered) {
      startNumber = Number.parseInt(match[2]!, 10) || 1
    }

    const itemTextLines: string[] = [match[3] ?? '']
    const children: MarkdownBlock[] = []
    i += 1

    while (i < lines.length) {
      const nextLine = lines[i] ?? ''

      if (!nextLine.trim()) {
        let lookahead = i + 1
        while (lookahead < lines.length && !(lines[lookahead] ?? '').trim()) {
          lookahead += 1
        }
        if (lookahead >= lines.length) {
          i = lookahead
          break
        }
        const afterBlank = lines[lookahead]!
        const sameListMatch = ordered ? afterBlank.match(OL_ITEM_RE) : afterBlank.match(UL_ITEM_RE)
        if (sameListMatch && sameListMatch[1]!.length === baseIndent) {
          i = lookahead
          break
        }
        const leadingSpaces = afterBlank.match(/^( *)/)?.[1]?.length ?? 0
        if (leadingSpaces > baseIndent) {
          i = lookahead
          continue
        }
        break
      }

      const ulMatch = nextLine.match(UL_ITEM_RE)
      const olMatch = nextLine.match(OL_ITEM_RE)
      if (ulMatch || olMatch) {
        const nextIndent = (ulMatch ?? olMatch)![1]!.length
        if (nextIndent > baseIndent) {
          const nested = parseList(lines, i, nextIndent, Boolean(olMatch))
          children.push(nested.block)
          i = nested.nextIndex
          continue
        }
        break
      }

      if (isBlockStart(lines, i)) {
        const leadingSpaces = nextLine.match(/^( *)/)?.[1]?.length ?? 0
        if (leadingSpaces <= baseIndent) {
          break
        }
      }

      itemTextLines.push(nextLine.trim())
      i += 1
    }

    items.push({
      text: itemTextLines.join('\n').trim(),
      children,
    })
  }

  return {
    block: { type: 'list', ordered, start: startNumber, items },
    nextIndex: i,
  }
}

function parseLines(lines: string[]): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''

    if (!line.trim()) {
      i += 1
      continue
    }

    const fenceMatch = line.match(FENCE_RE)
    if (fenceMatch) {
      const fence = fenceMatch[1]!
      const fenceChar = fence[0]!
      const fenceLen = fence.length
      const info = (fenceMatch[2] ?? '').trim()

      if (!(fenceChar === '`' && info.includes('`'))) {
        const language = info.split(/\s+/)[0] ?? ''
        const closeRe = new RegExp(`^ {0,3}${fenceChar}{${fenceLen},}\\s*$`)
        const codeLines: string[] = []
        i += 1
        while (i < lines.length) {
          const codeLine = lines[i]!
          if (closeRe.test(codeLine)) {
            i += 1
            break
          }
          codeLines.push(codeLine)
          i += 1
        }
        blocks.push({
          type: 'code',
          language,
          code: codeLines.join('\n'),
        })
        continue
      }
    }

    if (HR_RE.test(line)) {
      blocks.push({ type: 'hr' })
      i += 1
      continue
    }

    const headingMatch = line.match(HEADING_RE)
    if (headingMatch) {
      const level = headingMatch[1]!.length as 1 | 2 | 3 | 4 | 5 | 6
      const text = (headingMatch[2] ?? '').replace(/\s+#+\s*$/, '').trim()
      blocks.push({ type: 'heading', level, text })
      i += 1
      continue
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length) {
        const quoteMatch = (lines[i] ?? '').match(BLOCKQUOTE_RE)
        if (!quoteMatch) {
          break
        }
        quoteLines.push(quoteMatch[1] ?? '')
        i += 1
      }
      blocks.push({
        type: 'blockquote',
        blocks: parseLines(quoteLines),
      })
      continue
    }

    if (isTableStart(lines, i)) {
      const headers = splitTableRow(lines[i]!)
      const alignments = parseTableDelimiter(lines[i + 1]!) ?? headers.map(() => null)
      const rows: string[][] = []
      i += 2

      while (i < lines.length) {
        const rowLine = lines[i] ?? ''
        if (!rowLine.trim() || !rowLine.includes('|')) {
          break
        }
        if (
          HR_RE.test(rowLine) ||
          HEADING_RE.test(rowLine) ||
          BLOCKQUOTE_RE.test(rowLine) ||
          FENCE_RE.test(rowLine)
        ) {
          break
        }
        const cells = splitTableRow(rowLine)
        const normalizedRow = headers.map((_, colIdx) => cells[colIdx] ?? '')
        rows.push(normalizedRow)
        i += 1
      }

      blocks.push({
        type: 'table',
        headers,
        alignments,
        rows,
      })
      continue
    }

    const ulMatch = line.match(UL_ITEM_RE)
    if (ulMatch) {
      const parsedList = parseList(lines, i, ulMatch[1]!.length, false)
      blocks.push(parsedList.block)
      i = parsedList.nextIndex
      continue
    }

    const olMatch = line.match(OL_ITEM_RE)
    if (olMatch) {
      const parsedList = parseList(lines, i, olMatch[1]!.length, true)
      blocks.push(parsedList.block)
      i = parsedList.nextIndex
      continue
    }

    const paragraphLines: string[] = [line]
    i += 1
    while (i < lines.length && !isBlockStart(lines, i)) {
      paragraphLines.push(lines[i]!)
      i += 1
    }
    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join('\n'),
    })
  }

  return blocks
}

function stripControlAndWhitespace(value: string): string {
  let result = ''
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i]!
    const code = ch.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f || /\s/.test(ch)) {
      continue
    }
    result += ch
  }
  return result
}

function sanitizeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return null
  }
  // Strip ASCII control characters and whitespace so obfuscated schemes like "java\nscript:" are rejected.
  const normalizedForScheme = stripControlAndWhitespace(trimmed)
  if (normalizedForScheme.startsWith('/') && !normalizedForScheme.startsWith('//')) {
    return trimmed
  }
  const lower = normalizedForScheme.toLowerCase()
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:')) {
    return trimmed
  }
  return null
}

function findClosingDelimiter(input: string, start: number, delimiter: string): number {
  let i = start
  while (i <= input.length - delimiter.length) {
    if (input[i] === '\\') {
      i += 2
      continue
    }
    if (input[i] === '`') {
      let tickLen = 1
      while (input[i + tickLen] === '`') {
        tickLen += 1
      }
      const closeTick = findClosingBackticks(input, i + tickLen, tickLen)
      if (closeTick !== -1) {
        i = closeTick + tickLen
        continue
      }
      i += tickLen
      continue
    }
    if (input.startsWith(delimiter, i)) {
      if (delimiter === '*' && input.startsWith('**', i) && !input.startsWith('***', i)) {
        const innerBoldClose = findClosingDelimiter(input, i + 2, '**')
        if (innerBoldClose !== -1) {
          i = innerBoldClose + 2
          continue
        }
      }
      if (delimiter === '_' && isWordChar(input[i + 1])) {
        i += 1
        continue
      }
      return i
    }
    i += 1
  }
  return -1
}

function findClosingBackticks(input: string, start: number, count: number): number {
  let i = start
  while (i < input.length) {
    if (input[i] === '`') {
      let run = 1
      while (input[i + run] === '`') {
        run += 1
      }
      if (run === count) {
        return i
      }
      i += run
      continue
    }
    i += 1
  }
  return -1
}

function isWordChar(ch: string | undefined): boolean {
  return Boolean(ch && /[A-Za-z0-9]/.test(ch))
}

function parseLink(
  input: string,
  start: number,
): { label: string; url: string; endIndex: number } | null {
  let i = start + 1
  let bracketDepth = 1

  while (i < input.length && bracketDepth > 0) {
    if (input[i] === '\\') {
      i += 2
      continue
    }
    if (input[i] === '`') {
      let tickLen = 1
      while (input[i + tickLen] === '`') {
        tickLen += 1
      }
      const closeTick = findClosingBackticks(input, i + tickLen, tickLen)
      if (closeTick !== -1) {
        i = closeTick + tickLen
        continue
      }
      i += tickLen
      continue
    }
    if (input[i] === '[') {
      bracketDepth += 1
    } else if (input[i] === ']') {
      bracketDepth -= 1
      if (bracketDepth === 0) {
        break
      }
    }
    i += 1
  }

  if (bracketDepth !== 0 || input[i + 1] !== '(') {
    return null
  }

  const label = input.slice(start + 1, i)
  let urlCursor = i + 2
  let parenDepth = 1

  while (urlCursor < input.length && parenDepth > 0) {
    if (input[urlCursor] === '\\') {
      urlCursor += 2
      continue
    }
    if (input[urlCursor] === '(') {
      parenDepth += 1
    } else if (input[urlCursor] === ')') {
      parenDepth -= 1
      if (parenDepth === 0) {
        break
      }
    }
    urlCursor += 1
  }

  if (parenDepth !== 0) {
    return null
  }

  let rawTarget = input.slice(i + 2, urlCursor).trim()
  if (rawTarget.startsWith('<') && rawTarget.includes('>')) {
    const closeAngle = rawTarget.indexOf('>')
    rawTarget = rawTarget.slice(1, closeAngle)
  } else {
    const titleMatch = rawTarget.match(/^(\S+)\s+["'(].*["')]$/)
    if (titleMatch) {
      rawTarget = titleMatch[1]!
    }
  }

  return {
    label,
    url: rawTarget,
    endIndex: urlCursor + 1,
  }
}

function appendTextWithBreaks(nodes: VNodeChild[], text: string) {
  if (!text) {
    return
  }
  const parts = text.split('\n')
  for (let i = 0; i < parts.length; i += 1) {
    let segment = parts[i]!
    if (i < parts.length - 1) {
      segment = segment.replace(/(?: {2,}|\\)$/, '')
    }
    if (segment) {
      const last = nodes[nodes.length - 1]
      if (typeof last === 'string') {
        nodes[nodes.length - 1] = last + segment
      } else {
        nodes.push(segment)
      }
    }
    if (i < parts.length - 1) {
      nodes.push('\n', h('br'))
    }
  }
}

function resolveCitationLabel(kind: AiCitationKind, targetId: number): string | undefined {
  return kind === 'document' ? props.documentTitles?.[targetId] : props.assetTitles?.[targetId]
}

function handleCitationSelect(payload: AiCitationPayload) {
  emit('citation-click', payload)
}

function parseInline(input: string): VNodeChild[] {
  const nodes: VNodeChild[] = []
  let pos = 0

  while (pos < input.length) {
    const ch = input[pos]!

    if (ch === '\\' && pos + 1 < input.length && ESCAPABLE_RE.test(input[pos + 1]!)) {
      appendTextWithBreaks(nodes, input[pos + 1]!)
      pos += 2
      continue
    }

    if (ch === '`') {
      let tickLen = 1
      while (input[pos + tickLen] === '`') {
        tickLen += 1
      }
      const closeIdx = findClosingBackticks(input, pos + tickLen, tickLen)
      if (closeIdx !== -1) {
        let code = input.slice(pos + tickLen, closeIdx)
        if (code.length >= 2 && code.startsWith(' ') && code.endsWith(' ') && code.trim()) {
          code = code.slice(1, -1)
        }
        nodes.push(h('code', { class: 'markdown-renderer__inline-code' }, code))
        pos = closeIdx + tickLen
        continue
      }
      appendTextWithBreaks(nodes, input.slice(pos, pos + tickLen))
      pos += tickLen
      continue
    }

    if (ch === '[') {
      const link = parseLink(input, pos)
      if (link) {
        const labelNodes = parseInline(link.label)
        const safeUrl = sanitizeUrl(link.url)
        if (safeUrl) {
          const isExternal = /^https?:/i.test(safeUrl)
          nodes.push(
            h(
              'a',
              {
                class: 'markdown-renderer__link',
                href: safeUrl,
                target: isExternal ? '_blank' : undefined,
                rel: isExternal ? 'noopener noreferrer' : undefined,
              },
              labelNodes,
            ),
          )
        } else {
          nodes.push(h('span', { class: 'markdown-renderer__unsafe-link' }, labelNodes))
        }
        pos = link.endIndex
        continue
      }

      const citationMatch = input.slice(pos).match(CITATION_RE)
      if (citationMatch) {
        const rawKind = citationMatch[1]!.toLowerCase()
        const kind: AiCitationKind = rawKind === 'asset' ? 'asset' : 'document'
        const targetId = Number.parseInt(citationMatch[2]!, 10)
        nodes.push(
          h(AiCitation, {
            kind,
            targetId,
            label: resolveCitationLabel(kind, targetId),
            onSelect: handleCitationSelect,
          }),
        )
        pos += citationMatch[0].length
        continue
      }
    }

    if (input.startsWith('***', pos) || input.startsWith('___', pos)) {
      const delim = input.slice(pos, pos + 3)
      const closeIdx = findClosingDelimiter(input, pos + 3, delim)
      if (closeIdx !== -1 && closeIdx > pos + 3) {
        nodes.push(
          h(
            'strong',
            { class: 'markdown-renderer__strong' },
            [h('em', { class: 'markdown-renderer__em' }, parseInline(input.slice(pos + 3, closeIdx)))],
          ),
        )
        pos = closeIdx + 3
        continue
      }
    }

    if (input.startsWith('**', pos) || input.startsWith('__', pos)) {
      const delim = input.slice(pos, pos + 2)
      const closeIdx = findClosingDelimiter(input, pos + 2, delim)
      if (closeIdx !== -1 && closeIdx > pos + 2) {
        nodes.push(
          h(
            'strong',
            { class: 'markdown-renderer__strong' },
            parseInline(input.slice(pos + 2, closeIdx)),
          ),
        )
        pos = closeIdx + 2
        continue
      }
    }

    if (input.startsWith('~~', pos)) {
      const closeIdx = findClosingDelimiter(input, pos + 2, '~~')
      if (closeIdx !== -1 && closeIdx > pos + 2) {
        nodes.push(
          h(
            'del',
            { class: 'markdown-renderer__del' },
            parseInline(input.slice(pos + 2, closeIdx)),
          ),
        )
        pos = closeIdx + 2
        continue
      }
    }

    if (ch === '*' || (ch === '_' && !isWordChar(input[pos - 1]) && !isWordChar(input[pos + 1]))) {
      const closeIdx = findClosingDelimiter(input, pos + 1, ch)
      if (closeIdx !== -1 && closeIdx > pos + 1) {
        nodes.push(
          h('em', { class: 'markdown-renderer__em' }, parseInline(input.slice(pos + 1, closeIdx))),
        )
        pos = closeIdx + 1
        continue
      }
    }

    const nextSpecial = input.slice(pos + 1).search(/[\\`[*_~]/)
    const end = nextSpecial === -1 ? input.length : pos + 1 + nextSpecial
    appendTextWithBreaks(nodes, input.slice(pos, end))
    pos = end
  }

  return nodes
}

function renderBlocks(blocks: MarkdownBlock[]): VNodeChild[] {
  return blocks.map((block) => {
    switch (block.type) {
      case 'heading': {
        const tag = `h${block.level}` as const
        return h(
          tag,
          {
            class: [
              'markdown-renderer__heading',
              `markdown-renderer__h${block.level}`,
              HEADING_TYPE_CLASS[block.level],
            ],
          },
          parseInline(block.text),
        )
      }
      case 'paragraph':
        return h(
          'p',
          { class: ['markdown-renderer__paragraph', 'type-expressive-body-02'] },
          parseInline(block.text),
        )
      case 'blockquote':
        return h(
          'blockquote',
          { class: ['markdown-renderer__blockquote', 'type-expressive-body-02'] },
          renderBlocks(block.blocks),
        )
      case 'list': {
        const tag = block.ordered ? 'ol' : 'ul'
        return h(
          tag,
          {
            class: [
              'markdown-renderer__list',
              block.ordered
                ? 'markdown-renderer__list--ordered'
                : 'markdown-renderer__list--unordered',
              'type-expressive-body-02',
            ],
            start: block.ordered && block.start !== 1 ? block.start : undefined,
          },
          block.items.map((item) =>
            h('li', { class: 'markdown-renderer__list-item' }, [
              ...parseInline(item.text),
              ...renderBlocks(item.children),
            ]),
          ),
        )
      }
      case 'code':
        return h(
          'pre',
          {
            class: 'markdown-renderer__pre',
            'data-language': block.language || undefined,
          },
          [
            h(
              'code',
              {
                class: [
                  'markdown-renderer__code',
                  'type-expressive-body-01',
                  block.language ? `language-${block.language}` : undefined,
                ],
              },
              block.code,
            ),
          ],
        )
      case 'hr':
        return h('hr', { class: 'markdown-renderer__hr' })
      case 'table':
        return h('div', { class: 'markdown-renderer__table-wrap' }, [
          h('table', { class: ['markdown-renderer__table', 'type-expressive-body-01'] }, [
            h('thead', null, [
              h(
                'tr',
                null,
                block.headers.map((header, idx) =>
                  h(
                    'th',
                    {
                      class: [
                        'markdown-renderer__th',
                        'type-expressive-body-01',
                        block.alignments[idx]
                          ? `markdown-renderer__cell--${block.alignments[idx]}`
                          : undefined,
                      ],
                    },
                    parseInline(header),
                  ),
                ),
              ),
            ]),
            block.rows.length > 0
              ? h(
                  'tbody',
                  null,
                  block.rows.map((row) =>
                    h(
                      'tr',
                      null,
                      row.map((cell, idx) =>
                        h(
                          'td',
                          {
                            class: [
                              'markdown-renderer__td',
                              'type-expressive-body-01',
                              block.alignments[idx]
                                ? `markdown-renderer__cell--${block.alignments[idx]}`
                                : undefined,
                            ],
                          },
                          parseInline(cell),
                        ),
                      ),
                    ),
                  ),
                )
              : null,
          ]),
        ])
    }
  })
}

const parsedBlocks = computed(() => {
  if (!props.content) {
    return []
  }
  const normalized = props.content.replace(/\r\n?/g, '\n')
  return parseLines(normalized.split('\n'))
})

const MarkdownTree: FunctionalComponent = () =>
  h(Fragment, null, renderBlocks(parsedBlocks.value))
</script>

<template>
  <div class="markdown-renderer">
    <component :is="MarkdownTree" />
  </div>
</template>

<style scoped>
.markdown-renderer {
  --markdown-text-primary: var(--text-primary);
  --markdown-text-secondary: var(--text-secondary);
  --markdown-text-muted: var(--text-tertiary);
  --markdown-link-color: var(--text-brand);
  --markdown-link-color-hover: var(--text-brand-strong);
  --markdown-border-subtle: var(--border-subtle-1);
  --markdown-border-strong: var(--border-subtle-2);
  --markdown-blockquote-border: var(--border-brand-subtle);
  --markdown-code-bg: var(--surface-subtle-hover);
  --markdown-code-border: var(--border-subtle-1);
  --markdown-table-header-bg: var(--surface-table-header);
  --markdown-block-gap: var(--spacing-4);
  --markdown-heading-margin-top: var(--spacing-5);
  --markdown-heading-margin-bottom: var(--spacing-3);

  color: var(--markdown-text-secondary);
  overflow-wrap: break-word;
  word-break: break-word;
}

.markdown-renderer :deep(> *:first-child) {
  margin-top: var(--spacing-0);
}

.markdown-renderer :deep(> *:last-child) {
  margin-bottom: var(--spacing-0);
}

.markdown-renderer :deep(.markdown-renderer__heading) {
  color: var(--markdown-text-primary);
  margin: var(--markdown-heading-margin-top) var(--spacing-0) var(--markdown-heading-margin-bottom);
}

.markdown-renderer :deep(.markdown-renderer__h1) {
  font-family: var(--type-expressive-heading-04-font-family);
  font-size: var(--type-expressive-heading-04-font-size);
  line-height: var(--type-expressive-heading-04-line-height);
  font-weight: var(--type-expressive-heading-04-font-weight);
  text-transform: var(--type-expressive-heading-04-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__h2) {
  font-family: var(--type-expressive-heading-03-font-family);
  font-size: var(--type-expressive-heading-03-font-size);
  line-height: var(--type-expressive-heading-03-line-height);
  font-weight: var(--type-expressive-heading-03-font-weight);
  text-transform: var(--type-expressive-heading-03-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__h3) {
  font-family: var(--type-expressive-heading-02-font-family);
  font-size: var(--type-expressive-heading-02-font-size);
  line-height: var(--type-expressive-heading-02-line-height);
  font-weight: var(--type-expressive-heading-02-font-weight);
  text-transform: var(--type-expressive-heading-02-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__h4),
.markdown-renderer :deep(.markdown-renderer__h5),
.markdown-renderer :deep(.markdown-renderer__h6) {
  font-family: var(--type-expressive-heading-01-font-family);
  font-size: var(--type-expressive-heading-01-font-size);
  line-height: var(--type-expressive-heading-01-line-height);
  font-weight: var(--type-expressive-heading-01-font-weight);
  text-transform: var(--type-expressive-heading-01-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__paragraph) {
  margin: var(--spacing-0) var(--spacing-0) var(--markdown-block-gap);
  font-family: var(--type-expressive-body-02-font-family);
  font-size: var(--type-expressive-body-02-font-size);
  line-height: var(--type-expressive-body-02-line-height);
  font-weight: var(--type-expressive-body-02-font-weight);
  text-transform: var(--type-expressive-body-02-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__blockquote) {
  margin: var(--spacing-0) var(--spacing-0) var(--markdown-block-gap);
  padding: var(--spacing-2) var(--spacing-0) var(--spacing-2) var(--spacing-5);
  border-left: var(--border-width-thick) solid var(--markdown-blockquote-border);
  color: var(--markdown-text-muted);
  font-family: var(--type-expressive-body-02-font-family);
  font-size: var(--type-expressive-body-02-font-size);
  line-height: var(--type-expressive-body-02-line-height);
  font-weight: var(--type-expressive-body-02-font-weight);
  text-transform: var(--type-expressive-body-02-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__blockquote > *:last-child) {
  margin-bottom: var(--spacing-0);
}

.markdown-renderer :deep(.markdown-renderer__list) {
  margin: var(--spacing-0) var(--spacing-0) var(--markdown-block-gap);
  padding-left: var(--spacing-6);
  font-family: var(--type-expressive-body-02-font-family);
  font-size: var(--type-expressive-body-02-font-size);
  line-height: var(--type-expressive-body-02-line-height);
  font-weight: var(--type-expressive-body-02-font-weight);
  text-transform: var(--type-expressive-body-02-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__list-item) {
  margin-bottom: var(--spacing-2);
}

.markdown-renderer :deep(.markdown-renderer__list-item:last-child) {
  margin-bottom: var(--spacing-0);
}

.markdown-renderer :deep(.markdown-renderer__list-item > .markdown-renderer__list) {
  margin-top: var(--spacing-2);
  margin-bottom: var(--spacing-0);
}

.markdown-renderer :deep(.markdown-renderer__pre) {
  margin: var(--spacing-0) var(--spacing-0) var(--markdown-block-gap);
  padding: var(--spacing-4) var(--spacing-5);
  background-color: var(--markdown-code-bg);
  border: var(--border-width-thin) solid var(--markdown-code-border);
  border-radius: var(--radius-none);
  overflow-x: auto;
}

.markdown-renderer :deep(.markdown-renderer__code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: var(--type-expressive-body-01-font-size);
  line-height: var(--type-expressive-body-01-line-height);
  font-weight: var(--type-expressive-body-01-font-weight);
  color: var(--markdown-text-primary);
  white-space: pre;
}

.markdown-renderer :deep(.markdown-renderer__inline-code) {
  padding: var(--spacing-0) var(--spacing-2);
  background-color: var(--markdown-code-bg);
  border: var(--border-width-thin) solid var(--markdown-code-border);
  border-radius: var(--radius-sm);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: var(--type-expressive-body-01-font-size);
  line-height: var(--type-expressive-body-01-line-height);
  color: var(--markdown-text-primary);
}

.markdown-renderer :deep(.markdown-renderer__hr) {
  margin: var(--spacing-5) var(--spacing-0);
  border: var(--border-width-none);
  border-top: var(--border-width-thin) solid var(--markdown-border-strong);
}

.markdown-renderer :deep(.markdown-renderer__strong) {
  font-weight: var(--font-weight-bold);
  color: var(--markdown-text-primary);
}

.markdown-renderer :deep(.markdown-renderer__em) {
  font-style: italic;
}

.markdown-renderer :deep(.markdown-renderer__del) {
  text-decoration: line-through;
  color: var(--markdown-text-muted);
}

.markdown-renderer :deep(.markdown-renderer__link) {
  color: var(--markdown-link-color);
  text-decoration: underline;
  text-underline-offset: var(--spacing-1);
  transition: color var(--duration-fast) var(--easing-standard);
}

.markdown-renderer :deep(.markdown-renderer__link:hover) {
  color: var(--markdown-link-color-hover);
}

.markdown-renderer :deep(.markdown-renderer__link:focus-visible) {
  outline: none;
  box-shadow: var(--shadow-focus-ring);
}

.markdown-renderer :deep(.markdown-renderer__table-wrap) {
  margin: var(--spacing-0) var(--spacing-0) var(--markdown-block-gap);
  overflow-x: auto;
}

.markdown-renderer :deep(.markdown-renderer__table) {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--type-expressive-body-01-font-family);
  font-size: var(--type-expressive-body-01-font-size);
  line-height: var(--type-expressive-body-01-line-height);
  font-weight: var(--type-expressive-body-01-font-weight);
  text-transform: var(--type-expressive-body-01-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__th),
.markdown-renderer :deep(.markdown-renderer__td) {
  padding: var(--spacing-3) var(--spacing-4);
  border: var(--border-width-thin) solid var(--markdown-border-subtle);
  text-align: left;
  font-family: var(--type-expressive-body-01-font-family);
  font-size: var(--type-expressive-body-01-font-size);
  line-height: var(--type-expressive-body-01-line-height);
  text-transform: var(--type-expressive-body-01-text-transform);
}

.markdown-renderer :deep(.markdown-renderer__th) {
  background-color: var(--markdown-table-header-bg);
  font-weight: var(--font-weight-semibold);
  color: var(--markdown-text-primary);
}

.markdown-renderer :deep(.markdown-renderer__td) {
  font-weight: var(--type-expressive-body-01-font-weight);
  color: var(--markdown-text-secondary);
}

.markdown-renderer :deep(.markdown-renderer__cell--left) {
  text-align: left;
}

.markdown-renderer :deep(.markdown-renderer__cell--center) {
  text-align: center;
}

.markdown-renderer :deep(.markdown-renderer__cell--right) {
  text-align: right;
}
</style>
