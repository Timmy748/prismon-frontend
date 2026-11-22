<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Drawer, IconButton, ListItem, NavList, ProfileCard, Sidebar, toast } from '@/components/ui'
import ProfileSettingsDrawer from './ProfileSettingsDrawer.vue'
import {
  DEFAULT_USER_PROFILE,
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  type AppNavItem,
  type UserProfile,
} from './navigationConfig'

interface Props {
  title?: string
  showTopbar?: boolean
  activeNav?: string
  defaultCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTopbar: undefined,
  defaultCollapsed: undefined,
})

const emit = defineEmits<{
  logout: []
}>()

const slots = useSlots()
const route = useRoute()
const router = useRouter()

const hasSecondarySidebar = computed(() => Boolean(slots['secondary-sidebar']))
const isNavCollapsed = ref(props.defaultCollapsed ?? hasSecondarySidebar.value)
const isMobileNavOpen = ref(false)
const isMobileSecondaryOpen = ref(false)
const isSettingsOpen = ref(false)

const profile = ref<UserProfile>({ ...DEFAULT_USER_PROFILE })

const shouldShowTopbar = computed(() => {
  if (props.showTopbar === false) {
    return false
  }
  return props.showTopbar ?? Boolean(props.title || slots['topbar-right'])
})

const sidebarWrapperClasses = computed(() => [
  'app-shell__sidebar',
  isNavCollapsed.value ? 'app-shell__sidebar--collapsed' : undefined,
])

function isItemActive(item: AppNavItem): boolean {
  if (props.activeNav) {
    return props.activeNav === item.id || props.activeNav === item.to
  }
  const currentPath = route?.path ?? ''
  if (!currentPath) {
    return false
  }
  return currentPath === item.to || currentPath.startsWith(`${item.to}/`)
}

async function navigateTo(to: string) {
  isMobileNavOpen.value = false
  if (route?.path !== to) {
    await router.push(to)
  }
}

function openSettings() {
  isMobileNavOpen.value = false
  isSettingsOpen.value = true
}

function openMobileSecondary() {
  isMobileSecondaryOpen.value = true
}

function closeMobileSecondary() {
  isMobileSecondaryOpen.value = false
}

function toggleMobileSecondary() {
  isMobileSecondaryOpen.value = !isMobileSecondaryOpen.value
}

function handleSaveProfile(payload: { username: string; email: string; workspace: string }) {
  profile.value = {
    ...profile.value,
    username: payload.username,
    email: payload.email,
    workspace: payload.workspace,
  }
}

function handleLogout() {
  isMobileNavOpen.value = false
  isMobileSecondaryOpen.value = false
  isSettingsOpen.value = false
  emit('logout')
  toast.info('Sessão encerrada localmente (modo demonstração).')
  if (route?.path !== '/login' && router.hasRoute('login')) {
    void router.push('/login')
  }
}
</script>

