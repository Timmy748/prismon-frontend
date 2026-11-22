<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconButton } from '../buttons'
import { Icon } from '../icons'

interface Props {
  name: string
  description: string
  version?: string
  imageUrl: string
  selected?: boolean
  openDescriptionLabel?: string
  closeDescriptionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  openDescriptionLabel: 'Ver descrição',
  closeDescriptionLabel: 'Fechar descrição',
})

const emit = defineEmits<{
  select: []
}>()

const cardRef = ref<HTMLElement | null>(null)
const triggerWrapRef = ref<HTMLElement | null>(null)
const isDescriptionOpen = ref(false)
const revealOriginX = ref('calc(100% - var(--spacing-5))')
const revealOriginY = ref('calc(100% - var(--spacing-5))')

const cardClasses = computed(() => [
  'workflow-slide-card',
  props.selected ? 'workflow-slide-card--selected' : undefined,
  isDescriptionOpen.value ? 'workflow-slide-card--description-open' : undefined,
])

const sheetStyle = computed(() => ({
  '--workflow-slide-card-reveal-x': revealOriginX.value,
  '--workflow-slide-card-reveal-y': revealOriginY.value,
}))

function updateRevealOrigin() {
  const cardEl = cardRef.value
  const triggerEl = triggerWrapRef.value
  if (!cardEl || !triggerEl) {
    return
  }

  const cardRect = cardEl.getBoundingClientRect()
  const triggerRect = triggerEl.getBoundingClientRect()
  if (cardRect.width <= 0 || cardRect.height <= 0 || triggerRect.width <= 0) {
    return
  }

  // Offset relative to the 4px-inset white layer so the clip-path expands right out of the button center.
  const insetPx = 4
  const centerX = triggerRect.left - cardRect.left + triggerRect.width / 2 - insetPx
  const centerY = triggerRect.top - cardRect.top + triggerRect.height / 2 - insetPx
  revealOriginX.value = `${Math.round(centerX)}px`
  revealOriginY.value = `${Math.round(centerY)}px`
}

function handleCardClick() {
  emit('select')
}

function openDescription() {
  updateRevealOrigin()
  isDescriptionOpen.value = true
}

function closeDescription() {
  updateRevealOrigin()
  isDescriptionOpen.value = false
}
</script>

<template>
  <article
    ref="cardRef"
    :class="cardClasses"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    :aria-label="name"
    @click="handleCardClick"
    @keydown.enter.self.prevent="handleCardClick"
    @keydown.space.self.prevent="handleCardClick"
  >
    <div class="workflow-slide-card__media" aria-hidden="true">
      <img :src="imageUrl" :alt="name" class="workflow-slide-card__image" />
      <div class="workflow-slide-card__scrim" />
    </div>

    <div class="workflow-slide-card__front">
      <header class="workflow-slide-card__header">
        <div class="workflow-slide-card__identity">
          <span class="workflow-slide-card__robot" aria-hidden="true">
            <Icon name="robot" size="sm" />
          </span>
          <span class="workflow-slide-card__name workflow-slide-card__name--inverse">
            {{ name }}
          </span>
        </div>
        <span
          v-if="version"
          class="workflow-slide-card__version workflow-slide-card__version--inverse"
        >
          {{ version }}
        </span>
      </header>

      <footer class="workflow-slide-card__footer">
        <div class="workflow-slide-card__badge">
          <slot name="badge" />
        </div>
        <div ref="triggerWrapRef" class="workflow-slide-card__trigger">
          <IconButton
            variant="tertiary"
            size="sm"
            icon="text"
            :ariaLabel="openDescriptionLabel"
            :aria-expanded="isDescriptionOpen"
            @click.stop="openDescription"
            @keydown.stop
          />
        </div>
      </footer>
    </div>

    <div
      class="workflow-slide-card__sheet"
      :style="sheetStyle"
      :aria-hidden="!isDescriptionOpen"
      @click.stop
    >
      <div class="workflow-slide-card__sheet-body">
        <header class="workflow-slide-card__header">
          <div class="workflow-slide-card__identity">
            <span
              class="workflow-slide-card__robot workflow-slide-card__robot--dark"
              aria-hidden="true"
            >
              <Icon name="robot" size="sm" />
            </span>
            <span class="workflow-slide-card__name">{{ name }}</span>
          </div>
          <span v-if="version" class="workflow-slide-card__version">{{ version }}</span>
        </header>

        <div v-if="$slots.badge" class="workflow-slide-card__badge">
          <slot name="badge" />
        </div>

        <p class="workflow-slide-card__description">{{ description }}</p>
      </div>

      <footer class="workflow-slide-card__sheet-footer">
        <IconButton
          variant="tertiary"
          size="sm"
          icon="close"
          :ariaLabel="closeDescriptionLabel"
          :tabindex="isDescriptionOpen ? 0 : -1"
          @click.stop="closeDescription"
          @keydown.stop
        />
      </footer>
    </div>
  </article>
</template>

