<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Button } from '../buttons'
import { type IconName } from '../icons'
import BatchActionBar, { type BatchAction } from './BatchActionBar.vue'
import Pagination from './Pagination.vue'

export type DataTableColumnAlign = 'left' | 'center' | 'right'

export interface DataTableColumn {
  key: string
  label: string
  align?: DataTableColumnAlign
}

interface Props {
  columns: DataTableColumn[]
  rows: Record<string, unknown>[]
  rowKey?: string
  title?: string
  description?: string
  selectable?: boolean
  selectedRowKeys?: Array<string | number>
  showPagination?: boolean
  canPrevious?: boolean
  canNext?: boolean
  actionLabel?: string
  actionIcon?: IconName
  batchActions?: BatchAction[]
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  selectable: false,
  selectedRowKeys: () => [],
  showPagination: false,
  canPrevious: true,
  canNext: true,
  batchActions: () => [],
})

const emit = defineEmits<{
  'row-click': [row: Record<string, unknown>, rowIndex: number]
  'toggle-select': [rowKey: string | number, row: Record<string, unknown>]
  'previous-page': []
  'next-page': []
  'primary-action': []
  'batch-action': [actionId: string]
  'clear-selection': []
}>()

const slots = useSlots()

const hasHeader = computed(() => Boolean(props.title || props.description || slots.header))

const hasToolbar = computed(() =>
  Boolean(
    props.showPagination || slots['toolbar-left'] || props.actionLabel || slots['toolbar-right'],
  ),
)

const selectedKeySet = computed(() => new Set(props.selectedRowKeys))

function getRowKey(row: Record<string, unknown>, rowIndex: number): string | number {
  const rawKey = row[props.rowKey]
  if (typeof rawKey === 'string' || typeof rawKey === 'number') {
    return rawKey
  }
  return rowIndex
}

function isRowSelected(row: Record<string, unknown>, rowIndex: number): boolean {
  return selectedKeySet.value.has(getRowKey(row, rowIndex))
}

function getRowClasses(row: Record<string, unknown>, rowIndex: number) {
  return [
    'data-table__row',
    props.selectable ? 'data-table__row--selectable' : undefined,
    isRowSelected(row, rowIndex) ? 'data-table__row--selected' : undefined,
  ]
}

function getHeaderCellClasses(column: DataTableColumn) {
  return [
    'data-table__header-cell',
    column.align ? `data-table__header-cell--align-${column.align}` : undefined,
  ]
}

