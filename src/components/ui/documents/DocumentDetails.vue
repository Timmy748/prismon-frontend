<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Icon } from '../icons'
import { IconButton } from '../buttons'
import { Tag } from '../badges'

export interface DocumentTagItem {
  id: string
  label: string
}

export interface DocumentHistoryEntry {
  id: string
  summary: string
  author: string
  date: string
}

interface Props {
  title: string
  description?: string
  tags?: DocumentTagItem[]
  history?: DocumentHistoryEntry[]
  historyTitle?: string
  editableTags?: boolean
  showAddTag?: boolean
  addTagLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
  history: () => [],
  historyTitle: 'Histórico de modificações',
  editableTags: false,
  showAddTag: true,
  addTagLabel: 'Adicionar tag',
})

const emit = defineEmits<{
  'add-tag': []
  'remove-tag': [tagId: string]
}>()

const tagsScrollRef = ref<HTMLDivElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
let resizeObserver: ResizeObserver | null = null

const tagsScrollClasses = computed(() => {
  const classes = ['document-details__tags']
  if (canScrollLeft.value && canScrollRight.value) {
    classes.push('document-details__tags--mask-both')
  } else if (canScrollLeft.value) {
    classes.push('document-details__tags--mask-left')
  } else if (canScrollRight.value) {
    classes.push('document-details__tags--mask-right')
  }
  return classes
})

function updateTagScrollState() {
  const el = tagsScrollRef.value
  if (!el) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  const { scrollLeft, scrollWidth, clientWidth } = el
  canScrollLeft.value = scrollLeft > 1
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 1
}

onMounted(() => {
  updateTagScrollState()
  if (typeof ResizeObserver !== 'undefined' && tagsScrollRef.value) {
    resizeObserver = new ResizeObserver(updateTagScrollState)
    resizeObserver.observe(tagsScrollRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})

watch(
  () => props.tags,
  () => {
    void nextTick(updateTagScrollState)
  },
  { deep: true },
)
</script>

<template>
  <section class="document-details">
    <div class="document-details__section">
      <div class="document-details__header-group">
        <header class="document-details__header">
          <h2 class="document-details__title">{{ title }}</h2>
          <div v-if="$slots['header-actions']" class="document-details__header-actions">
            <slot name="header-actions" />
          </div>
        </header>
        <p v-if="description" class="document-details__description">
          {{ description }}
        </p>
      </div>

      <div v-if="tags.length > 0 || showAddTag" class="document-details__tags-row">
        <div class="document-details__tags-viewport">
          <div ref="tagsScrollRef" :class="tagsScrollClasses" @scroll="updateTagScrollState">
            <Tag
              v-for="tag in tags"
              :key="tag.id"
              :label="tag.label"
              :dismissible="editableTags"
              @dismiss="emit('remove-tag', tag.id)"
            />
          </div>
        </div>
        <IconButton
          v-if="showAddTag"
          variant="ghost"
          icon="tag"
          :ariaLabel="addTagLabel"
          class="document-details__add-tag"
          @click="emit('add-tag')"
        />
      </div>
    </div>

    <div class="document-details__history">
      <h3 class="document-details__history-title">{{ historyTitle }}</h3>
      <ul v-if="history.length > 0" class="document-details__history-list">
        <li v-for="entry in history" :key="entry.id" class="document-details__history-item">
          <p class="document-details__history-summary">{{ entry.summary }}</p>
          <div class="document-details__history-meta">
            <span class="document-details__history-meta-item">
              <Icon name="people" size="sm" color="helper" />
              <span>{{ entry.author }}</span>
            </span>
            <span class="document-details__history-meta-item">
              <Icon name="calendar" size="sm" color="helper" />
              <span>{{ entry.date }}</span>
            </span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.document-details {
  --document-details-gap: var(--spacing-6);
  --document-details-section-gap: var(--spacing-5);
  --document-details-header-group-gap: var(--spacing-4);
  --document-details-header-gap: var(--spacing-6);
  --document-details-header-actions-gap: var(--spacing-3);
  --document-details-tags-row-gap: var(--spacing-6);
  --document-details-tags-gap: var(--spacing-4);
  --document-details-tags-mask-size: var(--spacing-6);
  --document-details-tags-mask-opaque: var(--text-primary);
  --document-details-tags-mask-transparent: var(--surface-transparent);
  --document-details-tags-mask: none;
  --document-details-history-list-gap: var(--spacing-6);
  --document-details-history-item-gap: var(--spacing-4);
  --document-details-history-meta-gap: var(--spacing-5);
  --document-details-history-meta-item-gap: var(--spacing-2);
  --document-details-reset-spacing: var(--spacing-0);

  --document-details-title-color: var(--text-primary);
  --document-details-title-font-family: var(--type-heading-03-font-family);
  --document-details-title-font-size: var(--type-heading-03-font-size);
  --document-details-title-line-height: var(--type-heading-03-line-height);
  --document-details-title-font-weight: var(--type-heading-03-font-weight);
  --document-details-title-text-transform: var(--type-heading-03-text-transform);

  --document-details-description-color: var(--text-helper);
  --document-details-description-font-family: var(--type-body-01-font-family);
  --document-details-description-font-size: var(--type-body-01-font-size);
  --document-details-description-line-height: var(--type-body-01-line-height);
  --document-details-description-font-weight: var(--type-body-01-font-weight);
  --document-details-description-text-transform: var(--type-body-01-text-transform);

  --document-details-history-text-color: var(--text-helper);
  --document-details-history-font-family: var(--type-body-compact-01-font-family);
  --document-details-history-font-size: var(--type-body-compact-01-font-size);
  --document-details-history-line-height: var(--type-body-compact-01-line-height);
  --document-details-history-font-weight: var(--type-body-compact-01-font-weight);
  --document-details-history-text-transform: var(--type-body-compact-01-text-transform);

  display: flex;
  flex-direction: column;
  gap: var(--document-details-gap);
  width: 100%;
  box-sizing: border-box;
}

.document-details__section {
  display: flex;
  flex-direction: column;
  gap: var(--document-details-section-gap);
}

.document-details__header-group {
  display: flex;
  flex-direction: column;
  gap: var(--document-details-header-group-gap);
}

.document-details__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--document-details-header-gap);
}

