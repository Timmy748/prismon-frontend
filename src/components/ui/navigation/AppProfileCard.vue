<script setup lang="ts">
import { computed } from 'vue'
import { AppIconButton } from '../buttons'

interface Props {
  username: string
  role?: string
  avatarSrc?: string
  avatarAlt?: string
  showSettings?: boolean
  settingsLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  showSettings: true,
  settingsLabel: 'Configurações do perfil',
})

const emit = defineEmits<{
  'settings-click': []
}>()

const initials = computed(() => {
  const parts = props.username.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]
  if (!first) {
    return ''
  }
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined
  const firstChar = first.charAt(0)
  const lastChar = last ? last.charAt(0) : ''
  return `${firstChar}${lastChar}`.toUpperCase()
})
</script>

<template>
  <div class="app-profile-card">
    <div class="app-profile-card__identity">
      <div class="app-profile-card__avatar">
        <img
          v-if="avatarSrc"
          :src="avatarSrc"
          :alt="avatarAlt ?? username"
          class="app-profile-card__avatar-image"
        />
        <span v-else class="app-profile-card__avatar-initials" aria-hidden="true">
          {{ initials }}
        </span>
      </div>
      <div class="app-profile-card__info">
        <span class="app-profile-card__username">{{ username }}</span>
        <span v-if="role" class="app-profile-card__role">{{ role }}</span>
      </div>
    </div>
    <AppIconButton
      v-if="showSettings"
      variant="ghost"
      icon="setting"
      :ariaLabel="settingsLabel"
      @click="emit('settings-click')"
    />
  </div>
</template>

<style scoped>
.app-profile-card {
  --app-profile-card-bg: var(--surface-elevated);
  --app-profile-card-padding: var(--spacing-3);
  --app-profile-card-gap: var(--spacing-3);
  --app-profile-card-info-gap: var(--spacing-2);
  --app-profile-card-avatar-size: var(--size-avatar-md);
  --app-profile-card-avatar-radius: var(--radius-full);
  --app-profile-card-avatar-bg: var(--surface-placeholder);
  --app-profile-card-avatar-color: var(--text-primary);
  --app-profile-card-initials-font-family: var(--type-heading-01-font-family);
  --app-profile-card-initials-font-size: var(--type-heading-01-font-size);
  --app-profile-card-initials-line-height: var(--type-heading-01-line-height);
  --app-profile-card-initials-font-weight: var(--type-heading-01-font-weight);
  --app-profile-card-username-color: var(--text-primary);
  --app-profile-card-username-font-family: var(--type-heading-02-font-family);
  --app-profile-card-username-font-size: var(--type-heading-02-font-size);
  --app-profile-card-username-line-height: var(--type-heading-02-line-height);
  --app-profile-card-username-font-weight: var(--type-heading-02-font-weight);
  --app-profile-card-username-text-transform: var(--type-heading-02-text-transform);
  --app-profile-card-role-color: var(--text-secondary);
  --app-profile-card-role-font-family: var(--type-body-compact-01-font-family);
  --app-profile-card-role-font-size: var(--type-body-compact-01-font-size);
  --app-profile-card-role-line-height: var(--type-body-compact-01-line-height);
  --app-profile-card-role-font-weight: var(--type-body-compact-01-font-weight);
  --app-profile-card-role-text-transform: var(--type-body-compact-01-text-transform);

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-profile-card-padding);
  gap: var(--app-profile-card-gap);
  box-sizing: border-box;
  background-color: var(--app-profile-card-bg);
}

.app-profile-card__identity {
  display: flex;
  align-items: center;
  gap: var(--app-profile-card-gap);
  min-width: var(--spacing-0);
}

.app-profile-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--app-profile-card-avatar-size);
  height: var(--app-profile-card-avatar-size);
  border-radius: var(--app-profile-card-avatar-radius);
  background-color: var(--app-profile-card-avatar-bg);
  color: var(--app-profile-card-avatar-color);
  overflow: hidden;
  flex-shrink: 0;
}

.app-profile-card__avatar-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-profile-card__avatar-initials {
  font-family: var(--app-profile-card-initials-font-family);
  font-size: var(--app-profile-card-initials-font-size);
  line-height: var(--app-profile-card-initials-line-height);
  font-weight: var(--app-profile-card-initials-font-weight);
}

.app-profile-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--app-profile-card-info-gap);
  min-width: var(--spacing-0);
}

.app-profile-card__username {
  color: var(--app-profile-card-username-color);
  font-family: var(--app-profile-card-username-font-family);
  font-size: var(--app-profile-card-username-font-size);
  line-height: var(--app-profile-card-username-line-height);
  font-weight: var(--app-profile-card-username-font-weight);
  text-transform: var(--app-profile-card-username-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-profile-card__role {
  color: var(--app-profile-card-role-color);
  font-family: var(--app-profile-card-role-font-family);
  font-size: var(--app-profile-card-role-font-size);
  line-height: var(--app-profile-card-role-line-height);
  font-weight: var(--app-profile-card-role-font-weight);
  text-transform: var(--app-profile-card-role-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
