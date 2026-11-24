<script setup lang="ts">
import { computed, onMounted, ref, useSlots, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getApiErrorMessage } from '@/api/errors'
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
import { useAuthState } from '@/stores/authState'
import { useWorkspaceState, type ProjectDetailsItem } from '@/stores/workspaceState'
import ChatThreadsPanel from './ChatThreadsPanel.vue'
import CreateProjectModal from './CreateProjectModal.vue'
import ProfileSettingsModal from './ProfileSettingsModal.vue'
import ProjectInfoModal from './ProjectInfoModal.vue'
import {
  PRIMARY_NAV_ITEMS,
  type AppNavItem,
  type AppNavRouteName,
  type ProjectItem,
} from './navigationConfig'

interface Props {
  title?: string
  showTopbar?: boolean
  activeNav?: string
  activeProjectId?: number
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

const { logout } = useAuthState()
const {
  projects,
  projectsLoaded,
  activeProjectId: storeActiveProjectId,
  activeProject,
  profile,
  isNavCollapsed,
  isProjectsCollapsed,
  ensureWorkspaceInitialized,
  selectProject: storeSelectProject,
  syncFromRoute,
  createProject: storeCreateProject,
  updateProject: storeUpdateProject,
  deleteProject: storeDeleteProject,
  startNewChat,
  resetWorkspace,
} = useWorkspaceState()

const isMobileNavOpen = ref(false)
const mobileDrawerView = ref<'project' | 'projects'>('project')
const isSettingsOpen = ref(false)
const isCreateProjectOpen = ref(false)
const isProjectInfoOpen = ref(false)
const infoTargetProjectId = ref<number | null>(null)
const isProjectMutating = ref(false)

const infoTargetProject = computed<ProjectDetailsItem | null>(() => {
  if (infoTargetProjectId.value === null) {
    return null
  }
  return projects.value.find((project) => project.id === infoTargetProjectId.value) ?? null
})

function parsePositiveRouteParam(raw: unknown): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null
  }
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function hasProjectScopedRoute(routeName: string): boolean {
  if (!router.hasRoute(routeName)) {
    return false
  }
  return router
    .getRoutes()
    .some((record) => record.name === routeName && record.path.includes(':projectId'))
}

function buildSectionLocation(
  routeName: AppNavRouteName | string,
  fallbackPath: string,
  projectId: number | null,
) {
  if (projectId !== null && hasProjectScopedRoute(routeName)) {
    return {
      name: routeName,
      params: { projectId: String(projectId) },
    }
  }
  return fallbackPath
}

function resolveProjectSwitchTarget(projectId: number) {
  const routeName = typeof route?.name === 'string' ? route.name : ''
  let targetRouteName = routeName

  if (routeName === 'chat-thread' || routeName === 'legacy-chat') {
    targetRouteName = 'chat'
  } else if (
    routeName === 'repertory-document-detail' ||
    routeName === 'repertory-asset-detail' ||
    routeName === 'legacy-repertory'
  ) {
    targetRouteName = 'repertory'
  } else if (routeName === 'legacy-members') {
    targetRouteName = 'members'
  } else if (routeName === 'legacy-api-keys') {
    targetRouteName = 'api-keys'
  }

  if (targetRouteName && hasProjectScopedRoute(targetRouteName)) {
    return {
      name: targetRouteName,
      params: { projectId: String(projectId) },
    }
  }
  return null
}

async function syncRouteWorkspace() {
  const routeProjectId = parsePositiveRouteParam(route?.params?.projectId)
  const routeChatId = parsePositiveRouteParam(route?.params?.chatId)
  await ensureWorkspaceInitialized(routeProjectId)
  if (routeProjectId !== null || routeChatId !== null) {
    await syncFromRoute({
      projectId: routeProjectId,
      chatId: route?.name === 'chat' ? null : (routeChatId ?? undefined),
    })
  }
}

watch(
  () => props.defaultCollapsed,
  (nextCollapsed) => {
    if (nextCollapsed !== undefined) {
      isNavCollapsed.value = nextCollapsed
    }
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    await syncRouteWorkspace()
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar os projetos.'))
  }
})

watch(
  () => [route?.name, route?.params?.projectId, route?.params?.chatId] as const,
  () => {
    if (!projectsLoaded.value) {
      return
    }
    void syncRouteWorkspace().catch((error) => {
      toast.error(getApiErrorMessage(error, 'Não foi possível sincronizar o projeto.'))
    })
  },
)

watch(
  () => props.activeProjectId,
  (nextId) => {
    if (nextId !== undefined) {
      void storeSelectProject(nextId).catch((error) => {
        toast.error(getApiErrorMessage(error, 'Não foi possível selecionar o projeto.'))
      })
    }
  },
  { immediate: true },
)

watch(isMobileNavOpen, (isOpen) => {
  if (isOpen) {
    mobileDrawerView.value = 'project'
  }
})

