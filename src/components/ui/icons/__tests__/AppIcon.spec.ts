import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppIcon, ICON_PATHS, type IconColor, type IconName, type IconSize } from '../index'

const ALL_ICON_NAMES = Object.keys(ICON_PATHS) as IconName[]

const SIZES: IconSize[] = ['sm', 'md', 'lg', 'xl', '2xl']

const SEMANTIC_COLORS: Exclude<IconColor, 'inherit'>[] = [
  'primary',
  'secondary',
  'tertiary',
  'helper',
  'disabled',
  'brand',
  'brand-strong',
  'danger',
  'inverse',
  'on-brand',
  'on-danger',
]

describe('AppIcon', () => {
  it('registers all 24 Figma icons with viewBox and paths', () => {
    expect(ALL_ICON_NAMES).toHaveLength(24)

    for (const name of ALL_ICON_NAMES) {
      const entry = ICON_PATHS[name]
      expect(entry.viewBox).toBe('0 0 24 24')
      expect(entry.paths.length).toBeGreaterThan(0)
    }
  })

  it.each(ALL_ICON_NAMES)('renders icon "%s" with its SVG path and currentColor fill', (name) => {
    const wrapper = mount(AppIcon, {
      props: { name },
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('viewBox')).toBe(ICON_PATHS[name].viewBox)

    const paths = wrapper.findAll('path')
    expect(paths).toHaveLength(ICON_PATHS[name].paths.length)
    paths.forEach((pathWrapper, index) => {
      expect(pathWrapper.attributes('d')).toBe(ICON_PATHS[name].paths[index])
      expect(pathWrapper.attributes('fill')).toBe('currentColor')
    })
  })

  it('applies default size "xl" and color "inherit" (no color modifier class)', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'search' },
    })

    expect(wrapper.classes()).toContain('app-icon')
    expect(wrapper.classes()).toContain('app-icon--xl')
    expect(wrapper.classes()).not.toContain('app-icon--inherit')
  })

  it.each(SIZES)('applies size BEM modifier app-icon--%s', (size) => {
    const wrapper = mount(AppIcon, {
      props: { name: 'folder', size },
    })

    expect(wrapper.classes()).toContain('app-icon')
    expect(wrapper.classes()).toContain(`app-icon--${size}`)
  })

  it.each(SEMANTIC_COLORS)('applies color BEM modifier app-icon--%s', (color) => {
    const wrapper = mount(AppIcon, {
      props: { name: 'delete', color },
    })

    expect(wrapper.classes()).toContain('app-icon')
    expect(wrapper.classes()).toContain(`app-icon--${color}`)
  })

  it('marks decorative icons with aria-hidden="true" and no role or aria-label', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'close' },
    })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('treats empty or whitespace-only label as decorative', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'close', label: '   ' },
    })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.attributes('aria-label')).toBeUndefined()
  })

  it('sets role="img" and aria-label without aria-hidden when label is provided', () => {
    const wrapper = mount(AppIcon, {
      props: { name: 'search', label: 'Buscar arquivos' },
    })

    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Buscar arquivos')
    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
  })
})
