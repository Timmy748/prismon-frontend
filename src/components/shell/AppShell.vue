<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Button,
  Drawer,
  Icon,
  IconButton,
  ListItem,
  NavList,
  ProfileCard,
  Sidebar,
  toast,
} from '@/components/ui'
import { useWorkspaceState, type ProjectDetailsItem } from '@/stores/workspaceState'
import ChatThreadsPanel from './ChatThreadsPanel.vue'
import CreateProjectModal from './CreateProjectModal.vue'
import ProfileSettingsModal from './ProfileSettingsModal.vue'
import ProjectInfoModal from './ProjectInfoModal.vue'
import { PRIMARY_NAV_ITEMS, type AppNavItem, type ProjectItem } from './navigationConfig'

interface Props {
  title?: string
  showTopbar?: boolean
  activeNav?: string
  activeProjectId?: string
  defaultCollapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showTopbar: undefined,
  activeProjectId: undefined,
  defaultCollapsed: undefined,
})

const emit = defineEmits<{
  logout: []
  'project-change': [project: ProjectItem]
}>()

const slots = useSlots()
const route = useRoute()
const router = useRouter()

const {
  projects,
  activeProjectId: storeActiveProjectId,
  activeProject,
  profile,
  selectProject: storeSelectProject,
  createProject: storeCreateProject,
  startNewChat,
  updateProfile,
} = useWorkspaceState()

const isProjectsCollapsed = ref(true)
const isNavCollapsed = ref(props.defaultCollapsed ?? false)
const isMobileNavOpen = ref(false)
const mobileDrawerView = ref<'project' | 'projects'>('project')
const isSettingsOpen = ref(false)
const isCreateProjectOpen = ref(false)
const isProjectInfoOpen = ref(false)
const infoTargetProject = ref<ProjectDetailsItem | null>(null)

watch(
  () => props.activeProjectId,
  (nextId) => {
    if (nextId) {
      storeSelectProject(nextId)
    }
  },
  { immediate: true },
)

watch(isMobileNavOpen, (isOpen) => {
  if (isOpen) {
    mobileDrawerView.value = 'project'
  }
})

const currentActiveProject = computed<ProjectDetailsItem>(() => {
  if (props.activeProjectId) {
    return (
      projects.value.find((project) => project.id === props.activeProjectId) ?? activeProject.value
    )
  }
  return activeProject.value
})

const shouldShowTopbar = computed(() => {
  if (props.showTopbar === false) {
    return false
  }
  return props.showTopbar ?? Boolean(props.title || slots['topbar-right'])
})

const projectsSidebarClasses = computed(() => [
  'app-shell__sidebar',
  'app-shell__projects-sidebar',
  isProjectsCollapsed.value ? 'app-shell__sidebar--collapsed' : undefined,
])

