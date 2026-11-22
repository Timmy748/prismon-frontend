<script setup lang="ts">
import { computed } from 'vue'
import { Icon, type IconName } from '../icons'

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

const notificationClasses = computed(() => ['notification', `notification--${props.variant}`])

const role = computed(() => (props.variant === 'danger' ? 'alert' : 'status'))
</script>

<template>
  <div :class="notificationClasses" :role="role">
    <div class="notification__icon" aria-hidden="true">
      <slot name="icon">
        <Icon v-if="icon" :name="icon" size="sm" />
      </slot>
    </div>

    <div class="notification__content">
      <p class="notification__title">{{ title }}</p>
      <p v-if="message || $slots.default" class="notification__message">
        <slot>{{ message }}</slot>
      </p>
    </div>
  </div>
</template>

<style scoped>
.notification {
  --notification-max-width: var(--size-notification-width);
  --notification-padding: var(--spacing-5);
  --notification-gap: var(--spacing-4);
  --notification-content-gap: var(--spacing-4);
  --notification-bg: var(--surface-elevated);
  --notification-border-color: var(--border-subtle-1);
  --notification-border-width: var(--border-width-thin);
  --notification-radius: var(--radius-none);
  --notification-icon-size: var(--size-notification-icon);
  --notification-icon-bg: var(--surface-placeholder);
  --notification-icon-color: var(--icon-primary);
  --notification-title-color: var(--text-primary);
  --notification-title-font-family: var(--type-heading-03-font-family);
  --notification-title-font-size: var(--type-heading-03-font-size);
  --notification-title-line-height: var(--type-heading-03-line-height);
  --notification-title-font-weight: var(--type-heading-03-font-weight);
  --notification-title-text-transform: var(--type-heading-03-text-transform);
  --notification-message-color: var(--text-primary);
  --notification-message-font-family: var(--type-body-compact-02-font-family);
  --notification-message-font-size: var(--type-body-compact-02-font-size);
  --notification-message-line-height: var(--type-body-compact-02-line-height);
  --notification-message-font-weight: var(--type-body-compact-02-font-weight);
  --notification-message-text-transform: var(--type-body-compact-02-text-transform);

  display: flex;
  align-items: flex-start;
  gap: var(--notification-gap);
  width: 100%;
  max-width: var(--notification-max-width);
  padding: var(--notification-padding);
  box-sizing: border-box;
  background-color: var(--notification-bg);
  border: var(--notification-border-width) solid var(--notification-border-color);
  border-radius: var(--notification-radius);
}

.notification--default {
  --notification-bg: var(--surface-elevated);
  --notification-border-color: var(--border-subtle-1);
  --notification-icon-bg: var(--surface-placeholder);
  --notification-icon-color: var(--icon-primary);
}

.notification--danger {
  --notification-bg: var(--surface-danger-subtle);
  --notification-border-color: var(--border-danger-subtle);
  --notification-icon-bg: var(--border-danger-subtle);
  --notification-icon-color: var(--icon-danger);
}

.notification__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--notification-icon-size);
  height: var(--notification-icon-size);
  background-color: var(--notification-icon-bg);
  color: var(--notification-icon-color);
}

.notification__content {
  display: flex;
  flex-direction: column;
  gap: var(--notification-content-gap);
  min-width: var(--spacing-0);
}

.notification__title {
  margin: var(--spacing-0);
  color: var(--notification-title-color);
  font-family: var(--notification-title-font-family);
  font-size: var(--notification-title-font-size);
  line-height: var(--notification-title-line-height);
  font-weight: var(--notification-title-font-weight);
  text-transform: var(--notification-title-text-transform);
}

.notification__message {
  margin: var(--spacing-0);
  color: var(--notification-message-color);
  font-family: var(--notification-message-font-family);
  font-size: var(--notification-message-font-size);
  line-height: var(--notification-message-line-height);
  font-weight: var(--notification-message-font-weight);
  text-transform: var(--notification-message-text-transform);
}
</style>
