<script setup lang="ts">
import { Icon } from '../icons'
import { IconButton } from '../buttons'
import { Badge, Tag } from '../badges'
import { ScrollContainer } from '../layout'
import ModificationEvent from './ModificationEvent.vue'

export interface RepertoryItemTag {
  id: string
  label: string
  color?: string
}

export interface RepertoryItemHistoryEntry {
  id: string
  title: string
  summary: string
  author: string
  date: string
}

export type RepertoryPreviewType = 'none' | 'image' | 'document'

/** Compatibilidade legada com o nome anterior DocumentTagItem. */
export type DocumentTagItem = RepertoryItemTag
/** Compatibilidade legada com o nome anterior DocumentHistoryEntry. */
export type DocumentHistoryEntry = RepertoryItemHistoryEntry

interface Props {
  title: string
  description?: string
  tags?: RepertoryItemTag[]
  history?: RepertoryItemHistoryEntry[]
  historyTitle?: string
  editableTags?: boolean
  showAddTag?: boolean
  addTagLabel?: string
  previewType?: RepertoryPreviewType
  previewUrl?: string
  previewMeta?: string
  previewExcerpt?: string
  previewLabel?: string
}

withDefaults(defineProps<Props>(), {
  tags: () => [],
  history: () => [],
  historyTitle: 'Histórico de modificações',
  editableTags: false,
  showAddTag: true,
  addTagLabel: 'Adicionar tag',
  previewType: 'none',
})

const emit = defineEmits<{
  'add-tag': []
  'remove-tag': [tagId: string]
}>()
</script>

