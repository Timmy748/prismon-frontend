import { computed, ref } from 'vue'
import type { AiAttachmentItem, ChatMessageRole, WorkflowStep } from '@/components/ui'
import {
  DEFAULT_USER_PROFILE,
  MEMBER_PROJECTS,
  type ProjectItem,
  type UserProfile,
} from '@/components/shell/navigationConfig'
import type { WorkflowGraphNodeConfig } from '@/components/chat/WorkflowConfigModal.vue'

export interface ProjectDetailsItem extends ProjectItem {
  description: string
  createdAt: string
  owner: string
  membersCount: number
  documentsCount: number
  workflowsCount: number
}

export interface ChatWorkflowStep extends WorkflowStep {
  summary: string
}

export interface ChatThreadMessage {
  id: string
  role: ChatMessageRole
  content: string
  attachments?: AiAttachmentItem[]
  steps?: ChatWorkflowStep[]
}

export interface ChatThread {
  id: string
  projectId: string
  title: string
  group: 'today' | 'week'
  workflowId: string | null
  workflowName: string | null
  workflowEffort: string | null
  messages: ChatThreadMessage[]
}

export interface SelectedWorkflow {
  id: string
  name: string
  effort: string
  iterations?: string
  nodesConfig?: Record<string, WorkflowGraphNodeConfig>
}

const INITIAL_PROJECT_DETAILS: ProjectDetailsItem[] = [
  {
    ...MEMBER_PROJECTS[0]!,
    description:
      'Workspace principal de governança, análise documental, workflows multiagente e repositório central do ecossistema Prismon.',
    createdAt: '12 jan 2026',
    owner: 'Ana Paula Ribeiro',
    membersCount: 5,
    documentsCount: 12,
    workflowsCount: 5,
  },
  {
    ...MEMBER_PROJECTS[1]!,
    description:
      'Ambiente dedicado à triagem de contratos, cláusulas de SLA, riscos regulatórios e pareceres jurídicos assistidos por IA.',
    createdAt: '03 fev 2026',
    owner: 'Lucas Ferreira',
    membersCount: 4,
    documentsCount: 18,
    workflowsCount: 3,
  },
  {
    ...MEMBER_PROJECTS[2]!,
    description:
      'Projeto voltado para síntese executiva, métricas operacionais e consolidação de roadmaps de produto e dados.',
    createdAt: '19 fev 2026',
    owner: 'Ana Paula Ribeiro',
    membersCount: 6,
    documentsCount: 9,
    workflowsCount: 4,
  },
  {
    ...MEMBER_PROJECTS[3]!,
    description:
      'Base colaborativa para entrevistas com usuários, checklists de acessibilidade WCAG e relatórios qualitativos.',
    createdAt: '04 mar 2026',
    owner: 'Camila Andrade',
    membersCount: 3,
    documentsCount: 7,
    workflowsCount: 2,
  },
]

