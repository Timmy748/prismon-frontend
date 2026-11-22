<script setup lang="ts">
interface Props {
  filename: string
  fileSize: string
  thumbnailUrl?: string
}

defineProps<Props>()
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
  --file-attachment-card-thumb-size: var(--size-attachment-thumb);
  --file-attachment-card-thumb-bg: var(--surface-media-placeholder);
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
  min-width: 0;
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
</style>