const currentActiveProject = computed<ProjectDetailsItem | null>(() => {
  if (props.activeProjectId !== undefined) {
    return (
      projects.value.find((project) => project.id === props.activeProjectId) ?? activeProject.value
    )
  }
  return activeProject.value
})

const activeProjectName = computed(() => currentActiveProject.value?.name ?? 'sem projeto')

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
  const routeName = typeof route?.name === 'string' ? route.name : ''
  if (routeName) {
    if (
      item.id === 'chat' &&
      (routeName === 'chat' || routeName === 'chat-thread' || routeName === 'legacy-chat')
    ) {
      return true
    }
    if (
      item.id === 'repertory' &&
      (routeName === 'repertory' ||
        routeName.startsWith('repertory-') ||
        routeName === 'legacy-repertory')
    ) {
      return true
    }
    if (item.id === 'members' && (routeName === 'members' || routeName === 'legacy-members')) {
      return true
    }
    if (item.id === 'api-keys' && (routeName === 'api-keys' || routeName === 'legacy-api-keys')) {
      return true
    }
  }
  const currentPath = route?.path ?? ''
  if (!currentPath) {
    return false
  }
  return currentPath === item.to || currentPath.startsWith(`${item.to}/`)
}

async function selectProject(project: ProjectDetailsItem) {
  try {
    await storeSelectProject(project.id)
    emit('project-change', project)
    if (mobileDrawerView.value === 'projects') {
      mobileDrawerView.value = 'project'
    }
    const nextLocation = resolveProjectSwitchTarget(project.id)
    if (nextLocation) {
      const resolved = router.resolve(nextLocation)
      if (route?.fullPath !== resolved.fullPath) {
        await router.push(nextLocation)
      }
    }
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o projeto.'))
  }
}

async function handleNavClick(item: AppNavItem) {
  isMobileNavOpen.value = false
  if (item.id === 'chat') {
    startNewChat()
  }
  const projectId = currentActiveProject.value?.id ?? storeActiveProjectId.value ?? null
  const target = buildSectionLocation(item.routeName, item.to, projectId)
  const resolvedTarget = router.resolve(target)
  if (route?.fullPath !== resolvedTarget.fullPath) {
    await router.push(target)
  }
}

function getNavHref(item: AppNavItem): string {
  const projectId = currentActiveProject.value?.id ?? storeActiveProjectId.value ?? null
  const target = buildSectionLocation(item.routeName, item.to, projectId)
  if (typeof target === 'string') {
    return target
  }
  try {
    return router.resolve(target).href
  } catch {
    return item.to
  }
}

