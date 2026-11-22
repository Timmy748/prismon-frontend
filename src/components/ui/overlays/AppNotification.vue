<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, type IconName } from '../icons'

export type NotificationVariant = 'default' | 'danger'

interface Props {
  title: string
  message?: string
  variant?: NotificationVariant
  icon?: IconName
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const notificationClasses = computed(() => [
  'app-notification',
  `app-notification--${props.variant}`,
])

const role = computed(() => (props.variant === 'danger' ? 'alert' : 'status'))
</script>

<template>
  <div :class="notificationClasses" :role="role">
    <div class="app-notification__icon" aria-hidden="true">
      <slot name="icon">
        <AppIcon v-if="icon" :name="icon" size="sm" />
      </slot>
    </div>

    <div class="app-notification__content">
      <p class="app-notification__title">{{ title }}</p>
      <p v-if="message || $slots.default" class="app-notification__message">
        <slot>{{ message }}</slot>
      </p>
    </div>
  </div>
</template>

<style scoped>
.app-notification {
  --app-notification-max-width: var(--size-notification-width);
  --app-notification-padding: var(--spacing-5);
  --app-notification-gap: var(--spacing-4);
  --app-notification-content-gap: var(--spacing-4);
  --app-notification-bg: var(--surface-elevated);
  --app-notification-border-color: var(--border-subtle-1);
  --app-notification-border-width: var(--border-width-thin);
  --app-notification-radius: var(--radius-none);
  --app-notification-icon-size: var(--size-notification-icon);
  --app-notification-icon-bg: var(--surface-placeholder);
  --app-notification-icon-color: var(--icon-primary);
  --app-notification-title-color: var(--text-primary);
  --app-notification-title-font-family: var(--type-heading-03-font-family);
  --app-notification-title-font-size: var(--type-heading-03-font-size);
  --app-notification-title-line-height: var(--type-heading-03-line-height);
  --app-notification-title-font-weight: var(--type-heading-03-font-weight);
  --app-notification-title-text-transform: var(--type-heading-03-text-transform);
  --app-notification-message-color: var(--text-primary);
  --app-notification-message-font-family: var(--type-body-compact-02-font-family);
  --app-notification-message-font-size: var(--type-body-compact-02-font-size);
  --app-notification-message-line-height: var(--type-body-compact-02-line-height);
  --app-notification-message-font-weight: var(--type-body-compact-02-font-weight);
  --app-notification-message-text-transform: var(--type-body-compact-02-text-transform);

  display: flex;
  align-items: flex-start;
  gap: var(--app-notification-gap);
  width: 100%;
  max-width: var(--app-notification-max-width);
  padding: var(--app-notification-padding);
  box-sizing: border-box;
  background-color: var(--app-notification-bg);
  border: var(--app-notification-border-width) solid var(--app-notification-border-color);
  border-radius: var(--app-notification-radius);
}

.app-notification--default {
  --app-notification-bg: var(--surface-elevated);
  --app-notification-border-color: var(--border-subtle-1);
  --app-notification-icon-bg: var(--surface-placeholder);
  --app-notification-icon-color: var(--icon-primary);
}

.app-notification--danger {
  --app-notification-bg: var(--surface-danger-subtle);
  --app-notification-border-color: var(--border-danger-subtle);
  --app-notification-icon-bg: var(--border-danger-subtle);
  --app-notification-icon-color: var(--icon-danger);
}

.app-notification__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--app-notification-icon-size);
  height: var(--app-notification-icon-size);
  background-color: var(--app-notification-icon-bg);
  color: var(--app-notification-icon-color);
}

.app-notification__content {
  display: flex;
  flex-direction: column;
  gap: var(--app-notification-content-gap);
  min-width: var(--spacing-0);
}

.app-notification__title {
  margin: var(--spacing-0);
  color: var(--app-notification-title-color);
  font-family: var(--app-notification-title-font-family);
  font-size: var(--app-notification-title-font-size);
  line-height: var(--app-notification-title-line-height);
  font-weight: var(--app-notification-title-font-weight);
  text-transform: var(--app-notification-title-text-transform);
}

.app-notification__message {
  margin: var(--spacing-0);
  color: var(--app-notification-message-color);
  font-family: var(--app-notification-message-font-family);
  font-size: var(--app-notification-message-font-size);
  line-height: var(--app-notification-message-line-height);
  font-weight: var(--app-notification-message-font-weight);
  text-transform: var(--app-notification-message-text-transform);
}
</style>