function getCellClasses(column: DataTableColumn) {
  return ['data-table__cell', column.align ? `data-table__cell--align-${column.align}` : undefined]
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function handleRowClick(row: Record<string, unknown>, rowIndex: number) {
  emit('row-click', row, rowIndex)
  if (props.selectable) {
    emit('toggle-select', getRowKey(row, rowIndex), row)
  }
}

function handleClearSelection() {
  emit('clear-selection')
}
</script>

<template>
  <section class="data-table">
    <header v-if="hasHeader" class="data-table__header">
      <slot name="header">
        <h2 v-if="title" class="data-table__title">{{ title }}</h2>
        <p v-if="description" class="data-table__description">{{ description }}</p>
      </slot>
    </header>

    <div class="data-table__container">
      <div v-if="hasToolbar" class="data-table__toolbar">
        <div class="data-table__toolbar-left">
          <slot name="toolbar-left">
            <Pagination
              v-if="showPagination"
              :can-previous="canPrevious"
              :can-next="canNext"
              @previous="emit('previous-page')"
              @next="emit('next-page')"
            />
          </slot>
        </div>

        <div class="data-table__toolbar-right">
          <slot name="toolbar-right">
            <Button
              v-if="actionLabel"
              variant="primary"
              :icon="actionIcon"
              @click="emit('primary-action')"
            >
              {{ actionLabel }}
            </Button>
          </slot>
        </div>
      </div>

      <div class="data-table__table-wrapper">
        <table class="data-table__table">
          <thead class="data-table__head">
            <tr class="data-table__header-row">
              <th
                v-for="column in columns"
                :key="column.key"
                scope="col"
                :class="getHeaderCellClasses(column)"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>

          <tbody class="data-table__body">
            <tr
              v-for="(row, rowIndex) in rows"
              :key="getRowKey(row, rowIndex)"
              :class="getRowClasses(row, rowIndex)"
              :tabindex="selectable ? 0 : undefined"
              :aria-selected="selectable ? isRowSelected(row, rowIndex) : undefined"
              @click="handleRowClick(row, rowIndex)"
              @keydown.enter.prevent="handleRowClick(row, rowIndex)"
              @keydown.space.prevent="handleRowClick(row, rowIndex)"
            >
              <td v-for="column in columns" :key="column.key" :class="getCellClasses(column)">
                <slot
                  :name="`cell-${column.key}`"
                  :row="row"
                  :value="row[column.key]"
                  :row-index="rowIndex"
                >
                  {{ formatCellValue(row[column.key]) }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <slot
        v-if="selectedRowKeys.length > 0"
        name="batch-bar"
        :selected-count="selectedRowKeys.length"
        :selected-row-keys="selectedRowKeys"
        :actions="batchActions"
        :clear-selection="handleClearSelection"
      >
        <BatchActionBar
          class="data-table__batch-bar"
          :selected-count="selectedRowKeys.length"
          :actions="batchActions"
          @action="emit('batch-action', $event)"
          @cancel="handleClearSelection"
        />
      </slot>
    </div>
  </section>
</template>

<style scoped>
.data-table {
  --data-table-header-gap: var(--spacing-2);
  --data-table-header-margin-bottom: var(--spacing-7);
  --data-table-title-color: var(--text-primary);
  --data-table-title-font-family: var(--type-heading-04-font-family);
  --data-table-title-font-size: var(--type-heading-04-font-size);
  --data-table-title-line-height: var(--type-heading-04-line-height);
  --data-table-title-font-weight: var(--type-heading-04-font-weight);
  --data-table-title-text-transform: var(--type-heading-04-text-transform);
  --data-table-description-color: var(--text-secondary);
  --data-table-description-font-family: var(--type-body-02-font-family);
  --data-table-description-font-size: var(--type-body-02-font-size);
  --data-table-description-line-height: var(--type-body-02-line-height);
  --data-table-description-font-weight: var(--type-body-02-font-weight);
  --data-table-description-text-transform: var(--type-body-02-text-transform);
  --data-table-toolbar-gap: var(--spacing-4);
  --data-table-toolbar-margin-bottom: var(--spacing-4);
  --data-table-header-cell-bg: var(--surface-table-header);
  --data-table-header-cell-color: var(--text-primary);
  --data-table-header-cell-padding-y: var(--spacing-3);
  --data-table-header-cell-padding-x: var(--spacing-5);
  --data-table-header-cell-font-family: var(--type-body-compact-02-font-family);
  --data-table-header-cell-font-size: var(--type-body-compact-02-font-size);
  --data-table-header-cell-line-height: var(--type-body-compact-02-line-height);
  --data-table-header-cell-font-weight: var(--type-body-compact-02-font-weight);
  --data-table-header-cell-text-transform: var(--type-body-compact-02-text-transform);
  --data-table-row-bg: var(--surface-transparent);
  --data-table-row-bg-hover: var(--surface-subtle);
  --data-table-row-bg-selected: var(--surface-table-selected);
  --data-table-row-cursor: default;
  --data-table-row-transition-duration: var(--duration-fast);
  --data-table-row-transition-easing: var(--easing-standard);
  --data-table-row-focus-shadow: var(--shadow-focus-ring);
  --data-table-cell-padding: var(--spacing-3);
  --data-table-cell-border-width: var(--border-width-thin);
  --data-table-cell-border-color: var(--border-subtle-1);
  --data-table-cell-color: var(--text-secondary);
  --data-table-cell-font-family: var(--type-body-compact-02-font-family);
  --data-table-cell-font-size: var(--type-body-compact-02-font-size);
  --data-table-cell-line-height: var(--type-body-compact-02-line-height);
  --data-table-cell-font-weight: var(--type-body-compact-02-font-weight);
  --data-table-cell-text-transform: var(--type-body-compact-02-text-transform);
  --data-table-cell-align: left;
  --data-table-reset-space: var(--spacing-0);

  width: 100%;
}

.data-table__header {
  display: flex;
  flex-direction: column;
  gap: var(--data-table-header-gap);
  margin-bottom: var(--data-table-header-margin-bottom);
}

.data-table__title {
  margin: var(--data-table-reset-space);
  color: var(--data-table-title-color);
  font-family: var(--data-table-title-font-family);
  font-size: var(--data-table-title-font-size);
  line-height: var(--data-table-title-line-height);
  font-weight: var(--data-table-title-font-weight);
  text-transform: var(--data-table-title-text-transform);
}

.data-table__description {
  margin: var(--data-table-reset-space);
  color: var(--data-table-description-color);
  font-family: var(--data-table-description-font-family);
  font-size: var(--data-table-description-font-size);
  line-height: var(--data-table-description-line-height);
  font-weight: var(--data-table-description-font-weight);
  text-transform: var(--data-table-description-text-transform);
}

.data-table__container {
  width: 100%;
}

.data-table__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--data-table-toolbar-gap);
  margin-bottom: var(--data-table-toolbar-margin-bottom);
}

