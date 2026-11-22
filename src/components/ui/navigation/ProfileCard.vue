<script setup lang="ts">
import { computed } from 'vue'
import { IconButton } from '../buttons'

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
  <div class="profile-card">
    <div class="profile-card__identity">
      <div class="profile-card__avatar">
        <img
          v-if="avatarSrc"
          :src="avatarSrc"
          :alt="avatarAlt ?? username"
          class="profile-card__avatar-image"
        />
        <span v-else class="profile-card__avatar-initials" aria-hidden="true">
          {{ initials }}
        </span>
      </div>
      <div class="profile-card__info">
        <span class="profile-card__username">{{ username }}</span>
        <span v-if="role" class="profile-card__role">{{ role }}</span>
      </div>
    </div>
    <IconButton
      v-if="showSettings"
      variant="ghost"
      size="lg"
      icon="setting"
      :ariaLabel="settingsLabel"
      @click="emit('settings-click')"
    />
  </div>
</template>

<style scoped>
.profile-card {
  --profile-card-bg: var(--surface-elevated);
  --profile-card-padding: var(--spacing-3);
  --profile-card-gap: var(--spacing-3);
  --profile-card-info-gap: var(--spacing-2);
  --profile-card-avatar-size: 44px;
  --profile-card-avatar-radius: var(--radius-full);
  --profile-card-avatar-bg: var(--surface-placeholder);
  --profile-card-avatar-color: var(--text-primary);
  --profile-card-initials-font-family: var(--type-heading-01-font-family);
  --profile-card-initials-font-size: var(--type-heading-01-font-size);
  --profile-card-initials-line-height: var(--type-heading-01-line-height);
  --profile-card-initials-font-weight: var(--type-heading-01-font-weight);
  --profile-card-username-color: var(--text-primary);
  --profile-card-username-font-family: var(--type-heading-02-font-family);
  --profile-card-username-font-size: var(--type-heading-02-font-size);
  --profile-card-username-line-height: var(--type-heading-02-line-height);
  --profile-card-username-font-weight: var(--type-heading-02-font-weight);
  --profile-card-username-text-transform: var(--type-heading-02-text-transform);
  --profile-card-role-color: var(--text-secondary);
  --profile-card-role-font-family: var(--type-body-compact-01-font-family);
  --profile-card-role-font-size: var(--type-body-compact-01-font-size);
  --profile-card-role-line-height: var(--type-body-compact-01-line-height);
  --profile-card-role-font-weight: var(--type-body-compact-01-font-weight);
  --profile-card-role-text-transform: var(--type-body-compact-01-text-transform);

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--profile-card-padding);
  gap: var(--profile-card-gap);
  box-sizing: border-box;
  background-color: var(--profile-card-bg);
}

.profile-card__identity {
  display: flex;
  align-items: center;
  gap: var(--profile-card-gap);
  min-width: var(--spacing-0);
}

.profile-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--profile-card-avatar-size);
  height: var(--profile-card-avatar-size);
  border-radius: var(--profile-card-avatar-radius);
  background-color: var(--profile-card-avatar-bg);
  color: var(--profile-card-avatar-color);
  overflow: hidden;
  flex-shrink: 0;
}

.profile-card__avatar-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-card__avatar-initials {
  font-family: var(--profile-card-initials-font-family);
  font-size: var(--profile-card-initials-font-size);
  line-height: var(--profile-card-initials-line-height);
  font-weight: var(--profile-card-initials-font-weight);
}

.profile-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--profile-card-info-gap);
  min-width: var(--spacing-0);
}

.profile-card__username {
  color: var(--profile-card-username-color);
  font-family: var(--profile-card-username-font-family);
  font-size: var(--profile-card-username-font-size);
  line-height: var(--profile-card-username-line-height);
  font-weight: var(--profile-card-username-font-weight);
  text-transform: var(--profile-card-username-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-card__role {
  color: var(--profile-card-role-color);
  font-family: var(--profile-card-role-font-family);
  font-size: var(--profile-card-role-font-size);
  line-height: var(--profile-card-role-line-height);
  font-weight: var(--profile-card-role-font-weight);
  text-transform: var(--profile-card-role-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
