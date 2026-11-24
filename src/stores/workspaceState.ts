import { computed, ref } from 'vue'
import { serializeWorkflowConfigPayload } from '@/api/mappers/workflowMapper'
import { useChatsApi, useProjectsApi } from '@/composables/api'
import { useAuthState } from '@/stores/authState'
import type { ChatMessageItem, ChatSummary, SendChatMessageResult } from '@/types/chats'
import type { CreateProjectInput, Project, UpdateProjectInput } from '@/types/projects'
import type { WorkflowConfigValues } from '@/types/workflows'
import type { IconName } from '@/components/ui'

export interface ProjectDetailsItem extends Project {
  icon: IconName
}

export interface ChatThread extends ChatSummary {
  messages: ChatMessageItem[]
  messagesLoaded: boolean
}

export interface SelectedWorkflow {
  id: number
  name: string
  version: string
  description?: string
  config?: WorkflowConfigValues
}

export interface SyncWorkspaceRouteParams {
  projectId?: number | null
  chatId?: number | null
}

const DEFAULT_PROJECT_STORAGE_KEY = 'prismon:default-project-id'

function readStoredDefaultProjectId(): number | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }
    const raw = window.localStorage.getItem(DEFAULT_PROJECT_STORAGE_KEY)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  } catch {
    return null
  }
}

function writeStoredDefaultProjectId(projectId: number | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    if (projectId === null) {
      window.localStorage.removeItem(DEFAULT_PROJECT_STORAGE_KEY)
      return
    }
    window.localStorage.setItem(DEFAULT_PROJECT_STORAGE_KEY, String(projectId))
  } catch {
    // Ignore storage quota or sandbox access errors
  }
}

function toProjectDetails(project: Project): ProjectDetailsItem {
  return {
    ...project,
    icon: 'folder',
  }
}

const projectsState = ref<ProjectDetailsItem[]>([])
const activeProjectIdState = ref<number | null>(null)
const defaultProjectIdState = ref<number | null>(readStoredDefaultProjectId())
const isLoadingProjectsState = ref(false)
const projectsLoadedState = ref(false)

const threadsState = ref<ChatThread[]>([])
const activeThreadIdState = ref<number | null>(null)
const threadSearchState = ref('')
const isLoadingChatsState = ref(false)
const isLoadingMessagesState = ref(false)
const pendingUserMessageState = ref<string | null>(null)
const streamingAssistantTextState = ref('')
const loadedChatProjects = new Set<number>()

const selectedWorkflowState = ref<SelectedWorkflow | null>(null)
const isNavCollapsedState = ref(false)
const isProjectsCollapsedState = ref(true)

let pendingProjectsLoad: Promise<ProjectDetailsItem[]> | null = null