<template>
  <section class="repertory-item-details">
    <div
      v-if="
        $slots.preview ||
        previewType === 'image' ||
        previewType === 'document' ||
        Boolean(previewUrl) ||
        Boolean(previewExcerpt)
      "
      class="repertory-item-details__preview"
    >
      <slot name="preview">
        <div
          v-if="previewType === 'image' || (previewType === 'none' && previewUrl)"
          class="repertory-item-details__preview-image-frame"
        >
          <img
            v-if="previewUrl"
            :src="previewUrl"
            :alt="`Pré-visualização de ${title}`"
            class="repertory-item-details__preview-image"
          />
          <div v-else class="repertory-item-details__preview-fallback">
            <Icon name="attachment" size="xl" color="helper" />
          </div>
          <div v-if="previewLabel || previewMeta" class="repertory-item-details__preview-caption">
            <Badge v-if="previewLabel" :label="previewLabel" />
            <span v-if="previewMeta" class="repertory-item-details__preview-meta">
              {{ previewMeta }}
            </span>
          </div>
        </div>

        <div v-else class="repertory-item-details__preview-doc">
          <div class="repertory-item-details__preview-doc-bar">
            <div class="repertory-item-details__preview-doc-id">
              <Icon name="documents" size="md" color="helper" />
              <span v-if="previewMeta" class="repertory-item-details__preview-meta">
                {{ previewMeta }}
              </span>
            </div>
            <Badge v-if="previewLabel" :label="previewLabel" />
          </div>
          <p v-if="previewExcerpt" class="repertory-item-details__preview-excerpt">
            {{ previewExcerpt }}
          </p>
        </div>
      </slot>
    </div>

    <div class="repertory-item-details__section">
      <div class="repertory-item-details__header-group">
        <header class="repertory-item-details__header">
          <h2 class="repertory-item-details__title">{{ title }}</h2>
          <div v-if="$slots['header-actions']" class="repertory-item-details__header-actions">
            <slot name="header-actions" />
          </div>
        </header>
        <p v-if="description" class="repertory-item-details__description">
          {{ description }}
        </p>
      </div>

      <div v-if="tags.length > 0 || showAddTag" class="repertory-item-details__tags-row">
        <ScrollContainer
          class="repertory-item-details__tags-scroll"
          direction="horizontal"
          gap="md"
          ariaLabel="Tags"
        >
          <Tag
            v-for="tag in tags"
            :key="tag.id"
            :label="tag.label"
            :color="tag.color"
            :dismissible="editableTags"
            @dismiss="emit('remove-tag', tag.id)"
          />
        </ScrollContainer>
        <IconButton
          v-if="showAddTag"
          variant="ghost"
          icon="tag"
          :ariaLabel="addTagLabel"
          class="repertory-item-details__add-tag"
          @click="emit('add-tag')"
        />
      </div>
    </div>

    <div class="repertory-item-details__history">
      <h3 class="repertory-item-details__history-title">{{ historyTitle }}</h3>
      <ul v-if="history.length > 0" class="repertory-item-details__history-list">
        <li v-for="entry in history" :key="entry.id" class="repertory-item-details__history-item">
          <ModificationEvent
            :title="entry.title"
            :summary="entry.summary"
            :author="entry.author"
            :date="entry.date"
          />
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.repertory-item-details {
  --repertory-item-details-gap: var(--spacing-6);
  --repertory-item-details-section-gap: var(--spacing-5);
  --repertory-item-details-header-group-gap: var(--spacing-4);
  --repertory-item-details-header-gap: var(--spacing-6);
  --repertory-item-details-header-actions-gap: var(--spacing-3);
  --repertory-item-details-tags-row-gap: var(--spacing-6);
  --repertory-item-details-history-list-gap: var(--spacing-6);
  --repertory-item-details-reset-spacing: var(--spacing-0);

  --repertory-item-details-preview-bg: var(--surface-subtle);
  --repertory-item-details-preview-placeholder-bg: var(--surface-placeholder);
  --repertory-item-details-preview-border-color: var(--border-subtle-1);
  --repertory-item-details-preview-border-width: var(--border-width-thin);
  --repertory-item-details-preview-padding: var(--spacing-4);
  --repertory-item-details-preview-gap: var(--spacing-3);
  --repertory-item-details-preview-height: 192px;

  --repertory-item-details-meta-color: var(--text-helper);
  --repertory-item-details-meta-font-family: var(--type-label-01-font-family);
  --repertory-item-details-meta-font-size: var(--type-label-01-font-size);
  --repertory-item-details-meta-line-height: var(--type-label-01-line-height);
  --repertory-item-details-meta-font-weight: var(--type-label-01-font-weight);

  --repertory-item-details-excerpt-color: var(--text-secondary);
  --repertory-item-details-excerpt-font-family: var(--type-body-compact-01-font-family);
  --repertory-item-details-excerpt-font-size: var(--type-body-compact-01-font-size);
  --repertory-item-details-excerpt-line-height: var(--type-body-compact-01-line-height);
  --repertory-item-details-excerpt-font-weight: var(--type-body-compact-01-font-weight);

  --repertory-item-details-title-color: var(--text-primary);
  --repertory-item-details-title-font-family: var(--type-heading-03-font-family);
  --repertory-item-details-title-font-size: var(--type-heading-03-font-size);
  --repertory-item-details-title-line-height: var(--type-heading-03-line-height);
  --repertory-item-details-title-font-weight: var(--type-heading-03-font-weight);
  --repertory-item-details-title-text-transform: var(--type-heading-03-text-transform);

  --repertory-item-details-description-color: var(--text-helper);
  --repertory-item-details-description-font-family: var(--type-body-01-font-family);
  --repertory-item-details-description-font-size: var(--type-body-01-font-size);
  --repertory-item-details-description-line-height: var(--type-body-01-line-height);
  --repertory-item-details-description-font-weight: var(--type-body-01-font-weight);
  --repertory-item-details-description-text-transform: var(--type-body-01-text-transform);

  display: flex;
  flex-direction: column;
  gap: var(--repertory-item-details-gap);
  width: 100%;
  min-width: var(--repertory-item-details-reset-spacing);
  box-sizing: border-box;
}

.repertory-item-details__preview {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: var(--repertory-item-details-preview-border-width) solid
    var(--repertory-item-details-preview-border-color);
  background-color: var(--repertory-item-details-preview-bg);
  box-sizing: border-box;
}

.repertory-item-details__preview-image-frame {
  display: flex;
  flex-direction: column;
}

.repertory-item-details__preview-image {
  display: block;
  width: 100%;
  height: var(--repertory-item-details-preview-height);
  object-fit: cover;
  background-color: var(--repertory-item-details-preview-placeholder-bg);
}