<template>
  <div class="app-shell">
    <div :class="sidebarWrapperClasses">
      <Sidebar v-model:collapsed="isNavCollapsed" title="prismon">
        <div class="app-shell__nav-groups">
          <NavList :title="isNavCollapsed ? undefined : 'navegação'">
            <ListItem
              v-for="item in PRIMARY_NAV_ITEMS"
              :key="item.id"
              :label="item.label"
              :icon="item.icon"
              :collapsed="isNavCollapsed"
              :active="isItemActive(item)"
              @click="navigateTo(item.to)"
            />
          </NavList>

          <NavList :title="isNavCollapsed ? undefined : 'sistema'">
            <ListItem
              v-for="item in SECONDARY_NAV_ITEMS"
              :key="item.id"
              :label="item.label"
              :icon="item.icon"
              :collapsed="isNavCollapsed"
              :active="isItemActive(item)"
              @click="navigateTo(item.to)"
            />
            <ListItem label="sair" icon="leave" :collapsed="isNavCollapsed" @click="handleLogout" />
          </NavList>
        </div>

        <template #footer>
          <ProfileCard
            v-if="!isNavCollapsed"
            :username="profile.username"
            :role="profile.role"
            @settings-click="openSettings"
          />
          <div v-else class="app-shell__collapsed-footer">
            <IconButton
              variant="ghost"
              size="md"
              icon="setting"
              ariaLabel="Configurações do perfil"
              @click="openSettings"
            />
          </div>
        </template>
      </Sidebar>
    </div>

    <aside
      v-if="hasSecondarySidebar"
      class="app-shell__secondary-sidebar"
      aria-label="Painel secundário"
    >
      <slot name="secondary-sidebar" />
    </aside>

    <div class="app-shell__workspace">
      <header class="app-shell__mobile-bar">
        <IconButton
          variant="ghost"
          size="md"
          icon="arrow-right"
          ariaLabel="Abrir navegação"
          @click="isMobileNavOpen = true"
        />
        <span class="app-shell__mobile-title">{{ title || 'prismon' }}</span>
        <div class="app-shell__mobile-actions">
          <slot
            name="mobile-secondary-action"
            :is-secondary-open="isMobileSecondaryOpen"
            :open-secondary="openMobileSecondary"
            :close-secondary="closeMobileSecondary"
            :toggle-secondary="toggleMobileSecondary"
          >
            <IconButton
              v-if="hasSecondarySidebar"
              variant="ghost"
              size="md"
              icon="chat"
              ariaLabel="Abrir painel lateral"
              @click="openMobileSecondary"
            />
          </slot>
        </div>
      </header>

      <header v-if="shouldShowTopbar" class="app-shell__topbar">
        <div class="app-shell__topbar-spacer" aria-hidden="true" />
        <h1 v-if="title" class="app-shell__title">{{ title }}</h1>
        <div class="app-shell__topbar-right">
          <slot name="topbar-right" />
        </div>
      </header>

      <div v-if="$slots.subheader" class="app-shell__subheader">
        <slot name="subheader" />
      </div>

      <main class="app-shell__main app-shell__content">
        <slot />
      </main>
    </div>

    <Drawer v-model:open="isMobileNavOpen" direction="left" ariaLabel="Menu de navegação">
      <template #header>
        <div class="app-shell__mobile-drawer-header">
          <span class="app-shell__brand">prismon</span>
          <IconButton
            variant="ghost"
            size="md"
            icon="close"
            ariaLabel="Fechar navegação"
            @click="isMobileNavOpen = false"
          />
        </div>
      </template>

      <div class="app-shell__nav-groups">
        <NavList title="navegação">
          <ListItem
            v-for="item in PRIMARY_NAV_ITEMS"
            :key="item.id"
            :label="item.label"
            :icon="item.icon"
            :active="isItemActive(item)"
            @click="navigateTo(item.to)"
          />
        </NavList>

        <NavList title="sistema">
          <ListItem
            v-for="item in SECONDARY_NAV_ITEMS"
            :key="item.id"
            :label="item.label"
            :icon="item.icon"
            :active="isItemActive(item)"
            @click="navigateTo(item.to)"
          />
          <ListItem label="sair" icon="leave" @click="handleLogout" />
        </NavList>
      </div>

      <template #footer>
        <ProfileCard
          :username="profile.username"
          :role="profile.role"
          @settings-click="openSettings"
        />
      </template>
    </Drawer>

    <Drawer
      v-if="hasSecondarySidebar"
      v-model:open="isMobileSecondaryOpen"
      direction="left"
      ariaLabel="Painel secundário"
    >
      <template #header>
        <div class="app-shell__mobile-drawer-header">
          <span class="app-shell__secondary-drawer-title">painel</span>
          <IconButton
            variant="ghost"
            size="md"
            icon="close"
            ariaLabel="Fechar painel lateral"
            @click="closeMobileSecondary"
          />
        </div>
      </template>

      <div class="app-shell__secondary-drawer-body">
        <slot name="secondary-sidebar" />
      </div>
    </Drawer>

    <ProfileSettingsDrawer
      v-model:open="isSettingsOpen"
      :username="profile.username"
      :email="profile.email"
      :role="profile.role"
      :workspace="profile.workspace"
      @save="handleSaveProfile"
      @logout="handleLogout"
    />
  </div>
</template>

<style scoped>
.app-shell {
  --app-shell-bg: var(--surface-base);
  --app-shell-topbar-bg: var(--surface-elevated);
  --app-shell-subheader-bg: var(--surface-elevated);
  --app-shell-secondary-bg: var(--surface-elevated);
  --app-shell-mobile-bar-bg: var(--surface-elevated);
  --app-shell-border-color: var(--border-subtle-1);
  --app-shell-border-width: var(--border-width-thin);
  --app-shell-nav-gap: var(--spacing-4);
  --app-shell-topbar-min-height: 56px;
  --app-shell-topbar-padding-y: var(--spacing-3);
  --app-shell-topbar-padding-x: var(--spacing-6);
  --app-shell-topbar-gap: var(--spacing-4);
  --app-shell-subheader-padding-x: var(--spacing-6);
  --app-shell-mobile-bar-height: 56px;
  --app-shell-mobile-bar-padding-x: var(--spacing-4);
  --app-shell-mobile-bar-gap: var(--spacing-3);
  --app-shell-mobile-action-slot-width: 36px;
  --app-shell-title-color: var(--text-primary);
  --app-shell-title-font-family: var(--type-heading-03-font-family);
  --app-shell-title-font-size: var(--type-heading-03-font-size);
  --app-shell-title-line-height: var(--type-heading-03-line-height);
  --app-shell-title-font-weight: var(--type-heading-03-font-weight);
  --app-shell-title-text-transform: var(--type-heading-03-text-transform);
  --app-shell-brand-color: var(--text-primary);
  --app-shell-brand-font-family: var(--type-heading-04-font-family);
  --app-shell-brand-font-size: var(--type-heading-04-font-size);
  --app-shell-brand-line-height: var(--type-heading-04-line-height);
  --app-shell-brand-font-weight: var(--type-heading-04-font-weight);
  --app-shell-brand-text-transform: var(--type-heading-04-text-transform);

  display: flex;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--app-shell-bg);
}

