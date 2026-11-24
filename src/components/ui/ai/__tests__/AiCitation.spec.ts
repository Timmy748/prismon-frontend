import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AiCitation } from '../index'

describe('AiCitation', () => {
  it('renders an inline button with default document kind and fallback label', () => {
    const wrapper = mount(AiCitation, {
      props: {
        targetId: 5,
      },
    })

    const button = wrapper.find('button.ai-citation')
    expect(button.exists()).toBe(true)
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toBe('document 5')
    expect(button.attributes('title')).toBeUndefined()
  })

  it('renders custom label, asset kind fallback, and optional title tooltip', () => {
    const assetWrapper = mount(AiCitation, {
      props: {
        kind: 'asset',
        targetId: 12,
      },
    })
    expect(assetWrapper.find('button.ai-citation').text()).toBe('asset 12')

    const titledWrapper = mount(AiCitation, {
      props: {
        kind: 'document',
        targetId: 8,
        label: 'Contrato Q4.pdf',
        title: 'Abrir documento Contrato Q4.pdf',
      },
    })
    const button = titledWrapper.find('button.ai-citation')
    expect(button.text()).toBe('Contrato Q4.pdf')
    expect(button.attributes('title')).toBe('Abrir documento Contrato Q4.pdf')
  })

  it('emits select payload with kind and targetId when clicked', async () => {
    const wrapper = mount(AiCitation, {
      props: {
        kind: 'asset',
        targetId: 42,
        label: 'Diagrama.png',
      },
    })

    await wrapper.find('button.ai-citation').trigger('click')

    expect(wrapper.emitted('select')).toEqual([[{ kind: 'asset', targetId: 42 }]])
  })
})