function buildInitialThreads(): ChatThread[] {
  return [
    {
      id: 'thread-1',
      projectId: 'prismon-core',
      title: 'revisão de contrato q4',
      group: 'today',
      workflowId: 'wf-analise-critica',
      workflowName: 'análise crítica',
      workflowEffort: 'Médio',
      messages: [
        {
          id: 'msg-1',
          role: 'human',
          content: 'Analise as cláusulas de rescisão e SLA do contrato anexo para o Q4.',
          attachments: [
            {
              id: 'att-init-1',
              filename: 'contrato-fornecedor-q4.pdf',
              fileSize: '248 KB',
            },
          ],
        },
        {
          id: 'msg-2',
          role: 'ai',
          steps: [
            {
              id: 'step-init-1',
              title: 'Analisando contexto',
              summary: 'Identificadas 3 cláusulas de SLA e prazo de aviso prévio de 30 dias.',
            },
            {
              id: 'step-init-2',
              title: 'Consultando repertório',
              summary: 'Comparado com a política padrão de compras corporativas v2.4.',
            },
            {
              id: 'step-init-3',
              title: 'Gerando resposta estruturada',
              summary: 'Recomendações priorizadas por impacto financeiro e operacional.',
            },
          ],
          content:
            'Foram encontrados dois pontos de atenção na seção 4.2: a multa por indisponibilidade está abaixo do mínimo institucional (2% vs. 5%) e não há previsão de transição assistida ao término da vigência.',
        },
      ],
    },
    {
      id: 'thread-2',
      projectId: 'prismon-core',
      title: 'arquitetura de autenticação',
      group: 'today',
      workflowId: 'wf-revisao-tecnica',
      workflowName: 'revisão técnica',
      workflowEffort: 'Alto',
      messages: [
        {
          id: 'msg-3',
          role: 'human',
          content: 'Quais cuidados devo adotar na rotação de tokens em múltiplas abas?',
        },
        {
          id: 'msg-4',
          role: 'ai',
          steps: [
            {
              id: 'step-auth-1',
              title: 'Analisando contexto',
              summary: 'Mapeado fluxo de concorrência entre abas e expiração de sessão.',
            },
            {
              id: 'step-auth-2',
              title: 'Consultando repertório',
              summary: 'Verificadas referências de segurança e boas práticas de sessão.',
            },
            {
              id: 'step-auth-3',
              title: 'Gerando resposta estruturada',
              summary: 'Checklist de mitigação consolidado.',
            },
          ],
          content:
            'Recomenda-se coordenar a renovação via lock compartilhado (Web Locks API ou BroadcastChannel) e manter janela de tolerância curta para evitar invalidação prematura em requisições paralelas.',
        },
      ],
    },
    {
      id: 'thread-3',
      projectId: 'prismon-core',
      title: 'sumário executivo diretoria',
      group: 'week',
      workflowId: 'wf-sintese-executiva',
      workflowName: 'síntese executiva',
      workflowEffort: 'Baixo',
      messages: [
        {
          id: 'msg-5',
          role: 'human',
          content: 'Resuma os principais marcos operacionais do último trimestre.',
        },
        {
          id: 'msg-6',
          role: 'ai',
          content:
            'O trimestre encerrou com redução de 18% no tempo médio de revisão documental, adoção de 4 workflows padronizados e ampliação do repertório compartilhado entre as equipes.',
        },
      ],
    },
    {
      id: 'thread-4',
      projectId: 'prismon-core',
      title: 'políticas de retenção de logs',
      group: 'week',
      workflowId: null,
      workflowName: null,
      workflowEffort: null,
      messages: [
        {
          id: 'msg-7',
          role: 'human',
          content: 'Qual o prazo padrão de retenção de trilhas de auditoria?',
        },
        {
          id: 'msg-8',
          role: 'ai',
          content:
            'De acordo com as diretrizes vigentes, eventos críticos de acesso e alteração documental devem permanecer retidos por no mínimo 24 meses em armazenamento auditável.',
        },
      ],
    },
    {
      id: 'thread-5',
      projectId: 'prismon-core',
      title: 'checklist wcag aa formulários',
      group: 'week',
      workflowId: null,
      workflowName: null,
      workflowEffort: null,
      messages: [
        {
          id: 'msg-9',
          role: 'human',
          content: 'Quais critérios de foco e teclado precisamos validar nos overlays?',
        },
        {
          id: 'msg-10',
          role: 'ai',
          content:
            'Todos os overlays devem responder à tecla Escape, expor atributos `aria-modal` e `aria-labelledby`, e garantir anel de foco visível nos controles interativos.',
        },
      ],
    },
    {
      id: 'thread-6',
      projectId: 'prismon-core',
      title: 'governança de tokens semânticos',
      group: 'week',
      workflowId: null,
      workflowName: null,
      workflowEffort: null,
      messages: [
        {
          id: 'msg-11',
          role: 'human',
          content: 'Liste as regras de nomenclatura entre tokens primitivos e semânticos.',
        },
        {
          id: 'msg-12',
          role: 'ai',
          content:
            'Componentes consomem exclusivamente variáveis locais mapeadas para tokens semânticos (`--surface-*`, `--text-*`, `--border-*`) sem cores hexadecimais diretas.',
        },
      ],
    },
    {
      id: 'thread-7',
      projectId: 'prismon-core',
      title: 'auditoria de chaves de api q1',
      group: 'week',
      workflowId: null,
      workflowName: null,
      workflowEffort: null,
      messages: [
        {
          id: 'msg-13',
          role: 'human',
          content: 'Quais chaves antigas devem ser rotacionadas neste ciclo?',
        },
        {
          id: 'msg-14',
          role: 'ai',
          content:
            'Recomenda-se rotacionar chaves de projeto com mais de 90 dias sem auditoria e separar credenciais de automação de chaves pessoais.',
        },
      ],
    },
    {
      id: 'thread-jur-1',
      projectId: 'juridico-ia',
      title: 'parecer nda fornecedores 2026',
      group: 'today',
      workflowId: 'wf-analise-critica',
      workflowName: 'análise crítica',
      workflowEffort: 'Alto',
      messages: [
        {
          id: 'msg-jur-1',
          role: 'human',
          content: 'Verifique a cláusula de confidencialidade mútua no modelo NDA 2026.',
        },
        {
          id: 'msg-jur-2',
          role: 'ai',
          content:
            'O prazo de sigilo de 5 anos está aderente, restando apenas ajustar a exceção para requisições regulatórias.',
        },
      ],
    },
    {
      id: 'thread-prod-1',
      projectId: 'produto-dados',
      title: 'métricas de adoção q4',
      group: 'today',
      workflowId: 'wf-sintese-executiva',
      workflowName: 'síntese executiva',
      workflowEffort: 'Médio',
      messages: [
        {
          id: 'msg-prod-1',
          role: 'human',
          content: 'Consolide os principais ganhos de produtividade dos fluxos automatizados.',
        },
        {
          id: 'msg-prod-2',
          role: 'ai',
          content:
            'Os pipelines com revisão em 3 estágios alcançaram 91% de aprovação direta com redução de retrabalho.',
        },
      ],
    },
    {
      id: 'thread-ux-1',
      projectId: 'pesquisa-ux',
      title: 'entrevistas fluxo mobile',
      group: 'today',
      workflowId: null,
      workflowName: null,
      workflowEffort: null,
      messages: [
        {
          id: 'msg-ux-1',
          role: 'human',
          content: 'Quais feedbacks surgiram sobre navegação por drawer em telas pequenas?',
        },
        {
          id: 'msg-ux-2',
          role: 'ai',
          content:
            'Participantes aprovaram a navegação horizontal compacta para seções do projeto e a troca rápida de projetos sem fechar a gaveta.',
        },
      ],
    },
  ]
}

