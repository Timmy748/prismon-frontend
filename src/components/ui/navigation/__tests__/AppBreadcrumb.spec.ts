import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { AppBreadcrumb, AppBreadcrumbLink, type BreadcrumbItem } from '../index'

const ITEMS: BreadcrumbItem[] = [
  { id: 'home', label: 'Início', href: '/' },
  { id: 'projects', label: 'Projetos', href: '/projects' },
  { id: 'current', label: 'Prismon' },
]

describe('AppBreadcrumbLink', () => {
  it('renders anchor when href is provided and emits click', async () => {
    const wrapper = mount(AppBreadcrumbLink, {
      props: {
        label: 'Início',
        href: '/home',
        showSeparator: true,
      },
    })

    expect(wrapper.classes()).toContain('app-breadcrumb-link')
    const anchor = wrapper.find('a')
    expect(anchor.exists()).toBe(true)
    expect(anchor.attributes('href')).toBe('/home')
    expect(anchor.text()).toBe('Início')
    expect(wrapper.find('.app-breadcrumb-link__separator').text()).toBe('>')

    await anchor.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('renders current item with aria-current="page" and does not emit click', async () => {
    const wrapper = mount(AppBreadcrumbLink, {
      props: {
        label: 'Atual',
        href: '/atual',
        current: true,
      },
    })

    expect(wrapper.classes()).toContain('app-breadcrumb-link--current')
    expect(wrapper.find('a').exists()).toBe(false)
    const control = wrapper.find('.app-breadcrumb-link__control')
    expect(control.attributes('aria-current')).toBe('page')
    expect(wrapper.find('.app-breadcrumb-link__separator').exists()).toBe(false)

    await control.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

describe('AppBreadcrumb', () => {
  it('renders nav with ordered list from items and emits navigate', async () => {
    const wrapper = mount(AppBreadcrumb, {
      props: { items: ITEMS },
    })

    const nav = wrapper.find('nav')
    expect(nav.attributes('aria-label')).toBe('Breadcrumb')
    expect(nav.classes()).toContain('app-breadcrumb')
    expect(wrapper.find('ol').exists()).toBe(true)

    const links = wrapper.findAllComponents(AppBreadcrumbLink)
    expect(links).toHaveLength(3)
    expect(links[0]?.props('showSeparator')).toBe(true)
    expect(links[1]?.props('showSeparator')).toBe(true)
    expect(links[2]?.props('showSeparator')).toBe(false)
    expect(links[2]?.props('current')).toBe(true)

    await links[1]?.find('.app-breadcrumb-link__control').trigger('click')
    const emitted = wrapper.emitted('navigate')
    expect(emitted).toHaveLength(1)
    expect(emitted?.[0]?.[0]).toEqual(ITEMS[1])
    expect(emitted?.[0]?.[1]).toBe(1)
    expect(emitted?.[0]?.[2]).toBeInstanceOf(MouseEvent)
  })

  it('supports default slot composition', () => {
    const wrapper = mount(AppBreadcrumb, {
      slots: {
        default: '<li class="custom-crumb">Raiz</li>',
      },
    })

    expect(wrapper.find('.custom-crumb').text()).toBe('Raiz')
  })
})
