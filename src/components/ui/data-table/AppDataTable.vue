<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { AppButton } from '../buttons'
import { type IconName } from '../icons'
import AppBatchActionBar, { type BatchAction } from './AppBatchActionBar.vue'
import AppPagination from './AppPagination.vue'

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
    'app-data-table__row',
    props.selectable ? 'app-data-table__row--selectable' : undefined,
    isRowSelected(row, rowIndex) ? 'app-data-table__row--selected' : undefined,
  ]
}

function getHeaderCellClasses(column: DataTableColumn) {
  return [
    'app-data-table__header-cell',
    column.align ? `app-data-table__header-cell--align-${column.align}` : undefined,
  ]
}

function getCellClasses(column: DataTableColumn) {
  return [
    'app-data-table__cell',
    column.align ? `app-data-table__cell--align-${column.align}` : undefined,
  ]
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
  <section class="app-data-table">
    <header v-if="hasHeader" class="app-data-table__header">
      <slot name="header">
        <h2 v-if="title" class="app-data-table__title">{{ title }}</h2>
        <p v-if="description" class="app-data-table__description">{{ description }}</p>
      </slot>
    </header>

    <div class="app-data-table__container">
      <div v-if="hasToolbar" class="app-data-table__toolbar">
        <div class="app-data-table__toolbar-left">
          <slot name="toolbar-left">
            <AppPagination
              v-if="showPagination"
              :can-previous="canPrevious"
              :can-next="canNext"
              @previous="emit('previous-page')"
              @next="emit('next-page')"
            />
          </slot>
        </div>

        <div class="app-data-table__toolbar-right">
          <slot name="toolbar-right">
            <AppButton
              v-if="actionLabel"
              variant="primary"
              :icon="actionIcon"
              @click="emit('primary-action')"
            >
              {{ actionLabel }}
            </AppButton>
          </slot>
        </div>
      </div>

      <div class="app-data-table__table-wrapper">
        <table class="app-data-table__table">
          <thead class="app-data-table__head">
            <tr class="app-data-table__header-row">
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

          <tbody class="app-data-table__body">
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
        <AppBatchActionBar
          class="app-data-table__batch-bar"
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
.app-data-table {
  --app-data-table-header-gap: var(--spacing-2);
  --app-data-table-header-margin-bottom: var(--spacing-7);
  --app-data-table-title-color: var(--text-primary);
  --app-data-table-title-font-family: var(--type-heading-04-font-family);
  --app-data-table-title-font-size: var(--type-heading-04-font-size);
  --app-data-table-title-line-height: var(--type-heading-04-line-height);
  --app-data-table-title-font-weight: var(--type-heading-04-font-weight);
  --app-data-table-title-text-transform: var(--type-heading-04-text-transform);
  --app-data-table-description-color: var(--text-secondary);
  --app-data-table-description-font-family: var(--type-body-02-font-family);
  --app-data-table-description-font-size: var(--type-body-02-font-size);
  --app-data-table-description-line-height: var(--type-body-02-line-height);
  --app-data-table-description-font-weight: var(--type-body-02-font-weight);
  --app-data-table-description-text-transform: var(--type-body-02-text-transform);
  --app-data-table-toolbar-gap: var(--spacing-4);
  --app-data-table-toolbar-margin-bottom: var(--spacing-4);
  --app-data-table-header-cell-bg: var(--surface-table-header);
  --app-data-table-header-cell-color: var(--text-primary);
  --app-data-table-header-cell-padding-y: var(--spacing-3);
  --app-data-table-header-cell-padding-x: var(--spacing-5);
  --app-data-table-header-cell-font-family: var(--type-body-compact-02-font-family);
  --app-data-table-header-cell-font-size: var(--type-body-compact-02-font-size);
  --app-data-table-header-cell-line-height: var(--type-body-compact-02-line-height);
  --app-data-table-header-cell-font-weight: var(--type-body-compact-02-font-weight);
  --app-data-table-header-cell-text-transform: var(--type-body-compact-02-text-transform);
  --app-data-table-row-bg: var(--surface-transparent);
  --app-data-table-row-bg-hover: var(--surface-subtle-hover);
  --app-data-table-row-bg-selected: var(--surface-brand-subtle);
  --app-data-table-row-cursor: default;
  --app-data-table-row-transition-duration: var(--duration-fast);
  --app-data-table-row-transition-easing: var(--easing-standard);
  --app-data-table-row-focus-shadow: var(--shadow-focus-ring);
  --app-data-table-cell-padding: var(--spacing-3);
  --app-data-table-cell-border-width: var(--border-width-thin);
  --app-data-table-cell-border-color: var(--border-subtle-1);
  --app-data-table-cell-color: var(--text-secondary);
  --app-data-table-cell-font-family: var(--type-body-compact-02-font-family);
  --app-data-table-cell-font-size: var(--type-body-compact-02-font-size);
  --app-data-table-cell-line-height: var(--type-body-compact-02-line-height);
  --app-data-table-cell-font-weight: var(--type-body-compact-02-font-weight);
  --app-data-table-cell-text-transform: var(--type-body-compact-02-text-transform);
  --app-data-table-cell-align: left;
  --app-data-table-reset-space: var(--spacing-0);

  width: 100%;
}

.app-data-table__header {
  display: flex;
  flex-direction: column;
  gap: var(--app-data-table-header-gap);
  margin-bottom: var(--app-data-table-header-margin-bottom);
}

.app-data-table__title {
  margin: var(--app-data-table-reset-space);
  color: var(--app-data-table-title-color);
  font-family: var(--app-data-table-title-font-family);
  font-size: var(--app-data-table-title-font-size);
  line-height: var(--app-data-table-title-line-height);
  font-weight: var(--app-data-table-title-font-weight);
  text-transform: var(--app-data-table-title-text-transform);
}

.app-data-table__description {
  margin: var(--app-data-table-reset-space);
  color: var(--app-data-table-description-color);
  font-family: var(--app-data-table-description-font-family);
  font-size: var(--app-data-table-description-font-size);
  line-height: var(--app-data-table-description-line-height);
  font-weight: var(--app-data-table-description-font-weight);
  text-transform: var(--app-data-table-description-text-transform);
}

.app-data-table__container {
  width: 100%;
}

.app-data-table__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-data-table-toolbar-gap);
  margin-bottom: var(--app-data-table-toolbar-margin-bottom);
}