const navSidebarClasses = computed(() => [
  'app-shell__sidebar',
  'app-shell__nav-sidebar',
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

function selectProject(project: ProjectDetailsItem) {
  storeSelectProject(project.id)
  emit('project-change', project)
  if (mobileDrawerView.value === 'projects') {
    mobileDrawerView.value = 'project'
  }
}

async function handleNavClick(item: AppNavItem) {
  isMobileNavOpen.value = false
  if (item.id === 'chat') {
    startNewChat()
  }
  if (route?.path !== item.to) {
    await router.push(item.to)
  }
}

function openSettings() {
  isMobileNavOpen.value = false
  isSettingsOpen.value = true
}

function openCreateProjectModal() {
  isMobileNavOpen.value = false
  isCreateProjectOpen.value = true
}

function openProjectInfo(project: ProjectDetailsItem) {
  infoTargetProject.value = project
  isMobileNavOpen.value = false
  isProjectInfoOpen.value = true
}

function handleCreateProject(payload: { name: string; description: string; role: string }) {
  const created = storeCreateProject(payload)
  emit('project-change', created)
}

function handleSaveProfile(payload: { username: string; email: string; workspace: string }) {
  updateProfile(payload)
}

function handleLogout() {
  isMobileNavOpen.value = false
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
    <div :class="projectsSidebarClasses">
      <Sidebar
        v-model:collapsed="isProjectsCollapsed"
        title="projetos"
        toggle-label="Alternar lista de projetos"
      >
        <NavList :title="isProjectsCollapsed ? undefined : 'seus projetos'">
          <ListItem
            v-for="project in projects"
            :key="project.id"
            :label="project.name"
            :icon="project.icon"
            :collapsed="isProjectsCollapsed"
            :active="project.id === currentActiveProject.id"
            @click="selectProject(project)"
          >
            <template v-if="!isProjectsCollapsed" #trailing>
              <IconButton
                variant="ghost"
                size="sm"
                icon="exclamation"
                :ariaLabel="`Informações do projeto ${project.name}`"
                @click.stop="openProjectInfo(project)"
              />
            </template>
          </ListItem>
        </NavList>

        <template #footer>
          <div v-if="!isProjectsCollapsed" class="app-shell__projects-footer">
            <Button
              variant="tertiary"
              size="sm"
              icon="plus"
              :full-width="true"
              @click="openCreateProjectModal"
            >
              criar projeto
            </Button>
          </div>
          <div v-else class="app-shell__collapsed-actions">
            <IconButton
              variant="ghost"
              size="md"
              icon="exclamation"
              :ariaLabel="`Informações do projeto ${currentActiveProject.name}`"
              @click="openProjectInfo(currentActiveProject)"
            />
            <IconButton
              variant="ghost"
              size="md"
              icon="plus"
              ariaLabel="Criar novo projeto"
              @click="openCreateProjectModal"
            />
          </div>
        </template>
      </Sidebar>
    </div>

    <div :class="navSidebarClasses">
      <Sidebar
        v-model:collapsed="isNavCollapsed"
        :title="currentActiveProject.name"
        toggle-label="Alternar menu do projeto"
      >
        <div class="app-shell__nav-groups">
          <NavList :title="isNavCollapsed ? undefined : 'navegação'" class="app-shell__primary-nav">
            <ListItem
              v-for="item in PRIMARY_NAV_ITEMS"
              :key="item.id"
              :label="item.label"
              :icon="item.icon"
              :collapsed="isNavCollapsed"
              :active="isItemActive(item)"
              @click="handleNavClick(item)"
            />
          </NavList>

          <div class="app-shell__sidebar-extra">
            <slot
              name="sidebar-extra"
              :collapsed="isNavCollapsed"
              :active-project="currentActiveProject"
            >
              <ChatThreadsPanel :collapsed="isNavCollapsed" />
            </slot>
          </div>
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

    <div class="app-shell__workspace">
      <header class="app-shell__mobile-bar">
        <IconButton
          variant="ghost"
          size="md"
          icon="arrow-right"
          ariaLabel="Abrir navegação"
          @click="isMobileNavOpen = true"
        />
        <span class="app-shell__mobile-title">{{ title || currentActiveProject.name }}</span>
        <div class="app-shell__mobile-actions">
          <IconButton
            variant="ghost"
            size="md"
            icon="exclamation"
            :ariaLabel="`Informações do projeto ${currentActiveProject.name}`"
            @click="openProjectInfo(currentActiveProject)"
          />
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
        <slot :active-project="currentActiveProject" />
      </main>
    </div>

    <Drawer v-model:open="isMobileNavOpen" direction="bottom" ariaLabel="Menu de navegação">
      <template #header>
        <div class="app-shell__mobile-drawer-header">
          <div v-if="mobileDrawerView === 'project'" class="app-shell__mobile-drawer-title-group">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Voltar para lista de projetos"
              @click="mobileDrawerView = 'projects'"
            >
              <span class="app-shell__back-btn-content">
                <Icon name="arrow-left" size="sm" />
                <span>Projetos</span>
              </span>
            </Button>
            <span class="app-shell__brand">{{ currentActiveProject.name }}</span>
            <IconButton
              variant="ghost"
              size="sm"
              icon="exclamation"
              :ariaLabel="`Informações do projeto ${currentActiveProject.name}`"
              @click="openProjectInfo(currentActiveProject)"
            />
          </div>

          <div v-else class="app-shell__mobile-drawer-title-group">
            <span class="app-shell__brand">seus projetos</span>
          </div>

          <IconButton
            variant="ghost"
            size="md"
            icon="close"
            ariaLabel="Fechar navegação"
            @click="isMobileNavOpen = false"
          />
        </div>
      </template>

      <div v-if="mobileDrawerView === 'project'" class="app-shell__mobile-project-body">
        <div class="app-shell__mobile-horizontal-nav" data-drawer-no-drag>
          <NavList title="navegação" orientation="horizontal">
            <ListItem
              v-for="item in PRIMARY_NAV_ITEMS"
              :key="item.id"
              :label="item.label"
              :icon="item.icon"
              :active="isItemActive(item)"
              @click="handleNavClick(item)"
            />
          </NavList>
        </div>

        <div class="app-shell__mobile-threads">
          <slot name="sidebar-extra" :collapsed="false" :active-project="currentActiveProject">
            <ChatThreadsPanel :in-drawer="true" @thread-selected="isMobileNavOpen = false" />
          </slot>
        </div>
      </div>

      <div v-else class="app-shell__mobile-projects-body">
        <NavList title="projetos que você participa" orientation="vertical">
          <ListItem
            v-for="project in projects"
            :key="project.id"
            :label="project.name"
            :icon="project.icon"
            :active="project.id === currentActiveProject.id"
            @click="selectProject(project)"
          >
            <template #trailing>
              <IconButton
                variant="ghost"
                size="sm"
                icon="exclamation"
                :ariaLabel="`Informações do projeto ${project.name}`"
                @click.stop="openProjectInfo(project)"
              />
            </template>
          </ListItem>
        </NavList>
      </div>

      <template #footer>
        <ProfileCard
          v-if="mobileDrawerView === 'project'"
          :username="profile.username"
          :role="profile.role"
          @settings-click="openSettings"
        />
        <div v-else class="app-shell__mobile-projects-footer">
          <Button
            variant="primary"
            size="md"
            icon="plus"
            :full-width="true"
            @click="openCreateProjectModal"
          >
            criar projeto
          </Button>
        </div>
      </template>
    </Drawer>

    <ProfileSettingsModal
      v-model:open="isSettingsOpen"
      :username="profile.username"
      :email="profile.email"
      :role="profile.role"
      :workspace="profile.workspace"
      @save="handleSaveProfile"
      @logout="handleLogout"
    />

    <CreateProjectModal v-model:open="isCreateProjectOpen" @create="handleCreateProject" />

    <ProjectInfoModal
      v-model:open="isProjectInfoOpen"
      :project="infoTargetProject"
      :is-active-project="infoTargetProject?.id === storeActiveProjectId"
      @select="selectProject"
    />
  </div>
</template>

<style scoped>
.app-shell {
  --app-shell-bg: var(--surface-base);
  --app-shell-topbar-bg: var(--surface-elevated);
  --app-shell-subheader-bg: var(--surface-elevated);
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

.app-shell__nav-sidebar :deep(.sidebar) {
  --sidebar-title-font-size: var(--type-heading-03-font-size);
  --sidebar-title-line-height: var(--type-heading-03-line-height);
}

.app-shell__nav-sidebar :deep(.sidebar__body) {
  overflow: hidden;
}

.app-shell__sidebar--collapsed :deep(.nav-list) {
  --nav-list-padding: var(--spacing-2) var(--spacing-0);
}

.app-shell__nav-groups {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: var(--spacing-0);
  gap: var(--app-shell-nav-gap);
  overflow: hidden;
}

.app-shell__primary-nav {
  flex-shrink: 0;
}

.app-shell__sidebar-extra {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: var(--spacing-0);
  overflow: hidden;
}

.app-shell__projects-footer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.app-shell__collapsed-actions,
.app-shell__collapsed-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
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
  width: 100%;
}

.app-shell__mobile-drawer-title-group {
  display: flex;
  align-items: center;
  min-width: var(--spacing-0);
  gap: var(--spacing-2);
}

.app-shell__back-btn-content {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.app-shell__brand {
  color: var(--app-shell-brand-color);
  font-family: var(--app-shell-brand-font-family);
  font-size: var(--type-heading-03-font-size);
  line-height: var(--type-heading-03-line-height);
  font-weight: var(--type-heading-03-font-weight);
  text-transform: var(--type-heading-03-text-transform);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-shell__mobile-project-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.app-shell__mobile-horizontal-nav :deep(.nav-list) {
  padding: var(--spacing-0);
  --nav-list-items-gap: var(--spacing-2);
}

.app-shell__mobile-horizontal-nav :deep(.list-item) {
  white-space: nowrap;
  flex-shrink: 0;
  --list-item-padding: var(--spacing-2) var(--spacing-3);
  border: var(--app-shell-border-width) solid var(--app-shell-border-color);
}

.app-shell__mobile-horizontal-nav :deep(.list-item--active) {
  border-color: var(--border-brand);
}

.app-shell__mobile-threads {
  display: flex;
  flex-direction: column;
  border-top: var(--app-shell-border-width) solid var(--app-shell-border-color);
  padding-top: var(--spacing-3);
}

.app-shell__mobile-projects-body {
  display: flex;
  flex-direction: column;
}

.app-shell__mobile-projects-body :deep(.nav-list) {
  padding: var(--spacing-0);
}

.app-shell__mobile-projects-footer {
  display: flex;
  flex-direction: column;
  width: 100%;
}

@media (max-width: 767px) {
  .app-shell__sidebar,
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
