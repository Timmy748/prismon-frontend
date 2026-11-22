import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FileAttachmentCard } from '../index'

describe('FileAttachmentCard', () => {
  it('renders filename and fileSize without image when thumbnailUrl is omitted', () => {
    const wrapper = mount(FileAttachmentCard, {
      props: {
        filename: 'contrato-2026.pdf',
        fileSize: '2.4 MB',
      },
    })

    expect(wrapper.classes()).toContain('file-attachment-card')
    expect(wrapper.find('.file-attachment-card__filename').text()).toBe('contrato-2026.pdf')
    expect(wrapper.find('.file-attachment-card__size').text()).toBe('2.4 MB')
    expect(wrapper.find('.file-attachment-card__thumbnail').exists()).toBe(true)
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('renders thumbnail image when thumbnailUrl is provided', () => {
    const wrapper = mount(FileAttachmentCard, {
      props: {
        filename: 'preview.png',
        fileSize: '420 KB',
        thumbnailUrl: 'https://example.com/preview.png',
      },
    })

    const image = wrapper.find('img.file-attachment-card__image')
    expect(image.exists()).toBe(true)
    expect(image.attributes('src')).toBe('https://example.com/preview.png')
    expect(image.attributes('alt')).toBe('preview.png')
  })

  it('renders #thumbnail slot and overrides thumbnailUrl fallback', () => {
    const wrapper = mount(FileAttachmentCard, {
      props: {
        filename: 'planilha.xlsx',
        fileSize: '1.1 MB',
        thumbnailUrl: 'https://example.com/fallback.png',
      },
      slots: {
        thumbnail: '<span data-testid="custom-thumb">XLS</span>',
      },
    })

    expect(wrapper.find('[data-testid="custom-thumb"]').text()).toBe('XLS')
    expect(wrapper.find('img').exists()).toBe(false)
  })
})