.app-shell__sidebar {
  flex-shrink: 0;
  height: 100%;
}

.app-shell__sidebar--collapsed :deep(.nav-list) {
  --nav-list-padding: var(--spacing-2) var(--spacing-0);
}

.app-shell__nav-groups {
  display: flex;
  flex-direction: column;
  gap: var(--app-shell-nav-gap);
}

.app-shell__collapsed-footer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-shell__secondary-sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  background-color: var(--app-shell-secondary-bg);
  border-right: var(--app-shell-border-width) solid var(--app-shell-border-color);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.app-shell__workspace {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: var(--spacing-0);
  height: 100%;
  overflow: hidden;
}

.app-shell__mobile-bar {
  display: none;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: var(--app-shell-mobile-bar-height);
  padding: var(--spacing-0) var(--app-shell-mobile-bar-padding-x);
  gap: var(--app-shell-mobile-bar-gap);
  box-sizing: border-box;
  background-color: var(--app-shell-mobile-bar-bg);
  border-bottom: var(--app-shell-border-width) solid var(--app-shell-border-color);
}

.app-shell__mobile-title {
  color: var(--app-shell-title-color);
  font-family: var(--app-shell-title-font-family);
  font-size: var(--app-shell-title-font-size);
  line-height: var(--app-shell-title-line-height);
  font-weight: var(--app-shell-title-font-weight);
  text-transform: var(--app-shell-title-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-shell__mobile-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: var(--app-shell-mobile-action-slot-width);
  flex-shrink: 0;
}

.app-shell__topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  flex-shrink: 0;
  min-height: var(--app-shell-topbar-min-height);
  padding: var(--app-shell-topbar-padding-y) var(--app-shell-topbar-padding-x);
  gap: var(--app-shell-topbar-gap);
  box-sizing: border-box;
  background-color: var(--app-shell-topbar-bg);
  border-bottom: var(--app-shell-border-width) solid var(--app-shell-border-color);
}

.app-shell__topbar-spacer {
  grid-column: 1;
}

.app-shell__title {
  grid-column: 2;
  justify-self: center;
  margin: var(--spacing-0);
  color: var(--app-shell-title-color);
  font-family: var(--app-shell-title-font-family);
  font-size: var(--app-shell-title-font-size);
  line-height: var(--app-shell-title-line-height);
  font-weight: var(--app-shell-title-font-weight);
  text-transform: var(--app-shell-title-text-transform);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-shell__topbar-right {
  grid-column: 3;
  justify-self: end;
  display: inline-flex;
  align-items: center;
  gap: var(--app-shell-topbar-gap);
}

.app-shell__subheader {
  flex-shrink: 0;
  padding: var(--spacing-0) var(--app-shell-subheader-padding-x);
  background-color: var(--app-shell-subheader-bg);
  border-bottom: var(--app-shell-border-width) solid var(--app-shell-border-color);
}

.app-shell__content {
  flex: 1;
  min-height: var(--spacing-0);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.app-shell__mobile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-shell-mobile-bar-gap);
}

.app-shell__brand {
  color: var(--app-shell-brand-color);
  font-family: var(--app-shell-brand-font-family);
  font-size: var(--app-shell-brand-font-size);
  line-height: var(--app-shell-brand-line-height);
  font-weight: var(--app-shell-brand-font-weight);
  text-transform: var(--app-shell-brand-text-transform);
}

.app-shell__secondary-drawer-title {
  color: var(--app-shell-title-color);
  font-family: var(--app-shell-title-font-family);
  font-size: var(--app-shell-title-font-size);
  line-height: var(--app-shell-title-line-height);
  font-weight: var(--app-shell-title-font-weight);
  text-transform: var(--app-shell-title-text-transform);
}

.app-shell__secondary-drawer-body {
  display: flex;
  flex-direction: column;
  height: 100%;
}

@media (max-width: 767px) {
  .app-shell__sidebar,
  .app-shell__secondary-sidebar,
  .app-shell__topbar {
    display: none;
  }

  .app-shell__mobile-bar {
    display: flex;
  }

  .app-shell__subheader {
    padding: var(--spacing-0) var(--app-shell-mobile-bar-padding-x);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-shell {
    scroll-behavior: auto;
  }
}
</style>