export function useWorkspaceState() {
  const { isAuthenticated, currentUser } = useAuthState()
  const projectsApi = useProjectsApi()
  const chatsApi = useChatsApi()

  const projects = projectsState
  const activeProjectId = activeProjectIdState
  const defaultProjectId = defaultProjectIdState
  const isLoadingProjects = isLoadingProjectsState
  const projectsLoaded = projectsLoadedState
  const threads = threadsState
  const activeThreadId = activeThreadIdState
  const threadSearch = threadSearchState
  const isLoadingChats = isLoadingChatsState
  const isLoadingMessages = isLoadingMessagesState
  const pendingUserMessage = pendingUserMessageState
  const streamingAssistantText = streamingAssistantTextState
  const selectedWorkflow = selectedWorkflowState
  const isNavCollapsed = isNavCollapsedState
  const isProjectsCollapsed = isProjectsCollapsedState

  const activeProject = computed<ProjectDetailsItem | null>(() => {
    if (projects.value.length === 0) return null
    return (
      projects.value.find((project) => project.id === activeProjectId.value) ??
      projects.value[0] ??
      null
    )
  })

  const profile = computed(() => ({
    username: currentUser.value?.username ?? 'Convidado',
    email: currentUser.value?.email ?? '',
    workspace: activeProject.value?.name ?? 'Sem projeto',
  }))

  const projectThreads = computed(() => {
    const projectId = activeProject.value?.id
    if (!projectId) return []
    return threads.value.filter((thread) => thread.projectId === projectId)
  })

  const filteredThreads = computed(() => {
    const query = threadSearch.value.trim().toLowerCase()
    if (!query) {
      return projectThreads.value
    }
    return projectThreads.value.filter((thread) => thread.title.toLowerCase().includes(query))
  })

  const activeThread = computed(
    () => projectThreads.value.find((thread) => thread.id === activeThreadId.value) ?? null,
  )

  async function loadProjectChats(projectId: number, force = false): Promise<ChatThread[]> {
    if (!force && loadedChatProjects.has(projectId)) {
      return threads.value.filter((thread) => thread.projectId === projectId)
    }

    isLoadingChatsState.value = true
    try {
      const page = await chatsApi.listProjectChats(projectId, { limit: 100 })
      const existingById = new Map(
        threads.value
          .filter((thread) => thread.projectId === projectId)
          .map((thread) => [thread.id, thread]),
      )

      const mappedThreads: ChatThread[] = page.items.map((summary) => {
        const previous = existingById.get(summary.id)
        return {
          ...summary,
          messages: previous?.messages ?? [],
          messagesLoaded: previous?.messagesLoaded ?? false,
        }
      })

      const otherProjectThreads = threads.value.filter((thread) => thread.projectId !== projectId)
      threads.value = [...mappedThreads, ...otherProjectThreads]
      loadedChatProjects.add(projectId)
      return mappedThreads
    } finally {
      isLoadingChatsState.value = false
    }
  }

  async function loadProjects(
    force = false,
    preferredRouteProjectId?: number | null,
  ): Promise<ProjectDetailsItem[]> {
    if (!force && projectsLoadedState.value) {
      if (
        preferredRouteProjectId !== undefined &&
        preferredRouteProjectId !== null &&
        preferredRouteProjectId !== activeProjectId.value &&
        projects.value.some((project) => project.id === preferredRouteProjectId)
      ) {
        await selectProject(preferredRouteProjectId)
      }
      return projects.value
    }
    if (pendingProjectsLoad) {
      const loaded = await pendingProjectsLoad
      if (
        preferredRouteProjectId !== undefined &&
        preferredRouteProjectId !== null &&
        preferredRouteProjectId !== activeProjectId.value &&
        loaded.some((project) => project.id === preferredRouteProjectId)
      ) {
        await selectProject(preferredRouteProjectId)
      }
      return loaded
    }

    isLoadingProjectsState.value = true
    pendingProjectsLoad = (async () => {
      try {
        const page = await projectsApi.listProjects({ limit: 100 })
        const mapped = page.items.map(toProjectDetails)
        projects.value = mapped
        projectsLoadedState.value = true

        const hasRouteProject =
          preferredRouteProjectId !== undefined &&
          preferredRouteProjectId !== null &&
          mapped.some((p) => p.id === preferredRouteProjectId)

        const preferredId = hasRouteProject
          ? preferredRouteProjectId
          : activeProjectId.value && mapped.some((p) => p.id === activeProjectId.value)
            ? activeProjectId.value
            : defaultProjectId.value && mapped.some((p) => p.id === defaultProjectId.value)
              ? defaultProjectId.value
              : (mapped[0]?.id ?? null)

        activeProjectId.value = preferredId

        if (preferredId !== null) {
          await loadProjectChats(preferredId, force)
        }

        return mapped
      } finally {
        isLoadingProjectsState.value = false
        pendingProjectsLoad = null
      }
    })()

    return pendingProjectsLoad
  }

  async function ensureWorkspaceInitialized(
    preferredRouteProjectId?: number | null,
  ): Promise<void> {
    if (!isAuthenticated.value) {
      return
    }
    if (projectsLoadedState.value) {
      if (
        preferredRouteProjectId !== undefined &&
        preferredRouteProjectId !== null &&
        preferredRouteProjectId !== activeProjectId.value &&
        projects.value.some((project) => project.id === preferredRouteProjectId)
      ) {
        await selectProject(preferredRouteProjectId)
      }
      return
    }
    await loadProjects(false, preferredRouteProjectId)
  }

  async function selectProject(projectId: number): Promise<ProjectDetailsItem | null> {
    const found = projects.value.find((project) => project.id === projectId) ?? null
    if (!found) {
      return null
    }
    const isSameProject = activeProjectId.value === found.id
    activeProjectId.value = found.id
    if (!isSameProject) {
      activeThreadId.value = null
    }
    await loadProjectChats(found.id)
    return found
  }

  async function syncFromRoute(params: SyncWorkspaceRouteParams): Promise<void> {
    if (!isAuthenticated.value) {
      return
    }

    const { projectId, chatId } = params

    if (!projectsLoadedState.value) {
      await loadProjects(false, projectId)
    }

    let resolvedProjectId: number | null = activeProjectId.value

    if (projectId !== undefined && projectId !== null) {
      const matched = projects.value.find((project) => project.id === projectId) ?? null
      if (matched) {
        if (activeProjectId.value !== matched.id) {
          await selectProject(matched.id)
        } else {
          await loadProjectChats(matched.id)
        }
        resolvedProjectId = matched.id
      }
    } else if (resolvedProjectId !== null) {
      await loadProjectChats(resolvedProjectId)
    }

    if (chatId === null) {
      activeThreadId.value = null
      return
    }

    if (chatId !== undefined) {
      const matchingThread = threads.value.find(
        (thread) =>
          thread.id === chatId &&
          (resolvedProjectId === null || thread.projectId === resolvedProjectId),
      )
      if (matchingThread) {
        await selectThread(matchingThread.id)
      } else {
        activeThreadId.value = null
      }
    }
  }

  async function createProject(input: CreateProjectInput): Promise<ProjectDetailsItem> {
    const created = await projectsApi.createProject(input)
    const detailed = toProjectDetails(created)
    projects.value = [...projects.value, detailed]
    activeProjectId.value = detailed.id
    activeThreadId.value = null
    loadedChatProjects.add(detailed.id)
    return detailed
  }

  async function updateProject(
    projectId: number,
    input: UpdateProjectInput,
  ): Promise<ProjectDetailsItem> {
    const updated = await projectsApi.updateProject(projectId, input)
    const detailed = toProjectDetails(updated)
    projects.value = projects.value.map((item) => (item.id === projectId ? detailed : item))
    return detailed
  }

  async function deleteProject(projectId: number): Promise<void> {
    await projectsApi.deleteProject(projectId)
    projects.value = projects.value.filter((item) => item.id !== projectId)
    threads.value = threads.value.filter((thread) => thread.projectId !== projectId)
    loadedChatProjects.delete(projectId)

    if (defaultProjectId.value === projectId) {
      setDefaultProjectId(null)
    }

    if (activeProjectId.value === projectId) {
      const nextProject = projects.value[0] ?? null
      activeProjectId.value = nextProject?.id ?? null
      activeThreadId.value = null
      if (nextProject) {
        await loadProjectChats(nextProject.id)
      }
    }
  }

  async function refreshThreadMessages(chatId: number): Promise<ChatMessageItem[]> {
    isLoadingMessagesState.value = true
    try {
      const page = await chatsApi.listChatMessages(chatId, { limit: 100 })
      const ordered = [...page.items].sort((a, b) => {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return diff !== 0 ? diff : a.id - b.id
      })
      threads.value = threads.value.map((thread) =>
        thread.id === chatId ? { ...thread, messages: ordered, messagesLoaded: true } : thread,
      )
      return ordered
    } finally {
      isLoadingMessagesState.value = false
    }
  }

  async function selectThread(chatId: number): Promise<void> {
    const found = threads.value.find((thread) => thread.id === chatId) ?? null
    if (!found) {
      return
    }
    if (found.projectId !== activeProjectId.value) {
      activeProjectId.value = found.projectId
    }
    activeThreadId.value = found.id
    if (!found.messagesLoaded) {
      await refreshThreadMessages(found.id)
    }
  }

  function startNewChat(): void {
    activeThreadId.value = null
  }

  async function renameThread(chatId: number, nextTitle: string): Promise<ChatSummary | null> {
    const cleanTitle = nextTitle.trim()
    if (!cleanTitle) {
      return null
    }
    const updated = await chatsApi.updateChatTitle(chatId, cleanTitle)
    threads.value = threads.value.map((thread) =>
      thread.id === chatId
        ? {
            ...thread,
            title: updated.title,
            updatedAt: updated.updatedAt,
            updatedAtLabel: updated.updatedAtLabel,
          }
        : thread,
    )
    return updated
  }

  async function deleteThread(chatId: number): Promise<void> {
    await chatsApi.deleteChat(chatId)
    threads.value = threads.value.filter((thread) => thread.id !== chatId)
    if (activeThreadId.value === chatId) {
      activeThreadId.value = null
    }
  }

  async function sendChatMessage(params: {
    text: string
    apiKeyId: number
  }): Promise<SendChatMessageResult> {
    const projectId = activeProject.value?.id ?? null
    const existingChatId = activeThreadId.value
    const previousChatIds = new Set(projectThreads.value.map((thread) => thread.id))
    const serializedConfig = serializeWorkflowConfigPayload(selectedWorkflowState.value?.config)

    pendingUserMessageState.value = params.text
    streamingAssistantTextState.value = ''

    let streamedChatId: number | null = null

    try {
      const result = await chatsApi.sendMessage(
        {
          chatId: existingChatId,
          projectId,
          apiKeyId: params.apiKeyId,
          text: params.text,
          ...(serializedConfig ? { config: serializedConfig } : {}),
        },
        {
          onStreamUpdate: (partial) => {
            if (partial.chatId !== null) {
              streamedChatId = partial.chatId
            }
            if (partial.chat && !threads.value.some((thread) => thread.id === partial.chat!.id)) {
              threads.value = [
                {
                  ...partial.chat,
                  messages: [],
                  messagesLoaded: false,
                },
                ...threads.value,
              ]
              if (existingChatId === null) {
                activeThreadId.value = partial.chat.id
              }
            }

            const assistantMsg = [...partial.messages]
              .reverse()
              .find((message) => message.role === 'ai' && message.content.length > 0)
            if (assistantMsg) {
              streamingAssistantTextState.value = assistantMsg.content
            }
          },
        },
      )

      let resolvedChatId = result.chatId ?? streamedChatId ?? existingChatId

      if (projectId !== null) {
        const reloadedThreads = await loadProjectChats(projectId, true)
        if (resolvedChatId === null) {
          const newlyCreated =
            reloadedThreads.find((thread) => !previousChatIds.has(thread.id)) ??
            [...reloadedThreads].sort((a, b) => {
              const diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              return diff !== 0 ? diff : b.id - a.id
            })[0] ??
            null
          resolvedChatId = newlyCreated?.id ?? null
        }
      }

      if (resolvedChatId !== null) {
        activeThreadId.value = resolvedChatId
        const fetchedMessages = await refreshThreadMessages(resolvedChatId)
        if (fetchedMessages.length === 0 && result.messages.length > 0) {
          threads.value = threads.value.map((thread) =>
            thread.id === resolvedChatId
              ? { ...thread, messages: result.messages, messagesLoaded: true }
              : thread,
          )
        }
      }

      return result
    } catch (error) {
      if (existingChatId === null && streamedChatId !== null && projectId !== null) {
        try {
          await loadProjectChats(projectId, true)
          activeThreadId.value = streamedChatId
          await refreshThreadMessages(streamedChatId)
        } catch {
          // Preserve original send error if recovery refresh also fails
        }
      }
      throw error
    } finally {
      pendingUserMessageState.value = null
      streamingAssistantTextState.value = ''
    }
  }

  function setDefaultProjectId(projectId: number | null): void {
    defaultProjectIdState.value = projectId
    writeStoredDefaultProjectId(projectId)
  }

  function setSelectedWorkflow(workflow: SelectedWorkflow | null): void {
    selectedWorkflow.value = workflow
  }

  function resetWorkspace(): void {
    projectsState.value = []
    activeProjectIdState.value = null
    isLoadingProjectsState.value = false
    projectsLoadedState.value = false
    threadsState.value = []
    activeThreadIdState.value = null
    threadSearchState.value = ''
    isLoadingChatsState.value = false
    isLoadingMessagesState.value = false
    pendingUserMessageState.value = null
    streamingAssistantTextState.value = ''
    selectedWorkflowState.value = null
    isNavCollapsedState.value = false
    isProjectsCollapsedState.value = true
    loadedChatProjects.clear()
    pendingProjectsLoad = null
  }

  return {
    projects,
    activeProjectId,
    defaultProjectId,
    activeProject,
    profile,
    isLoadingProjects,
    projectsLoaded,
    threads,
    projectThreads,
    filteredThreads,
    activeThreadId,
    activeThread,
    threadSearch,
    isLoadingChats,
    isLoadingMessages,
    pendingUserMessage,
    streamingAssistantText,
    selectedWorkflow,
    isNavCollapsed,
    isProjectsCollapsed,
    loadProjects,
    ensureWorkspaceInitialized,
    selectProject,
    syncFromRoute,
    createProject,
    updateProject,
    deleteProject,
    loadProjectChats,
    selectThread,
    refreshThreadMessages,
    startNewChat,
    renameThread,
    deleteThread,
    sendChatMessage,
    setDefaultProjectId,
    setSelectedWorkflow,
    resetWorkspace,
  }
}

export function _resetWorkspaceForTesting(): void {
  projectsState.value = []
  activeProjectIdState.value = null
  defaultProjectIdState.value = null
  isLoadingProjectsState.value = false
  projectsLoadedState.value = false
  threadsState.value = []
  activeThreadIdState.value = null
  threadSearchState.value = ''
  isLoadingChatsState.value = false
  isLoadingMessagesState.value = false
  pendingUserMessageState.value = null
  streamingAssistantTextState.value = ''
  selectedWorkflowState.value = null
  isNavCollapsedState.value = false
  isProjectsCollapsedState.value = true
  loadedChatProjects.clear()
  pendingProjectsLoad = null
}