const projectsState = ref<ProjectDetailsItem[]>(
  INITIAL_PROJECT_DETAILS.map((item) => ({ ...item })),
)
const activeProjectIdState = ref<string>(INITIAL_PROJECT_DETAILS[0]!.id)
const profileState = ref<UserProfile>({
  ...DEFAULT_USER_PROFILE,
  role: INITIAL_PROJECT_DETAILS[0]!.role,
  workspace: INITIAL_PROJECT_DETAILS[0]!.name,
})

const threadsState = ref<ChatThread[]>(buildInitialThreads())
const activeThreadIdState = ref<string | null>('thread-1')
const threadSearchState = ref('')
const selectedWorkflowState = ref<SelectedWorkflow | null>({
  id: 'wf-analise-critica',
  name: 'análise crítica',
  effort: 'Médio',
})

let idSequence = 200

export function nextWorkspaceId(prefix: string): string {
  idSequence += 1
  return `${prefix}-${idSequence}`
}

export function useWorkspaceState() {
  const projects = projectsState
  const activeProjectId = activeProjectIdState
  const profile = profileState
  const threads = threadsState
  const activeThreadId = activeThreadIdState
  const threadSearch = threadSearchState
  const selectedWorkflow = selectedWorkflowState

  const activeProject = computed<ProjectDetailsItem>(() => {
    return (
      projects.value.find((project) => project.id === activeProjectId.value) ??
      projects.value[0] ?? {
        ...INITIAL_PROJECT_DETAILS[0]!,
      }
    )
  })

  const projectThreads = computed(() =>
    threads.value.filter((thread) => thread.projectId === activeProject.value.id),
  )

  const filteredThreads = computed(() => {
    const query = threadSearch.value.trim().toLowerCase()
    if (!query) {
      return projectThreads.value
    }
    return projectThreads.value.filter((thread) => thread.title.toLowerCase().includes(query))
  })

  const todayThreads = computed(() =>
    filteredThreads.value.filter((thread) => thread.group === 'today'),
  )

  const weekThreads = computed(() =>
    filteredThreads.value.filter((thread) => thread.group === 'week'),
  )

  const activeThread = computed(
    () => projectThreads.value.find((thread) => thread.id === activeThreadId.value) ?? null,
  )

  function syncWorkflowFromThread(thread: ChatThread | null) {
    if (thread?.workflowId && thread.workflowName) {
      selectedWorkflow.value = {
        id: thread.workflowId,
        name: thread.workflowName,
        effort: thread.workflowEffort ?? 'Médio',
      }
      return
    }
    selectedWorkflow.value = null
  }

  function selectProject(projectId: string): ProjectDetailsItem | null {
    const found = projects.value.find((project) => project.id === projectId) ?? null
    if (!found) {
      return null
    }
    activeProjectId.value = found.id
    profile.value = {
      ...profile.value,
      role: found.role,
      workspace: found.name,
    }
    const nextThread = threads.value.find((thread) => thread.projectId === found.id) ?? null
    activeThreadId.value = nextThread?.id ?? null
    syncWorkflowFromThread(nextThread)
    return found
  }

  function createProject(payload: {
    name: string
    description?: string
    role?: string
  }): ProjectDetailsItem {
    const cleanName = payload.name.trim()
    const slugBase = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24)
    const id = slugBase ? `${slugBase}-${idSequence + 1}` : nextWorkspaceId('proj')
    idSequence += 1

    const newProject: ProjectDetailsItem = {
      id,
      name: cleanName,
      role: payload.role?.trim() || 'Administradora',
      icon: 'folder',
      description:
        payload.description?.trim() || 'Novo projeto configurado no ecossistema local Prismon.',
      createdAt: 'Agora',
      owner: profile.value.username,
      membersCount: 1,
      documentsCount: 0,
      workflowsCount: 5,
    }

    projects.value = [...projects.value, newProject]
    activeProjectId.value = newProject.id
    profile.value = {
      ...profile.value,
      role: newProject.role,
      workspace: newProject.name,
    }
    activeThreadId.value = null
    selectedWorkflow.value = null
    return newProject
  }

  function selectThread(threadId: string) {
    const found = threads.value.find((thread) => thread.id === threadId) ?? null
    if (!found) {
      return
    }
    if (found.projectId !== activeProjectId.value) {
      activeProjectId.value = found.projectId
    }
    activeThreadId.value = found.id
    syncWorkflowFromThread(found)
  }

  function startNewChat() {
    activeThreadId.value = null
    selectedWorkflow.value = null
  }

  function renameThread(threadId: string, nextTitle: string): boolean {
    const cleanTitle = nextTitle.trim().toLowerCase()
    if (!cleanTitle) {
      return false
    }
    threads.value = threads.value.map((thread) =>
      thread.id === threadId ? { ...thread, title: cleanTitle } : thread,
    )
    return true
  }

  function deleteThread(threadId: string) {
    threads.value = threads.value.filter((thread) => thread.id !== threadId)
    if (activeThreadId.value === threadId) {
      const nextThread =
        threads.value.find((thread) => thread.projectId === activeProject.value.id) ?? null
      activeThreadId.value = nextThread?.id ?? null
      syncWorkflowFromThread(nextThread)
    }
  }

  function ensureActiveThread(): ChatThread {
    if (activeThread.value) {
      return activeThread.value
    }
    const newThread: ChatThread = {
      id: nextWorkspaceId('thread'),
      projectId: activeProject.value.id,
      title: 'nova conversa',
      group: 'today',
      workflowId: selectedWorkflow.value?.id ?? null,
      workflowName: selectedWorkflow.value?.name ?? null,
      workflowEffort: selectedWorkflow.value?.effort ?? null,
      messages: [],
    }
    threads.value = [newThread, ...threads.value]
    activeThreadId.value = newThread.id
    return newThread
  }

  function updateProfile(payload: { username: string; email: string; workspace: string }) {
    const matchedProject = projects.value.find((project) => project.name === payload.workspace)
    if (matchedProject) {
      activeProjectId.value = matchedProject.id
    }
    profile.value = {
      ...profile.value,
      username: payload.username,
      email: payload.email,
      workspace: payload.workspace,
      role: matchedProject ? matchedProject.role : profile.value.role,
    }
  }

  return {
    projects,
    activeProjectId,
    activeProject,
    profile,
    threads,
    projectThreads,
    filteredThreads,
    todayThreads,
    weekThreads,
    activeThreadId,
    activeThread,
    threadSearch,
    selectedWorkflow,
    selectProject,
    createProject,
    selectThread,
    startNewChat,
    renameThread,
    deleteThread,
    ensureActiveThread,
    updateProfile,
  }
}

export function _resetWorkspaceForTesting() {
  idSequence = 200
  projectsState.value = INITIAL_PROJECT_DETAILS.map((item) => ({ ...item }))
  activeProjectIdState.value = INITIAL_PROJECT_DETAILS[0]!.id
  profileState.value = {
    ...DEFAULT_USER_PROFILE,
    role: INITIAL_PROJECT_DETAILS[0]!.role,
    workspace: INITIAL_PROJECT_DETAILS[0]!.name,
  }
  threadsState.value = buildInitialThreads()
  activeThreadIdState.value = 'thread-1'
  threadSearchState.value = ''
  selectedWorkflowState.value = {
    id: 'wf-analise-critica',
    name: 'análise crítica',
    effort: 'Médio',
  }
}