.document-details__title {
  margin: var(--document-details-reset-spacing);
  color: var(--document-details-title-color);
  font-family: var(--document-details-title-font-family);
  font-size: var(--document-details-title-font-size);
  line-height: var(--document-details-title-line-height);
  font-weight: var(--document-details-title-font-weight);
  text-transform: var(--document-details-title-text-transform);
}

.document-details__header-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--document-details-header-actions-gap);
  flex-shrink: 0;
}

.document-details__description {
  margin: var(--document-details-reset-spacing);
  color: var(--document-details-description-color);
  font-family: var(--document-details-description-font-family);
  font-size: var(--document-details-description-font-size);
  line-height: var(--document-details-description-line-height);
  font-weight: var(--document-details-description-font-weight);
  text-transform: var(--document-details-description-text-transform);
}

.document-details__tags-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--document-details-tags-row-gap);
  min-width: var(--document-details-reset-spacing);
}

.document-details__tags-viewport {
  flex: 1;
  min-width: var(--document-details-reset-spacing);
  overflow: hidden;
}

.document-details__tags {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--document-details-tags-gap);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-mask-image: var(--document-details-tags-mask);
  mask-image: var(--document-details-tags-mask);
}

.document-details__tags::-webkit-scrollbar {
  display: none;
}

.document-details__tags > * {
  flex-shrink: 0;
}

.document-details__tags--mask-left {
  --document-details-tags-mask: linear-gradient(
    to right,
    var(--document-details-tags-mask-transparent) 0,
    var(--document-details-tags-mask-opaque) var(--document-details-tags-mask-size),
    var(--document-details-tags-mask-opaque) 100%
  );
}

.document-details__tags--mask-right {
  --document-details-tags-mask: linear-gradient(
    to right,
    var(--document-details-tags-mask-opaque) 0,
    var(--document-details-tags-mask-opaque) calc(100% - var(--document-details-tags-mask-size)),
    var(--document-details-tags-mask-transparent) 100%
  );
}

.document-details__tags--mask-both {
  --document-details-tags-mask: linear-gradient(
    to right,
    var(--document-details-tags-mask-transparent) 0,
    var(--document-details-tags-mask-opaque) var(--document-details-tags-mask-size),
    var(--document-details-tags-mask-opaque) calc(100% - var(--document-details-tags-mask-size)),
    var(--document-details-tags-mask-transparent) 100%
  );
}

.document-details__add-tag {
  flex-shrink: 0;
}

.document-details__history {
  display: flex;
  flex-direction: column;
  gap: var(--document-details-section-gap);
}

.document-details__history-title {
  margin: var(--document-details-reset-spacing);
  color: var(--document-details-title-color);
  font-family: var(--document-details-title-font-family);
  font-size: var(--document-details-title-font-size);
  line-height: var(--document-details-title-line-height);
  font-weight: var(--document-details-title-font-weight);
  text-transform: var(--document-details-title-text-transform);
}

.document-details__history-list {
  display: flex;
  flex-direction: column;
  gap: var(--document-details-history-list-gap);
  margin: var(--document-details-reset-spacing);
  padding: var(--document-details-reset-spacing);
  list-style: none;
}

.document-details__history-item {
  display: flex;
  flex-direction: column;
  gap: var(--document-details-history-item-gap);
}

.document-details__history-summary {
  margin: var(--document-details-reset-spacing);
  color: var(--document-details-history-text-color);
  font-family: var(--document-details-history-font-family);
  font-size: var(--document-details-history-font-size);
  line-height: var(--document-details-history-line-height);
  font-weight: var(--document-details-history-font-weight);
  text-transform: var(--document-details-history-text-transform);
}

.document-details__history-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--document-details-history-meta-gap);
  color: var(--document-details-history-text-color);
  font-family: var(--document-details-history-font-family);
  font-size: var(--document-details-history-font-size);
  line-height: var(--document-details-history-line-height);
  font-weight: var(--document-details-history-font-weight);
  text-transform: var(--document-details-history-text-transform);
}

.document-details__history-meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--document-details-history-meta-item-gap);
}
</style>
