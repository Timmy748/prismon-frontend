<script setup lang="ts">
import { Badge, Icon, IconButton, ScrollContainer, Tag, type IconName } from '@/components/ui'

export interface DocumentCardTag {
  id: string
  label: string
  color?: string
}

interface Props {
  id: string
  title: string
  description: string
  tags?: DocumentCardTag[]
  thumbnailUrl?: string
  status?: string
  format?: string
  icon?: IconName
  tagsAriaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
  icon: 'documents',
  tagsAriaLabel: 'Tags do item',
})

const emit = defineEmits<{
  select: [id: string]
  download: [id: string]
  'remove-tag': [docId: string, tagId: string]
}>()

function handleSelect() {
  emit('select', props.id)
}

function handleDownload() {
  emit('download', props.id)
}
</script>

<template>
  <article
    class="document-card"
    role="button"
    tabindex="0"
    :aria-label="title"
    @click="handleSelect"
    @keydown.enter.self.prevent="handleSelect"
    @keydown.space.self.prevent="handleSelect"
  >
    <div class="document-card__media">
      <img
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        :alt="title"
        class="document-card__image"
        loading="lazy"
      />
      <Icon v-else :name="icon" size="xl" color="helper" class="document-card__placeholder-icon" />
      <div v-if="format || status" class="document-card__badges">
        <Badge v-if="format" :label="format" class="document-card__format" />
        <Badge v-if="status" :label="status" class="document-card__status" />
      </div>
    </div>

    <div class="document-card__body">
      <header class="document-card__header">
        <h3 class="document-card__title">{{ title }}</h3>
        <IconButton
          variant="ghost"
          size="sm"
          icon="download"
          :ariaLabel="`Baixar ${title}`"
          class="document-card__download"
          @click.stop="handleDownload"
          @keydown.stop
        />
      </header>

      <p class="document-card__description">{{ description }}</p>

      <div v-if="tags.length > 0" class="document-card__tags">
        <ScrollContainer direction="horizontal" gap="sm" :aria-label="tagsAriaLabel">
          <Tag
            v-for="tag in tags"
            :key="tag.id"
            :label="tag.label"
            :color="tag.color"
            :dismissible="false"
            @dismiss="emit('remove-tag', id, tag.id)"
          />
        </ScrollContainer>
      </div>
    </div>
  </article>
</template>

<style scoped>
.document-card {
  --document-card-bg: var(--surface-elevated);
  --document-card-bg-hover: var(--surface-subtle);
  --document-card-border-color: var(--border-subtle-1);
  --document-card-border-color-hover: var(--border-subtle-hover);
  --document-card-border-width: var(--border-width-thin);
  --document-card-radius: var(--radius-none);
  --document-card-media-height: var(--spacing-13);
  --document-card-media-bg: var(--surface-placeholder);
  --document-card-status-offset: var(--spacing-3);
  --document-card-badges-gap: var(--spacing-2);
  --document-card-body-padding: var(--spacing-4);
  --document-card-body-gap: var(--spacing-3);
  --document-card-header-gap: var(--spacing-3);
  --document-card-title-color: var(--text-primary);
  --document-card-title-font-family: var(--type-heading-02-font-family);
  --document-card-title-font-size: var(--type-heading-02-font-size);
  --document-card-title-line-height: var(--type-heading-02-line-height);
  --document-card-title-font-weight: var(--type-heading-02-font-weight);
  --document-card-title-text-transform: var(--type-heading-02-text-transform);
  --document-card-description-color: var(--text-secondary);
  --document-card-description-font-family: var(--type-body-compact-02-font-family);
  --document-card-description-font-size: var(--type-body-compact-02-font-size);
  --document-card-description-line-height: var(--type-body-compact-02-line-height);
  --document-card-description-font-weight: var(--type-body-compact-02-font-weight);
  --document-card-description-text-transform: var(--type-body-compact-02-text-transform);
  --document-card-focus-ring: var(--shadow-focus-ring);
  --document-card-press-scale: var(--scale-press-subtle);
  --document-card-transition-duration: var(--duration-fast);
  --document-card-transition-easing: var(--easing-out);
  --document-card-reset-spacing: var(--spacing-0);

  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: var(--document-card-reset-spacing);
  background-color: var(--document-card-bg);
  border: var(--document-card-border-width) solid var(--document-card-border-color);
  border-radius: var(--document-card-radius);
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;
  transition: transform var(--document-card-transition-duration)
    var(--document-card-transition-easing);
}

@media (hover: hover) and (pointer: fine) {
  .document-card:hover {
    background-color: var(--document-card-bg-hover);
    border-color: var(--document-card-border-color-hover);
    transform: translateY(-2px);
  }
}

.document-card:active {
  transform: scale(var(--document-card-press-scale));
}

.document-card:focus-visible {
  outline: none;
  box-shadow: var(--document-card-focus-ring);
}

.document-card__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--document-card-media-height);
  background-color: var(--document-card-media-bg);
  border-bottom: var(--document-card-border-width) solid var(--document-card-border-color);
  overflow: hidden;
  flex-shrink: 0;
}

.document-card__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.document-card__placeholder-icon {
  pointer-events: none;
}

.document-card__badges {
  position: absolute;
  top: var(--document-card-status-offset);
  right: var(--document-card-status-offset);
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--document-card-badges-gap);
  max-width: calc(100% - var(--document-card-status-offset) * 2);
}

.document-card__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--document-card-body-gap);
  padding: var(--document-card-body-padding);
  min-width: var(--document-card-reset-spacing);
}

.document-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--document-card-header-gap);
  min-width: var(--document-card-reset-spacing);
}

.document-card__title {
  margin: var(--document-card-reset-spacing);
  color: var(--document-card-title-color);
  font-family: var(--document-card-title-font-family);
  font-size: var(--document-card-title-font-size);
  line-height: var(--document-card-title-line-height);
  font-weight: var(--document-card-title-font-weight);
  text-transform: var(--document-card-title-text-transform);
  min-width: var(--document-card-reset-spacing);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-card__download {
  flex-shrink: 0;
}

.document-card__description {
  margin: var(--document-card-reset-spacing);
  color: var(--document-card-description-color);
  font-family: var(--document-card-description-font-family);
  font-size: var(--document-card-description-font-size);
  line-height: var(--document-card-description-line-height);
  font-weight: var(--document-card-description-font-weight);
  text-transform: var(--document-card-description-text-transform);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.document-card__tags {
  margin-top: auto;
  width: 100%;
  min-width: var(--document-card-reset-spacing);
}

@media (prefers-reduced-motion: reduce) {
  .document-card {
    transition: none;
  }

  .document-card:hover,
  .document-card:active {
    transform: none;
  }
}
</style>