.repertory-item-details__preview-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--repertory-item-details-preview-height);
  background-color: var(--repertory-item-details-preview-placeholder-bg);
}

.repertory-item-details__preview-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--repertory-item-details-preview-gap);
  padding: var(--spacing-3) var(--repertory-item-details-preview-padding);
  border-top: var(--repertory-item-details-preview-border-width) solid
    var(--repertory-item-details-preview-border-color);
  background-color: var(--surface-elevated);
}

.repertory-item-details__preview-doc {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-item-details-preview-gap);
  padding: var(--repertory-item-details-preview-padding);
}

.repertory-item-details__preview-doc-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  padding-bottom: var(--spacing-3);
  border-bottom: var(--repertory-item-details-preview-border-width) solid
    var(--repertory-item-details-preview-border-color);
}

.repertory-item-details__preview-doc-id {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.repertory-item-details__preview-meta {
  color: var(--repertory-item-details-meta-color);
  font-family: var(--repertory-item-details-meta-font-family);
  font-size: var(--repertory-item-details-meta-font-size);
  line-height: var(--repertory-item-details-meta-line-height);
  font-weight: var(--repertory-item-details-meta-font-weight);
}

.repertory-item-details__preview-excerpt {
  margin: var(--repertory-item-details-reset-spacing);
  color: var(--repertory-item-details-excerpt-color);
  font-family: var(--repertory-item-details-excerpt-font-family);
  font-size: var(--repertory-item-details-excerpt-font-size);
  line-height: var(--repertory-item-details-excerpt-line-height);
  font-weight: var(--repertory-item-details-excerpt-font-weight);
  white-space: pre-line;
  max-height: 132px;
  overflow-y: auto;
}

.repertory-item-details__section {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-item-details-section-gap);
  min-width: var(--repertory-item-details-reset-spacing);
}

.repertory-item-details__header-group {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-item-details-header-group-gap);
}

.repertory-item-details__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--repertory-item-details-header-gap);
}

.repertory-item-details__title {
  margin: var(--repertory-item-details-reset-spacing);
  color: var(--repertory-item-details-title-color);
  font-family: var(--repertory-item-details-title-font-family);
  font-size: var(--repertory-item-details-title-font-size);
  line-height: var(--repertory-item-details-title-line-height);
  font-weight: var(--repertory-item-details-title-font-weight);
  text-transform: var(--repertory-item-details-title-text-transform);
}

.repertory-item-details__header-actions {
  display: inline-flex;
  align-items: center;
  gap: var(--repertory-item-details-header-actions-gap);
  flex-shrink: 0;
}

.repertory-item-details__description {
  margin: var(--repertory-item-details-reset-spacing);
  color: var(--repertory-item-details-description-color);
  font-family: var(--repertory-item-details-description-font-family);
  font-size: var(--repertory-item-details-description-font-size);
  line-height: var(--repertory-item-details-description-line-height);
  font-weight: var(--repertory-item-details-description-font-weight);
  text-transform: var(--repertory-item-details-description-text-transform);
}

.repertory-item-details__tags-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--repertory-item-details-tags-row-gap);
  width: 100%;
  min-width: var(--repertory-item-details-reset-spacing);
}

.repertory-item-details__tags-scroll {
  flex: 1;
  min-width: var(--repertory-item-details-reset-spacing);
}

.repertory-item-details__add-tag {
  flex-shrink: 0;
}

.repertory-item-details__history {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-item-details-section-gap);
}

.repertory-item-details__history-title {
  margin: var(--repertory-item-details-reset-spacing);
  color: var(--repertory-item-details-title-color);
  font-family: var(--repertory-item-details-title-font-family);
  font-size: var(--repertory-item-details-title-font-size);
  line-height: var(--repertory-item-details-title-line-height);
  font-weight: var(--repertory-item-details-title-font-weight);
  text-transform: var(--repertory-item-details-title-text-transform);
}

.repertory-item-details__history-list {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-item-details-history-list-gap);
  margin: var(--repertory-item-details-reset-spacing);
  padding: var(--repertory-item-details-reset-spacing);
  list-style: none;
}
</style>