.data-table__toolbar-left,
.data-table__toolbar-right {
  display: inline-flex;
  align-items: center;
}

.data-table__table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.data-table__table {
  width: 100%;
  border-collapse: collapse;
}

.data-table__header-cell {
  background-color: var(--data-table-header-cell-bg);
  color: var(--data-table-header-cell-color);
  padding: var(--data-table-header-cell-padding-y) var(--data-table-header-cell-padding-x);
  text-align: var(--data-table-cell-align);
  font-family: var(--data-table-header-cell-font-family);
  font-size: var(--data-table-header-cell-font-size);
  line-height: var(--data-table-header-cell-line-height);
  font-weight: var(--data-table-header-cell-font-weight);
  text-transform: var(--data-table-header-cell-text-transform);
}

.data-table__row {
  background-color: var(--data-table-row-bg);
  cursor: var(--data-table-row-cursor);
  transition: background-color var(--data-table-row-transition-duration)
    var(--data-table-row-transition-easing);
}

.data-table__row--selectable {
  --data-table-row-cursor: pointer;
}

.data-table__row--selectable:hover {
  --data-table-row-bg: var(--data-table-row-bg-hover);
}

.data-table__row--selected,
.data-table__row--selected.data-table__row--selectable:hover {
  --data-table-row-bg: var(--data-table-row-bg-selected);
}

.data-table__row--selectable:focus-visible {
  outline: none;
  box-shadow: var(--data-table-row-focus-shadow);
}

.data-table__cell {
  padding: var(--data-table-cell-padding);
  border-bottom: var(--data-table-cell-border-width) solid var(--data-table-cell-border-color);
  color: var(--data-table-cell-color);
  text-align: var(--data-table-cell-align);
  font-family: var(--data-table-cell-font-family);
  font-size: var(--data-table-cell-font-size);
  line-height: var(--data-table-cell-line-height);
  font-weight: var(--data-table-cell-font-weight);
  text-transform: var(--data-table-cell-text-transform);
}

.data-table__header-cell--align-left,
.data-table__cell--align-left {
  --data-table-cell-align: left;
}

.data-table__header-cell--align-center,
.data-table__cell--align-center {
  --data-table-cell-align: center;
}

.data-table__header-cell--align-right,
.data-table__cell--align-right {
  --data-table-cell-align: right;
}
</style>
