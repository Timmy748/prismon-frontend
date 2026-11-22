import { defineComponent, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { Dropdown, type DropdownItem } from '../index'

const ITEMS: DropdownItem[] = [
  { id: 'rename', label: 'Editar nome', icon: 'edit' },
  { id: 'delete', label: 'Deletar', icon: 'delete', variant: 'danger' },
]

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('Dropdown', () => {
  it('opens menu on trigger click, emits select with item id, and closes on Escape', async () => {
    const selected = ref<string[]>([])

    const Host = defineComponent({
      components: { Dropdown },
      setup() {
        return {
          items: ITEMS,
          onSelect: (id: string) => {
            selected.value.push(id)
          },
        }
      },
      template: `
        <Dropdown :items="items" aria-label="Ações da conversa" @select="onSelect">
          <template #trigger="{ toggle, open }">
            <button type="button" data-testid="dropdown-trigger" :data-open="String(open)" @click="toggle">
              Ações
            </button>
          </template>
        </Dropdown>
      `,
    })

    wrapper = mount(Host)

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    await wrapper.find('[data-testid="dropdown-trigger"]').trigger('click')
    const menu = wrapper.find('[role="menu"]')
    expect(menu.exists()).toBe(true)

    const menuItems = wrapper.findAll('[role="menuitem"]')
    expect(menuItems).toHaveLength(2)
    expect(menuItems[1]!.classes()).toContain('dropdown__item--danger')

    await menuItems[0]!.trigger('click')
    expect(selected.value).toEqual(['rename'])
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)

    await wrapper.find('[data-testid="dropdown-trigger"]').trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})