.app-data-table__toolbar-left,
.app-data-table__toolbar-right {
  display: inline-flex;
  align-items: center;
}

.app-data-table__table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.app-data-table__table {
  width: 100%;
  border-collapse: collapse;
}

.app-data-table__header-cell {
  background-color: var(--app-data-table-header-cell-bg);
  color: var(--app-data-table-header-cell-color);
  padding: var(--app-data-table-header-cell-padding-y) var(--app-data-table-header-cell-padding-x);
  text-align: var(--app-data-table-cell-align);
  font-family: var(--app-data-table-header-cell-font-family);
  font-size: var(--app-data-table-header-cell-font-size);
  line-height: var(--app-data-table-header-cell-line-height);
  font-weight: var(--app-data-table-header-cell-font-weight);
  text-transform: var(--app-data-table-header-cell-text-transform);
}

.app-data-table__row {
  background-color: var(--app-data-table-row-bg);
  cursor: var(--app-data-table-row-cursor);
  transition: background-color var(--app-data-table-row-transition-duration)
    var(--app-data-table-row-transition-easing);
}

.app-data-table__row--selectable {
  --app-data-table-row-cursor: pointer;
}

.app-data-table__row--selectable:hover {
  --app-data-table-row-bg: var(--app-data-table-row-bg-hover);
}

.app-data-table__row--selected,
.app-data-table__row--selected.app-data-table__row--selectable:hover {
  --app-data-table-row-bg: var(--app-data-table-row-bg-selected);
}

.app-data-table__row--selectable:focus-visible {
  outline: none;
  box-shadow: var(--app-data-table-row-focus-shadow);
}

.app-data-table__cell {
  padding: var(--app-data-table-cell-padding);
  border-bottom: var(--app-data-table-cell-border-width) solid
    var(--app-data-table-cell-border-color);
  color: var(--app-data-table-cell-color);
  text-align: var(--app-data-table-cell-align);
  font-family: var(--app-data-table-cell-font-family);
  font-size: var(--app-data-table-cell-font-size);
  line-height: var(--app-data-table-cell-line-height);
  font-weight: var(--app-data-table-cell-font-weight);
  text-transform: var(--app-data-table-cell-text-transform);
}

.app-data-table__header-cell--align-left,
.app-data-table__cell--align-left {
  --app-data-table-cell-align: left;
}

.app-data-table__header-cell--align-center,
.app-data-table__cell--align-center {
  --app-data-table-cell-align: center;
}

.app-data-table__header-cell--align-right,
.app-data-table__cell--align-right {
  --app-data-table-cell-align: right;
}
</style>
