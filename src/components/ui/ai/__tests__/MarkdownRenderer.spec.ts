import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AiCitation, MarkdownRenderer } from '../index'

describe('MarkdownRenderer', () => {
  it('renders headings H1-H6 with expressive type set classes', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: [
          '# Título Um',
          '## Título Dois',
          '### Título Três',
          '#### Título Quatro',
          '##### Título Cinco',
          '###### Título Seis',
        ].join('\n\n'),
      },
    })

    const h1 = wrapper.find('h1')
    const h2 = wrapper.find('h2')
    const h3 = wrapper.find('h3')
    const h4 = wrapper.find('h4')
    const h5 = wrapper.find('h5')
    const h6 = wrapper.find('h6')

    expect(h1.text()).toBe('Título Um')
    expect(h1.classes()).toContain('type-expressive-heading-04')

    expect(h2.text()).toBe('Título Dois')
    expect(h2.classes()).toContain('type-expressive-heading-03')

    expect(h3.text()).toBe('Título Três')
    expect(h3.classes()).toContain('type-expressive-heading-02')

    expect(h4.text()).toBe('Título Quatro')
    expect(h4.classes()).toContain('type-expressive-heading-01')
    expect(h5.classes()).toContain('type-expressive-heading-01')
    expect(h6.classes()).toContain('type-expressive-heading-01')
  })

  it('renders paragraphs with expressive body 02 and soft line breaks', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: 'Primeira linha\nSegunda linha\n\nSegundo parágrafo',
      },
    })

    const paragraphs = wrapper.findAll('p')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs[0]?.classes()).toContain('type-expressive-body-02')
    expect(paragraphs[0]?.find('br').exists()).toBe(true)
    expect(paragraphs[0]?.text()).toContain('Primeira linha')
    expect(paragraphs[0]?.text()).toContain('Segunda linha')
    expect(paragraphs[1]?.text()).toBe('Segundo parágrafo')
  })

  it('renders blockquotes, horizontal rules, unordered and ordered lists', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: [
          '> Citação importante',
          '',
          '---',
          '',
          '- Item A',
          '* Item B',
          '  - Subitem B1',
          '',
          '1. Passo um',
          '2. Passo dois',
        ].join('\n'),
      },
    })

    const blockquote = wrapper.find('blockquote')
    expect(blockquote.exists()).toBe(true)
    expect(blockquote.classes()).toContain('type-expressive-body-02')
    expect(blockquote.text()).toBe('Citação importante')

    expect(wrapper.find('hr').exists()).toBe(true)

    const ul = wrapper.find('ul')
    expect(ul.exists()).toBe(true)
    expect(ul.classes()).toContain('type-expressive-body-02')
    expect(ul.findAll(':scope > li')).toHaveLength(2)
    expect(ul.find(':scope > li > ul > li').text()).toBe('Subitem B1')

    const ol = wrapper.find('ol')
    expect(ol.exists()).toBe(true)
    expect(ol.findAll('li')).toHaveLength(2)
    expect(ol.findAll('li')[0]?.text()).toBe('Passo um')
  })

  it('renders closed and unclosed streaming fenced code blocks gracefully', () => {
    const closedWrapper = mount(MarkdownRenderer, {
      props: {
        content: '```ts\nconst answer = 42\n```',
      },
    })

    const closedPre = closedWrapper.find('pre')
    expect(closedPre.attributes('data-language')).toBe('ts')
    expect(closedPre.find('code').text()).toBe('const answer = 42')

    const streamingWrapper = mount(MarkdownRenderer, {
      props: {
        content: '```json\n{"status": "streaming"',
      },
    })

    const streamingPre = streamingWrapper.find('pre')
    expect(streamingPre.exists()).toBe(true)
    expect(streamingPre.attributes('data-language')).toBe('json')
    expect(streamingPre.find('code').text()).toBe('{"status": "streaming"')
  })

  it('renders GFM pipe tables with secondary expressive body 01 typography', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: [
          '| Campo | Valor |',
          '| :--- | ---: |',
          '| Status | Ativo |',
          '| Total | 10 |',
        ].join('\n'),
      },
    })

    const table = wrapper.find('table')
    expect(table.exists()).toBe(true)
    expect(table.classes()).toContain('type-expressive-body-01')

    const headers = table.findAll('th')
    expect(headers).toHaveLength(2)
    expect(headers[0]?.classes()).toContain('type-expressive-body-01')
    expect(headers[1]?.classes()).toContain('markdown-renderer__cell--right')

    const cells = table.findAll('tbody td')
    expect(cells).toHaveLength(4)
    expect(cells[0]?.text()).toBe('Status')
    expect(cells[1]?.text()).toBe('Ativo')
    expect(cells[1]?.classes()).toContain('markdown-renderer__cell--right')
  })

  it('renders inline formatting and safe links', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content:
          'Texto **negrito**, *itálico*, ~~riscado~~, `codigo`, [Docs](https://example.com), [Mail](mailto:a@b.com), [Rel](/docs/1).',
      },
    })

    expect(wrapper.find('strong').text()).toBe('negrito')
    expect(wrapper.find('em').text()).toBe('itálico')
    expect(wrapper.find('del').text()).toBe('riscado')
    expect(wrapper.find('code').text()).toBe('codigo')

    const links = wrapper.findAll('a')
    expect(links).toHaveLength(3)
    expect(links[0]?.attributes('href')).toBe('https://example.com')
    expect(links[0]?.attributes('target')).toBe('_blank')
    expect(links[0]?.attributes('rel')).toBe('noopener noreferrer')
    expect(links[1]?.attributes('href')).toBe('mailto:a@b.com')
    expect(links[2]?.attributes('href')).toBe('/docs/1')
  })

  it('renders inline citations with AiCitation and emits citation-click on select', async () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: 'Veja [document 5], [documento #7] e [ASSET 12] para detalhes.',
        documentTitles: { 5: 'Ata de Reunião.pdf' },
        assetTitles: { 12: 'Planta Baixa.png' },
      },
    })

    const citations = wrapper.findAllComponents(AiCitation)
    expect(citations).toHaveLength(3)

    expect(citations[0]?.props('kind')).toBe('document')
    expect(citations[0]?.props('targetId')).toBe(5)
    expect(citations[0]?.props('label')).toBe('Ata de Reunião.pdf')
    expect(citations[0]?.text()).toBe('Ata de Reunião.pdf')

    expect(citations[1]?.props('kind')).toBe('document')
    expect(citations[1]?.props('targetId')).toBe(7)
    expect(citations[1]?.text()).toBe('document 7')

    expect(citations[2]?.props('kind')).toBe('asset')
    expect(citations[2]?.props('targetId')).toBe(12)
    expect(citations[2]?.props('label')).toBe('Planta Baixa.png')

    await citations[0]!.find('button').trigger('click')
    await citations[2]!.find('button').trigger('click')

    expect(wrapper.emitted('citation-click')).toEqual([
      [{ kind: 'document', targetId: 5 }],
      [{ kind: 'asset', targetId: 12 }],
    ])
  })

  it('neutralizes raw HTML script/img tags and unsafe javascript/data links (XSS safety)', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: [
          '<script>alert(1)</script>',
          '<img src=x onerror=alert(1)>',
          '[Clique aqui](javascript:alert(1))',
          '[Obfuscated](java\nscript:alert(1))',
          '[Data](data:text/html,<script>alert(1)</script>)',
          '[Proto](//evil.example.com)',
        ].join('\n\n'),
      },
    })

    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.findAll('a')).toHaveLength(0)
    expect(wrapper.text()).toContain('<script>alert(1)</script>')
    expect(wrapper.text()).toContain('Clique aqui')
  })

  it('handles incomplete inline markdown tokens cleanly during SSE streaming', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: 'Carregando **negrito aberto e `codigo e [document 9',
      },
    })

    expect(wrapper.find('strong').exists()).toBe(false)
    expect(wrapper.find('code').exists()).toBe(false)
    expect(wrapper.findComponent(AiCitation).exists()).toBe(false)
    expect(wrapper.text()).toBe('Carregando **negrito aberto e `codigo e [document 9')
  })
})