<style scoped>
.workflow-slide-card {
  --workflow-slide-card-bg: var(--surface-inverse);
  --workflow-slide-card-sheet-bg: var(--surface-elevated);
  --workflow-slide-card-radius: var(--radius-none);
  --workflow-slide-card-inset: var(--spacing-5);
  --workflow-slide-card-layer-inset: var(--spacing-2);
  --workflow-slide-card-layer-padding: var(--spacing-4);
  --workflow-slide-card-gap: var(--spacing-4);
  --workflow-slide-card-header-gap: var(--spacing-3);
  --workflow-slide-card-identity-gap: var(--spacing-2);
  --workflow-slide-card-scrim-top: var(--surface-backdrop);
  --workflow-slide-card-scrim-bottom: var(--surface-transparent);
  --workflow-slide-card-robot-bg: var(--surface-elevated);
  --workflow-slide-card-robot-color: var(--icon-primary);
  --workflow-slide-card-robot-dark-bg: var(--surface-brand-subtle);
  --workflow-slide-card-robot-dark-color: var(--icon-brand);
  --workflow-slide-card-name-color: var(--text-primary);
  --workflow-slide-card-name-inverse-color: var(--text-inverse);
  --workflow-slide-card-version-color: var(--text-tertiary);
  --workflow-slide-card-version-inverse-color: var(--text-inverse);
  --workflow-slide-card-description-color: var(--text-secondary);
  --workflow-slide-card-shadow-focus: var(--shadow-focus-ring);
  --workflow-slide-card-transition-duration: var(--duration-drawer);
  --workflow-slide-card-transition-easing: var(--easing-out);
  --workflow-slide-card-press-scale: var(--scale-press-subtle);

  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background-color: var(--workflow-slide-card-bg);
  border: var(--border-width-none);
  border-radius: var(--workflow-slide-card-radius);
  cursor: pointer;
  user-select: none;
  transition: transform var(--duration-fast) var(--workflow-slide-card-transition-easing);
}

.workflow-slide-card:focus-visible {
  outline: none;
  box-shadow: var(--workflow-slide-card-shadow-focus);
}

.workflow-slide-card__media {
  position: absolute;
  inset: var(--spacing-0);
  pointer-events: none;
}

.workflow-slide-card__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workflow-slide-card__scrim {
  position: absolute;
  inset: var(--spacing-0);
  background: linear-gradient(
    to bottom,
    var(--workflow-slide-card-scrim-top) 0%,
    var(--workflow-slide-card-scrim-bottom) 46%,
    var(--workflow-slide-card-scrim-top) 100%
  );
}

.workflow-slide-card__front {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: var(--workflow-slide-card-inset);
  box-sizing: border-box;
}

.workflow-slide-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--workflow-slide-card-header-gap);
  min-width: var(--spacing-0);
}

.workflow-slide-card__identity {
  display: inline-flex;
  align-items: center;
  gap: var(--workflow-slide-card-identity-gap);
  min-width: var(--spacing-0);
}

.workflow-slide-card__robot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background-color: var(--workflow-slide-card-robot-bg);
  color: var(--workflow-slide-card-robot-color);
}

.workflow-slide-card__robot--dark {
  background-color: var(--workflow-slide-card-robot-dark-bg);
  color: var(--workflow-slide-card-robot-dark-color);
}

.workflow-slide-card__name {
  color: var(--workflow-slide-card-name-color);
  font-family: var(--type-heading-02-font-family);
  font-size: var(--type-heading-02-font-size);
  line-height: var(--type-heading-02-line-height);
  font-weight: var(--type-heading-02-font-weight);
  text-transform: var(--type-heading-02-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-slide-card__name--inverse {
  color: var(--workflow-slide-card-name-inverse-color);
}

.workflow-slide-card__version {
  flex-shrink: 0;
  color: var(--workflow-slide-card-version-color);
  font-family: var(--type-body-compact-01-font-family);
  font-size: var(--type-body-compact-01-font-size);
  line-height: var(--type-body-compact-01-line-height);
  font-weight: var(--type-body-compact-01-font-weight);
}

.workflow-slide-card__version--inverse {
  color: var(--workflow-slide-card-version-inverse-color);
}

.workflow-slide-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--workflow-slide-card-header-gap);
}

.workflow-slide-card__badge {
  display: inline-flex;
  align-items: center;
  min-width: var(--spacing-0);
}

.workflow-slide-card__trigger {
  display: inline-flex;
  flex-shrink: 0;
}

.workflow-slide-card__sheet {
  --workflow-slide-card-reveal-x: calc(100% - var(--spacing-5));
  --workflow-slide-card-reveal-y: calc(100% - var(--spacing-5));

  position: absolute;
  inset: var(--workflow-slide-card-layer-inset);
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--workflow-slide-card-gap);
  padding: var(--workflow-slide-card-layer-padding);
  box-sizing: border-box;
  background-color: var(--workflow-slide-card-sheet-bg);
  border: var(--border-width-none);
  clip-path: circle(0px at var(--workflow-slide-card-reveal-x) var(--workflow-slide-card-reveal-y));
  pointer-events: none;
  cursor: default;
  transition: clip-path var(--workflow-slide-card-transition-duration)
    var(--workflow-slide-card-transition-easing);
}

.workflow-slide-card--description-open .workflow-slide-card__sheet {
  clip-path: circle(
    150% at var(--workflow-slide-card-reveal-x) var(--workflow-slide-card-reveal-y)
  );
  pointer-events: auto;
}

.workflow-slide-card__sheet-body {
  display: flex;
  flex-direction: column;
  gap: var(--workflow-slide-card-gap);
  min-height: var(--spacing-0);
  overflow-y: auto;
}

.workflow-slide-card__description {
  margin: var(--spacing-0);
  color: var(--workflow-slide-card-description-color);
  font-family: var(--type-body-01-font-family);
  font-size: var(--type-body-01-font-size);
  line-height: var(--type-body-01-line-height);
  font-weight: var(--type-body-01-font-weight);
}

.workflow-slide-card__sheet-footer {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

@media (prefers-reduced-motion: reduce) {
  .workflow-slide-card__sheet {
    clip-path: none;
    opacity: var(--opacity-hidden);
    transition: opacity var(--duration-normal) var(--easing-out);
  }

  .workflow-slide-card--description-open .workflow-slide-card__sheet {
    clip-path: none;
    opacity: var(--opacity-visible);
  }
}
</style>
