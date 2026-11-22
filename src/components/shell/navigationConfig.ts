import type { IconName } from '@/components/ui'

export type AppNavId = 'chat' | 'repertory' | 'members' | 'api-keys'

export interface AppNavItem {
  id: AppNavId
  label: string
  icon: IconName
  to: string
}

export interface ProjectItem {
  id: string
  name: string
  role: string
  icon: IconName
}

export interface UserProfile {
  username: string
  role: string
  email: string
  workspace: string
}

export const PRIMARY_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'chat',
    label: 'chatbot',
    icon: 'chat',
    to: '/chat',
  },
  {
    id: 'repertory',
    label: 'repertório',
    icon: 'documents',
    to: '/repertorio',
  },
  {
    id: 'members',
    label: 'membros',
    icon: 'members',
    to: '/membros',
  },
  {
    id: 'api-keys',
    label: 'chaves de api',
    icon: 'api-keys',
    to: '/api-keys',
  },
]

export const MEMBER_PROJECTS: ProjectItem[] = [
  {
    id: 'prismon-core',
    name: 'Prismon Core',
    role: 'Administradora',
    icon: 'folder',
  },
  {
    id: 'juridico-ia',
    name: 'Jurídico IA',
    role: 'Editora',
    icon: 'folder',
  },
  {
    id: 'produto-dados',
    name: 'Produto & Dados',
    role: 'Administradora',
    icon: 'folder',
  },
  {
    id: 'pesquisa-ux',
    name: 'Pesquisa UX',
    role: 'Visualizadora',
    icon: 'folder',
  },
]

export const DEFAULT_USER_PROFILE: UserProfile = {
  username: 'Ana Paula',
  role: 'Administradora',
  email: 'ana@prismon.ai',
  workspace: 'Prismon Core',
}