function getProjectHref(projectId: number): string | undefined {
  const target =
    resolveProjectSwitchTarget(projectId) ?? buildSectionLocation('chat', '/chat', projectId)
  if (typeof target === 'string') {
    return router.hasRoute('chat') || router.hasRoute('legacy-chat') ? target : undefined
  }
  try {
    return router.resolve(target).href
  } catch {
    return undefined
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

function openProjectInfo(project: ProjectDetailsItem | null) {
  if (!project) {
    return
  }
  infoTargetProjectId.value = project.id
  isMobileNavOpen.value = false
  isProjectInfoOpen.value = true
}

async function handleCreateProject(payload: { name: string }) {
  isProjectMutating.value = true
  try {
    const created = await storeCreateProject(payload)
    isCreateProjectOpen.value = false
    emit('project-change', created)
    const nextLocation = resolveProjectSwitchTarget(created.id)
    if (nextLocation) {
      await router.push(nextLocation)
    }
    toast.success(`Projeto "${created.name}" criado e selecionado.`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível criar o projeto.'))
  } finally {
    isProjectMutating.value = false
  }
}

async function handleRenameProject(projectId: number, name: string) {
  isProjectMutating.value = true
  try {
    const updated = await storeUpdateProject(projectId, { name })
    toast.success(`Projeto renomeado para "${updated.name}".`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível renomear o projeto.'))
  } finally {
    isProjectMutating.value = false
  }
}

async function handleDeleteProject(projectId: number) {
  isProjectMutating.value = true
  try {
    await storeDeleteProject(projectId)
    isProjectInfoOpen.value = false
    infoTargetProjectId.value = null
    if (storeActiveProjectId.value !== null) {
      const nextLocation = resolveProjectSwitchTarget(storeActiveProjectId.value)
      if (nextLocation) {
        const resolved = router.resolve(nextLocation)
        if (route?.fullPath !== resolved.fullPath) {
          await router.push(nextLocation)
        }
      }
    }
    toast.info('Projeto excluído.')
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível excluir o projeto.'))
  } finally {
    isProjectMutating.value = false
  }
}

async function handleLogout() {
  isMobileNavOpen.value = false
  isSettingsOpen.value = false
  try {
    await logout()
    toast.info('Sessão encerrada.')
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Erro ao encerrar a sessão.'))
  } finally {
    resetWorkspace()
    emit('logout')
    if (route?.path !== '/login' && router.hasRoute('login')) {
      await router.push('/login')
    }
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
            :href="getProjectHref(project.id)"
            :collapsed="isProjectsCollapsed"
            :active="project.id === currentActiveProject?.id"
            @click="selectProject(project)"
          >
            <template v-if="!isProjectsCollapsed" #trailing>
              <IconButton
                variant="ghost"
                size="sm"
                icon="info"
                :ariaLabel="`Informações do projeto ${project.name}`"
                @click.stop="openProjectInfo(project)"
              />
            </template>
          </ListItem>
        </NavList>
        <p v-if="projects.length === 0 && !isProjectsCollapsed" class="app-shell__empty-projects">
          sem projeto
        </p>

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
              v-if="currentActiveProject"
              variant="ghost"
              size="md"
              icon="info"
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
        :title="activeProjectName"
        toggle-label="Alternar menu do projeto"
      >
        <div class="app-shell__nav-groups">
          <div v-if="!currentActiveProject && !isNavCollapsed" class="app-shell__no-project">
            <p class="app-shell__no-project-text">sem projeto</p>
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

          <NavList :title="isNavCollapsed ? undefined : 'navegação'" class="app-shell__primary-nav">
            <ListItem
              v-for="item in PRIMARY_NAV_ITEMS"
              :key="item.id"
              :label="item.label"
              :icon="item.icon"
              :href="getNavHref(item)"
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
            :role="profile.email || profile.workspace"
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
        <span class="app-shell__mobile-title">{{ title || activeProjectName }}</span>
        <div class="app-shell__mobile-actions">
          <IconButton
            v-if="currentActiveProject"
            variant="ghost"
            size="md"
            icon="info"
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
            <span class="app-shell__brand">{{ activeProjectName }}</span>
            <IconButton
              v-if="currentActiveProject"
              variant="ghost"
              size="sm"
              icon="info"
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
        <div v-if="!currentActiveProject" class="app-shell__no-project">
          <p class="app-shell__no-project-text">sem projeto</p>
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

        <div class="app-shell__mobile-horizontal-nav" data-drawer-no-drag>
          <NavList title="navegação" orientation="horizontal">
            <ListItem
              v-for="item in PRIMARY_NAV_ITEMS"
              :key="item.id"
              :label="item.label"
              :icon="item.icon"
              :href="getNavHref(item)"
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
            :href="getProjectHref(project.id)"
            :active="project.id === currentActiveProject?.id"
            @click="selectProject(project)"
          >
            <template #trailing>
              <IconButton
                variant="ghost"
                size="sm"
                icon="info"
                :ariaLabel="`Informações do projeto ${project.name}`"
                @click.stop="openProjectInfo(project)"
              />
            </template>
          </ListItem>
        </NavList>
        <p v-if="projects.length === 0" class="app-shell__empty-projects">sem projeto</p>
      </div>

      <template #footer>
        <ProfileCard
          v-if="mobileDrawerView === 'project'"
          :username="profile.username"
          :role="profile.email || profile.workspace"
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
      :workspace="profile.workspace"
      @logout="handleLogout"
    />

    <CreateProjectModal
      v-model:open="isCreateProjectOpen"
      :submitting="isProjectMutating"
      @create="handleCreateProject"
    />

    <ProjectInfoModal
      v-model:open="isProjectInfoOpen"
      :project="infoTargetProject"
      :is-active-project="infoTargetProject?.id === storeActiveProjectId"
      :submitting="isProjectMutating"
      @select="selectProject"
      @rename="handleRenameProject"
      @delete="handleDeleteProject"
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

.app-shell__empty-projects {
  margin: var(--spacing-0);
  padding: var(--spacing-2) var(--spacing-3);
  color: var(--text-helper);
  font-family: var(--type-body-compact-01-font-family);
  font-size: var(--type-body-compact-01-font-size);
  line-height: var(--type-body-compact-01-line-height);
}

.app-shell__no-project {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin: var(--spacing-0) var(--spacing-3);
  padding: var(--spacing-3);
  background-color: var(--surface-base);
  border: var(--app-shell-border-width) solid var(--app-shell-border-color);
}

.app-shell__no-project-text {
  margin: var(--spacing-0);
  color: var(--text-helper);
  font-family: var(--type-body-compact-01-font-family);
  font-size: var(--type-body-compact-01-font-size);
  line-height: var(--type-body-compact-01-line-height);
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

.app-shell__sidebar :deep(.list-item--active),
.app-shell__mobile-project-body :deep(.list-item--active),
.app-shell__mobile-projects-body :deep(.list-item--active) {
  --list-item-bg: var(--surface-elevated-hover);
  --list-item-bg-hover: var(--surface-elevated-hover);
  color: var(--text-primary);
}

.app-shell__mobile-horizontal-nav :deep(.list-item--active) {
  border-color: var(--border-strong);
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
