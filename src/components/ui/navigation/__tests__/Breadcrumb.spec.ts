import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Breadcrumb, BreadcrumbLink, type BreadcrumbItem } from '../index'

const ITEMS: BreadcrumbItem[] = [
  { id: 'home', label: 'Início', href: '/' },
  { id: 'projects', label: 'Projetos', href: '/projects' },
  { id: 'current', label: 'Prismon' },
]

describe('BreadcrumbLink', () => {
  it('renders anchor when href is provided and emits click', async () => {
    const wrapper = mount(BreadcrumbLink, {
      props: {
        label: 'Início',
        href: '/home',
        showSeparator: true,
      },
    })

    expect(wrapper.classes()).toContain('breadcrumb-link')
    const anchor = wrapper.find('a')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toBe('/home')
    expect(anchor.text()).toBe('Início')
    expect(wrapper.find('.breadcrumb-link__separator').text()).toBe('>')

    await anchor.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('renders current item as non-interactive span with aria-current="page"', () => {
    const wrapper = mount(BreadcrumbLink, {
      props: {
        label: 'Atual',
        href: '/atual',
        current: true,
      },
    })

    expect(wrapper.classes()).toContain('breadcrumb-link--current')
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
    const control = wrapper.find('span.breadcrumb-link__control')
    expect(control.exists()).toBe(true)
    expect(control.attributes('aria-current')).toBe('page')
    expect(wrapper.find('.breadcrumb-link__separator').exists()).toBe(false)
  })
})

describe('Breadcrumb', () => {
  it('renders nav with ordered list from items and emits navigate only for non-current items', async () => {
    const wrapper = mount(Breadcrumb, {
      props: { items: ITEMS },
    })

    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('Breadcrumb')
    expect(nav.classes()).toContain('breadcrumb')
    expect(wrapper.find('ol').exists()).toBe(true)

    const links = wrapper.findAllComponents(BreadcrumbLink)
    expect(links).toHaveLength(3)
    expect(links[0]?.props('showSeparator')).toBe(true)
    expect(links[1]?.props('showSeparator')).toBe(true)
    expect(links[2]?.props('showSeparator')).toBe(false)
    expect(links[2]?.props('current')).toBe(true)

    await links[2]?.find('.breadcrumb-link__control').trigger('click')
    expect(wrapper.emitted('navigate')).toBeUndefined()

    await links[1]?.find('.breadcrumb-link__control').trigger('click')
    const emitted = wrapper.emitted('navigate')
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toEqual(ITEMS[1])
    expect(emitted?.[0]?.[1]).toBe(1)
    expect(emitted?.[0]?.[2]).toBeInstanceOf(MouseEvent)
  })

  it('supports default slot composition', () => {
    const wrapper = mount(Breadcrumb, {
      slots: {
        default: '<li class="custom-crumb">Raiz</li>',
      },
    })

    expect(wrapper.find('.custom-crumb').text()).toBe('Raiz')
  })
})
