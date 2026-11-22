<script setup lang="ts">
import { Icon } from '../icons'

interface Props {
  filename: string
  fileSize: string
  thumbnailUrl?: string
  removable?: boolean
  removeLabel?: string
}

withDefaults(defineProps<Props>(), {
  removable: false,
  removeLabel: 'Remover anexo',
})

const emit = defineEmits<{
  remove: []
}>()
</script>

<template>
  <div class="file-attachment-card">
    <div class="file-attachment-card__thumbnail">
      <slot name="thumbnail">
        <img
          v-if="thumbnailUrl"
          class="file-attachment-card__image"
          :src="thumbnailUrl"
          :alt="filename"
        />
      </slot>
    </div>
    <div class="file-attachment-card__meta">
      <span class="file-attachment-card__filename">{{ filename }}</span>
      <span class="file-attachment-card__size">{{ fileSize }}</span>
    </div>
    <button
      v-if="removable"
      type="button"
      class="file-attachment-card__remove"
      :aria-label="removeLabel"
      @click.stop="emit('remove')"
    >
      <Icon name="close" size="sm" />
    </button>
  </div>
</template>

<style scoped>
.file-attachment-card {
  --file-attachment-card-padding: var(--spacing-3);
  --file-attachment-card-gap: var(--spacing-3);
  --file-attachment-card-meta-gap: var(--spacing-2);
  --file-attachment-card-bg: var(--surface-elevated);
  --file-attachment-card-border-color: var(--border-subtle-1);
  --file-attachment-card-border-width: var(--border-width-thin);
  --file-attachment-card-radius: var(--radius-none);
  --file-attachment-card-thumb-size: 48px;
  --file-attachment-card-thumb-bg: var(--surface-media-placeholder);
  --file-attachment-card-remove-size: 20px;
  --file-attachment-card-remove-offset: var(--spacing-1);
  --file-attachment-card-remove-bg: var(--surface-elevated);
  --file-attachment-card-remove-bg-hover: var(--surface-subtle-hover);
  --file-attachment-card-remove-border-color: var(--border-subtle-1);
  --file-attachment-card-remove-color: var(--icon-primary);
  --file-attachment-card-remove-shadow-focus: var(--shadow-focus-ring);
  --file-attachment-card-transition-duration: var(--duration-fast);
  --file-attachment-card-transition-easing: var(--easing-standard);
  --file-attachment-card-filename-color: var(--text-primary);
  --file-attachment-card-filename-font-family: var(--type-body-compact-02-font-family);
  --file-attachment-card-filename-font-size: var(--type-body-compact-02-font-size);
  --file-attachment-card-filename-line-height: var(--type-body-compact-02-line-height);
  --file-attachment-card-filename-font-weight: var(--type-body-compact-02-font-weight);
  --file-attachment-card-filename-text-transform: var(--type-body-compact-02-text-transform);
  --file-attachment-card-size-color: var(--text-tertiary);
  --file-attachment-card-size-font-family: var(--type-body-compact-01-font-family);
  --file-attachment-card-size-font-size: var(--type-body-compact-01-font-size);
  --file-attachment-card-size-line-height: var(--type-body-compact-01-line-height);
  --file-attachment-card-size-font-weight: var(--type-body-compact-01-font-weight);
  --file-attachment-card-size-text-transform: var(--type-body-compact-01-text-transform);

  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: var(--file-attachment-card-padding);
  gap: var(--file-attachment-card-gap);
  background-color: var(--file-attachment-card-bg);
  border: var(--file-attachment-card-border-width) solid var(--file-attachment-card-border-color);
  border-radius: var(--file-attachment-card-radius);
}

.file-attachment-card__thumbnail {
  width: var(--file-attachment-card-thumb-size);
  height: var(--file-attachment-card-thumb-size);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--file-attachment-card-thumb-bg);
}

.file-attachment-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.file-attachment-card__meta {
  min-width: var(--spacing-0);
  display: flex;
  flex-direction: column;
  gap: var(--file-attachment-card-meta-gap);
}

.file-attachment-card__filename {
  color: var(--file-attachment-card-filename-color);
  font-family: var(--file-attachment-card-filename-font-family);
  font-size: var(--file-attachment-card-filename-font-size);
  line-height: var(--file-attachment-card-filename-line-height);
  font-weight: var(--file-attachment-card-filename-font-weight);
  text-transform: var(--file-attachment-card-filename-text-transform);
  overflow-wrap: break-word;
}

.file-attachment-card__size {
  color: var(--file-attachment-card-size-color);
  font-family: var(--file-attachment-card-size-font-family);
  font-size: var(--file-attachment-card-size-font-size);
  line-height: var(--file-attachment-card-size-line-height);
  font-weight: var(--file-attachment-card-size-font-weight);
  text-transform: var(--file-attachment-card-size-text-transform);
}

.file-attachment-card__remove {
  position: absolute;
  top: var(--file-attachment-card-remove-offset);
  right: var(--file-attachment-card-remove-offset);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--file-attachment-card-remove-size);
  height: var(--file-attachment-card-remove-size);
  padding: var(--spacing-0);
  background-color: var(--file-attachment-card-remove-bg);
  color: var(--file-attachment-card-remove-color);
  border: var(--file-attachment-card-border-width) solid
    var(--file-attachment-card-remove-border-color);
  border-radius: var(--file-attachment-card-radius);
  cursor: pointer;
  opacity: var(--opacity-hidden);
  pointer-events: none;
  transition:
    opacity var(--file-attachment-card-transition-duration)
      var(--file-attachment-card-transition-easing),
    background-color var(--file-attachment-card-transition-duration)
      var(--file-attachment-card-transition-easing);
}

.file-attachment-card:hover .file-attachment-card__remove,
.file-attachment-card:focus-within .file-attachment-card__remove {
  opacity: var(--opacity-visible);
  pointer-events: auto;
}

.file-attachment-card__remove:hover {
  background-color: var(--file-attachment-card-remove-bg-hover);
}

.file-attachment-card__remove:focus-visible {
  outline: none;
  box-shadow: var(--file-attachment-card-remove-shadow-focus);
}
</style>
